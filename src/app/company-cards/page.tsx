'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const COMPANY_CARDS_STATE_KEY = 'company-cards-last-view'

type SidebarMode = 'guest' | 'sales'

type Company = {
  id: number
  customer_name: string
  business_number: string | null
  industry: string | null
  address: string | null
  main_product: string | null
  homepage: string | null
  transaction_start_date: string | null
  sales_owner: string | null
  revenue: string | null
  employee_count: number | null
  note: string | null
  customer_category_code: string | null
}

type Contact = {
  id: number
  company_id: number
  name: string
  department: string | null
  position: string | null
  phone: string | null
  email: string | null
  main_role: string | null
  print_order: number | null
}

type VisitLog = {
  id: number
  visit_date: string
  contact_name: string
  purpose: string
  visitor_name: string
}

type CustomerCategoryCode = {
  id: number
  code: string
  code_name: string
}



export default function CompanyCardsPage() {
  const router = useRouter()
  const companySearchBoxRef = useRef<HTMLDivElement | null>(null)

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('guest')

  const [companies, setCompanies] = useState<Company[]>([])
  const [categoryCodes, setCategoryCodes] = useState<CustomerCategoryCode[]>([])

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const [companySearchText, setCompanySearchText] = useState('')
  const [showCompanyList, setShowCompanyList] = useState(false)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        companySearchBoxRef.current &&
        !companySearchBoxRef.current.contains(event.target as Node)
      ) {
        setShowCompanyList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSidebarMode(session ? 'sales' : 'guest')

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select(`
          id,
          customer_name,
          business_number,
          industry,
          address,
          main_product,
          homepage,
          transaction_start_date,
          sales_owner,
          revenue,
          employee_count,
          note,
          customer_category_code
        `)
        .order('customer_name', { ascending: true })

      if (companyError) {
        setMessage(`고객사 목록 조회 실패: ${companyError.message}`)
        setLoading(false)
        return
      }

      const { data: codeData, error: codeError } = await supabase
        .from('customer_category_codes')
        .select('id, code, code_name')
        .order('sort_order', { ascending: true })

      if (codeError) {
        setMessage(`고객분류코드 목록 조회 실패: ${codeError.message}`)
        setLoading(false)
        return
      }

      setCompanies((companyData as Company[]) || [])
      setCategoryCodes((codeData as CustomerCategoryCode[]) || [])
      setLoading(false)
    }

    initialize()
  }, [])

  const filteredCompanies = companies.filter((company) =>
    company.customer_name
      .toLowerCase()
      .includes(companySearchText.trim().toLowerCase())
  )

  const saveCurrentView = useCallback((companyId: string) => {
    sessionStorage.setItem(
      COMPANY_CARDS_STATE_KEY,
      JSON.stringify({
        selectedCompanyId: companyId,
      })
    )
  }, [])

  const replaceCompanyCardsUrl = useCallback((companyId: string) => {
    const params = new URLSearchParams()
    params.set('companyId', companyId)

    window.history.replaceState(null, '', `/company-cards?${params.toString()}`)
  }, [])

  const clearSavedView = useCallback(() => {
    sessionStorage.removeItem(COMPANY_CARDS_STATE_KEY)
    window.history.replaceState(null, '', '/company-cards')
  }, [])

  const getRestorableCompanyId = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const companyIdFromUrl = params.get('companyId')

    if (companyIdFromUrl) {
      return companyIdFromUrl
    }

    sessionStorage.removeItem(COMPANY_CARDS_STATE_KEY)

    return ''
  }, [])

  const loadCompanyCardByCompanyId = useCallback(
    async (companyId: string, showLoadMessage = false) => {
      setMessage('')
      setSelectedCompany(null)
      setContacts([])
      setVisitLogs([])

      const company = companies.find(
        (item) => String(item.id) === String(companyId)
      )

      if (!company) {
        setMessage('선택한 고객사 정보를 찾을 수 없습니다.')
        return
      }

      setSelectedCompanyId(String(company.id))
      setCompanySearchText(company.customer_name)
      setShowCompanyList(false)
      setSelectedCompany(company)

      saveCurrentView(String(company.id))
      replaceCompanyCardsUrl(String(company.id))

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(
          'id, company_id, name, department, position, phone, email, main_role, print_order'
        )
        .eq('company_id', Number(company.id))
        .order('print_order', { ascending: true })
        .order('name', { ascending: true })

      if (contactsError) {
        setMessage(`담당자 목록 조회 실패: ${contactsError.message}`)
        return
      }

      setContacts((contactsData as Contact[]) || [])

      const { data: visitData, error: visitError } = await supabase
        .from('visit_logs')
        .select(`
          id,
          visit_date,
          purpose,
          visitor_name,
          contacts(name)
        `)
        .eq('company_id', Number(company.id))
        .order('visit_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(50)

      if (visitError) {
        setMessage(`방문이력 조회 실패: ${visitError.message}`)
        return
      }

      const formattedVisitLogs: VisitLog[] = (visitData || []).map(
        (item: any) => ({
          id: item.id,
          visit_date: item.visit_date || '',
          contact_name: item.contacts?.name || '',
          purpose: item.purpose || '',
          visitor_name: item.visitor_name || '',
        })
      )

      setVisitLogs(formattedVisitLogs)

      if (showLoadMessage) {
        setMessage('고객사관리카드를 불러왔습니다.')
      }
    },
    [companies, replaceCompanyCardsUrl, saveCurrentView]
  )

  useEffect(() => {
    if (loading) return
    if (companies.length === 0) return

    const restorableCompanyId = getRestorableCompanyId()

    if (!restorableCompanyId) return

    if (String(selectedCompany?.id || '') === String(restorableCompanyId)) {
      return
    }

    loadCompanyCardByCompanyId(restorableCompanyId, false)
  }, [
    loading,
    companies.length,
    selectedCompany?.id,
    getRestorableCompanyId,
    loadCompanyCardByCompanyId,
  ])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      if (loading) return
      if (companies.length === 0) return

      const restorableCompanyId = getRestorableCompanyId()

      if (!restorableCompanyId) return

      loadCompanyCardByCompanyId(restorableCompanyId, false)
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [
    loading,
    companies.length,
    getRestorableCompanyId,
    loadCompanyCardByCompanyId,
  ])

  const handleCompanyInputChange = (value: string) => {
    clearSavedView()

    setCompanySearchText(value)
    setSelectedCompanyId('')
    setSelectedCompany(null)
    setContacts([])
    setVisitLogs([])
    setMessage('')
    setShowCompanyList(true)
  }

  const handleCompanySelect = (company: Company) => {
    clearSavedView()

    setSelectedCompanyId(String(company.id))
    setCompanySearchText(company.customer_name)
    setSelectedCompany(null)
    setContacts([])
    setVisitLogs([])
    setMessage('')
    setShowCompanyList(false)
  }

  function handleContactClick(
    companyId: string | number,
    contactId: string | number
  ) {
    saveCurrentView(String(companyId))
    replaceCompanyCardsUrl(String(companyId))

    const params = new URLSearchParams()

    params.set('companyId', String(companyId))
    params.set('contactId', String(contactId))
    params.set('from', 'company-cards')

    router.push(`/customer-cards?${params.toString()}`)
  }

  const handleSearch = async () => {
    if (!selectedCompanyId) {
      setMessage('고객사를 목록에서 선택해 주세요.')
      return
    }

    await loadCompanyCardByCompanyId(selectedCompanyId, true)
  }

  const handlePrint = () => {
    if (!selectedCompany) {
      alert('먼저 고객사를 조회해 주세요.')
      return
    }

    window.print()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-700">불러오는 중...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar mode={sidebarMode} />

        <section className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-2xl bg-white p-8 shadow print:hidden">
              <h1 className="text-2xl font-bold text-black">
                고객사관리카드 조회
              </h1>

              <p className="mt-2 text-black">
                고객사명을 입력하여 검색한 후 고객사를 선택하고 조회합니다.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <div ref={companySearchBoxRef} className="relative">
                  <input
                    type="text"
                    value={companySearchText}
                    onChange={(e) => handleCompanyInputChange(e.target.value)}
                    onFocus={() => setShowCompanyList(true)}
                    placeholder="고객사를 선택하세요"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                  />

                  {showCompanyList && (
                    <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-lg">
                      {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleCompanySelect(company)}
                            className={`block w-full px-4 py-3 text-left text-black hover:bg-emerald-50 ${
                              String(selectedCompanyId) === String(company.id)
                                ? 'bg-emerald-50 font-semibold'
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

                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
                >
                  조회
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-xl bg-slate-600 px-6 py-3 font-medium text-white hover:bg-slate-700"
                >
                  출력
                </button>
              </div>

              {message && (
                <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-100 px-4 py-3 text-sm text-black">
                  {message}
                </div>
              )}
            </div>

            {selectedCompany && (
              <div className="rounded-2xl bg-white p-8 shadow print:hidden">
                <h2 className="text-xl font-bold text-black">
                  고객사관리카드 미리보기
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoItem
                    label="고객분류코드"
                    value={getCategoryCodeName(
                      selectedCompany.customer_category_code,
                      categoryCodes
                    )}
                  />
                  <InfoItem label="고객사명" value={selectedCompany.customer_name} />
                  <InfoItem
                    label="사업자번호"
                    value={selectedCompany.business_number}
                  />
                  <InfoItem label="업종" value={selectedCompany.industry} />
                  <InfoItem label="매출금액" value={selectedCompany.revenue} />
                  <InfoItem
                    label="직원 수"
                    value={
                      selectedCompany.employee_count !== null
                        ? String(selectedCompany.employee_count)
                        : ''
                    }
                  />
                  <InfoItem label="주소" value={selectedCompany.address} />
                  <InfoItem
                    label="거래시작년월"
                    value={formatYearMonth(selectedCompany.transaction_start_date)}
                  />
                  <InfoItem label="영업담당" value={selectedCompany.sales_owner} />
                  <InfoItem label="홈페이지" value={selectedCompany.homepage} />
                  <InfoItem label="주력 제품" value={selectedCompany.main_product} />
                  <InfoItem label="기타" value={selectedCompany.note} />
                </div>

                <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-black">담당자 정보</h3>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full table-fixed border border-slate-300 text-sm text-black">
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '24%' }} />
                        <col style={{ width: '26%' }} />
                      </colgroup>

                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-2">이름</th>
                          <th className="border px-3 py-2">부서</th>
                          <th className="border px-3 py-2">직급</th>
                          <th className="border px-3 py-2">연락처</th>
                          <th className="border px-3 py-2">이메일</th>
                          <th className="border px-3 py-2">주요역할</th>
                        </tr>
                      </thead>

                      <tbody>
                        {contacts.length > 0 ? (
                          contacts.map((contact) => (
                            <tr
                              key={contact.id}
                              onClick={() =>
                                handleContactClick(
                                  contact.company_id || selectedCompanyId,
                                  contact.id
                                )
                              }
                              className="cursor-pointer transition hover:bg-blue-50"
                            >
                              <td className="border border-slate-300 px-3 py-2 text-black">
                                {contact.name}
                              </td>

                              <td className="border border-slate-300 px-3 py-2 text-black">
                                {contact.department || ''}
                              </td>

                              <td className="border border-slate-300 px-3 py-2 text-black">
                                {contact.position || ''}
                              </td>

                              <td className="border border-slate-300 px-3 py-2 text-black">
                                {contact.phone || ''}
                              </td>

                              <td className="break-all border border-slate-300 px-3 py-2 text-black">
                                {contact.email || ''}
                              </td>

                              <td className="whitespace-pre-wrap border border-slate-300 px-3 py-2 text-black">
                                {contact.main_role || ''}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="border px-3 py-6 text-center text-slate-500"
                            >
                              등록된 담당자가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    담당자를 클릭하면 해당 담당자의 고객관리카드 조회 화면으로 이동합니다.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-black">방문 이력</h3>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full table-fixed border border-slate-300 text-sm text-black">
                      <colgroup>
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '58%' }} />
                      </colgroup>

                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-2 text-center">
                            방문일자
                          </th>
                          <th className="border px-3 py-2 text-center">
                            담당자
                          </th>
                          <th className="border px-3 py-2 text-center">
                            방문자
                          </th>
                          <th className="border px-3 py-2 text-center">
                            방문목적
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visitLogs.length > 0 ? (
                          visitLogs.map((row) => (
                            <tr key={`visit-screen-${row.id}`}>
                              <td className="border px-3 py-2 text-center">
                                {row.visit_date || ''}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.contact_name || ''}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.visitor_name || ''}
                              </td>
                              <td className="border px-3 py-2">
                                {row.purpose || ''}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="border px-3 py-6 text-center text-slate-500"
                            >
                              방문이력이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {selectedCompany && (
              <div className="hidden print:block print-company-card">
                <div className="print-sheet bg-white text-black">
                  <div className="print-title">고객사 관리 카드</div>

                  <table className="print-main-table">
                    <colgroup>
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>

                    <tbody>
                      <tr>
                        <th className="print-label">고객분류코드</th>
                        <td className="print-value">
                          {getCategoryCodeName(
                            selectedCompany.customer_category_code,
                            categoryCodes
                          )}
                        </td>
                        <th className="print-label">고객사명</th>
                        <td className="print-value" colSpan={3}>
                          {selectedCompany.customer_name || ''}
                        </td>
                      </tr>

                      <tr>
                        <th className="print-label">사업자번호</th>
                        <td className="print-value">
                          {selectedCompany.business_number || ''}
                        </td>
                        <th className="print-label">업종</th>
                        <td className="print-value" colSpan={3}>
                          {selectedCompany.industry || ''}
                        </td>
                      </tr>

                      <tr>
                        <th className="print-label">매출금액</th>
                        <td className="print-value">
                          {selectedCompany.revenue || ''}
                        </td>
                        <th className="print-label">직원 수</th>
                        <td className="print-value">
                          {selectedCompany.employee_count !== null
                            ? String(selectedCompany.employee_count)
                            : ''}
                        </td>
                        <th className="print-label">거래시작년월</th>
                        <td className="print-value">
                          {formatYearMonth(selectedCompany.transaction_start_date)}
                        </td>
                      </tr>

                      <tr>
                        <th className="print-label">주소</th>
                        <td className="print-value" colSpan={5}>
                          {selectedCompany.address || ''}
                        </td>
                      </tr>

                      <tr>
                        <th className="print-label">홈페이지</th>
                        <td className="print-value" colSpan={3}>
                          {selectedCompany.homepage || ''}
                        </td>
                        <th className="print-label">영업담당</th>
                        <td className="print-value">
                          {selectedCompany.sales_owner || ''}
                        </td>
                      </tr>

                      <tr className="print-row-lg">
                        <th className="print-label">주력 제품</th>
                        <td className="print-value whitespace-pre-wrap" colSpan={5}>
                          {selectedCompany.main_product || ''}
                        </td>
                      </tr>

                      <tr className="print-row-lg">
                        <th className="print-label">기타</th>
                        <td className="print-value whitespace-pre-wrap" colSpan={5}>
                          {selectedCompany.note || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="print-section-title mt-6">담당자 정보</div>

                  <table className="print-contact-table">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '22%' }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th className="print-subhead">이름</th>
                        <th className="print-subhead">부서</th>
                        <th className="print-subhead">직급</th>
                        <th className="print-subhead">연락처</th>
                        <th className="print-subhead">이메일</th>
                        <th className="print-subhead">주요역할</th>
                      </tr>
                    </thead>

                    <tbody>
                      {contacts.length > 0 ? (
                        contacts.map((contact) => (
                          <tr key={contact.id}>
                            <td>{contact.name || ''}</td>
                            <td>{contact.department || ''}</td>
                            <td>{contact.position || ''}</td>
                            <td>{contact.phone || ''}</td>
                            <td>{contact.email || ''}</td>
                            <td className="whitespace-pre-wrap">
                              {contact.main_role || ''}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center' }}>
                            등록된 담당자가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="print-section-title mt-6">방문 이력</div>

                  <table className="print-visit-table">
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '58%' }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th className="print-subhead">방문일자</th>
                        <th className="print-subhead">담당자</th>
                        <th className="print-subhead">방문자</th>
                        <th className="print-subhead">방문목적</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visitLogs.length > 0 ? (
                        visitLogs.map((row) => (
                          <tr key={`visit-print-${row.id}`}>
                            <td style={{ textAlign: 'center' }}>
                              {row.visit_date || ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {row.contact_name || ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {row.visitor_name || ''}
                            </td>
                            <td>{row.purpose || ''}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center' }}>
                            방문이력이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-black">{value || '-'}</div>
    </div>
  )
}

function formatYearMonth(dateValue: string | null) {
  if (!dateValue) return ''

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = date.getMonth() + 1

  return `${year}년 ${month}월`
}

function getCategoryCodeName(
  code: string | null,
  categoryCodes: CustomerCategoryCode[]
) {
  if (!code) return ''

  const found = categoryCodes.find((item) => item.code === code)

  return found?.code_name || ''
}