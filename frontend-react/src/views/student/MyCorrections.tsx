import { useEffect, useState } from 'react'
import { Card, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import StudentNav from '@/components/StudentNav'
import Aurora from '@/components/Aurora'
import { getMyCorrections } from '@/api/correction'
import type { Correction } from '@/types'
import { formatTime } from '@/utils/format'

const statusText: Record<number, string> = { 0: '待处理', 1: '已采纳', 2: '已拒绝' }
const statusColor: Record<number, string> = { 0: 'orange', 1: 'green', 2: 'red' }

export default function MyCorrections() {
  const [list, setList] = useState<Correction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [size] = useState(10)

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await getMyCorrections({ current, size })
      setList(res.records || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const columns: ColumnsType<Correction> = [
    { title: '条目ID', dataIndex: 'entryId', width: 90 },
    {
      title: '原文内容',
      ellipsis: true,
      render: (_, row) => row.originalContent || '-'
    },
    {
      title: '建议修正',
      ellipsis: true,
      render: (_, row) => row.suggestedContent || '-'
    },
    { title: '纠错原因', dataIndex: 'reason', ellipsis: true, width: 160 },
    {
      title: '状态',
      width: 100,
      render: (_, row) => (
        <Tag color={statusColor[row.status] || 'default'}>
          {statusText[row.status] || '未知'}
        </Tag>
      )
    },
    {
      title: '管理员回复',
      width: 160,
      ellipsis: true,
      render: (_, row) => row.adminReply || '-'
    },
    {
      title: '提交时间',
      width: 160,
      render: (_, row) => formatTime(row.createdAt)
    }
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <StudentNav />
      <div className="max-w-[1100px] mx-auto my-6 px-4">
        <Card>
          <h2 className="mb-4 text-[#303133]">我的纠错</h2>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{
              current,
              pageSize: size,
              total,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p) => setCurrent(p)
            }}
          />
        </Card>
      </div>
      </div>
    </div>
  )
}