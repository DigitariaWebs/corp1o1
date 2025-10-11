"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { WelcomeModal } from "./welcome-modal"
import { FeatureTour } from "./feature-tour"
import { IntelligentSignup } from "./intelligent-signup"
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
interface UserState {
  isFirstTime: boolean
  hasCompletedAssessment: boolean
  hasActiveCourses: boolean
  certificateCount: number
  onboardingStep: number
  needsPersonalization: boolean
}

interface OnboardingManagerProps {
  children: React.ReactNode
}

export function OnboardingManager({ children }: OnboardingManagerProps) {
  const { user, isLoading, getToken } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [userState, setUserState] = useState<UserState | null>(null)

  // Debug helper - to be removed after testing
  if (typeof window !== 'undefined') {
    (window as any).resetOnboarding = () => {
      console.log('🔄 Resetting onboarding for testing...')
      localStorage.removeItem('corp101-onboarding-shown')
      localStorage.removeItem('corp101-personalization-shown')
      localStorage.removeItem('corp101-personalization-completed')
      localStorage.removeItem('corp101-personalization-skipped')
      window.location.reload()
    }
    console.log('🛠️ Debug: Run resetOnboarding() in console to test AI onboarding')
  }

  // Detect user state and onboarding needs
  useEffect(() => {
    if (isLoading || !user) return

    const detectUserState = (): UserState => {
      // Check if user has completed basic onboarding
      const hasCompletedOnboarding = user.onboarding?.hasCompletedWelcome && user.onboarding?.hasCompletedTour
      
      // Check if user has completed AI personalization - be more explicit about new users
      const hasCompletedPersonalization = user.onboardingCompleted === true
      const hasPersonalizationData = user.personalization?.personalizedContent || user.onboardingData?.primaryGoal
      
      // Check if this is truly the first time - never seen onboarding
      const isFirstTime = !hasCompletedOnboarding
      
      // Need personalization if haven't done it yet AND haven't skipped it
      const needsPersonalization = !hasCompletedPersonalization && !hasPersonalizationData && !user.onboardingSkipped

      console.log('🔍 User State Detection:', {
        hasCompletedOnboarding,
        hasCompletedPersonalization,
        hasPersonalizationData,
        onboardingCompleted: user.onboardingCompleted,
        onboardingSkipped: user.onboardingSkipped,
        needsPersonalization,
        userId: user._id
      })

      return {
        isFirstTime,
        hasCompletedAssessment: (user.statistics?.pathsEnrolled || 0) > 0,
        hasActiveCourses: (user.statistics?.pathsEnrolled || 0) > 0,
        certificateCount: user.statistics?.certificatesEarned || 0,
        onboardingStep: hasCompletedOnboarding ? 2 : (user.onboarding?.hasCompletedWelcome ? 1 : 0),
        needsPersonalization
      }
    }

    const state = detectUserState()
    setUserState(state)

    // Show onboarding flow based on user state
    if (state.needsPersonalization) {
      // Show AI personalization for users who need it (new users or users who skipped basic onboarding)
      const hasSeenPersonalizationThisSession = localStorage.getItem('corp101-personalization-shown')
      
      if (!hasSeenPersonalizationThisSession) {
        console.log('🤖 Showing AI personalization for user')
        setShowPersonalization(true)
        localStorage.setItem('corp101-personalization-shown', 'true')
      }
    } else if (state.isFirstTime) {
      // First time users who somehow don't need personalization: show welcome modal
      const hasSeenOnboardingThisSession = localStorage.getItem('corp101-onboarding-shown')
      
      if (!hasSeenOnboardingThisSession) {
        setShowWelcome(true)
        localStorage.setItem('corp101-onboarding-shown', 'true')
      }
    }
  }, [user, isLoading])

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
    setShowTour(true)
    updateOnboardingStep(1)
  }

  const handleWelcomeSkip = () => {
    setShowWelcome(false)
    updateOnboardingStep(2) // Mark as completed
  }

  const handleTourComplete = () => {
    setShowTour(false)
    updateOnboardingStep(2) // Mark as completed
  }

  const handleTourSkip = () => {
    setShowTour(false)
    updateOnboardingStep(2) // Mark as completed
    
    // After basic onboarding, check if we need personalization
    if (userState?.needsPersonalization) {
      setTimeout(() => setShowPersonalization(true), 500) // Small delay for smooth transition
    }
  }

  const handlePersonalizationComplete = async (onboardingData: any) => {
    try {
      console.log('🤖 Starting AI personalization with data:', onboardingData)
      
      const token = await getToken()
      const response = await fetch('/api/personalization/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ onboardingData })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ AI personalization completed:', result.data.personalization)
        setShowPersonalization(false)
        
        // Clear localStorage flags
        localStorage.removeItem('corp101-personalization-shown')
        localStorage.setItem('corp101-personalization-completed', 'true')
        
        // Refresh user data to reflect the personalization completion
        window.location.href = '/main'
      } else {
        console.error('❌ AI personalization failed')
        setShowPersonalization(false)
        localStorage.removeItem('corp101-personalization-shown')
        // Continue to dashboard even if personalization fails
      }
    } catch (error) {
      console.error('❌ Error during AI personalization:', error)
      setShowPersonalization(false)
      localStorage.removeItem('corp101-personalization-shown')
    }
  }

  const handlePersonalizationSkip = async () => {
    try {
      const token = await getToken()
          
      // Mark onboarding as completed but skipped
      await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingSkipped: true
        })
      })
    } catch (error) {
      console.error('Error updating onboarding status:', error)
    }
    
    setShowPersonalization(false)
    localStorage.removeItem('corp101-personalization-shown')
    localStorage.setItem('corp101-personalization-skipped', 'true')
  }

  const updateOnboardingStep = async (step: number) => {
    try {
      // Update onboarding status in database
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/onboarding-step`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: step === 1 ? 'hasCompletedWelcome' : 'hasCompletedTour',
          completed: true
        }),
      })

      if (response.ok) {
        console.log(`Onboarding step updated to: ${step}`)
        // Clear the localStorage flag when onboarding is completed
        if (step === 2) {
          localStorage.removeItem('corp101-onboarding-shown')
        }
      }
    } catch (error) {
      console.error("Failed to update onboarding step:", error)
    }
  }

  if (isLoading || !user) {
    return <>{children}</>
  }

  return (
    <>
      {/* Show personalization if needed, otherwise show children */}
      {showPersonalization ? (
        <IntelligentSignup
          onComplete={handlePersonalizationComplete}
          onSkip={handlePersonalizationSkip}
        />
      ) : (
        children
      )}
      
      {/* Welcome modal for first-time users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleWelcomeSkip}
        onStartTour={handleWelcomeComplete}
        userName={user.name.split(' ')[0] || 'Utilisateur'}
      />

      {/* Interactive feature tour */}
      <FeatureTour
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />
    </>
  )
}