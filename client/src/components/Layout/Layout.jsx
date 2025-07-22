"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gradient-to-r from-indigo-50 to-cyan-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-indigo-50 p-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout
