<template>
  <div class="page">
    <StudentNav />
    <div class="container">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <h3 class="card-title">基本信息</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="学号/工号">{{ userStore.userInfo?.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="真实姓名">{{ userStore.userInfo?.realName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userStore.userInfo?.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="角色">{{ roleText }}</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ formatTime(userStore.userInfo?.createdAt) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <h3 class="card-title">修改密码</h3>
            <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
              <el-form-item label="原密码" prop="oldPassword">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="pwdForm.newPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading" @click="handleUpdatePassword">保存</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StudentNav from '@/components/StudentNav.vue'
import { updatePassword } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const pwdFormRef = ref()

const roleText = computed(() => (userStore.userInfo?.role === 1 ? '管理员' : '学生'))

const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

function formatTime(val) {
  return val ? String(val).replace('T', ' ') : '-'
}

async function handleUpdatePassword() {
  await pwdFormRef.value.validate()
  loading.value = true
  try {
    await updatePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    userStore.logout()
    router.push('/login')
  } finally {
    loading.value = false
  }
}
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
.card-title {
  margin: 0 0 16px;
  color: #303133;
}
</style>