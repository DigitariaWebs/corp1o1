"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageContent } from "@/components/chat/message-content"
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
import { useFastChat } from '@/hooks/use-fast-chat'
import { SimpleCommandMenu as CommandMenu } from "@/components/ai/simple-command-menu"

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
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandSearchQuery, setCommandSearchQuery] = useState("")

  const { messages, sendMessage, loading } = useFastChat()

  // Command menu handlers
  const handleCommandSelect = (command: any) => {
    if (command.href) {
      router.push(command.href)
    } else if (command.action) {
      command.action()
    } else {
      // Handle AI-specific commands
      if (command.id === 'ai-learning-plan') {
        setMessage("Create a personalized learning plan for me based on my current skills and goals")
        setShowCommandMenu(false)
      } else if (command.id === 'ai-skill-analysis') {
        setMessage("Analyze my current skills and provide recommendations for improvement")
        setShowCommandMenu(false)
      } else if (command.id === 'voice-mode') {
        setIsListening(!isListening)
        setShowCommandMenu(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)
    
    // Check for slash command
    if (value === '/') {
      console.log('Slash detected in floating chat, opening command menu')
      setShowCommandMenu(true)
      setCommandSearchQuery('')
    } else if (value.startsWith('/') && showCommandMenu) {
      setCommandSearchQuery(value.slice(1))
    } else if (!value.startsWith('/') && showCommandMenu) {
      console.log('Closing command menu in floating chat')
      setShowCommandMenu(false)
      setCommandSearchQuery('')
    }
  }

  const handleSendMessage = () => {
    if (!message.trim() || loading) return
    
    // Don't send slash commands as messages
    if (message.startsWith('/')) {
      setMessage("")
      setShowCommandMenu(false)
      setCommandSearchQuery('')
      return
    }
    
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
        <div className={cn(
          "absolute inset-0 bg-white shadow-lg border border-gray-200 transition-all duration-300",
          messages.length === 0 ? "rounded-full" : "rounded-2xl"
        )} />

        {/* Main content */}
        <div className="relative p-4">
          {!isMinimized && (
            <>
              {/* Messages - only show when there are messages */}
              {messages.length > 0 && (
                <AnimatePresence>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="max-h-64 overflow-y-auto space-y-3 text-sm px-4">
                      {messages.map((m) => (
                        <div key={m.id} className={cn('px-4 py-3 rounded-lg', m.role==='user'?'bg-blue-500 text-white':'bg-gray-100 text-gray-900')}>
                          <MessageContent 
                            content={m.content}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Debug info - remove this later */}
              {showCommandMenu && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-2 mx-4">
                  Command menu is open! Search query: "{commandSearchQuery}"
                </div>
              )}

              {/* Chat input */}
              <div className={cn(
                "flex items-center space-x-3 px-4",
                messages.length === 0 ? "justify-center" : ""
              )}>
                  <div className="relative flex-1">
                    <Input
                      value={message}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder + " (Type '/' for commands)"}
                      disabled={disabled}
                      className={cn(
                        "pr-12 bg-white border-gray-300 rounded-xl text-black",
                        "focus:outline-none focus:ring-0 focus:border-gray-300",
                        "transition-all duration-300",
                        showCommandMenu && "border-blue-500 ring-2 ring-blue-200",
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

                  {/* Debug button - remove this later */}
                  <Button
                    onClick={() => {
                      console.log('Manual command menu trigger in floating chat, current state:', showCommandMenu)
                      setShowCommandMenu(!showCommandMenu)
                    }}
                    size="icon"
                    variant="outline"
                    className={cn(
                      "h-10 w-10 border-gray-400 bg-gray-100 text-gray-700 rounded-xl",
                      "hover:bg-gray-200 hover:border-gray-500",
                      "transition-all duration-300",
                      showCommandMenu && "bg-blue-100 border-blue-500"
                    )}
                  >
                    /
                  </Button>

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
              </>
            )}
        </div>
      </div>
      
      {/* Command Menu */}
      <CommandMenu
        isOpen={showCommandMenu}
        onClose={() => {
          setShowCommandMenu(false)
          setCommandSearchQuery('')
          setMessage('')
        }}
        onSelect={handleCommandSelect}
        searchQuery={commandSearchQuery}
      />
    </motion.div>
  )
}
