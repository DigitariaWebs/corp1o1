"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { FloatingChatBar } from "@/components/chat"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { Brain } from "lucide-react"

export default function AIAssistantPage() {
  const handleSendMessage = (message: string) => {
    console.log('AI Assistant chat message:', message)
    // TODO: Implement your chat logic here
    // This will be where you send the message to your AI service
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <MainNavigation />
      
      {/* Empty page with just the floating chatbot */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        
        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10"
        >
          <div className="mb-8">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center"
              animate={{ 
                boxShadow: "0 0 30px rgba(6, 182, 212, 0.3)" 
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <Brain className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">
              AI Assistant
            </h1>
            <p className="text-xl text-gray-300 max-w-md mx-auto">
              Your intelligent learning companion is ready to help. Start a conversation below!
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Floating Chat Bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask anything "
        enableVoice={true}
        enableMinimize={true}
      />
    </div>
  )
}