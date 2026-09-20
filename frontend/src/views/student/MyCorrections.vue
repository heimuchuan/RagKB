<template>
  <div class="page">
    <StudentNav />
    <div class="container">
      <el-card>
        <h2 class="page-title">我的纠错</h2>
        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="entryId" label="条目ID" width="90" />
          <el-table-column label="原文内容" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.originalContent || '-' }}</template>
          </el-table-column>
          <el-table-column label="建议修正" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.suggestedContent || '-' }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="纠错原因" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="管理员回复" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.adminReply || '-' }}</template>
          </el-table-column>
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
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
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import StudentNav from '@/components/StudentNav.vue'
import { getMyCorrections } from '@/api/correction'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ current: 1, size: 10 })

function statusText(status) {
  return { 0: '待处理', 1: '已采纳', 2: '已拒绝' }[status] || '未知'
}
function statusType(status) {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[status] || 'info'
}
function formatTime(val) {
  return val ? String(val).replace('T', ' ') : ''
}

async function loadList() {
  loading.value = true
  try {
    const res = await getMyCorrections({ current: query.current, size: query.size })
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