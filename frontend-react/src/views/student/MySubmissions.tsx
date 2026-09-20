import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Radio, Select, Table, Tag, Tooltip, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import StudentNav from '@/components/StudentNav'
import Aurora from '@/components/Aurora'
import { getMyEntries, updateEntry, deleteEntry } from '@/api/entry'
import { getCategories } from '@/api/category'
import type { Category, Entry } from '@/types'
import { formatTime } from '@/utils/format'
import { confirmModal } from '@/utils/confirm'

interface EditForm {
  id: number
  title: string
  categoryId: number
  content: string
}

const statusText: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已驳回' }
const statusColor: Record<number, string> = { 0: 'orange', 1: 'green', 2: 'red' }

export default function MySubmissions() {
  const [categories, setCategories] = useState<Category[]>([])
  const [list, setList] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [current, setCurrent] = useState(1)
  const [size] = useState(10)

  const [editVisible, setEditVisible] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm] = Form.useForm<EditForm>()

  const categoryName = (id: number | null | undefined) => {
    const c = categories.find((x) => x.id === id)
    return c ? c.name : '未分类'
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current, size }
      if (statusFilter != null) params.status = statusFilter
      const res = await getMyEntries(params)
      setList(res.records || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCategories().then((res) => setCategories(res || []))
  }, [])

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, statusFilter])

  const openEdit = (row: Entry) => {
    editForm.setFieldsValue({
      id: row.id,
      title: row.title,
      categoryId: row.categoryId ?? undefined,
      content: row.content
    })
    setEditVisible(true)
  }

  const handleEditSubmit = async () => {
    const values = await editForm.validateFields()
    setEditLoading(true)
    try {
      await updateEntry(values.id, {
        title: values.title,
        categoryId: values.categoryId,
        content: values.content
      })
      message.success('已保存')
      setEditVisible(false)
      loadList()
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (row: Entry) => {
    try {
      await confirmModal({ title: '确定要删除该条提交吗？', okType: 'danger' })
    } catch {
      return
    }
    await deleteEntry(row.id)
    message.success('已删除')
    loadList()
  }

  const columns: ColumnsType<Entry> = [
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '分类',
      width: 120,
      render: (_, row) => categoryName(row.categoryId)
    },
    {
      title: '状态',
      width: 100,
      render: (_, row) => (
        <Tag color={statusColor[row.status ?? 0] || 'default'}>
          {statusText[row.status ?? 0] || '未知'}
        </Tag>
      )
    },
    {
      title: '提交时间',
      width: 160,
      render: (_, row) => formatTime(row.createdAt)
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, row) => {
        if (row.status === 0) {
          return (
            <>
              <Button type="link" onClick={() => openEdit(row)}>
                编辑
              </Button>
              <Button type="link" danger onClick={() => handleDelete(row)}>
                删除
              </Button>
            </>
          )
        }
        if (row.status === 2) {
          return (
            <Tooltip title={row.rejectReason || '无'}>
              <Button type="link">驳回原因</Button>
            </Tooltip>
          )
        }
        return <span>-</span>
      }
    }
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <StudentNav />
      <div className="max-w-[1100px] mx-auto my-6 px-4">
        <Card>
          <h2 className="mb-4 text-[#303133]">我的提交</h2>
          <div className="mb-4">
            <Radio.Group
              optionType="button"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: '全部', value: undefined },
                { label: '待审核', value: 0 },
                { label: '已通过', value: 1 },
                { label: '已驳回', value: 2 }
              ]}
            />
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              current,
              pageSize: size,
              total,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p) => setCurrent(p)
            }}
          />
        </Card>

        {/* 编辑弹窗 */}
        <Modal
          title="编辑提交"
          open={editVisible}
          onCancel={() => setEditVisible(false)}
          onOk={handleEditSubmit}
          okText="保存"
          cancelText="取消"
          confirmLoading={editLoading}
          width={560}
        >
          <Form form={editForm} layout="vertical">
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input maxLength={200} showCount />
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
              <Input.TextArea rows={8} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      </div>
    </div>
  )
}