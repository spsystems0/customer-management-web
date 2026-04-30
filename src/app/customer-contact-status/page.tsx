'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

const CUSTOMER_CONTACT_STATUS_STATE_KEY = 'customer-contact-status-last-view'

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
  companyId: number
  contactId: number
  companyName: string
  contactName: string
  position: string
  department: string
  contactInfo: string
  email: string
  workLocation: string
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
  const restoredRef = useRef(false)
  const restoringRef = useRef(false)

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
        companyId: contact.company_id,
        contactId: contact.id,
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

  const saveCurrentView = useCallback((companyId: string, searchText: string) => {
    sessionStorage.setItem(
      CUSTOMER_CONTACT_STATUS_STATE_KEY,
      JSON.stringify({
        selectedCompanyId: companyId,
        companySearchText: searchText,
        hasSearched: true,
      })
    )
  }, [])

  const clearSavedView = useCallback(() => {
    sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
  }, [])

  const loadContactsByCompanyId = useCallback(
    async (
      companyId: string,
      searchText: string,
      shouldSaveCurrentView = true
    ) => {
      setMessage('')
      setContacts([])
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
          return
        }

        const existsCompany = companies.some(
          (company) => String(company.id) === String(companyId)
        )

        if (!existsCompany) {
          setMessage('선택한 고객사를 찾을 수 없습니다.')
          setLoadingContacts(false)
          return
        }

        query = query.eq('company_id', Number(companyId))
      }

      const { data, error } = await query
        .order('print_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        setMessage(`담당자 현황 조회 실패: ${error.message}`)
        setLoadingContacts(false)
        return
      }

      const finalSearchText = searchText || (companyId === 'all' ? '전체' : '')

      setSelectedCompanyId(companyId)
      setCompanySearchText(finalSearchText)
      setContacts((data as ContactRow[]) || [])
      setHasSearched(true)
      setLoadingContacts(false)

      if (shouldSaveCurrentView) {
        saveCurrentView(companyId, finalSearchText)
      }
    },
    [companies, saveCurrentView]
  )

  const restoreLastView = useCallback(async () => {
    if (loading) return
    if (companies.length === 0) return
    if (restoringRef.current) return

    const savedValue = sessionStorage.getItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)

    if (!savedValue) return

    try {
      restoringRef.current = true

      const savedState = JSON.parse(savedValue) as {
        selectedCompanyId?: string
        companySearchText?: string
        hasSearched?: boolean
      }

      if (!savedState.hasSearched) {
        sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
        return
      }

      const savedCompanyId = savedState.selectedCompanyId || 'all'
      let savedSearchText =
        savedState.companySearchText || (savedCompanyId === 'all' ? '전체' : '')

      if (savedCompanyId !== 'all') {
        const matchedCompany = companies.find(
          (company) => String(company.id) === String(savedCompanyId)
        )

        if (!matchedCompany) {
          sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
          return
        }

        savedSearchText = matchedCompany.customer_name
      }

      await loadContactsByCompanyId(savedCompanyId, savedSearchText, false)

      // 중요:
      // 뒤로가기로 한 번 복원한 후에는 저장값을 삭제합니다.
      // 그래서 다른 메뉴를 사용하다가 다시 들어오면 이전 조회 결과가 남지 않습니다.
      sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
    } catch {
      sessionStorage.removeItem(CUSTOMER_CONTACT_STATUS_STATE_KEY)
    } finally {
      restoringRef.current = false
    }
  }, [loading, companies, loadContactsByCompanyId])

  useEffect(() => {
    if (restoredRef.current) return
    if (loading) return
    if (companies.length === 0) return

    restoredRef.current = true
    restoreLastView()
  }, [loading, companies.length, restoreLastView])

  useEffect(() => {
    const handlePageShow = () => {
      if (loading) return
      if (companies.length === 0) return

      restoreLastView()
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [loading, companies.length, restoreLastView])

  function handleCompanyFocus() {
    setShowCompanyList(true)

    if (companySearchText.trim() === '전체') {
      setCompanySearchText('')
      setSelectedCompanyId('all')
    }
  }

  function handleCompanyInputChange(value: string) {
    clearSavedView()

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
    clearSavedView()

    setSelectedCompanyId('all')
    setCompanySearchText('전체')
    setShowCompanyList(false)
    setHasSearched(false)
    setContacts([])
    setMessage('')
  }

  function handleCompanySelect(company: Company) {
    clearSavedView()

    setSelectedCompanyId(String(company.id))
    setCompanySearchText(company.customer_name)
    setShowCompanyList(false)
    setHasSearched(false)
    setContacts([])
    setMessage('')
  }

  async function handleSearch() {
    await loadContactsByCompanyId(
      selectedCompanyId,
      selectedCompanyId === 'all' ? '전체' : companySearchText
    )
  }

  function handleRowClick(row: DisplayRow) {
    saveCurrentView(selectedCompanyId, companySearchText)

    const params = new URLSearchParams()

    params.set('companyId', String(row.companyId))
    params.set('contactId', String(row.contactId))
    params.set('from', 'customer-contact-status')

    router.push(`/contacts?${params.toString()}`)
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
                      {displayRows.map((row, index) => (
                        <tr
                          key={`${row.companyName}-${row.contactName}-${index}`}
                          onClick={() => handleRowClick(row)}
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

                  <p className="px-1 py-3 text-sm text-slate-500">
                    담당자 행을 클릭하면 해당 담당자의 고객담당자정보등록 화면으로 이동합니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}