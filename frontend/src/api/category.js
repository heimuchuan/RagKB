import request from './request'

/**
 * 获取所有分类：GET /categories
 */
export function getCategories() {
  return request.get('/categories')
}