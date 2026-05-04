'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabase'

type SidebarMode = 'guest' | 'sales'

export default function HomePage() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('guest')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setSidebarMode('sales')
        setUserEmail(session.user.email || '')
      } else {
        setSidebarMode('guest')
        setUserEmail('')
      }

      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-700">로그인 상태 확인 중...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar mode={sidebarMode} />

        {sidebarMode === 'sales' ? (
          <SalesDashboard userEmail={userEmail} />
        ) : (
          <GuestHome />
        )}
      </div>
    </main>
  )
}

function GuestHome() {
  return (
    <section className="flex-1 px-8 py-8">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-slate-900">
            고객사 및 고객담당자 관리 시스템
          </h1>

          <p className="mt-4 text-slate-700">
            고객사 정보, 고객담당자 정보, 방문일지를 관리하고
            고객사관리카드 및 고객관리카드를 조회/출력하는 웹 시스템입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <HomeCard
            href="/company-cards"
            title="고객사관리카드 조회"
            description="로그인 없이 고객사를 검색하고 고객사관리카드를 조회/출력합니다."
            colorClass="text-blue-800"
          />

          <HomeCard
            href="/customer-cards"
            title="고객관리카드 조회"
            description="로그인 없이 고객사와 담당자를 선택하여 고객관리카드를 조회/출력합니다."
            colorClass="text-emerald-800"
          />

          <HomeCard
            href="/visit-history"
            title="방문일지 조회"
            description="로그인 없이 고객사의 담당자 또는 방문자별로 방문일지를 조회합니다."
            colorClass="text-emerald-800"
          />

          <HomeCard
            href="/login"
            title="영업담당자 로그인"
            description="영업담당자는 로그인 후 고객사, 담당자, 방문일지를 등록/수정/삭제할 수 있습니다."
            colorClass="text-orange-700"
          />
        </div>
      </div>
    </section>
  )
}

function SalesDashboard({ userEmail }: { userEmail: string }) {
  return (
    <section className="flex-1 px-8 py-8">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-slate-900">
            영업담당자 대시보드
          </h1>

          <p className="mt-3 text-slate-600">로그인에 성공했습니다.</p>

          <p className="mt-1 text-sm text-slate-500">
            로그인 사용자: {userEmail || '이메일 정보 없음'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            href="/companies"
            title="고객사 정보 등록"
            description="고객사 정보를 등록, 수정, 삭제합니다."
            colorClass="border-blue-200 bg-blue-50 text-blue-900"
          />

          <DashboardCard
            href="/contacts"
            title="고객담당자 정보 등록"
            description="고객사 담당자 정보를 등록, 수정, 삭제합니다."
            colorClass="border-emerald-200 bg-emerald-50 text-emerald-900"
          />

          <DashboardCard
            href="/visits"
            title="방문일지 작성"
            description="방문 및 상담 이력을 등록합니다."
            colorClass="border-amber-200 bg-amber-50 text-amber-900"
          />

          <DashboardCard
            href="/customer-company-status?reset=1"
            title="고객사 현황"
            description="고객사 현황을 조회하고 Excel로 다운로드합니다."
            colorClass="border-orange-200 bg-orange-50 text-orange-900"
          />

          <DashboardCard
            href="/customer-contact-status?reset=1"
            title="고객사 담당자 현황"
            description="고객사별 담당자 현황을 조회하고 Excel로 다운로드합니다."
            colorClass="border-teal-200 bg-teal-50 text-teal-900"
          />

          <DashboardCard
            href="/contact-print-order"
            title="담당자 출력순서 관리"
            description="고객관리카드 출력 시 담당자 표시 순서를 관리합니다."
            colorClass="border-cyan-200 bg-cyan-50 text-cyan-900"
          />
        </div>
      </div>
    </section>
  )
}

function HomeCard({
  href,
  title,
  description,
  colorClass,
}: {
  href: string
  title: string
  description: string
  colorClass: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h2 className={`text-xl font-bold ${colorClass}`}>{title}</h2>

      <p className="mt-4 leading-7 text-slate-700">{description}</p>
    </Link>
  )
}

function DashboardCard({
  href,
  title,
  description,
  colorClass,
}: {
  href: string
  title: string
  description: string
  colorClass: string
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colorClass}`}
    >
      <h2 className="text-lg font-bold">{title}</h2>

      <p className="mt-4 text-sm leading-6 text-slate-700">{description}</p>
    </Link>
  )
}