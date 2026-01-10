"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/UI/Button"

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { addToast } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match", "error")
      return
    }

    setLoading(true)

    try {
      const result = await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.company
      )
      if (result.success) {
        addToast("Registration successful!", "success")
      } else {
        addToast(result.error || "Registration failed", "error")
      }
    } catch (error) {
      addToast("An error occurred during registration", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Floating orbs */}
      <div className="floating-orb orb-1"></div>
      <div className="floating-orb orb-2"></div>
      <div className="floating-orb orb-3"></div>

      <div className="max-w-xl w-full space-y-8 relative z-10">
        {/* Logo & Header */}
        <div className="text-center animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="logo-icon">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Join <span className="text-gradient">MarketMind AI</span>
          </h1>
          <p className="text-emerald-200/80 text-lg">
            Start your free 14-day trial today
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card rounded-2xl p-8 animate-fade-in-up stagger-1">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Name Row - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <div className="relative">
                  <span className="input-icon">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="input-premium input-with-icon block w-full px-4 py-3 rounded-xl bg-gray-50"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div className="relative">
                  <span className="input-icon">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="input-premium input-with-icon block w-full px-4 py-3 rounded-xl bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
              <div className="relative">
                <span className="input-icon">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="input-premium input-with-icon block w-full px-4 py-3 rounded-xl bg-gray-50"
                />
              </div>
            </div>

            {/* Company */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <div className="relative">
                <span className="input-icon">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <input
                  name="company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  className="input-premium input-with-icon block w-full px-4 py-3 rounded-xl bg-gray-50"
                />
              </div>
            </div>

            {/* Password Row - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <span className="input-icon">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="input-premium input-with-icon block w-full px-4 py-3 rounded-xl bg-gray-50"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <span className="input-icon">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="input-premium input-with-icon block w-full px-4 py-3 rounded-xl bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label className="ml-3 text-sm text-gray-600">
                I agree to the{" "}
                <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" loading={loading} className="w-full btn-premium py-3 text-base" size="lg">
              {loading ? "Creating account..." : "Create free account"}
            </Button>
          </form>

          {/* Features */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-4">What you'll get:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                "AI Content Generation",
                "Campaign Analytics",
                "Sales Forecasting",
                "Lead Management"
              ].map((feature, i) => (
                <div key={i} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
