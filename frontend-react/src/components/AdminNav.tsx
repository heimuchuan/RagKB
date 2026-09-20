import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Menu } from 'antd'
import { useAuthStore } from '@/store/auth'
import { confirmModal } from '@/utils/confirm'

interface NavItem {
  key: string
  label: ReactNode
  adminOnly?: boolean
}

export default function AdminNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = useAuthStore((s) => s.userInfo)
  const logout = useAuthStore((s) => s.logout)

  const isAdmin = userInfo?.role === 1
  const baseName = userInfo ? userInfo.realName || userInfo.username : '管理员'
  const displayName = userInfo?.role === 2 ? `${baseName}（信任账号）` : baseName

  const allItems: NavItem[] = [
    { key: '/admin/review', label: <Link to="/admin/review">审核管理</Link> },
    { key: '/admin/entries', label: <Link to="/admin/entries">条目管理</Link>, adminOnly: true },
    { key: '/admin/categories', label: <Link to="/admin/categories">分类管理</Link>, adminOnly: true },
    { key: '/admin/corrections', label: <Link to="/admin/corrections">纠错处理</Link> },
    { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link>, adminOnly: true },
    { key: '/admin/stats', label: <Link to="/admin/stats">数据统计</Link>, adminOnly: true }
  ]
  const menuItems = allItems
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => ({ key: item.key, label: item.label }))

  const handleLogout = async () => {
    try {
      await confirmModal({ title: '确定要退出登录吗？' })
    } catch {
      return
    }
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-indigo-50">
      <div className="max-w-[1200px] mx-auto flex items-center h-14 px-5">
        <Link
          to="/admin/review"
          className="text-lg font-semibold text-[#7c86d6] whitespace-nowrap mr-6 no-underline"
        >
          校园协作知识库 · 管理端
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="flex-1 border-none"
        />
        <div className="flex items-center gap-3 ml-4">
          <span className="text-sm text-[#606266]">{displayName}</span>
          <Button type="link" danger onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </div>
    </div>
  )
}