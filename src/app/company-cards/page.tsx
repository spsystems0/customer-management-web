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
  department: string | null
  position: string | null
  phone: string | null
  email: string | null
  main_role: string | null
}

type VisitLog = {
  id: number
  visit_date: string | null
  purpose: string | null
  discussion: string | null
  visitor_name: string | null
}

export default function CompanyCardsPage() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('guest')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSidebarMode(session ? 'sales' : 'guest')

      const { data, error } = await supabase
        .from('companies')
        .select(
          'id, customer_name, business_number, industry, address, main_product, homepage, transaction_start_date, sales_owner, revenue, employee_count, note, customer_category_code'
        )
        .order('customer_name', { ascending: true })

      if (error) {
        setMessage(`고객사 목록 조회 실패: ${error.message}`)
        setLoadingCompanies(false)
        return
      }

      setCompanies(data || [])
      setLoadingCompanies(false)
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
      .select('id, name, department, position, phone, email, main_role, print_order')
      .eq('company_id', Number(selectedCompanyId))
      .order('print_order', { ascending: true })
      .order('name', { ascending: true })


      if (contactsError) {
      setMessage(`담당자 조회 실패: ${contactsError.message}`)
      return
    }

    setContacts(contactsData || [])

    const { data: visitData, error: visitError } = await supabase
      .from('visit_logs')
      .select('id, visit_date, purpose, discussion, visitor_name')
      .eq('company_id', Number(selectedCompanyId))
      .order('visit_date', { ascending: false })
      .limit(50)

    if (!visitError) {
      setVisitLogs(visitData || [])
    }
  }

  const handlePrint = () => {
    if (!selectedCompany) {
      alert('먼저 고객사를 조회해 주세요.')
      return
    }

    window.print()
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar mode={sidebarMode} />

        <section className="flex-1 px-6 py-10">
          <div className="print-area mx-auto max-w-6xl space-y-6">
            {/* 화면용 */}
            <div className="screen-report-wrap rounded-2xl bg-white p-8 shadow print-hide">
              <h1 className="text-2xl font-bold text-black">
                고객사관리카드 조회
              </h1>
              <p className="mt-2 text-black">
                고객사를 선택하여 고객사관리카드를 조회하고 출력합니다.
              </p>

              {loadingCompanies ? (
                <div className="mt-6 text-black">고객사 목록 불러오는 중...</div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* 화면 미리보기 */}
            {selectedCompany && (
              <div className="screen-report-wrap space-y-6 print-hide">
                <div className="rounded-2xl bg-white p-8 shadow">
                  <h2 className="text-xl font-bold text-black">
                    고객사관리카드 미리보기
                  </h2>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <InfoItem
                      label="고객분류코드"
                      value={selectedCompany.customer_category_code}
                    />
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
                    <InfoItem label="영업담당" value={selectedCompany.sales_owner} />
                    <InfoItem label="홈페이지" value={selectedCompany.homepage} />
                    <InfoItem label="주력 제품" value={selectedCompany.main_product} />
                    <InfoItem label="기타" value={selectedCompany.note} />
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-8 shadow">
                  <h3 className="text-lg font-bold text-black">담당자 정보</h3>

                  {contacts.length === 0 ? (
                    <p className="mt-4 text-black">등록된 담당자가 없습니다.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full border border-slate-300 text-sm text-black">
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
                          {contacts.map((contact) => (
                            <tr key={contact.id}>
                              <td className="border px-3 py-2">{contact.name || ''}</td>
                              <td className="border px-3 py-2">{contact.position || ''}</td>
                              <td className="border px-3 py-2">{contact.phone || ''}</td>
                              <td className="border px-3 py-2">{contact.email || ''}</td>
                              <td className="border px-3 py-2">{contact.main_role || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-8 shadow">
                  <h3 className="text-lg font-bold text-black">방문 이력</h3>

                  {visitLogs.length === 0 ? (
                    <p className="mt-4 text-black">등록된 방문이력이 없습니다.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full border border-slate-300 text-sm text-black">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="border px-3 py-2">방문일자</th>
                            <th className="border px-3 py-2">목적</th>
                            <th className="border px-3 py-2">방문자</th>
                            <th className="border px-3 py-2">주요내용</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="border px-3 py-2">{log.visit_date || ''}</td>
                              <td className="border px-3 py-2">{log.purpose || ''}</td>
                              <td className="border px-3 py-2">
                                {selectedCompany.sales_owner || ''}
                              </td>
                              <td className="border px-3 py-2">{log.discussion || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 출력용 */}
            {selectedCompany && (
              <div className="print-company-card">
                <div className="print-sheet">
                  <div className="print-title">고객사 관리 카드</div>

                  <table className="print-main-table">
                    <colgroup>
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '39%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '35%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th className="print-label">고객분류코드</th>
                        <td className="print-value">
                          {selectedCompany.customer_category_code || ''}
                        </td>
                        <th className="print-label">고객사명</th>
                        <td className="print-value">
                          {selectedCompany.customer_name || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="print-label">사업자번호</th>
                        <td className="print-value">
                          {selectedCompany.business_number || ''}
                        </td>
                        <th className="print-label">업종</th>
                        <td className="print-value">
                          {selectedCompany.industry || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="print-label">매출금액</th>
                        <td className="print-value">{selectedCompany.revenue || ''}</td>
                        <th className="print-label">직원 수</th>
                        <td className="print-value">
                          {selectedCompany.employee_count !== null
                            ? String(selectedCompany.employee_count)
                            : ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="print-label">주소</th>
                        <td className="print-value" colSpan={3}>
                          {selectedCompany.address || ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="print-label">홈페이지</th>
                        <td className="print-value">
                          {selectedCompany.homepage || ''}
                        </td>
                        <th className="print-label">영업담당</th>
                        <td className="print-value">
                          {selectedCompany.sales_owner || ''}
                        </td>
                      </tr>
                      <tr className="print-row-lg">
                        <th className="print-label">주력 제품</th>
                        <td className="print-value" colSpan={3}>
                          {selectedCompany.main_product || ''}
                        </td>
                      </tr>
                      <tr className="print-row-lg">
                        <th className="print-label">기 타</th>
                        <td className="print-value" colSpan={3}>
                          {selectedCompany.note || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="print-section-title">담당자 정보</div>
                  <table className="print-contact-table">
                    <colgroup>
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '23%' }} />
                      <col style={{ width: '24%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="print-subhead">이름</th>
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
                            <td>{contact.position || ''}</td>
                            <td>{contact.phone || ''}</td>
                            <td>{contact.email || ''}</td>
                            <td>{contact.main_role || ''}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="print-section-title">방문 이력</div>
                  <table className="print-visit-table">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '43%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="print-subhead">방문일자</th>
                        <th className="print-subhead">목적</th>
                        <th className="print-subhead">방문자</th>
                        <th className="print-subhead">주요내용</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitLogs.length > 0 ? (
                        visitLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{log.visit_date || ''}</td>
                            <td>{log.purpose || ''}</td>
                            <td>{log.visitor_name || ''}</td>
                            <td>{log.discussion || ''}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
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
      <div className="mt-1 text-black">{value || '-'}</div>
    </div>
  )
}