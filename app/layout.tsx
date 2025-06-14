import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobFit.AI - Intelligent Resume Screening Platform',
  description: 'AI-powered resume screening and candidate matching platform using advanced LangChain, RAG, and Gemini AI technologies.',
  keywords: 'resume screening, AI recruitment, candidate matching, job fit analysis, HR technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
