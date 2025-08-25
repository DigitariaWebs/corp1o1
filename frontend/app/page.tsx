"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { HeroSection } from "@/components/hero-section"
import SuccessStories from "@/components/success-stories"
import { SocialImpact } from "@/components/social-impact"
import { RevolutionaryStats } from "@/components/revolutionary-stats"
import { LandingNavigation } from "@/components/navigation/landing-navigation"
import { InteractiveDemoModal } from "@/components/demo/interactive-demo-modal"
import { RegistrationModal } from "@/components/auth/registration-modal"
import { PricingSection } from "@/components/pricing-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, isLoading, user } = useAuth()
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      // Redirect based on user role
      const dashboardPath = user.role === "admin" 
        ? "/admin" 
        : user.role === "enterprise" 
        ? "/enterprise" 
        : "/dashboard"
      
      router.push(dashboardPath)
    }
  }, [isLoading, isSignedIn, user, router])

  // Show loading or redirect screen for authenticated users
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-revolutionary-cyan mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    )
  }

  // If user is signed in, show brief redirect message
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-revolutionary-cyan mx-auto mb-4"></div>
          <p className="text-white">Redirection vers votre tableau de bord...</p>
        </div>
      </div>
    )
  }

  const handleDemoClick = () => {
    // Navigate to dedicated demo page instead of modal
    router.push("/demo")
  }

  const handleBetaClick = () => {
    setIsRegistrationModalOpen(true)
  }

  const handleGetStarted = () => {
    setIsRegistrationModalOpen(true)
  }

  const handleSelectPlan = (planId: string) => {
    // You can handle plan selection logic here
    console.log(`Selected plan: ${planId}`)
    setIsRegistrationModalOpen(true)
  }

  return (
    <main className="min-h-screen">
      <LandingNavigation onDemoClick={handleDemoClick} onBetaClick={handleBetaClick} />

      <div id="home">
        <HeroSection onDemoClick={handleDemoClick} onBetaClick={handleBetaClick} />
      </div>

      <RevolutionaryStats />

      <div id="how-it-works">
        <HowItWorksSection onGetStarted={handleGetStarted} />
      </div>

      <div id="stories">
        {/* <SuccessSgtories /> */}
      </div>

      <div id="pricing">
        <PricingSection onSelectPlan={handleSelectPlan} />
      </div>

      <div id="impact">
        <SocialImpact />
      </div>

      <Footer />

      {/* Modals */}
      <InteractiveDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      <RegistrationModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} />
    </main>
  )
}
