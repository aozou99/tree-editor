'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { client } from '@/lib/api-client';
import type { AuthResponse } from '@/types/auth';

// fetcher関数を外部で定義して安定化
const authFetcher = async (): Promise<AuthResponse> => {
  const response = await client.api.auth.user.$get();
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return await response.json();
};

// SWRオプションを定数として定義
const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1分間キャッシュ
} as const;

export const useAuth = () => {
  const { data, error, mutate, isLoading } = useSWR<AuthResponse>(
    '/api/auth/user',
    authFetcher,
    SWR_OPTIONS
  );

  return {
    user: data?.user ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
};

export const useLogout = () => {
  const { mutate } = useSWR('/api/auth/user');

  const logout = useCallback(async () => {
    try {
      const response = await client.api.auth.logout.$post();
      if (response.ok) {
        // キャッシュをクリアしてユーザー情報を無効化
        await mutate({ user: null }, false);
        // ページをリロードしてセッションをクリア
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [mutate]);

  return { logout };
};
