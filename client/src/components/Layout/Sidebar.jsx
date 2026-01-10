"use client"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Campaigns", href: "/campaigns", icon: "📢" },
    { name: "AI Content", href: "/campaign-builder", icon: "✨" },
    { name: "Forecasting", href: "/forecasting", icon: "📈" },
    { name: "Leads", href: "/leads", icon: "👥" },
    { name: "Campaign Builder", href: "/Campaign_creation", icon: "🎨" },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 
        bg-gradient-to-b from-slate-900 via-emerald-950 to-teal-950
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo Header */}
        <div className="flex items-center gap-3 h-20 px-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">MarketMind</h1>
            <p className="text-xs text-emerald-300/70">AI Marketing Suite</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <p className="px-4 text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-3">
            Main Menu
          </p>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive(item.href)
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border-l-4 border-emerald-400 shadow-lg shadow-emerald-500/10"
                    : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName || 'User'}
                </p>
                <p className="text-xs text-emerald-300/70 truncate">
                  {user.email || 'user@example.com'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-emerald-100/70 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <span className="mr-3 text-lg">🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
