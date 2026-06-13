import Link from 'next/link'
import { type Character } from '@/lib/api'

export default function CharacterCard({ character }: { character: Character }) {
  return (
    <Link href={`/chat/${character.id}`} className="group block">
      <div className="h-full rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-blue-400">
          {character.name.charAt(0)}
        </div>

        <h3 className="mb-1.5 text-base font-semibold text-slate-50">{character.name}</h3>

        <p className="mb-4 text-sm leading-relaxed text-slate-400">{character.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {character.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
