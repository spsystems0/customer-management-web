'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      title: '고객사 현황',
      description: '고객사 현황을 조회하고 Excel로 다운로드합니다.',
      href: '/customer-company-status',
      colorClass: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
      titleClass: 'text-orange-900',
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
      title: '고객사 담당자 현황',
      description: '고객사별 담당자 현황을 조회하고 Excel로 다운로드합니다.',
      href: '/customer-contact-status',
      colorClass: 'border-teal-200 bg-teal-50 hover:bg-teal-100',
      titleClass: 'text-teal-900',
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
      title: '담당자 출력순서 관리',
      description: '고객관리카드 출력 시 담당자 표시 순서를 관리합니다.',
      href: '/contact-print-order',
      colorClass: 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100',
      titleClass: 'text-cyan-900',
    },
  ],
]

export default function DashboardPage() {
  const router = useRouter()

  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [movingPath, setMovingPath] = useState('')

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

  const saveProgramUsageLog = async (item: DashboardMenuItem) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('세션 확인 실패:', sessionError?.message)
      return
    }

    const email = session.user.email || ''
    const userMetadata = session.user.user_metadata || {}

    const displayName =
      userMetadata.name ||
      userMetadata.full_name ||
      userMetadata.display_name ||
      userMetadata.user_name ||
      getDefaultNameFromEmail(email)

    const { error } = await supabase.from('sales_program_usage_logs').insert([
      {
        user_id: session.user.id,
        user_email: email,
        display_name: displayName,
        program_path: item.href,
        program_name: item.title,
        used_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('대시보드 프로그램 사용기록 저장 실패:', error.message)
      console.error('저장 실패 상세:', error)
    }
  }

  const handleDashboardMenuClick = async (item: DashboardMenuItem) => {
    if (movingPath) return

    setMovingPath(item.href)

    try {
      await saveProgramUsageLog(item)
    } catch (error) {
      console.error('대시보드 사용기록 저장 중 오류:', error)
    } finally {
      router.push(item.href)
    }
  }

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
                  <DashboardCard
                    key={item.href}
                    item={item}
                    moving={movingPath === item.href}
                    onMove={handleDashboardMenuClick}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function DashboardCard({
  item,
  moving,
  onMove,
}: {
  item: DashboardMenuItem
  moving: boolean
  onMove: (item: DashboardMenuItem) => Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={() => onMove(item)}
      disabled={moving}
      className={`block w-full rounded-2xl border p-6 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${item.colorClass}`}
    >
      <h2 className={`text-lg font-semibold ${item.titleClass}`}>
        {item.title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {item.description}
      </p>

      {moving && (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          이동 중...
        </p>
      )}
    </button>
  )
}

function getDefaultNameFromEmail(email: string) {
  if (!email) return '사용자'

  const id = email.split('@')[0]

  if (!id) return '사용자'

  if (id.toLowerCase() === 'admin') return '관리자'

  return id
}