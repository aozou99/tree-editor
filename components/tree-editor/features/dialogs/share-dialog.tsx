'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';
import { Copy, ExternalLink, Trash2, Edit, Eye, EyeOff } from 'lucide-react';

interface Share {
  id: string;
  treeId: string;
  shareToken: string;
  title: string;
  description?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  treeName?: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string | null;
  treeName: string;
}

export function ShareDialog({ isOpen, onClose, treeId, treeName }: ShareDialogProps) {
  const { t } = useI18n();
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create share form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Load shares when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadShares();
      setTitle(treeName); // Set default title to tree name
    }
  }, [isOpen, treeName]);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shares');
      if (!response.ok) throw new Error('Failed to load shares');
      
      const data = await response.json();
      const filteredShares = treeId ? data.shares.filter((share: Share) => share.treeId === treeId) : data.shares;
      setShares(filteredShares);
    } catch (error) {
      console.error('Failed to load shares:', error);
      toast({
        title: 'エラー',
        description: '共有リストの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createShare = async () => {
    if (!treeId || !title.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treeId,
          title: title.trim(),
          description: description.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create share');

      const newShare = await response.json();
      
      toast({
        title: '共有リンクを作成しました',
        description: 'URLをコピーして共有してください',
      });

      // Reset form
      setTitle(treeName);
      setDescription('');
      setExpiresAt('');
      
      // Reload shares
      await loadShares();
    } catch (error) {
      console.error('Failed to create share:', error);
      toast({
        title: 'エラー',
        description: '共有リンクの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleShareStatus = async (shareId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update share');

      toast({
        title: isActive ? '共有を無効にしました' : '共有を有効にしました',
      });

      await loadShares();
    } catch (error) {
      console.error('Failed to update share:', error);
      toast({
        title: 'エラー',
        description: '共有設定の更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete share');

      toast({
        title: '共有リンクを削除しました',
      });

      await loadShares();
    } catch (error) {
      console.error('Failed to delete share:', error);
      toast({
        title: 'エラー',
        description: '共有リンクの削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const copyShareUrl = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'URLをコピーしました',
      description: '共有URLがクリップボードにコピーされました',
    });
  };

  const openShareUrl = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    window.open(shareUrl, '_blank');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>ツリーを共有</DialogTitle>
          <DialogDescription>
            ツリーを他の人と共有できます。共有された人は閲覧のみ可能です。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new share form */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium">新しい共有リンクを作成</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="share-title">タイトル</Label>
                <Input
                  id="share-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="共有タイトル"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-expires">有効期限（任意）</Label>
                <Input
                  id="share-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-description">説明（任意）</Label>
              <Textarea
                id="share-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="共有の説明"
                rows={2}
              />
            </div>

            <Button 
              onClick={createShare} 
              disabled={!title.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? '作成中...' : '共有リンクを作成'}
            </Button>
          </div>

          {/* Existing shares list */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">既存の共有リンク</h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                読み込み中...
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                まだ共有リンクがありません
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>タイトル</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>有効期限</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{share.title}</div>
                            {share.description && (
                              <div className="text-sm text-muted-foreground">
                                {share.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={share.isActive ? 'default' : 'secondary'}>
                              {share.isActive ? '有効' : '無効'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleShareStatus(share.id, share.isActive)}
                            >
                              {share.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(share.createdAt)}
                        </TableCell>
                        <TableCell>
                          {share.expiresAt ? formatDate(share.expiresAt) : '無期限'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyShareUrl(share.shareToken)}
                              title="URLをコピー"
                            >
                              <Copy size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openShareUrl(share.shareToken)}
                              title="新しいタブで開く"
                            >
                              <ExternalLink size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteShare(share.id)}
                              title="削除"
                              className="text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}