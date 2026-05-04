'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

type Company = {
  id: number
  customer_name: string
  customer_category_code: string | null
  transaction_start_date: string | null
  main_product: string | null
  address: string | null
  sales_owner: string | null
  note: string | null
}

type CustomerCategoryCode = {
  id: number
  code: string
  code_name: string
  sort_order: number | null
  is_active: boolean | null
}

type DisplayRow = {
  id: number
  customerName: string
  categoryName: string
  transactionStartDate: string
  mainProduct: string
  address: string
  salesOwner: string
  note: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getTodayString() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  return `${yyyy}${mm}${dd}`
}

function getSortName(value: string) {
  return value
    .replaceAll('㈜', '')
    .replace(/\(주\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

function formatYearMonth(value: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 7)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

const koreanCollator = new Intl.Collator('ko-KR', {
  numeric: true,
  sensitivity: 'base',
})

export default function CustomerCompanyStatusPage() {
  const router = useRouter()

  const [companies, setCompanies] = useState<Company[]>([])
  const [categoryCodes, setCategoryCodes] = useState<CustomerCategoryCode[]>([])
  const [searchedCompanies, setSearchedCompanies] = useState<Company[]>([])

  const [selectedCategoryCode, setSelectedCategoryCode] = useState('all')

  const [loading, setLoading] = useState(true)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      setMessage('')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        window.location.href = '/'
        return
      }

      const [companyRes, categoryRes] = await Promise.all([
        supabase
          .from('companies')
          .select(
            `
            id,
            customer_name,
            customer_category_code,
            transaction_start_date,
            main_product,
            address,
            sales_owner,
            note
          `
          )
          .order('customer_name', { ascending: true }),

        supabase
          .from('customer_category_codes')
          .select('id, code, code_name, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ])

      const messages: string[] = []

      if (companyRes.error) {
        messages.push(`고객사 목록 조회 실패: ${companyRes.error.message}`)
      }

      if (categoryRes.error) {
        messages.push(
          `고객분류코드 목록 조회 실패: ${categoryRes.error.message}`
        )
      }

      if (messages.length > 0) {
        setMessage(messages.join('\n'))
        setLoading(false)
        return
      }

      const sortedCompanies = [...((companyRes.data as Company[]) || [])].sort(
        (a, b) =>
          koreanCollator.compare(
            getSortName(a.customer_name || ''),
            getSortName(b.customer_name || '')
          )
      )

      setCompanies(sortedCompanies)
      setCategoryCodes((categoryRes.data as CustomerCategoryCode[]) || [])
      setLoading(false)
    }

    initialize()
  }, [])

  const categoryCodeMap = useMemo(() => {
    const map = new Map<string, CustomerCategoryCode>()

    categoryCodes.forEach((item) => {
      map.set(item.code, item)
    })

    return map
  }, [categoryCodes])

  const displayRows = useMemo<DisplayRow[]>(() => {
    const rows = searchedCompanies.map((company) => {
      const category = company.customer_category_code
        ? categoryCodeMap.get(company.customer_category_code)
        : undefined

      return {
        id: company.id,
        customerName: company.customer_name || '',
        categoryName: category?.code_name || '',
        transactionStartDate: formatYearMonth(company.transaction_start_date),
        mainProduct: company.main_product || '',
        address: company.address || '',
        salesOwner: company.sales_owner || '',
        note: company.note || '',
      }
    })

    return rows.sort((a, b) =>
      koreanCollator.compare(
        getSortName(a.customerName),
        getSortName(b.customerName)
      )
    )
  }, [searchedCompanies, categoryCodeMap])

  function handleCategoryChange(value: string) {
    setSelectedCategoryCode(value)
    setHasSearched(false)
    setSearchedCompanies([])
    setMessage('')
  }

  async function handleSearch() {
    setMessage('')
    setSearchedCompanies([])
    setHasSearched(false)
    setLoadingCompanies(true)

    let result = [...companies]

    if (selectedCategoryCode !== 'all') {
      result = result.filter(
        (company) => company.customer_category_code === selectedCategoryCode
      )
    }

    result.sort((a, b) =>
      koreanCollator.compare(
        getSortName(a.customer_name || ''),
        getSortName(b.customer_name || '')
      )
    )

    setSearchedCompanies(result)
    setHasSearched(true)
    setLoadingCompanies(false)
  }

  function handleCompanyClick(companyId: number) {
    const params = new URLSearchParams()

    params.set('companyId', String(companyId))
    params.set('from', 'customer-company-status')

    router.push(`/companies?${params.toString()}`)
  }

  function handleExcelDownload() {
    if (displayRows.length === 0) {
      alert('다운로드할 조회 결과가 없습니다.')
      return
    }

    const selectedCategoryName =
      selectedCategoryCode === 'all'
        ? '전체'
        : categoryCodeMap.get(selectedCategoryCode)?.code_name || ''

    const bodyRows = displayRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.customerName)}</td>
            <td>${escapeHtml(row.categoryName)}</td>
            <td>${escapeHtml(row.transactionStartDate)}</td>
            <td>${escapeHtml(row.mainProduct)}</td>
            <td>${escapeHtml(row.address)}</td>
            <td>${escapeHtml(row.salesOwner)}</td>
            <td>${escapeHtml(row.note)}</td>
          </tr>
        `
      )
      .join('')

    const excelHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table {
              border-collapse: collapse;
              font-family: Arial, sans-serif;
              font-size: 11pt;
            }

            th, td {
              border: 1px solid #000000;
              padding: 6px;
              vertical-align: middle;
            }

            .title {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
            }

            .label {
              font-weight: bold;
              background-color: #f1f5f9;
            }

            .header {
              font-weight: bold;
              text-align: center;
              background-color: #f1f5f9;
            }

            .text-cell {
              mso-number-format: "\\@";
            }
          </style>
        </head>

        <body>
          <table>
            <tr>
              <td colspan="7" class="title">고객사 현황</td>
            </tr>
            <tr>
              <td class="label">고객분류코드</td>
              <td colspan="6">${escapeHtml(selectedCategoryName)}</td>
            </tr>
            <tr></tr>
            <tr>
              <th class="header">고객사명</th>
              <th class="header">고객분류코드</th>
              <th class="header">거래시작년월</th>
              <th class="header">주력제품</th>
              <th class="header">주소</th>
              <th class="header">영업담당</th>
              <th class="header">기타</th>
            </tr>
            ${bodyRows}
          </table>
        </body>
      </html>
    `

    const blob = new Blob(['\ufeff', excelHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `고객사_현황_${getTodayString()}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-2xl bg-white p-8 shadow">
              <h1 className="text-2xl font-bold text-slate-900">
                고객사 현황
              </h1>

              <p className="mt-2 text-slate-600">
                고객분류코드별 고객사 현황을 조회하고 Excel로 다운로드할 수 있습니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <h2 className="text-lg font-bold text-slate-900">검색 조건</h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    고객분류코드
                  </label>

                  <select
                    value={selectedCategoryCode}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  >
                    <option value="all">전체</option>

                    {categoryCodes.map((item) => (
                      <option key={item.id} value={item.code}>
                        {item.code_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="h-12 rounded-xl bg-blue-700 px-8 font-semibold text-white hover:bg-blue-800"
                  >
                    조회
                  </button>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleExcelDownload}
                    className="h-12 rounded-xl bg-emerald-700 px-8 font-semibold text-white hover:bg-emerald-800"
                  >
                    Excel 다운로드
                  </button>
                </div>
              </div>

              {message && (
                <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  고객사 목록
                </h2>

                <span className="text-sm text-slate-500">
                  {hasSearched ? `조회 건수: ${displayRows.length}건` : ''}
                </span>
              </div>

              {loadingCompanies ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  고객사 현황을 조회하는 중입니다.
                </div>
              ) : !hasSearched ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  고객분류코드를 선택한 후 조회 버튼을 누르세요.
                </div>
              ) : displayRows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  조회 결과가 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-300">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '12%' }} />
                    </colgroup>

                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          고객사명
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          고객분류코드
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          거래시작년월
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          주력제품
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          주소
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          영업담당
                        </th>
                        <th className="border border-slate-300 px-3 py-3 text-center font-bold text-black">
                          기타
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => handleCompanyClick(row.id)}
                          className="cursor-pointer transition hover:bg-blue-50"
                        >
                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.customerName}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.categoryName}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-center text-black">
                            {row.transactionStartDate}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.mainProduct}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.address}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.salesOwner}
                          </td>

                          <td className="break-words border border-slate-300 px-3 py-2 text-black">
                            {row.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="px-1 py-3 text-sm text-slate-500">
                    고객사 행을 클릭하면 해당 고객사의 고객사 정보 등록 화면으로 이동합니다.
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