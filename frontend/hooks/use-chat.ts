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

  const sendMessage = async (text: string) => {
    const userMsg: ChatItem = { id: `u-${Date.now()}`, content: text, role: 'user' };
    addMessage(userMsg);
    setLoading(true);
    try {
      const token = await getToken?.();
      const res = await sendChat(text, token);
      addMessage({ id: `a-${Date.now()}`, content: res.reply, role: 'assistant' });
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading, error };
}


