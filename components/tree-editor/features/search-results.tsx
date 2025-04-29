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
                    'absolute z-10 mt-1 w-full bg-white border rounded-md shadow-md max-h-60 overflow-y-auto',
                    className,
                )}
            >
                {results.map((result, index) => (
                    <div
                        key={`${result.node.id}-${index}`}
                        ref={index === selectedIndex ? selectedItemRef : null}
                        className={cn(
                            'px-3 py-2 cursor-pointer hover:bg-muted/50 flex flex-col',
                            selectedIndex === index && 'bg-blue-100 hover:bg-blue-100',
                        )}
                        onClick={() => {
                            onSelect(index);
                            onOpen(result);
                        }}
                        onMouseEnter={() => onSelect(index)}
                    >
                        <div className='flex items-center'>
                            {result.node.icon && (
                                <span className='mr-2'>
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
                        <div className='text-xs text-muted-foreground mt-1'>
                            <span className='font-medium'>{result.matchField}:</span> {result.matchValue}
                        </div>
                        <div className='text-xs text-muted-foreground mt-1'>
                            パス: {result.path.map((node) => node.name).join(' > ')}
                        </div>
                    </div>
                ))}
            </div>
        );
    },
);

SearchResults.displayName = 'SearchResults';
