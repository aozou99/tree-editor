'use client';

import { SearchResults } from '../search-results';
import SearchBar from './search-bar';
import type { SearchResult } from '@/components/tree-editor/types/search-types';

interface SearchFeatureProps {
    searchQuery: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    searchResults: SearchResult[];
    selectedResultIndex: number;
    onSelectResult: (index: number) => void;
    onOpenResult: (result: SearchResult) => void;
    searchResultsRef?: React.RefObject<HTMLDivElement | null>;
    isSearchFocused: boolean;
    searchResultsHeight?: number;
}

/**
 * 検索機能UIコンポーネント（状態レス）
 */
export default function SearchFeature({
    searchQuery,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    inputRef,
    searchResults,
    selectedResultIndex,
    onSelectResult,
    onOpenResult,
    searchResultsRef,
    isSearchFocused,
}: SearchFeatureProps) {
    return (
        <div className='relative w-full'>
            <SearchBar
                searchQuery={searchQuery}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                inputRef={inputRef}
            />
            {isSearchFocused && searchResults.length > 0 && (
                <SearchResults
                    ref={searchResultsRef}
                    results={searchResults}
                    selectedIndex={selectedResultIndex}
                    onSelect={onSelectResult}
                    onOpen={onOpenResult}
                    className='max-h-[300px] overflow-y-auto'
                />
            )}
        </div>
    );
}
