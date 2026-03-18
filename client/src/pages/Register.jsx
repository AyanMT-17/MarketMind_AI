"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
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
    } catch {
      addToast("An error occurred during registration", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-background min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="auth-panel order-2 rounded-[2.5rem] p-8 sm:p-10 lg:order-1">
          <p className="editorial-eyebrow text-xs font-semibold uppercase">Create your account</p>
          <h1 className="editorial-title mt-3 text-4xl font-semibold text-[#1f201d]">Launch a business-ready chatbot workspace</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6a6055]">
            Set up your studio, define your brand context, and start building assistants for support, lead capture, and customer conversations.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="Ayan" />
              <Input label="Last name" name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Shah" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Work email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@company.com" />
              <Input label="Company" name="company" required value={formData.company} onChange={handleChange} placeholder="Acme Inc." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="Minimum 8 characters" />
              <Input label="Confirm password" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" />
            </div>

            <label className="flex items-start gap-3 rounded-[1.5rem] border border-[#eadbc7] bg-[#fffaf1] p-4 text-sm text-[#5f564b]">
              <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-[#d8c5af] text-[#3fc46f] focus:ring-[#dff5e3]" />
              <span>
                I agree to the <a href="#" className="font-semibold text-[#249a52]">Terms of Service</a> and{" "}
                <a href="#" className="font-semibold text-[#249a52]">Privacy Policy</a>.
              </span>
            </label>

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {loading ? "Creating account..." : "Create workspace"}
            </Button>
          </form>

          <p className="mt-8 text-sm text-[#6a6055]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#249a52] transition hover:text-[#1f201d]">
              Sign in
            </Link>
          </p>
        </section>

        <section className="order-1 flex flex-col justify-between rounded-[2.5rem] border border-[#eadbc7] bg-[rgba(255,250,241,0.72)] p-8 shadow-[0_28px_72px_rgba(77,56,24,0.08)] backdrop-blur-xl sm:p-10 lg:order-2">
          <div>
            <div className="auth-badge inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#249a52]">
              Setup takes a few minutes and supports live testing right away
            </div>
            <h2 className="editorial-title mt-6 text-5xl font-semibold leading-[0.95] text-[#1f201d] md:text-7xl">
              Build calm, capable support experiences for your customers.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#5f564b]">
              From the first welcome message to integrations and escalation flows, every piece of the assistant can be shaped around your business.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Custom prompts and welcome flows",
              "Lead capture and escalation settings",
              "Conversation and usage analytics",
            ].map((item) => (
              <div key={item} className="rounded-[1.8rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                <p className="text-sm font-medium leading-6 text-[#1f201d]">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register
