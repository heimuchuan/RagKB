import request from './request'

/**
 * 提交纠错：POST /corrections
 */
export function submitCorrection(data) {
  return request.post('/corrections', data)
}

/**
 * 获取我的纠错记录：GET /corrections/my（分页）
 */
export function getMyCorrections(params) {
  return request.get('/corrections/my', { params })
}