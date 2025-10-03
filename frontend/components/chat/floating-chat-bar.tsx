"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Send, 
  Bot, 
  Mic, 
  MicOff, 
  Sparkles, 
  MessageSquare,
  Minimize2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from '@/hooks/use-chat'

interface FloatingChatBarProps {
  onSendMessage?: (message: string) => void
  placeholder?: string
  className?: string
  enableVoice?: boolean
  enableMinimize?: boolean
  isMinimized?: boolean
  onMinimizeToggle?: () => void
  disabled?: boolean
}

export function FloatingChatBar({
  onSendMessage,
  placeholder = "Ask our AI assistant anything...",
  className,
  enableVoice = true,
  enableMinimize = true,
  isMinimized = false,
  onMinimizeToggle,
  disabled = false
}: FloatingChatBarProps) {
  const [message, setMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const { messages, sendMessage, loading } = useChat()

  const handleSendMessage = () => {
    if (!message.trim() || loading) return
    sendMessage(message.trim())
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    if (disabled) return
    setIsListening(!isListening)
    // Voice input logic would go here
  }

  const handleMinimizeToggle = () => {
    onMinimizeToggle?.()
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: isMinimized ? 60 : 0, 
        opacity: 1,
        scale: isMinimized ? 0.9 : 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      className={cn(
        "fixed bottom-4 right-1/4 left-1/4  z-50   ",
        className
      )}
    >
      <div className="relative">
        {/* Simple white background with rounded edges */}
        <div className="absolute inset-0 bg-white rounded-full shadow-lg border border-gray-200" />

        {/* Main content */}
        <div className="relative p-4">
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                

                {/* Messages */}
                <div className="max-h-64 overflow-y-auto  space-y-2 text-sm">
                  {messages.map((m) => (
                    <div key={m.id} className={cn('p-2 rounded-lg', m.role==='user'?'bg-blue-500 text-white':'bg-gray-100 text-gray-900')}>{m.content}</div>
                  ))}
                </div>

                {/* Chat input */}
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder}
                      disabled={disabled}
                      className={cn(
                        "pr-12 bg-white border-gray-300 rounded-xl text-black",
                        "focus:outline-none focus:ring-0 focus:border-gray-300",
                        "transition-all duration-300",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    
                    {/* Message length indicator */}
                    {message.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          message.length < 10 ? "bg-yellow-400" : "bg-green-400"
                        )} />
                      </motion.div>
                    )}
                  </div>

                  {/* Voice input button */}
                  {enableVoice && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleVoiceInput}
                      disabled={disabled}
                      className={cn(
                        "h-10 w-10 border-gray-400 bg-gray-100 text-gray-700 rounded-xl",
                        "hover:bg-gray-200 hover:border-gray-500",
                        "transition-all duration-300",
                        isListening && "bg-red-100 border-red-400 text-red-600",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Send button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || disabled}
                    size="icon"
                    className={cn(
                      "h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl",
                      "shadow-md",
                      "disabled:bg-gray-400 disabled:text-gray-200 disabled:shadow-none",
                      "transition-all duration-300"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
 
              </motion.div>
            )}
          </AnimatePresence>

        
        </div>
      </div>
    </motion.div>
  )
}
