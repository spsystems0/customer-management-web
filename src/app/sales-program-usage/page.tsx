'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

const EXCLUDED_ADMIN_EMAIL = 'admin@spsystems.co.kr'
const EXCLUDED_ADMIN_DISPLAY_NAME = 'administrator'

type SalesUser = {
  id: string
  display_name: string | null
  email: string | null
}

type UsageLog = {
  id: string
  user_id: string
  user_email: string
  display_name: string | null
  program_path: string
  program_name: string
  used_at: string
}

type DisplayRow = {
  usedDate: string
  displayName: string
  programName: string
  programPath: string
  usedAt: string
  rawUsedAt: string
}

function getCurrentMonth() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function getMonthStart(monthValue: string) {
  return `${monthValue}-01T00:00:00+09:00`
}

function getNextMonthStart(monthValue: string) {
  const [yearText, monthText] = monthValue.split('-')
  const year = Number(yearText)
  const month = Number(monthText)

  const nextMonthDate = new Date(year, month, 1)
  const nextYear = nextMonthDate.getFullYear()
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0')

  return `${nextYear}-${nextMonth}-01T00:00:00+09:00`
}

function getKoreaDate(value: string) {
  const date = new Date(value)

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

function getKoreaDateTime(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getTodayString() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  return `${yyyy}${mm}${dd}`
}

function isExcludedAdminUser(
  email: string | null | undefined,
  displayName: string | null | undefined
) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const normalizedDisplayName = (displayName || '').trim().toLowerCase()

  return (
    normalizedEmail === EXCLUDED_ADMIN_EMAIL ||
    normalizedDisplayName === EXCLUDED_ADMIN_DISPLAY_NAME
  )
}

