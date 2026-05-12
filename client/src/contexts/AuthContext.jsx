/* eslint-disable react-refresh/only-export-components */
"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getApiBaseUrl } from "../lib/api"
import { fetchWithRetry } from "../lib/api-with-retry"

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
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedToken = localStorage.getItem("authToken")
    const savedUserData = localStorage.getItem("userData")

    if (savedToken && savedUserData) {
      try {
        const normalizedUser = normalizeUser(JSON.parse(savedUserData))
        setIsAuthenticated(true)
        setUser(normalizedUser)
        setToken(savedToken)
      } catch (e) {
        console.error("Error parsing saved user data", e)
        localStorage.removeItem("authToken")
        localStorage.removeItem("userData")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetchWithRetry(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }, 2)

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Failed to parse JSON response');
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many login attempts. Please wait 5-10 minutes before trying again.");
        }
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("authToken", data.token)
      const normalizedUser = normalizeUser(data.user)
      localStorage.setItem("userData", JSON.stringify(normalizedUser))
      
      setIsAuthenticated(true)
      setUser(normalizedUser)
      setToken(data.token)

      return { success: true }
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  }

  const register = async (userDataOrFirstName, lastName, email, password, company) => {
    try {
      // Handle both object and multi-arg calls
      const userData = typeof userDataOrFirstName === 'object' 
        ? userDataOrFirstName 
        : { firstName: userDataOrFirstName, lastName, email, password, company };

      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Failed to parse JSON response');
      }

      if (!response.ok) {
        const errorMessage = data.message || (data.errors ? data.errors.join(", ") : "Registration failed");
        throw new Error(errorMessage);
      }

      localStorage.setItem("authToken", data.token)
      const normalizedUser = normalizeUser(data.user)
      localStorage.setItem("userData", JSON.stringify(normalizedUser))

      setIsAuthenticated(true)
      setUser(normalizedUser)
      setToken(data.token)

      return { success: true }
    } catch (error) {
      console.error("Registration Error:", error);
      throw error;
    }
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    setIsAuthenticated(false)
    setUser(null)
    setToken(null)
  }

  const value = {
    isAuthenticated,
    user,
    token,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
