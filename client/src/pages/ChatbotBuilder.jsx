"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Button from "../components/UI/Button"
import Card from "../components/UI/Card"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"
import {
  fetchIntegrations,
  removeIntegration,
  saveChatbot,
  saveIntegration,
  testAllIntegrations,
  testIntegration,
  useChatbot,
} from "../hooks/useChatbot"

const defaultForm = {
  name: "",
  description: "",
  status: "draft",
  config: {
    systemPrompt: "You are a helpful AI assistant.",
    temperature: 0.7,
    maxTokens: 1024,
    model: "llama-3.3-70b-versatile",
    welcomeMessage: "Hello. How can I help you today?",
  },
  businessProfile: {
    businessName: "",
    industry: "",
    website: "",
    targetAudience: "",
    valueProposition: "",
    goals: [],
    offerings: [],
    supportChannels: [],
    knowledgeBaseUrls: [],
  },
  automation: {
    leadCaptureEnabled: true,
    leadCaptureFields: ["name", "email", "company"],
    primaryCallToAction: "Book a demo",
    bookingUrl: "",
    escalationEnabled: true,
    escalationMessage: "I can connect you with a human teammate if you would like follow-up support.",
    escalationKeywords: ["pricing", "demo", "contract", "sales", "human", "agent", "support"],
  },
  settings: {
    allowedOrigins: [],
    requireAuth: true,
    rateLimit: {
      requests: 60,
      window: 900000,
    },
  },
}

const emptyIntegration = (chatbotId = "") => ({
  chatbotId,
  name: "",
  type: "rest_api",
  config: {
    baseUrl: "",
    authType: "none",
    authToken: "",
    headers: {},
    endpoints: [
      {
        path: "/",
        method: "GET",
        description: "Primary lookup endpoint",
        headers: {},
        authentication: "",
      },
    ],
  },
})

