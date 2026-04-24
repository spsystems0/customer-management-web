'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type SidebarProps = {
  mode: 'guest' | 'sales'
}

type LoginUserInfo = {
  email: string
  displayName: string
}

export default function Sidebar({ mode }: SidebarProps) {
  const [userInfo, setUserInfo] = useState<LoginUserInfo | null>(null)

  useEffect(() => {
    const loadUserInfo = async () => {
      if (mode !== 'sales') {
        setUserInfo(null)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setUserInfo(null)
        return
      }

      setUserInfo({
        email: user.email || '',
        displayName:
          (user.user_metadata?.display_name as string) ||
          (user.user_metadata?.name as string) ||
          '',
      })
    }

    loadUserInfo()
  }, [mode])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside className="w-[320px] min-h-screen bg-white/70 border-r border-slate-200 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">고객관리 시스템</h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'sales' ? '영업담당자 업무 메뉴' : '일반조회 메뉴'}
        </p>

        {mode === 'sales' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold text-slate-500">현재 로그인 정보</div>

            <div className="mt-2 text-sm text-slate-900">
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

      {mode === 'guest' ? (
        <nav className="space-y-3">
          <Link
            href="/company-cards"
            className="block w-full rounded-xl bg-blue-50 px-4 py-4 font-medium text-blue-900 transition hover:bg-blue-100"
          >
            고객사관리카드 조회
          </Link>

          <Link
            href="/customer-cards"
            className="block w-full rounded-xl bg-emerald-50 px-4 py-4 font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            고객관리카드 조회
          </Link>

          <Link
            href="/visit-history"
            className="block w-full rounded-xl bg-orange-50 px-4 py-4 font-medium text-orange-900 transition hover:bg-orange-100"
          >
            방문일지 조회
          </Link>

          <Link
            href="/login"
            className="block w-full rounded-xl bg-slate-100 px-4 py-4 font-medium text-slate-800 transition hover:bg-slate-200"
          >
            영업담당자 로그인
          </Link>
        </nav>
      ) : (
        <nav className="space-y-3">
          <Link
            href="/company-cards"
            className="block w-full rounded-xl bg-blue-50 px-4 py-4 font-medium text-blue-900 transition hover:bg-blue-100"
          >
            고객사관리카드 조회
          </Link>

          <Link
            href="/customer-cards"
            className="block w-full rounded-xl bg-emerald-50 px-4 py-4 font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            고객관리카드 조회
          </Link>

          <Link
            href="/visit-history"
            className="block w-full rounded-xl bg-orange-50 px-4 py-4 font-medium text-orange-900 transition hover:bg-orange-100"
          >
            방문일지 조회
          </Link>

          <Link
            href="/dashboard"
            className="block w-full rounded-xl bg-slate-100 px-4 py-4 font-medium text-slate-800 transition hover:bg-slate-200"
          >
            대시보드
          </Link>

          <Link
            href="/companies"
            className="block w-full rounded-xl bg-blue-50 px-4 py-4 font-medium text-blue-900 transition hover:bg-blue-100"
          >
            고객사 정보 등록
          </Link>

          <Link
            href="/contacts"
            className="block w-full rounded-xl bg-emerald-50 px-4 py-4 font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            고객담당자 정보 등록
          </Link>

          <Link
            href="/visits"
            className="block w-full rounded-xl bg-amber-50 px-4 py-4 font-medium text-amber-900 transition hover:bg-amber-100"
          >
            방문일지 작성
          </Link>

          <Link
            href="/customer-category-codes"
            className="block w-full rounded-xl bg-violet-50 px-4 py-4 font-medium text-violet-900 transition hover:bg-violet-100"
          >
            고객분류코드 관리
          </Link>

          <Link
            href="/contact-print-order"
            className="block w-full rounded-xl bg-cyan-50 px-4 py-4 font-medium text-cyan-900 transition hover:bg-cyan-100"
          >
            담당자 출력순서 관리
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-xl bg-red-600 px-4 py-4 text-left font-medium text-white transition hover:bg-red-700"
          >
            로그아웃
          </button>
        </nav>
      )}
    </aside>
  )
}