"use client"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Sparkles, ArrowRight } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
  })
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(formData)
      navigate("/dashboard")
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-background flex min-h-screen items-center justify-center p-4 py-12">
      <div className="w-full max-w-[1000px] overflow-hidden rounded-[2.5rem] border border-[#eadbc7] bg-[rgba(255,251,245,0.88)] shadow-[0_24px_64px_rgba(71,50,19,0.1)] backdrop-blur-xl lg:grid lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#1f201d]">MarketMind AI</span>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1f201d]">Create your account</h2>
            <p className="mt-2 text-sm text-[#6a6055]">Join founders defining their strategy with AI.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Steve"
              />
              <Input
                label="Last name"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Jobs"
              />
            </div>
            <Input
              label="Startup or Company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Acme Corp (Optional)"
            />
            <Input
              label="Work email"
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
              placeholder="Min 6 characters"
            />

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Start planning"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6a6055]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#1f201d] transition hover:text-[#249a52]">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden bg-[linear-gradient(135deg,_#f4ebdd_0%,_#dff5e3_100%)] p-12 lg:block">
          <div className="h-full rounded-[2rem] border border-[#eadbc7] bg-[rgba(255,255,255,0.5)] p-8 shadow-sm backdrop-blur-sm">
            <div className="auth-badge inline-flex rounded-full px-3 py-1.5 text-xs font-medium text-[#249a52]">
              The Strategic Co-Founder
            </div>
            <h1 className="editorial-title mt-6 text-4xl font-semibold leading-tight text-[#1f201d]">
              Launch a validated startup project.
            </h1>
            <ul className="mt-8 space-y-6">
              {[
                { title: "Define your product", desc: "Input your core features and target audience." },
                { title: "Analyze competitors", desc: "Let AI find market gaps and weaknesses." },
                { title: "Execute the playbook", desc: "Get a 100-day realistic growth strategy." },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f201d] text-xs font-medium text-[#fffaf1]">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1f201d]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#5f564b]">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
