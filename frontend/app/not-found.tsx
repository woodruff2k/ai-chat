import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <p className="mb-2 text-6xl font-bold text-slate-700">404</p>
        <p className="mb-6 text-slate-400">페이지를 찾을 수 없습니다.</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  )
}
