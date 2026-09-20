import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import Login from '@/views/student/Login'
import Home from '@/views/student/Home'
import Knowledge from '@/views/student/Knowledge'
import Submit from '@/views/student/Submit'
import MySubmissions from '@/views/student/MySubmissions'
import MyCorrections from '@/views/student/MyCorrections'
import Profile from '@/views/student/Profile'
import AdminLogin from '@/views/admin/AdminLogin'
import Review from '@/views/admin/Review'
import Entries from '@/views/admin/Entries'
import Categories from '@/views/admin/Categories'
import Corrections from '@/views/admin/Corrections'
import Users from '@/views/admin/Users'
import Stats from '@/views/admin/Stats'

// 学生端需登录页面守卫
function StudentGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// 管理员/信任账号守卫
const reviewerPages = ['/admin/review', '/admin/corrections']

function AdminGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const userInfo = useAuthStore((s) => s.userInfo)
  const location = useLocation()

  if (!token || !userInfo || (userInfo.role !== 1 && userInfo.role !== 2)) {
    return <Navigate to="/admin/login" replace />
  }
  if (userInfo.role === 2 && !reviewerPages.includes(location.pathname)) {
    return <Navigate to="/admin/review" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* 学生端登录/注册 */}
      <Route path="/login" element={<Login />} />
      {/* 管理端登录 */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 学生端 */}
      <Route path="/" element={<Home />} />
      <Route path="/knowledge" element={<Knowledge />} />
      <Route
        path="/submit"
        element={
          <StudentGuard>
            <Submit />
          </StudentGuard>
        }
      />
      <Route
        path="/my-submissions"
        element={
          <StudentGuard>
            <MySubmissions />
          </StudentGuard>
        }
      />
      <Route
        path="/my-corrections"
        element={
          <StudentGuard>
            <MyCorrections />
          </StudentGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <StudentGuard>
            <Profile />
          </StudentGuard>
        }
      />

      {/* 管理端 */}
      <Route
        path="/admin/review"
        element={
          <AdminGuard>
            <Review />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/entries"
        element={
          <AdminGuard>
            <Entries />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminGuard>
            <Categories />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/corrections"
        element={
          <AdminGuard>
            <Corrections />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminGuard>
            <Users />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <AdminGuard>
            <Stats />
          </AdminGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}