export default function SalesProgramUsagePage() {
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState('all')

  const [startMonth, setStartMonth] = useState(getCurrentMonth())
  const [endMonth, setEndMonth] = useState(getCurrentMonth())

  const [logs, setLogs] = useState<UsageLog[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      setMessage('')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        window.location.href = '/'
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, display_name, email')
        .order('display_name', { ascending: true })

      if (userError) {
        setMessage(`사용자 목록 조회 실패: ${userError.message}`)
        setSalesUsers([])
        setLoading(false)
        return
      }

    const filteredUsers = ((userData as SalesUser[]) || []).filter(
      (user) => !isExcludedAdminUser(user.email, user.display_name)
    )

      setSalesUsers(filteredUsers)
      setLoading(false)
    }

    initialize()
  }, [])

  const userMap = useMemo(() => {
    const map = new Map<string, SalesUser>()

    salesUsers.forEach((user) => {
      map.set(String(user.id), user)
    })

    return map
  }, [salesUsers])

  const displayRows = useMemo<DisplayRow[]>(() => {
    return logs
      .filter((log) => !isExcludedAdminUser(log.user_email, log.display_name))
      .map((log) => {
        const user = userMap.get(String(log.user_id))

        return {
          usedDate: getKoreaDate(log.used_at),
          displayName: user?.display_name || log.display_name || '-',
          programName: log.program_name || '-',
          programPath: log.program_path || '-',
          usedAt: getKoreaDateTime(log.used_at),
          rawUsedAt: log.used_at,
        }
      })
      .sort((a, b) => {
        const dateCompare =
          new Date(b.rawUsedAt).getTime() - new Date(a.rawUsedAt).getTime()

        if (dateCompare !== 0) return dateCompare

        if (a.displayName !== b.displayName) {
          return a.displayName.localeCompare(b.displayName, 'ko')
        }

        return a.programName.localeCompare(b.programName, 'ko')
      })
  }, [logs, userMap])

  function resetSearchResult() {
    setLogs([])
    setHasSearched(false)
    setMessage('')
  }

  async function handleSearch() {
    setMessage('')
    setLogs([])
    setHasSearched(false)

    if (!startMonth) {
      setMessage('시작년월을 선택해 주세요.')
      return
    }

    if (!endMonth) {
      setMessage('종료년월을 선택해 주세요.')
      return
    }

    if (startMonth > endMonth) {
      setMessage('시작년월은 종료년월보다 늦을 수 없습니다.')
      return
    }

    setLoadingLogs(true)

    const startDate = getMonthStart(startMonth)
    const endDate = getNextMonthStart(endMonth)

    let query = supabase
      .from('sales_program_usage_logs')
      .select(
        'id, user_id, user_email, display_name, program_path, program_name, used_at'
      )
      .gte('used_at', startDate)
      .lt('used_at', endDate)
      .neq('user_email', EXCLUDED_ADMIN_EMAIL)
      .neq('display_name', 'Administrator')

    if (selectedUserId !== 'all') {
      query = query.eq('user_id', selectedUserId)
    }

    const { data, error } = await query.order('used_at', {
      ascending: false,
    })

    if (error) {
      setMessage(`프로그램 사용현황 조회 실패: ${error.message}`)
      setLoadingLogs(false)
      return
    }

    const filteredLogs = ((data as UsageLog[]) || []).filter(
      (log) => !isExcludedAdminEmail(log.user_email)
    )

    setLogs(filteredLogs)
    setHasSearched(true)
    setLoadingLogs(false)
  }

  function handleExcelDownload() {
    if (displayRows.length === 0) {
      alert('다운로드할 조회 결과가 없습니다.')
      return
    }

    const selectedUserName =
      selectedUserId === 'all'
        ? '전체'
        : salesUsers.find((user) => String(user.id) === selectedUserId)
            ?.display_name || ''

    const bodyRows = displayRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.usedDate)}</td>
            <td>${escapeHtml(row.displayName)}</td>
            <td>${escapeHtml(row.programName)}</td>
            <td>${escapeHtml(row.programPath)}</td>
            <td>${escapeHtml(row.usedAt)}</td>
          </tr>
        `
      )
      .join('')

    const excelHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table {
              border-collapse: collapse;
              font-family: Arial, sans-serif;
              font-size: 11pt;
            }

            th, td {
              border: 1px solid #000000;
              padding: 6px;
              vertical-align: middle;
            }

            .title {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
            }

            .label {
              font-weight: bold;
              background-color: #f1f5f9;
            }

            .header {
              font-weight: bold;
              text-align: center;
              background-color: #f1f5f9;
            }
          </style>
        </head>

        <body>
          <table>
            <tr>
              <td colspan="5" class="title">영업담당자 프로그램 사용현황</td>
            </tr>
            <tr>
              <td class="label">사용자</td>
              <td colspan="4">${escapeHtml(selectedUserName)}</td>
            </tr>
            <tr>
              <td class="label">조회기간</td>
              <td colspan="4">${escapeHtml(startMonth)} ~ ${escapeHtml(
                endMonth
              )}</td>
            </tr>
            <tr></tr>
            <tr>
              <th class="header">사용일자</th>
              <th class="header">사용자명</th>
              <th class="header">프로그램명</th>
              <th class="header">경로</th>
              <th class="header">사용시간</th>
            </tr>
            ${bodyRows}
          </table>
        </body>
      </html>
    `

    const blob = new Blob(['\ufeff', excelHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `영업담당자_프로그램_사용현황_${getTodayString()}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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

        <section className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-2xl bg-white p-8 shadow">
              <h1 className="text-2xl font-bold text-slate-900">
                영업담당자 프로그램 사용현황
              </h1>

              <p className="mt-2 text-slate-600">
                로그인한 영업담당자가 사용한 프로그램을 기간별로 조회합니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <h2 className="text-lg font-bold text-slate-900">검색 조건</h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    사용자
                  </label>

                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value)
                      resetSearchResult()
                    }}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  >
                    <option value="all">전체</option>

                    {salesUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.display_name || '-'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    시작년월
                  </label>

                  <input
                    type="month"
                    value={startMonth}
                    onChange={(e) => {
                      setStartMonth(e.target.value)
                      resetSearchResult()
                    }}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    종료년월
                  </label>

                  <input
                    type="month"
                    value={endMonth}
                    onChange={(e) => {
                      setEndMonth(e.target.value)
                      resetSearchResult()
                    }}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="h-12 rounded-xl bg-blue-700 px-8 font-semibold text-white hover:bg-blue-800"
                  >
                    조회
                  </button>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleExcelDownload}
                    className="h-12 rounded-xl bg-emerald-700 px-8 font-semibold text-white hover:bg-emerald-800"
                  >
                    Excel 다운로드
                  </button>
                </div>
              </div>

              {message && (
                <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  프로그램 사용 목록
                </h2>

                <span className="text-sm text-slate-500">
                  {hasSearched ? `조회 건수: ${displayRows.length}건` : ''}
                </span>
              </div>

              {loadingLogs ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  프로그램 사용현황을 조회하는 중입니다.
                </div>
              ) : !hasSearched ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  사용자, 시작년월, 종료년월을 선택한 후 조회 버튼을 누르세요.
                </div>
              ) : displayRows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  조회 결과가 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-300">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '27%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '26%' }} />
                    </colgroup>

                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          사용일자
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          사용자명
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          프로그램명
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          경로
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          사용시간
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayRows.map((row, index) => (
                        <tr
                          key={`${row.rawUsedAt}-${row.programPath}-${index}`}
                          className="hover:bg-blue-50"
                        >
                          <td className="border border-slate-300 px-3 py-2 text-center text-black">
                            {row.usedDate}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.displayName}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.programName}
                          </td>

                          <td className="break-all border border-slate-300 px-3 py-2 text-black">
                            {row.programPath}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.usedAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}