import { Link, useNavigate } from 'react-router-dom'
import { Button, Dropdown } from 'antd'
import { Settings } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { confirmModal } from '@/utils/confirm'

export default function StudentNav() {
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

  const menuItems = [
    { key: '/', label: '首页问答' },
    { key: '/knowledge', label: '知识库' },
    { key: '/submit', label: '提交信息' },
    { key: '/my-submissions', label: '我的提交' },
    { key: '/my-corrections', label: '我的纠错' },
    { key: '/profile', label: '个人中心' },
    { type: 'divider' as const },
    ...(userInfo
      ? [{ key: 'logout', label: '退出登录', danger: true }]
      : [{ key: 'login', label: '登录' }])
  ]

  const onMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout()
    } else if (key === 'login') {
      navigate('/login')
    } else {
      navigate(key)
    }
  }

  return (
    <div className="bg-white border-b border-[#e5e5e5]">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2329] whitespace-nowrap no-underline"
        >
          <span className="w-6 h-6 rounded-md bg-[#4d6bfe] flex items-center justify-center text-white text-[13px] font-bold">
            知
          </span>
          校园协作知识库
        </Link>

        <div className="flex items-center gap-3">
          {userInfo && (
            <span className="text-[13px] text-[#666]">
              {userInfo.realName || userInfo.username}
            </span>
          )}
          <Dropdown
            trigger={['click']}
            menu={{ items: menuItems, onClick: onMenuClick }}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<Settings size={18} />}
              className="!text-[#666] hover:!text-[#1f2329]"
            />
          </Dropdown>
        </div>
      </div>
    </div>
  )
}