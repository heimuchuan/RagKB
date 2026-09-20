<template>
  <div class="page">
    <StudentNav />
    <div class="container">
      <el-card>
        <h2 class="page-title">知识库浏览</h2>
        <div class="filter-row">
          <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 180px">
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
          <el-input
            v-model="query.keyword"
            placeholder="关键词搜索"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="分类" width="120">
            <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column label="来源" width="90">
            <template #default="{ row }">
              <el-tag :type="row.sourceType === 1 ? 'success' : 'warning'" size="small">
                {{ row.sourceType === 1 ? '官方' : '同学经验' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="浏览" width="80" />
          <el-table-column label="收录时间" width="160">
            <template #default="{ row }">{{ formatTime(row.approvedAt || row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
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
          <el-tag :type="detail.sourceType === 1 ? 'success' : 'warning'" size="small">
            {{ detail.sourceType === 1 ? '官方' : '同学经验' }}
          </el-tag>
          <span class="meta-text">浏览次数：{{ detail.viewCount }}</span>
          <span class="meta-text">收录时间：{{ formatTime(detail.approvedAt || detail.createdAt) }}</span>
        </div>
        <div class="detail-content">{{ detail.content }}</div>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button v-if="detail.sourceType !== 1" type="warning" @click="openCorrection">提交纠错</el-button>
          <el-tooltip v-else content="官方内容由管理员维护，不支持纠错">
            <el-button type="warning" disabled>提交纠错</el-button>
          </el-tooltip>
        </template>
      </el-dialog>

      <!-- 纠错弹窗 -->
      <el-dialog v-model="correctionVisible" title="提交纠错" width="560px">
        <el-form :model="correctionForm" label-width="90px">
          <el-form-item label="关联条目">
            <span>{{ correctionForm.entryTitle }}</span>
          </el-form-item>
          <el-form-item label="原文内容">
            <el-input v-model="correctionForm.originalContent" type="textarea" :rows="3" readonly />
          </el-form-item>
          <el-form-item label="建议修正">
            <el-input v-model="correctionForm.suggestedContent" type="textarea" :rows="3" placeholder="请填写建议修正后的内容" />
          </el-form-item>
          <el-form-item label="纠错原因">
            <el-input v-model="correctionForm.reason" type="textarea" :rows="2" placeholder="请说明纠错原因" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="correctionVisible = false">取消</el-button>
          <el-button type="primary" :loading="correctionLoading" @click="handleCorrectionSubmit">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StudentNav from '@/components/StudentNav.vue'
import { getPublicEntries, getEntryDetail } from '@/api/entry'
import { getCategories } from '@/api/category'
import { submitCorrection } from '@/api/correction'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const categories = ref([])
const list = ref([])
const total = ref(0)
const loading = ref(false)

const query = reactive({
  current: 1,
  size: 10,
  categoryId: null,
  keyword: ''
})

const detailVisible = ref(false)
const detail = ref({})

const correctionVisible = ref(false)
const correctionLoading = ref(false)
const correctionForm = reactive({
  entryId: null,
  entryTitle: '',
  originalContent: '',
  suggestedContent: '',
  reason: ''
})

function categoryName(id) {
  const c = categories.value.find((x) => x.id === id)
  return c ? c.name : '未分类'
}

function formatTime(val) {
  return val ? String(val).replace('T', ' ') : ''
}

async function loadCategories() {
  categories.value = (await getCategories()) || []
}

async function loadList() {
  loading.value = true
  try {
    const params = { current: query.current, size: query.size }
    if (query.categoryId != null) params.categoryId = query.categoryId
    if (query.keyword) params.keyword = query.keyword
    const res = await getPublicEntries(params)
    list.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.current = 1
  loadList()
}

function handlePageChange(page) {
  query.current = page
  loadList()
}

async function openDetail(row) {
  detail.value = await getEntryDetail(row.id)
  detailVisible.value = true
}

function openCorrection() {
  if (!userStore.token) {
    ElMessage.warning('请先登录后再提交纠错')
    router.push('/login')
    return
  }
  correctionForm.entryId = detail.value.id
  correctionForm.entryTitle = detail.value.title
  correctionForm.originalContent = detail.value.content || ''
  correctionForm.suggestedContent = ''
  correctionForm.reason = ''
  correctionVisible.value = true
}

async function handleCorrectionSubmit() {
  if (!correctionForm.suggestedContent && !correctionForm.reason) {
    ElMessage.warning('请至少填写建议修正内容或纠错原因')
    return
  }
  correctionLoading.value = true
  try {
    await submitCorrection({
      entryId: correctionForm.entryId,
      originalContent: correctionForm.originalContent,
      suggestedContent: correctionForm.suggestedContent,
      reason: correctionForm.reason
    })
    ElMessage.success('纠错已提交')
    correctionVisible.value = false
  } finally {
    correctionLoading.value = false
  }
}

onMounted(async () => {
  await loadCategories()
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
.page-title {
  margin: 0 0 16px;
  color: #303133;
}
.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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