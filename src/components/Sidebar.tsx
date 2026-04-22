'use client'

import { supabase } from '../lib/supabase'

type SidebarProps = {
  mode: 'guest' | 'sales'
}

export default function Sidebar({ mode }: SidebarProps) {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(`로그아웃 실패: ${error.message}`)
      return
    }

    window.location.href = '/'
  }

  return (
    <aside className="w-64 min-h-screen border-r border-slate-200 bg-white px-5 py-6 shadow-sm">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800">고객관리 시스템</h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === 'guest' ? '일반조회 메뉴' : '영업담당자 업무 메뉴'}
        </p>
      </div>

      {mode === 'guest' ? (
        <nav className="space-y-3">
          <a
            href="/company-cards"
            className="block w-full rounded-xl bg-blue-50 px-4 py-4 font-medium text-blue-900 transition hover:bg-blue-100"
          >
            고객사관리카드 조회
          </a>

          <a
            href="/customer-cards"
            className="block w-full rounded-xl bg-emerald-50 px-4 py-4 font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            고객관리카드 조회
          </a>

          <a
            href="/login"
            className="block w-full rounded-xl bg-slate-100 px-4 py-4 font-medium text-slate-800 transition hover:bg-slate-200"
          >
            영업담당자 로그인
          </a>
        </nav>
      ) : (
        <nav className="space-y-3">
          <a
            href="/company-cards"
            className="block w-full rounded-xl bg-blue-50 px-4 py-4 font-medium text-blue-900 transition hover:bg-blue-100"
          >
            고객사관리카드 조회
          </a>

          <a
            href="/customer-cards"
            className="block w-full rounded-xl bg-emerald-50 px-4 py-4 font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            고객관리카드 조회
          </a>

          <a
            href="/dashboard"
            className="block w-full rounded-xl bg-slate-100 px-4 py-4 font-medium text-slate-800 transition hover:bg-slate-200"
          >
            대시보드
          </a>

          <a
            href="/companies"
            className="block w-full rounded-xl bg-blue-50 px-4 py-4 font-medium text-blue-900 transition hover:bg-blue-100"
          >
            고객사 정보 등록
          </a>

          <a
            href="/contacts"
            className="block w-full rounded-xl bg-emerald-50 px-4 py-4 font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            고객담당자 정보 등록
          </a>

          <a
            href="/visits"
            className="block w-full rounded-xl bg-amber-50 px-4 py-4 font-medium text-amber-900 transition hover:bg-amber-100"
          >
            방문일지 작성
          </a>

            <a
            href="/customer-category-codes"
            className="block w-full rounded-xl bg-violet-50 px-4 py-4 font-medium text-violet-900 transition hover:bg-violet-100"
          >
            고객분류코드 관리
          </a>

          <a
          href="/contact-print-order"
          className="block w-full rounded-xl bg-cyan-50 px-4 py-4 font-medium text-cyan-900 transition hover:bg-cyan-100"
        >
          담당자 출력순서 관리
        </a>

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