import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    template: "%s | GymFlow",
    default: "GymFlow - Gym Management System",
  },
  description: "Modern gym management application for small to medium-sized gyms",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink selection:bg-primary/20">
        {children}
      </body>
    </html>
  )
}
