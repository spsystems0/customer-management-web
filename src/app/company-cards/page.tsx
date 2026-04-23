'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

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
  name: string
  position: string | null
  phone: string | null
  email: string | null
  main_role: string | null
  print_order: number | null
}

type VisitLog = {
  id: number
  visit_date: string | null
  contact_name: string | null
  purpose: string | null
  visitor_name: string | null
  discussion: string | null
  follow_up_action: string | null
}

export default function CompanyCardsPage() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('guest')

  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSidebarMode(session ? 'sales' : 'guest')

      const { data, error } = await supabase
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

      if (error) {
        setMessage(`고객사 목록 조회 실패: ${error.message}`)
        setLoading(false)
        return
      }

      setCompanies(data || [])
      setLoading(false)
    }

    initialize()
  }, [])

  const handleSearch = async () => {
    setMessage('')
    setSelectedCompany(null)
    setContacts([])
    setVisitLogs([])

    if (!selectedCompanyId) {
      setMessage('고객사를 선택해 주세요.')
      return
    }

    const company = companies.find(
      (item) => String(item.id) === String(selectedCompanyId)
    )

    if (!company) {
      setMessage('선택한 고객사 정보를 찾을 수 없습니다.')
      return
    }

    setSelectedCompany(company)

    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, position, phone, email, main_role, print_order')
      .eq('company_id', Number(selectedCompanyId))
      .order('print_order', { ascending: true })
      .order('name', { ascending: true })

    if (contactsError) {
      setMessage(`담당자 목록 조회 실패: ${contactsError.message}`)
      return
    }

    setContacts(contactsData || [])

    const { data: visitData, error: visitError } = await supabase
      .from('visit_logs')
      .select(`
        id,
        visit_date,
        purpose,
        discussion,
        visitor_name,
        follow_up_action,
        contact_id,
        contacts(name)
      `)
      .eq('company_id', Number(selectedCompanyId))
      .order('visit_date', { ascending: false })
      .limit(50)

    if (visitError) {
      setMessage(`방문이력 조회 실패: ${visitError.message}`)
      return
    }

    const formattedVisitLogs: VisitLog[] = (visitData || []).map((item: any) => ({
      id: item.id,
      visit_date: item.visit_date,
      contact_name: item.contacts?.name || '',
      purpose: item.purpose,
      visitor_name: item.visitor_name,
      discussion: item.discussion,
      follow_up_action: item.follow_up_action,
    }))

    setVisitLogs(formattedVisitLogs)
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
            <div className="rounded-2xl bg-white p-8 shadow print-hide">
              <h1 className="text-2xl font-bold text-black">고객사관리카드 조회</h1>
              <p className="mt-2 text-black">
                고객사를 선택하여 고객사관리카드를 조회하고 출력합니다.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                >
                  <option value="">고객사를 선택하세요</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.customer_name}
                    </option>
                  ))}
                </select>

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
                <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-black">
                  {message}
                </div>
              )}
            </div>

            {selectedCompany && (
              <div className="rounded-2xl bg-white p-8 shadow print-hide">
                <h2 className="text-xl font-bold text-black">고객사관리카드 미리보기</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoItem label="고객분류코드" value={selectedCompany.customer_category_code} />
                  <InfoItem label="고객사명" value={selectedCompany.customer_name} />
                  <InfoItem label="사업자번호" value={selectedCompany.business_number} />
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
                    label="거래시작년도"
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
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '46%' }} />
                      </colgroup>
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-2">이름</th>
                          <th className="border px-3 py-2">직급</th>
                          <th className="border px-3 py-2">연락처</th>
                          <th className="border px-3 py-2">이메일</th>
                          <th className="border px-3 py-2">주요역할</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.length > 0 ? (
                          contacts.map((contact) => (
                            <tr key={contact.id}>
                              <td className="border px-3 py-2 align-top">{contact.name || ''}</td>
                              <td className="border px-3 py-2 align-top">
                                {contact.position || ''}
                              </td>
                              <td className="border px-3 py-2 align-top">{contact.phone || ''}</td>
                              <td className="border px-3 py-2 align-top">{contact.email || ''}</td>
                              <td className="border px-3 py-2 align-top whitespace-pre-wrap">
                                {contact.main_role || ''}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-black">방문 이력</h3>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full table-fixed border border-slate-300 text-sm text-black">
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '27%' }} />
                        <col style={{ width: '27%' }} />
                      </colgroup>
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-2">방문일자</th>
                          <th className="border px-3 py-2">담당자</th>
                          <th className="border px-3 py-2">목적</th>
                          <th className="border px-3 py-2">방문자</th>
                          <th className="border px-3 py-2">주요내용</th>
                          <th className="border px-3 py-2">후속조치</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitLogs.length > 0 ? (
                          visitLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="border px-3 py-2 align-top">
                                {log.visit_date || ''}
                              </td>
                              <td className="border px-3 py-2 align-top">
                                {log.contact_name || ''}
                              </td>
                              <td className="border px-3 py-2 align-top whitespace-pre-wrap">
                                {log.purpose || ''}
                              </td>
                              <td className="border px-3 py-2 align-top">
                                {log.visitor_name || ''}
                              </td>
                              <td className="border px-3 py-2 align-top whitespace-pre-wrap">
                                {log.discussion || ''}
                              </td>
                              <td className="border px-3 py-2 align-top whitespace-pre-wrap">
                                {log.follow_up_action || ''}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                            <td className="border px-3 py-2"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {selectedCompany && (
              <div className="print-company-card">
                <div className="mx-auto max-w-7xl bg-white p-6 text-black">
                  <div className="border border-black bg-[#1f4e79] py-2 text-center text-lg font-bold text-white">
                    고객사 관리 카드
                  </div>

                  <table className="w-full border-collapse border border-black text-sm">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '25%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">고객분류코드</th>
                        <td className="border border-black px-2 py-2">
                          {selectedCompany.customer_category_code || ''}
                        </td>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">고객사명</th>
                        <td className="border border-black px-2 py-2" colSpan={3}>
                          {selectedCompany.customer_name || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">사업자번호</th>
                        <td className="border border-black px-2 py-2">
                          {selectedCompany.business_number || ''}
                        </td>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">업종</th>
                        <td className="border border-black px-2 py-2" colSpan={3}>
                          {selectedCompany.industry || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">매출금액</th>
                        <td className="border border-black px-2 py-2">
                          {selectedCompany.revenue || ''}
                        </td>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">직원 수</th>
                        <td className="border border-black px-2 py-2">
                          {selectedCompany.employee_count !== null
                            ? String(selectedCompany.employee_count)
                            : ''}
                        </td>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">거래시작년도</th>
                        <td className="border border-black px-2 py-2">
                          {formatYearMonth(selectedCompany.transaction_start_date)}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">주소</th>
                        <td className="border border-black px-2 py-2" colSpan={5}>
                          {selectedCompany.address || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">홈페이지</th>
                        <td className="border border-black px-2 py-2" colSpan={3}>
                          {selectedCompany.homepage || ''}
                        </td>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">영업담당</th>
                        <td className="border border-black px-2 py-2">
                          {selectedCompany.sales_owner || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">주력 제품</th>
                        <td
                          className="border border-black px-2 py-3 whitespace-pre-wrap"
                          colSpan={5}
                        >
                          {selectedCompany.main_product || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">기타</th>
                        <td
                          className="border border-black px-2 py-6 whitespace-pre-wrap"
                          colSpan={5}
                        >
                          {selectedCompany.note || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-6 border border-black bg-[#4f81bd] py-1 text-center text-base font-bold text-white">
                    담당자 정보
                  </div>

                  <table className="w-full table-fixed border-collapse border border-black text-sm">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '46%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">이름</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">직급</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">연락처</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">이메일</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">주요역할</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.length > 0 ? (
                        contacts.map((contact) => (
                          <tr key={contact.id}>
                            <td className="border border-black px-2 py-2 align-top">
                              {contact.name || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top">
                              {contact.position || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top">
                              {contact.phone || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top">
                              {contact.email || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top whitespace-pre-wrap">
                              {contact.main_role || ''}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="mt-6 border border-black bg-[#4f81bd] py-1 text-center text-base font-bold text-white">
                    방문 이력
                  </div>

                  <table className="w-full table-fixed border-collapse border border-black text-sm">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '27%' }} />
                      <col style={{ width: '27%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">방문일자</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">담당자</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">목적</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">방문자</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">주요내용</th>
                        <th className="border border-black bg-[#dbeef4] px-2 py-2">후속조치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitLogs.length > 0 ? (
                        visitLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="border border-black px-2 py-2 align-top">
                              {log.visit_date || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top">
                              {log.contact_name || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top whitespace-pre-wrap">
                              {log.purpose || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top">
                              {log.visitor_name || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top whitespace-pre-wrap">
                              {log.discussion || ''}
                            </td>
                            <td className="border border-black px-2 py-2 align-top whitespace-pre-wrap">
                              {log.follow_up_action || ''}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
                          <td className="border border-black px-2 py-2"></td>
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