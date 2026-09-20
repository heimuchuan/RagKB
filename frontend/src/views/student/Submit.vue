<template>
  <div class="page">
    <StudentNav />
    <div class="container">
      <el-card>
        <h2 class="page-title">提交信息</h2>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="90px"
          class="submit-form"
        >
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入标题，例如：图书馆借阅指南" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="分类" prop="categoryId">
            <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="正文" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="10"
              placeholder="请输入正文内容"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSubmit">提交审核</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StudentNav from '@/components/StudentNav.vue'
import { getCategories } from '@/api/category'
import { submitEntry } from '@/api/entry'

const router = useRouter()

const categories = ref([])
const loading = ref(false)
const formRef = ref()

const form = reactive({
  title: '',
  categoryId: null,
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
}

function resetForm() {
  form.title = ''
  form.categoryId = null
  form.content = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await submitEntry(form)
    ElMessage.success('提交成功，等待管理员审核')
    router.push('/my-submissions')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  categories.value = (await getCategories()) || []
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
}
.container {
  max-width: 800px;
  margin: 24px auto;
  padding: 0 16px;
}
.page-title {
  margin: 0 0 16px;
  color: #303133;
}
</style>