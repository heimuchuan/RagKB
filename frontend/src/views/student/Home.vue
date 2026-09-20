<template>
  <div class="page">
    <StudentNav />
    <div class="chat-layout">
      <!-- 会话列表侧栏 -->
      <aside class="session-panel">
        <el-button type="primary" class="new-btn" @click="newChat">＋ 新对话</el-button>
        <div class="session-list">
          <div
            v-for="s in sessions"
            :key="s.sessionId"
            class="session-item"
            :class="{ active: s.sessionId === currentSessionId }"
            @click="openSession(s.sessionId)"
          >
            <div class="session-title">{{ s.title || '未命名对话' }}</div>
            <div class="session-time">{{ formatTime(s.lastTime) }}</div>
            <div class="session-actions">
              <el-icon title="重命名" @click.stop="rename(s)"><EditPen /></el-icon>
              <el-icon class="danger" title="删除会话" @click.stop="removeSession(s)"><Delete /></el-icon>
            </div>
          </div>
          <div v-if="!sessions.length" class="session-empty">暂无历史对话</div>
        </div>
      </aside>

      <!-- 对话区 -->
      <main class="chat-panel">
        <div class="chat-box" ref="chatBoxRef">
          <div v-if="!messages.length" class="chat-empty">
            <div class="empty-title">你好，我是校园知识助手</div>
            <div class="empty-sub">关于校园规章制度、学习生活、设施服务的问题，都可以问我</div>
          </div>

          <div v-for="(m, idx) in messages" :key="idx" class="msg-row" :class="m.role">
            <div class="msg-bubble" :class="m.role">
              <div class="msg-content">{{ m.content }}</div>
              <template v-if="m.role === 'assistant' && m.sources && m.sources.length">
                <el-divider class="src-divider" content-position="left">引用来源</el-divider>
                <div v-for="(s, si) in m.sources" :key="si" class="source-item">
                  <div class="source-title">
                    <span class="source-index">[{{ si + 1 }}]</span> {{ s.title }}
                    <el-tag :type="s.sourceType === 1 ? 'success' : 'warning'" size="small" class="source-tag">
                      {{ s.sourceType === 1 ? '官方' : '同学经验' }}
                    </el-tag>
                  </div>
                  <div class="source-content">{{ s.content }}</div>
                </div>
              </template>
              <div v-if="m.role === 'assistant' && m.recordId" class="feedback-row">
                <span class="feedback-label">有帮助吗？</span>
                <el-button size="small" :type="m.feedback === 1 ? 'primary' : 'default'" @click="handleLike(m)">点赞</el-button>
                <el-button size="small" :type="m.feedback === 2 ? 'danger' : 'default'" @click="handleDislike(m)">点踩</el-button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="msg-row assistant">
            <div class="msg-bubble assistant typing">正在思考…</div>
          </div>
        </div>

        <div class="input-row">
          <el-input
            v-model="input"
            type="textarea"
            :rows="2"
            placeholder="请输入你的问题，例如：如何办理校园卡挂失？可连续追问"
            maxlength="500"
            show-word-limit
            @keydown.enter.exact.prevent="send"
          />
          <el-button type="primary" :loading="loading" @click="send">发送</el-button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StudentNav from '@/components/StudentNav.vue'
import { Delete, EditPen } from '@element-plus/icons-vue'
import { ask, deleteSession, feedbackQa, getSessions, getSessionMessages, renameSession } from '@/api/qa'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const sessions = ref([])
const currentSessionId = ref(null)
const messages = ref([])
const input = ref('')
const loading = ref(false)
const chatBoxRef = ref()

function formatTime(val) {
  if (!val) return ''
  return String(val).replace('T', ' ').slice(0, 16)
}

// sources 可能是数组（ask 返回）或 JSON 字符串（session 接口返回）
function normalizeSources(s) {
  if (Array.isArray(s)) return s
  if (typeof s === 'string' && s) {
    try {
      return JSON.parse(s)
    } catch (e) {
      return []
    }
  }
  return []
}

async function scrollToBottom() {
  await nextTick()
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight
  }
}

async function loadSessions() {
  try {
    sessions.value = (await getSessions()) || []
  } catch (e) {
    // 未登录等情况忽略
  }
}

function newChat() {
  currentSessionId.value = null
  messages.value = []
  input.value = ''
}

async function openSession(sessionId) {
  currentSessionId.value = sessionId
  messages.value = []
  try {
    const records = (await getSessionMessages(sessionId)) || []
    const list = []
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
    messages.value = list
    scrollToBottom()
  } catch (e) {
    ElMessage.error('加载会话失败')
  }
}

