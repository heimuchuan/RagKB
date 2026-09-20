<template>
  <div class="page">
    <AdminNav />
    <div class="container">
      <el-card>
        <div class="header-row">
          <h2 class="page-title">用户管理</h2>
          <el-input
            v-model="keyword"
            placeholder="按学号/姓名搜索"
            clearable
            style="width: 220px"
            @keyup.enter="loadList"
            @clear="loadList"
          >
            <template #append>
              <el-button @click="loadList">搜索</el-button>
            </template>
          </el-input>
        </div>

        <el-table :data="list" v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="学号/工号" min-width="120" />
          <el-table-column prop="realName" label="姓名" min-width="100" />
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="roleType(row.role)" effect="light">{{ roleText(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'danger'" effect="light">
                {{ row.status === 0 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-dropdown @command="(role) => handleChangeRole(row, role)">
                <el-button link type="primary">
                  设置角色<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="0" :disabled="row.role === 0">学生</el-dropdown-item>
                    <el-dropdown-item :command="2" :disabled="row.role === 2">信任账号</el-dropdown-item>
                    <el-dropdown-item :command="1" :disabled="row.role === 1">管理员</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="current"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 16px; justify-content: flex-end"
          @current-change="loadList"
          @size-change="loadList"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import AdminNav from '@/components/AdminNav.vue'
import { getUsers, updateUserRole } from '@/api/admin'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const list = ref([])
const loading = ref(false)
const keyword = ref('')
const current = ref(1)
const size = ref(10)
const total = ref(0)

function roleText(role) {
  return { 0: '学生', 1: '管理员', 2: '信任账号' }[role] || '未知'
}
function roleType(role) {
  return { 0: 'info', 1: 'danger', 2: 'warning' }[role] || 'info'
}

async function loadList() {
  loading.value = true
  try {
    const data = await getUsers({ current: current.value, size: size.value, keyword: keyword.value || undefined })
    list.value = data.records || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function handleChangeRole(row, role) {
  if (row.role === role) return
  if (row.id === userStore.userInfo?.id) {
    ElMessage.warning('不能修改自己的角色')
    return
  }
  ElMessageBox.confirm(`确定将「${row.realName || row.username}」的角色设为「${roleText(role)}」吗？`, '提示', {
    type: 'warning'
  })
    .then(async () => {
      await updateUserRole(row.id, { role })
      ElMessage.success('已更新角色')
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
  max-width: 1000px;
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