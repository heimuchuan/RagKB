import { useEffect, useState } from 'react'
import { Button, Card, Input, Modal, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import AdminNav from '@/components/AdminNav'
import Aurora from '@/components/Aurora'
import { getPendingCorrections, handleCorrection } from '@/api/admin'
import type { Correction } from '@/types'
import { formatTime } from '@/utils/format'

export default function Corrections() {
  const [list, setList] = useState<Correction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [size] = useState(10)

  const [handleVisible, setHandleVisible] = useState(false)
  const [handleLoading, setHandleLoading] = useState(false)
  const [handleStatus, setHandleStatus] = useState(1)
  const [handleReply, setHandleReply] = useState('')
  const [handleId, setHandleId] = useState<number | null>(null)

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await getPendingCorrections({ current, size })
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

  const openHandle = (row: Correction, status: number) => {
    setHandleId(row.id)
    setHandleStatus(status)
    setHandleReply('')
    setHandleVisible(true)
  }

  const handleSubmit = async () => {
    setHandleLoading(true)
    try {
      await handleCorrection(handleId as number, {
        status: handleStatus,
        reply: handleReply || ''
      })
      message.success('已处理')
      setHandleVisible(false)
      loadList()
    } finally {
      setHandleLoading(false)
    }
  }

  const columns: ColumnsType<Correction> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
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
    { title: '纠错原因', dataIndex: 'reason', ellipsis: true, width: 140 },
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
          <Button type="link" style={{ color: '#52c41a' }} onClick={() => openHandle(row, 1)}>
            采纳
          </Button>
          <Button type="link" danger onClick={() => openHandle(row, 2)}>
            拒绝
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
      <div className="max-w-[1100px] mx-auto my-6 px-4">
        <Card>
          <h2 className="mb-4 text-[#303133]">纠错处理</h2>
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

        <Modal
          title={handleStatus === 1 ? '采纳纠错' : '拒绝纠错'}
          open={handleVisible}
          onCancel={() => setHandleVisible(false)}
          footer={
            <>
              <Button onClick={() => setHandleVisible(false)}>取消</Button>
              <Button
                type="primary"
                danger={handleStatus === 2}
                loading={handleLoading}
                onClick={handleSubmit}
              >
                确认{handleStatus === 1 ? '采纳' : '拒绝'}
              </Button>
            </>
          }
          width={480}
        >
          <Input.TextArea
            rows={4}
            placeholder="请填写给用户的回复"
            value={handleReply}
            onChange={(e) => setHandleReply(e.target.value)}
          />
        </Modal>
      </div>
      </div>
    </div>
  )
}