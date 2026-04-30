'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

function sortContactsForDisplay(items: ContactRow[]) {
  return [...items].sort((a, b) => {
    const aOrder = a.print_order ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.print_order ?? Number.MAX_SAFE_INTEGER

    if (aOrder !== bOrder) return aOrder - bOrder

    return (a.name || '').localeCompare(b.name || '', 'ko')
  })
}

function resequenceContacts(items: ContactRow[]) {
  return sortContactsForDisplay(items).map((item, index) => ({
    ...item,
    print_order: index + 1,
  }))
}

function moveContactToOrder(
  items: ContactRow[],
  contactId: number,
  targetOrder: number
) {
  const orderedItems = resequenceContacts(items)
  const currentIndex = orderedItems.findIndex((item) => item.id === contactId)

  if (currentIndex === -1) return orderedItems

  const maxOrder = orderedItems.length
  const safeTargetOrder = Math.min(Math.max(targetOrder, 1), maxOrder)
  const targetIndex = safeTargetOrder - 1

  const nextItems = [...orderedItems]
  const [movedItem] = nextItems.splice(currentIndex, 1)

  nextItems.splice(targetIndex, 0, movedItem)

  return nextItems.map((item, index) => ({
    ...item,
    print_order: index + 1,
  }))
}

export default function ContactPrintOrderPage() {
  const companyDropdownRef = useRef<HTMLDivElement | null>(null)

  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [companySearchText, setCompanySearchText] = useState('')
  const [showCompanyList, setShowCompanyList] = useState(false)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [message, setMessage] = useState('')

  const loadContactsByCompanyId = async (companyId: string) => {
    if (!companyId) {
      setContacts([])
      return
    }

    setLoadingContacts(true)
    setMessage('')

    const { data, error } = await supabase
      .from('contacts')
      .select(
        'id, company_id, name, department, position, phone, email, print_order'
      )
      .eq('company_id', Number(companyId))
      .order('print_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      setMessage(`담당자 목록 조회 실패: ${error.message}`)
      setContacts([])
      setLoadingContacts(false)
      return
    }

    setContacts((data || []) as ContactRow[])
    setLoadingContacts(false)
  }

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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target as Node)
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
    if (!selectedCompanyId) {
      setContacts([])
      return
    }

    loadContactsByCompanyId(selectedCompanyId)
  }, [selectedCompanyId])

  const filteredCompanies = useMemo(() => {
    const keyword = companySearchText.trim().toLowerCase()

    if (!keyword) return companies

    return companies.filter((company) =>
      company.customer_name.toLowerCase().includes(keyword)
    )
  }, [companies, companySearchText])

  const orderedContacts = useMemo(() => {
    return sortContactsForDisplay(contacts)
  }, [contacts])

  const handleCompanyInputChange = (value: string) => {
    setCompanySearchText(value)
    setShowCompanyList(true)
    setMessage('')

    const searchText = value.trim().toLowerCase()

    if (!searchText) {
      setSelectedCompanyId('')
      setContacts([])
      return
    }

    const matchedCompany = companies.find(
      (company) => company.customer_name.trim().toLowerCase() === searchText
    )

    if (matchedCompany) {
      const matchedCompanyId = String(matchedCompany.id)

      if (matchedCompanyId !== selectedCompanyId) {
        setSelectedCompanyId(matchedCompanyId)
      }
    } else {
      setSelectedCompanyId('')
      setContacts([])
    }
  }

  const handleCompanySelect = async (company: Company) => {
    const nextCompanyId = String(company.id)

    setCompanySearchText(company.customer_name)
    setShowCompanyList(false)
    setMessage('')

    if (nextCompanyId === selectedCompanyId) {
      if (contacts.length === 0) {
        await loadContactsByCompanyId(nextCompanyId)
      }
      return
    }

    setSelectedCompanyId(nextCompanyId)
  }

  const updatePrintOrder = (id: number, value: string) => {
    if (value === '') {
      setContacts((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                print_order: null,
              }
            : item
        )
      )
      return
    }

    const numericValue = Number(value)

    if (Number.isNaN(numericValue) || numericValue < 1) return

    setContacts((prev) => moveContactToOrder(prev, id, numericValue))
  }

  const applyAutoOrder = () => {
    if (contacts.length === 0) {
      setMessage('자동순번을 입력할 담당자 정보가 없습니다.')
      return
    }

    setContacts((prev) => resequenceContacts(prev))
    setMessage('현재 목록 순서대로 출력순서가 자동 입력되었습니다.')
  }

  const handleSave = async () => {
    setMessage('')

    if (!selectedCompanyId) {
      setMessage('고객사를 목록에서 선택해 주세요.')
      return
    }

    if (contacts.length === 0) {
      setMessage('저장할 담당자 정보가 없습니다.')
      return
    }

    const orderedItems = resequenceContacts(contacts)

    for (const item of orderedItems) {
      const { error } = await supabase
        .from('contacts')
        .update({
          print_order: item.print_order,
        })
        .eq('id', item.id)

      if (error) {
        setMessage(`저장 실패: ${error.message}`)
        return
      }
    }

    setContacts(orderedItems)

    alert('수정 내용이 저장되었습니다.')
    setMessage('담당자 출력순서가 저장되었습니다.')
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
              담당자 출력순서 관리
            </h1>

            <p className="mt-2 text-slate-600">
              고객사를 검색하여 선택한 뒤, 담당자 출력순서를 관리할 수
              있습니다.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <div ref={companyDropdownRef} className="relative">
                <input
                  type="text"
                  value={companySearchText}
                  onChange={(e) => handleCompanyInputChange(e.target.value)}
                  onFocus={() => setShowCompanyList(true)}
                  placeholder="고객사를 선택하세요"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
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
                          className={`block w-full px-4 py-3 text-left text-black hover:bg-blue-50 ${
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

              <button
                type="button"
                onClick={applyAutoOrder}
                disabled={!selectedCompanyId || contacts.length === 0}
                className="rounded-xl bg-slate-600 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                자동순번입력
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!selectedCompanyId || contacts.length === 0}
                className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                저장
              </button>
            </div>

            {message && (
              <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                담당자 목록
              </h2>

              {loadingContacts ? (
                <p className="mt-4 text-slate-700">
                  담당자 목록을 불러오는 중...
                </p>
              ) : !selectedCompanyId ? (
                <p className="mt-4 text-slate-700">
                  고객사를 검색하여 선택해 주세요.
                </p>
              ) : orderedContacts.length === 0 ? (
                <p className="mt-4 text-slate-700">
                  선택한 고객사의 담당자가 없습니다.
                </p>
              ) : (
                <div className="mt-4 w-full overflow-hidden">
                  <table className="w-full table-fixed border-collapse border border-slate-300 text-xs">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '36%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>

                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-300 px-2 py-2 text-left font-bold text-black">
                          이름
                        </th>

                        <th className="border border-slate-300 px-2 py-2 text-left font-bold text-black">
                          부서
                        </th>

                        <th className="border border-slate-300 px-2 py-2 text-left font-bold text-black">
                          직급
                        </th>

                        <th className="border border-slate-300 px-2 py-2 text-left font-bold text-black">
                          연락처
                        </th>

                        <th className="border border-slate-300 px-2 py-2 text-left font-bold text-black">
                          이메일
                        </th>

                        <th className="border border-slate-300 px-2 py-2 text-center font-bold text-black">
                          출력순서
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {orderedContacts.map((item) => (
                        <tr key={item.id}>
                          <td className="break-keep border border-slate-300 px-2 py-2 text-black">
                            {item.name}
                          </td>

                          <td className="break-words border border-slate-300 px-2 py-2 text-black">
                            {item.department || ''}
                          </td>

                          <td className="break-keep border border-slate-300 px-2 py-2 text-black">
                            {item.position || ''}
                          </td>

                          <td className="break-words border border-slate-300 px-2 py-2 text-black">
                            {item.phone || ''}
                          </td>

                          <td className="break-all border border-slate-300 px-2 py-2 text-black">
                            {item.email || ''}
                          </td>

                          <td className="border border-slate-300 px-2 py-2 text-center text-black">
                            <input
                              type="number"
                              min="1"
                              max={orderedContacts.length}
                              value={item.print_order ?? ''}
                              onChange={(e) =>
                                updatePrintOrder(item.id, e.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-black"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="mt-3 text-sm text-slate-500">
                    예: 8번 담당자의 출력순서를 1로 변경하면, 기존 1~7번은
                    자동으로 한 칸씩 뒤로 이동합니다.
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