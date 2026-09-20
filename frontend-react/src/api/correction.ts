import request from './request'
import type { Correction, PageResult } from '@/types'

// 提交纠错：POST /corrections
export function submitCorrection(data: {
  entryId: number
  originalContent: string
  suggestedContent: string
  reason: string
}): Promise<unknown> {
  return request.post('/corrections', data)
}

// 获取我的纠错记录：GET /corrections/my（分页）
export function getMyCorrections(params: Record<string, unknown>): Promise<PageResult<Correction>> {
  return request.get('/corrections/my', { params })
}