<template>
  <div class="admin-nav">
    <div class="nav-inner">
      <router-link to="/admin/review" class="brand">校园协作知识库 · 管理端</router-link>
      <el-menu
        mode="horizontal"
        router
        :default-active="$route.path"
        class="nav-menu"
      >
        <el-menu-item index="/admin/review">审核管理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin/entries">条目管理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin/categories">分类管理</el-menu-item>
        <el-menu-item index="/admin/corrections">纠错处理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin/users">用户管理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin/stats">数据统计</el-menu-item>
      </el-menu>
      <div class="nav-right">
        <span class="username">{{ displayName }}</span>
        <el-button link type="danger" @click="handleLogout">退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.userInfo?.role === 1)
const displayName = computed(() => {
  const u = userStore.userInfo
  const name = u?.realName || u?.username || '管理员'
  return u?.role === 2 ? `${name}（信任账号）` : name
})

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    type: 'warning'
  })
    .then(() => {
      userStore.logout()
      router.push('/admin/login')
    })
    .catch(() => {})
}
</script>

<style scoped>
.admin-nav {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
}
.brand {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  text-decoration: none;
  margin-right: 24px;
  white-space: nowrap;
}
.nav-menu {
  flex: 1;
  border-bottom: none;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
}
.username {
  font-size: 14px;
  color: #606266;
}
</style>