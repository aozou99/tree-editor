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
    highlightedParentChildPairs: Set<string>;
    highlightedNodeIds: Set<string>;
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
    const [highlightedParentChildPairs, setHighlightedParentChildPairs] = useState<Set<string>>(new Set());
    const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
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
        setHighlightedNodeIds(nodeIds);

        // 親子関係のペアを作成（線のハイライト用）
        const pairs = new Set<string>();
        for (let i = 0; i < path.length - 1; i++) {
            const parent = path[i];
            const child = path[i + 1];
            pairs.add(`${parent.id}-${child.id}`);
        }
        setHighlightedParentChildPairs(pairs);
    };

    // 検索クエリが変更されたときに検索を実行
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setSelectedResultIndex(0);
            setHighlightedPath(new Set());
            setHighlightedParentChildPairs(new Set());
            setHighlightedNodeIds(new Set());
            setFocusMode(false);
            return;
        }

        const parsedQuery = parseSearchQuery(searchQuery.toLowerCase());
        console.log('Parsed Query:', parsedQuery);
        const results = searchTree(tree, parsedQuery, nodeTypes);
        console.log('Search Results:', results);
        setSearchResults(results);

        // 検索結果があれば最初の結果を選択し、自動的にfocusModeをtrueに設定
        if (results.length > 0) {
            setSelectedResultIndex(0);
            updateHighlightedPath(results[0].path);
            setFocusMode(true);
        } else {
            setSelectedResultIndex(0);
            setHighlightedPath(new Set());
            setHighlightedParentChildPairs(new Set());
            setHighlightedNodeIds(new Set());
            setFocusMode(false);
        }
    }, [searchQuery, tree, nodeTypes]);

    // 検索結果を選択したときの処理
    const handleSelectSearchResult = (index: number) => {
        if (index >= 0 && index < searchResults.length) {
            console.log(`検索結果選択: インデックス ${index} を選択`);
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
        // Escキーが押されたときの処理
        if (e.key === 'Escape') {
            e.preventDefault();
            setSearchQuery(''); // 検索クエリをクリア
            searchInputRef.current?.blur(); // 検索バーからフォーカスを外す
            return;
        }

        if (searchResults.length === 0) return;

        // IME入力中（日本語変換中など）のEnterキーは無視する
        if (e.nativeEvent.isComposing) {
            return;
        }

        console.log(
            `キー押下: ${e.key}, 現在のインデックス: ${selectedResultIndex}, 検索結果数: ${searchResults.length}`,
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (selectedResultIndex + 1) % searchResults.length;
            console.log(`下矢印: 次のインデックス: ${nextIndex}`);
            handleSelectSearchResult(nextIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = selectedResultIndex <= 0 ? searchResults.length - 1 : selectedResultIndex - 1;
            console.log(`上矢印: 前のインデックス: ${prevIndex}`);
            handleSelectSearchResult(prevIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
                console.log(`Enter: 選択されたインデックス: ${selectedResultIndex}`);
                // 詳細モーダルを表示するコールバックは外部から提供される必要があります
            }
        }
    };

    // 検索結果の高さを監視
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
        highlightedParentChildPairs,
        highlightedNodeIds,
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
