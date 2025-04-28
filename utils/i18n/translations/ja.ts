export const ja = {
  common: {
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    delete: "削除",
    close: "閉じる",
    add: "追加",
    search: "検索",
    reset: "リセット",
    import: "インポート",
    export: "エクスポート",
    lastSaved: "最終保存",
  },
  header: {
    file: "ファイル",
    settings: "設定",
    addRootNode: "ルートノード追加",
    nodeTypeManagement: "ノードタイプ管理",
    sampleSelection: "サンプル選択",
  },
  search: {
    placeholder: "ノードを検索... (例: type:社員 部署:営業部)",
    help: {
      title: "検索ヘルプ",
      basicSearch: {
        title: "基本検索",
        description: "ノード名、サムネイル、フィールド値を検索します。",
        example: "例: 鈴木",
      },
      typeSearch: {
        title: "ノードタイプ検索",
        description: "特定のノードタイプを検索します。",
        example: "例: type:社員",
      },
      fieldSearch: {
        title: "フィールド検索",
        description: "特定のフィールドの値を検索します。",
        example: "例: 部署:営業部",
      },
      combinedSearch: {
        title: "複合検索",
        description: "複数の条件を組み合わせて検索します。",
        example: "例: type:社員 部署:営業部 鈴木",
      },
    },
  },
  tree: {
    dropHere: "ルートレベルにドロップ",
    nodeName: "ノード名",
    nodeType: "ノードタイプ",
  },
  workspace: {
    new: "新しいワークスペース",
    rename: "名前を変更",
    delete: "削除",
    noWorkspaces: "ワークスペースがありません",
  },
  toast: {
    workspaceCreated: "ワークスペースを作成しました",
    sampleChanged: "サンプルを変更しました",
    dataReset: "データをリセットしました",
    exportComplete: "エクスポート完了",
    exportError: "エクスポートエラー",
    importError: "インポートエラー",
    importComplete: "インポート完了",
  },
  dialogs: {
    reset: {
      title: "リセットの確認",
      description: "現在のツリーデータを初期状態にリセットします。よろしいですか？",
    },
    import: {
      title: "ツリーデータのインポート",
      description: "JSON形式のツリーデータをインポートします。現在のデータは上書きされます。",
      jsonData: "JSONデータ",
      placeholder: "ここにJSONデータを貼り付けてください",
    },
  },
}
