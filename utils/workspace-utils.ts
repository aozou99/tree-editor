import type { TreeNode, NodeType } from "@/components/tree-editor"
import { v4 as uuidv4 } from "uuid"

// ワークスペースの型定義
export interface Workspace {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  // TreeEditorで使用するデータ
  tree: TreeNode[]
  nodeTypes: NodeType[]
  treeTitle: string
}

// ワークスペース一覧の型定義
export interface WorkspaceList {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
}

// ローカルストレージのキー
const STORAGE_KEYS = {
  WORKSPACE_LIST: "tree-editor-workspaces",
  WORKSPACE_PREFIX: "tree-editor-workspace-",
}

// ワークスペース一覧を保存
export function saveWorkspaceList(workspaceList: WorkspaceList): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSPACE_LIST, JSON.stringify(workspaceList))
  } catch (error) {
    console.error("ワークスペース一覧の保存に失敗しました:", error)
  }
}

// ワークスペース一覧を読み込み
export function loadWorkspaceList(): WorkspaceList {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKSPACE_LIST)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("ワークスペース一覧の読み込みに失敗しました:", error)
  }

  // デフォルトの一覧を返す
  return {
    workspaces: [],
    activeWorkspaceId: null,
  }
}

// 特定のワークスペースを保存
export function saveWorkspace(workspace: Workspace): void {
  try {
    const key = `${STORAGE_KEYS.WORKSPACE_PREFIX}${workspace.id}`
    localStorage.setItem(key, JSON.stringify(workspace))

    // 更新日時を更新してワークスペース一覧も更新
    const workspaceList = loadWorkspaceList()
    const updatedWorkspaces = workspaceList.workspaces.map((ws) =>
      ws.id === workspace.id ? { ...ws, name: workspace.name, updatedAt: workspace.updatedAt } : ws,
    )

    saveWorkspaceList({
      ...workspaceList,
      workspaces: updatedWorkspaces,
    })
  } catch (error) {
    console.error(`ワークスペース ${workspace.id} の保存に失敗しました:`, error)
  }
}

// 特定のワークスペースを読み込み
export function loadWorkspace(workspaceId: string): Workspace | null {
  try {
    const key = `${STORAGE_KEYS.WORKSPACE_PREFIX}${workspaceId}`
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error(`ワークスペース ${workspaceId} の読み込みに失敗しました:`, error)
  }
  return null
}

// 新しいワークスペースを作成
export function createWorkspace(name: string, initialData?: Partial<Workspace>): Workspace {
  const now = new Date().toISOString()
  const newWorkspace: Workspace = {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    tree: initialData?.tree || [],
    nodeTypes: initialData?.nodeTypes || [],
    treeTitle: initialData?.treeTitle || "新しいツリー",
  }

  // ワークスペースを保存
  const key = `${STORAGE_KEYS.WORKSPACE_PREFIX}${newWorkspace.id}`
  localStorage.setItem(key, JSON.stringify(newWorkspace))

  // ワークスペース一覧を更新
  const workspaceList = loadWorkspaceList()
  const updatedList: WorkspaceList = {
    workspaces: [
      ...workspaceList.workspaces,
      {
        id: newWorkspace.id,
        name: newWorkspace.name,
        createdAt: newWorkspace.createdAt,
        updatedAt: newWorkspace.updatedAt,
        tree: [], // 一覧では詳細データは保存しない
        nodeTypes: [],
        treeTitle: newWorkspace.treeTitle,
      },
    ],
    activeWorkspaceId: workspaceList.activeWorkspaceId || newWorkspace.id,
  }
  saveWorkspaceList(updatedList)

  return newWorkspace
}

// ワークスペースの名前を変更
export function renameWorkspace(workspaceId: string, newName: string): boolean {
  try {
    // 対象のワークスペースを読み込み
    const workspace = loadWorkspace(workspaceId)
    if (!workspace) return false

    // 名前と更新日時を更新
    const updatedWorkspace: Workspace = {
      ...workspace,
      name: newName,
      updatedAt: new Date().toISOString(),
    }

    // 更新したワークスペースを保存
    saveWorkspace(updatedWorkspace)
    return true
  } catch (error) {
    console.error(`ワークスペース ${workspaceId} の名前変更に失敗しました:`, error)
    return false
  }
}

// ワークスペースを削除
export function deleteWorkspace(workspaceId: string): boolean {
  try {
    // ローカルストレージからワークスペースを削除
    const key = `${STORAGE_KEYS.WORKSPACE_PREFIX}${workspaceId}`
    localStorage.removeItem(key)

    // ワークスペース一覧を更新
    const workspaceList = loadWorkspaceList()
    const updatedWorkspaces = workspaceList.workspaces.filter((ws) => ws.id !== workspaceId)

    // アクティブなワークスペースが削除対象の場合は、別のワークスペースをアクティブにする
    let activeId = workspaceList.activeWorkspaceId
    if (activeId === workspaceId) {
      activeId = updatedWorkspaces.length > 0 ? updatedWorkspaces[0].id : null
    }

    saveWorkspaceList({
      workspaces: updatedWorkspaces,
      activeWorkspaceId: activeId,
    })

    return true
  } catch (error) {
    console.error(`ワークスペース ${workspaceId} の削除に失敗しました:`, error)
    return false
  }
}

// アクティブなワークスペースを変更
export function setActiveWorkspace(workspaceId: string): boolean {
  try {
    const workspaceList = loadWorkspaceList()

    // 指定されたワークスペースが存在するか確認
    const exists = workspaceList.workspaces.some((ws) => ws.id === workspaceId)
    if (!exists) return false

    // アクティブなワークスペースを更新
    saveWorkspaceList({
      ...workspaceList,
      activeWorkspaceId: workspaceId,
    })

    return true
  } catch (error) {
    console.error(`アクティブワークスペースの変更に失敗しました:`, error)
    return false
  }
}

// すべてのワークスペースをクリア（主にテスト用）
export function clearAllWorkspaces(): void {
  try {
    // ワークスペース一覧を取得して各ワークスペースを削除
    const workspaceList = loadWorkspaceList()
    workspaceList.workspaces.forEach((workspace) => {
      const key = `${STORAGE_KEYS.WORKSPACE_PREFIX}${workspace.id}`
      localStorage.removeItem(key)
    })

    // ワークスペース一覧もクリア
    localStorage.removeItem(STORAGE_KEYS.WORKSPACE_LIST)
  } catch (error) {
    console.error("すべてのワークスペースのクリアに失敗しました:", error)
  }
}
