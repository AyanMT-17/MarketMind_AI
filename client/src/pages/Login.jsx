"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      if (result.message) {
        addToast("Login successful!", "success")
      } else {
        addToast(result.error || "Login failed", "error")
      }
    } catch {
      addToast("An error occurred during login", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-background min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[2.5rem] border border-[#eadbc7] bg-[rgba(255,250,241,0.72)] p-8 shadow-[0_28px_72px_rgba(77,56,24,0.08)] backdrop-blur-xl sm:p-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
                </svg>
              </div>
              <div>
                <p className="editorial-eyebrow text-xs font-semibold uppercase">MarketMind AI</p>
                <h1 className="text-lg font-semibold text-[#1f201d]">Business support workspace</h1>
              </div>
            </div>

            <div className="mt-12">
              <div className="auth-badge inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#249a52]">
                Real-time chatbots for support, sales, and lead capture
              </div>
              <h2 className="editorial-title mt-6 max-w-3xl text-5xl font-semibold leading-[0.95] text-[#1f201d] md:text-7xl">
                Support that looks human, moves fast, and stays on brand.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#5f564b]">
                Build assistants with your company voice, connect APIs, capture qualified leads, and monitor every conversation from one calm workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Live replies", value: "SSE + Socket" },
              { label: "Business signals", value: "Lead + Escalation" },
              { label: "Analytics", value: "Usage intelligence" },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.8rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a7b69]">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-[#1f201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-panel flex items-center rounded-[2.5rem] p-8 sm:p-10">
          <div className="w-full">
            <p className="editorial-eyebrow text-xs font-semibold uppercase">Welcome back</p>
            <h3 className="editorial-title mt-3 text-4xl font-semibold text-[#1f201d]">Sign in to your studio</h3>
            <p className="mt-3 text-sm leading-6 text-[#6a6055]">
              Pick up where you left off and continue shaping your business chatbot experience.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-[#6a6055]">
                  <input type="checkbox" className="mr-2 h-4 w-4 rounded border-[#d8c5af] text-[#3fc46f] focus:ring-[#dff5e3]" />
                  Keep me signed in
                </label>
                <a href="#" className="font-medium text-[#249a52] transition hover:text-[#1f201d]">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" loading={loading} size="lg" className="w-full">
                {loading ? "Signing in..." : "Enter workspace"}
              </Button>
            </form>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="rounded-full border border-[#dfcfbb] bg-[#fffaf1] px-4 py-3 text-sm font-medium text-[#4f473d] transition hover:bg-[#f4ebdd]">
                Continue with Google
              </button>
              <button className="rounded-full border border-[#dfcfbb] bg-[#fffaf1] px-4 py-3 text-sm font-medium text-[#4f473d] transition hover:bg-[#f4ebdd]">
                Continue with GitHub
              </button>
            </div>

            <p className="mt-8 text-sm text-[#6a6055]">
              New to MarketMind AI?{" "}
              <Link to="/register" className="font-semibold text-[#249a52] transition hover:text-[#1f201d]">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
