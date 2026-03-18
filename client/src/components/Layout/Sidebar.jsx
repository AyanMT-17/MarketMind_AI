"use client"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "grid" },
    { name: "New Chatbot", href: "/chatbots/new", icon: "spark" },
    { name: "Ad Campaigns", href: "/campaigns", icon: "campaign" },
    { name: "Business Prediction", href: "/predictions", icon: "chart" },
  ]

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(`${href}/`)

  const renderIcon = (icon) => {
    if (icon === "grid") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z" />
        </svg>
      )
    }

    if (icon === "campaign") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }

    if (icon === "chart") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }

    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      </svg>
    )
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 
        bg-[linear-gradient(180deg,_#092f33_0%,_#0d3b44_30%,_#102b39_100%)]
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/30">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">MarketMind</h1>
            <p className="text-xs text-cyan-200/70">AI Chatbot Platform</p>
          </div>
        </div>

        <nav className="mt-6 px-4">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-cyan-100/50">
            Main Menu
          </p>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${isActive(item.href)
                    ? "border border-cyan-300/20 bg-gradient-to-r from-cyan-400/20 to-teal-400/10 text-white shadow-lg shadow-cyan-500/10"
                    : "text-cyan-100/70 hover:bg-white/5 hover:text-white"
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">{renderIcon(item.icon)}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mx-4 mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-cyan-50">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">What&apos;s New</p>
          <h2 className="mt-2 text-sm font-semibold">Real-time assistant delivery</h2>
          <p className="mt-2 text-sm text-cyan-100/70">
            Build a bot, test integrations, then stream replies live with token and usage tracking.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 font-semibold text-white">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user.name || "User"}</p>
                <p className="truncate text-xs text-cyan-200/70">{user.email || "user@example.com"}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-cyan-100/70 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
          >
            <span className="mr-3 text-lg">⇠</span>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
