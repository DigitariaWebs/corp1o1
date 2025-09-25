"use client"

import { usePathname } from "next/navigation"
import { useAIAssistant } from "@/contexts/ai-assistant-context"

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  const pathname = usePathname()
  const { isFullScreen } = useAIAssistant()
  
  // Apply appropriate z-index classes based on page
  const getZIndexClass = () => {
    if (pathname === '/ai-assistant') {
      return 'ai-assistant-page'
    }
    return 'other-pages'
  }
  
  return (
    <div className={`${getZIndexClass()} relative ${className}`}>
      {children}
    </div>
  )
}