"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { allSamples, type SampleType } from "@/utils/sample-data"
import { BookTemplate } from "lucide-react"

interface SampleSelectorProps {
  onSelectSample: (sampleId: SampleType) => void
  currentSampleId: SampleType | null
}

export function SampleSelector({ onSelectSample, currentSampleId }: SampleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedSample, setSelectedSample] = useState<SampleType | null>(currentSampleId)

  const handleSelect = () => {
    if (selectedSample) {
      onSelectSample(selectedSample)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-2 sm:px-3"
        onClick={() => setOpen(true)}
        title="サンプルを選択"
      >
        <BookTemplate size={16} className="sm:mr-2" />
        <span className="hidden sm:inline">サンプル選択</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>サンプルデータを選択</DialogTitle>
            <DialogDescription>以下のサンプルから選択してください。現在のデータは上書きされます。</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup
              value={selectedSample || undefined}
              onValueChange={(value) => setSelectedSample(value as SampleType)}
              className="space-y-3"
            >
              {allSamples.map((sample) => (
                <div
                  key={sample.id}
                  className={`flex items-center space-x-2 rounded-md border p-3 ${
                    selectedSample === sample.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <RadioGroupItem value={sample.id} id={sample.id} />
                  <Label htmlFor={sample.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{sample.name}</div>
                    <div className="text-sm text-muted-foreground">{sample.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSelect} disabled={!selectedSample}>
              選択
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
