export interface UserInfo {
  id: number
  username: string
  realName?: string
  email?: string
  role: number
  status?: number
  createdAt?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  sortOrder?: number
  createdAt?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
}

export interface Entry {
  id: number
  title: string
  content: string
  categoryId: number | null
  sourceType: number
  status?: number
  viewCount?: number
  approvedAt?: string
  createdAt?: string
  rejectReason?: string
}

export interface Correction {
  id: number
  entryId: number
  originalContent: string
  suggestedContent: string
  reason: string
  status: number
  adminReply?: string
  createdAt?: string
}

export interface QaSource {
  title: string
  content: string
  sourceType: number
}

export interface QaSession {
  sessionId: string
  title?: string
  lastTime?: string
}

export interface QaAskResult {
  id?: number
  answer: string
  sources: QaSource[] | string
  sessionId?: string
}

export interface QaRecord {
  id?: number
  question: string
  answer: string
  sources: QaSource[] | string
  feedback?: number
}

export interface AdminUser {
  id: number
  username: string
  realName?: string
  email?: string
  role: number
  status?: number
}

export interface Contributor {
  username: string
  realName?: string
  total: number
  approved: number
  passRate?: number
}