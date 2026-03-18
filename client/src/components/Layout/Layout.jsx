"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="editorial-shell flex h-screen">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

export default Layout
