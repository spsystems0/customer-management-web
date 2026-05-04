'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type ProgramUsageLoggerProps = {
  mode: 'guest' | 'sales'
}

const PROGRAM_NAME_MAP: Record<string, string> = {
  '/dashboard': '대시보드',
  '/companies': '고객사 정보 등록',
  '/contacts': '고객담당자 정보 등록',
  '/visits': '방문일지 작성',
  '/company-cards': '고객사관리카드 조회',
  '/customer-cards': '고객관리카드 조회',
  '/visit-history': '방문일지 조회',
  '/customer-category-codes': '고객분류코드 관리',
  '/contact-print-order': '담당자 출력순서 관리',
  '/customer-contact-status': '고객사 담당자 현황',
  '/customer-company-status': '고객사 현황',
  '/sales-program-usage': '영업담당자 프로그램 사용현황',
}

export default function ProgramUsageLogger({ mode }: ProgramUsageLoggerProps) {
  const pathname = usePathname()
  const loggedPathRef = useRef('')

  useEffect(() => {
    const saveUsageLog = async () => {
      if (mode !== 'sales') return
      if (!pathname) return
      if (loggedPathRef.current === pathname) return

      loggedPathRef.current = pathname

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const programName = PROGRAM_NAME_MAP[pathname] || pathname

      await supabase.from('sales_program_usage_logs').insert([
        {
          user_id: user.id,
          user_email: user.email || '',
          display_name:
            (user.user_metadata?.display_name as string) ||
            (user.user_metadata?.name as string) ||
            '',
          program_path: pathname,
          program_name: programName,
        },
      ])
    }

    saveUsageLog()
  }, [mode, pathname])

  return null
}