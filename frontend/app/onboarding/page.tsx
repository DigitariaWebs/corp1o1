"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { IntelligentSignup } from "@/components/onboarding/intelligent-signup"
import { AILoading } from "@/components/loading/ai-loading"
import { motion } from "framer-motion"
import { CheckCircle, Brain } from "lucide-react"

export default function OnboardingPage() {
  const { user, isLoading, getToken, refreshUserData } = useAuth()
  const router = useRouter()
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [aiLoadingStage, setAiLoadingStage] = useState("Analyzing your profile")
  const [isComplete, setIsComplete] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Check if user already has personalization from backend or localStorage
    const checkExistingPersonalization = async () => {
      if (isLoading || hasChecked) return
      
      setHasChecked(true)
      
      // Check localStorage first
      const localPersonalization = localStorage.getItem('userPersonalization')
      if (localPersonalization) {
        try {
          const parsed = JSON.parse(localPersonalization)
          if (parsed && (parsed.personalizedContent || parsed.assessmentPlan)) {
            console.log("🔄 User has localStorage personalization, redirecting to dashboard")
            router.push("/dashboard")
            return
          }
        } catch (e) {
          console.error("Error parsing localStorage personalization:", e)
        }
      }
      
      // Check backend personalization
      if (user?.personalization && (user.personalization.personalizedContent || user.personalization.assessmentPlan)) {
        console.log("🔄 User has backend personalization, redirecting to dashboard")
        router.push("/dashboard")
      }
    }
    
    checkExistingPersonalization()
  }, [user, isLoading, router, hasChecked])

  const handleAIOnboardingComplete = async (onboardingData: any) => {
    try {
      console.log("🤖 [ONBOARDING] AI Onboarding completed with data:", onboardingData)
      
      setIsProcessingAI(true)
      setAiLoadingStage("Analyzing your profile")
      
      const token = await getToken()
      console.log("🤖 [ONBOARDING] Got token:", token ? 'TOKEN_PRESENT' : 'NO_TOKEN')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAiLoadingStage("Identifying learning goals")
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const fullUrl = `${apiUrl}/api/personalization/generate`
      console.log("🤖 [ONBOARDING] Calling URL:", fullUrl)
      
      const requestBody = { onboardingData }
      console.log("🤖 [ONBOARDING] Request body:", JSON.stringify(requestBody, null, 2))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAiLoadingStage("Creating personalized curriculum")
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log("🤖 [ONBOARDING] Response status:", response.status)

      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAiLoadingStage("Optimizing learning path")
        
        const result = await response.json()
        console.log('✅ [ONBOARDING] AI personalization completed:', result)
        
        // Store personalization in localStorage for immediate use
        if (result.data?.personalization) {
          localStorage.setItem('userPersonalization', JSON.stringify(result.data.personalization))
          console.log('💾 [ONBOARDING] Saved personalization to localStorage')
          // Clear the in-progress flag
          sessionStorage.removeItem('onboarding-in-progress')
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAiLoadingStage("Finalizing your experience")
        
        // Refresh user data to get the latest from backend
        await refreshUserData()
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsComplete(true)
        
        // Show success screen briefly then redirect
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const errorText = await response.text()
        console.error('❌ [ONBOARDING] AI personalization failed:', errorText)
        setIsProcessingAI(false)
        alert('Failed to generate personalization. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error during AI personalization:', error)
      setIsProcessingAI(false)
      alert('An error occurred. Please try again.')
    }
  }

  const handleAIOnboardingSkip = () => {
    console.log("🚫 AI Onboarding skipped")
    sessionStorage.removeItem('onboarding-in-progress')
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-revolutionary-cyan"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/sign-in")
    return null
  }

  // Show success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Personalization Complete!</h2>
          <p className="text-gray-400">Redirecting to your personalized dashboard...</p>
        </motion.div>
      </div>
    )
  }

  // Show AI processing loading state
  if (isProcessingAI) {
    return <AILoading stage={aiLoadingStage} />
  }

  // Show the intelligent signup flow only if not already processing
  if (!hasChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-revolutionary-cyan"></div>
      </div>
    )
  }
  
  return (
    <IntelligentSignup
      onComplete={handleAIOnboardingComplete}
      onSkip={handleAIOnboardingSkip}
    />
  )
}