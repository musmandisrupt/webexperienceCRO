"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface RadioGroupProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <fieldset
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              groupValue: value,
              onValueChange: onValueChange,
            } as any)
          }
          return child
        })}
      </fieldset>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string
  label: string
  description?: string
  groupValue?: string
  onValueChange?: (value: string) => void
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, label, description, groupValue, onValueChange, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`
    const isChecked = groupValue === value
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
    }
    
    return (
      <div className="flex items-start space-x-3">
        <div className="relative">
          <input
            type="radio"
            id={radioId}
            value={value}
            checked={isChecked}
            onChange={handleChange}
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <label
            htmlFor={radioId}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border border-input bg-background text-primary ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary",
              className
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity"
            )} />
          </label>
        </div>
        <div className="space-y-1">
          <label
            htmlFor={radioId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
