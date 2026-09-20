import { useEffect, useState } from 'react'
import { Card, Col, Progress, Row, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import AdminNav from '@/components/AdminNav'
import Aurora from '@/components/Aurora'
import {
  getStatsOverview,
  getStatsSubmissions,
  getStatsQa,
  getStatsContributors
} from '@/api/admin'
import type { Contributor } from '@/types'

interface StatCardProps {
  value?: number | string
  label: string
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-indigo-50 shadow-sm p-5 text-center mb-4">
      <div className="text-[28px] font-semibold text-[#7c86d6]">{value ?? 0}</div>
      <div className="mt-1.5 text-[13px] text-[#909399]">{label}</div>
    </div>
  )
}

interface TrendItem {
  date: string
  count: number
}

interface QuestionItem {
  question: string
  cnt: number
}

export default function Stats() {
  const [overview, setOverview] = useState<Record<string, any>>({})
  const [sub, setSub] = useState<Record<string, any>>({})
  const [qa, setQa] = useState<Record<string, any>>({ hotQuestions: [], negativeQuestions: [] })
  const [contributors, setContributors] = useState<{ list?: Contributor[] }>({ list: [] })

  const load = async () => {
    const [o, s, q, c] = await Promise.all([
      getStatsOverview(),
      getStatsSubmissions(),
      getStatsQa(),
      getStatsContributors()
    ])
    setOverview(o || {})
    setSub(s || {})
    setQa(q || { hotQuestions: [], negativeQuestions: [] })
    setContributors(c || { list: [] })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overviewCards = [
    { label: '总条目数', value: overview.total },
    { label: '待审核', value: overview.pending },
    { label: '已通过', value: overview.approved },
    { label: '已驳回', value: overview.rejected }
  ]

  const subCards = [
    { label: '总提交', value: sub.total },
    { label: '待审核', value: sub.pending },
    { label: '已通过', value: sub.approved },
    { label: '已驳回', value: sub.rejected }
  ]

  const categoryColumns: ColumnsType<{ name: string; count: number }> = [
    { title: '分类', dataIndex: 'name' },
    { title: '条目数', dataIndex: 'count', width: 120 }
  ]

  const trendColumns: ColumnsType<TrendItem> = [
    { title: '日期', dataIndex: 'date' },
    { title: '提交量', dataIndex: 'count', width: 120 }
  ]

  const questionColumns: ColumnsType<QuestionItem> = [
    { title: '问题', dataIndex: 'question', ellipsis: true },
    { title: '次数', dataIndex: 'cnt', width: 120 }
  ]

  const contributorColumns: ColumnsType<Contributor> = [
    { title: '排名', width: 70, render: (_, __, index) => index + 1 },
    { title: '学号/工号', dataIndex: 'username', width: 140 },
    { title: '姓名', dataIndex: 'realName', width: 120 },
    { title: '提交量', dataIndex: 'total', width: 100 },
    { title: '通过量', dataIndex: 'approved', width: 100 },
    {
      title: '通过率',
      width: 200,
      render: (_, row) => <Progress percent={row.passRate || 0} strokeWidth={14} />
    }
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <AdminNav />
      <div className="max-w-[1100px] mx-auto my-6 px-4 flex flex-col gap-4">
        {/* 知识库概览 */}
        <Card>
          <h2 className="mb-4 text-[#303133]">知识库概览</h2>
          <Row gutter={16}>
            {overviewCards.map((item) => (
              <Col span={6} key={item.label}>
                <StatCard value={item.value} label={item.label} />
              </Col>
            ))}
          </Row>
          <h3 className="my-4 text-[15px] text-[#606266]">分类分布</h3>
          <Table
            rowKey="name"
            columns={categoryColumns}
            dataSource={overview.categories || []}
            pagination={false}
            scroll={{ y: 300 }}
          />
        </Card>

        {/* 提交统计 */}
        <Card>
          <h2 className="mb-4 text-[#303133]">提交统计</h2>
          <div className="flex items-center gap-4 mb-4 max-w-[500px]">
            <span className="text-sm text-[#606266] whitespace-nowrap">通过率</span>
            <Progress percent={sub.passRate || 0} strokeWidth={16} className="flex-1" />
          </div>
          <Row gutter={16}>
            {subCards.map((item, idx) => (
              <Col span={6} key={idx}>
                <StatCard value={item.value} label={item.label} />
              </Col>
            ))}
          </Row>
          <h3 className="my-4 text-[15px] text-[#606266]">近 7 日提交趋势</h3>
          <Table
            rowKey="date"
            columns={trendColumns}
            dataSource={sub.trend || []}
            pagination={false}
          />
        </Card>

        {/* 问答统计 */}
        <Card>
          <h2 className="mb-4 text-[#303133]">问答统计</h2>
          <h3 className="my-4 text-[15px] text-[#606266]">热门问题 Top10</h3>
          <Table
            rowKey="question"
            columns={questionColumns}
            dataSource={qa.hotQuestions || []}
            pagination={false}
            scroll={{ y: 300 }}
          />
          <h3 className="my-4 text-[15px] text-[#606266]">点踩最多问题</h3>
          <Table
            rowKey="question"
            columns={questionColumns}
            dataSource={qa.negativeQuestions || []}
            pagination={false}
            scroll={{ y: 300 }}
          />
        </Card>

        {/* 贡献排行 */}
        <Card>
          <h2 className="mb-4 text-[#303133]">用户贡献排行</h2>
          <Table
            rowKey="username"
            columns={contributorColumns}
            dataSource={contributors.list || []}
            pagination={false}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>
      </div>
    </div>
  )
}