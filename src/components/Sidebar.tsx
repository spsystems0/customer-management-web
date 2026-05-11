'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type SidebarMode = 'guest' | 'sales'

type SidebarProps = {
  mode?: SidebarMode
}

type MenuItem = {
  label: string
  href: string
}

const guestMenuItems: MenuItem[] = [
  {
    label: '고객사관리카드 조회',
    href: '/company-cards',
  },
  {
    label: '고객관리카드 조회',
    href: '/customer-cards',
  },
  {
    label: '방문이력 조회',
    href: '/visit-history',
  },
  {
    label: '영업담당자 로그인',
    href: '/login',
  },
]

const salesMenuItems: MenuItem[] = [
  {
    label: '영업담당자 대시보드',
    href: '/dashboard',
  },
  {
    label: '고객사관리카드 조회',
    href: '/company-cards',
  },
  {
    label: '고객관리카드 조회',
    href: '/customer-cards',
  },
  {
    label: '방문이력 조회',
    href: '/visit-history',
  },
  {
    label: '고객사 현황',
    href: '/customer-company-status',
  },
  {
    label: '고객사 담당자 현황',
    href: '/customer-contact-status',
  },
  {
    label: '고객사 등록',
    href: '/companies',
  },
  {
    label: '고객담당자 등록',
    href: '/contacts',
  },
  {
    label: '방문일지 입력',
    href: '/visits',
  },
  {
    label: '고객분류코드 관리',
    href: '/customer-category-codes',
  },
  {
    label: '담당자 출력순서 관리',
    href: '/contact-print-order',
  },
  {
    label: '영업담당자 프로그램 사용현황',
    href: '/sales-program-usage',
  },
]

export default function Sidebar({ mode = 'guest' }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [sessionChecked, setSessionChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginName, setLoginName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsLoggedIn(false)
        setLoginName('')
        setLoginEmail('')
        setSessionChecked(true)
        return
      }

      const email = session.user.email || ''
      const userMetadata = session.user.user_metadata || {}

      const nameFromMetadata =
        userMetadata.name ||
        userMetadata.full_name ||
        userMetadata.display_name ||
        userMetadata.user_name ||
        ''

      setIsLoggedIn(true)
      setLoginEmail(email)
      setLoginName(nameFromMetadata || getDefaultNameFromEmail(email))
      setSessionChecked(true)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsLoggedIn(false)
        setLoginName('')
        setLoginEmail('')
        setSessionChecked(true)
        return
      }

      const email = session.user.email || ''
      const userMetadata = session.user.user_metadata || {}

      const nameFromMetadata =
        userMetadata.name ||
        userMetadata.full_name ||
        userMetadata.display_name ||
        userMetadata.user_name ||
        ''

      setIsLoggedIn(true)
      setLoginEmail(email)
      setLoginName(nameFromMetadata || getDefaultNameFromEmail(email))
      setSessionChecked(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const effectiveMode: SidebarMode = useMemo(() => {
    if (!sessionChecked) return mode
    return isLoggedIn ? 'sales' : 'guest'
  }, [sessionChecked, isLoggedIn, mode])

  const menuItems = effectiveMode === 'sales' ? salesMenuItems : guestMenuItems

  const handleMove = (href: string) => {
    router.push(href)
  }

  const handleChangePassword = () => {
    router.push('/change-password')
  }

  const handleLogout = async () => {
    const confirmed = window.confirm('로그아웃 하시겠습니까?')

    if (!confirmed) return

    await supabase.auth.signOut()

    setIsLoggedIn(false)
    setLoginName('')
    setLoginEmail('')

    router.push('/')
    router.refresh()
  }

  return (
    <aside className="min-h-screen w-72 shrink-0 border-r border-slate-200 bg-slate-50 px-4 py-6 print:hidden">
      <div className="sticky top-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            고객관리 시스템
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {effectiveMode === 'sales'
              ? '영업담당자 업무 메뉴'
              : '고객관리 조회 메뉴'}
          </p>
        </div>

        {effectiveMode === 'sales' && (
          <div className="mb-5 rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-900">
            <p className="mb-3 font-semibold text-slate-700">
              현재 로그인 정보
            </p>

            <div className="flex items-center gap-2">
              <span className="font-bold">이름:</span>

              <span className="font-bold">
                {loginName || '관리자'}
              </span>

              <button
                type="button"
                onClick={handleChangePassword}
                className="ml-auto rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
              >
                비밀번호 변경
              </button>
            </div>

            <p className="mt-2 break-all">
              <span className="font-bold">이메일:</span>{' '}
              {loginEmail || '-'}
            </p>
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = isActivePath(pathname, item.href)

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleMove(item.href)}
                className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? 'bg-blue-700 text-white shadow'
                    : 'bg-white text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {item.label}
              </button>
            )
          })}

          {effectiveMode === 'sales' && (
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-xl bg-red-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-red-700"
            >
              로그아웃
            </button>
          )}
        </nav>
      </div>
    </aside>
  )
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false

  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function getDefaultNameFromEmail(email: string) {
  if (!email) return '관리자'

  const id = email.split('@')[0]

  if (!id) return '관리자'

  if (id.toLowerCase() === 'admin') return '관리자'

  return id
}