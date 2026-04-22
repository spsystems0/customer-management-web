'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

type Company = {
  id: number
  customer_name: string
}

type ContactRow = {
  id: number
  company_id: number
  name: string
  department: string | null
  position: string | null
  phone: string | null
  email: string | null
  print_order: number | null
}

export default function ContactPrintOrderPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
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
    const loadContacts = async () => {
      setContacts([])
      setMessage('')

      if (!selectedCompanyId) return

      setLoadingContacts(true)

      const { data, error } = await supabase
        .from('contacts')
        .select('id, company_id, name, department, position, phone, email, print_order')
        .eq('company_id', Number(selectedCompanyId))
        .order('print_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        setMessage(`담당자 목록 조회 실패: ${error.message}`)
        setLoadingContacts(false)
        return
      }

      setContacts(data || [])
      setLoadingContacts(false)
    }

    loadContacts()
  }, [selectedCompanyId])

  const updatePrintOrder = (id: number, value: string) => {
    setContacts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              print_order: value === '' ? null : Number(value),
            }
          : item
      )
    )
  }

  const applyAutoOrder = () => {
    setContacts((prev) =>
      prev.map((item, index) => ({
        ...item,
        print_order: index + 1,
      }))
    )
    setMessage('현재 목록 순서대로 출력순서가 자동 입력되었습니다.')
  }

  const handleSave = async () => {
    setMessage('')

    if (!selectedCompanyId) {
      setMessage('고객사를 선택해 주세요.')
      return
    }

    if (contacts.length === 0) {
      setMessage('저장할 담당자 정보가 없습니다.')
      return
    }

    const values = contacts
      .map((item) => item.print_order)
      .filter((value): value is number => value !== null)

    const uniqueValues = new Set(values)

    if (values.length !== uniqueValues.size) {
      alert('출력순서가 중복되었습니다. 중복 없이 입력해 주세요.')
      setMessage('출력순서가 중복되었습니다.')
      return
    }

    for (const item of contacts) {
      const { error } = await supabase
        .from('contacts')
        .update({
          print_order: item.print_order ?? 999,
        })
        .eq('id', item.id)

      if (error) {
        setMessage(`저장 실패: ${error.message}`)
        return
      }
    }

    setMessage('담당자 출력순서가 저장되었습니다.')

    const { data, error } = await supabase
      .from('contacts')
      .select('id, company_id, name, department, position, phone, email, print_order')
      .eq('company_id', Number(selectedCompanyId))
      .order('print_order', { ascending: true })
      .order('name', { ascending: true })

    if (!error) {
      setContacts(data || [])
    }
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
            <h1 className="text-2xl font-bold text-slate-800">담당자 출력순서 관리</h1>
            <p className="mt-2 text-slate-600">
              고객사를 선택하면 해당 고객사의 담당자 목록이 나오며, 출력순서를 직접 입력하여 저장할 수 있습니다.
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
                onClick={applyAutoOrder}
                className="rounded-xl bg-slate-600 px-6 py-3 font-medium text-white hover:bg-slate-700"
              >
                자동순번입력
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
              >
                저장
              </button>
            </div>

            {message && (
              <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-800">담당자 목록</h2>

              {loadingContacts ? (
                <p className="mt-4 text-slate-700">담당자 목록을 불러오는 중...</p>
              ) : contacts.length === 0 ? (
                <p className="mt-4 text-slate-700">선택한 고객사의 담당자가 없습니다.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border border-slate-300 text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border px-3 py-2 text-left text-black">이름</th>
                        <th className="border px-3 py-2 text-left text-black">부서</th>
                        <th className="border px-3 py-2 text-left text-black">직급</th>
                        <th className="border px-3 py-2 text-left text-black">연락처</th>
                        <th className="border px-3 py-2 text-left text-black">이메일</th>
                        <th className="border px-3 py-2 text-left text-black">출력순서</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((item) => (
                        <tr key={item.id}>
                          <td className="border px-3 py-2 text-black">{item.name}</td>
                          <td className="border px-3 py-2 text-black">{item.department || ''}</td>
                          <td className="border px-3 py-2 text-black">{item.position || ''}</td>
                          <td className="border px-3 py-2 text-black">{item.phone || ''}</td>
                          <td className="border px-3 py-2 text-black">{item.email || ''}</td>
                          <td className="border px-3 py-2 text-black">
                            <input
                              type="number"
                              min="1"
                              value={item.print_order ?? ''}
                              onChange={(e) => updatePrintOrder(item.id, e.target.value)}
                              className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
                            />
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