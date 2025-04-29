'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import type { TreeNode, NodeType } from '../types';
import type { SearchResult } from '../types/search-types';
import { parseSearchQuery, searchTree } from '../utils/search-utils';

export interface UseSearchProps {
    tree: TreeNode[];
    nodeTypes: NodeType[];
}

export interface UseSearchReturn {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: SearchResult[];
    selectedResultIndex: number;
    highlightedPath: Set<string>;
    focusMode: boolean;
    searchInputRef: React.RefObject<HTMLInputElement>;
    searchResultsRef: React.RefObject<HTMLDivElement>;
    searchResultsHeight: number;
    isSearchFocused: boolean;
    setIsSearchFocused: (focused: boolean) => void;
    handleSelectSearchResult: (index: number) => void;
    handleOpenDetailModal: (result: SearchResult) => void;
    handleSearchKeyDown: (e: React.KeyboardEvent) => void;
    updateHighlightedPath: (path: TreeNode[]) => void;
    setFocusMode: (mode: boolean) => void;
}

export function useSearch({ tree, nodeTypes }: UseSearchProps): UseSearchReturn {
    // 検索機能用の状態
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
    const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
    const [focusMode, setFocusMode] = useState<boolean>(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchResultsRef = useRef<HTMLDivElement>(null);
    const [searchResultsHeight, setSearchResultsHeight] = useState<number>(0);
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

    // ハイライトされたパスを更新する関数
    const updateHighlightedPath = (path: TreeNode[]) => {
        // ノードIDのセットを作成
        const nodeIds = new Set(path.map((node) => node.id));
        setHighlightedPath(nodeIds);
    };

    // 検索クエリが変更されたときに検索を実行
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setSelectedResultIndex(0);
            setHighlightedPath(new Set());
            setFocusMode(false);
            return;
        }

        const parsedQuery = parseSearchQuery(searchQuery.toLowerCase());
        const results = searchTree(tree, parsedQuery, nodeTypes);
        setSearchResults(results);

        // 検索結果があれば最初の結果を選択し、自動的にfocusModeをtrueに設定
        if (results.length > 0) {
            setSelectedResultIndex(0);
            updateHighlightedPath(results[0].path);
            setFocusMode(true);
        } else {
            setSelectedResultIndex(0);
            setHighlightedPath(new Set());
            setFocusMode(false);
        }
    }, [searchQuery, tree, nodeTypes]);

    // 検索結果を選択したときの処理
    const handleSelectSearchResult = (index: number) => {
        if (index >= 0 && index < searchResults.length) {
            setSelectedResultIndex(index);
            const result = searchResults[index];
            updateHighlightedPath(result.path);
        }
    };

    // 検索結果をクリックまたはEnterキーで詳細モーダルを表示
    const handleOpenDetailModal = (result: SearchResult) => {
        // 検索状態をリセット
        setFocusMode(false);
        setSearchQuery('');
        setIsSearchFocused(false);
        // 選択したノードをハイライト
        updateHighlightedPath(result.path);
    };

    // キーボードイベントの処理関数
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setSearchQuery('');
            searchInputRef.current?.blur();
            return;
        }
        if (searchResults.length === 0) return;
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (selectedResultIndex + 1) % searchResults.length;
            handleSelectSearchResult(nextIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = selectedResultIndex <= 0 ? searchResults.length - 1 : selectedResultIndex - 1;
            handleSelectSearchResult(prevIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // 詳細モーダルを表示するコールバックは外部から提供される必要があります
        }
    };

    useEffect(() => {
        if (searchResultsRef.current && searchResults.length > 0) {
            const height = searchResultsRef.current.getBoundingClientRect().height;
            setSearchResultsHeight(height);
        } else {
            setSearchResultsHeight(0);
        }
    }, [searchResults, selectedResultIndex]);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        selectedResultIndex,
        highlightedPath,
        focusMode,
        searchInputRef,
        searchResultsRef,
        searchResultsHeight,
        isSearchFocused,
        setIsSearchFocused,
        handleSelectSearchResult,
        handleOpenDetailModal,
        handleSearchKeyDown,
        updateHighlightedPath,
        setFocusMode,
    };
}
