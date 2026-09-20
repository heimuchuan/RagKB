import request from './request'
import type { Category } from '@/types'

// 获取所有分类：GET /categories
export function getCategories(): Promise<Category[]> {
  return request.get('/categories')
}