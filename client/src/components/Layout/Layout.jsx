"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.08),_transparent_30%),linear-gradient(180deg,_#f5fbfa_0%,_#eef6fb_100%)]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout
