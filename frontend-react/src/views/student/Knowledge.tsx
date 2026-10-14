import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, Modal, Pagination, Tag, Tooltip, message } from 'antd'
import {
  BookOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PaperClipOutlined,
  RightOutlined,
  SearchOutlined
} from '@ant-design/icons'
import StudentNav from '@/components/StudentNav'
import Aurora from '@/components/Aurora'
import { LibraryIllustration } from '@/components/Illustrations'
import { getPublicEntries, getEntryDetail } from '@/api/entry'
import { getCategories } from '@/api/category'
import { submitCorrection } from '@/api/correction'
import type { Attachment, Category, Entry } from '@/types'
import { useAuthStore } from '@/store/auth'
import { formatTime } from '@/utils/format'

function parseAttachments(raw?: string): Attachment[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

interface CorrectionForm {
  entryId: number
  entryTitle: string
  originalContent: string
  suggestedContent: string
  reason: string
}

export default function Knowledge() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const [categories, setCategories] = useState<Category[]>([])
  const [list, setList] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [current, setCurrent] = useState(1)
  const [size] = useState(9)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [keyword, setKeyword] = useState('')

  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState<Entry | null>(null)

  const [correctionVisible, setCorrectionVisible] = useState(false)
  const [correctionLoading, setCorrectionLoading] = useState(false)
  const [correctionForm, setCorrectionForm] = useState<CorrectionForm>({
    entryId: 0,
    entryTitle: '',
    originalContent: '',
    suggestedContent: '',
    reason: ''
  })

  const categoryName = (id: number | null | undefined) => {
    const c = categories.find((x) => x.id === id)
    return c ? c.name : '未分类'
  }

  const loadCategories = async () => {
    setCategories((await getCategories()) || [])
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current, size }
      if (categoryId != null) params.categoryId = categoryId
      if (keyword) params.keyword = keyword
      const res = await getPublicEntries(params)
      setList(res.records || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, categoryId])

  const handleSearch = () => {
    setCurrent(1)
    loadList()
  }

  const chooseCategory = (id: number | undefined) => {
    setCurrent(1)
    setCategoryId(id)
  }

  const openDetail = async (row: Entry) => {
    const d = await getEntryDetail(row.id)
    setDetail(d)
    setDetailVisible(true)
  }

  const openCorrection = () => {
    if (!detail) return
    if (!token) {
      message.warning('请先登录后再提交纠错')
      navigate('/login')
      return
    }
    setCorrectionForm({
      entryId: detail.id,
      entryTitle: detail.title,
      originalContent: detail.content || '',
      suggestedContent: '',
      reason: ''
    })
    setCorrectionVisible(true)
  }

  const handleCorrectionSubmit = async () => {
    if (!correctionForm.suggestedContent && !correctionForm.reason) {
      message.warning('请至少填写建议修正内容或纠错原因')
      return
    }
    setCorrectionLoading(true)
    try {
      await submitCorrection({
        entryId: correctionForm.entryId,
        originalContent: correctionForm.originalContent,
        suggestedContent: correctionForm.suggestedContent,
        reason: correctionForm.reason
      })
      message.success('纠错已提交')
      setCorrectionVisible(false)
    } finally {
      setCorrectionLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
      <StudentNav />
      <div className="max-w-[1100px] mx-auto my-6 px-4">
        {/* 顶部横幅 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 px-7 py-8 shadow-lg shadow-indigo-200/50 mb-6">
          <div className="absolute -right-8 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute left-1/3 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 text-white">
                <BookOutlined className="text-2xl" />
                <h1 className="text-2xl font-bold m-0">校园知识库</h1>
              </div>
              <p className="text-white/85 text-sm mb-5">汇集官方规章与同学经验，助你快速找到答案</p>
              <div className="flex gap-3 max-w-[520px]">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索规章制度、办事流程、生活经验…"
                  allowClear
                  prefix={<SearchOutlined className="text-[#c0c4cc]" />}
                  onPressEnter={handleSearch}
                  className="!rounded-xl !h-11"
                />
                <button
                  onClick={handleSearch}
                  className="h-11 px-6 rounded-xl bg-white text-[#7c86d6] text-sm font-medium hover:bg-indigo-50 transition shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <SearchOutlined /> 搜索
                </button>
              </div>
            </div>
            <div className="shrink-0">
              <LibraryIllustration className="w-40 h-40 rounded-3xl shadow-lg" />
            </div>
          </div>
        </div>

        {/* 分类筛选胶囊 */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          <button
            onClick={() => chooseCategory(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm transition border ${
              categoryId == null
                ? 'bg-[#7c86d6] text-white border-[#7c86d6] shadow-sm'
                : 'bg-white text-[#606266] border-slate-200 hover:border-indigo-300 hover:text-[#7c86d6]'
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => chooseCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm transition border ${
                categoryId === c.id
                  ? 'bg-[#7c86d6] text-white border-[#7c86d6] shadow-sm'
                  : 'bg-white text-[#606266] border-slate-200 hover:border-indigo-300 hover:text-[#7c86d6]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* 卡片网格 */}
        {!loading && !list.length ? (
          <div className="text-center py-20 text-[#909399] rounded-2xl bg-white/70">
            暂无相关条目，换个关键词试试
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((row) => (
              <div
                key={row.id}
                onClick={() => openDetail(row)}
                className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-indigo-50 shadow-sm hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5 transition cursor-pointer p-5 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Tag color={row.sourceType === 1 ? 'green' : 'orange'}>
                    {row.sourceType === 1 ? '官方' : '同学经验'}
                  </Tag>
                  <Tag className="!text-[#909399]">{categoryName(row.categoryId)}</Tag>
                </div>
                <h3 className="text-[15px] font-semibold text-[#303133] mb-2 leading-snug line-clamp-1 group-hover:text-[#7c86d6] transition">
                  {row.title}
                </h3>
                <p className="text-[13px] text-[#909399] leading-relaxed line-clamp-2 mb-4 flex-1">
                  {row.content}
                </p>
                <div className="flex items-center justify-between text-xs text-[#909399] pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <EyeOutlined /> {row.viewCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockCircleOutlined /> {formatTime(row.approvedAt || row.createdAt)}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 text-[#7c86d6] font-medium">
                    查看 <RightOutlined className="text-[10px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > size && (
          <div className="flex justify-center mt-7">
            <Pagination
              current={current}
              pageSize={size}
              total={total}
              showSizeChanger={false}
              onChange={(p) => setCurrent(p)}
            />
          </div>
        )}

        {/* 详情弹窗 */}
        <Modal
          title={detail?.title}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          width={640}
          footer={
            <>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              {detail && detail.sourceType !== 1 ? (
                <Button type="primary" onClick={openCorrection}>
                  提交纠错
                </Button>
              ) : (
                <Tooltip title="官方内容由管理员维护，不支持纠错">
                  <Button disabled>提交纠错</Button>
                </Tooltip>
              )}
            </>
          }
        >
          {detail && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Tag>{categoryName(detail.categoryId)}</Tag>
                <Tag color={detail.sourceType === 1 ? 'green' : 'orange'}>
                  {detail.sourceType === 1 ? '官方' : '同学经验'}
                </Tag>
                <span className="text-[13px] text-[#909399]">
                  浏览次数：{detail.viewCount}
                </span>
                <span className="text-[13px] text-[#909399]">
                  收录时间：{formatTime(detail.approvedAt || detail.createdAt)}
                </span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-[#303133] max-h-[400px] overflow-auto">
                {detail.content}
              </div>
              {parseAttachments(detail.attachment).length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[13px] font-medium text-[#303133] mb-2">附件</div>
                  <div className="flex flex-wrap gap-3">
                    {parseAttachments(detail.attachment).map((a, i) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[#7c86d6] text-[13px] hover:bg-indigo-100 transition"
                      >
                        {a.type && a.type.startsWith('image/') ? (
                          <img src={a.url} alt={a.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <PaperClipOutlined />
                        )}
                        <span className="max-w-[200px] truncate">{a.name || '附件'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Modal>

        {/* 纠错弹窗 */}
        <Modal
          title="提交纠错"
          open={correctionVisible}
          onCancel={() => setCorrectionVisible(false)}
          footer={
            <>
              <Button onClick={() => setCorrectionVisible(false)}>取消</Button>
              <Button
                type="primary"
                loading={correctionLoading}
                onClick={handleCorrectionSubmit}
              >
                提交
              </Button>
            </>
          }
          width={560}
        >
          <Form layout="vertical">
            <Form.Item label="关联条目">
              <span>{correctionForm.entryTitle}</span>
            </Form.Item>
            <Form.Item label="原文内容">
              <Input.TextArea value={correctionForm.originalContent} rows={3} readOnly />
            </Form.Item>
            <Form.Item label="建议修正">
              <Input.TextArea
                rows={3}
                placeholder="请填写建议修正后的内容"
                value={correctionForm.suggestedContent}
                onChange={(e) =>
                  setCorrectionForm((f) => ({ ...f, suggestedContent: e.target.value }))
                }
              />
            </Form.Item>
            <Form.Item label="纠错原因">
              <Input.TextArea
                rows={2}
                placeholder="请说明纠错原因"
                value={correctionForm.reason}
                onChange={(e) =>
                  setCorrectionForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      </div>
    </div>
  )
}