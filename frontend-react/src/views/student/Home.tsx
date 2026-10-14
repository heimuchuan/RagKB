import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal, Tag, Upload, message } from 'antd'
import {
  ArrowUp,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Pencil,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash2
} from 'lucide-react'
import StudentNav from '@/components/StudentNav'
import {
  ask,
  deleteSession,
  feedbackQa,
  getSessions,
  getSessionMessages,
  renameSession
} from '@/api/qa'
import { uploadFile } from '@/api/file'
import type { QaSession, QaSource } from '@/types'
import { useAuthStore } from '@/store/auth'
import { confirmModal } from '@/utils/confirm'

interface UiMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: QaSource[]
  recordId?: number
  feedback?: number
  imageUrl?: string
}

const suggestions = [
  '本科生在图书馆一次最多能借几本书？',
  '如何办理校园卡挂失？',
  '宿舍门禁时间是几点？',
  '奖学金的评定条件是什么？'
]

function normalizeSources(s: QaSource[] | string | undefined): QaSource[] {
  if (Array.isArray(s)) return s
  if (typeof s === 'string' && s) {
    try {
      return JSON.parse(s)
    } catch {
      return []
    }
  }
  return []
}

function formatTime(val?: string): string {
  if (!val) return ''
  return String(val).replace('T', ' ').slice(0, 16)
}

