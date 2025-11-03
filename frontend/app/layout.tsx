import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { clerkTheme } from "@/lib/clerk-theme"
import { ThemeProvider } from "@/components/theme-provider"
import { TranslationProvider } from "@/contexts/translation-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ReduxProvider } from "@/components/providers/redux-provider"
import SnowDots from "@/components/effects/snow-dots"
import { StreamVideoProvider } from "@/app/providers/StreamVideoProvider";
const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Corp1o1 - L'Ère des Compétences",
  description:
    "Révolutionnez la reconnaissance des talents avec notre IA avancée. Fini les diplômes poussiéreux, place à l'évaluation réelle des compétences.",
  keywords: "compétences, IA, évaluation, talents, certification, blockchain, portfolio",
  authors: [{ name: "Corp1o1 Team" }],
  creator: "Corp1o1",
  publisher: "Corp1o1",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://corp1o1.com"),
  openGraph: {
    title: "Corp1o1 - L'Ère des Compétences",
    description: "Révolutionnez la reconnaissance des talents avec notre IA avancée",
    url: "https://corp1o1.com",
    siteName: "Corp1o1",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Corp1o1 - L'Ère des Compétences",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corp1o1 - L'Ère des Compétences",
    description: "Révolutionnez la reconnaissance des talents avec notre IA avancée",
    images: ["/og-image.jpg"],
    creator: "@corp1o1",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={clerkTheme}>
      <html lang="fr" suppressHydrationWarning>
        <body className={montserrat.className}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <ReduxProvider>
              <TranslationProvider>
                <AuthProvider>
                  <SnowDots 
                    count={80} 
                    speed={0.6} 
                    size={{ min: 1, max: 3 }}
                    opacity={{ min: 0.2, max: 0.8 }}
                    wind={0.3}
                  />
                  <StreamVideoProvider>
                  {children}
                  </StreamVideoProvider>
                  <Toaster />
                </AuthProvider>
              </TranslationProvider>
            </ReduxProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
