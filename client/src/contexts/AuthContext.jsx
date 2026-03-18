/* eslint-disable react-refresh/only-export-components */
"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getApiBaseUrl } from "../lib/api"

const AuthContext = createContext()

function normalizeUser(rawUser) {
  if (!rawUser) return null

  const profile = rawUser.profile || {}
  const firstName = rawUser.firstName || profile.firstName || ""
  const lastName = rawUser.lastName || profile.lastName || ""
  const company = rawUser.company || profile.company || ""

  return {
    ...rawUser,
    profile: {
      ...profile,
      firstName,
      lastName,
      company,
    },
    firstName,
    lastName,
    company,
    name: rawUser.name || [firstName, lastName].filter(Boolean).join(" ") || rawUser.email || "User",
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }) {
  const apiBaseUrl = getApiBaseUrl()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem("authToken")
    const userData = localStorage.getItem("userData")

    if (token && userData) {
      const normalizedUser = normalizeUser(JSON.parse(userData))
      setIsAuthenticated(true)
      setUser(normalizedUser)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: 'Failed to parse JSON response' };
      }

      if (!response.ok) {
        const errorMessage = data.message || "Login failed";
        console.error("Login Error from API:", errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log("Login response:", data)

      localStorage.setItem("authToken", data.token)
      const normalizedUser = normalizeUser(data.user)
      localStorage.setItem("userData", JSON.stringify(normalizedUser))
      setIsAuthenticated(true)
      setUser(normalizedUser)

      return { success: true, message: "Login successful" }
    } catch (error) {
      console.error("Login Exception:", error);
      return { success: false, error: "An error occurred during login" }
    }
  }

  const register = async (firstName, lastName, email, password, company) => {
    try {
      // API call to backend register endpoint
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, company }),
      })

      const rawText = await response.text();
      console.log('Raw API Response from backend:', rawText);
      let errorData;
      try {
        errorData = JSON.parse(rawText);
      } catch {
        errorData = { message: 'Failed to parse JSON response' };
      }

      if (!response.ok) {
        const errorMessage = errorData.message || (errorData.errors ? errorData.errors.join(", ") : "Registration failed");
        console.error("Registration Error from API:", errorMessage);
        return { success: false, error: errorMessage }
      }

      const data = errorData;

      const userData = normalizeUser({
        id: data.user._id || 1,
        firstName: data.user.profile.firstName || firstName,
        lastName: data.user.profile.lastName || lastName,
        email: data.user.email || email,
        company: data.user.profile.company || company,
        profile: {
          firstName: data.user.profile.firstName || firstName,
          lastName: data.user.profile.lastName || lastName,
          company: data.user.profile.company || company,
        },
      })

      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userData", JSON.stringify(userData))

      setIsAuthenticated(true)
      setUser(userData)

      return { success: true }
    } catch (error) {
      console.error("Registration Exception:", error);
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
