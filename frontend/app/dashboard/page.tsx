"use client"

import { ComprehensiveDashboard } from "@/components/dashboard/comprehensive-dashboard"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { OnboardingManager } from "@/components/onboarding/onboarding-manager"
import { FloatingChatBar } from "@/components/chat"

export default function DashboardPage() {
  const handleSendMessage = (message: string) => {
    console.log('Dashboard chat message:', message)
    // TODO: Implement your chat logic here
    // This will be where you send the message to your AI service
  }

  return (
    <OnboardingManager>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation />
        <div className="pb-32"> {/* Add padding for floating chat bar */}
          <ComprehensiveDashboard />
        </div>
        
        {/* Floating Chat Bar */}
        <FloatingChatBar
          onSendMessage={handleSendMessage}
          placeholder="Ask me about your learning progress and goals..."
          enableVoice={true}
          enableMinimize={true}
        />
      </div>
    </OnboardingManager>
  )
}
