import { TreeNode, NodeType } from '@/components/tree-editor/types';

// サンプルの種類を定義
export type SampleType = 'organization' | 'rockbands' | 'tokugawa' | 'company';

// サンプルデータのインターフェース
export interface SampleData {
    id: SampleType;
    name: string;
    description: string;
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
}

// 組織図サンプル（既存のデータ）
export const organizationSample: SampleData = {
    id: 'organization',
    name: '組織図サンプル',
    description: '基本的な会社組織図のサンプルです',
    treeTitle: '組織図',
    nodeTypes: [
        {
            id: 'type-folder',
            name: 'フォルダ',
            icon: '📁',
            fieldDefinitions: [
                { id: 'field-desc', name: '説明', type: 'textarea', required: false },
                { id: 'field-created', name: '作成日', type: 'text', required: false },
            ],
        },
        {
            id: 'type-document',
            name: 'ドキュメント',
            icon: '📄',
            fieldDefinitions: [
                { id: 'field-status', name: 'ステータス', type: 'text', required: true },
                { id: 'field-due', name: '期限', type: 'text', required: false },
                { id: 'field-notes', name: 'メモ', type: 'textarea', required: false },
            ],
        },
        {
            id: 'type-employee',
            name: '社員',
            icon: '👤',
            fieldDefinitions: [
                { id: 'field-department', name: '部署', type: 'text', required: true },
                { id: 'field-position', name: '役職', type: 'text', required: true },
                { id: 'field-email', name: 'メールアドレス', type: 'text', required: false },
                { id: 'field-bio', name: '自己紹介', type: 'textarea', required: false },
            ],
        },
    ],
    tree: [
        {
            id: '1',
            name: '組織図',
            isExpanded: true,
            icon: '📁',
            nodeType: 'type-folder',
            customFields: [
                { id: 'cf1', name: '説明', value: '会社の組織構造', type: 'textarea' },
                { id: 'cf2', name: '作成日', value: '2023/04/01', type: 'text' },
            ],
            children: [
                {
                    id: '2',
                    name: '営業部',
                    isExpanded: true,
                    icon: '🗂️',
                    nodeType: 'type-folder',
                    customFields: [{ id: 'cf3', name: '説明', value: '営業部門のフォルダ', type: 'textarea' }],
                    children: [
                        {
                            id: '3',
                            name: '鈴木一郎',
                            icon: '👤',
                            nodeType: 'type-employee',
                            children: [],
                            customFields: [
                                { id: 'cf4', name: '部署', value: '営業部', type: 'text' },
                                { id: 'cf5', name: '役職', value: '部長', type: 'text' },
                                { id: 'cf6', name: 'メールアドレス', value: 'suzuki@example.com', type: 'text' },
                            ],
                        },
                        {
                            id: '4',
                            name: '営業報告書',
                            icon: '📄',
                            nodeType: 'type-document',
                            children: [],
                            customFields: [
                                { id: 'cf7', name: 'ステータス', value: '完了', type: 'text' },
                                { id: 'cf8', name: '期限', value: '2023/12/31', type: 'text' },
                                { id: 'cf9', name: 'メモ', value: '第3四半期の営業報告書', type: 'textarea' },
                            ],
                        },
                    ],
                },
                {
                    id: '5',
                    name: '開発部',
                    icon: '🗂️',
                    nodeType: 'type-folder',
                    children: [
                        {
                            id: '6',
                            name: '佐藤次郎',
                            icon: '👤',
                            nodeType: 'type-employee',
                            children: [],
                            customFields: [
                                { id: 'cf10', name: '部署', value: '開発部', type: 'text' },
                                { id: 'cf11', name: '役職', value: 'マネージャー', type: 'text' },
                                { id: 'cf12', name: 'メールアドレス', value: 'sato@example.com', type: 'text' },
                                {
                                    id: 'cf13',
                                    name: '自己紹介',
                                    value: 'Webアプリケーション開発を担当しています。',
                                    type: 'textarea',
                                },
                            ],
                        },
                    ],
                    customFields: [{ id: 'cf14', name: '説明', value: '開発部門のフォルダ', type: 'textarea' }],
                },
            ],
        },
    ],
};

