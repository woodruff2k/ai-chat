import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const isDev = process.env.NODE_ENV !== 'production'

const cspValue = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",   // Next.js 인라인 부트스트랩 스크립트 허용
  "style-src 'self' 'unsafe-inline'",    // Tailwind 인라인 스타일 허용
  `connect-src 'self' ${apiUrl}${isDev ? ' ws://localhost:3000' : ''}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy',  value: cspValue },
]

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
