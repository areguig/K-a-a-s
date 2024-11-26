import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import KarateScripts from './components/KarateScripts'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Karate as a Service',
  description: 'Run your Karate tests in the cloud',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <KarateScripts />
        {children}
      </body>
    </html>
  )
}