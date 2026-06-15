export interface Character {
  id: string
  name: string
  description: string
  avatar_url: string
  tags: string[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function getCharacters(): Promise<Character[]> {
  const res = await fetch(`${API_URL}/characters`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch characters')
  return res.json()
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (code: string) => void
}

export async function streamChat(
  sessionId: string,
  characterId: string,
  message: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, character_id: characterId, message }),
      signal,
    })
  } catch {
    callbacks.onError('network_error')
    return
  }

  if (res.status === 429) {
    callbacks.onError('rate_limit')
    return
  }

  if (!res.ok || !res.body) {
    callbacks.onError('network_error')
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6)) as {
            type: string
            content?: string
            code?: string
          }
          if (data.type === 'token' && data.content !== undefined) {
            callbacks.onToken(data.content)
          } else if (data.type === 'done') {
            callbacks.onDone()
          } else if (data.type === 'error') {
            callbacks.onError(data.code ?? 'unknown_error')
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      callbacks.onError('network_error')
    }
  } finally {
    reader.releaseLock()
  }
}
