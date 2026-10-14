import request from './request'
import type { Attachment, Entry, PageResult } from '@/types'

// 提交知识条目：POST /entries
export function submitEntry(data: {
  title: string
  categoryId: number | null
  content: string
  attachments?: Attachment[]
}): Promise<unknown> {
  return request.post('/entries', data)
}

// 获取我的提交记录：GET /entries/my（分页，可按状态筛选）
export function getMyEntries(params: Record<string, unknown>): Promise<PageResult<Entry>> {
  return request.get('/entries/my', { params })
}

// 获取条目详情：GET /entries/{id}
export function getEntryDetail(id: number): Promise<Entry> {
  return request.get(`/entries/${id}`)
}

// 更新草稿：PUT /entries/{id}
export function updateEntry(
  id: number,
  data: { title: string; categoryId: number | null; content: string }
): Promise<unknown> {
  return request.put(`/entries/${id}`, data)
}

// 删除条目：DELETE /entries/{id}
export function deleteEntry(id: number): Promise<unknown> {
  return request.delete(`/entries/${id}`)
}

// 浏览知识库：GET /entries/public（仅已通过，支持分类/关键词筛选）
export function getPublicEntries(params: Record<string, unknown>): Promise<PageResult<Entry>> {
  return request.get('/entries/public', { params })
}

// 点赞/点踩条目：POST /entries/{id}/feedback
export function feedbackEntry(id: number, data: Record<string, unknown>): Promise<unknown> {
  return request.post(`/entries/${id}/feedback`, data)
}