// ロックバンド分類図サンプル
export const rockBandsSample: SampleData = {
    id: 'rockbands',
    name: 'ロックバンド分類図',
    description: '年代ごとのロックバンドの分類を示すサンプルです',
    treeTitle: 'ロックバンド分類図',
    nodeTypes: [
        {
            id: 'type-era',
            name: '年代',
            icon: '📅',
            fieldDefinitions: [
                { id: 'field-desc', name: '説明', type: 'textarea', required: false },
                { id: 'field-years', name: '期間', type: 'text', required: true },
            ],
        },
        {
            id: 'type-genre',
            name: 'ジャンル',
            icon: '🎵',
            fieldDefinitions: [
                { id: 'field-desc', name: '説明', type: 'textarea', required: false },
                { id: 'field-characteristics', name: '特徴', type: 'textarea', required: false },
            ],
        },
        {
            id: 'type-band',
            name: 'バンド',
            icon: '🎸',
            fieldDefinitions: [
                { id: 'field-formed', name: '結成年', type: 'text', required: true },
                { id: 'field-members', name: 'メンバー', type: 'textarea', required: false },
                { id: 'field-hits', name: '代表曲', type: 'textarea', required: false },
                { id: 'field-link', name: '公式サイト', type: 'link', required: false },
                { id: 'field-youtube', name: '代表曲動画', type: 'youtube', required: false },
            ],
        },
    ],
    tree: [
        {
            id: 'rb1',
            name: 'ロックの歴史',
            isExpanded: true,
            icon: '🎵',
            children: [
                {
                    id: 'rb2',
                    name: '1960年代',
                    isExpanded: true,
                    icon: '📅',
                    nodeType: 'type-era',
                    customFields: [
                        {
                            id: 'rb-cf1',
                            name: '説明',
                            value: 'ロックンロールからハードロックへの発展期',
                            type: 'textarea',
                        },
                        { id: 'rb-cf2', name: '期間', value: '1960-1969', type: 'text' },
                    ],
                    children: [
                        {
                            id: 'rb3',
                            name: 'サイケデリック・ロック',
                            icon: '🎵',
                            nodeType: 'type-genre',
                            customFields: [
                                {
                                    id: 'rb-cf3',
                                    name: '説明',
                                    value: '幻覚剤の影響を受けた実験的な音楽',
                                    type: 'textarea',
                                },
                                {
                                    id: 'rb-cf4',
                                    name: '特徴',
                                    value: '長いインプロビゼーション、エフェクト多用',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'rb4',
                                    name: 'ピンク・フロイド',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf5', name: '結成年', value: '1965', type: 'text' },
                                        {
                                            id: 'rb-cf6',
                                            name: 'メンバー',
                                            value: 'シド・バレット、ロジャー・ウォーターズ、デヴィッド・ギルモア、リチャード・ライト、ニック・メイスン',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf7',
                                            name: '代表曲',
                                            value: 'Another Brick in the Wall, Comfortably Numb, Wish You Were Here',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf8',
                                            name: '公式サイト',
                                            value: 'https://www.pinkfloyd.com/',
                                            type: 'link',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                        {
                            id: 'rb5',
                            name: 'ブリティッシュ・ロック',
                            icon: '🎵',
                            nodeType: 'type-genre',
                            customFields: [
                                {
                                    id: 'rb-cf9',
                                    name: '説明',
                                    value: 'イギリス発のロックムーブメント',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'rb6',
                                    name: 'ザ・ビートルズ',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf10', name: '結成年', value: '1960', type: 'text' },
                                        {
                                            id: 'rb-cf11',
                                            name: 'メンバー',
                                            value: 'ジョン・レノン、ポール・マッカートニー、ジョージ・ハリスン、リンゴ・スター',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf12',
                                            name: '代表曲',
                                            value: 'Hey Jude, Let It Be, Yesterday',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                                {
                                    id: 'rb7',
                                    name: 'ザ・ローリング・ストーンズ',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf13', name: '結成年', value: '1962', type: 'text' },
                                        {
                                            id: 'rb-cf14',
                                            name: 'メンバー',
                                            value: 'ミック・ジャガー、キース・リチャーズ、ロン・ウッド、チャーリー・ワッツ',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf15',
                                            name: '代表曲',
                                            value: "(I Can't Get No) Satisfaction, Paint It Black",
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'rb8',
                    name: '1970年代',
                    isExpanded: true,
                    icon: '📅',
                    nodeType: 'type-era',
                    customFields: [
                        {
                            id: 'rb-cf16',
                            name: '説明',
                            value: 'ハードロック、プログレッシブロックの黄金期',
                            type: 'textarea',
                        },
                        { id: 'rb-cf17', name: '期間', value: '1970-1979', type: 'text' },
                    ],
                    children: [
                        {
                            id: 'rb9',
                            name: 'ハードロック',
                            icon: '🎵',
                            nodeType: 'type-genre',
                            customFields: [
                                {
                                    id: 'rb-cf18',
                                    name: '説明',
                                    value: 'より重厚なサウンドと攻撃的な演奏',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'rb10',
                                    name: 'レッド・ツェッペリン',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf19', name: '結成年', value: '1968', type: 'text' },
                                        {
                                            id: 'rb-cf20',
                                            name: 'メンバー',
                                            value: 'ジミー・ペイジ、ロバート・プラント、ジョン・ポール・ジョーンズ、ジョン・ボーナム',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf21',
                                            name: '代表曲',
                                            value: 'Stairway to Heaven, Kashmir, Whole Lotta Love',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                                {
                                    id: 'rb11',
                                    name: 'ディープ・パープル',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf22', name: '結成年', value: '1968', type: 'text' },
                                        {
                                            id: 'rb-cf23',
                                            name: 'メンバー',
                                            value: 'リッチー・ブラックモア、イアン・ギラン、ロジャー・グローヴァー、ジョン・ロード、イアン・ペイス',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf24',
                                            name: '代表曲',
                                            value: 'Smoke on the Water, Highway Star',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                        {
                            id: 'rb12',
                            name: 'プログレッシブ・ロック',
                            icon: '🎵',
                            nodeType: 'type-genre',
                            customFields: [
                                {
                                    id: 'rb-cf25',
                                    name: '説明',
                                    value: '複雑な構成と高度な演奏技術を特徴とするロック',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'rb13',
                                    name: 'イエス',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf26', name: '結成年', value: '1968', type: 'text' },
                                        {
                                            id: 'rb-cf27',
                                            name: 'メンバー',
                                            value: 'ジョン・アンダーソン、スティーブ・ハウ、クリス・スクワイア、リック・ウェイクマン、アラン・ホワイト',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf28',
                                            name: '代表曲',
                                            value: 'Roundabout, Owner of a Lonely Heart',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'rb14',
                    name: '1980年代',
                    icon: '📅',
                    nodeType: 'type-era',
                    customFields: [
                        { id: 'rb-cf29', name: '説明', value: 'ヘヴィメタルとニューウェーブの時代', type: 'textarea' },
                        { id: 'rb-cf30', name: '期間', value: '1980-1989', type: 'text' },
                    ],
                    children: [
                        {
                            id: 'rb15',
                            name: 'ヘヴィメタル',
                            icon: '🎵',
                            nodeType: 'type-genre',
                            customFields: [
                                {
                                    id: 'rb-cf31',
                                    name: '説明',
                                    value: 'より重く、速く、攻撃的なロック',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'rb16',
                                    name: 'メタリカ',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf32', name: '結成年', value: '1981', type: 'text' },
                                        {
                                            id: 'rb-cf33',
                                            name: 'メンバー',
                                            value: 'ジェイムズ・ヘットフィールド、ラーズ・ウルリッヒ、カーク・ハメット、ロバート・トゥルージロ',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf34',
                                            name: '代表曲',
                                            value: 'Enter Sandman, Master of Puppets, Nothing Else Matters',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                                {
                                    id: 'rb17',
                                    name: 'アイアン・メイデン',
                                    icon: '🎸',
                                    nodeType: 'type-band',
                                    customFields: [
                                        { id: 'rb-cf35', name: '結成年', value: '1975', type: 'text' },
                                        {
                                            id: 'rb-cf36',
                                            name: 'メンバー',
                                            value: 'ブルース・ディッキンソン、スティーブ・ハリス、デイヴ・マーレイ、エイドリアン・スミス、ニコ・マクブレイン、ヤニック・ガーズ',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'rb-cf37',
                                            name: '代表曲',
                                            value: 'The Trooper, Run to the Hills, Fear of the Dark',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

// 江戸時代の将軍サンプル
export const tokugawaSample: SampleData = {
    id: 'tokugawa',
    name: '江戸時代将軍系図',
    description: '江戸時代の徳川将軍家の系図を示すサンプルです',
    treeTitle: '徳川将軍家系図',
    nodeTypes: [
        {
            id: 'type-shogun',
            name: '将軍',
            icon: '👑',
            fieldDefinitions: [
                { id: 'field-birth', name: '生年', type: 'text', required: true },
                { id: 'field-death', name: '没年', type: 'text', required: true },
                { id: 'field-period', name: '在位期間', type: 'text', required: true },
                { id: 'field-achievements', name: '主な業績', type: 'textarea', required: false },
                { id: 'field-image', name: '肖像画', type: 'image', required: false },
            ],
        },
        {
            id: 'type-era',
            name: '時代区分',
            icon: '📜',
            fieldDefinitions: [
                { id: 'field-period', name: '期間', type: 'text', required: true },
                { id: 'field-desc', name: '特徴', type: 'textarea', required: false },
            ],
        },
        {
            id: 'type-event',
            name: '重要事件',
            icon: '⚔️',
            fieldDefinitions: [
                { id: 'field-date', name: '発生年', type: 'text', required: true },
                { id: 'field-desc', name: '詳細', type: 'textarea', required: false },
                { id: 'field-impact', name: '影響', type: 'textarea', required: false },
            ],
        },
    ],
    tree: [
        {
            id: 'tk1',
            name: '江戸幕府',
            isExpanded: true,
            icon: '🏯',
            children: [
                {
                    id: 'tk2',
                    name: '江戸初期',
                    isExpanded: true,
                    icon: '📜',
                    nodeType: 'type-era',
                    customFields: [
                        { id: 'tk-cf1', name: '期間', value: '1603-1651', type: 'text' },
                        { id: 'tk-cf2', name: '特徴', value: '幕府体制の確立期', type: 'textarea' },
                    ],
                    children: [
                        {
                            id: 'tk3',
                            name: '徳川家康',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf3', name: '生年', value: '1543年', type: 'text' },
                                { id: 'tk-cf4', name: '没年', value: '1616年', type: 'text' },
                                { id: 'tk-cf5', name: '在位期間', value: '1603年-1605年', type: 'text' },
                                {
                                    id: 'tk-cf6',
                                    name: '主な業績',
                                    value: '江戸幕府の創設、大坂の陣での豊臣氏の滅亡',
                                    type: 'textarea',
                                },
                            ],
                            children: [],
                        },
                        {
                            id: 'tk4',
                            name: '徳川秀忠',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf7', name: '生年', value: '1579年', type: 'text' },
                                { id: 'tk-cf8', name: '没年', value: '1632年', type: 'text' },
                                { id: 'tk-cf9', name: '在位期間', value: '1605年-1623年', type: 'text' },
                                {
                                    id: 'tk-cf10',
                                    name: '主な業績',
                                    value: '武家諸法度の制定、キリスト教の禁止',
                                    type: 'textarea',
                                },
                            ],
                            children: [],
                        },
                        {
                            id: 'tk5',
                            name: '徳川家光',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf11', name: '生年', value: '1604年', type: 'text' },
                                { id: 'tk-cf12', name: '没年', value: '1651年', type: 'text' },
                                { id: 'tk-cf13', name: '在位期間', value: '1623年-1651年', type: 'text' },
                                {
                                    id: 'tk-cf14',
                                    name: '主な業績',
                                    value: '鎖国政策の完成、参勤交代制度の確立',
                                    type: 'textarea',
                                },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    id: 'tk6',
                    name: '江戸中期',
                    isExpanded: true,
                    icon: '📜',
                    nodeType: 'type-era',
                    customFields: [
                        { id: 'tk-cf15', name: '期間', value: '1651-1745', type: 'text' },
                        { id: 'tk-cf16', name: '特徴', value: '幕府体制の安定期と文化の発展', type: 'textarea' },
                    ],
                    children: [
                        {
                            id: 'tk7',
                            name: '徳川家綱',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf17', name: '生年', value: '1641年', type: 'text' },
                                { id: 'tk-cf18', name: '没年', value: '1680年', type: 'text' },
                                { id: 'tk-cf19', name: '在位期間', value: '1651年-1680年', type: 'text' },
                                { id: 'tk-cf20', name: '主な業績', value: '明暦の大火後の江戸復興', type: 'textarea' },
                            ],
                            children: [],
                        },
                        {
                            id: 'tk8',
                            name: '徳川綱吉',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf21', name: '生年', value: '1646年', type: 'text' },
                                { id: 'tk-cf22', name: '没年', value: '1709年', type: 'text' },
                                { id: 'tk-cf23', name: '在位期間', value: '1680年-1709年', type: 'text' },
                                {
                                    id: 'tk-cf24',
                                    name: '主な業績',
                                    value: '生類憐みの令、元禄文化の発展',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'tk9',
                                    name: '元禄文化',
                                    icon: '⚔️',
                                    nodeType: 'type-event',
                                    customFields: [
                                        { id: 'tk-cf25', name: '発生年', value: '1688年-1704年', type: 'text' },
                                        {
                                            id: 'tk-cf26',
                                            name: '詳細',
                                            value: '井原西鶴、松尾芭蕉、近松門左衛門らによる文学の発展',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'tk-cf27',
                                            name: '影響',
                                            value: '町人文化の発展と浮世絵の隆盛',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'tk10',
                    name: '江戸後期',
                    icon: '📜',
                    nodeType: 'type-era',
                    customFields: [
                        { id: 'tk-cf28', name: '期間', value: '1745-1867', type: 'text' },
                        { id: 'tk-cf29', name: '特徴', value: '幕府の衰退と開国', type: 'textarea' },
                    ],
                    children: [
                        {
                            id: 'tk11',
                            name: '徳川家斉',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf30', name: '生年', value: '1773年', type: 'text' },
                                { id: 'tk-cf31', name: '没年', value: '1841年', type: 'text' },
                                { id: 'tk-cf32', name: '在位期間', value: '1787年-1837年', type: 'text' },
                                {
                                    id: 'tk-cf33',
                                    name: '主な業績',
                                    value: '寛政の改革、化政文化の発展',
                                    type: 'textarea',
                                },
                            ],
                            children: [],
                        },
                        {
                            id: 'tk12',
                            name: '徳川慶喜',
                            icon: '👑',
                            nodeType: 'type-shogun',
                            customFields: [
                                { id: 'tk-cf34', name: '生年', value: '1837年', type: 'text' },
                                { id: 'tk-cf35', name: '没年', value: '1913年', type: 'text' },
                                { id: 'tk-cf36', name: '在位期間', value: '1866年-1867年', type: 'text' },
                                {
                                    id: 'tk-cf37',
                                    name: '主な業績',
                                    value: '大政奉還による幕府の終焉',
                                    type: 'textarea',
                                },
                            ],
                            children: [
                                {
                                    id: 'tk13',
                                    name: '大政奉還',
                                    icon: '⚔️',
                                    nodeType: 'type-event',
                                    customFields: [
                                        { id: 'tk-cf38', name: '発生年', value: '1867年', type: 'text' },
                                        {
                                            id: 'tk-cf39',
                                            name: '詳細',
                                            value: '徳川慶喜が政権を朝廷に返上',
                                            type: 'textarea',
                                        },
                                        {
                                            id: 'tk-cf40',
                                            name: '影響',
                                            value: '江戸幕府の終焉と明治維新の始まり',
                                            type: 'textarea',
                                        },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

// 中小企業組織図サンプル
export const companySample: SampleData = {
    id: 'company',
    name: '中小企業組織図',
    description: '典型的な中小企業の組織構造を示すサンプルです',
    treeTitle: '株式会社サンプル 組織図',
    nodeTypes: [
        {
            id: 'type-department',
            name: '部署',
            icon: '🏢',
            fieldDefinitions: [
                { id: 'field-desc', name: '説明', type: 'textarea', required: false },
                { id: 'field-members', name: '人数', type: 'text', required: false },
                { id: 'field-budget', name: '予算', type: 'text', required: false },
            ],
        },
        {
            id: 'type-position',
            name: '役職',
            icon: '👔',
            fieldDefinitions: [
                { id: 'field-responsibilities', name: '責任範囲', type: 'textarea', required: false },
                { id: 'field-requirements', name: '必要スキル', type: 'textarea', required: false },
            ],
        },
        {
            id: 'type-employee',
            name: '社員',
            icon: '👤',
            fieldDefinitions: [
                { id: 'field-position', name: '役職', type: 'text', required: true },
                { id: 'field-department', name: '所属部署', type: 'text', required: true },
                { id: 'field-joined', name: '入社年', type: 'text', required: false },
                { id: 'field-skills', name: 'スキル', type: 'textarea', required: false },
                { id: 'field-email', name: 'メールアドレス', type: 'text', required: false },
                { id: 'field-phone', name: '内線番号', type: 'text', required: false },
            ],
        },
        {
            id: 'type-project',
            name: 'プロジェクト',
            icon: '📋',
            fieldDefinitions: [
                { id: 'field-status', name: 'ステータス', type: 'text', required: true },
                { id: 'field-start', name: '開始日', type: 'text', required: false },
                { id: 'field-end', name: '終了予定日', type: 'text', required: false },
                { id: 'field-budget', name: '予算', type: 'text', required: false },
                { id: 'field-desc', name: '概要', type: 'textarea', required: false },
            ],
        },
    ],
    tree: [
        {
            id: 'co1',
            name: '株式会社サンプル',
            isExpanded: true,
            icon: '🏢',
            children: [
                {
                    id: 'co2',
                    name: '経営陣',
                    isExpanded: true,
                    icon: '👔',
                    nodeType: 'type-position',
                    customFields: [
                        { id: 'co-cf1', name: '責任範囲', value: '会社全体の経営戦略と意思決定', type: 'textarea' },
                    ],
                    children: [
                        {
                            id: 'co3',
                            name: '山田太郎',
                            icon: '👤',
                            nodeType: 'type-employee',
                            customFields: [
                                { id: 'co-cf2', name: '役職', value: '代表取締役社長', type: 'text' },
                                { id: 'co-cf3', name: '所属部署', value: '経営陣', type: 'text' },
                                { id: 'co-cf4', name: '入社年', value: '創業者', type: 'text' },
                                { id: 'co-cf5', name: 'メールアドレス', value: 'yamada@example.com', type: 'text' },
                            ],
                            children: [],
                        },
                        {
                            id: 'co4',
                            name: '鈴木花子',
                            icon: '👤',
                            nodeType: 'type-employee',
                            customFields: [
                                { id: 'co-cf6', name: '役職', value: '取締役CFO', type: 'text' },
                                { id: 'co-cf7', name: '所属部署', value: '経営陣', type: 'text' },
                                { id: 'co-cf8', name: '入社年', value: '2010年', type: 'text' },
                                { id: 'co-cf9', name: 'メールアドレス', value: 'suzuki@example.com', type: 'text' },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    id: 'co5',
                    name: '営業部',
                    isExpanded: true,
                    icon: '🏢',
                    nodeType: 'type-department',
                    customFields: [
                        { id: 'co-cf10', name: '説明', value: '新規顧客開拓と既存顧客管理', type: 'textarea' },
                        { id: 'co-cf11', name: '人数', value: '8名', type: 'text' },
                        { id: 'co-cf12', name: '予算', value: '3,000万円/年', type: 'text' },
                    ],
                    children: [
                        {
                            id: 'co6',
                            name: '佐藤次郎',
                            icon: '👤',
                            nodeType: 'type-employee',
                            customFields: [
                                { id: 'co-cf13', name: '役職', value: '営業部長', type: 'text' },
                                { id: 'co-cf14', name: '所属部署', value: '営業部', type: 'text' },
                                { id: 'co-cf15', name: '入社年', value: '2012年', type: 'text' },
                                { id: 'co-cf16', name: 'メールアドレス', value: 'sato@example.com', type: 'text' },
                            ],
                            children: [],
                        },
                        {
                            id: 'co7',
                            name: '大手企業向けチーム',
                            icon: '👔',
                            nodeType: 'type-position',
                            customFields: [
                                { id: 'co-cf17', name: '責任範囲', value: '大企業向け営業活動', type: 'textarea' },
                            ],
                            children: [
                                {
                                    id: 'co8',
                                    name: '田中三郎',
                                    icon: '👤',
                                    nodeType: 'type-employee',
                                    customFields: [
                                        { id: 'co-cf18', name: '役職', value: 'チームリーダー', type: 'text' },
                                        { id: 'co-cf19', name: '所属部署', value: '営業部', type: 'text' },
                                        { id: 'co-cf20', name: '入社年', value: '2015年', type: 'text' },
                                    ],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'co9',
                    name: '開発部',
                    isExpanded: true,
                    icon: '🏢',
                    nodeType: 'type-department',
                    customFields: [
                        { id: 'co-cf21', name: '説明', value: '製品開発と技術サポート', type: 'textarea' },
                        { id: 'co-cf22', name: '人数', value: '12名', type: 'text' },
                        { id: 'co-cf23', name: '予算', value: '5,000万円/年', type: 'text' },
                    ],
                    children: [
                        {
                            id: 'co10',
                            name: '伊藤四郎',
                            icon: '👤',
                            nodeType: 'type-employee',
                            customFields: [
                                { id: 'co-cf24', name: '役職', value: '開発部長', type: 'text' },
                                { id: 'co-cf25', name: '所属部署', value: '開発部', type: 'text' },
                                { id: 'co-cf26', name: '入社年', value: '2011年', type: 'text' },
                                {
                                    id: 'co-cf27',
                                    name: 'スキル',
                                    value: 'Java, Python, クラウドアーキテクチャ',
                                    type: 'textarea',
                                },
                            ],
                            children: [],
                        },
                        {
                            id: 'co11',
                            name: '新製品開発プロジェクト',
                            icon: '📋',
                            nodeType: 'type-project',
                            customFields: [
                                { id: 'co-cf28', name: 'ステータス', value: '進行中', type: 'text' },
                                { id: 'co-cf29', name: '開始日', value: '2023年4月1日', type: 'text' },
                                { id: 'co-cf30', name: '終了予定日', value: '2023年12月31日', type: 'text' },
                                { id: 'co-cf31', name: '予算', value: '2,000万円', type: 'text' },
                                {
                                    id: 'co-cf32',
                                    name: '概要',
                                    value: '次世代クラウドサービスの開発',
                                    type: 'textarea',
                                },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    id: 'co12',
                    name: '管理部',
                    icon: '🏢',
                    nodeType: 'type-department',
                    customFields: [
                        { id: 'co-cf33', name: '説明', value: '人事、経理、総務業務', type: 'textarea' },
                        { id: 'co-cf34', name: '人数', value: '5名', type: 'text' },
                    ],
                    children: [
                        {
                            id: 'co13',
                            name: '高橋五郎',
                            icon: '👤',
                            nodeType: 'type-employee',
                            customFields: [
                                { id: 'co-cf35', name: '役職', value: '管理部長', type: 'text' },
                                { id: 'co-cf36', name: '所属部署', value: '管理部', type: 'text' },
                                { id: 'co-cf37', name: '入社年', value: '2014年', type: 'text' },
                            ],
                            children: [],
                        },
                    ],
                },
            ],
        },
    ],
};

// 全サンプルデータの配列
export const allSamples: SampleData[] = [organizationSample, rockBandsSample, tokugawaSample, companySample];

// サンプルIDからサンプルデータを取得する関数
export function getSampleById(id: SampleType): SampleData | undefined {
    return allSamples.find((sample) => sample.id === id);
}
