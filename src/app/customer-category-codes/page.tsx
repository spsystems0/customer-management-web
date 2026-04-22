'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

type CategoryCode = {
  id: number
  code: string
  code_name: string
  sort_order: number | null
  is_active: boolean | null
}

export default function CustomerCategoryCodesPage() {
  const [codes, setCodes] = useState<CategoryCode[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)

  const [selectedCodeId, setSelectedCodeId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [code, setCode] = useState('')
  const [codeName, setCodeName] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [isActive, setIsActive] = useState(true)
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

      await fetchCodes()
      setLoading(false)
    }

    initialize()
  }, [])

  const fetchCodes = async () => {
    setLoadingList(true)

    const { data, error } = await supabase
      .from('customer_category_codes')
      .select('id, code, code_name, sort_order, is_active')
      .order('sort_order', { ascending: true })

    if (error) {
      setMessage(`고객분류코드 목록 조회 실패: ${error.message}`)
      setLoadingList(false)
      return
    }

    setCodes(data || [])
    setLoadingList(false)
  }

  const resetForm = () => {
    setSelectedCodeId('')
    setEditingId(null)
    setCode('')
    setCodeName('')
    setSortOrder('')
    setIsActive(true)
    setMessage('')
  }

  const handleLoadCode = () => {
    setMessage('')

    if (!selectedCodeId) {
      setMessage('불러올 코드를 선택해 주세요.')
      return
    }

    const selected = codes.find(
      (item) => String(item.id) === String(selectedCodeId)
    )

    if (!selected) {
      setMessage('선택한 코드를 찾을 수 없습니다.')
      return
    }

    setEditingId(selected.id)
    setCode(selected.code || '')
    setCodeName(selected.code_name || '')
    setSortOrder(
      selected.sort_order !== null && selected.sort_order !== undefined
        ? String(selected.sort_order)
        : ''
    )
    setIsActive(!!selected.is_active)
    setMessage('고객분류코드 정보를 불러왔습니다.')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    const trimmedCode = code.trim()
    const trimmedCodeName = codeName.trim()

    if (!trimmedCode) {
      setMessage('코드를 입력해 주세요.')
      return
    }

    if (!trimmedCodeName) {
      setMessage('코드명을 입력해 주세요.')
      return
    }

    let duplicateCodeQuery = supabase
      .from('customer_category_codes')
      .select('id')
      .eq('code', trimmedCode)

    if (editingId) {
      duplicateCodeQuery = duplicateCodeQuery.neq('id', editingId)
    }

    const {
      data: duplicateCodeData,
      error: duplicateCodeError,
    } = await duplicateCodeQuery

    if (duplicateCodeError) {
      setMessage(`코드 중복 확인 실패: ${duplicateCodeError.message}`)
      return
    }

    if (duplicateCodeData && duplicateCodeData.length > 0) {
      alert('같은 코드가 이미 등록되어 있습니다.')
      setMessage('같은 코드가 이미 등록되어 있습니다.')
      return
    }

    let duplicateNameQuery = supabase
      .from('customer_category_codes')
      .select('id')
      .eq('code_name', trimmedCodeName)

    if (editingId) {
      duplicateNameQuery = duplicateNameQuery.neq('id', editingId)
    }

    const {
      data: duplicateNameData,
      error: duplicateNameError,
    } = await duplicateNameQuery

    if (duplicateNameError) {
      setMessage(`코드명 중복 확인 실패: ${duplicateNameError.message}`)
      return
    }

    if (duplicateNameData && duplicateNameData.length > 0) {
      alert('같은 코드명이 이미 등록되어 있습니다.')
      setMessage('같은 코드명이 이미 등록되어 있습니다.')
      return
    }

    const payload = {
      code: trimmedCode,
      code_name: trimmedCodeName,
      sort_order: sortOrder ? Number(sortOrder) : 0,
      is_active: isActive,
    }

    if (editingId) {
      const { error } = await supabase
        .from('customer_category_codes')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        setMessage(`수정 실패: ${error.message}`)
        return
      }

      setMessage('고객분류코드가 수정되었습니다.')
      await fetchCodes()
      return
    }

    const { error } = await supabase
      .from('customer_category_codes')
      .insert([payload])

    if (error) {
      setMessage(`저장 실패: ${error.message}`)
      return
    }

    setMessage('고객분류코드가 저장되었습니다.')
    await fetchCodes()
    resetForm()
  }

  const handleDelete = async () => {
    setMessage('')

    if (!editingId) {
      setMessage('삭제할 코드를 먼저 불러와 주세요.')
      return
    }

    const confirmed = window.confirm('선택한 고객분류코드를 삭제하시겠습니까?')
    if (!confirmed) return

    const { error } = await supabase
      .from('customer_category_codes')
      .delete()
      .eq('id', editingId)

    if (error) {
      setMessage(`삭제 실패: ${error.message}`)
      return
    }

    setMessage('고객분류코드가 삭제되었습니다.')
    await fetchCodes()
    resetForm()
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
              고객분류코드 관리
            </h1>
            <p className="mt-2 text-slate-600">
              고객사 입력 화면에서 사용할 고객분류코드를 등록, 수정, 삭제합니다.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                코드 불러오기
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <select
                  value={selectedCodeId}
                  onChange={(e) => setSelectedCodeId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                >
                  <option value="">
                    {loadingList ? '목록 불러오는 중...' : '코드를 선택하세요'}
                  </option>
                  {codes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.code_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLoadCode}
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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  코드
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="예: A01"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  코드명
                </label>
                <input
                  value={codeName}
                  onChange={(e) => setCodeName(e.target.value)}
                  placeholder="예: 전략고객"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  정렬순서
                </label>
                <input
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="예: 1"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  사용여부
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-black">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  사용
                </label>
              </div>

              <div className="md:col-span-2 mt-4 flex gap-3">
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

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/dashboard'
                  }}
                  className="rounded-xl bg-emerald-700 px-6 py-3 font-medium text-white hover:bg-emerald-800"
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

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-800">등록 코드 목록</h2>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border border-slate-200 text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border px-3 py-2 text-left text-black">코드</th>
                      <th className="border px-3 py-2 text-left text-black">코드명</th>
                      <th className="border px-3 py-2 text-left text-black">정렬순서</th>
                      <th className="border px-3 py-2 text-left text-black">사용여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((item) => (
                      <tr key={item.id}>
                        <td className="border px-3 py-2 text-black">{item.code}</td>
                        <td className="border px-3 py-2 text-black">{item.code_name}</td>
                        <td className="border px-3 py-2 text-black">
                          {item.sort_order ?? ''}
                        </td>
                        <td className="border px-3 py-2 text-black">
                          {item.is_active ? '사용' : '미사용'}
                        </td>
                      </tr>
                    ))}
                    {codes.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="border px-3 py-6 text-center text-black"
                        >
                          등록된 고객분류코드가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}