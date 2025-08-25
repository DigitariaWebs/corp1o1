"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva(
  "font-montserrat font-bold tracking-tight",
  {
    variants: {
      variant: {
        h1: "text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-none",
        h2: "text-3xl md:text-4xl lg:text-5xl leading-tight",
        h3: "text-2xl md:text-3xl lg:text-4xl leading-tight",
        h4: "text-xl md:text-2xl lg:text-3xl leading-tight",
        h5: "text-lg md:text-xl lg:text-2xl leading-tight",
        h6: "text-base md:text-lg lg:text-xl leading-tight",
      },
      color: {
        default: "text-foreground",
        gradient: "gradient-text",
        accent: "text-revolutionary-cyan",
        muted: "text-muted-foreground",
        split: "text-foreground [&_.accent]:text-revolutionary-cyan",
      },
    },
    defaultVariants: {
      variant: "h1",
      color: "default",
    },
  }
)

const textVariants = cva(
  "font-montserrat",
  {
    variants: {
      variant: {
        default: "text-base leading-relaxed",
        large: "text-lg md:text-xl leading-relaxed",
        small: "text-sm leading-relaxed",
        xs: "text-xs leading-relaxed",
        lead: "text-xl md:text-2xl leading-relaxed font-light",
      },
      color: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        accent: "text-revolutionary-cyan",
        gradient: "gradient-text",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "default",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    const Comp = as || (variant === "h1" ? "h1" : variant === "h2" ? "h2" : variant === "h3" ? "h3" : variant === "h4" ? "h4" : variant === "h5" ? "h5" : "h6")
    return (
      <Comp
        className={cn(headingVariants({ variant, color, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, color, as = "p", ...props }, ref) => {
    const Comp = as
    return (
      <Comp
        className={cn(textVariants({ variant, color, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

const Stat = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string | number
    label: string
    description?: string
  }
>(({ className, value, label, description, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center text-center space-y-2", className)}
    {...props}
  >
    <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-none">
      {value}
    </div>
    <div className="text-sm font-medium text-revolutionary-cyan uppercase tracking-wider">
      {label}
    </div>
    {description && (
      <div className="text-xs text-muted-foreground max-w-32 leading-tight">
        {description}
      </div>
    )}
  </div>
))
Stat.displayName = "Stat"

export { Heading, Text, Stat, headingVariants, textVariants }