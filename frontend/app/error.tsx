'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <p className="mb-2 text-4xl font-bold text-slate-700">오류 발생</p>
        <p className="mb-6 text-slate-400">예기치 않은 오류가 발생했습니다.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  )
}
