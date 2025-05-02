'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SearchResult } from '@/components/tree-editor/types/search-types';
import { isImageUrl, isBase64Image } from '@/components/tree-editor/utils/image-utils';

interface SearchResultsProps {
    results: SearchResult[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onOpen: (result: SearchResult) => void;
    className?: string;
}

export const SearchResults = forwardRef<HTMLDivElement, SearchResultsProps>(
    ({ results, selectedIndex, onSelect, onOpen, className }, ref) => {
        // 選択された項目への参照を追加
        const selectedItemRef = useRef<HTMLDivElement>(null);

        // 選択項目が変更されたときに自動スクロール
        useEffect(() => {
            if (selectedItemRef.current && ref && typeof ref !== 'function' && ref.current) {
                const container = ref.current;
                const selectedItem = selectedItemRef.current;

                // 選択項目の位置を取得
                const itemTop = selectedItem.offsetTop;
                const itemBottom = itemTop + selectedItem.offsetHeight;

                // コンテナのスクロール位置を取得
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.offsetHeight;

                // 選択項目がコンテナの表示領域外にある場合、スクロール位置を調整
                if (itemTop < containerTop) {
                    // 選択項目が上に隠れている場合、上にスクロール
                    container.scrollTop = itemTop;
                } else if (itemBottom > containerBottom) {
                    // 選択項目が下に隠れている場合、下にスクロール
                    container.scrollTop = itemBottom - container.offsetHeight;
                }
            }
        }, [selectedIndex, ref, results]);

        return (
            <div
                ref={ref}
                className={cn(
                    'absolute z-10 mt-1 w-full bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto',
                    'divide-y divide-border',
                    className,
                )}
            >
                {results.map((result, index) => (
                    <div
                        key={`${result.node.id}-${index}`}
                        ref={index === selectedIndex ? selectedItemRef : null}
                        className={cn(
                            'px-3 py-2.5 cursor-pointer hover:bg-accent/50 flex flex-col transition-colors duration-150',
                            selectedIndex === index && 'bg-accent/80 hover:bg-accent/80',
                        )}
                        onClick={() => {
                            onSelect(index);
                            onOpen(result);
                        }}
                        onMouseEnter={() => onSelect(index)}
                    >
                        <div className='flex items-center'>
                            {result.node.icon && (
                                <span className='mr-2 flex items-center justify-center w-6 h-6 bg-background rounded-md border'>
                                    {isImageUrl(result.node.icon) || isBase64Image(result.node.icon) ? (
                                        <img
                                            src={result.node.icon || '/placeholder.svg'}
                                            alt=''
                                            className='w-4 h-4 object-cover rounded-sm'
                                        />
                                    ) : (
                                        result.node.icon
                                    )}
                                </span>
                            )}
                            <span className='font-medium'>{result.node.name}</span>
                        </div>
                        <div className='flex flex-col gap-1 mt-1.5'>
                            <div className='text-xs flex items-center'>
                                <span className='font-medium text-muted-foreground/80 inline-flex items-center'>
                                    <span className='inline-block w-1.5 h-1.5 bg-primary/60 rounded-full mr-1.5'></span>
                                    {result.matchField}:
                                </span>
                                <span className='ml-1 text-muted-foreground line-clamp-1'>{result.matchValue}</span>
                            </div>
                            <div className='text-xs text-muted-foreground/80 flex items-center'>
                                <span className='inline-block w-1.5 h-1.5 bg-secondary/70 rounded-full mr-1.5'></span>
                                <span className='line-clamp-1'>{result.path.map((node) => node.name).join(' > ')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    },
);

SearchResults.displayName = 'SearchResults';
