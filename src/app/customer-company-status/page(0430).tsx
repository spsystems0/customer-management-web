'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

const CUSTOMER_CONTACT_STATUS_STATE_KEY = 'customer-contact-status-last-view'

// 실제 고객담당자 등록/수정/삭제 화면 경로입니다.
// 현재 올려주신 등록 화면 코드 기준으로 /contacts 입니다.
const CONTACT_REGISTER_PATH = '/contacts'

type Company = {
  id: number
  customer_name: string
}

type ContactRow = {
  id: number
  company_id: number
  name: string | null
  position: string | null
  department: string | null
  phone: string | null
  email: string | null
  work_location: string | null
  print_order: number | null
}

type DisplayRow = {
  contactId: number
  companyId: number
  companyName: string
  contactName: string
  position: string
  department: string
  contactInfo: string
  email: string
  workLocation: string
}

type SavedCustomerContactStatusState = {
  selectedCompanyId?: string
  companySearchText?: string
  hasSearched?: boolean
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

function getSortName(value: string) {
  return value
    .replaceAll('㈜', '')
    .replace(/\(주\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

const koreanCollator = new Intl.Collator('ko-KR', {
  numeric: true,
  sensitivity: 'base',
})

export default function CustomerContactStatusPage() {
  const router = useRouter()
  const companyDropdownRef = useRef<HTMLDivElement | null>(null)
  const hasRestoredInitialViewRef = useRef(false)

  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])

  const [selectedCompanyId, setSelectedCompanyId] = useState('all')
  const [companySearchText, setCompanySearchText] = useState('전체')
  const [showCompanyList, setShowCompanyList] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      setMessage('')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        window.location.href = '/'
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .select('id, customer_name')
        .order('customer_name', { ascending: true })

      if (error) {
        setMessage(`고객사 목록 조회 실패: ${error.message}`)
        setLoading(false)
        return
      }

      const sortedCompanies = [...(data || [])].sort((a, b) =>
        koreanCollator.compare(
          getSortName(a.customer_name || ''),
          getSortName(b.customer_name || '')
        )
      )

      setCompanies(sortedCompanies)
      setLoading(false)
    }

    initialize()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCompanyList(false)

        if (selectedCompanyId === 'all' && companySearchText.trim() === '') {
          setCompanySearchText('전체')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [selectedCompanyId, companySearchText])

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>()

    companies.forEach((company) => {
      map.set(String(company.id), company)
    })

    return map
  }, [companies])

  const filteredCompanies = useMemo(() => {
    const keyword = companySearchText.trim().toLowerCase()

    let result = companies

    if (keyword && keyword !== '전체') {
      result = companies.filter((company) =>
        company.customer_name.toLowerCase().includes(keyword)
      )
    }

    return [...result].sort((a, b) =>
      koreanCollator.compare(
        getSortName(a.customer_name || ''),
        getSortName(b.customer_name || '')
      )
    )
  }, [companies, companySearchText])

  const displayRows = useMemo<DisplayRow[]>(() => {
    const rows = contacts.map((contact) => {
      const company = companyMap.get(String(contact.company_id))

      return {
        contactId: contact.id,
        companyId: contact.company_id,
        companyName: company?.customer_name || '',
        contactName: contact.name || '',
        position: contact.position || '',
        department: contact.department || '',
        contactInfo: contact.phone || '',
        email: contact.email || '',
        workLocation: contact.work_location || '',
      }
    })

    return rows.sort((a, b) => {
      const companyCompare = koreanCollator.compare(
        getSortName(a.companyName),
        getSortName(b.companyName)
      )

      if (companyCompare !== 0) return companyCompare

      return koreanCollator.compare(
        getSortName(a.contactName),
        getSortName(b.contactName)
      )
    })
  }, [contacts, companyMap])

  const resetStatusView = useCallback(() => {
    setSelectedCompanyId('all')
    setCompanySearchText('전체')
    setShowCompanyList(false)
    setContacts([])
    setHasSearched(false)
    setMessage('')
    setLoadingContacts(false)
  }, [])

  const clearSavedStatusView = useCallback(() => {
    sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)

    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const saveCurrentStatusView = useCallback(() => {
    sessionStorage.setItem(
      CUSTOMER_CONTACT_STATUS_STATE_KEY,
      JSON.stringify({
        selectedCompanyId,
        companySearchText,
        hasSearched,
      })
    )

    const params = new URLSearchParams(window.location.search)
    params.set('restore', '1')

    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`
    )
  }, [selectedCompanyId, companySearchText, hasSearched])

  const loadContacts = useCallback(
    async (
      companyId: string,
      options?: {
        clearBeforeLoad?: boolean
      }
    ) => {
      setMessage('')

      if (options?.clearBeforeLoad) {
        setContacts([])
      }

      setHasSearched(false)
      setShowCompanyList(false)
      setLoadingContacts(true)

      let query = supabase
        .from('contacts')
        .select(
          'id, company_id, name, position, department, phone, email, work_location, print_order'
        )

      if (companyId !== 'all') {
        if (!companyId) {
          setMessage('고객사는 목록에서 선택하거나 전체를 선택해 주세요.')
          setLoadingContacts(false)
          return false
        }

        query = query.eq('company_id', Number(companyId))
      }

      const { data, error } = await query

      if (error) {
        setMessage(`담당자 현황 조회 실패: ${error.message}`)
        setLoadingContacts(false)
        return false
      }

      setContacts((data as ContactRow[]) || [])
      setHasSearched(true)
      setLoadingContacts(false)

      return true
    },
    []
  )

  const restoreSavedStatusView = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    const shouldRestore = params.get('restore') === '1'

    if (!shouldRestore) {
      sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
      resetStatusView()
      return
    }

    const savedValue = sessionStorage.getItem(
      CUSTOMER_CONTACT_STATUS_STATE_KEY
    )

    if (!savedValue) {
      resetStatusView()
      return
    }

    try {
      const savedState = JSON.parse(
        savedValue
      ) as SavedCustomerContactStatusState

      const restoredCompanyId = savedState.selectedCompanyId || 'all'
      const restoredCompanySearchText = savedState.companySearchText || '전체'
      const restoredHasSearched = Boolean(savedState.hasSearched)

      setSelectedCompanyId(restoredCompanyId)
      setCompanySearchText(restoredCompanySearchText)
      setShowCompanyList(false)
      setMessage('')

      if (restoredHasSearched) {
        await loadContacts(restoredCompanyId, {
          clearBeforeLoad: true,
        })
      } else {
        setContacts([])
        setHasSearched(false)
      }
    } catch {
      sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
      resetStatusView()
    }
  }, [loadContacts, resetStatusView])

  useEffect(() => {
    if (loading) return
    if (hasRestoredInitialViewRef.current) return

    hasRestoredInitialViewRef.current = true
    restoreSavedStatusView()
  }, [loading, restoreSavedStatusView])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return

      restoreSavedStatusView()
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [restoreSavedStatusView])

  function handleCompanyFocus() {
    setShowCompanyList(true)

    if (companySearchText.trim() === '전체') {
      setCompanySearchText('')
      setSelectedCompanyId('all')
    }
  }

  function handleCompanyInputChange(value: string) {
    clearSavedStatusView()

    setCompanySearchText(value)
    setShowCompanyList(true)
    setHasSearched(false)
    setContacts([])
    setMessage('')

    const trimmedValue = value.trim()

    if (!trimmedValue || trimmedValue === '전체') {
      setSelectedCompanyId('all')
      return
    }

    const matchedCompany = companies.find(
      (company) =>
        company.customer_name.trim().toLowerCase() ===
        trimmedValue.toLowerCase()
    )

    if (matchedCompany) {
      setSelectedCompanyId(String(matchedCompany.id))
    } else {
      setSelectedCompanyId('')
    }
  }

  function handleSelectAllCompany() {
    clearSavedStatusView()

    setSelectedCompanyId('all')
    setCompanySearchText('전체')
    setShowCompanyList(false)
    setHasSearched(false)
    setContacts([])
    setMessage('')
  }

  function handleCompanySelect(company: Company) {
    clearSavedStatusView()

    setSelectedCompanyId(String(company.id))
    setCompanySearchText(company.customer_name)
    setShowCompanyList(false)
    setHasSearched(false)
    setContacts([])
    setMessage('')
  }

  async function handleSearch() {
    clearSavedStatusView()

    await loadContacts(selectedCompanyId, {
      clearBeforeLoad: true,
    })
  }

  function handleContactRowClick(row: DisplayRow) {
    saveCurrentStatusView()

    const params = new URLSearchParams()
    params.set('companyId', String(row.companyId))
    params.set('contactId', String(row.contactId))
    params.set('from', 'customer-contact-status')

    router.push(`${CONTACT_REGISTER_PATH}?${params.toString()}`)
  }

  function handleExcelDownload() {
    if (displayRows.length === 0) {
      alert('다운로드할 조회 결과가 없습니다.')
      return
    }

    const selectedCompanyName =
      selectedCompanyId === 'all'
        ? '전체'
        : companyMap.get(String(selectedCompanyId))?.customer_name || ''

    const bodyRows = displayRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.companyName)}</td>
            <td>${escapeHtml(row.contactName)}</td>
            <td>${escapeHtml(row.position)}</td>
            <td>${escapeHtml(row.department)}</td>
            <td class="text-cell">${escapeHtml(row.contactInfo)}</td>
            <td>${escapeHtml(row.email)}</td>
            <td>${escapeHtml(row.workLocation)}</td>
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

            .text-cell {
              mso-number-format: "\\@";
            }
          </style>
        </head>

        <body>
          <table>
            <tr>
              <td colspan="7" class="title">고객사 담당자 현황</td>
            </tr>
            <tr>
              <td class="label">고객사</td>
              <td colspan="6">${escapeHtml(selectedCompanyName)}</td>
            </tr>
            <tr></tr>
            <tr>
              <th class="header">고객사명</th>
              <th class="header">담당자명</th>
              <th class="header">직급</th>
              <th class="header">부서명</th>
              <th class="header">연락처</th>
              <th class="header">이메일</th>
              <th class="header">근무지</th>
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
    link.download = `고객사_담당자_현황_${getTodayString()}.xls`
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
                고객사 담당자 현황
              </h1>

              <p className="mt-2 text-slate-600">
                고객사를 선택하여 담당자 현황을 조회하고 Excel로 다운로드할 수 있습니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <h2 className="text-lg font-bold text-slate-900">검색 조건</h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    고객사
                  </label>

                  <div ref={companyDropdownRef} className="relative">
                    <div className="flex h-12 w-full overflow-hidden rounded-xl border border-gray-300 bg-white">
                      <input
                        type="text"
                        value={companySearchText}
                        onChange={(e) =>
                          handleCompanyInputChange(e.target.value)
                        }
                        onFocus={handleCompanyFocus}
                        placeholder="전체 또는 고객사명을 입력하세요"
                        className="h-full min-w-0 flex-1 bg-white px-4 py-0 text-black outline-none placeholder:text-gray-500"
                      />

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (companySearchText.trim() === '전체') {
                            setCompanySearchText('')
                          }

                          setShowCompanyList((prev) => !prev)
                        }}
                        className="flex h-full w-12 items-center justify-center bg-white text-black"
                      >
                        ▼
                      </button>
                    </div>

                    {showCompanyList && (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-300 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSelectAllCompany}
                          className={`block w-full px-4 py-3 text-left text-sm text-black hover:bg-blue-50 ${
                            selectedCompanyId === 'all'
                              ? 'bg-blue-50 font-semibold'
                              : 'bg-white'
                          }`}
                        >
                          전체
                        </button>

                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleCompanySelect(company)}
                              className={`block w-full px-4 py-3 text-left text-sm text-black hover:bg-blue-50 ${
                                String(selectedCompanyId) === String(company.id)
                                  ? 'bg-blue-50 font-semibold'
                                  : 'bg-white'
                              }`}
                            >
                              {company.customer_name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            검색된 고객사가 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  담당자 목록
                </h2>

                <span className="text-sm text-slate-500">
                  {hasSearched ? `조회 건수: ${displayRows.length}건` : ''}
                </span>
              </div>

              {loadingContacts ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  담당자 현황을 조회하는 중입니다.
                </div>
              ) : !hasSearched ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  고객사를 선택한 후 조회 버튼을 누르세요.
                </div>
              ) : displayRows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  조회 결과가 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-300">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '21%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>

                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          고객사명
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          담당자명
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          직급
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          부서명
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          연락처
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          이메일
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          근무지
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayRows.map((row) => (
                        <tr
                          key={`${row.companyId}-${row.contactId}`}
                          onClick={() => handleContactRowClick(row)}
                          className="cursor-pointer transition hover:bg-blue-50"
                        >
                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.companyName}
                          </td>

                          <td className="break-keep border border-slate-300 px-3 py-2 text-black">
                            {row.contactName}
                          </td>

                          <td className="break-keep border border-slate-300 px-3 py-2 text-black">
                            {row.position}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.department}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.contactInfo}
                          </td>

                          <td className="break-all border border-slate-300 px-3 py-2 text-black">
                            {row.email}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.workLocation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {hasSearched && displayRows.length > 0 && (
                <p className="mt-3 text-sm text-slate-500">
                  담당자를 클릭하면 고객담당자 등록 / 수정 / 삭제 화면으로 이동합니다.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}