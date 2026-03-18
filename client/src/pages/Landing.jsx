"use client"

import { Link } from "react-router-dom"
import { ArrowUpRight, Brain, MessageSquareMore, ShieldCheck, Sparkles } from "lucide-react"
import Button from "../components/UI/Button"

export default function Landing() {
  const features = [
    {
      title: "Build your assistant voice",
      description: "Shape welcome messages, prompts, and business context so every reply feels tailored to your company.",
      icon: Brain,
    },
    {
      title: "Capture intent in real time",
      description: "Track leads, escalations, and customer signals while streaming conversations live through SSE and sockets.",
      icon: MessageSquareMore,
    },
    {
      title: "Operate with confidence",
      description: "Monitor usage, analytics, and integrations from one clean studio designed for business workflows.",
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="auth-background min-h-screen">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[-0.03em] text-[#1f201d]">MarketMind AI</p>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a7b69]">Business chatbot studio</p>
          </div>
        </div>

        <div className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#5f564b] lg:flex">
          <a href="#features">What we do</a>
          <a href="#workflow">How it works</a>
          <a href="#cta">Get started</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Start free</Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
        <section className="rounded-[2.8rem] border border-[#eadbc7] bg-[rgba(255,251,245,0.72)] px-8 py-10 shadow-[0_30px_76px_rgba(77,56,24,0.08)] backdrop-blur-xl sm:px-10 lg:px-12 lg:py-14">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="auth-badge inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#249a52]">
                Support-first AI design for modern businesses
              </div>
              <h1 className="editorial-title mt-8 text-6xl font-semibold leading-[0.9] text-[#1f201d] md:text-8xl">
                Calm chatbots,
                <span className="block">serious business impact.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f564b]">
                Create branded assistants, connect customer-facing APIs, capture leads, and monitor every conversation from a workspace built for support and growth.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg">Create workspace</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">See the studio</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2.4rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,_#f4ebdd_0%,_#dff5e3_100%)] p-6">
                  <div className="flex min-h-64 items-end rounded-[1.8rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.78),_rgba(255,250,241,0.55))] p-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[#8a7b69]">Live support preview</p>
                      <p className="mt-3 text-2xl font-semibold leading-tight text-[#1f201d]">
                        Bot replies stream in real time and escalate gracefully when the conversation needs a person.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Streaming", value: "SSE + Socket" },
                  { label: "Signals", value: "Leads + Escalations" },
                  { label: "Insights", value: "Analytics ready" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.7rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#8a7b69]">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold text-[#1f201d]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="auth-badge inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#249a52]">What we do</p>
            <h2 className="editorial-title mt-6 text-4xl font-semibold leading-tight text-[#1f201d] md:text-6xl">
              Give your team a chatbot studio that feels polished and works like an operator.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="rounded-[2rem] border border-[#eadbc7] bg-[rgba(255,251,245,0.82)] p-7 shadow-[0_18px_44px_rgba(77,56,24,0.06)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f201d] text-[#fffaf1]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#1f201d]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5f564b]">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="workflow" className="rounded-[2.6rem] border border-[#eadbc7] bg-[#fffaf1] px-8 py-12 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              "Define the business profile, products, goals, and support channels your chatbot should represent.",
              "Attach integrations, configure lead capture and escalation rules, then test the live reply flow.",
              "Review analytics, repeated questions, token usage, and conversation signals to refine the assistant.",
            ].map((step, index) => (
              <div key={step} className="rounded-[1.8rem] border border-[#eadbc7] bg-[#fbf4e8] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#249a52]">Step {index + 1}</p>
                <p className="mt-4 text-lg leading-8 text-[#1f201d]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="editorial-title text-4xl font-semibold text-[#1f201d] md:text-6xl">
              Ready to design support that feels more human?
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5f564b]">
              Start building a business chatbot that knows your brand, your workflows, and when to bring a real teammate into the conversation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg">Get started</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="gap-2">
                  Explore studio
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
