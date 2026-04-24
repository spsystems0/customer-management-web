'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

type SidebarMode = 'guest' | 'sales'

type Company = {
  id: string
  customer_name?: string | null
  company_name?: string | null
  name?: string | null
}

type Contact = {
  id: string
  company_id?: string | null
  customer_id?: string | null
  name?: string | null
  contact_name?: string | null
}

type Visit = {
  id: string
  company_id?: string | null
  customer_id?: string | null
  contact_id?: string | null
  visitor_name?: string | null
  visitor?: string | null
  salesperson?: string | null
  sales_manager?: string | null
  visit_date?: string | null
  purpose?: string | null
  visit_purpose?: string | null
  discussion?: string | null
  follow_up_action?: string | null
}

function getCompanyName(company?: Company) {
  if (!company) return '-'
  return company.customer_name || company.company_name || company.name || '-'
}

function getContactName(contact?: Contact) {
  if (!contact) return '-'
  return contact.contact_name || contact.name || '-'
}

function getVisitorName(visit: Visit) {
  return (
    visit.visitor_name ||
    visit.visitor ||
    visit.salesperson ||
    visit.sales_manager ||
    '-'
  )
}

function getVisitPurpose(visit: Visit) {
  return visit.purpose || visit.visit_purpose || '-'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return value.slice(0, 10)
}

