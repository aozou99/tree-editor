export interface CustomFieldDefinition {
  id: string
  name: string
  type: "text" | "textarea" | "link" | "youtube" | "image" | "audio"
  required: boolean
}

export interface NodeType {
  id: string
  name: string
  icon: string
  fieldDefinitions: CustomFieldDefinition[]
}

export interface CustomField {
  id: string
  name: string
  value: string
  type: "text" | "textarea" | "link" | "youtube" | "image" | "audio"
  definitionId?: string
}

export interface TreeNode {
  id: string
  name: string
  children: TreeNode[]
  isExpanded?: boolean
  icon?: string
  thumbnail?: string
  customFields?: CustomField[]
  nodeType?: string // ノードタイプのID
}
