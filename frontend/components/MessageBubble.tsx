interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  imageUrl?: string
}

export default function MessageBubble({ role, content, isStreaming, imageUrl }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-blue-500 text-white'
            : 'rounded-bl-md bg-slate-700 text-slate-100'
        }`}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="첨부 이미지"
            className="mb-2 max-h-48 max-w-full rounded-lg object-contain"
          />
        )}
        {content && (
          <span className="whitespace-pre-wrap">{content}</span>
        )}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[1px] animate-pulse bg-current align-middle opacity-75" />
        )}
      </div>
    </div>
  )
}
