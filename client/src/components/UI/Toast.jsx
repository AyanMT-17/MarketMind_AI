"use client"

import { useEffect } from "react"

function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }

  return (
    <div
      className={`
      ${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg 
      transform transition-all duration-300 ease-in-out
      flex items-center space-x-2 min-w-80
    `}
    >
      <span className="text-lg">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200 ml-2">
        ✕
      </button>
    </div>
  )
}

export default Toast
