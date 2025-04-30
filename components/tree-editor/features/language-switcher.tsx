'use client';

import { Button } from '@/components/ui/button';
import { useI18n, type Locale } from '@/utils/i18n/i18n-context';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
    const { locale, changeLocale } = useI18n();

    const languages: { value: Locale; label: string }[] = [
        { value: 'ja', label: '日本語' },
        { value: 'en', label: 'English' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='h-9 px-2 sm:px-3 gap-1'>
                    <Globe size={16} className='mr-1' />
                    <span className='hidden sm:inline'>{locale === 'ja' ? '日本語' : 'English'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.value}
                        onClick={() => changeLocale(lang.value)}
                        className={locale === lang.value ? 'bg-muted' : ''}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
