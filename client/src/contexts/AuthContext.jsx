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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
      const response = await fetch(`${import.meta.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      console.log("Login response:", data)

      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userData", JSON.stringify(data.user))
      setIsAuthenticated(true)
      setUser(data.user)

      return { success: true, message: "Login successful" }
    } catch (error) {
      return { success: false, error: "Login failed" }
    }
  }

  const register = async (firstName, lastName, email, password, company) => {
    try {
      // API call to backend register endpoint
      const response = await fetch(`${import.meta.VITE_API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, company }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.message || "Registration failed" }
      }

      const data = await response.json()

      const userData = {
        id: data.user._id || 1,
        firstName: data.user.profile.firstName || firstName,
        lastName: data.user.profile.lastName || lastName,
        email: data.user.email || email,
        company: data.user.profile.company || company,
      }

      localStorage.setItem("authToken", data.token)
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
