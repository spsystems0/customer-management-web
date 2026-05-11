'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function ChangePasswordPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

  const [message, setMessage] = useState('')

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      setMessage('')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        window.location.href = '/'
        return
      }

      setEmail(session.user.email || '')
      setLoading(false)
    }

    initialize()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    const trimmedCurrentPassword = currentPassword.trim()
    const trimmedNewPassword = newPassword.trim()
    const trimmedNewPasswordConfirm = newPasswordConfirm.trim()

    if (!email) {
      setMessage('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      return
    }

    if (!trimmedCurrentPassword) {
      setMessage('현재 비밀번호를 입력해 주세요.')
      return
    }

    if (!trimmedNewPassword) {
      setMessage('새 비밀번호를 입력해 주세요.')
      return
    }

    if (trimmedNewPassword.length < 8) {
      setMessage('새 비밀번호는 최소 8자 이상 입력해 주세요.')
      return
    }

    if (trimmedNewPassword !== trimmedNewPasswordConfirm) {
      setMessage('새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      setMessage('현재 비밀번호와 다른 새 비밀번호를 입력해 주세요.')
      return
    }

    setSaving(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: trimmedCurrentPassword,
    })

    if (signInError) {
      setSaving(false)
      setMessage('현재 비밀번호가 일치하지 않습니다.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: trimmedNewPassword,
    })

    setSaving(false)

    if (updateError) {
      setMessage(`비밀번호 변경 실패: ${updateError.message}`)
      return
    }

    alert('비밀번호가 변경되었습니다.')

    setCurrentPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setMessage('비밀번호가 변경되었습니다.')

    router.replace('/dashboard')
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
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-slate-900">
              비밀번호 변경
            </h1>

            <p className="mt-2 text-slate-600">
              현재 로그인한 계정의 비밀번호를 변경합니다.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-bold">로그인 이메일:</span> {email}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  현재 비밀번호
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  새 비밀번호
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  새 비밀번호 확인
                </label>

                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-gray-500"
                  autoComplete="new-password"
                />
              </div>

              {message && (
                <div className="whitespace-pre-wrap rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? '변경 중...' : '비밀번호 변경'}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl bg-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-700"
                >
                  이전 화면으로
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  대시보드로 이동
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}