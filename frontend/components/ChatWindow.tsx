'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Paperclip, SendHorizontal, X } from 'lucide-react'
import { type Character, type ImagePayload, streamChat } from '@/lib/api'
import { getOrCreateSessionId } from '@/lib/session'
import MessageBubble from '@/components/MessageBubble'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  imageUrl?: string
}

interface AttachedImage {
  data: string
  mediaType: ImagePayload['media_type']
  dataUrl: string
}

const ALLOWED_MEDIA_TYPES: ImagePayload['media_type'][] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ERROR_MESSAGE = '응답 중 오류가 발생했습니다. 다시 시도해 주세요.'
const RATE_LIMIT_MESSAGE = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'

export default function ChatWindow({ character }: { character: Character }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [headerImgError, setHeaderImgError] = useState(false)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

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

  function handleFileButtonClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_MEDIA_TYPES.includes(file.type as ImagePayload['media_type'])) {
      setImageError('JPEG, PNG, GIF, WebP 형식의 이미지만 첨부할 수 있습니다.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('5MB 이하의 이미지만 첨부할 수 있습니다.')
      return
    }

    setImageError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setAttachedImage({
        data: base64,
        mediaType: file.type as ImagePayload['media_type'],
        dataUrl,
      })
    }
    reader.readAsDataURL(file)
  }

  function removeAttachedImage() {
    setAttachedImage(null)
    setImageError(null)
  }

  async function handleSend() {
    const text = input.trim()
    if ((!text && !attachedImage) || isStreaming || !sessionIdRef.current) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsStreaming(true)

    const imageForRequest = attachedImage
      ? { data: attachedImage.data, media_type: attachedImage.mediaType }
      : undefined
    const imageUrlForDisplay = attachedImage?.dataUrl

    setAttachedImage(null)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      imageUrl: imageUrlForDisplay,
    }
    const aiId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: aiId, role: 'assistant', content: '', isStreaming: true },
    ])

    const controller = new AbortController()
    abortControllerRef.current = controller

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
        onError: (code) => {
          const content = code === 'rate_limit' ? RATE_LIMIT_MESSAGE : ERROR_MESSAGE
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content, isStreaming: false } : m
            )
          )
          setIsStreaming(false)
        },
      },
      controller.signal,
      imageForRequest,
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-900">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-700 bg-slate-800 px-4 py-3">
        <Link
          href="/"
          aria-label="캐릭터 선택으로 돌아가기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        {headerImgError || !character.avatar_url ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-base font-bold text-blue-400">
            {character.name.charAt(0)}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={character.avatar_url}
            alt={character.name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            onError={() => setHeaderImgError(true)}
          />
        )}
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
              imageUrl={message.imageUrl}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-700 bg-slate-800 px-4 py-3">
        <div className="mx-auto max-w-2xl">
          {/* Image preview */}
          {attachedImage && (
            <div className="mb-2 flex items-start gap-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachedImage.dataUrl}
                  alt="첨부 이미지 미리보기"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <button
                  onClick={removeAttachedImage}
                  aria-label="이미지 첨부 취소"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-slate-200 hover:bg-slate-500"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {imageError && (
            <p className="mb-1.5 text-xs text-red-400">{imageError}</p>
          )}

          <div className="flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Paperclip button */}
            <button
              onClick={handleFileButtonClick}
              disabled={isStreaming}
              aria-label="이미지 첨부"
              className="flex h-11 min-h-[44px] w-11 shrink-0 items-center justify-center rounded-xl border border-slate-600 bg-slate-700 text-slate-400 transition-colors hover:bg-slate-600 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요… (Shift+Enter로 줄바꿈)"
              rows={1}
              disabled={isStreaming}
              maxLength={2000}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedImage) || isStreaming}
              aria-label="전송"
              className="flex h-11 min-h-[44px] w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
