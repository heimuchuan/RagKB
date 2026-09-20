<template>
  <div class="page">
    <StudentNav />
    <div class="container">
      <el-card>
        <h2 class="page-title">我的提交</h2>
        <div class="filter-row">
          <el-radio-group v-model="statusFilter" @change="handleFilter">
            <el-radio-button :label="null">全部</el-radio-button>
            <el-radio-button :label="0">待审核</el-radio-button>
            <el-radio-button :label="1">已通过</el-radio-button>
            <el-radio-button :label="2">已驳回</el-radio-button>
          </el-radio-group>
        </div>

        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="分类" width="120">
            <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === 0">
                <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
              </template>
              <template v-else-if="row.status === 2">
                <el-tooltip :content="row.rejectReason || '无'" placement="top">
                  <el-button link type="info">驳回原因</el-button>
                </el-tooltip>
              </template>
              <span v-else>-</span>
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
      <el-dialog v-model="editVisible" title="编辑提交" width="560px">
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
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StudentNav from '@/components/StudentNav.vue'
import { getMyEntries, updateEntry, deleteEntry } from '@/api/entry'
import { getCategories } from '@/api/category'

const categories = ref([])
const list = ref([])
const total = ref(0)
const loading = ref(false)
const statusFilter = ref(null)

const query = reactive({ current: 1, size: 10 })

const editVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = reactive({ id: null, title: '', categoryId: null, content: '' })
const editRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
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
    if (statusFilter.value != null) params.status = statusFilter.value
    const res = await getMyEntries(params)
    list.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  query.current = 1
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
    await updateEntry(editForm.id, {
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
  ElMessageBox.confirm('确定要删除该条提交吗？', '提示', { type: 'warning' })
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
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 16px;
}
.page-title {
  margin: 0 0 16px;
  color: #303133;
}
.filter-row {
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>