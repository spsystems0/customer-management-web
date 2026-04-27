import Sidebar from '../components/Sidebar'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar mode="guest" />

        <section className="flex-1 p-8">
          <div className="rounded-2xl bg-white p-8 shadow">
            <h1 className="text-3xl font-bold text-slate-800">
              고객사 및 고객담당자 관리 시스템
            </h1>
            <p className="mt-4 text-slate-600">
              고객사 정보, 고객담당자 정보, 방문일지를 관리하고
              고객사관리카드 및 고객관리카드를 조회/출력하는 웹 시스템입니다.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <a
              href="/company-cards"
              className="block rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-blue-700">
                고객사관리카드 조회
              </h2>
              <p className="mt-3 text-slate-600">
                로그인 없이 고객사를 검색하고 고객사관리카드를 조회/출력합니다.
              </p>
            </a>

            <a
              href="/customer-cards"
              className="block rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-emerald-700">
                고객관리카드 조회
              </h2>
              <p className="mt-3 text-slate-600">
                로그인 없이 고객사와 담당자를 선택하여 고객관리카드를 조회/출력합니다.
              </p>
            </a>

            <a
              href="/visit-history"
              className="block rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-emerald-700">
                방문일지 조회
              </h2>
              <p className="mt-3 text-slate-600">
                로그인 없이 고객사의 담당자 또는 방문자별로 방문일지를 조회합니다.
              </p>
            </a>

            <a
              href="/login"
              className="block rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-amber-700">
                영업담당자 로그인
              </h2>
              <p className="mt-3 text-slate-600">
                영업담당자는 로그인 후 고객사, 담당자, 방문일지를 등록/수정/삭제할 수 있습니다.
              </p>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}