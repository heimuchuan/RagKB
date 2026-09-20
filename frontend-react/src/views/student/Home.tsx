import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Divider, Input, Modal, Tag, message } from 'antd'
import {
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  LikeOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined
} from '@ant-design/icons'
import StudentNav from '@/components/StudentNav'
import Aurora from '@/components/Aurora'
import { imageUrl } from '@/utils/image'
import {
  ask,
  deleteSession,
  feedbackQa,
  getSessions,
  getSessionMessages,
  renameSession
} from '@/api/qa'
import type { QaSession, QaSource } from '@/types'
import { useAuthStore } from '@/store/auth'
import { confirmModal } from '@/utils/confirm'

interface UiMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: QaSource[]
  recordId?: number
  feedback?: number
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
  const [loading, setLoading] = useState(false)

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
  }

  const openSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setMessages([])
    try {
      const records = (await getSessionMessages(sessionId)) || []
      const list: UiMessage[] = []
      for (const r of records) {
        list.push({ role: 'user', content: r.question })
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
    if (!q) {
      message.warning('请输入问题')
      return
    }
    if (!token) {
      message.warning('请先登录后再提问')
      navigate('/login')
      return
    }
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await ask({ question: q, sessionId: currentSessionId })
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 overflow-hidden">
      <Aurora />
      <div className="relative z-10">
      <StudentNav />
      <div className="max-w-[1160px] mx-auto my-5 px-4 flex gap-5 h-[calc(100vh-96px)]">
        {/* 会话列表侧栏 */}
        <aside className="w-[260px] shrink-0 bg-white/70 backdrop-blur-xl rounded-2xl p-4 flex flex-col shadow-sm border border-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold shadow-sm">
              知
            </div>
            <span className="font-semibold text-[#303133]">我的对话</span>
          </div>

          <button
            onClick={newChat}
            className="h-11 mb-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-indigo-400 to-violet-500 hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PlusOutlined /> 新建对话
          </button>

          <div className="flex-1 overflow-auto -mx-1 px-1">
            {sessions.map((s) => (
              <div
                key={s.sessionId}
                className={`relative pl-3 pr-8 py-2.5 rounded-xl cursor-pointer mb-1 group border-l-[3px] transition ${
                  s.sessionId === currentSessionId
                    ? 'bg-indigo-50/70 border-indigo-400'
                    : 'border-transparent hover:bg-slate-50'
                }`}
                onClick={() => openSession(s.sessionId)}
              >
                <div className="text-sm text-[#303133] truncate">
                  {s.title || '未命名对话'}
                </div>
                <div className="text-xs text-[#909399] mt-1">{formatTime(s.lastTime)}</div>
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-2 items-center">
                  <EditOutlined
                    className="text-[#909399] hover:text-[#7c86d6]"
                    title="重命名"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenameValue(s.title || '未命名对话')
                      setRenameTarget(s)
                    }}
                  />
                  <DeleteOutlined
                    className="text-[#f56c6c]"
                    title="删除会话"
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

        {/* 对话区 */}
        <main className="flex-1 flex flex-col bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
          <div ref={chatBoxRef} className="flex-1 overflow-auto p-6">
            {!messages.length && (
              <div className="text-center mt-10 px-6">
                <img
                  src={imageUrl(
                    '扁平插画，友好的智能问答机器人助手，举着书本，对话气泡，靛蓝紫罗兰柔和渐变，现代简洁可爱',
                    'square'
                  )}
                  alt="校园知识助手"
                  className="w-40 h-40 mx-auto rounded-3xl object-cover shadow-lg shadow-indigo-200 mb-5"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="text-xl font-semibold text-[#303133] mb-2">
                  你好，我是校园知识助手
                </div>
                <div className="text-sm text-[#909399] mb-6">
                  关于校园规章制度、学习生活、设施服务的问题，都可以问我
                </div>
                <div className="flex flex-wrap justify-center gap-2.5 max-w-[560px] mx-auto">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-3.5 py-2 rounded-full text-[13px] text-[#7c86d6] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex mb-5 gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 头像 */}
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-sm shadow-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                      : 'bg-gradient-to-br from-indigo-400 to-violet-500'
                  }`}
                >
                  {m.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                </div>

                <div
                  className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-400 to-violet-500 text-white rounded-2xl rounded-tr-md shadow-sm'
                      : 'bg-white text-[#303133] rounded-2xl rounded-tl-md border border-indigo-50 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                    <>
                      <Divider orientation="left" className="!my-2.5">
                        <span className="text-xs text-[#909399] font-normal">引用来源</span>
                      </Divider>
                      <div className="space-y-2">
                        {m.sources.map((s, si) => (
                          <div
                            key={si}
                            className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-50"
                          >
                            <div className="text-[13px] font-semibold text-[#7c86d6]">
                              <span className="text-[#909399]">[{si + 1}]</span> {s.title}
                              <Tag
                                color={s.sourceType === 1 ? 'green' : 'orange'}
                                className="ml-1.5"
                              >
                                {s.sourceType === 1 ? '官方' : '同学经验'}
                              </Tag>
                            </div>
                            <div className="mt-1 text-xs text-[#909399] leading-relaxed">
                              {s.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {m.role === 'assistant' && m.recordId && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-xs text-[#909399] mr-1">有帮助吗？</span>
                      <Button
                        size="small"
                        type="text"
                        className="!text-[#7c86d6]"
                        onClick={() => handleLike(m)}
                      >
                        <LikeOutlined className={m.feedback === 1 ? 'text-[#7c86d6]' : ''} /> 有用
                      </Button>
                      <Button size="small" type="text" danger onClick={() => openDislike(m)}>
                        <DislikeOutlined /> 没用
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm shadow-sm">
                  <RobotOutlined />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-indigo-50 text-[#909399] text-sm shadow-sm">
                  正在思考…
                </div>
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div className="flex gap-3 p-4 border-t border-indigo-50 bg-white/60 items-end">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入你的问题，例如：如何办理校园卡挂失？可连续追问"
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={500}
              showCount
              onPressEnter={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex-1 !rounded-xl"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={send}
              className="!h-11 !rounded-xl !px-5"
            >
              发送
            </Button>
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
    </div>
  )
}