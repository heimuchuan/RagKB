import { create } from 'zustand'
import type { UserInfo } from '@/types'

interface AuthState {
  token: string
  userInfo: UserInfo | null
  setToken: (t: string) => void
  setUserInfo: (u: UserInfo | null) => void
  logout: () => void
}

function readUserInfo(): UserInfo | null {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token') || '',
  userInfo: readUserInfo(),
  setToken: (t) => {
    localStorage.setItem('token', t)
    set({ token: t })
  },
  setUserInfo: (u) => {
    if (u) {
      localStorage.setItem('userInfo', JSON.stringify(u))
    } else {
      localStorage.removeItem('userInfo')
    }
    set({ userInfo: u })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    set({ token: '', userInfo: null })
  }
}))