"use client"

import { Link } from "react-router-dom"
import { Sparkles, Compass, ShieldCheck, Zap } from "lucide-react"
import Button from "../components/UI/Button"

function Landing() {
  const features = [
    {
      title: "Market Validation Engine",
      description: "Define your product and let AI assess the market need and sentiment before you build.",
      icon: Compass,
    },
    {
      title: "Deep Competitor Takedowns",
      description: "Analyze competitor weaknesses to find your unique advantage and go-to-market angle.",
      icon: Zap,
    },
    {
      title: "100-Day Reality Checker",
      description: "Project realistic growth metrics and construct a day-by-day organic launch playbook.",
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
            <p className="text-xs uppercase tracking-[0.28em] text-[#8a7b69]">Strategic Co-Founder Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Start planning</Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
        <section className="rounded-[2.8rem] border border-[#eadbc7] bg-[rgba(255,251,245,0.72)] px-8 py-10 shadow-[0_30px_76px_rgba(77,56,24,0.08)] backdrop-blur-xl sm:px-10 lg:px-12 lg:py-14">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="auth-badge inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#249a52]">
                Your AI Co-Founder in a Box
              </div>
              <h1 className="editorial-title mt-8 text-6xl font-semibold leading-[0.9] text-[#1f201d] md:text-8xl">
                Validate ideas.
                <span className="block text-[#7a6f61]">Before you write code.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f564b]">
                Give your startup a strategic edge. Define your product, analyze competitors, and let AI generate a realistic 100-day execution plan.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg">Start your project</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2.4rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,_#f4ebdd_0%,_#dff5e3_100%)] p-6">
                  <div className="flex min-h-64 items-end rounded-[1.8rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.78),_rgba(255,250,241,0.55))] p-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[#8a7b69]">Pitch Simulator</p>
                      <p className="mt-3 text-2xl font-semibold leading-tight text-[#1f201d]">
                        Test your value prop against a skeptical AI investor to refine your pitch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="auth-badge inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#249a52]">Strategy Engines</p>
            <h2 className="editorial-title mt-6 text-4xl font-semibold leading-tight text-[#1f201d] md:text-6xl">
              Everything you need to plan a successful launch.
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

        <section id="cta" className="py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="editorial-title text-4xl font-semibold text-[#1f201d] md:text-6xl">
              Ready to validate your startup?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[#5f564b]">
              Start building your strategy, generating launch plans, and refining your pitch today.
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button size="lg">Create your first project</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#eadbc7] bg-[rgba(255,251,245,0.5)] px-5 py-8 text-center text-sm text-[#8a7b69] sm:px-8">
        <p>© {new Date().getFullYear()} MarketMind AI. The Strategic Co-Founder Suite.</p>
      </footer>
    </div>
  )
}

export default Landing
