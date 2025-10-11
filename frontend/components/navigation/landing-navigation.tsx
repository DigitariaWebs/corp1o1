"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui-v2/button"
import { Menu, X, Globe, User } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { signUpAppearance, signInAppearance } from "@/lib/clerk-theme"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface LandingNavigationProps {
  onDemoClick: () => void
  onBetaClick: () => void
}

export function LandingNavigation({ onDemoClick, onBetaClick }: LandingNavigationProps) {
  const { t, locale, toggleLocale } = useTranslation()
  const { isSignedIn, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    { label: "Platform", href: "#platform" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#resources" },
  ]

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/main" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="Corp1o1" 
                  width={120} 
                  height={40} 
                  className="h-8"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={cn(
                    "text-sm font-medium text-muted-foreground transition-colors duration-200",
                    "hover:text-white relative group"
                  )}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-revolutionary-cyan transition-all duration-200 group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher - Hidden on smaller screens */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex text-white hover:text-revolutionary-cyan"
                onClick={toggleLocale}
              >
                <Globe className="h-4 w-4 mr-1" />
                {locale.toUpperCase()}
              </Button>

              {/* Demo Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDemoClick}
                className="hidden sm:inline-flex text-white hover:text-revolutionary-cyan"
              >
                Découvrir la démo
              </Button>

              {/* Show Dashboard button if signed in, otherwise show auth buttons */}
              {isSignedIn && user ? (
                <Link href={user.role === "admin" ? "/admin" : user.role === "enterprise" ? "/enterprise" : "/dashboard"}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-revolutionary-cyan/25 bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Tableau de bord
                  </Button>
                </Link>
              ) : (
                <>
                  {/* Sign In Button */}
                  <SignInButton 
                    mode="modal"
                    appearance={signInAppearance}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:inline-flex text-white hover:text-revolutionary-cyan transition-colors"
                    >
                      Se connecter
                    </Button>
                  </SignInButton>

                  {/* Join Beta Button */}
                  <SignUpButton 
                    mode="modal"
                    appearance={signUpAppearance}
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      className="shadow-lg shadow-revolutionary-cyan/25 bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90"
                    >
                      Rejoindre la bêta
                    </Button>
                  </SignUpButton>
                </>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white hover:text-revolutionary-cyan"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-revolutionary-cyan/10 bg-background/95 backdrop-blur-xl">
            <div className="container mx-auto px-6 py-6 space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left text-muted-foreground hover:text-white transition-colors duration-200 font-medium py-3"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-revolutionary-cyan/10 space-y-3">
                <Button
                  onClick={() => {
                    toggleLocale()
                    setIsMenuOpen(false)
                  }}
                  variant="ghost"
                  className="w-full justify-start text-white hover:text-revolutionary-cyan"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {locale === 'fr' ? 'English' : 'Français'}
                </Button>
                <Button
                  onClick={() => {
                    onDemoClick()
                    setIsMenuOpen(false)
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Découvrir la démo
                </Button>
                {/* Show Dashboard button if signed in, otherwise show auth buttons */}
                {isSignedIn && user ? (
                  <Link href={user.role === "admin" ? "/admin" : user.role === "enterprise" ? "/enterprise" : "/dashboard"}>
                    <Button
                      onClick={() => setIsMenuOpen(false)}
                      variant="primary"
                      className="w-full bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Tableau de bord
                    </Button>
                  </Link>
                ) : (
                  <>
                    <SignInButton 
                      mode="modal"
                      appearance={signInAppearance}
                    >
                      <Button
                        onClick={() => setIsMenuOpen(false)}
                        variant="ghost"
                        className="w-full text-white hover:text-revolutionary-cyan border border-slate-600"
                      >
                        Se connecter
                      </Button>
                    </SignInButton>
                    <SignUpButton 
                      mode="modal"
                      appearance={signUpAppearance}
                    >
                      <Button
                        onClick={() => setIsMenuOpen(false)}
                        variant="primary"
                        className="w-full bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90"
                      >
                        Rejoindre la bêta
                      </Button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

    </>
  )
}
