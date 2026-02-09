export interface KnowledgeText {
  id: string
  tenantId: string
  tenantWide: boolean
  teamId: string | null
  userId: string | null
  parentId: string | null
  text?: string
  title: string
  meta: Record<string, any>
  hidden: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  children?: KnowledgeText[]
}

export interface KnowledgeTextInsert {
  tenantId: string
  text: string
  title: string
  parentId?: string | null
  teamId?: string | null
  userId?: string | null
  tenantWide?: boolean
  meta?: Record<string, any>
  hidden?: boolean
}

export interface KnowledgeTextUpdate {
  text?: string
  title?: string
  parentId?: string | null
  teamId?: string | null
  userId?: string | null
  tenantWide?: boolean
  meta?: Record<string, any>
  hidden?: boolean
}
