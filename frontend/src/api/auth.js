import request from './request'

/**
 * 登录：POST /auth/login，返回 { token, user }
 */
export function login(data) {
  return request.post('/auth/login', data)
}

/**
 * 学生注册：POST /auth/register
 */
export function register(data) {
  return request.post('/auth/register', data)
}

/**
 * 获取当前用户信息：GET /auth/me
 */
export function getMe() {
  return request.get('/auth/me')
}

/**
 * 修改密码：PUT /auth/password
 */
export function updatePassword(data) {
  return request.put('/auth/password', data)
}