function ChatbotBuilder() {
  const { chatbotId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { chatbot, loading } = useChatbot(chatbotId)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [integrationDraft, setIntegrationDraft] = useState(emptyIntegration(chatbotId))
  const [integrations, setIntegrations] = useState([])
  const [integrationLoading, setIntegrationLoading] = useState(Boolean(chatbotId))

  useEffect(() => {
    if (!chatbot) return

    setForm({
      name: chatbot.name || "",
      description: chatbot.description || "",
      status: chatbot.status || "draft",
      config: {
        ...defaultForm.config,
        ...chatbot.config,
      },
      businessProfile: {
        ...defaultForm.businessProfile,
        ...chatbot.businessProfile,
      },
      automation: {
        ...defaultForm.automation,
        ...chatbot.automation,
      },
      settings: {
        ...defaultForm.settings,
        ...chatbot.settings,
        rateLimit: {
          ...defaultForm.settings.rateLimit,
          ...chatbot.settings?.rateLimit,
        },
      },
    })
    setIntegrationDraft(emptyIntegration(chatbot._id))
  }, [chatbot])

  useEffect(() => {
    if (!chatbotId) return

    const loadIntegrations = async () => {
      setIntegrationLoading(true)
      try {
        const data = await fetchIntegrations(chatbotId)
        setIntegrations(data)
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setIntegrationLoading(false)
      }
    }

    loadIntegrations()
  }, [addToast, chatbotId])

  const updateForm = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      const keys = path.split(".")
      let target = next

      for (let index = 0; index < keys.length - 1; index += 1) {
        target = target[keys[index]]
      }

      target[keys[keys.length - 1]] = value
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const payload = {
        ...form,
        businessProfile: {
          ...form.businessProfile,
          goals: form.businessProfile.goals.filter(Boolean),
          offerings: form.businessProfile.offerings.filter(Boolean),
          supportChannels: form.businessProfile.supportChannels.filter(Boolean),
          knowledgeBaseUrls: form.businessProfile.knowledgeBaseUrls.filter(Boolean),
        },
        automation: {
          ...form.automation,
          leadCaptureFields: form.automation.leadCaptureFields.filter(Boolean),
          escalationKeywords: form.automation.escalationKeywords.filter(Boolean),
        },
        settings: {
          ...form.settings,
          allowedOrigins: form.settings.allowedOrigins.filter(Boolean),
        },
      }
      const saved = await saveChatbot(chatbotId, payload)
      addToast(chatbotId ? "Chatbot updated" : "Chatbot created", "success")
      navigate(`/chatbots/${saved._id}/edit`)
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAddIntegration = async () => {
    const targetChatbotId = chatbotId || chatbot?._id

    if (!targetChatbotId) {
      addToast("Save the chatbot before adding integrations", "error")
      return
    }

    try {
      const saved = await saveIntegration(null, {
        ...integrationDraft,
        chatbotId: targetChatbotId,
      })
      setIntegrations((prev) => [saved, ...prev])
      setIntegrationDraft(emptyIntegration(targetChatbotId))
      addToast("Integration saved", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDeleteIntegration = async (integrationId) => {
    try {
      await removeIntegration(integrationId)
      setIntegrations((prev) => prev.filter((integration) => integration._id !== integrationId))
      addToast("Integration removed", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleTestIntegration = async (integrationId) => {
    try {
      const result = await testIntegration(integrationId)
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration._id === integrationId
            ? { ...integration, testResult: result }
            : integration
        )
      )
      addToast(result.success ? "Integration test passed" : "Integration test failed", result.success ? "success" : "error")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleTestAll = async () => {
    if (!chatbotId) {
      addToast("Save the chatbot before running full integration tests", "error")
      return
    }

    try {
      await testAllIntegrations(chatbotId)
      addToast("Integration test sweep completed", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">
            {chatbotId ? "Refine chatbot" : "Create chatbot"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {chatbotId ? "Tune the assistant, integrations, and limits" : "Build a new assistant from scratch"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {chatbotId ? (
            <Link to={`/chatbots/${chatbotId}/chat`}>
              <Button variant="secondary">Open Chat</Button>
            </Link>
          ) : null}
          <Button onClick={handleSave} loading={saving}>
            {chatbotId ? "Save changes" : "Create chatbot"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Card hover={false} className="space-y-6 rounded-[2rem]">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Chatbot name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              rows={3}
              className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">System prompt</label>
            <textarea
              value={form.config.systemPrompt}
              onChange={(event) => updateForm("config.systemPrompt", event.target.value)}
              rows={7}
              className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={form.config.temperature}
              onChange={(event) => updateForm("config.temperature", Number(event.target.value))}
            />
            <Input
              label="Max tokens"
              type="number"
              min="1"
              value={form.config.maxTokens}
              onChange={(event) => updateForm("config.maxTokens", Number(event.target.value))}
            />
            <Input
              label="Model"
              value={form.config.model}
              onChange={(event) => updateForm("config.model", event.target.value)}
            />
          </div>

          <Input
            label="Welcome message"
            value={form.config.welcomeMessage}
            onChange={(event) => updateForm("config.welcomeMessage", event.target.value)}
          />

          <div className="rounded-[1.75rem] border border-teal-100 bg-teal-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">Business profile</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Business name"
                value={form.businessProfile.businessName}
                onChange={(event) => updateForm("businessProfile.businessName", event.target.value)}
              />
              <Input
                label="Industry"
                value={form.businessProfile.industry}
                onChange={(event) => updateForm("businessProfile.industry", event.target.value)}
              />
              <Input
                label="Website"
                value={form.businessProfile.website}
                onChange={(event) => updateForm("businessProfile.website", event.target.value)}
              />
              <Input
                label="Target audience"
                value={form.businessProfile.targetAudience}
                onChange={(event) => updateForm("businessProfile.targetAudience", event.target.value)}
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Value proposition</label>
              <textarea
                value={form.businessProfile.valueProposition}
                onChange={(event) => updateForm("businessProfile.valueProposition", event.target.value)}
                rows={3}
                className="block w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Business goals"
                value={form.businessProfile.goals.join(", ")}
                onChange={(event) =>
                  updateForm("businessProfile.goals", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                }
              />
              <Input
                label="Products or services"
                value={form.businessProfile.offerings.join(", ")}
                onChange={(event) =>
                  updateForm("businessProfile.offerings", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                }
              />
              <Input
                label="Support channels"
                value={form.businessProfile.supportChannels.join(", ")}
                onChange={(event) =>
                  updateForm("businessProfile.supportChannels", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                }
              />
              <Input
                label="Knowledge base URLs"
                value={form.businessProfile.knowledgeBaseUrls.join(", ")}
                onChange={(event) =>
                  updateForm("businessProfile.knowledgeBaseUrls", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                }
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Business automation</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Primary call to action"
                value={form.automation.primaryCallToAction}
                onChange={(event) => updateForm("automation.primaryCallToAction", event.target.value)}
              />
              <Input
                label="Booking URL"
                value={form.automation.bookingUrl}
                onChange={(event) => updateForm("automation.bookingUrl", event.target.value)}
              />
              <Input
                label="Lead capture fields"
                value={form.automation.leadCaptureFields.join(", ")}
                onChange={(event) =>
                  updateForm("automation.leadCaptureFields", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                }
              />
              <Input
                label="Escalation keywords"
                value={form.automation.escalationKeywords.join(", ")}
                onChange={(event) =>
                  updateForm("automation.escalationKeywords", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                }
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Escalation message</label>
              <textarea
                value={form.automation.escalationMessage}
                onChange={(event) => updateForm("automation.escalationMessage", event.target.value)}
                rows={3}
                className="block w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.automation.leadCaptureEnabled}
                  onChange={(event) => updateForm("automation.leadCaptureEnabled", event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Capture lead details from conversations
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.automation.escalationEnabled}
                  onChange={(event) => updateForm("automation.escalationEnabled", event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Suggest human handoff when needed
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Allowed origins"
              value={form.settings.allowedOrigins.join(", ")}
              onChange={(event) =>
                updateForm(
                  "settings.allowedOrigins",
                  event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                )
              }
            />
            <Input
              label="Rate limit requests"
              type="number"
              min="1"
              value={form.settings.rateLimit.requests}
              onChange={(event) => updateForm("settings.rateLimit.requests", Number(event.target.value))}
            />
            <Input
              label="Rate limit window ms"
              type="number"
              min="1000"
              value={form.settings.rateLimit.window}
              onChange={(event) => updateForm("settings.rateLimit.window", Number(event.target.value))}
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.settings.requireAuth}
              onChange={(event) => updateForm("settings.requireAuth", event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Require authentication for chat requests
          </label>
        </Card>

        <div className="space-y-6">
          <Card hover={false} className="space-y-5 rounded-[2rem]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Integrations</h2>
                <p className="mt-1 text-sm text-slate-500">Attach customer APIs the assistant can query during chats.</p>
              </div>
              {chatbotId ? <Button variant="outline" onClick={handleTestAll}>Run all tests</Button> : null}
            </div>

            <Input
              label="Integration name"
              value={integrationDraft.name}
              onChange={(event) => setIntegrationDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              label="Base URL"
              value={integrationDraft.config.baseUrl}
              onChange={(event) =>
                setIntegrationDraft((prev) => ({
                  ...prev,
                  config: { ...prev.config, baseUrl: event.target.value },
                }))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Endpoint path"
                value={integrationDraft.config.endpoints[0].path}
                onChange={(event) =>
                  setIntegrationDraft((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      endpoints: [{ ...prev.config.endpoints[0], path: event.target.value }],
                    },
                  }))
                }
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select
                  value={integrationDraft.config.endpoints[0].method}
                  onChange={(event) =>
                    setIntegrationDraft((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        endpoints: [{ ...prev.config.endpoints[0], method: event.target.value }],
                      },
                    }))
                  }
                  className="block w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
            <Button variant="secondary" onClick={handleAddIntegration}>
              Save Integration
            </Button>
          </Card>

          <Card hover={false} className="space-y-4 rounded-[2rem]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Saved integrations</h2>
              {integrationLoading ? <span className="text-sm text-slate-500">Loading...</span> : null}
            </div>

            {integrations.length === 0 ? (
              <p className="text-sm text-slate-500">No integrations yet. Save this chatbot first, then connect an endpoint.</p>
            ) : (
              integrations.map((integration) => (
                <div key={integration._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{integration.name}</p>
                      <p className="text-sm text-slate-500">{integration.config?.baseUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTestIntegration(integration._id)}>
                        Test
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteIntegration(integration._id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  {integration.testResult?.testedAt ? (
                    <p className={`mt-3 text-sm ${integration.testResult.success ? "text-emerald-700" : "text-red-600"}`}>
                      {integration.testResult.success ? "Last test passed" : integration.testResult.error || "Last test failed"}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ChatbotBuilder
