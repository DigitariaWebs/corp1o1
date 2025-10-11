"use client"

import { FloatingChatBar } from "@/components/chat/floating-chat-bar"
import { MainNavigation } from "@/components/navigation/main-navigation"
import CSSSnow from "@/components/effects/css-snow"

export default function MainPage() {
  const handleSendMessage = (message: string) => {
    console.log('User message:', message)
    // Handle chat logic here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 relative overflow-hidden">
      {/* Main Navigation */}
      <MainNavigation />
      
      {/* Snow Effect */}
      <CSSSnow count={80} className="z-10" />
      
      {/* Floating Chat Bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask our AI assistant anything..."
        enableVoice={true}
        enableMinimize={true}
        className="z-50"
      />
    </div>
  )
}
