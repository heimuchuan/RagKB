<template>
  <div class="student-nav">
    <div class="nav-inner">
      <router-link to="/" class="brand">校园协作知识库</router-link>
      <el-menu
        mode="horizontal"
        router
        :default-active="$route.path"
        class="nav-menu"
      >
        <el-menu-item index="/">首页问答</el-menu-item>
        <el-menu-item index="/knowledge">知识库</el-menu-item>
        <el-menu-item index="/submit">提交信息</el-menu-item>
        <el-menu-item index="/my-submissions">我的提交</el-menu-item>
        <el-menu-item index="/my-corrections">我的纠错</el-menu-item>
        <el-menu-item index="/profile">个人中心</el-menu-item>
      </el-menu>
      <div class="nav-right">
        <template v-if="userStore.userInfo">
          <span class="username">{{ userStore.userInfo.realName || userStore.userInfo.username }}</span>
          <el-button link type="danger" @click="handleLogout">退出登录</el-button>
        </template>
        <el-button v-else link type="primary" @click="$router.push('/login')">登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    type: 'warning'
  })
    .then(() => {
      userStore.logout()
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<style scoped>
.student-nav {
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