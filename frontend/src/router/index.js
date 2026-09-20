import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/student/Login.vue')
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/student/Home.vue')
  },
  {
    path: '/knowledge',
    name: 'knowledge',
    component: () => import('@/views/student/Knowledge.vue')
  },
  {
    path: '/submit',
    name: 'submit',
    component: () => import('@/views/student/Submit.vue')
  },
  {
    path: '/my-submissions',
    name: 'my-submissions',
    component: () => import('@/views/student/MySubmissions.vue')
  },
  {
    path: '/my-corrections',
    name: 'my-corrections',
    component: () => import('@/views/student/MyCorrections.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/student/Profile.vue')
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/AdminLogin.vue')
  },
  {
    path: '/admin/review',
    name: 'admin-review',
    component: () => import('@/views/admin/Review.vue')
  },
  {
    path: '/admin/entries',
    name: 'admin-entries',
    component: () => import('@/views/admin/Entries.vue')
  },
  {
    path: '/admin/categories',
    name: 'admin-categories',
    component: () => import('@/views/admin/Categories.vue')
  },
  {
    path: '/admin/corrections',
    name: 'admin-corrections',
    component: () => import('@/views/admin/Corrections.vue')
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/Users.vue')
  },
  {
    path: '/admin/stats',
    name: 'admin-stats',
    component: () => import('@/views/admin/Stats.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局前置守卫：
 * 1. 管理员端：/admin/**（除 /admin/login）需登录且 role === 1，否则跳 /admin/login
 * 2. 学生端需要登录的页面：未登录跳 /login
 */
// 信任账号（role=2）可访问的后台页面：审核 + 纠错处理
const reviewerPages = ['/admin/review', '/admin/corrections']

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  let userInfo = null
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
  } catch (e) {
    userInfo = null
  }

  // 后台端鉴权：管理员(1)全部可访问，信任账号(2)仅审核/纠错页
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    if (!token || !userInfo || (userInfo.role !== 1 && userInfo.role !== 2)) {
      return next('/admin/login')
    }
    // 信任账号只能访问审核与纠错处理页面
    if (userInfo.role === 2 && !reviewerPages.includes(to.path)) {
      return next('/admin/review')
    }
  }

  // 学生端需要登录的页面
  const studentAuthPages = ['/submit', '/my-submissions', '/my-corrections', '/profile']
  if (studentAuthPages.includes(to.path) && !token) {
    return next('/login')
  }

  next()
})

export default router