<template>
  <div class="page">
    <AdminNav />
    <div class="container">
      <!-- 知识库概览 -->
      <el-card class="section">
        <h2 class="page-title">知识库概览</h2>
        <el-row :gutter="16">
          <el-col :span="6" v-for="item in overviewCards" :key="item.label">
            <div class="stat-card">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </el-col>
        </el-row>
        <h3 class="sub-title">分类分布</h3>
        <el-table :data="overview.categories || []" style="width: 100%" max-height="300">
          <el-table-column prop="name" label="分类" min-width="160" />
          <el-table-column prop="count" label="条目数" width="120" />
        </el-table>
      </el-card>

      <!-- 提交统计 -->
      <el-card class="section">
        <h2 class="page-title">提交统计</h2>
        <div class="pass-rate">
          <span class="pass-rate-label">通过率</span>
          <el-progress :percentage="sub.passRate || 0" :stroke-width="16" text-inside />
        </div>
        <el-row :gutter="16" class="sub-cards">
          <el-col :span="6" v-for="(item, idx) in subCards" :key="idx">
            <div class="stat-card">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </el-col>
        </el-row>
        <h3 class="sub-title">近 7 日提交趋势</h3>
        <el-table :data="sub.trend || []" style="width: 100%">
          <el-table-column prop="date" label="日期" min-width="160" />
          <el-table-column prop="count" label="提交量" width="120" />
        </el-table>
      </el-card>

      <!-- 问答统计 -->
      <el-card class="section">
        <h2 class="page-title">问答统计</h2>
        <h3 class="sub-title">热门问题 Top10</h3>
        <el-table :data="qa.hotQuestions || []" style="width: 100%" max-height="300">
          <el-table-column prop="question" label="问题" min-width="240" show-overflow-tooltip />
          <el-table-column prop="cnt" label="提问次数" width="120" />
        </el-table>
        <h3 class="sub-title">点踩最多问题</h3>
        <el-table :data="qa.negativeQuestions || []" style="width: 100%" max-height="300">
          <el-table-column prop="question" label="问题" min-width="240" show-overflow-tooltip />
          <el-table-column prop="cnt" label="点踩次数" width="120" />
        </el-table>
      </el-card>

      <!-- 贡献排行 -->
      <el-card class="section">
        <h2 class="page-title">用户贡献排行</h2>
        <el-table :data="contributors.list || []" style="width: 100%">
          <el-table-column type="index" label="排名" width="70" />
          <el-table-column prop="username" label="学号/工号" min-width="140" />
          <el-table-column prop="realName" label="姓名" min-width="120" />
          <el-table-column prop="total" label="提交量" width="100" />
          <el-table-column prop="approved" label="通过量" width="100" />
          <el-table-column label="通过率" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.passRate || 0" :stroke-width="14" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import {
  getStatsOverview,
  getStatsSubmissions,
  getStatsQa,
  getStatsContributors
} from '@/api/admin'

const overview = reactive({})
const sub = reactive({})
const qa = reactive({ hotQuestions: [], negativeQuestions: [] })
const contributors = reactive({ list: [] })
const loading = ref(false)

const overviewCards = computed(() => [
  { label: '总条目数', value: overview.total ?? 0 },
  { label: '待审核', value: overview.pending ?? 0 },
  { label: '已通过', value: overview.approved ?? 0 },
  { label: '已驳回', value: overview.rejected ?? 0 }
])

const subCards = computed(() => [
  { label: '总提交', value: sub.total ?? 0 },
  { label: '待审核', value: sub.pending ?? 0 },
  { label: '已通过', value: sub.approved ?? 0 },
  { label: '已驳回', value: sub.rejected ?? 0 }
])

async function load() {
  loading.value = true
  try {
    const [o, s, q, c] = await Promise.all([
      getStatsOverview(),
      getStatsSubmissions(),
      getStatsQa(),
      getStatsContributors()
    ])
    Object.assign(overview, o || {})
    Object.assign(sub, s || {})
    Object.assign(qa, q || {})
    Object.assign(contributors, c || {})
  } finally {
    loading.value = false
  }
}

onMounted(load)
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section {
  width: 100%;
}
.page-title {
  margin: 0 0 16px;
  color: #303133;
}
.sub-title {
  margin: 16px 0 12px;
  color: #606266;
  font-size: 15px;
}
.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}
.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}
.pass-rate {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  max-width: 500px;
}
.pass-rate-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
</style>