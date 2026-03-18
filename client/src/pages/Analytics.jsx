"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import Button from "../components/UI/Button"
import Card from "../components/UI/Card"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"
import { fetchAnalytics, fetchUsage, useChatbot } from "../hooks/useChatbot"

function Analytics() {
  const { chatbotId } = useParams()
  const { chatbot, loading } = useChatbot(chatbotId)
  const { addToast } = useToast()
  const [analytics, setAnalytics] = useState(null)
  const [usage, setUsage] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  useEffect(() => {
    if (!chatbotId) return

    const loadMetrics = async () => {
      setMetricsLoading(true)

      try {
        const [analyticsData, usageData] = await Promise.all([
          fetchAnalytics(chatbotId),
          fetchUsage(chatbotId),
        ])
        setAnalytics(analyticsData)
        setUsage(usageData)
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setMetricsLoading(false)
      }
    }

    loadMetrics()
  }, [addToast, chatbotId])

  if (loading || metricsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const chartData = [
    { label: "Conversations", value: analytics?.stats?.totalConversations || 0 },
    { label: "Messages", value: analytics?.stats?.totalMessages || 0 },
    { label: "Tokens", value: analytics?.stats?.totalTokensUsed || 0 },
    { label: "API Calls", value: analytics?.stats?.apiCallsMade || 0 },
    { label: "Leads", value: analytics?.stats?.leadsCaptured || 0 },
    { label: "Escalations", value: analytics?.stats?.escalationsTriggered || 0 },
  ]

  const statCards = [
    { label: "Total conversations", value: usage?.totalConversations || 0 },
    { label: "Total messages", value: usage?.totalMessages || 0 },
    { label: "Token usage", value: usage?.totalTokensUsed || 0 },
    { label: "Avg response time", value: `${usage?.avgResponseTime || 0}s` },
    { label: "Leads captured", value: analytics?.stats?.leadsCaptured || 0 },
    { label: "Escalations", value: analytics?.stats?.escalationsTriggered || 0 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">Usage intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{chatbot?.name} analytics</h1>
          <p className="mt-2 text-slate-500">Monitor conversation volume, token usage, API calls, leads captured, and repeated user questions.</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/chatbots/${chatbotId}/chat`}>
            <Button variant="secondary">Back to chat</Button>
          </Link>
          <Link to={`/chatbots/${chatbotId}/edit`}>
            <Button>Edit chatbot</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {statCards.map((item) => (
          <Card key={item.label} hover={false} className="rounded-[1.75rem]">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card hover={false} className="rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Activity snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">Current aggregate metrics pulled directly from the backend analytics route.</p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0d9488" fill="url(#analyticsGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card hover={false} className="rounded-[2rem]">
          <h2 className="text-xl font-semibold text-slate-900">Top questions</h2>
          <p className="mt-1 text-sm text-slate-500">Frequently repeated prompts gathered from stored conversations.</p>

          <div className="mt-6 space-y-4">
            {(analytics?.topQuestions || []).length === 0 ? (
              <p className="text-sm text-slate-500">No repeated questions yet. Start a few conversations to populate this panel.</p>
            ) : (
              analytics.topQuestions.map((item, index) => (
                <div key={`${item.question}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-800">{item.question}</p>
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                      {item.count}x
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Analytics
