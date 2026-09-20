import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Descriptions, Form, Input, Row, message } from 'antd'
import StudentNav from '@/components/StudentNav'
import Aurora from '@/components/Aurora'
import { updatePassword } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { formatTime } from '@/utils/format'

interface PwdForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Profile() {
  const navigate = useNavigate()
  const userInfo = useAuthStore((s) => s.userInfo)
  const logout = useAuthStore((s) => s.logout)

  const [form] = Form.useForm<PwdForm>()
  const [loading, setLoading] = useState(false)

  const roleText = userInfo?.role === 1 ? '管理员' : '学生'

  const handleUpdatePassword = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      await updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      })
      message.success('密码修改成功，请重新登录')
      logout()
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <StudentNav />
      <div className="max-w-[1100px] mx-auto my-6 px-4">
        <Row gutter={16}>
          <Col span={12}>
            <Card>
              <h3 className="mb-4 text-[#303133]">基本信息</h3>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="学号/工号">
                  {userInfo?.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="真实姓名">
                  {userInfo?.realName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">{userInfo?.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="角色">{roleText}</Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {formatTime(userInfo?.createdAt) || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <h3 className="mb-4 text-[#303133]">修改密码</h3>
              <Form form={form} onFinish={handleUpdatePassword} layout="vertical">
                <Form.Item
                  label="原密码"
                  name="oldPassword"
                  rules={[{ required: true, message: '请输入原密码' }]}
                >
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  label="新密码"
                  name="newPassword"
                  rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码长度不能少于 6 位' }
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: '请再次输入新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      }
                    })
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
      </div>
    </div>
  )
}