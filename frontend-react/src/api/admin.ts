import request from './request'
import type { AdminUser, Attachment, Contributor, Correction, Entry, PageResult } from '@/types'

// ========== 知识条目（管理员端） ==========

// 获取待审核列表：GET /admin/entries/pending（分页）
export function getPendingEntries(params: Record<string, unknown>): Promise<PageResult<Entry>> {
  return request.get('/admin/entries/pending', { params })
}

// 审核通过：POST /admin/entries/{id}/approve
export function approveEntry(id: number): Promise<unknown> {
  return request.post(`/admin/entries/${id}/approve`)
}

// 官方录入条目：POST /admin/entries/official（sourceType=1，直接通过并入库）
export function createOfficialEntry(data: {
  title: string
  categoryId: number | null
  content: string
  attachments?: Attachment[]
}): Promise<unknown> {
  return request.post('/admin/entries/official', data)
}

// 审核驳回：POST /admin/entries/{id}/reject
export function rejectEntry(id: number, data: { reason: string }): Promise<unknown> {
  return request.post(`/admin/entries/${id}/reject`, data)
}

// 批量审核通过：POST /admin/entries/batch-approve
export function batchApprove(ids: number[]): Promise<number> {
  return request.post('/admin/entries/batch-approve', { ids })
}

// 获取所有条目：GET /admin/entries（支持状态/分类/时间筛选）
export function getAllEntries(params: Record<string, unknown>): Promise<PageResult<Entry>> {
  return request.get('/admin/entries', { params })
}

// 编辑条目：PUT /admin/entries/{id}
export function editEntry(
  id: number,
  data: { title: string; categoryId: number | null; content: string }
): Promise<unknown> {
  return request.put(`/admin/entries/${id}`, data)
}

// 删除条目：DELETE /admin/entries/{id}
export function deleteEntry(id: number): Promise<unknown> {
  return request.delete(`/admin/entries/${id}`)
}

// ========== 分类（管理员端） ==========

// 新增分类：POST /admin/categories
export function addCategory(data: {
  name: string
  description: string
  sortOrder: number
}): Promise<unknown> {
  return request.post('/admin/categories', data)
}

// 编辑分类：PUT /admin/categories/{id}
export function updateCategory(
  id: number,
  data: { name: string; description: string; sortOrder: number }
): Promise<unknown> {
  return request.put(`/admin/categories/${id}`, data)
}

// 删除分类：DELETE /admin/categories/{id}
export function deleteCategory(id: number): Promise<unknown> {
  return request.delete(`/admin/categories/${id}`)
}

// ========== 纠错（管理员端） ==========

// 获取待处理纠错列表：GET /admin/corrections/pending（分页）
export function getPendingCorrections(params: Record<string, unknown>): Promise<PageResult<Correction>> {
  return request.get('/admin/corrections/pending', { params })
}

// 处理纠错：POST /admin/corrections/{id}/handle
export function handleCorrection(id: number, data: { status: number; reply: string }): Promise<unknown> {
  return request.post(`/admin/corrections/${id}/handle`, data)
}

// ========== 数据统计（管理员端） ==========

export function getStatsSubmissions(): Promise<Record<string, any>> {
  return request.get('/admin/stats/submissions')
}

export function getStatsQa(): Promise<Record<string, any>> {
  return request.get('/admin/stats/qa')
}

export function getStatsContributors(): Promise<{ list?: Contributor[] }> {
  return request.get('/admin/stats/contributors')
}

export function getStatsOverview(): Promise<Record<string, any>> {
  return request.get('/admin/stats/overview')
}

// ========== 用户管理（管理员端） ==========

// 获取用户列表：GET /admin/users（分页 + 关键词）
export function getUsers(params: Record<string, unknown>): Promise<PageResult<AdminUser>> {
  return request.get('/admin/users', { params })
}

// 设置用户角色：PUT /admin/users/{id}/role
export function updateUserRole(id: number, data: { role: number }): Promise<unknown> {
  return request.put(`/admin/users/${id}/role`, data)
}