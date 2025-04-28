"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface DragPreviewProps {
  nodeId: string
  nodeName: string
}

export function DragPreview({ nodeId, nodeName }: DragPreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed top-0 left-0 pointer-events-none bg-primary/10 border border-primary rounded px-2 py-1 text-sm z-50"
      style={{
        transform: `translate(${window.mouseX || 0}px, ${window.mouseY || 0}px)`,
      }}
    >
      {nodeName}
    </div>,
    document.body,
  )
}
