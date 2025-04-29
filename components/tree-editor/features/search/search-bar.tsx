'use client';

import { useState, forwardRef } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useI18n } from '@/utils/i18n/i18n-context';

interface SearchBarProps {
    searchQuery: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
    inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * 検索バーコンポーネント
 * 検索入力欄とヘルプボタン、検索ヘルプを表示するコンポーネント
 */
const SearchBar = forwardRef<HTMLDivElement, SearchBarProps>(
    ({ searchQuery, onChange, onKeyDown, onFocus, onBlur, inputRef }, ref) => {
        const [isSearchHelpOpen, setIsSearchHelpOpen] = useState<boolean>(false);
        const { t } = useI18n();

        return (
            <div ref={ref}>
                <div className='relative flex items-center'>
                    <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                        ref={inputRef}
                        value={searchQuery}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        onFocus={onFocus}
                        onBlur={() => {
                            setTimeout(onBlur, 200);
                        }}
                        placeholder={t('search.placeholder')}
                        className='pl-8 pr-10'
                    />
                    <Button
                        variant='ghost'
                        size='icon'
                        className='absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7'
                        onClick={() => setIsSearchHelpOpen(true)}
                        aria-label={t('search.help.title')}
                    >
                        <HelpCircle size={16} />
                    </Button>
                </div>

                {/* 検索ヘルプダイアログ */}
                <Dialog open={isSearchHelpOpen} onOpenChange={setIsSearchHelpOpen}>
                    <DialogContent className='max-w-lg'>
                        <DialogHeader>
                            <DialogTitle>{t('search.help.title')}</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-4 mt-2'>
                            <div>
                                <p className='font-medium'>{t('search.help.basicSearch.title')}</p>
                                <p className='text-xs text-muted-foreground'>
                                    {t('search.help.basicSearch.description')}
                                </p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>
                                    {t('search.help.basicSearch.example')}
                                </p>
                            </div>
                            <div>
                                <p className='font-medium'>{t('search.help.typeSearch.title')}</p>
                                <p className='text-xs text-muted-foreground'>
                                    {t('search.help.typeSearch.description')}
                                </p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>
                                    {t('search.help.typeSearch.example')}
                                </p>
                            </div>
                            <div>
                                <p className='font-medium'>{t('search.help.fieldSearch.title')}</p>
                                <p className='text-xs text-muted-foreground'>
                                    {t('search.help.fieldSearch.description')}
                                </p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>
                                    {t('search.help.fieldSearch.example')}
                                </p>
                            </div>
                            <div>
                                <p className='font-medium'>{t('search.help.combinedSearch.title')}</p>
                                <p className='text-xs text-muted-foreground'>
                                    {t('search.help.combinedSearch.description')}
                                </p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>
                                    {t('search.help.combinedSearch.example')}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant='outline' onClick={() => setIsSearchHelpOpen(false)}>
                                {t('common.close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    },
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
