import type { Metadata } from "next"
import "@gravity-ui/uikit/styles/fonts.css"
import "@gravity-ui/uikit/styles/styles.css"
import "../index.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Meridian",
  description: "Fair Lending Compliance & Risk Management Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
      <body className="h-full overflow-hidden antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="theme">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
