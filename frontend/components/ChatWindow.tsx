'use client'

import { useEffect, useRef, useState } from 'react'
import { SendHorizontal } from 'lucide-react'
import { type Character, streamChat } from '@/lib/api'
import { getOrCreateSessionId } from '@/lib/session'
import MessageBubble from '@/components/MessageBubble'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const ERROR_MESSAGE = '응답 중 오류가 발생했습니다. 다시 시도해 주세요.'

export default function ChatWindow({ character }: { character: Character }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    resizeTextarea()
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || !sessionIdRef.current) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsStreaming(true)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    const aiId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: aiId, role: 'assistant', content: '', isStreaming: true },
    ])

    await streamChat(
      sessionIdRef.current,
      character.id,
      text,
      {
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: m.content + token } : m))
          )
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m))
          )
          setIsStreaming(false)
        },
        onError: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: ERROR_MESSAGE, isStreaming: false } : m
            )
          )
          setIsStreaming(false)
        },
      }
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-900">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-base font-bold text-blue-400">
          {character.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-50">{character.name}</p>
          <p className="truncate text-xs text-slate-400">{character.description}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <p className="py-16 text-center text-sm text-slate-500">
              {character.name}에게 첫 메시지를 보내보세요
            </p>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              isStreaming={message.isStreaming}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-700 bg-slate-800 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요… (Shift+Enter로 줄바꿈)"
            rows={1}
            disabled={isStreaming}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            aria-label="전송"
            className="flex h-11 min-h-[44px] w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
