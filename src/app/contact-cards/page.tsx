'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Company = {
  id: number
  customer_name: string
}

export default function ContactsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  const [companyId, setCompanyId] = useState('')
  const [companySearchText, setCompanySearchText] = useState('')

  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [workLocation, setWorkLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [mainRole, setMainRole] = useState('')
  const [workLocationDetail, setWorkLocationDetail] = useState('')
  const [address, setAddress] = useState('')

  const [birthDate, setBirthDate] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [familyRelation, setFamilyRelation] = useState('')
  const [education, setEducation] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [hobby, setHobby] = useState('')
  const [gender, setGender] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [sensitiveInfoPrint, setSensitiveInfoPrint] = useState(false)

  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, customer_name')
        .order('customer_name', { ascending: true })

      if (error) {
        setMessage(`고객사 목록 조회 실패: ${error.message}`)
        setLoadingCompanies(false)
        return
      }

      setCompanies(data || [])
      setLoadingCompanies(false)
    }

    loadCompanies()
  }, [])

  const findCompanyByName = (customerName: string) => {
    return companies.find(
      (company) => company.customer_name.trim() === customerName.trim()
    )
  }

  const handleCompanyInputChange = (value: string) => {
    setCompanySearchText(value)
    setMessage('')

    const matchedCompany = findCompanyByName(value)

    if (matchedCompany) {
      setCompanyId(String(matchedCompany.id))
    } else {
      setCompanyId('')
    }
  }

  const resetForm = () => {
    setCompanyId('')
    setCompanySearchText('')

    setName('')
    setPosition('')
    setWorkLocation('')
    setDepartment('')
    setPhone('')
    setEmail('')
    setMainRole('')
    setWorkLocationDetail('')
    setAddress('')
    setBirthDate('')
    setMaritalStatus('')
    setFamilyRelation('')
    setEducation('')
    setSchoolName('')
    setHobby('')
    setGender('')
    setSpecialNotes('')
    setSensitiveInfoPrint(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    const matchedCompany = companyId
      ? companies.find((company) => String(company.id) === String(companyId))
      : findCompanyByName(companySearchText)

    if (!matchedCompany) {
      setMessage('고객사는 목록에서 선택하거나 정확한 고객사명을 입력해 주세요.')
      return
    }

    const trimmedName = name.trim()

    if (!trimmedName) {
      setMessage('이름을 입력해 주세요.')
      return
    }

    const { error } = await supabase.from('contacts').insert([
      {
        company_id: Number(matchedCompany.id),
        name: trimmedName,
        position: position || null,
        work_location: workLocation || null,
        department: department || null,
        phone: phone || null,
        email: email || null,
        main_role: mainRole || null,
        work_location_detail: workLocationDetail || null,
        address: address || null,
        birth_date: birthDate || null,
        marital_status: maritalStatus || null,
        family_relation: familyRelation || null,
        education: education || null,
        school_name: schoolName || null,
        hobby: hobby || null,
        gender: gender || null,
        special_notes: specialNotes || null,
        sensitive_info_print: sensitiveInfoPrint,
      },
    ])

    if (error) {
      setMessage(`저장 실패: ${error.message}`)
      return
    }

    resetForm()
    setMessage('고객담당자 정보가 저장되었습니다.')
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-800">
          고객담당자 정보 등록
        </h1>

        <p className="mt-2 text-slate-600">
          고객사 담당자 정보를 입력하고 저장합니다.
        </p>

        {loadingCompanies ? (
          <div className="mt-6 text-slate-600">고객사 목록 불러오는 중...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
            <div>
              <input
                type="text"
                list="company-list"
                value={companySearchText}
                onChange={(e) => handleCompanyInputChange(e.target.value)}
                onBlur={() => {
                  const matchedCompany = findCompanyByName(companySearchText)

                  if (matchedCompany) {
                    setCompanyId(String(matchedCompany.id))
                    setCompanySearchText(matchedCompany.customer_name)
                  }
                }}
                placeholder="고객사를 선택하세요 *"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                required
              />

              <datalist id="company-list">
                {companies.map((company) => (
                  <option key={company.id} value={company.customer_name} />
                ))}
              </datalist>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 *"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
              required
            />

            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="직급"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="근무지"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="부서"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="연락처"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={mainRole}
              onChange={(e) => setMainRole(e.target.value)}
              placeholder="주요역할"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={workLocationDetail}
              onChange={(e) => setWorkLocationDetail(e.target.value)}
              placeholder="근무지(상세)"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
            />

            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소"
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500 md:col-span-2"
            />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
              <h2 className="text-lg font-semibold text-slate-800">민감정보</h2>

              <p className="mt-1 text-sm text-slate-600">
                민감정보 출력 포함 체크 시 고객관리카드 출력 시 함께 표시됩니다.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                />

                <input
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  placeholder="결혼유무"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />

                <input
                  value={familyRelation}
                  onChange={(e) => setFamilyRelation(e.target.value)}
                  placeholder="가족관계"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />

                <input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="학력"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />

                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="출신학교"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />

                <input
                  value={hobby}
                  onChange={(e) => setHobby(e.target.value)}
                  placeholder="취미"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />

                <input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="성별"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                />

                <label className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-black">
                  <input
                    type="checkbox"
                    checked={sensitiveInfoPrint}
                    onChange={(e) => setSensitiveInfoPrint(e.target.checked)}
                  />
                  민감정보 출력 포함
                </label>

                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="특이사항 및 주요내용"
                  className="min-h-[120px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500 md:col-span-2"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-6 py-3 font-medium text-white hover:bg-emerald-800"
              >
                저장
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
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 md:col-span-2 whitespace-pre-wrap">
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  )
}