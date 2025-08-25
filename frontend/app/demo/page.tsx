"use client" // <--- ADD THIS LINE HERE

import { InteractiveDemo } from "@/components/demo/interactive-demo"
import { LandingNavigation } from "@/components/navigation/landing-navigation"

export default function DemoPage() {
  const handleDemoClick = () => {
    // Already on demo page
  }

  const handleBetaClick = () => {
    // Redirect to registration
    window.location.href = "/#home"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <LandingNavigation onDemoClick={handleDemoClick} onBetaClick={handleBetaClick} />
      <div className="pt-16">
        <InteractiveDemo />
      </div>
    </div>
  )
}
