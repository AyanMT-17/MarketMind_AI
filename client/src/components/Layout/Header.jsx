"use client"
import { useAuth } from "../../contexts/AuthContext"

function Header({ toggleSidebar }) {
  const { user } = useAuth()

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">MarketMind AI</p>
            <h1 className="text-lg font-semibold text-slate-900">Chatbot Control Center</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-2xl border border-teal-100 bg-teal-50 px-4 py-2 text-sm text-teal-800 md:block">
            Streaming, analytics, and integrations are live.
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-teal-500/20">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.company || "No company set"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
