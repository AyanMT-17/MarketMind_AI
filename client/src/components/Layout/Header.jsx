"use client"
import { useAuth } from "../../contexts/AuthContext"

function Header({ toggleSidebar }) {
  const { user } = useAuth()
  const initial = (user?.name?.charAt(0) || user?.firstName?.charAt(0) || "U").toUpperCase()

  return (
    <header className="border-b border-[#eadbc7] bg-[rgba(255,251,245,0.72)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded-full border border-[#dfcfbb] bg-[#fffaf1] p-2.5 text-[#5f564b] transition hover:border-[#cdb79d] hover:bg-[#f4ebdd] lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <p className="editorial-eyebrow text-xs font-semibold uppercase">MarketMind AI</p>
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-[#1f201d]">Business chatbot studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-full border border-[#cfeace] bg-[#eef9ef] px-4 py-2 text-sm font-medium text-[#249a52] md:block">
            Live systems operational
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f201d] text-sm font-bold text-[#fffaf1]">
              {initial}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-[#1f201d]">{user?.name || "Workspace user"}</p>
              <p className="text-xs text-[#7a6f61]">{user?.company || "No company set"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
