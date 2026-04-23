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

type VisitOption = {
  id: number
  label: string
}

export default function VisitsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [visitOptions, setVisitOptions] = useState<VisitOption[]>([])

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [selectedLoadCompanyId, setSelectedLoadCompanyId] = useState('')
  const [selectedVisitId, setSelectedVisitId] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [discussion, setDiscussion] = useState('')
  const [followUpAction, setFollowUpAction] = useState('')

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        window.location.href = '/login'
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
    const fetchContactsByCompany = async () => {
      setContacts([])
      setSelectedContactId('')

      if (!selectedCompanyId) return

      const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('company_id', Number(selectedCompanyId))
        .order('print_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        setMessage(`담당자 목록 조회 실패: ${error.message}`)
        return
      }

      setContacts(data || [])
    }

    fetchContactsByCompany()
  }, [selectedCompanyId])

  useEffect(() => {
    const fetchVisitOptions = async () => {
      setVisitOptions([])
      setSelectedVisitId('')

      if (!selectedLoadCompanyId) return

      const { data, error } = await supabase
        .from('visit_logs')
        .select('id, visit_date, purpose')
        .eq('company_id', Number(selectedLoadCompanyId))
        .order('visit_date', { ascending: false })
        .order('id', { ascending: false })

      if (error) {
        setMessage(`방문일지 목록 조회 실패: ${error.message}`)
        return
      }

      const formatted: VisitOption[] = (data || []).map((item) => ({
        id: item.id,
        label: `${item.visit_date || ''} / ${item.purpose || '방문일지'}`,
      }))

      setVisitOptions(formatted)
    }

    fetchVisitOptions()
  }, [selectedLoadCompanyId])

  const resetForm = () => {
    setEditingId(null)
    setSelectedVisitId('')
    setSelectedCompanyId('')
    setSelectedContactId('')
    setVisitorName('')
    setVisitDate('')
    setPurpose('')
    setDiscussion('')
    setFollowUpAction('')
    setContacts([])
    setMessage('')
  }

  const handleNewEntry = () => {
    resetForm()
    setSelectedCompanyId(selectedLoadCompanyId || '')
  }

  const handleLoadVisit = async () => {
    setMessage('')

    if (!selectedLoadCompanyId) {
      setMessage('고객사를 선택해 주세요.')
      return
    }

    if (!selectedVisitId) {
      setMessage('방문일지를 선택해 주세요.')
      return
    }

    const { data, error } = await supabase
      .from('visit_logs')
      .select(`
        id,
        company_id,
        contact_id,
        visitor_name,
        visit_date,
        purpose,
        discussion,
        follow_up_action
      `)
      .eq('id', Number(selectedVisitId))
      .single()

    if (error || !data) {
      setMessage(`방문일지 불러오기 실패: ${error?.message || '데이터 없음'}`)
      return
    }

    setEditingId(data.id)
    setSelectedCompanyId(String(data.company_id))
    setVisitorName(data.visitor_name || '')
    setVisitDate(data.visit_date || '')
    setPurpose(data.purpose || '')
    setDiscussion(data.discussion || '')
    setFollowUpAction(data.follow_up_action || '')

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('company_id', Number(data.company_id))
      .order('print_order', { ascending: true })
      .order('name', { ascending: true })

    if (contactError) {
      setMessage(`담당자 목록 조회 실패: ${contactError.message}`)
      return
    }

    setContacts(contactData || [])
    setSelectedContactId(data.contact_id ? String(data.contact_id) : '')
    setMessage('방문일지를 불러왔습니다.')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!selectedCompanyId) {
      setMessage('고객사를 선택해 주세요.')
      return
    }

    if (!visitDate) {
      setMessage('방문일자를 입력해 주세요.')
      return
    }

    const payload = {
      company_id: Number(selectedCompanyId),
      contact_id: selectedContactId ? Number(selectedContactId) : null,
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

    setSelectedLoadCompanyId(selectedCompanyId)

    const { data: visitData, error: visitError } = await supabase
      .from('visit_logs')
      .select('id, visit_date, purpose')
      .eq('company_id', Number(selectedCompanyId))
      .order('visit_date', { ascending: false })
      .order('id', { ascending: false })

    if (!visitError) {
      const formatted: VisitOption[] = (visitData || []).map((item) => ({
        id: item.id,
        label: `${item.visit_date || ''} / ${item.purpose || '방문일지'}`,
      }))
      setVisitOptions(formatted)
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

    const currentCompanyId = selectedCompanyId

    resetForm()
    setSelectedLoadCompanyId(currentCompanyId)

    const { data: visitData, error: visitError } = await supabase
      .from('visit_logs')
      .select('id, visit_date, purpose')
      .eq('company_id', Number(currentCompanyId))
      .order('visit_date', { ascending: false })
      .order('id', { ascending: false })

    if (!visitError) {
      const formatted: VisitOption[] = (visitData || []).map((item) => ({
        id: item.id,
        label: `${item.visit_date || ''} / ${item.purpose || '방문일지'}`,
      }))
      setVisitOptions(formatted)
    }

    setMessage('방문일지가 삭제되었습니다.')
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
          <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-slate-800">
              방문일지 등록 / 수정 / 삭제
            </h1>
            <p className="mt-2 text-slate-600">
              고객사와 방문일지를 선택해 기존 정보를 불러오거나 신규 등록할 수
              있습니다.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                방문일지 불러오기
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
                <select
                  value={selectedLoadCompanyId}
                  onChange={(e) => setSelectedLoadCompanyId(e.target.value)}
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
                >
                  <option value="">방문일지를 선택하세요</option>
                  {visitOptions.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.label}
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
                  onClick={handleNewEntry}
                  className="rounded-xl bg-slate-500 px-6 py-3 font-medium text-white hover:bg-slate-600"
                >
                  신규입력
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="방문목적"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <textarea
                value={discussion}
                onChange={(e) => setDiscussion(e.target.value)}
                placeholder="상담내용"
                className="min-h-[140px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <textarea
                value={followUpAction}
                onChange={(e) => setFollowUpAction(e.target.value)}
                placeholder="후속조치"
                className="min-h-[140px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
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
              </div>

              {message && (
                <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
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