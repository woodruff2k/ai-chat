import { notFound } from 'next/navigation'
import { getCharacters } from '@/lib/api'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ characterId: string }>
}) {
  const { characterId } = await params

  let characters: Awaited<ReturnType<typeof getCharacters>> = []
  try {
    characters = await getCharacters()
  } catch {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-slate-300">서버에 연결할 수 없습니다.</p>
          <p className="mt-1 text-sm text-slate-500">잠시 후 다시 시도해 주세요.</p>
        </div>
      </div>
    )
  }

  const character = characters.find((c) => c.id === characterId)
  if (!character) notFound()

  return <ChatWindow character={character} />
}
