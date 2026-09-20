import { useEffect, useState } from 'react'
import { Button, Card, DatePicker, Form, Input, Modal, Select, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import AdminNav from '@/components/AdminNav'
import Aurora from '@/components/Aurora'
import { getAllEntries, editEntry, deleteEntry, createOfficialEntry } from '@/api/admin'
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

interface OfficialForm {
  title: string
  categoryId: number
  content: string
}

const statusText: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已驳回' }
const statusColor: Record<number, string> = { 0: 'orange', 1: 'green', 2: 'red' }

export default function Entries() {
  const [categories, setCategories] = useState<Category[]>([])
  const [list, setList] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [current, setCurrent] = useState(1)
  const [size] = useState(10)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)

  const [editVisible, setEditVisible] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm] = Form.useForm<EditForm>()

  const [officialVisible, setOfficialVisible] = useState(false)
  const [officialLoading, setOfficialLoading] = useState(false)
  const [officialForm] = Form.useForm<OfficialForm>()

  const categoryName = (id: number | null | undefined) => {
    const c = categories.find((x) => x.id === id)
    return c ? c.name : '未分类'
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current, size }
      if (status != null) params.status = status
      if (categoryId != null) params.categoryId = categoryId
      if (startTime) params.startTime = startTime
      if (endTime) params.endTime = endTime
      const res = await getAllEntries(params)
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
  }, [current])

  const handleSearch = () => {
    setCurrent(1)
    setStartTime(timeRange?.[0]?.format('YYYY-MM-DDTHH:mm:ss') || null)
    setEndTime(timeRange?.[1]?.format('YYYY-MM-DDTHH:mm:ss') || null)
    loadList()
  }

  const handleReset = () => {
    setCurrent(1)
    setStatus(undefined)
    setCategoryId(undefined)
    setStartTime(null)
    setEndTime(null)
    setTimeRange(null)
    loadList()
  }

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
      await editEntry(values.id, {
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
      await confirmModal({ title: '确定要删除该条目吗？删除后不可恢复。', okType: 'danger' })
    } catch {
      return
    }
    await deleteEntry(row.id)
    message.success('已删除')
    loadList()
  }

  const openOfficial = () => {
    officialForm.resetFields()
    setOfficialVisible(true)
  }

  const handleOfficialSubmit = async () => {
    const values = await officialForm.validateFields()
    setOfficialLoading(true)
    try {
      await createOfficialEntry({
        title: values.title,
        categoryId: values.categoryId,
        content: values.content
      })
      message.success('已发布官方条目')
      setOfficialVisible(false)
      loadList()
    } finally {
      setOfficialLoading(false)
    }
  }

  const columns: ColumnsType<Entry> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '分类',
      width: 110,
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
      title: '来源',
      width: 90,
      render: (_, row) => (
        <Tag color={row.sourceType === 1 ? 'green' : 'orange'}>
          {row.sourceType === 1 ? '官方' : '同学经验'}
        </Tag>
      )
    },
    { title: '浏览', dataIndex: 'viewCount', width: 80 },
    {
      title: '提交时间',
      width: 160,
      render: (_, row) => formatTime(row.createdAt)
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, row) => (
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
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <AdminNav />
      <div className="max-w-[1200px] mx-auto my-6 px-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#303133]">条目管理</h2>
            <Button type="primary" onClick={openOfficial}>
              新增官方条目
            </Button>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap">
            <Select
              allowClear
              placeholder="全部状态"
              className="w-[140px]"
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { label: '待审核', value: 0 },
                { label: '已通过', value: 1 },
                { label: '已驳回', value: 2 }
              ]}
            />
            <Select
              allowClear
              placeholder="全部分类"
              className="w-[160px]"
              value={categoryId}
              onChange={(v) => setCategoryId(v)}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <DatePicker.RangePicker
              showTime
              value={timeRange}
              onChange={(v) => setTimeRange(v as [Dayjs, Dayjs] | null)}
            />
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 1000 }}
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
          title="编辑条目"
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

        {/* 官方录入弹窗 */}
        <Modal
          title="新增官方条目"
          open={officialVisible}
          onCancel={() => setOfficialVisible(false)}
          onOk={handleOfficialSubmit}
          okText="发布"
          cancelText="取消"
          confirmLoading={officialLoading}
          width={560}
        >
          <Form form={officialForm} layout="vertical">
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