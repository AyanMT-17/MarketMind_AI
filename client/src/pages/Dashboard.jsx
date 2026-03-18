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
          <p className="mt-4 text-[#6a6055]">Loading chatbot workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-[#eadbc7] bg-[linear-gradient(135deg,_rgba(255,251,245,0.95)_0%,_rgba(247,236,217,0.92)_55%,_rgba(223,245,227,0.85)_120%)] p-8 text-[#1f201d] shadow-[0_28px_70px_rgba(77,56,24,0.08)]">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div>
            <p className="editorial-eyebrow text-xs font-semibold uppercase">Business AI workspace</p>
            <h1 className="editorial-title mt-4 max-w-2xl text-4xl font-semibold leading-tight">
              Launch business-ready chatbots that qualify leads, handle support, and escalate to your team.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f564b]">
              Configure company context, products, CTAs, support channels, and integrations so each assistant can help customers,
              capture intent, and drive real business outcomes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/chatbots/new">
                <Button size="lg">Create business bot</Button>
              </Link>
              <Button variant="secondary" size="lg" onClick={refresh}>
                Refresh workspace
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Chatbots", value: stats.total },
              { label: "Active", value: stats.active },
              { label: "Draft", value: stats.draft },
              { label: "Integrations", value: stats.integrations },
              { label: "Lead bots", value: stats.leadBots },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.8rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                <p className="text-sm text-[#7a6f61]">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#1f201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1f201d]">Your chatbot fleet</h2>
          <p className="mt-1 text-[#6a6055]">Search, edit, chat with, and inspect each assistant from one place.</p>
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
        <Card hover={false} className="rounded-[2rem] border-dashed border-[#d8c5af] bg-[rgba(255,251,245,0.86)] py-16 text-center">
          <p className="text-lg font-semibold text-[#1f201d]">No chatbots yet</p>
          <p className="mt-2 text-[#6a6055]">Create your first business assistant and start testing lead capture and support flows.</p>
          <Link to="/chatbots/new" className="mt-6 inline-flex">
            <Button>Create first chatbot</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredChatbots.map((chatbot) => (
            <Card key={chatbot._id} hover={false} className="rounded-[1.9rem] bg-[rgba(255,251,245,0.88)]">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-[#1f201d]">{chatbot.name}</h3>
                      <span className="rounded-full bg-[#f3e7d4] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#6a6055]">
                        {chatbot.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#6a6055]">
                      {chatbot.description || "No description yet. Add one in the builder to explain this assistant's role."}
                    </p>
                    {chatbot.businessProfile?.industry || chatbot.businessProfile?.targetAudience ? (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#249a52]">
                        {[chatbot.businessProfile?.industry, chatbot.businessProfile?.targetAudience].filter(Boolean).join(" • ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-full bg-[#eef9ef] px-3 py-2 text-xs font-semibold text-[#249a52]">
                    {(chatbot.integrations?.length || 0)} integrations
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Model</p>
                    <p className="mt-2 text-sm font-semibold text-[#1f201d]">{chatbot.config?.model || "Default"}</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Temperature</p>
                    <p className="mt-2 text-sm font-semibold text-[#1f201d]">{chatbot.config?.temperature ?? 0.7}</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Tokens</p>
                    <p className="mt-2 text-sm font-semibold text-[#1f201d]">{chatbot.config?.maxTokens ?? 1024}</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Lead capture</p>
                    <p className="mt-2 text-sm font-semibold text-[#1f201d]">{chatbot.automation?.leadCaptureEnabled ? "On" : "Off"}</p>
                  </div>
                </div>

                {(chatbot.businessProfile?.goals?.length || chatbot.automation?.primaryCallToAction) ? (
                  <div className="rounded-[1.6rem] bg-[#eef9ef] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#249a52]">Business focus</p>
                    <p className="mt-2 text-sm text-[#4f473d]">
                      {chatbot.businessProfile?.goals?.length ? `Goals: ${chatbot.businessProfile.goals.join(", ")}. ` : ""}
                      {chatbot.automation?.primaryCallToAction ? `Primary CTA: ${chatbot.automation.primaryCallToAction}.` : ""}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Link to={`/chatbots/${chatbot._id}/chat`}>
                    <Button>Open chat</Button>
                  </Link>
                  <Link to={`/chatbots/${chatbot._id}/edit`}>
                    <Button variant="outline">Edit builder</Button>
                  </Link>
                  <Link to={`/chatbots/${chatbot._id}/analytics`}>
                    <Button variant="secondary">View analytics</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => handleKey(chatbot._id)}>
                    Copy deployment key
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
