import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import KarateScripts from './components/KarateScripts'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700']
})

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
      <body className={inter.className}>
        <KarateScripts />
        {children}
      </body>
    </html>
  )
}