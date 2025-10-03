
// NEW: simple helper for AI chat
export interface ChatMessageResponse {
  reply: string;
  sessionId?: string;
  [key: string]: any;
}

export async function sendChat(
  message: string,
  token?: string,
  opts: { sessionId?: string; personality?: string; context?: any; stream?: boolean; onChunk?: (c:string)=>void; assistant?: boolean } = {}
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const isBrowser = typeof window !== 'undefined';
  const useRelative = isBrowser && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === window.location.origin);
  const path = opts.assistant ? '/api/assistant/chat' : '/api/ai/chat-public';
  const url = useRelative ? path : `${baseUrl}${path}`;

  // Remove Clerk token verification for AI assistant
  const finalToken = token;

  const payload = { message, ...opts };

  const res = await fetch(`${url}?stream=${opts.stream ? 1 : 0}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-dev-auth': 'true',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (opts.stream) {
    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(err || 'AI stream failed');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let aggregated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const token = line.slice(5);
        aggregated += token;
        opts.onChunk && opts.onChunk(token);
      }
    }

    return { reply: aggregated } as ChatMessageResponse;
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'AI chat failed');
  }

  const data = await res.json();
  const d = data?.data || {};
  return {
    reply: d?.message?.content ?? d?.reply ?? '',
    sessionId: d?.session?.id ?? d?.sessionId,
    ...d,
  };
}
