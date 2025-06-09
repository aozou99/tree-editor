'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageManager } from '@/lib/storage/storage-manager';

interface CompressionStats {
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionCount: number;
  averageRatio: number;
  totalSavings: number;
  savingsPercentage: number;
}

export function CompressionDebug() {
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const refreshStats = () => {
    try {
      const currentStats = storageManager.getCompressionStats();
      setStats(currentStats);
    } catch (error) {
      console.error('Failed to get compression stats:', error);
    }
  };

  const resetStats = () => {
    try {
      storageManager.resetCompressionStats();
      refreshStats();
    } catch (error) {
      console.error('Failed to reset compression stats:', error);
    }
  };

  const toggleCompression = () => {
    try {
      const currentlyEnabled = stats && stats.compressionCount > 0;
      storageManager.setCompressionEnabled(!currentlyEnabled);
      refreshStats();
    } catch (error) {
      console.error('Failed to toggle compression:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      refreshStats();
      const interval = setInterval(refreshStats, 2000); // 2秒ごとに更新
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  // 開発環境でのみ表示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          📊 圧縮統計
        </Button>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">圧縮統計</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats && stats.compressionCount > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="font-medium">圧縮回数</div>
                  <Badge variant="secondary">{stats.compressionCount}</Badge>
                </div>
                <div>
                  <div className="font-medium">平均圧縮率</div>
                  <Badge variant="secondary">{formatPercentage((1 - stats.averageRatio) * 100)}</Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>元のサイズ:</span>
                  <span className="font-mono">{formatBytes(stats.totalOriginalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>圧縮後サイズ:</span>
                  <span className="font-mono">{formatBytes(stats.totalCompressedSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>節約量:</span>
                  <span className="font-mono text-green-600">
                    {formatBytes(stats.totalSavings)} ({formatPercentage(stats.savingsPercentage)})
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={refreshStats} variant="outline" size="sm" className="text-xs">
                  更新
                </Button>
                <Button onClick={resetStats} variant="outline" size="sm" className="text-xs">
                  リセット
                </Button>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              圧縮データがありません。クラウド保存を実行してください。
            </div>
          )}
          
          <div className="border-t pt-2">
            <Button onClick={refreshStats} variant="outline" size="sm" className="w-full text-xs">
              統計更新
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}