
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
  
  // Always use public conversation endpoints
  const path = '/api/conversations/public';
  const url = useRelative ? path : `${baseUrl}${path}`;

  // For new conversations, create one first
  let conversationId = opts.sessionId;
  if (!conversationId) {
    const createRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-auth': 'true',
      },
      body: JSON.stringify({
        title: 'AI Chat',
        personality: opts.personality || 'ARIA'
      }),
      credentials: 'include',
    });
    
    if (createRes.ok) {
      const createData = await createRes.json();
      conversationId = createData.data.conversation.id;
    }
  }

  // Add message to conversation
  const messageUrl = `${url}/${conversationId}/messages`;
  const res = await fetch(`${messageUrl}?stream=${opts.stream ? 1 : 0}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-dev-auth': 'true',
    },
    body: JSON.stringify({
      content: message,
      role: 'user',
      metadata: opts.context || {}
    }),
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
