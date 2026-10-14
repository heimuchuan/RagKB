import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Select, Upload, message } from 'antd'
import type { UploadFile } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import StudentNav from '@/components/StudentNav'
import Aurora from '@/components/Aurora'
import { getCategories } from '@/api/category'
import { submitEntry } from '@/api/entry'
import { uploadFile } from '@/api/file'
import type { Attachment, Category } from '@/types'

interface SubmitForm {
  title: string
  categoryId: number
  content: string
}

export default function Submit() {
  const navigate = useNavigate()
  const [form] = Form.useForm<SubmitForm>()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    getCategories().then((res) => setCategories(res || []))
  }, [])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const attachments = fileList
      .filter((f) => f.status === 'done' && f.response)
      .map((f) => f.response as Attachment)
    setLoading(true)
    try {
      await submitEntry({ ...values, attachments })
      message.success('提交成功，等待管理员审核')
      navigate('/my-submissions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <StudentNav />
      <div className="max-w-[800px] mx-auto my-6 px-4">
        <Card>
          <h2 className="mb-4 text-[#303133]">提交信息</h2>
          <Form form={form} onFinish={handleSubmit} labelCol={{ span: 3 }}>
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input
                placeholder="请输入标题，例如：图书馆借阅指南"
                maxLength={200}
                showCount
              />
            </Form.Item>
            <Form.Item
              label="分类"
              name="categoryId"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select
                placeholder="请选择分类"
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item
              label="正文"
              name="content"
              rules={[{ required: true, message: '请输入正文内容' }]}
            >
              <Input.TextArea rows={10} placeholder="请输入正文内容" />
            </Form.Item>
            <Form.Item label="附件">
              <Upload
                fileList={fileList}
                multiple
                customRequest={async (options) => {
                  try {
                    const res = await uploadFile(options.file as File)
                    options.onSuccess?.(res)
                  } catch (e) {
                    options.onError?.(e as Error)
                  }
                }}
                onChange={({ fileList: fl }) => setFileList(fl)}
              >
                <Button icon={<UploadOutlined />}>上传附件</Button>
              </Upload>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 3 }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交审核
              </Button>
              <Button className="ml-3" onClick={() => form.resetFields()}>
                重置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      </div>
    </div>
  )
}