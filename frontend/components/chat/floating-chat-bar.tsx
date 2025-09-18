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
        {/* Background with glass effect */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-revolutionary-blue/5 to-revolutionary-cyan/5 rounded-2xl" />
        
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute -inset-1 bg-gradient-to-r from-revolutionary-blue/20 to-revolutionary-cyan/20 rounded-2xl opacity-0 blur-xl transition-opacity duration-500",
            isFocused && "opacity-100"
          )}
        />

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
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-revolutionary-blue/10 rounded-lg">
                      <Bot className="h-4 w-4 text-revolutionary-blue" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">AI Assistant</h3>
                      <p className="text-xs text-muted-foreground">Ask me anything about your learning</p>
                    </div>
                  </div>
                  
                  {enableMinimize && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMinimizeToggle}
                      className="h-8 w-8 p-0 hover:bg-muted/50"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <div className="max-h-64 overflow-y-auto mb-3 space-y-2 text-sm">
                  {messages.map((m) => (
                    <div key={m.id} className={cn('p-2 rounded-md', m.role==='user'?'bg-primary text-primary-foreground':'bg-muted')}>{m.content}</div>
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
                        "pr-12 bg-background/50 border-border/50 backdrop-blur-sm",
                        "focus:border-revolutionary-blue/50 focus:ring-revolutionary-blue/20",
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
                        "h-10 w-10 border-border/50 bg-background/50 backdrop-blur-sm",
                        "hover:bg-revolutionary-blue/10 hover:border-revolutionary-blue/50",
                        "transition-all duration-300",
                        isListening && "bg-red-500/20 border-red-500/50 text-red-400",
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
                      "h-10 w-10 bg-revolutionary-blue hover:bg-revolutionary-blue/90",
                      "shadow-lg shadow-revolutionary-blue/25",
                      "disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
                      "transition-all duration-300"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status indicators */}
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Online</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>AI-Powered</span>
                    </div>
                  </div>
                  
                  {message.length > 0 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-revolutionary-blue"
                    >
                      {message.length}/500
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimized state */}
          {isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-2"
            >
              <Button
                variant="ghost"
                onClick={handleMinimizeToggle}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Chat with AI</span>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
