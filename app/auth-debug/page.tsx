'use client';

import { useAuth } from '@/hooks/use-auth';

export default function AuthDebugPage() {
  const { user, isLoading, isError } = useAuth();

  if (isLoading) {
    return <div className="p-4">Loading auth status...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error loading auth status</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">認証デバッグページ</h1>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">認証状態</h2>
        <pre className="text-sm">{JSON.stringify({ user, isLoading, isError }, null, 2)}</pre>
      </div>

      <div className="space-y-2">
        <p>
          <strong>ユーザー:</strong> {user ? user.name : 'ログインしていません'}
        </p>
        <p>
          <strong>アイコン:</strong> {user?.icon || 'なし'}
        </p>
        <p>
          <strong>ID:</strong> {user?.id || 'なし'}
        </p>
      </div>

      {!user && (
        <div className="bg-blue-100 p-4 rounded">
          <p>ログインボタンから認証してください。</p>
        </div>
      )}
    </div>
  );
}
