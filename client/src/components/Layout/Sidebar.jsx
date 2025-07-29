"use client"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { NavLink } from 'react-router-dom';
function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const { logout } = useAuth()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Campaigns", href: "/campaigns", icon: "📢" },
    { name: "AI Content Generation", href: "/campaign-builder", icon: "🎨" },
    { name: "Sales Forecasting", href: "/forecasting", icon: "📈" },
    { name: "Campaign Builder", href: "/Campaign_creation", icon: "🎨" },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-green-900 to-teal-900 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-black bg-opacity-30">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">MarketMind AI</h1>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                  ${
                    isActive(item.href)
                      ? "bg-green-700 text-white"
                      : "text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white"
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

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-green-100 rounded-lg hover:bg-white hover:bg-opacity-10 hover:text-white transition-colors duration-200"
          >
            <span className="mr-3 text-lg">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
