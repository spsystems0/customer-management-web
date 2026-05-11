'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProgramUsageLogger from './ProgramUsageLogger'

type SidebarMode = 'guest' | 'sales'

type SidebarProps = {
  mode?: SidebarMode
}

type LoginUserInfo = {
  email: string
  displayName: string
}

export default function Sidebar({ mode }: SidebarProps) {
  const [resolvedMode, setResolvedMode] = useState<SidebarMode>('guest')
  const [userInfo, setUserInfo] = useState<LoginUserInfo | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const loadUserInfo = async () => {
      setCheckingSession(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setResolvedMode('sales')

        setUserInfo({
          email: user.email || '',
          displayName:
            (user.user_metadata?.display_name as string) ||
            (user.user_metadata?.name as string) ||
            '',
        })

        setCheckingSession(false)
        return
      }

      setResolvedMode('guest')
      setUserInfo(null)
      setCheckingSession(false)
    }

    loadUserInfo()
  }, [mode])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleDashboardMove = () => {
    window.location.href = '/dashboard'
  }

  const menuClass =
    'block w-full rounded-lg px-3 py-2.5 text-sm font-medium transition'

  const buttonMenuClass =
    'block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition'

  if (checkingSession) {
    return (
      <aside className="h-screen w-[320px] overflow-y-auto border-r border-slate-200 bg-white/70 px-4 py-5">
        <div className="mb-4">
          <h1 className="text-[19px] font-bold text-slate-900">
            고객관리 시스템
          </h1>

          <p className="mt-1 text-xs text-slate-600">로그인 확인 중...</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="h-screen w-[320px] overflow-y-auto border-r border-slate-200 bg-white/70 px-4 py-5">
      <ProgramUsageLogger mode={resolvedMode} />

      <div className="mb-4">
        <h1 className="text-[19px] font-bold text-slate-900">
          고객관리 시스템
        </h1>

        <p className="mt-1 text-xs text-slate-600">
          {resolvedMode === 'sales' ? '영업담당자 업무 메뉴' : '일반조회 메뉴'}
        </p>

        {resolvedMode === 'sales' && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-xs font-semibold text-slate-500">
              현재 로그인 정보
            </div>

            <div className="mt-1.5 text-xs text-slate-900">
              <div>
                <span className="font-semibold">이름:</span>{' '}
                {userInfo?.displayName || '-'}
              </div>

              <div className="mt-1 break-all">
                <span className="font-semibold">이메일:</span>{' '}
                {userInfo?.email || '-'}
              </div>
            </div>
          </div>
        )}
      </div>

      {resolvedMode === 'guest' ? (
        <nav className="space-y-2">
          <Link
            href="/company-cards"
            className={`${menuClass} bg-blue-50 text-blue-900 hover:bg-blue-100`}
          >
            고객사관리카드 조회
          </Link>

          <Link
            href="/customer-cards"
            className={`${menuClass} bg-emerald-50 text-emerald-900 hover:bg-emerald-100`}
          >
            고객관리카드 조회
          </Link>

          <Link
            href="/visit-history"
            className={`${menuClass} bg-orange-50 text-orange-900 hover:bg-orange-100`}
          >
            방문일지 조회
          </Link>

          <Link
            href="/login"
            className={`${menuClass} bg-slate-100 text-slate-800 hover:bg-slate-200`}
          >
            영업담당자 로그인
          </Link>
        </nav>
      ) : (
        <nav className="space-y-2">
          <Link
            href="/company-cards"
            className={`${menuClass} bg-blue-50 text-blue-900 hover:bg-blue-100`}
          >
            고객사관리카드 조회
          </Link>

          <Link
            href="/customer-cards"
            className={`${menuClass} bg-emerald-50 text-emerald-900 hover:bg-emerald-100`}
          >
            고객관리카드 조회
          </Link>

          <Link
            href="/visit-history"
            className={`${menuClass} bg-orange-50 text-orange-900 hover:bg-orange-100`}
          >
            방문일지 조회
          </Link>

          <Link
            href="/customer-company-status?reset=1"
            className={`${menuClass} bg-indigo-50 text-indigo-900 hover:bg-indigo-100`}
          >
            고객사 현황
          </Link>

          <Link
            href="/customer-contact-status?reset=1"
            className={`${menuClass} bg-teal-50 text-teal-900 hover:bg-teal-100`}
          >
            고객사 담당자 현황
          </Link>

          <button
            type="button"
            onClick={handleDashboardMove}
            className={`${buttonMenuClass} bg-slate-100 text-slate-800 hover:bg-slate-200`}
          >
            대시보드
          </button>

          <Link
            href="/companies"
            className={`${menuClass} bg-blue-50 text-blue-900 hover:bg-blue-100`}
          >
            고객사 정보 등록
          </Link>

          <Link
            href="/contacts"
            className={`${menuClass} bg-emerald-50 text-emerald-900 hover:bg-emerald-100`}
          >
            고객담당자 정보 등록
          </Link>

          <Link
            href="/visits"
            className={`${menuClass} bg-amber-50 text-amber-900 hover:bg-amber-100`}
          >
            방문일지 작성
          </Link>

          <Link
            href="/customer-category-codes"
            className={`${menuClass} bg-violet-50 text-violet-900 hover:bg-violet-100`}
          >
            고객분류코드 관리
          </Link>

          <Link
            href="/contact-print-order"
            className={`${menuClass} bg-cyan-50 text-cyan-900 hover:bg-cyan-100`}
          >
            담당자 출력순서 관리
          </Link>

          <Link
            href="/sales-program-usage"
            className={`${menuClass} bg-amber-50 text-amber-900 hover:bg-amber-100`}
          >
            프로그램 사용현황
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className={`${buttonMenuClass} bg-red-600 text-white hover:bg-red-700`}
          >
            로그아웃
          </button>
        </nav>
      )}
    </aside>
  )
}