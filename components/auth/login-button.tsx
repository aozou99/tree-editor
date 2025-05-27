'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/utils/i18n/i18n-context';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { useCallback } from 'react';

export function LoginButton() {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();
  const { logout } = useLogout();

  // logout関数をメモ化して安定化
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 px-0" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full px-0">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={user.icon || undefined}
                alt={user.name || 'User'}
                onError={e => {
                  console.error('Avatar image failed to load:', user.icon);
                  console.error('Error event:', e);
                }}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout}>{t('auth.logout')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <form action="/api/auth/google" method="get">
      <Button variant="outline" size="sm" className="h-9">
        {t('auth.login')}
      </Button>
    </form>
  );
}
