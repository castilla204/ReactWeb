import * as React from "react"
import { Label } from "./label"
import { cn } from "../../lib/utils"

export interface FieldProps {
  name?: string
  label?: string
  description?: string
  children: React.ReactElement
  className?: string
}

const Field = ({ name, label, description, children, className }: FieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div>
        {children}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

export { Field }

