"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface NavigationProps {
  className?: string
  onDemoClick?: () => void
  onBetaClick?: () => void
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, onDemoClick, onBetaClick, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-revolutionary-cyan/10 backdrop-blur-xl",
          "bg-background/80",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-revolutionary-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-none">Corp1o1</span>
                <span className="text-revolutionary-cyan text-xs font-medium">L'Ère des Compétences</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink href="#platform">Platform</NavLink>
              <NavLink href="#solutions">Solutions</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink href="#resources">Resources</NavLink>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDemoClick}
                className="hidden sm:inline-flex text-white hover:text-revolutionary-cyan"
              >
                Book demo
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={onBetaClick}
                className="shadow-lg shadow-revolutionary-cyan/25"
              >
                Start trial
              </Button>
            </div>
          </div>
        </div>
      </nav>
    )
  }
)
Navigation.displayName = "Navigation"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

const NavLink = ({ href, children, className }: NavLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-muted-foreground transition-colors duration-200",
        "hover:text-white relative group",
        className
      )}
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-revolutionary-cyan transition-all duration-200 group-hover:w-full" />
    </Link>
  )
}

export { Navigation, NavLink }