async function rename(s) {
  let value
  try {
    const r = await ElMessageBox.prompt('请输入新的会话标题', '重命名会话', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: s.title || '未命名对话',
      inputPattern: /\S+/,
      inputErrorMessage: '标题不能为空'
    })
    value = r.value
  } catch (e) {
    return
  }
  const newTitle = (value || '').trim()
  if (!newTitle) return
  try {
    await renameSession(s.sessionId, newTitle)
    s.title = newTitle
    ElMessage.success('标题已更新')
    loadSessions()
  } catch (e) {
    ElMessage.error('更新失败，请重试')
  }
}

async function removeSession(s) {
  try {
    await ElMessageBox.confirm(`确定删除会话「${s.title || '未命名对话'}」吗？删除后不可恢复。`, '删除会话', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await deleteSession(s.sessionId)
    // 若删除的是当前会话，则清空聊天区
    if (s.sessionId === currentSessionId.value) {
      currentSessionId.value = null
      messages.value = []
    }
    ElMessage.success('会话已删除')
    loadSessions()
  } catch (e) {
    ElMessage.error('删除失败，请重试')
  }
}

async function send() {
  const q = input.value.trim()
  if (!q) {
    ElMessage.warning('请输入问题')
    return
  }
  if (!userStore.token) {
    ElMessage.warning('请先登录后再提问')
    router.push('/login')
    return
  }
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  loading.value = true
  scrollToBottom()
  try {
    const res = await ask({ question: q, sessionId: currentSessionId.value })
    currentSessionId.value = res.sessionId || currentSessionId.value
    messages.value.push({
      role: 'assistant',
      content: res.answer || '',
      sources: normalizeSources(res.sources),
      recordId: res.id,
      feedback: 0
    })
    loadSessions()
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function handleLike(m) {
  if (!m.recordId) return
  feedbackQa(m.recordId, { type: 1 })
    .then(() => {
      m.feedback = 1
      ElMessage.success('感谢反馈')
    })
    .catch(() => {})
}

function handleDislike(m) {
  if (!m.recordId) return
  ElMessageBox.prompt('请填写点踩原因（选填）', '点踩反馈', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '请描述回答存在的问题'
  })
    .then(({ value }) => {
      return feedbackQa(m.recordId, { type: 2, reason: value || '' }).then(() => {
        m.feedback = 2
        ElMessage.success('感谢反馈')
      })
    })
    .catch(() => {})
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
}
.chat-layout {
  max-width: 1100px;
  margin: 20px auto;
  padding: 0 16px;
  display: flex;
  gap: 16px;
  height: calc(100vh - 96px);
}
.session-panel {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.new-btn {
  margin-bottom: 12px;
}
.session-list {
  flex: 1;
  overflow: auto;
}
.session-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  position: relative;
}
.session-actions {
  position: absolute;
  top: 9px;
  right: 8px;
  display: none;
  gap: 8px;
  align-items: center;
}
.session-item:hover .session-actions {
  display: flex;
}
.session-actions .el-icon {
  font-size: 14px;
  color: #909399;
  cursor: pointer;
}
.session-actions .el-icon.danger {
  color: #f56c6c;
}
.session-item:hover {
  background: #f5f7fa;
}
.session-item.active {
  background: #ecf5ff;
}
.session-title {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 36px;
}
.session-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.session-empty {
  font-size: 13px;
  color: #c0c4cc;
  text-align: center;
  margin-top: 20px;
}
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.chat-box {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
.chat-empty {
  text-align: center;
  margin-top: 120px;
  color: #909399;
}
.empty-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 8px;
}
.empty-sub {
  font-size: 14px;
}
.msg-row {
  display: flex;
  margin-bottom: 16px;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.assistant {
  justify-content: flex-start;
}
.msg-bubble {
  max-width: 80%;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.7;
}
.msg-bubble.user {
  background: #409eff;
  color: #fff;
  border-top-right-radius: 2px;
}
.msg-bubble.assistant {
  background: #f5f7fa;
  color: #303133;
  border-top-left-radius: 2px;
}
.msg-bubble.typing {
  color: #909399;
}
.msg-content {
  white-space: pre-wrap;
}
.src-divider {
  margin: 10px 0 6px;
}
.source-item {
  padding: 6px 0;
  border-bottom: 1px dashed #ebeef5;
}
.source-item:last-child {
  border-bottom: none;
}
.source-title {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}
.source-index {
  color: #909399;
}
.source-tag {
  margin-left: 6px;
}
.source-content {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
.feedback-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.feedback-label {
  font-size: 12px;
  color: #909399;
}
.input-row {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  align-items: flex-end;
}
.input-row .el-textarea {
  flex: 1;
}
</style>