"use client"

import { useState, useEffect } from "react"

interface YouTubeEmbedProps {
  url: string
  className?: string
}

export function YouTubeEmbed({ url, className }: YouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // YouTubeのURLからビデオIDを抽出
    const extractVideoId = (url: string): string | null => {
      // 標準的なYouTube URL (https://www.youtube.com/watch?v=VIDEO_ID)
      const standardRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/
      const standardMatch = url.match(standardRegex)

      if (standardMatch && standardMatch[1]) {
        return standardMatch[1]
      }

      // 短縮URL (https://youtu.be/VIDEO_ID)
      const shortRegex = /youtu\.be\/([^&?]+)/
      const shortMatch = url.match(shortRegex)

      if (shortMatch && shortMatch[1]) {
        return shortMatch[1]
      }

      // 埋め込みURL (https://www.youtube.com/embed/VIDEO_ID)
      const embedRegex = /youtube\.com\/embed\/([^&?]+)/
      const embedMatch = url.match(embedRegex)

      if (embedMatch && embedMatch[1]) {
        return embedMatch[1]
      }

      return null
    }

    if (url) {
      const id = extractVideoId(url)
      if (id) {
        setVideoId(id)
        setError(null)
      } else {
        setVideoId(null)
        setError("有効なYouTube URLではありません")
      }
    } else {
      setVideoId(null)
      setError(null)
    }
  }, [url])

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>
  }

  if (!videoId) {
    return <div className="text-muted-foreground text-sm">YouTubeのURLを入力してください</div>
  }

  return (
    <div className={className}>
      <iframe
        width="100%"
        height="315"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-md"
      ></iframe>
    </div>
  )
}
