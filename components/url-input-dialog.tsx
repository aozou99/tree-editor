"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UrlInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUrlSubmit: (url: string) => void
  currentUrl?: string
}

export function UrlInputDialog({ open, onOpenChange, onUrlSubmit, currentUrl }: UrlInputDialogProps) {
  const [url, setUrl] = useState(currentUrl || "")

  const handleSubmit = () => {
    if (url.trim()) {
      onUrlSubmit(url.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>アイコンURLの入力</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="icon-url" className="text-sm font-semibold mb-1 block">
            画像URL
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="icon-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="flex-1"
              autoFocus
            />
          </div>
          {url && (
            <div className="mt-4">
              <Label className="text-sm font-semibold mb-1 block">プレビュー</Label>
              <div className="border rounded-md p-4 flex justify-center">
                {url.startsWith("http") ? (
                  <img
                    src={url || "/placeholder.svg"}
                    alt="アイコンプレビュー"
                    className="max-h-20 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/broken-image-icon.png"
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">有効なURLを入力してください</div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim() || !url.startsWith("http")}>
            設定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
