import request from './request'
import type { UserInfo } from '@/types'

export interface LoginResult {
  token: string
  user: UserInfo
}

// 登录：POST /auth/login，返回 { token, user }
export function login(data: { username: string; password: string }): Promise<LoginResult> {
  return request.post('/auth/login', data)
}

// 学生注册：POST /auth/register
export function register(data: {
  username: string
  realName: string
  email?: string
  password: string
}): Promise<unknown> {
  return request.post('/auth/register', data)
}

// 获取当前用户信息：GET /auth/me
export function getMe(): Promise<UserInfo> {
  return request.get('/auth/me')
}

// 修改密码：PUT /auth/password
export function updatePassword(data: { oldPassword: string; newPassword: string }): Promise<unknown> {
  return request.put('/auth/password', data)
}