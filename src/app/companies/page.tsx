'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

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

type CustomerCategoryCode = {
  id: number
  code: string
  code_name: string
  sort_order: number | null
  is_active: boolean | null
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [categoryCodes, setCategoryCodes] = useState<CustomerCategoryCode[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [industry, setIndustry] = useState('')
  const [address, setAddress] = useState('')
  const [mainProduct, setMainProduct] = useState('')
  const [homepage, setHomepage] = useState('')
  const [transactionStartDate, setTransactionStartDate] = useState('')
  const [salesOwner, setSalesOwner] = useState('')
  const [revenue, setRevenue] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [note, setNote] = useState('')
  const [customerCategoryCode, setCustomerCategoryCode] = useState('')
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

      await Promise.all([fetchCompanies(), fetchCategoryCodes()])
      setLoading(false)
    }

    initialize()
  }, [])

  const fetchCompanies = async () => {
    setLoadingList(true)

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
      setLoadingList(false)
      return
    }

    setCompanies(data || [])
    setLoadingList(false)
  }

  const fetchCategoryCodes = async () => {
    const { data, error } = await supabase
      .from('customer_category_codes')
      .select('id, code, code_name, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      setMessage(`고객분류코드 목록 조회 실패: ${error.message}`)
      return
    }

    setCategoryCodes(data || [])
  }

  const resetForm = () => {
    setSelectedCompanyId('')
    setEditingId(null)
    setCustomerName('')
    setBusinessNumber('')
    setIndustry('')
    setAddress('')
    setMainProduct('')
    setHomepage('')
    setTransactionStartDate('')
    setSalesOwner('')
    setRevenue('')
    setEmployeeCount('')
    setNote('')
    setCustomerCategoryCode('')
    setMessage('')
  }

  const handleLoadCompany = () => {
    setMessage('')

    if (!selectedCompanyId) {
      setMessage('불러올 고객사를 선택해 주세요.')
      return
    }

    const company = companies.find(
      (item) => String(item.id) === String(selectedCompanyId)
    )

    if (!company) {
      setMessage('선택한 고객사 정보를 찾을 수 없습니다.')
      return
    }

    setEditingId(company.id)
    setCustomerName(company.customer_name || '')
    setBusinessNumber(company.business_number || '')
    setIndustry(company.industry || '')
    setAddress(company.address || '')
    setMainProduct(company.main_product || '')
    setHomepage(company.homepage || '')
    setTransactionStartDate(company.transaction_start_date || '')
    setSalesOwner(company.sales_owner || '')
    setRevenue(company.revenue || '')
    setEmployeeCount(
      company.employee_count !== null ? String(company.employee_count) : ''
    )
    setNote(company.note || '')
    setCustomerCategoryCode(company.customer_category_code || '')
    setMessage('고객사 정보를 불러왔습니다.')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    const trimmedCustomerName = customerName.trim()
    const trimmedBusinessNumber = businessNumber.trim()

    if (!trimmedCustomerName) {
      setMessage('고객사명을 입력해 주세요.')
      return
    }

    let duplicateNameQuery = supabase
      .from('companies')
      .select('id')
      .eq('customer_name', trimmedCustomerName)

    if (editingId) {
      duplicateNameQuery = duplicateNameQuery.neq('id', editingId)
    }

    const {
      data: duplicateNameData,
      error: duplicateNameError,
    } = await duplicateNameQuery

    if (duplicateNameError) {
      setMessage(`고객사명 중복 확인 실패: ${duplicateNameError.message}`)
      return
    }

    if (duplicateNameData && duplicateNameData.length > 0) {
      const warningMessage =
        '같은 고객사명이 이미 등록되어 있습니다.\n중복 입력 여부를 확인해 주세요.'
      alert(warningMessage)
      setMessage('같은 고객사명이 이미 등록되어 있습니다.')
      return
    }

    if (trimmedBusinessNumber) {
      let duplicateBusinessQuery = supabase
        .from('companies')
        .select('id')
        .eq('business_number', trimmedBusinessNumber)

      if (editingId) {
        duplicateBusinessQuery = duplicateBusinessQuery.neq('id', editingId)
      }

      const {
        data: duplicateBusinessData,
        error: duplicateBusinessError,
      } = await duplicateBusinessQuery

      if (duplicateBusinessError) {
        setMessage(`사업자번호 중복 확인 실패: ${duplicateBusinessError.message}`)
        return
      }

      if (duplicateBusinessData && duplicateBusinessData.length > 0) {
        const warningMessage =
          '동일한 사업자번호가 이미 등록되어 있습니다.\n중복 입력 여부를 확인해 주세요.'
        alert(warningMessage)
        setMessage('동일한 사업자번호가 이미 등록되어 있습니다.')
        return
      }
    }

    const payload = {
      customer_name: trimmedCustomerName,
      business_number: trimmedBusinessNumber || null,
      industry: industry || null,
      address: address || null,
      main_product: mainProduct || null,
      homepage: homepage || null,
      transaction_start_date: transactionStartDate || null,
      sales_owner: salesOwner || null,
      revenue: revenue || null,
      employee_count: employeeCount ? Number(employeeCount) : null,
      note: note || null,
      customer_category_code: customerCategoryCode || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        setMessage(`수정 실패: ${error.message}`)
        return
      }

      setMessage('고객사 정보가 수정되었습니다.')
      await fetchCompanies()
      return
    }

    const { error } = await supabase.from('companies').insert([payload])

    if (error) {
      setMessage(`저장 실패: ${error.message}`)
      return
    }

    setMessage('고객사 정보가 저장되었습니다.')
    await fetchCompanies()
    resetForm()
  }

  const handleDelete = async () => {
    setMessage('')

    if (!editingId) {
      setMessage('삭제할 고객사를 먼저 불러와 주세요.')
      return
    }

    const confirmed = window.confirm('선택한 고객사 정보를 삭제하시겠습니까?')
    if (!confirmed) return

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', editingId)

    if (error) {
      setMessage(`삭제 실패: ${error.message}`)
      return
    }

    setMessage('고객사 정보가 삭제되었습니다.')
    await fetchCompanies()
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
              고객사 정보 등록 / 수정 / 삭제
            </h1>
            <p className="mt-2 text-slate-600">
              고객사를 선택해 기존 정보를 불러오거나 신규 등록할 수 있습니다.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                고객사 불러오기
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                >
                  <option value="">
                    {loadingList ? '목록 불러오는 중...' : '고객사를 선택하세요'}
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.customer_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLoadCompany}
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
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="고객사명 *"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                required
              />

              <input
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                placeholder="사업자번호"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <select
                value={customerCategoryCode}
                onChange={(e) => setCustomerCategoryCode(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
              >
                <option value="">고객분류코드를 선택하세요</option>
                {categoryCodes.map((item) => (
                  <option key={item.id} value={item.code}>
                    {item.code} - {item.code_name}
                  </option>
                ))}
              </select>

              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="업종"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                value={mainProduct}
                onChange={(e) => setMainProduct(e.target.value)}
                placeholder="주력 제품"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                value={homepage}
                onChange={(e) => setHomepage(e.target.value)}
                placeholder="홈페이지"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                type="date"
                value={transactionStartDate}
                onChange={(e) => setTransactionStartDate(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
              />

              <input
                value={salesOwner}
                onChange={(e) => setSalesOwner(e.target.value)}
                placeholder="영업담당"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="매출액"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <input
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                placeholder="직원 수"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="기타"
                className="min-h-[120px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500 md:col-span-2"
              />

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
          </div>
        </section>
      </div>
    </main>
  )
}