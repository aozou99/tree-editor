'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  const swrConfig = useMemo(
    () => ({
      // デフォルトのフェッチャー設定
      fetcher: (resource: string, init?: RequestInit) =>
        fetch(resource, init).then(res => res.json()),
      // エラー時の再試行設定
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // フォーカス時の再検証を無効化
      revalidateOnFocus: false,
      // リコネクト時の再検証を有効化
      revalidateOnReconnect: true,
      // 重複排除の間隔
      dedupingInterval: 60000,
    }),
    []
  );

  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
