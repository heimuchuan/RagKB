import { useEffect, useState } from 'react'
import { Button, Card, Dropdown, Input, Table, Tag, message } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import AdminNav from '@/components/AdminNav'
import Aurora from '@/components/Aurora'
import { getUsers, updateUserRole } from '@/api/admin'
import type { AdminUser } from '@/types'
import { useAuthStore } from '@/store/auth'
import { confirmModal } from '@/utils/confirm'

const roleText: Record<number, string> = { 0: '学生', 1: '管理员', 2: '信任账号' }
const roleColor: Record<number, string> = { 0: 'default', 1: 'red', 2: 'orange' }

export default function Users() {
  const userInfo = useAuthStore((s) => s.userInfo)

  const [list, setList] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)

  const loadList = async () => {
    setLoading(true)
    try {
      const data = await getUsers({ current, size, keyword: keyword || undefined })
      setList(data.records || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, size])

  const handleChangeRole = async (row: AdminUser, role: number) => {
    if (row.role === role) return
    if (row.id === userInfo?.id) {
      message.warning('不能修改自己的角色')
      return
    }
    try {
      await confirmModal({
        title: `确定将「${row.realName || row.username}」的角色设为「${roleText[role]}」吗？`
      })
    } catch {
      return
    }
    await updateUserRole(row.id, { role })
    message.success('已更新角色')
    loadList()
  }

  const columns: ColumnsType<AdminUser> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '学号/工号', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'realName', width: 100 },
    {
      title: '角色',
      width: 120,
      render: (_, row) => (
        <Tag color={roleColor[row.role] || 'default'}>{roleText[row.role] || '未知'}</Tag>
      )
    },
    { title: '邮箱', dataIndex: 'email', ellipsis: true, width: 160 },
    {
      title: '状态',
      width: 90,
      render: (_, row) => (
        <Tag color={row.status === 0 ? 'green' : 'red'}>
          {row.status === 0 ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, row) => (
        <Dropdown
          menu={{
            items: [
              { key: '0', label: '学生', disabled: row.role === 0 },
              { key: '2', label: '信任账号', disabled: row.role === 2 },
              { key: '1', label: '管理员', disabled: row.role === 1 }
            ],
            onClick: ({ key }) => handleChangeRole(row, Number(key))
          }}
        >
          <Button type="link">
            设置角色 <DownOutlined />
          </Button>
        </Dropdown>
      )
    }
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <AdminNav />
      <div className="max-w-[1000px] mx-auto my-6 px-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#303133]">用户管理</h2>
            <Input.Search
              allowClear
              placeholder="按学号/姓名搜索"
              className="w-[240px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => {
                setCurrent(1)
                loadList()
              }}
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
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setCurrent(p)
                setSize(ps)
              }
            }}
          />
        </Card>
      </div>
      </div>
    </div>
  )
}