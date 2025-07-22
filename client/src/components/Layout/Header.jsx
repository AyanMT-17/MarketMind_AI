"use client"
import { useAuth } from "../../contexts/AuthContext"

function Header({ toggleSidebar }) {
  const { user } = useAuth()

  return (
    <header className="bg-indigo-50 shadow-md border-b border-indigo-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-indigo-500 hover:text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-indigo-900">{user?.name}</p>
              <p className="text-xs text-indigo-600">{user?.company}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
