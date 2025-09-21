export interface ChatItem {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

import { useState } from 'react';
import { sendChat } from '@/lib/ai-client';
import { useAuth } from '@/contexts/auth-context';

export function useChat() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = (msg: ChatItem) => setMessages((prev) => [...prev, msg]);

  const sendMessage = async (text: string, useAssistant = true) => {
    const userMsg: ChatItem = { id: `u-${Date.now()}`, content: text, role: 'user' };
    addMessage(userMsg);

    const assistantId = `a-${Date.now()}`;
    addMessage({ id: assistantId, content: '', role: 'assistant' });

    setLoading(true);
    try {
      const rawTok = await getToken?.();
      const token = rawTok || undefined;

      await sendChat(text, token, {
        stream: true,
        onChunk: (chunk) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          ),
        assistant: useAssistant,
      });
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading, error };
}


