"use client"

import { Link } from "react-router-dom"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"
import { deleteChatbot, generateDeploymentKey, useChatbots } from "../hooks/useChatbot"

function Dashboard() {
  const { filteredChatbots, loading, error, search, setSearch, refresh } = useChatbots()
  const { addToast } = useToast()

  const stats = {
    total: filteredChatbots.length,
    active: filteredChatbots.filter((bot) => bot.status === "active").length,
    draft: filteredChatbots.filter((bot) => bot.status === "draft").length,
    integrations: filteredChatbots.reduce((sum, bot) => sum + (bot.integrations?.length || 0), 0),
    leadBots: filteredChatbots.filter((bot) => bot.automation?.leadCaptureEnabled).length,
  }

  const handleDelete = async (chatbotId) => {
    try {
      await deleteChatbot(chatbotId)
      addToast("Chatbot deleted", "success")
      refresh()
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleKey = async (chatbotId) => {
    try {
      const key = await generateDeploymentKey(chatbotId)
      await navigator.clipboard.writeText(key)
      addToast("Deployment key generated and copied", "success")
      refresh()
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-500">Loading chatbot workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,_#0f3c43_0%,_#125c63_35%,_#d9f8f8_130%)] p-8 text-white shadow-xl shadow-teal-900/10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Business AI Workspace</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
              Launch business-ready chatbots that qualify leads, handle support, and escalate to your team.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-cyan-50/80">
              Configure company context, products, CTAs, support channels, and integrations so each assistant can help customers,
              capture intent, and drive real business outcomes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/chatbots/new">
                <Button size="lg" className="border border-white/10 bg-white text-slate-900 hover:bg-cyan-50">
                  Create Business Bot
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={refresh}>
                Refresh Workspace
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Chatbots", value: stats.total },
              { label: "Active", value: stats.active },
              { label: "Draft", value: stats.draft },
              { label: "Integrations", value: stats.integrations },
              { label: "Lead Bots", value: stats.leadBots },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm text-cyan-50/70">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Your chatbot fleet</h2>
          <p className="mt-1 text-slate-500">Search, edit, chat with, and inspect each assistant from one place.</p>
        </div>
        <div className="w-full md:max-w-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by chatbot name, industry, or status"
          />
        </div>
      </section>

      {error ? (
        <Card hover={false} className="border-red-100 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : null}

      {filteredChatbots.length === 0 ? (
        <Card hover={false} className="rounded-[2rem] border-dashed border-slate-300 bg-white/90 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No chatbots yet</p>
          <p className="mt-2 text-slate-500">Create your first business assistant and start testing lead capture and support flows.</p>
          <Link to="/chatbots/new" className="mt-6 inline-flex">
            <Button>Create first chatbot</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredChatbots.map((chatbot) => (
            <Card key={chatbot._id} hover={false} className="rounded-[1.75rem] border border-slate-200/80 bg-white/90">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">{chatbot.name}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {chatbot.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {chatbot.description || "No description yet. Add one in the builder to explain this assistant's role."}
                    </p>
                    {chatbot.businessProfile?.industry || chatbot.businessProfile?.targetAudience ? (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-teal-600">
                        {[chatbot.businessProfile?.industry, chatbot.businessProfile?.targetAudience].filter(Boolean).join(" • ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">
                    {(chatbot.integrations?.length || 0)} integrations
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Model</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{chatbot.config?.model || "Default"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Temperature</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{chatbot.config?.temperature ?? 0.7}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tokens</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{chatbot.config?.maxTokens ?? 1024}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lead Capture</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{chatbot.automation?.leadCaptureEnabled ? "On" : "Off"}</p>
                  </div>
                </div>

                {(chatbot.businessProfile?.goals?.length || chatbot.automation?.primaryCallToAction) ? (
                  <div className="rounded-2xl bg-cyan-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Business focus</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {chatbot.businessProfile?.goals?.length ? `Goals: ${chatbot.businessProfile.goals.join(", ")}. ` : ""}
                      {chatbot.automation?.primaryCallToAction ? `Primary CTA: ${chatbot.automation.primaryCallToAction}.` : ""}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Link to={`/chatbots/${chatbot._id}/chat`}>
                    <Button>Open Chat</Button>
                  </Link>
                  <Link to={`/chatbots/${chatbot._id}/edit`}>
                    <Button variant="outline">Edit Builder</Button>
                  </Link>
                  <Link to={`/chatbots/${chatbot._id}/analytics`}>
                    <Button variant="secondary">View Analytics</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => handleKey(chatbot._id)}>
                    Copy Deployment Key
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(chatbot._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
