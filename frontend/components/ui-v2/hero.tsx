"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Container, Section, Flex } from "./container"
import { Heading, Text } from "./typography"
import { Button } from "./button"

export interface HeroProps {
  className?: string
  title: string
  subtitle?: string
  description?: string
  primaryAction?: {
    label: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
  }
  visual?: React.ReactNode
  background?: "default" | "gradient" | "minimal"
}

const Hero = React.forwardRef<HTMLElement, HeroProps>(
  ({ 
    className, 
    title, 
    subtitle, 
    description, 
    primaryAction, 
    secondaryAction, 
    visual,
    background = "default",
    ...props 
  }, ref) => {
    const backgrounds = {
      default: "bg-gradient-to-br from-background via-background to-revolutionary-blue/5",
      gradient: "bg-revolutionary-gradient",
      minimal: "bg-background",
    }

    return (
      <Section
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center relative overflow-hidden pt-20",
          backgrounds[background],
          className
        )}
        spacing="none"
        {...props}
      >
        {/* Background geometric shapes */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-revolutionary-cyan rounded-lg rotate-45 animate-subtle-float" />
          <div className="absolute bottom-1/4 left-1/4 w-24 h-24 border border-revolutionary-amber rounded-full animate-subtle-float" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-revolutionary-purple/20 rounded-lg animate-subtle-float" style={{ animationDelay: "2s" }} />
        </div>

        <Container size="lg" className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Content */}
            <div className="space-y-8 text-center lg:text-left">
              {subtitle && (
                <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-revolutionary-cyan/20">
                  <Text variant="small" color="accent" className="font-semibold">
                    {subtitle}
                  </Text>
                </div>
              )}
              
              <div className="space-y-6">
                <Heading 
                  variant="h2" 
                  color="split"
                  className="animate-fade-in-up text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                
                {description && (
                  <Text 
                    variant="default" 
                    color="muted"
                    className="max-w-lg text-lg leading-relaxed animate-fade-in-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    {description}
                  </Text>
                )}
              </div>

              {(primaryAction || secondaryAction) && (
                <Flex 
                  direction="row" 
                  gap="default" 
                  className="animate-fade-in-up flex-wrap justify-center lg:justify-start"
                  style={{ animationDelay: "0.4s" }}
                >
                  {primaryAction && (
                    <Button
                      variant="primary"
                      size="default"
                      onClick={primaryAction.onClick}
                      className="shadow-lg shadow-revolutionary-cyan/20"
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                  {secondaryAction && (
                    <Button
                      variant="secondary"
                      size="default"
                      onClick={secondaryAction.onClick}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                </Flex>
              )}

              {/* Trust indicators */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  No credit card required
                </span>
                <span>•</span>
                <span>Free 14-day trial</span>
                <span>•</span>
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* Visual */}
            {visual && (
              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
                  {visual}
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>
    )
  }
)
Hero.displayName = "Hero"

const HeroVisual = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative glass-card p-8 max-w-lg w-full shadow-2xl",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
HeroVisual.displayName = "HeroVisual"

export { Hero, HeroVisual }