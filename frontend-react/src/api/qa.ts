import request from './request'
import type { QaAskResult, QaRecord, QaSession } from '@/types'

// 智能问答：POST /qa/ask，返回 { id, answer, sources, sessionId }
export function ask(data: {
  question: string
  sessionId?: string | null
  imageUrl?: string | null
}): Promise<QaAskResult> {
  return request.post('/qa/ask', data)
}

// 获取问答历史：GET /qa/history（分页）
export function getHistory(params: Record<string, unknown>): Promise<unknown> {
  return request.get('/qa/history', { params })
}

// 获取会话列表：GET /qa/sessions
export function getSessions(): Promise<QaSession[]> {
  return request.get('/qa/sessions')
}

// 获取某个会话的完整对话：GET /qa/session/{sessionId}
export function getSessionMessages(sessionId: string): Promise<QaRecord[]> {
  return request.get(`/qa/session/${sessionId}`)
}

// 删除某个会话：DELETE /qa/session/{sessionId}
export function deleteSession(sessionId: string): Promise<unknown> {
  return request.delete(`/qa/session/${sessionId}`)
}

// 手动重命名会话标题：PUT /qa/session/{sessionId}/title
export function renameSession(sessionId: string, title: string): Promise<unknown> {
  return request.put(`/qa/session/${sessionId}/title`, { title })
}

// 问答反馈（点赞/点踩）：POST /qa/{id}/feedback
export function feedbackQa(id: number, data: { type: number; reason?: string }): Promise<unknown> {
  return request.post(`/qa/${id}/feedback`, data)
}