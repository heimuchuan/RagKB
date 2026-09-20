import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Tabs, message } from 'antd'
import { login, register } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

interface LoginForm {
  username: string
  password: string
}

interface RegisterForm {
  username: string
  realName: string
  email?: string
  password: string
  confirmPassword: string
}

export default function Login() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const setUserInfo = useAuthStore((s) => s.setUserInfo)

  const [activeKey, setActiveKey] = useState('login')
  const [loading, setLoading] = useState(false)
  const [loginForm] = Form.useForm<LoginForm>()
  const [registerForm] = Form.useForm<RegisterForm>()

  const handleLogin = async () => {
    const values = await loginForm.validateFields()
    setLoading(true)
    try {
      const res = await login(values)
      setToken(res.token)
      setUserInfo(res.user)
      message.success('登录成功')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    const values = await registerForm.validateFields()
    setLoading(true)
    try {
      await register({
        username: values.username,
        realName: values.realName,
        email: values.email,
        password: values.password
      })
      message.success('注册成功，请登录')
      loginForm.setFieldsValue({ username: values.username, password: '' })
      registerForm.resetFields()
      setActiveKey('login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f0ff] to-[#f5f7fa]">
      <Card className="w-[420px]">
        <h2 className="text-center text-[#303133] mb-4">校园协作知识库</h2>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form form={loginForm} onFinish={handleLogin} layout="vertical">
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入学号/工号' }]}
                  >
                    <Input placeholder="学号/工号" />
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
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form form={registerForm} onFinish={handleRegister} layout="vertical">
                  <Form.Item
                    name="username"
                    label="学号"
                    rules={[{ required: true, message: '请输入学号' }]}
                  >
                    <Input placeholder="请输入学号" />
                  </Form.Item>
                  <Form.Item
                    name="realName"
                    label="姓名"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                  >
                    <Input placeholder="请输入邮箱（选填）" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码长度不能少于 6 位' }
                    ]}
                  >
                    <Input.Password placeholder="至少 6 位" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="确认密码"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请再次输入密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        }
                      })
                    ]}
                  >
                    <Input.Password placeholder="再次输入密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    注册
                  </Button>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}