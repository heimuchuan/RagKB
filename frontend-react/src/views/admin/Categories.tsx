import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, InputNumber, Modal, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import AdminNav from '@/components/AdminNav'
import Aurora from '@/components/Aurora'
import { getCategories } from '@/api/category'
import { addCategory, updateCategory, deleteCategory } from '@/api/admin'
import type { Category } from '@/types'
import { formatTime } from '@/utils/format'
import { confirmModal } from '@/utils/confirm'

interface CategoryForm {
  name: string
  description: string
  sortOrder: number
}

export default function Categories() {
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm<CategoryForm>()

  const loadList = async () => {
    setLoading(true)
    try {
      setList((await getCategories()) || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAdd = () => {
    setIsEdit(false)
    setEditId(null)
    form.setFieldsValue({ name: '', description: '', sortOrder: 0 })
    setDialogVisible(true)
  }

  const openEdit = (row: Category) => {
    setIsEdit(true)
    setEditId(row.id)
    form.setFieldsValue({
      name: row.name,
      description: row.description || '',
      sortOrder: row.sortOrder || 0
    })
    setDialogVisible(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const data = {
        name: values.name,
        description: values.description,
        sortOrder: values.sortOrder
      }
      if (isEdit) {
        await updateCategory(editId as number, data)
        message.success('已更新')
      } else {
        await addCategory(data)
        message.success('已新增')
      }
      setDialogVisible(false)
      loadList()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Category) => {
    try {
      await confirmModal({ title: `确定要删除分类「${row.name}」吗？`, okType: 'danger' })
    } catch {
      return
    }
    await deleteCategory(row.id)
    message.success('已删除')
    loadList()
  }

  const columns: ColumnsType<Category> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '分类名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '排序权重', dataIndex: 'sortOrder', width: 100 },
    {
      title: '创建时间',
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
      <div className="max-w-[900px] mx-auto my-6 px-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#303133]">分类管理</h2>
            <Button type="primary" onClick={openAdd}>
              新增分类
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 800 }}
            pagination={false}
          />
        </Card>

        <Modal
          title={isEdit ? '编辑分类' : '新增分类'}
          open={dialogVisible}
          onCancel={() => setDialogVisible(false)}
          onOk={handleSubmit}
          okText="保存"
          cancelText="取消"
          confirmLoading={submitting}
          width={480}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="名称"
              name="name"
              rules={[{ required: true, message: '请输入分类名称' }]}
            >
              <Input maxLength={50} showCount />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} maxLength={200} showCount />
            </Form.Item>
            <Form.Item label="排序权重" name="sortOrder">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      </div>
    </div>
  )
}