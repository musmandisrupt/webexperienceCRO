"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "@heroicons/react/24/outline"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="flex items-start space-x-3">
        <div className="relative">
          <input
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border border-input bg-background text-primary ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary",
              className
            )}
          >
            <CheckIcon className="h-3 w-3 opacity-0 peer-checked:opacity-100 transition-opacity" />
          </label>
        </div>
        {(label || description) && (
          <div className="space-y-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
