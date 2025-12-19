"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs"

interface User {
  id: string
  clerkUserId: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  avatar?: string
  bio?: string
  timezone?: string
  preferredLanguage?: string
  role: "user" | "enterprise" | "admin"
  subscription: "free" | "basic" | "premium" | "enterprise"
  notifications: number
  company?: any
  department?: string
  learningProfile?: any
  statistics?: any
  personalization?: any
  onboardingData?: any
  isEmailVerified?: boolean
  onboarding?: {
    hasCompletedWelcome?: boolean
    hasCompletedTour?: boolean
    hasSetLearningProfile?: boolean
    hasCompletedFirstAssessment?: boolean
    completedSteps?: Array<{
      step: string
      completedAt: Date
    }>
    progress?: number
  }
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isLoading: boolean
  isSignedIn: boolean
  getToken: () => Promise<string | null>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { isSignedIn, getToken: getClerkToken, signOut } = useClerkAuth()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fetch user data from backend
  const fetchUserData = async (clerkUserId: string) => {
    try {
      const token = await getClerkToken()
      if (!token) throw new Error("No token available")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // If user not found (404), the backend will auto-create the user
        // So this shouldn't happen anymore, but handle gracefully
        if (response.status === 404) {
          console.warn("🔄 User not found in database - backend should auto-create. Using Clerk data as fallback.")
          return null // Use Clerk data instead of "USER_DELETED"
        }
        // Handle 401 (Unauthorized) - token might be invalid or expired, use Clerk data
        if (response.status === 401) {
          console.warn("⚠️ Authentication failed for user profile - using Clerk data as fallback")
          return null
        }
        // If backend is not available, just return null and use Clerk data
        if (response.status >= 500 || !response.status) {
          console.warn("Backend not available, using Clerk data only")
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const userData = await response.json()
      return userData.data?.user || userData.user
    } catch (error) {
      // Network errors or server unavailable - use Clerk data only
      if (error instanceof Error && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
        console.warn("Backend not available, using Clerk data only:", error.message)
        return null
      }
      console.error("Error fetching user data:", error)
      return null
    }
  }

  // Map Clerk user to our User interface
  const mapClerkUserToUser = (clerkUser: any, mongoUser: any = null): User => {
    return {
      id: mongoUser?._id || clerkUser.id,
      clerkUserId: clerkUser.id,
      name: `${mongoUser?.firstName || clerkUser.firstName || ''} ${mongoUser?.lastName || clerkUser.lastName || ''}`.trim() || clerkUser.emailAddresses[0]?.emailAddress || 'User',
      firstName: mongoUser?.firstName || clerkUser.firstName || '',
      lastName: mongoUser?.lastName || clerkUser.lastName || '',
      email: mongoUser?.email || clerkUser.emailAddresses[0]?.emailAddress || '',
      avatar: mongoUser?.profileImage || clerkUser.imageUrl,
      bio: mongoUser?.bio || '',
      timezone: mongoUser?.timezone || 'UTC',
      preferredLanguage: mongoUser?.preferredLanguage || 'fr',
      role: mongoUser?.role || "user",
      subscription: mongoUser?.subscription?.tier || "free",
      notifications: 0,
      company: mongoUser?.company,
      department: mongoUser?.department,
      learningProfile: mongoUser?.learningProfile,
      statistics: mongoUser?.statistics,
      personalization: mongoUser?.personalization,
      onboardingData: mongoUser?.onboardingData,
      isEmailVerified: mongoUser?.isEmailVerified || false,
      onboarding: mongoUser?.onboarding || {
        hasCompletedWelcome: false,
        hasCompletedTour: false,
        hasSetLearningProfile: false,
        hasCompletedFirstAssessment: false,
        progress: 0
      },
    }
  }

  // Sync user data when Clerk user changes
  useEffect(() => {
    const syncUserData = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn("⚠️ [AUTH] Auth sync timeout - setting loading to false")
          setIsLoading(false)
        }, 10000) // 10 second timeout

        if (!clerkLoaded) {
          clearTimeout(timeoutId)
          return
        }

        // Check if account deletion is in progress
        const isDeletionInProgress = sessionStorage.getItem('account-deletion-in-progress')
        if (isDeletionInProgress) {
          console.log("🚫 Account deletion in progress - skipping user sync and redirecting")
          setUser(null)
          setIsLoading(false)
          sessionStorage.removeItem('account-deletion-in-progress')
          window.location.href = '/'
          clearTimeout(timeoutId)
          return
        }

        setIsLoading(true)

        if (isSignedIn && clerkUser) {
          try {
            // Fetch full user data from MongoDB
            const mongoUser = await fetchUserData(clerkUser.id)
            
            // If MongoDB user fetch returned null, use Clerk data as fallback
            if (!mongoUser) {
              console.log("📊 [AUTH] No MongoDB user data, using Clerk data as fallback")
              const mappedUser = mapClerkUserToUser(clerkUser)
              console.log("📊 [AUTH] Using Clerk fallback data:", mappedUser)
              setUser(mappedUser)
              setIsLoading(false)
              clearTimeout(timeoutId)
              return
            }
            
            const mappedUser = mapClerkUserToUser(clerkUser, mongoUser)
            console.log("📊 [AUTH] Initial sync - mapped user:", mappedUser)
            console.log("📊 [AUTH] Initial sync - personalization:", mappedUser.personalization)
            setUser(mappedUser)
          } catch (error) {
            console.error("Error syncing user data:", error)
            
            // Fall back to Clerk data only for other errors
            const mappedUser = mapClerkUserToUser(clerkUser)
            setUser(mappedUser)
          }
        } else {
          setUser(null)
        }

        setIsLoading(false)
        clearTimeout(timeoutId)
      } catch (outerError) {
        console.error("Critical error in syncUserData:", outerError)
        setUser(null)
        setIsLoading(false)
      }
    }

    syncUserData().catch(error => {
      console.error("Unhandled error in syncUserData:", error)
      setUser(null)
      setIsLoading(false)
    })
  }, [clerkLoaded, isSignedIn, clerkUser])

  const refreshUserData = async () => {
    if (!clerkUser) return

    try {
      const mongoUser = await fetchUserData(clerkUser.id)
      
      // Check if user was deleted
      if (mongoUser === "USER_DELETED") {
        console.log("🚫 User account was deleted during refresh - signing out and redirecting to home")
        setUser(null)
        
        // Sign out from Clerk and redirect to home
        try {
          await signOut()
          console.log("✅ Signed out from Clerk successfully during refresh")
        } catch (signOutError) {
          console.error("Error signing out during refresh:", signOutError)
        }
        
        // Force redirect regardless of sign out result
        console.log("🔄 Redirecting to home page from refresh...")
        window.location.href = '/'
        return
      }
      
      const mappedUser = mapClerkUserToUser(clerkUser, mongoUser)
      console.log("📊 [AUTH] Mapped user data:", mappedUser)
      console.log("📊 [AUTH] User personalization:", mappedUser.personalization)
      setUser(mappedUser)
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const login = (userData: User) => {
    // This is kept for compatibility, but actual login is handled by Clerk
    setUser(userData)
  }

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getToken = async () => {
    try {
      return await getClerkToken()
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  }

  const value = {
    user,
    login,
    logout,
    isLoading: !clerkLoaded || isLoading,
    isSignedIn: isSignedIn || false,
    getToken,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
