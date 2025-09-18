
// NEW: simple helper for AI chat
export interface ChatMessageResponse {
  reply: string;
  sessionId?: string;
  [key: string]: any;
}

export async function sendChat(
  message: string,
  token?: string,
  opts: { sessionId?: string; personality?: string; context?: any } = {}
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const isBrowser = typeof window !== 'undefined';
  const useRelative = isBrowser && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === window.location.origin);
  const url = useRelative ? '/api/ai/chat' : `${baseUrl}/api/ai/chat`;

  const finalToken = token ?? (isBrowser ? (await (await import('@clerk/nextjs')).getToken().catch(()=>null)) : null);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-dev-auth': 'true',
      // Rely on Clerk cookies for auth; omit Authorization header to prevent mismatched tokens
    },
    body: JSON.stringify({ message, ...opts }),
    // Allow cookies for same-origin; harmless otherwise
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'AI chat failed');
  }

  const data = await res.json();
  // Normalize backend response to a consistent shape
  const d = data?.data || {};
  const normalized: ChatMessageResponse = {
    reply: d?.message?.content ?? d?.reply ?? '',
    sessionId: d?.session?.id ?? d?.sessionId,
    ...d,
  };
  return normalized;
}
