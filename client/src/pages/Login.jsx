"use client"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Sparkles, ArrowRight } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import Card from "../components/UI/Card"

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(formData.email, formData.password)
      navigate("/dashboard")
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[1000px] overflow-hidden rounded-[2.5rem] border border-[#eadbc7] bg-[rgba(255,251,245,0.88)] shadow-[0_24px_64px_rgba(71,50,19,0.1)] backdrop-blur-xl lg:grid lg:grid-cols-[1fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-[linear-gradient(135deg,_#f4ebdd_0%,_#dff5e3_100%)] p-12 lg:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="editorial-title mt-8 text-4xl font-semibold leading-tight text-[#1f201d]">
              Welcome back to your strategic workspace.
            </h1>
          </div>
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-[rgba(255,255,255,0.6)] p-5 backdrop-blur-md">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#249a52]">Market Validation</p>
              <p className="mt-2 text-sm leading-6 text-[#4f473d]">
                Review your latest market analysis and refine your product positioning before launch.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[rgba(255,255,255,0.6)] p-5 backdrop-blur-md">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#249a52]">100-Day Planning</p>
              <p className="mt-2 text-sm leading-6 text-[#4f473d]">
                Pick up where you left off and continue shaping your startup's execution timeline.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 lg:mt-0">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1f201d]">Sign in to MarketMind</h2>
            <p className="mt-2 text-sm text-[#6a6055]">Enter your credentials to access your projects.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="founder@example.com"
              />
              <Input
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to workspace"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6a6055]">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-[#1f201d] transition hover:text-[#249a52]">
              Start planning
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
