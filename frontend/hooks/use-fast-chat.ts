import { useState, useRef, useCallback } from 'react';

export interface FastChatItem {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
}

export function useFastChat() {
  const [messages, setMessages] = useState<FastChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const isBrowser = typeof window !== 'undefined';
  const useRelative = isBrowser && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === window.location.origin);
  const apiUrl = useRelative ? '/api/floating-chat' : `${baseUrl}/api/floating-chat`;

  // Initialize session from localStorage if available
  if (isBrowser && !sessionIdRef.current) {
    const stored = localStorage.getItem('fastChatSessionId');
    if (stored) {
      sessionIdRef.current = stored;
    }
  }

  // Create session if needed
  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;

    try {
      const res = await fetch(`${apiUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        sessionIdRef.current = data.data.sessionId;
        // Persist to localStorage
        if (isBrowser) {
          localStorage.setItem('fastChatSessionId', sessionIdRef.current);
        }
        return sessionIdRef.current;
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    }

    // Fallback: generate a client-side session ID
    sessionIdRef.current = `fast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (isBrowser) {
      localStorage.setItem('fastChatSessionId', sessionIdRef.current);
    }
    return sessionIdRef.current;
  }, [apiUrl]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: FastChatItem = {
      id: `u-${Date.now()}`,
      content: text,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    const assistantId = `a-${Date.now()}`;
    const assistantMsg: FastChatItem = {
      id: assistantId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      // Ensure we have a session
      const sessionId = await ensureSession();

      // Send message with streaming
      const res = await fetch(`${apiUrl}/message?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: sessionId,
        }),
        credentials: 'include',
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to send message');
      }

      // Handle streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = line.slice(6); // Remove 'data: ' prefix
            const parsed = JSON.parse(data);

            if (parsed.done) {
              // Streaming complete
              break;
            }

            if (parsed.content) {
              fullContent += parsed.content;
              // Update assistant message with accumulated content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent } : m,
                ),
              );
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Skip invalid JSON or continue
            if (e instanceof Error && !e.message.includes('JSON')) {
              throw e;
            }
          }
        }
      }

      // Final update with complete content
      if (fullContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m,
          ),
        );
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send message');
      // Remove the assistant message if there was an error
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setLoading(false);
    }
  }, [loading, apiUrl, ensureSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionIdRef.current = null;
    if (isBrowser) {
      localStorage.removeItem('fastChatSessionId');
    }
  }, []);

  return {
    messages,
    sendMessage,
    loading,
    error,
    clearMessages,
  };
}

