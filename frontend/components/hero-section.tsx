"use client"

import { useTranslation } from "@/hooks/use-translation"
import { BackgroundPaths } from "@/components/ui/background-paths"

interface HeroSectionProps {
  onDemoClick: () => void
  onBetaClick: () => void
}

export function HeroSection({ onDemoClick, onBetaClick }: HeroSectionProps) {
  const { t } = useTranslation()

  return (
    <BackgroundPaths
      title="Say more, more powerfully"
      subtitle="AI SYSTEM ACTIVE"
      description="Fueled by first-party data, create personalized journeys across all channels with our AI-powered customer engagement platform."
      primaryAction={{
        label: "Get started",
        onClick: onDemoClick
      }}
      secondaryAction={{
        label: "Book a demo",
        onClick: onBetaClick
      }}
    />
  )
}
