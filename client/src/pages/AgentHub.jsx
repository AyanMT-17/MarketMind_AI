"use client"

import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Button from "../components/UI/Button"
import Card from "../components/UI/Card"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"
import {
  approveAgentRun,
  runAgent,
  saveEmailSettings,
  testEmailSettings,
  useAgentCatalog,
  useAgentHistory,
} from "../hooks/useAgents"
import { useChatbots } from "../hooks/useChatbot"
import { getApiBaseUrl } from "../lib/api"

const agentLabels = {
  email: "Email Agent",
  sales_recommendation: "Sales Recommendation Agent",
  analytics_insight: "Analytics Insight Agent",
  forecast: "Forecast Agent",
}

const emptyEmailSettings = {
  providerType: "resend",
  senderName: "",
  senderEmail: "",
  resendApiKey: "",
  enabled: false,
}

function AgentHub() {
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedAgent = searchParams.get("agent") || "email"
  const requestedChatbotId = searchParams.get("chatbotId") || ""
  const { agents, emailSettings, loading: catalogLoading, error: catalogError, refresh: refreshCatalog, setEmailSettings } = useAgentCatalog()
  const { runs, loading: historyLoading, error: historyError, refresh: refreshHistory } = useAgentHistory()
  const { chatbots, loading: chatbotLoading } = useChatbots()
  const [businessMetrics, setBusinessMetrics] = useState([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [runningAgent, setRunningAgent] = useState("")
  const [approvingRun, setApprovingRun] = useState("")
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [emailConfig, setEmailConfig] = useState(emptyEmailSettings)
  const [emailInput, setEmailInput] = useState({
    recipient: "",
    prompt: "",
    chatbotId: requestedChatbotId,
    conversationId: "",
  })
  const [salesInput, setSalesInput] = useState({
    chatbotId: requestedChatbotId,
    conversationId: "",
    prompt: "",
  })
  const [analyticsInput, setAnalyticsInput] = useState({
    chatbotId: requestedChatbotId,
  })
  const [forecastInput, setForecastInput] = useState({
    businessMetricsId: "",
    predictionPeriod: "next_quarter",
    prompt: "",
  })

  useEffect(() => {
    if (emailSettings) {
      setEmailConfig((prev) => ({
        ...prev,
        ...emailSettings,
      }))
    }
  }, [emailSettings])

  useEffect(() => {
    setEmailInput((prev) => ({ ...prev, chatbotId: requestedChatbotId || prev.chatbotId }))
    setSalesInput((prev) => ({ ...prev, chatbotId: requestedChatbotId || prev.chatbotId }))
    setAnalyticsInput((prev) => ({ ...prev, chatbotId: requestedChatbotId || prev.chatbotId }))
  }, [requestedChatbotId])

  useEffect(() => {
    const fetchMetrics = async () => {
      setMetricsLoading(true)
      try {
        const response = await fetch(`${getApiBaseUrl()}/business-metrics`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Failed to load business metrics")
        }
        setBusinessMetrics(data.metrics || [])
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setMetricsLoading(false)
      }
    }

    fetchMetrics()
  }, [addToast])

  const activeAgent = agents.find((agent) => agent.type === requestedAgent)?.type || "email"
  const latestRunsByType = runs.reduce((acc, run) => {
    if (!acc[run.agentType]) {
      acc[run.agentType] = run
    }
    return acc
  }, {})

  const handleAgentChange = (agentType) => {
    const next = new URLSearchParams(searchParams)
    next.set("agent", agentType)
    setSearchParams(next)
  }

  const submitRun = async (payload, successMessage) => {
    setRunningAgent(payload.agentType)
    try {
      await runAgent(payload)
      addToast(successMessage, "success")
      await refreshHistory()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setRunningAgent("")
    }
  }

  const handleApprove = async (runId) => {
    setApprovingRun(runId)
    try {
      await approveAgentRun(runId)
      addToast("Email sent successfully", "success")
      await refreshHistory()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setApprovingRun("")
    }
  }

  const handleSaveEmailSettings = async () => {
    setSettingsSaving(true)
    try {
      const saved = await saveEmailSettings(emailConfig)
      setEmailSettings(saved)
      addToast("Email settings updated", "success")
      await refreshCatalog()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      const result = await testEmailSettings()
      addToast(result.message, result.success ? "success" : "error")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const renderRunSummary = (run) => {
    if (!run) {
      return "No run yet."
    }

    if (run.agentType === "email") {
      return run.output?.subject || "Draft ready"
    }
    if (run.agentType === "sales_recommendation") {
      return run.output?.recommendedOffering || "Sales recommendation generated"
    }
    return run.output?.summary || "Run completed"
  }

  if (catalogLoading || chatbotLoading || metricsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-[#eadbc7] bg-[linear-gradient(135deg,_rgba(255,251,245,0.96)_0%,_rgba(247,236,217,0.93)_55%,_rgba(223,245,227,0.88)_120%)] p-8 shadow-[0_28px_70px_rgba(77,56,24,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-eyebrow text-xs font-semibold uppercase">Agent hub</p>
            <h1 className="editorial-title mt-3 max-w-3xl text-4xl font-semibold text-[#1f201d]">
              Run built-in business agents for email, sales guidance, analytics insight, and forecasting.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f564b]">
              Every run is saved to history, and action-taking email drafts require explicit approval before they leave the app.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {agents.map((agent) => (
              <Button
                key={agent.type}
                variant={activeAgent === agent.type ? "primary" : "secondary"}
                onClick={() => handleAgentChange(agent.type)}
              >
                {agentLabels[agent.type]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {catalogError ? <Card hover={false} className="border-red-100 bg-red-50 text-red-700">{catalogError}</Card> : null}
      {historyError ? <Card hover={false} className="border-red-100 bg-red-50 text-red-700">{historyError}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card hover={false} className="rounded-[2rem] bg-[rgba(255,251,245,0.88)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#1f201d]">{agentLabels[activeAgent]}</h2>
                <p className="mt-1 text-sm text-[#6a6055]">{agents.find((agent) => agent.type === activeAgent)?.description}</p>
              </div>
              {requestedChatbotId ? (
                <Link to={`/chatbots/${requestedChatbotId}/edit`} className="text-sm font-medium text-[#249a52]">
                  Back to chatbot
                </Link>
              ) : null}
            </div>

            {activeAgent === "email" ? (
              <div className="mt-6 space-y-4">
                <Input
                  label="Recipient email"
                  value={emailInput.recipient}
                  onChange={(event) => setEmailInput((prev) => ({ ...prev, recipient: event.target.value }))}
                  placeholder="lead@example.com"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4f473d]">Chatbot context</label>
                    <select
                      value={emailInput.chatbotId}
                      onChange={(event) => setEmailInput((prev) => ({ ...prev, chatbotId: event.target.value }))}
                      className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    >
                      <option value="">No chatbot context</option>
                      {chatbots.map((chatbot) => (
                        <option key={chatbot._id} value={chatbot._id}>{chatbot.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Conversation ID"
                    value={emailInput.conversationId}
                    onChange={(event) => setEmailInput((prev) => ({ ...prev, conversationId: event.target.value }))}
                    placeholder="Optional conversation id"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4f473d]">Email purpose</label>
                  <textarea
                    value={emailInput.prompt}
                    onChange={(event) => setEmailInput((prev) => ({ ...prev, prompt: event.target.value }))}
                    rows={5}
                    className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    placeholder="Draft a follow-up that recaps pricing discussion and invites the lead to book a demo."
                  />
                </div>
                <Button
                  loading={runningAgent === "email"}
                  onClick={() => submitRun({ agentType: "email", ...emailInput }, "Email draft created")}
                >
                  Create draft
                </Button>
              </div>
            ) : null}

            {activeAgent === "sales_recommendation" ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4f473d]">Chatbot</label>
                    <select
                      value={salesInput.chatbotId}
                      onChange={(event) => setSalesInput((prev) => ({ ...prev, chatbotId: event.target.value }))}
                      className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    >
                      <option value="">Select chatbot</option>
                      {chatbots.map((chatbot) => (
                        <option key={chatbot._id} value={chatbot._id}>{chatbot.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Conversation ID"
                    value={salesInput.conversationId}
                    onChange={(event) => setSalesInput((prev) => ({ ...prev, conversationId: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4f473d]">Sales goal</label>
                  <textarea
                    value={salesInput.prompt}
                    onChange={(event) => setSalesInput((prev) => ({ ...prev, prompt: event.target.value }))}
                    rows={4}
                    className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    placeholder="Recommend the best plan for a mid-market lead asking about rollout speed."
                  />
                </div>
                <Button
                  loading={runningAgent === "sales_recommendation"}
                  onClick={() => submitRun({ agentType: "sales_recommendation", ...salesInput }, "Sales recommendation ready")}
                >
                  Generate recommendation
                </Button>
              </div>
            ) : null}

            {activeAgent === "analytics_insight" ? (
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4f473d]">Chatbot</label>
                  <select
                    value={analyticsInput.chatbotId}
                    onChange={(event) => setAnalyticsInput({ chatbotId: event.target.value })}
                    className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                  >
                    <option value="">Select chatbot</option>
                    {chatbots.map((chatbot) => (
                      <option key={chatbot._id} value={chatbot._id}>{chatbot.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  loading={runningAgent === "analytics_insight"}
                  onClick={() => submitRun({ agentType: "analytics_insight", ...analyticsInput }, "Analytics insight generated")}
                >
                  Generate insights
                </Button>
              </div>
            ) : null}

            {activeAgent === "forecast" ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4f473d]">Business metrics</label>
                    <select
                      value={forecastInput.businessMetricsId}
                      onChange={(event) => setForecastInput((prev) => ({ ...prev, businessMetricsId: event.target.value }))}
                      className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    >
                      <option value="">Select metrics set</option>
                      {businessMetrics.map((metric) => (
                        <option key={metric._id} value={metric._id}>{metric.businessName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4f473d]">Prediction period</label>
                    <select
                      value={forecastInput.predictionPeriod}
                      onChange={(event) => setForecastInput((prev) => ({ ...prev, predictionPeriod: event.target.value }))}
                      className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    >
                      <option value="next_quarter">Next quarter</option>
                      <option value="next_2_quarters">Next 2 quarters</option>
                      <option value="next_year">Next year</option>
                      <option value="next_2_years">Next 2 years</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4f473d]">Forecast prompt</label>
                  <textarea
                    value={forecastInput.prompt}
                    onChange={(event) => setForecastInput((prev) => ({ ...prev, prompt: event.target.value }))}
                    rows={4}
                    className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    placeholder="Focus on margin risk and the best near-term growth opportunities."
                  />
                </div>
                <Button
                  loading={runningAgent === "forecast"}
                  onClick={() => submitRun({ agentType: "forecast", ...forecastInput }, "Forecast generated")}
                >
                  Run forecast
                </Button>
              </div>
            ) : null}
          </Card>

          <Card hover={false} className="rounded-[2rem] bg-[rgba(255,251,245,0.88)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#1f201d]">Email sending settings</h2>
                <p className="mt-1 text-sm text-[#6a6055]">Configure the account-level sender for approved Email Agent drafts.</p>
              </div>
              <Button variant="outline" onClick={handleTestEmail}>Test setup</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4f473d]">Provider</label>
                <select
                  value={emailConfig.providerType}
                  onChange={(event) => setEmailConfig((prev) => ({ ...prev, providerType: event.target.value }))}
                  className="block w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                >
                  <option value="resend">Resend</option>
                  <option value="smtp">SMTP</option>
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-[1.4rem] bg-[#fffaf1] px-4 py-3 text-sm text-[#4f473d]">
                <input
                  type="checkbox"
                  checked={Boolean(emailConfig.enabled)}
                  onChange={(event) => setEmailConfig((prev) => ({ ...prev, enabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-[#d8c5af]"
                />
                Enable sending for approved drafts
              </label>
              <Input
                label="Sender name"
                value={emailConfig.senderName || ""}
                onChange={(event) => setEmailConfig((prev) => ({ ...prev, senderName: event.target.value }))}
              />
              <Input
                label="Sender email"
                value={emailConfig.senderEmail || ""}
                onChange={(event) => setEmailConfig((prev) => ({ ...prev, senderEmail: event.target.value }))}
              />
            </div>
            {emailConfig.providerType === "resend" ? (
              <div className="mt-4">
                <Input
                  label="Resend API key"
                  type="password"
                  value={emailConfig.resendApiKey || ""}
                  onChange={(event) => setEmailConfig((prev) => ({ ...prev, resendApiKey: event.target.value }))}
                />
              </div>
            ) : (
              <p className="mt-4 rounded-[1.4rem] bg-[#fbf4e8] px-4 py-3 text-sm text-[#6a6055]">
                SMTP config can be saved, but v1 runtime delivery is enabled through Resend. Use Resend for direct sending from the app.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <Button onClick={handleSaveEmailSettings} loading={settingsSaving}>Save email settings</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="rounded-[2rem] bg-[rgba(255,251,245,0.88)]">
            <h2 className="text-2xl font-semibold text-[#1f201d]">Latest output</h2>
            <p className="mt-1 text-sm text-[#6a6055]">Quick view of the most recent run for the active agent.</p>
            <div className="mt-5 rounded-[1.6rem] bg-[#fffaf1] p-5">
              {latestRunsByType[activeAgent] ? (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">{latestRunsByType[activeAgent].status}</p>
                  <p className="mt-3 text-sm leading-7 text-[#4f473d]">{renderRunSummary(latestRunsByType[activeAgent])}</p>
                  {activeAgent === "email" ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-semibold text-[#1f201d]">{latestRunsByType[activeAgent].output?.subject}</p>
                      <p className="whitespace-pre-wrap text-sm text-[#4f473d]">{latestRunsByType[activeAgent].output?.body}</p>
                      {latestRunsByType[activeAgent].status === "needs_approval" ? (
                        <Button
                          onClick={() => handleApprove(latestRunsByType[activeAgent].id)}
                          loading={approvingRun === latestRunsByType[activeAgent].id}
                        >
                          Approve and send
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {activeAgent !== "email" && latestRunsByType[activeAgent].output?.recommendations ? (
                    <div className="mt-4 space-y-2">
                      {latestRunsByType[activeAgent].output.recommendations.slice(0, 3).map((item) => (
                        <p key={item} className="rounded-[1.3rem] bg-[#eef9ef] px-4 py-3 text-sm text-[#4f473d]">{item}</p>
                      ))}
                    </div>
                  ) : null}
                  {activeAgent === "sales_recommendation" ? (
                    <div className="mt-4 rounded-[1.4rem] bg-[#eef9ef] p-4 text-sm text-[#4f473d]">
                      <p><strong>Recommended offer:</strong> {latestRunsByType[activeAgent].output?.recommendedOffering}</p>
                      <p className="mt-2"><strong>CTA:</strong> {latestRunsByType[activeAgent].output?.cta}</p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[#6a6055]">No runs yet for this agent.</p>
              )}
            </div>
          </Card>

          <Card hover={false} className="rounded-[2rem] bg-[rgba(255,251,245,0.88)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#1f201d]">Run history</h2>
                <p className="mt-1 text-sm text-[#6a6055]">Recent activity across all built-in agents.</p>
              </div>
              {historyLoading ? <span className="text-sm text-[#6a6055]">Refreshing...</span> : null}
            </div>
            <div className="mt-5 space-y-3">
              {runs.length === 0 ? (
                <p className="text-sm text-[#6a6055]">No agent runs yet.</p>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="rounded-[1.6rem] border border-[#eadbc7] bg-[#fffaf1] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#1f201d]">{agentLabels[run.agentType]}</p>
                        <p className="mt-1 text-xs text-[#7a6f61]">{new Date(run.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-[#eef9ef] px-3 py-1 text-xs font-semibold text-[#249a52]">
                        {run.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#4f473d]">{renderRunSummary(run)}</p>
                    {run.agentType === "email" && run.status === "needs_approval" ? (
                      <div className="mt-3">
                        <Button size="sm" onClick={() => handleApprove(run.id)} loading={approvingRun === run.id}>
                          Approve and send
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AgentHub
