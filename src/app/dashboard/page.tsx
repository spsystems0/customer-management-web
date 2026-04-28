'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

type DashboardMenuItem = {
  title: string
  description: string
  href: string
  colorClass: string
  titleClass: string
}

const menuGroups: DashboardMenuItem[][] = [
  [
    {
      title: '고객사 정보 등록',
      description: '고객사 정보를 등록, 수정, 삭제합니다.',
      href: '/companies',
      colorClass: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      titleClass: 'text-blue-900',
    },
    {
      title: '고객사 담당자 현황',
      description: '고객사별 담당자 현황을 조회하고 Excel로 다운로드합니다.',
      href: '/customer-contact-status',
      colorClass: 'border-teal-200 bg-teal-50 hover:bg-teal-100',
      titleClass: 'text-teal-900',
    },
  ],
  [
    {
      title: '고객담당자 정보 등록',
      description: '고객사 담당자 정보를 등록, 수정, 삭제합니다.',
      href: '/contacts',
      colorClass: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
      titleClass: 'text-emerald-900',
    },
    {
      title: '담당자 출력순서 관리',
      description: '고객관리카드 출력 시 담당자 표시 순서를 관리합니다.',
      href: '/contact-print-order',
      colorClass: 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100',
      titleClass: 'text-cyan-900',
    },
  ],
  [
    {
      title: '방문일지 작성',
      description: '방문 및 상담 이력을 등록합니다.',
      href: '/visits',
      colorClass: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
      titleClass: 'text-amber-900',
    },
    {
      title: '방문일지 조회',
      description: '고객사, 고객담당자, 영업담당자 조건으로 방문일지를 조회합니다.',
      href: '/visit-history',
      colorClass: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
      titleClass: 'text-orange-900',
    },
  ],
]

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

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                {group.map((item) => (
                  <DashboardCard key={item.href} item={item} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function DashboardCard({ item }: { item: DashboardMenuItem }) {
  return (
    <Link
      href={item.href}
      className={`block rounded-2xl border p-6 shadow-sm transition ${item.colorClass}`}
    >
      <h2 className={`text-lg font-semibold ${item.titleClass}`}>
        {item.title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {item.description}
      </p>
    </Link>
  )
}