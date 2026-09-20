<template>
  <div class="page">
    <AdminNav />
    <div class="container">
      <el-card>
        <div class="header-row">
          <h2 class="page-title">审核管理</h2>
          <el-button
            type="primary"
            :disabled="!selected.length"
            :loading="batchLoading"
            @click="handleBatchApprove"
          >
            批量通过（{{ selected.length }}）
          </el-button>
        </div>

        <el-table
          :data="list"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column label="分类" width="110">
            <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="openReject(row)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            layout="total, prev, pager, next"
            :total="total"
            :page-size="query.size"
            :current-page="query.current"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <!-- 详情弹窗 -->
      <el-dialog v-model="detailVisible" :title="detail.title" width="640px">
        <div class="detail-meta">
          <el-tag size="small">{{ categoryName(detail.categoryId) }}</el-tag>
          <span class="meta-text">提交时间：{{ formatTime(detail.createdAt) }}</span>
        </div>
        <div class="detail-content">{{ detail.content }}</div>
      </el-dialog>

      <!-- 驳回弹窗 -->
      <el-dialog v-model="rejectVisible" title="驳回原因" width="480px">
        <el-input
          v-model="rejectReason"
          type="textarea"
          :rows="4"
          placeholder="请填写驳回原因"
        />
        <template #footer>
          <el-button @click="rejectVisible = false">取消</el-button>
          <el-button type="danger" :loading="rejectLoading" @click="handleRejectSubmit">确认驳回</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminNav from '@/components/AdminNav.vue'
import { getPendingEntries, approveEntry, rejectEntry, batchApprove } from '@/api/admin'
import { getCategories } from '@/api/category'

const categories = ref([])
const list = ref([])
const total = ref(0)
const loading = ref(false)
const selected = ref([])
const batchLoading = ref(false)
const query = reactive({ current: 1, size: 10 })

const detailVisible = ref(false)
const detail = ref({})

const rejectVisible = ref(false)
const rejectLoading = ref(false)
const rejectReason = ref('')
const rejectId = ref(null)

function categoryName(id) {
  const c = categories.value.find((x) => x.id === id)
  return c ? c.name : '未分类'
}
function formatTime(val) {
  return val ? String(val).replace('T', ' ') : ''
}

async function loadList() {
  loading.value = true
  try {
    const res = await getPendingEntries({ current: query.current, size: query.size })
    list.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  query.current = page
  loadList()
}

function handleSelectionChange(rows) {
  selected.value = rows
}

function openDetail(row) {
  detail.value = row
  detailVisible.value = true
}

function handleApprove(row) {
  ElMessageBox.confirm(`确定通过「${row.title}」吗？通过后将写入知识库。`, '审核通过', {
    type: 'info'
  })
    .then(async () => {
      await approveEntry(row.id)
      ElMessage.success('已通过')
      loadList()
    })
    .catch(() => {})
}

function openReject(row) {
  rejectId.value = row.id
  rejectReason.value = ''
  rejectVisible.value = true
}

async function handleRejectSubmit() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  rejectLoading.value = true
  try {
    await rejectEntry(rejectId.value, { reason: rejectReason.value })
    ElMessage.success('已驳回')
    rejectVisible.value = false
    loadList()
  } finally {
    rejectLoading.value = false
  }
}

function handleBatchApprove() {
  const ids = selected.value.map((x) => x.id)
  ElMessageBox.confirm(`确定批量通过选中的 ${ids.length} 条提交吗？`, '批量审核', {
    type: 'info'
  })
    .then(async () => {
      batchLoading.value = true
      try {
        const n = await batchApprove(ids)
        ElMessage.success(`已通过 ${n} 条`)
        loadList()
      } finally {
        batchLoading.value = false
      }
    })
    .catch(() => {})
}

onMounted(async () => {
  categories.value = (await getCategories()) || []
  loadList()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
}
.container {
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 16px;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  margin: 0;
  color: #303133;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.meta-text {
  font-size: 13px;
  color: #909399;
}
.detail-content {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #303133;
  max-height: 400px;
  overflow: auto;
}
</style>