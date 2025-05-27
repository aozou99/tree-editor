import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...hono]]/route';

// クライアントインスタンスを作成
export const client = hc<AppType>('/');
