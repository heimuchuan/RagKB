import request from './request'
import type { Attachment } from '@/types'

// 上传文件：POST /files（multipart，返回 { url, name, type, size }）
export function uploadFile(file: File): Promise<Attachment> {
  const form = new FormData()
  form.append('file', file)
  return request.post('/files', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}