import { useEffect, useState } from 'react'
import { Button, Card, Input, Modal, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import AdminNav from '@/components/AdminNav'
import Aurora from '@/components/Aurora'
import { getPendingEntries, approveEntry, rejectEntry, batchApprove } from '@/api/admin'
import { getCategories } from '@/api/category'
import type { Category, Entry } from '@/types'
import { formatTime } from '@/utils/format'
import { confirmModal } from '@/utils/confirm'

export default function Review() {
  const [categories, setCategories] = useState<Category[]>([])
  const [list, setList] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [size] = useState(10)

  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState<Entry | null>(null)

  const [rejectVisible, setRejectVisible] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectId, setRejectId] = useState<number | null>(null)

  const categoryName = (id: number | null | undefined) => {
    const c = categories.find((x) => x.id === id)
    return c ? c.name : '未分类'
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await getPendingEntries({ current, size })
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

  const handleApprove = async (row: Entry) => {
    try {
      await confirmModal({ title: `确定通过「${row.title}」吗？通过后将写入知识库。`, okText: '通过' })
    } catch {
      return
    }
    await approveEntry(row.id)
    message.success('已通过')
    loadList()
  }

  const openReject = (row: Entry) => {
    setRejectId(row.id)
    setRejectReason('')
    setRejectVisible(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      message.warning('请填写驳回原因')
      return
    }
    setRejectLoading(true)
    try {
      await rejectEntry(rejectId as number, { reason: rejectReason })
      message.success('已驳回')
      setRejectVisible(false)
      loadList()
    } finally {
      setRejectLoading(false)
    }
  }

  const handleBatchApprove = async () => {
    const ids = selectedRowKeys.map((x) => Number(x))
    if (!ids.length) return
    try {
      await confirmModal({ title: `确定批量通过选中的 ${ids.length} 条提交吗？`, okText: '通过' })
    } catch {
      return
    }
    setBatchLoading(true)
    try {
      const n = await batchApprove(ids)
      message.success(`已通过 ${n} 条`)
      setSelectedRowKeys([])
      loadList()
    } finally {
      setBatchLoading(false)
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
      title: '提交时间',
      width: 160,
      render: (_, row) => formatTime(row.createdAt)
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, row) => (
        <>
          <Button type="link" onClick={() => { setDetail(row); setDetailVisible(true) }}>
            查看
          </Button>
          <Button type="link" style={{ color: '#52c41a' }} onClick={() => handleApprove(row)}>
            通过
          </Button>
          <Button type="link" danger onClick={() => openReject(row)}>
            驳回
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#303133]">审核管理</h2>
            <Button
              type="primary"
              disabled={!selectedRowKeys.length}
              loading={batchLoading}
              onClick={handleBatchApprove}
            >
              批量通过（{selectedRowKeys.length}）
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys)
            }}
            pagination={{
              current,
              pageSize: size,
              total,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p) => setCurrent(p)
            }}
          />
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={detail?.title}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
          width={640}
        >
          {detail && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Tag>{categoryName(detail.categoryId)}</Tag>
                <span className="text-[13px] text-[#909399]">
                  提交时间：{formatTime(detail.createdAt)}
                </span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-[#303133] max-h-[400px] overflow-auto">
                {detail.content}
              </div>
            </>
          )}
        </Modal>

        {/* 驳回弹窗 */}
        <Modal
          title="驳回原因"
          open={rejectVisible}
          onCancel={() => setRejectVisible(false)}
          footer={
            <>
              <Button onClick={() => setRejectVisible(false)}>取消</Button>
              <Button type="primary" danger loading={rejectLoading} onClick={handleRejectSubmit}>
                确认驳回
              </Button>
            </>
          }
          width={480}
        >
          <Input.TextArea
            rows={4}
            placeholder="请填写驳回原因"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Modal>
      </div>
      </div>
    </div>
  )
}