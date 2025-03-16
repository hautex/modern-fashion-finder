import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Fashion Finder - Trouvez des vêtements par image',
  description: 'Téléchargez une photo de vêtement et trouvez des produits similaires disponibles à l\'achat'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}