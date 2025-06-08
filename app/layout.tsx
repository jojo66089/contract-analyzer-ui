import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Guillen's Contract Analyzer",
  description: "Analyze legal contracts with a legally trained AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
            <footer className="py-4 text-center text-sm text-muted-foreground">
               Contract Analyzer Joshua Guillen &copy; {new Date().getFullYear()}
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
