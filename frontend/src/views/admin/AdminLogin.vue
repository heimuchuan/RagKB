<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="title">管理员登录</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员工号" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
          登录
        </el-button>
        <div class="back-link">
          <router-link to="/login">返回学生端登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入管理员工号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await login(form)
    if (res.user?.role !== 1) {
      ElMessage.error('该账号不是管理员，无法登录管理端')
      return
    }
    userStore.setToken(res.token)
    userStore.setUserInfo(res.user)
    ElMessage.success('登录成功')
    router.push('/admin/review')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0f0ff 0%, #f5f7fa 100%);
}
.login-card {
  width: 400px;
}
.title {
  text-align: center;
  margin: 8px 0 16px;
  color: #303133;
}
.submit-btn {
  width: 100%;
}
.back-link {
  margin-top: 12px;
  text-align: center;
}
.back-link a {
  font-size: 13px;
  color: #909399;
  text-decoration: none;
}
.back-link a:hover {
  color: #409eff;
}
</style>