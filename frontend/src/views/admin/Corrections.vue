<template>
  <div class="page">
    <AdminNav />
    <div class="container">
      <el-card>
        <h2 class="page-title">纠错处理</h2>
        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="entryId" label="条目ID" width="90" />
          <el-table-column label="原文内容" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.originalContent || '-' }}</template>
          </el-table-column>
          <el-table-column label="建议修正" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.suggestedContent || '-' }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="纠错原因" min-width="140" show-overflow-tooltip />
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="success" @click="openHandle(row, 1)">采纳</el-button>
              <el-button link type="danger" @click="openHandle(row, 2)">拒绝</el-button>
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

      <!-- 处理弹窗 -->
      <el-dialog :title="handleStatus === 1 ? '采纳纠错' : '拒绝纠错'" v-model="handleVisible" width="480px">
        <el-input
          v-model="handleReply"
          type="textarea"
          :rows="4"
          placeholder="请填写给用户的回复"
        />
        <template #footer>
          <el-button @click="handleVisible = false">取消</el-button>
          <el-button
            :type="handleStatus === 1 ? 'success' : 'danger'"
            :loading="handleLoading"
            @click="handleSubmit"
          >
            确认{{ handleStatus === 1 ? '采纳' : '拒绝' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminNav from '@/components/AdminNav.vue'
import { getPendingCorrections, handleCorrection } from '@/api/admin'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ current: 1, size: 10 })

const handleVisible = ref(false)
const handleLoading = ref(false)
const handleStatus = ref(1)
const handleReply = ref('')
const handleId = ref(null)

function formatTime(val) {
  return val ? String(val).replace('T', ' ') : ''
}

async function loadList() {
  loading.value = true
  try {
    const res = await getPendingCorrections({ current: query.current, size: query.size })
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

function openHandle(row, status) {
  handleId.value = row.id
  handleStatus.value = status
  handleReply.value = ''
  handleVisible.value = true
}

async function handleSubmit() {
  handleLoading.value = true
  try {
    await handleCorrection(handleId.value, {
      status: handleStatus.value,
      reply: handleReply.value || ''
    })
    ElMessage.success('已处理')
    handleVisible.value = false
    loadList()
  } finally {
    handleLoading.value = false
  }
}

onMounted(loadList)
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
.page-title {
  margin: 0 0 16px;
  color: #303133;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>