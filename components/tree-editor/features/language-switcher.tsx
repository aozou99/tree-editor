'use client';

import { Button } from '@/components/ui/button';
import { useI18n, type Locale } from '@/utils/i18n/i18n-context';
import { Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { locale, changeLocale } = useI18n();

  const languages: { value: Locale; label: string; flag: string }[] = [
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
  ];

  // 現在の言語の国旗を取得
  const currentLanguage = languages.find(lang => lang.value === locale);
  const currentFlag = currentLanguage?.flag || '🌐';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-2 flex items-center gap-1">
          <span className="text-base">{currentFlag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => changeLocale(lang.value)}
            className={`flex items-center justify-between ${
              locale === lang.value ? 'bg-muted' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
            {locale === lang.value && <Check size={16} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
