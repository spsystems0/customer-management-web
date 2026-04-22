'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

type Company = {
  id: number
  customer_name: string
}

type Contact = {
  id: number
  name: string
}

type VisitLog = {
  id: number
  company_id: number
  contact_id: number | null
  visitor_name: string | null
  visit_date: string | null
  purpose: string | null
  discussion: string | null
  follow_up_action: string | null
}

export default function VisitsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [loadingVisitLogs, setLoadingVisitLogs] = useState(false)

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedVisitId, setSelectedVisitId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [companyId, setCompanyId] = useState('')
  const [contactId, setContactId] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [discussion, setDiscussion] = useState('')
  const [followUpAction, setFollowUpAction] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
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

      setCompanies(data || [])
      setLoading(false)
    }

    initialize()
  }, [])

  useEffect(() => {
    const loadContactsAndVisits = async () => {
      setSelectedVisitId('')
      setVisitLogs([])
      setContacts([])

      if (!selectedCompanyId) {
        return
      }

      setLoadingContacts(true)
      setLoadingVisitLogs(true)

      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('company_id', Number(selectedCompanyId))
        .order('name', { ascending: true })

      if (contactError) {
        setMessage(`담당자 목록 조회 실패: ${contactError.message}`)
      } else {
        setContacts(contactData || [])
      }

      setLoadingContacts(false)

      const { data: visitData, error: visitError } = await supabase
        .from('visit_logs')
        .select(
          'id, company_id, contact_id, visitor_name, visit_date, purpose, discussion, follow_up_action'
        )
        .eq('company_id', Number(selectedCompanyId))
        .order('visit_date', { ascending: false })

      if (visitError) {
        setMessage(`방문일지 목록 조회 실패: ${visitError.message}`)
      } else {
        setVisitLogs(visitData || [])
      }

      setLoadingVisitLogs(false)
    }

    loadContactsAndVisits()
  }, [selectedCompanyId])

  const resetForm = () => {
    setSelectedCompanyId('')
    setSelectedVisitId('')
    setEditingId(null)
    setCompanyId('')
    setContactId('')
    setVisitorName('')
    setVisitDate('')
    setPurpose('')
    setDiscussion('')
    setFollowUpAction('')
    setContacts([])
    setVisitLogs([])
    setMessage('')
  }

  const handleLoadVisit = () => {
    setMessage('')

    if (!selectedVisitId) {
      setMessage('불러올 방문일지를 선택해 주세요.')
      return
    }

    const visit = visitLogs.find(
      (item) => String(item.id) === String(selectedVisitId)
    )

    if (!visit) {
      setMessage('선택한 방문일지 정보를 찾을 수 없습니다.')
      return
    }

    setEditingId(visit.id)
    setCompanyId(String(visit.company_id))
    setContactId(visit.contact_id !== null ? String(visit.contact_id) : '')
    setVisitorName(visit.visitor_name || '')
    setVisitDate(visit.visit_date || '')
    setPurpose(visit.purpose || '')
    setDiscussion(visit.discussion || '')
    setFollowUpAction(visit.follow_up_action || '')
    setMessage('방문일지 정보를 불러왔습니다.')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!companyId) {
      setMessage('고객사를 선택해 주세요.')
      return
    }

    const payload = {
      company_id: Number(companyId),
      contact_id: contactId ? Number(contactId) : null,
      visitor_name: visitorName || null,
      visit_date: visitDate || null,
      purpose: purpose || null,
      discussion: discussion || null,
      follow_up_action: followUpAction || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('visit_logs')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        setMessage(`수정 실패: ${error.message}`)
        return
      }

      setMessage('방문일지가 수정되었습니다.')
    } else {
      const { error } = await supabase.from('visit_logs').insert([payload])

      if (error) {
        setMessage(`저장 실패: ${error.message}`)
        return
      }

      setMessage('방문일지가 저장되었습니다.')
    }

    if (selectedCompanyId) {
      const { data } = await supabase
        .from('visit_logs')
        .select(
          'id, company_id, contact_id, visitor_name, visit_date, purpose, discussion, follow_up_action'
        )
        .eq('company_id', Number(selectedCompanyId))
        .order('visit_date', { ascending: false })

      setVisitLogs(data || [])
    }
  }

  const handleDelete = async () => {
    setMessage('')

    if (!editingId) {
      setMessage('삭제할 방문일지를 먼저 불러와 주세요.')
      return
    }

    const confirmed = window.confirm('선택한 방문일지를 삭제하시겠습니까?')
    if (!confirmed) return

    const { error } = await supabase
      .from('visit_logs')
      .delete()
      .eq('id', editingId)

    if (error) {
      setMessage(`삭제 실패: ${error.message}`)
      return
    }

    setMessage('방문일지가 삭제되었습니다.')

    if (selectedCompanyId) {
      const { data } = await supabase
        .from('visit_logs')
        .select(
          'id, company_id, contact_id, visitor_name, visit_date, purpose, discussion, follow_up_action'
        )
        .eq('company_id', Number(selectedCompanyId))
        .order('visit_date', { ascending: false })

      setVisitLogs(data || [])
    }

    setEditingId(null)
    setSelectedVisitId('')
    setCompanyId('')
    setContactId('')
    setVisitorName('')
    setVisitDate('')
    setPurpose('')
    setDiscussion('')
    setFollowUpAction('')
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
          <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-slate-800">
              방문일지 등록 / 수정 / 삭제
            </h1>
            <p className="mt-2 text-slate-600">
              고객사와 방문일지를 선택해 기존 정보를 불러오거나 신규 등록할 수 있습니다.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                방문일지 불러오기
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
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
                  value={selectedVisitId}
                  onChange={(e) => setSelectedVisitId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                  disabled={!selectedCompanyId || loadingVisitLogs}
                >
                  <option value="">
                    {loadingVisitLogs
                      ? '방문일지 불러오는 중...'
                      : '방문일지를 선택하세요'}
                  </option>
                  {visitLogs.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {(visit.visit_date || '날짜없음') +
                        ' / ' +
                        (visit.purpose || '목적없음')}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLoadVisit}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
                >
                  불러오기
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl bg-slate-500 px-6 py-3 font-medium text-white hover:bg-slate-600"
                >
                  신규입력
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                required
              >
                <option value="">고객사를 선택하세요 *</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.customer_name}
                  </option>
                ))}
              </select>

              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
              >
                <option value="">담당자를 선택하세요</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>

              <input
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="방문자(영업담당자)"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
              />

              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="방문목적"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500 md:col-span-2"
              />

              <textarea
                value={discussion}
                onChange={(e) => setDiscussion(e.target.value)}
                placeholder="상담내용"
                className="min-h-[140px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500 md:col-span-2"
              />

              <textarea
                value={followUpAction}
                onChange={(e) => setFollowUpAction(e.target.value)}
                placeholder="후속조치"
                className="min-h-[140px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500 md:col-span-2"
              />

              <div className="md:col-span-2 mt-4 flex gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 px-6 py-3 font-medium text-white hover:bg-amber-800"
                >
                  {editingId ? '수정 저장' : '신규 저장'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
                >
                  삭제
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl bg-slate-500 px-6 py-3 font-medium text-white hover:bg-slate-600"
                >
                  초기화
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/dashboard'
                  }}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
                >
                  대시보드로 이동
                </button>
              </div>

              {message && (
                <div className="md:col-span-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}