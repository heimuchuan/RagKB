import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Menu } from 'antd'
import { useAuthStore } from '@/store/auth'
import { confirmModal } from '@/utils/confirm'

const menuItems = [
  { key: '/', label: <Link to="/">首页问答</Link> },
  { key: '/knowledge', label: <Link to="/knowledge">知识库</Link> },
  { key: '/submit', label: <Link to="/submit">提交信息</Link> },
  { key: '/my-submissions', label: <Link to="/my-submissions">我的提交</Link> },
  { key: '/my-corrections', label: <Link to="/my-corrections">我的纠错</Link> },
  { key: '/profile', label: <Link to="/profile">个人中心</Link> }
]

export default function StudentNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = useAuthStore((s) => s.userInfo)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    try {
      await confirmModal({ title: '确定要退出登录吗？' })
    } catch {
      return
    }
    logout()
    navigate('/login')
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-indigo-50">
      <div className="max-w-[1200px] mx-auto flex items-center h-14 px-5">
        <Link
          to="/"
          className="text-lg font-semibold text-[#7c86d6] whitespace-nowrap mr-6 no-underline"
        >
          校园协作知识库
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="flex-1 border-none"
        />
        <div className="flex items-center gap-3 ml-4">
          {userInfo ? (
            <>
              <span className="text-sm text-[#606266]">
                {userInfo.realName || userInfo.username}
              </span>
              <Button type="link" danger onClick={handleLogout}>
                退出登录
              </Button>
            </>
          ) : (
            <Button type="link" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}