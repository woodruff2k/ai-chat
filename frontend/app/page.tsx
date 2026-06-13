import CharacterCard from '@/components/CharacterCard'
import { getCharacters } from '@/lib/api'

export default async function Home() {
  let characters: Awaited<ReturnType<typeof getCharacters>> = []
  let hasError = false

  try {
    characters = await getCharacters()
  } catch {
    hasError = true
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-slate-50">AI 캐릭터 채팅</h1>
          <p className="text-slate-400">대화하고 싶은 캐릭터를 선택하세요</p>
        </div>

        {hasError ? (
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-10 text-center">
            <p className="text-slate-300">캐릭터 목록을 불러오는데 실패했습니다.</p>
            <p className="mt-1 text-sm text-slate-500">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
