<template>
  <div class="page">
    <AdminNav />
    <div class="container">
      <el-card>
        <div class="header-row">
          <h2 class="page-title">分类管理</h2>
          <el-button type="primary" @click="openAdd">新增分类</el-button>
        </div>

        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="name" label="分类名称" min-width="140" />
          <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
          <el-table-column prop="sortOrder" label="排序权重" width="100" />
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 新增/编辑弹窗 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="480px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" maxlength="50" show-word-limit />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="排序权重" prop="sortOrder">
            <el-input-number v-model="form.sortOrder" :min="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminNav from '@/components/AdminNav.vue'
import { getCategories } from '@/api/category'
import { addCategory, updateCategory, deleteCategory } from '@/api/admin'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = reactive({ id: null, name: '', description: '', sortOrder: 0 })
const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

function formatTime(val) {
  return val ? String(val).replace('T', ' ') : ''
}

async function loadList() {
  loading.value = true
  try {
    list.value = (await getCategories()) || []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  form.id = null
  form.name = ''
  form.description = ''
  form.sortOrder = 0
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.sortOrder = row.sortOrder || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const data = { name: form.name, description: form.description, sortOrder: form.sortOrder }
    if (isEdit.value) {
      await updateCategory(form.id, data)
      ElMessage.success('已更新')
    } else {
      await addCategory(data)
      ElMessage.success('已新增')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteCategory(row.id)
      ElMessage.success('已删除')
      loadList()
    })
    .catch(() => {})
}

onMounted(loadList)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
}
.container {
  max-width: 900px;
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
</style>