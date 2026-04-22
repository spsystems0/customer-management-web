'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

type SidebarMode = 'guest' | 'sales'

type Company = {
  id: number
  customer_name: string
}

type Contact = {
  id: number
  company_id: number
  name: string
  position: string | null
  work_location: string | null
  department: string | null
  phone: string | null
  email: string | null
  main_role: string | null
  work_location_detail: string | null
  address: string | null
  birth_date: string | null
  marital_status: string | null
  family_relation: string | null
  education: string | null
  school_name: string | null
  hobby: string | null
  gender: string | null
  special_notes: string | null
  sensitive_info_print: boolean | null
}

type VisitLog = {
  id: number
  visit_date: string | null
  purpose: string | null
  discussion: string | null
  visitor_name: string | null
}

export default function CustomerCardsPage() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('guest')

  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSidebarMode(session ? 'sales' : 'guest')

      const { data, error } = await supabase
        .from('companies')
        .select('id, customer_name')
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

  useEffect(() => {
    const loadContacts = async () => {
      setSelectedContactId('')
      setSelectedContact(null)
      setVisitLogs([])
      setMessage('')

      if (!selectedCompanyId) {
        setContacts([])
        return
      }

      setLoadingContacts(true)

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          company_id,
          name,
          position,
          work_location,
          department,
          phone,
          email,
          main_role,
          work_location_detail,
          address,
          birth_date,
          marital_status,
          family_relation,
          education,
          school_name,
          hobby,
          gender,
          special_notes,
          sensitive_info_print
        `)
        .eq('company_id', Number(selectedCompanyId))
        .order('name', { ascending: true })

      if (error) {
        setMessage(`담당자 목록 조회 실패: ${error.message}`)
        setContacts([])
        setLoadingContacts(false)
        return
      }

      setContacts(data || [])
      setLoadingContacts(false)
    }

    loadContacts()
  }, [selectedCompanyId])

  const handleSearch = async () => {
    setMessage('')
    setSelectedContact(null)
    setVisitLogs([])

    if (!selectedCompanyId) {
      setMessage('고객사를 선택해 주세요.')
      return
    }

    if (!selectedContactId) {
      setMessage('담당자를 선택해 주세요.')
      return
    }

    const contact = contacts.find(
      (item) => String(item.id) === String(selectedContactId)
    )

    if (!contact) {
      setMessage('선택한 담당자 정보를 찾을 수 없습니다.')
      return
    }

    setSelectedContact(contact)

    const { data: visitData, error: visitError } = await supabase
      .from('visit_logs')
      .select('id, visit_date, purpose, discussion, visitor_name')
      .eq('company_id', Number(selectedCompanyId))
      .eq('contact_id', Number(selectedContactId))
      .order('visit_date', { ascending: false })
      .limit(50)

    if (visitError) {
      setMessage(`방문이력 조회 실패: ${visitError.message}`)
      return
    }

    setVisitLogs(visitData || [])
  }

  const handlePrint = () => {
    if (!selectedContact) {
      alert('먼저 고객사와 담당자를 조회해 주세요.')
      return
    }

    window.print()
  }

  const selectedCompanyName =
    companies.find((item) => String(item.id) === String(selectedCompanyId))
      ?.customer_name || ''

  const showSensitive = !!selectedContact?.sensitive_info_print

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar mode={sidebarMode} />

        <section className="flex-1 px-6 py-10">
          <div className="print-area mx-auto max-w-6xl space-y-6">
            <div className="screen-report-wrap rounded-2xl bg-white p-8 shadow print-hide">
              <h1 className="text-2xl font-bold text-black">고객관리카드 조회</h1>
              <p className="mt-2 text-black">
                고객사와 담당자를 선택하여 고객관리카드를 조회하고 출력합니다.
              </p>

              {loading ? (
                <div className="mt-6 text-black">목록 불러오는 중...</div>
              ) : (
                <>
                  <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
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

                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                      disabled={!selectedCompanyId || loadingContacts}
                    >
                      <option value="">
                        {loadingContacts
                          ? '담당자 불러오는 중...'
                          : '담당자를 선택하세요'}
                      </option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleSearch}
                      className="rounded-xl bg-emerald-700 px-6 py-3 font-medium text-white hover:bg-emerald-800"
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

            {selectedContact && (
              <div className="screen-report-wrap rounded-2xl bg-white p-8 shadow print-hide">
                <h2 className="text-xl font-bold text-black">고객관리카드 미리보기</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoItem label="회사명" value={selectedCompanyName} />
                  <InfoItem label="고객성명" value={selectedContact.name} />
                  <InfoItem label="근무지" value={selectedContact.work_location} />
                  <InfoItem label="직위" value={selectedContact.position} />
                  <InfoItem label="소속" value={selectedContact.department} />
                  <InfoItem label="전화번호" value={selectedContact.phone} />
                  <InfoItem label="부서" value={selectedContact.department} />
                  <InfoItem label="휴대폰" value={selectedContact.phone} />
                  <InfoItem label="E-Mail" value={selectedContact.email} />
                  <InfoItem
                    label="근무지(상세)"
                    value={selectedContact.work_location_detail}
                  />
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-bold text-black">민감정보</h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <InfoItem
                      label="생년월일"
                      value={showSensitive ? selectedContact.birth_date : ''}
                    />
                    <InfoItem
                      label="성별"
                      value={showSensitive ? selectedContact.gender : ''}
                    />
                    <InfoItem
                      label="결혼유무"
                      value={showSensitive ? selectedContact.marital_status : ''}
                    />
                    <InfoItem
                      label="가족관계"
                      value={showSensitive ? selectedContact.family_relation : ''}
                    />
                    <InfoItem
                      label="학력사항"
                      value={showSensitive ? selectedContact.education : ''}
                    />
                    <InfoItem
                      label="최종졸업학교"
                      value={showSensitive ? selectedContact.school_name : ''}
                    />
                    <InfoItem
                      label="기타"
                      value={showSensitive ? selectedContact.hobby : ''}
                    />
                    <InfoItem
                      label="취미"
                      value={showSensitive ? selectedContact.hobby : ''}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-medium text-slate-700">
                      특이사항 및 주요내용
                    </div>
                    <div className="mt-2 min-h-[220px] whitespace-pre-wrap rounded-xl border border-slate-200 bg-white px-4 py-4 text-black">
                      {showSensitive ? selectedContact.special_notes || '' : ''}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="text-sm font-medium text-slate-700">방문 이력</div>

                    {visitLogs.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-4 text-black">
                        등록된 방문이력이 없습니다.
                      </div>
                    ) : (
                      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-full table-fixed border-collapse text-sm text-black">
                          <colgroup>
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '76%' }} />
                          </colgroup>
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="border border-slate-200 px-3 py-2 text-left">
                                방문일자
                              </th>
                              <th className="border border-slate-200 px-3 py-2 text-left">
                                방문자
                              </th>
                              <th className="border border-slate-200 px-3 py-2 text-left">
                                주요내용
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {visitLogs.map((log) => (
                              <tr key={log.id}>
                                <td className="border border-slate-200 px-3 py-2">
                                  {log.visit_date || ''}
                                </td>
                                <td className="border border-slate-200 px-3 py-2">
                                  {log.visitor_name || ''}
                                </td>
                                <td className="border border-slate-200 px-3 py-2 whitespace-pre-wrap">
                                  {log.discussion || ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedContact && (
              <div className="print-customer-card">
                <div className="customer-print-sheet">
                  <div className="customer-print-title">고객 관리 카드</div>

                  <table className="customer-print-main-table">
                    <colgroup>
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '29%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th className="customer-print-label">회 사 명</th>
                        <td>{selectedCompanyName || ''}</td>
                        <th className="customer-print-label">고 객 성 명</th>
                        <td>{selectedContact.name || ''}</td>
                        <td colSpan={2} rowSpan={5}></td>
                      </tr>
                      <tr>
                        <th className="customer-print-label">근 무 지</th>
                        <td>{selectedContact.work_location || ''}</td>
                        <th className="customer-print-label">직 위</th>
                        <td>{selectedContact.position || ''}</td>
                      </tr>
                      <tr>
                        <th className="customer-print-label">소 속</th>
                        <td>{selectedContact.department || ''}</td>
                        <th className="customer-print-label">전화번호</th>
                        <td>{selectedContact.phone || ''}</td>
                      </tr>
                      <tr>
                        <th className="customer-print-label">부 서</th>
                        <td>{selectedContact.department || ''}</td>
                        <th className="customer-print-label">휴 대 폰</th>
                        <td>{selectedContact.phone || ''}</td>
                      </tr>
                      <tr>
                        <th className="customer-print-label">E - Mail</th>
                        <td>{selectedContact.email || ''}</td>
                        <th className="customer-print-label">Fax 번호</th>
                        <td></td>
                      </tr>
                      <tr>
                        <th className="customer-print-label">담당업무</th>
                        <td>{selectedContact.main_role || ''}</td>
                        <th className="customer-print-label">근무지(상세)</th>
                        <td colSpan={3}>{selectedContact.work_location_detail || ''}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="customer-print-sensitive-table">
                    <colgroup>
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th className="customer-print-label" rowSpan={4}>
                          고객인적사항
                        </th>
                        <th className="customer-print-sub-label">생 년 월 일</th>
                        <td>{showSensitive ? selectedContact.birth_date || '' : ''}</td>
                        <th className="customer-print-sub-label">성별</th>
                        <td colSpan={3}>{showSensitive ? selectedContact.gender || '' : ''}</td>
                      </tr>
                      <tr>
                        <th className="customer-print-sub-label">결 혼 유 무</th>
                        <td>
                          {showSensitive ? selectedContact.marital_status || '' : ''}
                        </td>
                        <th className="customer-print-sub-label">가 족 관 계</th>
                        <td colSpan={3}>
                          {showSensitive ? selectedContact.family_relation || '' : ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="customer-print-sub-label">학 력 사 항</th>
                        <td>{showSensitive ? selectedContact.education || '' : ''}</td>
                        <th className="customer-print-sub-label">최종졸업학교</th>
                        <td colSpan={3}>
                          {showSensitive ? selectedContact.school_name || '' : ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="customer-print-sub-label">기 타</th>
                        <td>{showSensitive ? selectedContact.hobby || '' : ''}</td>
                        <th className="customer-print-sub-label">취 미</th>
                        <td colSpan={3}>{showSensitive ? selectedContact.hobby || '' : ''}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="customer-print-notes-table">
                    <colgroup>
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '88%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th className="customer-print-label notes-label">
                          특 이 사 항
                          <br />
                          및
                          <br />
                          주 요 내 용
                        </th>
                        <td className="notes-cell">
                          <div className="notes-content">
                            {showSensitive ? selectedContact.special_notes || '' : ''}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="customer-print-visit-block-table">
                    <colgroup>
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '64%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th
                          className="customer-print-label"
                          rowSpan={visitLogs.length > 0 ? visitLogs.length + 1 : 2}
                        >
                          방 문 이 력
                        </th>
                        <th className="customer-print-sub-label">방문일자</th>
                        <th className="customer-print-sub-label">방문자</th>
                        <th className="customer-print-sub-label">주요 내용</th>
                      </tr>

                      {visitLogs.length > 0 ? (
                        visitLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{log.visit_date || ''}</td>
                            <td>{log.visitor_name || ''}</td>
                            <td className="customer-print-multiline">
                              {log.discussion || ''}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <table className="customer-print-notes-table">
                    <colgroup>
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '88%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th className="customer-print-label">비고</th>
                        <td className="notes-cell"></td>
                      </tr>
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