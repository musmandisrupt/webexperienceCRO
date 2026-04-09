"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMotionTemplate, useMotionValue, motion } from "framer-motion"

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)
    const inputId = id || `floating-input-${Math.random().toString(36).substr(2, 9)}`
    
    const radius = 100 // change this to increase the radius of the hover effect
    const [visible, setVisible] = React.useState(false)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = React.useCallback(({ currentTarget, clientX, clientY }: any) => {
      const { left, top } = currentTarget.getBoundingClientRect()
      setMousePosition({
        x: clientX - left,
        y: clientY - top
      })
    }, [])
    
    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      props.onChange?.(e)
    }
    
    const isLabelFloating = isFocused || hasValue
    
    return (
      <div
        style={{
          background: visible
            ? `radial-gradient(
                ${radius}px circle at ${mousePosition.x}px ${mousePosition.y}px,
                var(--ring),
                transparent 80%
              )`
            : 'transparent',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="p-[2px] rounded-lg transition duration-300 group/input"
      >
        <div className="relative">
          <input
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              "dark:bg-zinc-800 dark:text-white dark:border-zinc-700",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-3 top-2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none",
              isLabelFloating
                ? "-top-3.5 text-xs text-primary dark:text-white"
                : "top-2 text-sm text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }
