'use client';

import { useState, forwardRef } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/utils/i18n/i18n-context';

interface SearchBarProps {
    searchQuery: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
    inputRef?: React.RefObject<HTMLInputElement>;
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
                            // 少し遅延させてクリックイベントが先に処理されるようにする
                            setTimeout(onBlur, 200);
                        }}
                        placeholder={t('search.placeholder')}
                        className='pl-8 pr-10'
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7'
                                    onClick={() => setIsSearchHelpOpen(!isSearchHelpOpen)}
                                >
                                    <HelpCircle size={16} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side='bottom' className='w-80 p-3'>
                                <div className='space-y-2'>
                                    <h3 className='font-semibold'>検索構文</h3>
                                    <ul className='text-xs space-y-1'>
                                        <li>
                                            <span className='font-medium'>通常検索:</span> テキストをそのまま入力
                                        </li>
                                        <li>
                                            <span className='font-medium'>ノードタイプ検索:</span> type:タイプ名
                                        </li>
                                        <li>
                                            <span className='font-medium'>フィールド検索:</span> フィールド名:値
                                        </li>
                                        <li>
                                            <span className='font-medium'>複合検索:</span> type:社員 部署:営業部 鈴木
                                        </li>
                                    </ul>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {isSearchHelpOpen && (
                    <div className='mt-2 p-3 bg-muted/30 rounded-md text-sm'>
                        <h3 className='font-semibold mb-2'>検索ヘルプ</h3>
                        <div className='space-y-2'>
                            <div>
                                <p className='font-medium'>基本検索</p>
                                <p className='text-xs text-muted-foreground'>
                                    ノード名、サムネイル、フィールド値を検索します。
                                </p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: 鈴木</p>
                            </div>
                            <div>
                                <p className='font-medium'>ノードタイプ検索</p>
                                <p className='text-xs text-muted-foreground'>特定のノードタイプを検索します。</p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: type:社員</p>
                            </div>
                            <div>
                                <p className='font-medium'>フィールド検索</p>
                                <p className='text-xs text-muted-foreground'>特定のフィールドの値を検索します。</p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: 部署:営業部</p>
                            </div>
                            <div>
                                <p className='font-medium'>複合検索</p>
                                <p className='text-xs text-muted-foreground'>複数の条件を組み合わせて検索します。</p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: type:社員 部署:営業部 鈴木</p>
                            </div>
                        </div>
                        <Button
                            variant='outline'
                            size='sm'
                            className='mt-2 w-full'
                            onClick={() => setIsSearchHelpOpen(false)}
                        >
                            閉じる
                        </Button>
                    </div>
                )}
            </div>
        );
    },
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
