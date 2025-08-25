"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const containerVariants = cva(
  "mx-auto w-full",
  {
    variants: {
      size: {
        default: "max-w-7xl px-6 md:px-8 lg:px-12",
        sm: "max-w-4xl px-4 md:px-6",
        lg: "max-w-8xl px-6 md:px-8 lg:px-16",
        full: "max-w-none px-4 md:px-6",
        tight: "max-w-5xl px-6 md:px-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const sectionVariants = cva(
  "relative",
  {
    variants: {
      spacing: {
        default: "py-16 md:py-20 lg:py-24",
        sm: "py-12 md:py-16",
        lg: "py-20 md:py-24 lg:py-32",
        xl: "py-24 md:py-32 lg:py-40",
        none: "py-0",
      },
    },
    defaultVariants: {
      spacing: "default",
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: "section" | "div" | "main" | "article"
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ size, className }))}
      {...props}
    />
  )
)
Container.displayName = "Container"

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, as = "section", ...props }, ref) => {
    const Comp = as
    return (
      <Comp
        ref={ref}
        className={cn(sectionVariants({ spacing, className }))}
        {...props}
      />
    )
  }
)
Section.displayName = "Section"

const Grid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: 1 | 2 | 3 | 4 | 6 | 12
    gap?: "sm" | "default" | "lg" | "xl"
  }
>(({ className, cols = 1, gap = "default", ...props }, ref) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    12: "grid-cols-12",
  }

  const gridGap = {
    sm: "gap-4",
    default: "gap-6 md:gap-8",
    lg: "gap-8 md:gap-12",
    xl: "gap-12 md:gap-16",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid",
        gridCols[cols],
        gridGap[gap],
        className
      )}
      {...props}
    />
  )
})
Grid.displayName = "Grid"

const Flex = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    direction?: "row" | "col" | "row-reverse" | "col-reverse"
    align?: "start" | "center" | "end" | "stretch" | "baseline"
    justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
    gap?: "sm" | "default" | "lg" | "xl"
  }
>(({ 
  className, 
  direction = "row", 
  align = "start", 
  justify = "start", 
  gap = "default", 
  ...props 
}, ref) => {
  const flexDirection = {
    row: "flex-row",
    col: "flex-col",
    "row-reverse": "flex-row-reverse",
    "col-reverse": "flex-col-reverse",
  }

  const alignItems = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  }

  const justifyContent = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  }

  const flexGap = {
    sm: "gap-2",
    default: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        flexDirection[direction],
        alignItems[align],
        justifyContent[justify],
        flexGap[gap],
        className
      )}
      {...props}
    />
  )
})
Flex.displayName = "Flex"

export { Container, Section, Grid, Flex, containerVariants, sectionVariants }