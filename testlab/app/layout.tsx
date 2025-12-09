import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TestLab - SAT Practice Tests',
  description: 'Take timed SAT practice tests and review your answers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

