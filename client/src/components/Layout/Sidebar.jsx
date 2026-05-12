"use client"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "grid" }
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
          className="fixed inset-0 z-40 bg-[#1f201d]/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-76 transform border-r border-[#eadbc7]
          bg-[linear-gradient(180deg,_rgba(255,251,245,0.97)_0%,_rgba(247,236,217,0.96)_100%)]
          shadow-[0_24px_64px_rgba(71,50,19,0.1)] transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-22 items-center gap-3 border-b border-[#eadbc7] px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1] shadow-[0_16px_32px_rgba(31,32,29,0.18)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.04em] text-[#1f201d]">MarketMind</h1>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a7b69]">Strategy AI</p>
          </div>
        </div>

        <nav className="px-4 py-6">
          <p className="select-none px-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#8a7b69]">
            Workspace
          </p>
          <div className="mt-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`
                  flex select-none items-center rounded-full px-4 py-3 text-sm font-medium transition-all
                  selection:bg-transparent selection:text-current
                  ${isActive(item.href)
                    ? "border border-[#cfeace] bg-[#eef9ef] text-[#1f201d] shadow-[0_16px_30px_rgba(63,196,111,0.12)]"
                    : "text-[#544b40] hover:bg-[#fffaf1] hover:text-[#1f201d]"
                  }
                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3 shrink-0 text-current">{renderIcon(item.icon)}</span>
                <span className="text-current">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="mx-4 rounded-[1.8rem] border border-[#dfeede] bg-[linear-gradient(180deg,_#eef9ef_0%,_#dff5e3_100%)] p-5 text-[#1f201d]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#249a52]">Studio note</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.04em]">Iterate on your product vision</h2>
          <p className="mt-2 text-sm leading-6 text-[#4f473d]">
            Use the strategy engines to validate your idea, build a launch plan, and refine your pitch before you code.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-[#eadbc7] p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-[1.5rem] bg-[#fffaf1] px-4 py-3 shadow-[0_14px_30px_rgba(77,56,24,0.08)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f201d] font-semibold text-[#fffaf1]">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1f201d]">{user.name || "Workspace user"}</p>
                <p className="truncate text-xs text-[#7a6f61]">{user.email || "user@example.com"}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center rounded-full border border-[#dfcfbb] bg-[#fffaf1] px-4 py-3 text-sm font-medium text-[#5f564b] transition hover:bg-[#f3e7d4] hover:text-[#1f201d]"
          >
            <span className="mr-3 text-lg">↩</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
