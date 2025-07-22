"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (simulate checking localStorage/token)
    const token = localStorage.getItem("authToken")
    const userData = localStorage.getItem("userData")

    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Simulate API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      // Simulate successful login
      const userData = {
        id: 1,
        name: "John Doe",
        email: email,
        company: "MarketMind AI",
      }

      localStorage.setItem("authToken", "sample-token")
      localStorage.setItem("userData", JSON.stringify(userData))

      setIsAuthenticated(true)
      setUser(userData)

      return { success: true }
    } catch (error) {
      return { success: false, error: "Login failed" }
    }
  }

  const register = async (name, email, password, company) => {
    try {
      // Simulate API call
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company }),
      })

      // Simulate successful registration
      const userData = {
        id: 1,
        name: name,
        email: email,
        company: company,
      }

      localStorage.setItem("authToken", "sample-token")
      localStorage.setItem("userData", JSON.stringify(userData))

      setIsAuthenticated(true)
      setUser(userData)

      return { success: true }
    } catch (error) {
      return { success: false, error: "Registration failed" }
    }
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    setIsAuthenticated(false)
    setUser(null)
  }

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
