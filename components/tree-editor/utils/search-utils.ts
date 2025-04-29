import type { TreeNode, NodeType } from '../types';
import type { ParsedQuery, SearchResult } from '../types/search-types';

// 検索クエリをパースする関数
export const parseSearchQuery = (query: string): ParsedQuery => {
    const result: ParsedQuery = {
        text: '',
        fields: {},
    };

    // クエリが空の場合は早期リターン
    if (!query.trim()) return result;

    try {
        // 正規表現でフィールド指定を検出
        let remainingQuery = query;

        // type:xxx の形式を検出
        const typeMatch = remainingQuery.match(/type:([^\s]+)/);
        if (typeMatch) {
            result.type = typeMatch[1];
            remainingQuery = remainingQuery.replace(typeMatch[0], '').trim();
        }

        // フィールド:値 の形式を検出
        const fieldPattern = /([^:\s]+):([^\s]+)/g;
        let fieldMatch;
        while ((fieldMatch = fieldPattern.exec(query)) !== null) {
            const fieldName = fieldMatch[1];
            const fieldValue = fieldMatch[2];

            if (fieldName !== 'type') {
                // type は既に処理済み
                result.fields[fieldName] = fieldValue;
            }
        }

        // 残りのテキストをトリミングして保存
        // フィールド検索パターンを除去
        Object.keys(result.fields).forEach((fieldName) => {
            const pattern = new RegExp(`${fieldName}:${result.fields[fieldName]}`, 'g');
            remainingQuery = remainingQuery.replace(pattern, '').trim();
        });

        result.text = remainingQuery.trim();

        return result;
    } catch (error) {
        console.error('検索クエリの解析エラー:', error);
        return result;
    }
};

// ノードタイプの情報を取得
export const getNodeTypeInfo = (nodeTypes: NodeType[], nodeTypeId?: string) => {
    if (!nodeTypeId) return null;
    return nodeTypes.find((type) => type.id === nodeTypeId) || null;
};

// ツリーを検索する関数
export const searchTree = (nodes: TreeNode[], parsedQuery: ParsedQuery, nodeTypes: NodeType[]): SearchResult[] => {
    const results: SearchResult[] = [];

    const searchNode = (node: TreeNode, currentPath: TreeNode[]) => {
        let matches = true;
        let matchField = '';
        let matchValue = '';

        // ノードタイプで検索
        if (parsedQuery.type) {
            const nodeTypeInfo = getNodeTypeInfo(nodeTypes, node.nodeType);
            if (!nodeTypeInfo || !nodeTypeInfo.name.toLowerCase().includes(parsedQuery.type.toLowerCase())) {
                matches = false;
            } else {
                matchField = 'ノードタイプ';
                matchValue = nodeTypeInfo.name;
            }
        }

        // フィールドで検索
        if (matches && Object.keys(parsedQuery.fields).length > 0) {
            const customFields = node.customFields || [];

            for (const [fieldName, fieldValue] of Object.entries(parsedQuery.fields)) {
                // フィールド名の一致をより柔軟に
                const field = customFields.find(
                    (f) =>
                        f.name.toLowerCase().includes(fieldName.toLowerCase()) &&
                        f.value.toLowerCase().includes(fieldValue.toLowerCase()),
                );

                if (!field) {
                    matches = false;
                    break;
                } else {
                    matchField = field.name;
                    matchValue = field.value;
                }
            }
        }

        // テキスト検索（ノード名、サムネイル、カスタムフィールド）
        if (matches && parsedQuery.text) {
            const textQuery = parsedQuery.text.toLowerCase();
            let textMatches = false;

            // ノード名を検索
            if (node.name.toLowerCase().includes(textQuery)) {
                textMatches = true;
                matchField = 'ノード名';
                matchValue = node.name;
            }

            // サムネイルを検索（絵文字の場合）
            if (!textMatches && node.icon && !node.icon.startsWith('http') && node.icon.includes(textQuery)) {
                textMatches = true;
                matchField = 'アイコン';
                matchValue = node.icon;
            }

            // カスタムフィールドを検索
            if (!textMatches && node.customFields) {
                for (const field of node.customFields) {
                    if (field.name.toLowerCase().includes(textQuery) || field.value.toLowerCase().includes(textQuery)) {
                        textMatches = true;
                        matchField = field.name;
                        matchValue = field.value;
                        break;
                    }
                }
            }

            matches = textMatches;
        }

        // 検索条件に一致した場合、結果に追加
        if (matches) {
            results.push({
                node,
                path: [...currentPath, node],
                matchField,
                matchValue,
            });
        }

        // 子ノードを再帰的に検索
        for (const child of node.children) {
            searchNode(child, [...currentPath, node]);
        }
    };

    // ルートノードから検索開始
    for (const rootNode of nodes) {
        searchNode(rootNode, []);
    }

    return results;
};

// ノードがハイライトパスに含まれているかチェック
export const isNodeInHighlightedPath = (node: TreeNode, highlightedNodeIds: Set<string>): boolean => {
    return highlightedNodeIds.has(node.id);
};

// ノードの子孫にハイライトされたノードが含まれているかチェック
export const hasHighlightedDescendant = (node: TreeNode, highlightedNodeIds: Set<string>): boolean => {
    // 自分自身がハイライトされている場合
    if (isNodeInHighlightedPath(node, highlightedNodeIds)) return true;

    // 子ノードを再帰的にチェック
    for (const child of node.children) {
        if (hasHighlightedDescendant(child, highlightedNodeIds)) return true;
    }

    return false;
};

// パスに含まれるノードを展開する関数
export const expandNodesInPath = (nodes: TreeNode[], path: TreeNode[]): TreeNode[] => {
    return nodes.map((node) => {
        if (path.some((pathNode) => pathNode.id === node.id)) {
            // このノードがパスに含まれる場合は展開
            return {
                ...node,
                isExpanded: true,
                children: expandNodesInPath(node.children, path),
            };
        } else if (node.children.some((child) => path.some((pathNode) => pathNode.id === child.id))) {
            // 子ノードがパスに含まれる場合も展開
            return {
                ...node,
                isExpanded: true,
                children: expandNodesInPath(node.children, path),
            };
        } else {
            // それ以外は子ノードだけ再帰的に処理
            return {
                ...node,
                children: expandNodesInPath(node.children, path),
            };
        }
    });
};
