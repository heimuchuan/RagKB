<template>
  <div class="page">
    <AdminNav />
    <div class="container">
      <el-card>
        <div class="header-row">
          <h2 class="page-title">条目管理</h2>
          <el-button type="primary" @click="openOfficial">新增官方条目</el-button>
        </div>
        <div class="filter-row">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
          <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 160px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>

        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column label="分类" width="110">
            <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="90">
            <template #default="{ row }">
              <el-tag :type="row.sourceType === 1 ? 'success' : 'warning'" size="small">
                {{ row.sourceType === 1 ? '官方' : '同学经验' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="浏览" width="80" />
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

      <!-- 编辑弹窗 -->
      <el-dialog v-model="editVisible" title="编辑条目" width="560px">
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="editForm.title" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="分类" prop="categoryId">
            <el-select v-model="editForm.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="正文" prop="content">
            <el-input v-model="editForm.content" type="textarea" :rows="8" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" :loading="editLoading" @click="handleEditSubmit">保存</el-button>
        </template>
      </el-dialog>

      <!-- 官方录入弹窗 -->
      <el-dialog v-model="officialVisible" title="新增官方条目" width="560px">
        <el-form ref="officialFormRef" :model="officialForm" :rules="officialRules" label-width="80px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="officialForm.title" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="分类" prop="categoryId">
            <el-select v-model="officialForm.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="正文" prop="content">
            <el-input v-model="officialForm.content" type="textarea" :rows="8" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="officialVisible = false">取消</el-button>
          <el-button type="primary" :loading="officialLoading" @click="handleOfficialSubmit">发布</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminNav from '@/components/AdminNav.vue'
import { getAllEntries, editEntry, deleteEntry, createOfficialEntry } from '@/api/admin'
import { getCategories } from '@/api/category'

const categories = ref([])
const list = ref([])
const total = ref(0)
const loading = ref(false)
const timeRange = ref(null)

const query = reactive({
  current: 1,
  size: 10,
  status: null,
  categoryId: null,
  startTime: null,
  endTime: null
})

const editVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = reactive({ id: null, title: '', categoryId: null, content: '' })
const editRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
}

const officialVisible = ref(false)
const officialLoading = ref(false)
const officialFormRef = ref()
const officialForm = reactive({ title: '', categoryId: null, content: '' })
const officialRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
}

function openOfficial() {
  officialForm.title = ''
  officialForm.categoryId = null
  officialForm.content = ''
  officialVisible.value = true
}

async function handleOfficialSubmit() {
  await officialFormRef.value.validate()
  officialLoading.value = true
  try {
    await createOfficialEntry({
      title: officialForm.title,
      categoryId: officialForm.categoryId,
      content: officialForm.content
    })
    ElMessage.success('已发布官方条目')
    officialVisible.value = false
    loadList()
  } finally {
    officialLoading.value = false
  }
}

function statusText(status) {
  return { 0: '待审核', 1: '已通过', 2: '已驳回' }[status] || '未知'
}
function statusType(status) {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[status] || 'info'
}
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
    const params = { current: query.current, size: query.size }
    if (query.status != null) params.status = query.status
    if (query.categoryId != null) params.categoryId = query.categoryId
    if (query.startTime) params.startTime = query.startTime
    if (query.endTime) params.endTime = query.endTime
    const res = await getAllEntries(params)
    list.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.current = 1
  query.startTime = timeRange.value?.[0] || null
  query.endTime = timeRange.value?.[1] || null
  loadList()
}

function handleReset() {
  query.current = 1
  query.status = null
  query.categoryId = null
  query.startTime = null
  query.endTime = null
  timeRange.value = null
  loadList()
}

function handlePageChange(page) {
  query.current = page
  loadList()
}

function openEdit(row) {
  editForm.id = row.id
  editForm.title = row.title
  editForm.categoryId = row.categoryId
  editForm.content = row.content
  editVisible.value = true
}

async function handleEditSubmit() {
  await editFormRef.value.validate()
  editLoading.value = true
  try {
    await editEntry(editForm.id, {
      title: editForm.title,
      categoryId: editForm.categoryId,
      content: editForm.content
    })
    ElMessage.success('已保存')
    editVisible.value = false
    loadList()
  } finally {
    editLoading.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该条目吗？删除后不可恢复。', '提示', { type: 'warning' })
    .then(async () => {
      await deleteEntry(row.id)
      ElMessage.success('已删除')
      loadList()
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
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 16px;
}
.page-title {
  margin: 0 0 16px;
  color: #303133;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.header-row .page-title {
  margin: 0;
}
.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>