export default function VisitHistoryPage() {
  const router = useRouter()

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('guest')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [visits, setVisits] = useState<Visit[]>([])

  const [selectedCompanyId, setSelectedCompanyId] = useState('all')
  const [selectedContactId, setSelectedContactId] = useState('all')
  const [selectedVisitor, setSelectedVisitor] = useState('all')

  const [appliedCompanyId, setAppliedCompanyId] = useState('all')
  const [appliedContactId, setAppliedContactId] = useState('all')
  const [appliedVisitor, setAppliedVisitor] = useState('all')

  const [hasSearched, setHasSearched] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      setMessage('')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSidebarMode(session ? 'sales' : 'guest')

      const [companyRes, contactRes, visitRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, customer_name')
          .order('customer_name', { ascending: true }),

        supabase
          .from('contacts')
          .select('id, company_id, name')
          .order('print_order', { ascending: true })
          .order('name', { ascending: true }),

        supabase
          .from('visit_logs')
          .select(
            'id, company_id, contact_id, visitor_name, visit_date, purpose, discussion, follow_up_action'
          )
          .order('visit_date', { ascending: false })
          .order('id', { ascending: false }),
      ])

      const messages: string[] = []

      if (companyRes.error) {
        messages.push(`고객사 목록 조회 실패: ${companyRes.error.message}`)
      }

      if (contactRes.error) {
        messages.push(`고객담당자 목록 조회 실패: ${contactRes.error.message}`)
      }

      if (visitRes.error) {
        messages.push(`방문일지 목록 조회 실패: ${visitRes.error.message}`)
      }

      setMessage(messages.join('\n'))
      setCompanies((companyRes.data as Company[]) || [])
      setContacts((contactRes.data as Contact[]) || [])
      setVisits((visitRes.data as Visit[]) || [])
      setLoading(false)
    }

    initialize()
  }, [])

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>()
    companies.forEach((item) => {
      map.set(String(item.id), item)
    })
    return map
  }, [companies])

  const contactMap = useMemo(() => {
    const map = new Map<string, Contact>()
    contacts.forEach((item) => {
      map.set(String(item.id), item)
    })
    return map
  }, [contacts])

  const filteredContacts = useMemo(() => {
    if (selectedCompanyId === 'all') return contacts

    return contacts.filter((contact) => {
      const companyId = contact.company_id || contact.customer_id || ''
      return String(companyId) === String(selectedCompanyId)
    })
  }, [contacts, selectedCompanyId])

  useEffect(() => {
    if (selectedContactId === 'all') return

    const exists = filteredContacts.some(
      (item) => String(item.id) === String(selectedContactId)
    )

    if (!exists) {
      setSelectedContactId('all')
    }
  }, [filteredContacts, selectedContactId])

  const visitorOptions = useMemo(() => {
    const names = new Set<string>()

    visits.forEach((visit) => {
      const companyId = visit.company_id || visit.customer_id || ''
      const contactId = visit.contact_id || ''
      const visitor = getVisitorName(visit)

      if (
        selectedCompanyId !== 'all' &&
        String(companyId) !== String(selectedCompanyId)
      ) {
        return
      }

      if (
        selectedContactId !== 'all' &&
        String(contactId) !== String(selectedContactId)
      ) {
        return
      }

      if (visitor && visitor !== '-') {
        names.add(visitor)
      }
    })

    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [visits, selectedCompanyId, selectedContactId])

  useEffect(() => {
    if (selectedVisitor === 'all') return

    const exists = visitorOptions.includes(selectedVisitor)
    if (!exists) {
      setSelectedVisitor('all')
    }
  }, [visitorOptions, selectedVisitor])

  function handleSearch() {
    setAppliedCompanyId(selectedCompanyId)
    setAppliedContactId(selectedContactId)
    setAppliedVisitor(selectedVisitor)
    setHasSearched(true)
  }

  const filteredVisits = useMemo(() => {
    if (!hasSearched) return []

    let result = [...visits]

    if (appliedCompanyId !== 'all') {
      result = result.filter((visit) => {
        const companyId = visit.company_id || visit.customer_id || ''
        return String(companyId) === String(appliedCompanyId)
      })
    }

    if (appliedContactId !== 'all') {
      result = result.filter(
        (visit) => String(visit.contact_id || '') === String(appliedContactId)
      )
    }

    if (appliedVisitor !== 'all') {
      result = result.filter((visit) => getVisitorName(visit) === appliedVisitor)
    }

    result.sort((a, b) => {
      const aDate = a.visit_date || ''
      const bDate = b.visit_date || ''
      if (bDate !== aDate) return bDate.localeCompare(aDate)
      return String(b.id).localeCompare(String(a.id))
    })

    return result
  }, [visits, appliedCompanyId, appliedContactId, appliedVisitor, hasSearched])

  function handleRowClick(visit: Visit) {
    if (sidebarMode === 'guest') {
      setSelectedVisit(visit)
      setIsModalOpen(true)
      return
    }

    const companyId = visit.company_id || visit.customer_id || ''
    const contactId = visit.contact_id || ''
    const visitor = getVisitorName(visit)

    const params = new URLSearchParams()

    if (visit.id) params.set('visitId', String(visit.id))
    if (companyId) params.set('companyId', String(companyId))
    if (contactId) params.set('contactId', String(contactId))
    if (visitor && visitor !== '-') params.set('visitor', visitor)
    params.set('from', 'visit-history')

    router.push(`/visits?${params.toString()}`)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedVisit(null)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-700">불러오는 중...</p>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar mode={sidebarMode} />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <section className="rounded-3xl bg-white shadow-sm border border-slate-200 p-8">
            <h1 className="text-4xl font-bold text-slate-900">방문일지 조회</h1>
            <p className="mt-3 text-lg text-slate-600">
              고객사, 고객담당자, 영업담당자 조건으로 방문일지를 조회합니다.
            </p>
          </section>

          <section className="rounded-3xl bg-white shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">검색 조건</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  고객사
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-black bg-white"
                >
                  <option value="all">전체</option>
                  {companies.map((company) => (
                    <option key={company.id} value={String(company.id)}>
                      {getCompanyName(company)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  고객담당자
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-black bg-white"
                >
                  <option value="all">전체</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={String(contact.id)}>
                      {getContactName(contact)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  영업담당자
                </label>
                <select
                  value={selectedVisitor}
                  onChange={(e) => setSelectedVisitor(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-black bg-white"
                >
                  <option value="all">전체</option>
                  {visitorOptions.map((visitor) => (
                    <option key={visitor} value={visitor}>
                      {visitor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full rounded-2xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  조회
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">조회 결과</h2>
              <span className="text-sm text-slate-500">
                {sidebarMode === 'sales'
                  ? '행을 클릭하면 방문일지 작성 화면으로 이동합니다.'
                  : '행을 클릭하면 방문일지 상세 팝업이 열립니다.'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-3 text-center font-bold text-black">
                      고객사
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center font-bold text-black">
                      고객담당자
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center font-bold text-black">
                      방문자
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center font-bold text-black">
                      방문일자
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center font-bold text-black">
                      방문목적
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!hasSearched ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-slate-300 px-4 py-8 text-center text-slate-500"
                      >
                        검색 조건을 선택한 후 조회 버튼을 누르세요.
                      </td>
                    </tr>
                  ) : filteredVisits.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-slate-300 px-4 py-8 text-center text-slate-500"
                      >
                        조회 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((visit) => {
                      const companyId = visit.company_id || visit.customer_id || ''
                      const company = companyMap.get(String(companyId))
                      const contact = contactMap.get(String(visit.contact_id || ''))

                      return (
                        <tr
                          key={visit.id}
                          onClick={() => handleRowClick(visit)}
                          className="cursor-pointer hover:bg-blue-50 transition"
                        >
                          <td className="border border-slate-300 px-4 py-3 text-black">
                            {getCompanyName(company)}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-black">
                            {getContactName(contact)}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-black">
                            {getVisitorName(visit)}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-black">
                            {formatDate(visit.visit_date)}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-black">
                            {getVisitPurpose(visit)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {isModalOpen && selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">방문일지 상세</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100"
              >
                닫기
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadItem
                  label="고객사"
                  value={getCompanyName(
                    companyMap.get(
                      String(selectedVisit.company_id || selectedVisit.customer_id || '')
                    )
                  )}
                />
                <ReadItem
                  label="고객담당자"
                  value={getContactName(
                    contactMap.get(String(selectedVisit.contact_id || ''))
                  )}
                />
                <ReadItem label="방문자" value={getVisitorName(selectedVisit)} />
                <ReadItem label="방문일자" value={formatDate(selectedVisit.visit_date)} />
              </div>

              <ReadBlock label="방문목적" value={getVisitPurpose(selectedVisit)} />
              <ReadBlock label="상담내용" value={selectedVisit.discussion || ''} />
              <ReadBlock label="후속조치" value={selectedVisit.follow_up_action || ''} />
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReadItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-black whitespace-pre-wrap">{value || '-'}</div>
    </div>
  )
}

function ReadBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
        {label}
      </div>
      <div className="min-h-[96px] whitespace-pre-wrap px-4 py-4 text-black">
        {value || '-'}
      </div>
    </div>
  )
}