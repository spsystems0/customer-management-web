'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

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

export default function ContactsPage() {
  const loadCompanyListRef = useRef<HTMLDivElement | null>(null)
  const formCompanyListRef = useRef<HTMLDivElement | null>(null)

  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [loadCompanySearchText, setLoadCompanySearchText] = useState('')
  const [showLoadCompanyList, setShowLoadCompanyList] = useState(false)

  const [formCompanySearchText, setFormCompanySearchText] = useState('')
  const [showFormCompanyList, setShowFormCompanyList] = useState(false)

  const [companyId, setCompanyId] = useState('')
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      if (
        loadCompanyListRef.current &&
        !loadCompanyListRef.current.contains(target)
      ) {
        setShowLoadCompanyList(false)
      }

      if (
        formCompanyListRef.current &&
        !formCompanyListRef.current.contains(target)
      ) {
        setShowFormCompanyList(false)
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
    const loadContacts = async () => {
      setSelectedContactId('')
      setContacts([])

      if (!selectedCompanyId) {
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
        setLoadingContacts(false)
        return
      }

      setContacts(data || [])
      setLoadingContacts(false)
    }

    loadContacts()
  }, [selectedCompanyId])

  const filteredLoadCompanies = useMemo(() => {
    const searchText = loadCompanySearchText.trim().toLowerCase()

    if (!searchText) return companies

    return companies.filter((company) =>
      company.customer_name.toLowerCase().includes(searchText)
    )
  }, [companies, loadCompanySearchText])

  const filteredFormCompanies = useMemo(() => {
    const searchText = formCompanySearchText.trim().toLowerCase()

    if (!searchText) return companies

    return companies.filter((company) =>
      company.customer_name.toLowerCase().includes(searchText)
    )
  }, [companies, formCompanySearchText])

  const refreshContacts = async (targetCompanyId: string) => {
    if (!targetCompanyId) {
      setContacts([])
      return
    }

    const { data } = await supabase
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
      .eq('company_id', Number(targetCompanyId))
      .order('name', { ascending: true })

    setContacts(data || [])
  }

  const resetForm = () => {
    setSelectedCompanyId('')
    setSelectedContactId('')
    setEditingId(null)

    setLoadCompanySearchText('')
    setShowLoadCompanyList(false)

    setFormCompanySearchText('')
    setShowFormCompanyList(false)

    setCompanyId('')
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

    setContacts([])
    setMessage('')
  }

  const handleLoadCompanyInputChange = (value: string) => {
    setLoadCompanySearchText(value)
    setSelectedCompanyId('')
    setSelectedContactId('')
    setContacts([])
    setMessage('')
    setShowLoadCompanyList(true)
  }

  const handleLoadCompanySelect = (company: Company) => {
    setSelectedCompanyId(String(company.id))
    setLoadCompanySearchText(company.customer_name)
    setSelectedContactId('')
    setMessage('')
    setShowLoadCompanyList(false)
  }

  const handleFormCompanyInputChange = (value: string) => {
    setFormCompanySearchText(value)
    setCompanyId('')
    setMessage('')
    setShowFormCompanyList(true)
  }

  const handleFormCompanySelect = (company: Company) => {
    setCompanyId(String(company.id))
    setFormCompanySearchText(company.customer_name)
    setMessage('')
    setShowFormCompanyList(false)
  }

  const handleLoadContact = () => {
    setMessage('')
    setShowLoadCompanyList(false)
    setShowFormCompanyList(false)

    if (!selectedContactId) {
      setMessage('불러올 담당자를 선택해 주세요.')
      return
    }

    const contact = contacts.find(
      (item) => String(item.id) === String(selectedContactId)
    )

    if (!contact) {
      setMessage('선택한 담당자 정보를 찾을 수 없습니다.')
      return
    }

    const company = companies.find(
      (item) => String(item.id) === String(contact.company_id)
    )

    setEditingId(contact.id)
    setCompanyId(String(contact.company_id))
    setFormCompanySearchText(company?.customer_name || '')
    setName(contact.name || '')
    setPosition(contact.position || '')
    setWorkLocation(contact.work_location || '')
    setDepartment(contact.department || '')
    setPhone(contact.phone || '')
    setEmail(contact.email || '')
    setMainRole(contact.main_role || '')
    setWorkLocationDetail(contact.work_location_detail || '')
    setAddress(contact.address || '')
    setBirthDate(contact.birth_date || '')
    setMaritalStatus(contact.marital_status || '')
    setFamilyRelation(contact.family_relation || '')
    setEducation(contact.education || '')
    setSchoolName(contact.school_name || '')
    setHobby(contact.hobby || '')
    setGender(contact.gender || '')
    setSpecialNotes(contact.special_notes || '')
    setSensitiveInfoPrint(!!contact.sensitive_info_print)

    setMessage('고객담당자 정보를 불러왔습니다.')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setShowLoadCompanyList(false)
    setShowFormCompanyList(false)

    const trimmedName = name.trim()

    if (!companyId) {
      setMessage('고객사를 목록에서 선택해 주세요.')
      return
    }

    if (!trimmedName) {
      setMessage('담당자 이름을 입력해 주세요.')
      return
    }

    let duplicateQuery = supabase
      .from('contacts')
      .select('id')
      .eq('company_id', Number(companyId))
      .eq('name', trimmedName)

    if (editingId) {
      duplicateQuery = duplicateQuery.neq('id', editingId)
    }

    const { data: duplicateData, error: duplicateError } = await duplicateQuery

    if (duplicateError) {
      setMessage(`중복 확인 실패: ${duplicateError.message}`)
      return
    }

    if (duplicateData && duplicateData.length > 0) {
      const warningMessage =
        '같은 고객사에 동일한 담당자명이 이미 등록되어 있습니다.\n중복 입력 여부를 확인해 주세요.'

      alert(warningMessage)
      setMessage('같은 고객사에 동일한 담당자명이 이미 등록되어 있습니다.')
      return
    }

    const payload = {
      company_id: Number(companyId),
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
    }

    if (editingId) {
      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        setMessage(`수정 실패: ${error.message}`)
        return
      }

      alert('수정 내용이 저장되었습니다.')
      setMessage('고객담당자 정보가 수정되었습니다.')
    } else {
      const { error } = await supabase.from('contacts').insert([payload])

      if (error) {
        if (
          error.message.includes('contacts_company_id_name_unique') ||
          error.message.toLowerCase().includes('duplicate')
        ) {
          setMessage('같은 고객사에 동일한 담당자명이 이미 등록되어 있습니다.')
          return
        }

        setMessage(`저장 실패: ${error.message}`)
        return
      }

      setMessage('고객담당자 정보가 저장되었습니다.')
    }

    const refreshCompanyId = selectedCompanyId || companyId
    await refreshContacts(refreshCompanyId)
  }

  const handleDelete = async () => {
    setMessage('')
    setShowLoadCompanyList(false)
    setShowFormCompanyList(false)

    if (!editingId) {
      setMessage('삭제할 담당자를 먼저 불러와 주세요.')
      return
    }

    const confirmed = window.confirm('선택한 고객담당자 정보를 삭제하시겠습니까?')
    if (!confirmed) return

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', editingId)

    if (error) {
      setMessage(`삭제 실패: ${error.message}`)
      return
    }

    setMessage('고객담당자 정보가 삭제되었습니다.')

    if (selectedCompanyId) {
      await refreshContacts(selectedCompanyId)
    }

    setEditingId(null)
    setSelectedContactId('')
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
              고객담당자 등록 / 수정 / 삭제
            </h1>

            <p className="mt-2 text-slate-600">
              고객사와 담당자를 선택해 기존 정보를 불러오거나 신규 등록할 수 있습니다.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                고객담당자 불러오기
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
                <div ref={loadCompanyListRef} className="relative">
                  <input
                    type="text"
                    value={loadCompanySearchText}
                    onChange={(e) =>
                      handleLoadCompanyInputChange(e.target.value)
                    }
                    onFocus={() => setShowLoadCompanyList(true)}
                    placeholder="고객사를 선택하세요"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  />

                  {showLoadCompanyList && (
                    <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-lg">
                      {filteredLoadCompanies.length > 0 ? (
                        filteredLoadCompanies.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => handleLoadCompanySelect(company)}
                            className="block w-full px-4 py-3 text-left text-black hover:bg-blue-50"
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
                  onClick={handleLoadContact}
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
              <div ref={formCompanyListRef} className="relative">
                <input
                  type="text"
                  value={formCompanySearchText}
                  onChange={(e) =>
                    handleFormCompanyInputChange(e.target.value)
                  }
                  onFocus={() => setShowFormCompanyList(true)}
                  placeholder="고객사를 선택하세요 *"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  required
                />

                {showFormCompanyList && (
                  <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-lg">
                    {filteredFormCompanies.length > 0 ? (
                      filteredFormCompanies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => handleFormCompanySelect(company)}
                          className="block w-full px-4 py-3 text-left text-black hover:bg-emerald-50"
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
                <div className="whitespace-pre-wrap rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 md:col-span-2">
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