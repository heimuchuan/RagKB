import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, message } from 'antd'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import Aurora from '@/components/Aurora'

interface LoginForm {
  username: string
  password: string
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const setUserInfo = useAuthStore((s) => s.setUserInfo)

  const [form] = Form.useForm<LoginForm>()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      const res = await login(values)
      if (res.user?.role !== 1) {
        message.error('该账号不是管理员，无法登录管理端')
        return
      }
      setToken(res.token)
      setUserInfo(res.user)
      message.success('登录成功')
      navigate('/admin/review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <Card className="w-[400px]">
        <h2 className="text-center text-[#303133] mb-4">管理员登录</h2>
        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员工号' }]}
          >
            <Input placeholder="管理员工号" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
        <div className="mt-3 text-center">
          <Link to="/login" className="text-[13px] text-[#909399] hover:text-[#7c86d6]">
            返回学生端登录
          </Link>
        </div>
      </Card>
      </div>
    </div>
  )
}