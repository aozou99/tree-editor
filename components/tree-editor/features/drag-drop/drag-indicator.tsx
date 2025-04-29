"use client"

import { cn } from "@/lib/utils"

interface DragIndicatorProps {
  position: "before" | "after" | "inside"
  className?: string
}

export function DragIndicator({ position, className }: DragIndicatorProps) {
  if (position === "inside") {
    return (
      <div className={cn("absolute inset-0 border-2 border-primary/50 rounded-md pointer-events-none", className)} />
    )
  }

  return (
    <div
      className={cn(
        "h-1 bg-primary rounded-full w-full pointer-events-none",
        position === "before" ? "-mt-0.5 mb-1" : "mt-1",
        className,
      )}
    />
  )
}