export default function Home() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const [sessions, setSessions] = useState<QaSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [renameTarget, setRenameTarget] = useState<QaSession | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [dislikeTarget, setDislikeTarget] = useState<UiMessage | null>(null)
  const [dislikeReason, setDislikeReason] = useState('')

  const chatBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages, loading])

  const loadSessions = async () => {
    try {
      setSessions((await getSessions()) || [])
    } catch {
      // 未登录等情况忽略
    }
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setInput('')
    setImageUrl(null)
  }

  const openSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setMessages([])
    try {
      const records = (await getSessionMessages(sessionId)) || []
      const list: UiMessage[] = []
      for (const r of records) {
        list.push({ role: 'user', content: r.question, imageUrl: r.imageUrl })
        list.push({
          role: 'assistant',
          content: r.answer,
          sources: normalizeSources(r.sources),
          recordId: r.id,
          feedback: r.feedback
        })
      }
      setMessages(list)
    } catch {
      message.error('加载会话失败')
    }
  }

  const submitRename = async () => {
    const title = renameValue.trim()
    if (!renameTarget || !title) {
      message.warning('标题不能为空')
      return
    }
    try {
      await renameSession(renameTarget.sessionId, title)
      message.success('标题已更新')
      setRenameTarget(null)
      setRenameValue('')
      loadSessions()
    } catch {
      message.error('更新失败，请重试')
    }
  }

  const removeSession = async (s: QaSession) => {
    try {
      await confirmModal({
        title: `确定删除会话「${s.title || '未命名对话'}」吗？删除后不可恢复。`,
        okText: '删除',
        okType: 'danger'
      })
    } catch {
      return
    }
    try {
      await deleteSession(s.sessionId)
      if (s.sessionId === currentSessionId) {
        setCurrentSessionId(null)
        setMessages([])
      }
      message.success('会话已删除')
      loadSessions()
    } catch {
      message.error('删除失败，请重试')
    }
  }

  const send = async () => {
    const q = input.trim()
    const img = imageUrl
    if (!q && !img) {
      message.warning('请输入问题')
      return
    }
    if (!token) {
      message.warning('请先登录后再提问')
      navigate('/login')
      return
    }
    setMessages((prev) => [...prev, { role: 'user', content: q, imageUrl: img || undefined }])
    setInput('')
    setImageUrl(null)
    setLoading(true)
    try {
      const res = await ask({
        question: q || '请识别这张图片',
        sessionId: currentSessionId,
        imageUrl: img
      })
      setCurrentSessionId(res.sessionId || currentSessionId)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer || '',
          sources: normalizeSources(res.sources),
          recordId: res.id,
          feedback: 0
        }
      ])
      loadSessions()
    } finally {
      setLoading(false)
    }
  }

  const handleLike = (m: UiMessage) => {
    if (!m.recordId) return
    feedbackQa(m.recordId, { type: 1 })
      .then(() => {
        setMessages((prev) =>
          prev.map((x) => (x === m ? { ...x, feedback: 1 } : x))
        )
        message.success('感谢反馈')
      })
      .catch(() => {})
  }

  const openDislike = (m: UiMessage) => {
    if (!m.recordId) return
    setDislikeReason('')
    setDislikeTarget(m)
  }

  const submitDislike = () => {
    if (!dislikeTarget || !dislikeTarget.recordId) return
    feedbackQa(dislikeTarget.recordId, { type: 2, reason: dislikeReason || '' })
      .then(() => {
        setMessages((prev) =>
          prev.map((x) => (x === dislikeTarget ? { ...x, feedback: 2 } : x))
        )
        message.success('感谢反馈')
        setDislikeTarget(null)
      })
      .catch(() => {})
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f8]">
      <StudentNav />
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧会话栏 */}
        {sidebarOpen ? (
          <aside className="w-[260px] shrink-0 bg-white border-r border-[#e5e5e5] flex flex-col">
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <span className="text-[13px] text-[#666]">会话</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-7 w-7 rounded-md hover:bg-[#f4f4f5] text-[#666] flex items-center justify-center"
                title="收起侧栏"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            <div className="px-3 pb-3">
              <button
                onClick={newChat}
                className="w-full h-9 rounded-lg bg-[#4d6bfe] hover:bg-[#3a55e0] text-white text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus size={16} /> 新对话
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {sessions.map((s) => (
                <div
                  key={s.sessionId}
                  className={`relative pl-3 pr-8 py-2.5 rounded-lg cursor-pointer mb-0.5 group transition ${
                    s.sessionId === currentSessionId ? 'bg-[#eef1ff]' : 'hover:bg-[#f4f4f5]'
                  }`}
                  onClick={() => openSession(s.sessionId)}
                >
                  <div className="text-sm text-[#1f2329] truncate">
                    {s.title || '未命名对话'}
                  </div>
                  <div className="text-xs text-[#999] mt-0.5">{formatTime(s.lastTime)}</div>
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1.5 items-center">
                    <Pencil
                      size={14}
                      className="text-[#999] hover:text-[#4d6bfe]"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRenameValue(s.title || '未命名对话')
                        setRenameTarget(s)
                      }}
                    />
                    <Trash2
                      size={14}
                      className="text-[#f56c6c]"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSession(s)
                      }}
                    />
                  </div>
                </div>
              ))}
              {!sessions.length && (
                <div className="text-[13px] text-[#c0c4cc] text-center mt-5">暂无历史对话</div>
              )}
            </div>
          </aside>
        ) : (
          <aside className="w-11 shrink-0 bg-white border-r border-[#e5e5e5] flex flex-col items-center py-3 gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 rounded-md hover:bg-[#f4f4f5] text-[#666] flex items-center justify-center"
              title="展开侧栏"
            >
              <PanelLeftOpen size={16} />
            </button>
            <button
              onClick={newChat}
              className="h-8 w-8 rounded-md hover:bg-[#f4f4f5] text-[#4d6bfe] flex items-center justify-center"
              title="新对话"
            >
              <Plus size={16} />
            </button>
          </aside>
        )}

        {/* 对话主区 */}
        <main className="flex-1 flex flex-col bg-white min-w-0">
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto">
            <div className="max-w-[820px] mx-auto px-5 pb-6">
              {!messages.length && (
                <div className="flex flex-col items-center justify-center pt-24 pb-10 text-center">
                  <div className="text-2xl font-semibold text-[#1f2329] mb-3">
                    你好，我是校园知识助手
                  </div>
                  <div className="text-[15px] text-[#666] mb-8">
                    关于校园规章制度、学习生活、设施服务的问题，都可以问我
                  </div>
                  <div className="flex flex-wrap justify-center gap-2.5 max-w-[560px]">
                    {suggestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="px-4 py-2 rounded-full text-[13px] text-[#4d6bfe] bg-[#eef1ff] hover:bg-[#e0e5ff] transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, idx) =>
                m.role === 'user' ? (
                  <div key={idx} className="flex justify-end mb-7">
                    <div className="max-w-[85%] min-w-0 flex flex-col items-end">
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt="提问图片"
                          className="mb-2 rounded-lg max-w-[220px] max-h-[180px] object-cover"
                        />
                      )}
                      <div className="px-4 py-2.5 text-sm leading-relaxed bg-[#f4f4f5] text-[#1f2329] rounded-2xl rounded-tr-sm">
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex mb-7 gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1f2329] shrink-0 mt-0.5" />
                    <div className="max-w-[85%] min-w-0">
                      <div className="text-sm leading-relaxed text-[#1f2329] whitespace-pre-wrap">
                        {m.content}
                      </div>

                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-[#999] mb-2">引用来源</div>
                          <div className="space-y-2">
                            {m.sources.map((s, si) => (
                              <div
                                key={si}
                                className="p-3 rounded-lg bg-[#f7f7f8] border border-[#eee]"
                              >
                                <div className="text-[13px] font-medium text-[#1f2329]">
                                  <span className="text-[#999]">[{si + 1}]</span> {s.title}
                                  <Tag
                                    color={s.sourceType === 1 ? 'green' : 'orange'}
                                    className="ml-1.5"
                                  >
                                    {s.sourceType === 1 ? '官方' : '同学经验'}
                                  </Tag>
                                </div>
                                <div className="mt-1 text-xs text-[#666] leading-relaxed">
                                  {s.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.recordId && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="text-xs text-[#999] mr-1">有帮助吗？</span>
                          <Button
                            size="small"
                            type="text"
                            className="!text-[#666] hover:!text-[#4d6bfe]"
                            onClick={() => handleLike(m)}
                          >
                            <ThumbsUp size={14} className={m.feedback === 1 ? 'text-[#4d6bfe]' : ''} /> 有用
                          </Button>
                          <Button size="small" type="text" danger onClick={() => openDislike(m)}>
                            <ThumbsDown size={14} /> 没用
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex gap-3 mb-7">
                  <div className="w-7 h-7 rounded-lg bg-[#1f2329] shrink-0 mt-0.5" />
                  <div className="px-1 py-1.5 text-sm text-[#999]">正在思考…</div>
                </div>
              )}
            </div>
          </div>

          {/* 输入区 */}
          <div className="border-t border-[#f0f0f0] bg-white">
            <div className="max-w-[820px] mx-auto px-5 py-4">
              {imageUrl && (
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={imageUrl}
                    alt="待发送图片预览"
                    className="w-14 h-14 rounded-lg object-cover border border-[#eee]"
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => setImageUrl(null)}
                  >
                    移除图片
                  </Button>
                </div>
              )}
              <div className="rounded-2xl border border-[#e5e5e5] bg-white shadow-sm focus-within:border-[#4d6bfe] transition">
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="发消息，或上传图片提问…"
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  maxLength={500}
                  bordered={false}
                  className="!px-4 !pt-3 !pb-1"
                  onPressEnter={(e) => {
                    e.preventDefault()
                    send()
                  }}
                />
                <div className="flex items-center justify-between px-3 pb-2.5">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={async (options) => {
                      try {
                        const res = await uploadFile(options.file as File)
                        setImageUrl(res.url)
                        options.onSuccess?.(res)
                        message.success('图片已添加，可发送提问')
                      } catch (e) {
                        options.onError?.(e as Error)
                        message.error('图片上传失败')
                      }
                    }}
                  >
                    <Button
                      type="text"
                      icon={<Paperclip size={16} />}
                      title="上传图片"
                      className="!text-[#999] hover:!text-[#1f2329] !h-8 !px-2"
                    />
                  </Upload>
                  <div className="flex items-center gap-2">
                    <Button
                      type="primary"
                      icon={<ArrowUp size={16} strokeWidth={2.5} />}
                      loading={loading}
                      onClick={send}
                      className="!bg-[#4d6bfe] hover:!bg-[#3a55e0] !h-9 !w-9 !rounded-full !flex !items-center !justify-center"
                    />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-[#c0c4cc] mt-2">
                内容由 AI 生成，请结合参考资料甄别
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名会话"
        open={!!renameTarget}
        onOk={submitRename}
        onCancel={() => setRenameTarget(null)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="请输入新的会话标题"
          onPressEnter={submitRename}
        />
      </Modal>

      {/* 点踩弹窗 */}
      <Modal
        title="点踩反馈"
        open={!!dislikeTarget}
        onOk={submitDislike}
        onCancel={() => setDislikeTarget(null)}
        okText="提交"
        cancelText="取消"
      >
        <Input.TextArea
          value={dislikeReason}
          onChange={(e) => setDislikeReason(e.target.value)}
          rows={4}
          placeholder="请描述回答存在的问题"
        />
      </Modal>
    </div>
  )
}