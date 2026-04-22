'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        window.location.href = '/'
        return
      }

      setUserEmail(session.user.email ?? '')
      setLoading(false)
    }

    loadSession()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-700">세션 확인 중...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar mode="sales" />

        <section className="flex-1 p-8">
          <div className="rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-slate-800">
              영업담당자 대시보드
            </h1>
            <p className="mt-2 text-slate-600">로그인에 성공했습니다.</p>
            <p className="mt-1 text-sm text-slate-500">
              로그인 사용자: {userEmail || '이메일 정보 없음'}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a
              href="/companies"
              className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-blue-900">
                고객사 정보 등록
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                고객사 정보를 등록, 수정, 삭제합니다.
              </p>
            </a>

            <a
              href="/contacts"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-emerald-900">
                고객담당자 정보 등록
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                고객사 담당자 정보를 등록, 수정, 삭제합니다.
              </p>
            </a>

            <a
              href="/visits"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-amber-900">
                방문일지 작성
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                방문 및 상담 이력을 등록합니다.
              </p>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}