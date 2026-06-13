interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-blue-500 text-white'
            : 'rounded-bl-md bg-slate-700 text-slate-100'
        }`}
      >
        {content}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[1px] animate-pulse bg-current align-middle opacity-75" />
        )}
      </div>
    </div>
  )
}
