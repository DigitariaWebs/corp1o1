"use client"

import { SkillsManagement } from "@/components/skills/skills-management"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingChatBar } from "@/components/chat"

export default function SkillsPage() {
  const mockUser = {
    name: "Alexandre Dubois",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  }

  const handleSendMessage = (message: string) => {
    console.log('Skills chat message:', message)
    // TODO: Implement your chat logic here for skills-related queries
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      <div className="p-6 pb-32"> {/* Add padding for floating chat bar */}
        <div className="max-w-7xl mx-auto">
          <SkillsManagement />
        </div>
      </div>
      
      {/* Floating Chat Bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask me about skills development and recommendations..."
        enableVoice={true}
        enableMinimize={true}
      />
    </div>
  )
}
