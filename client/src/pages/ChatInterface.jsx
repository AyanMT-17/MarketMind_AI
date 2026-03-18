"use client"

import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import Button from "../components/UI/Button"
import Card from "../components/UI/Card"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"
import { useChat } from "../hooks/useChat"
import { useChatbot } from "../hooks/useChatbot"

function ChatInterface() {
  const { chatbotId } = useParams()
  const { chatbot, loading } = useChatbot(chatbotId)
  const { addToast } = useToast()
  const { messages, recentConversations, conversationMeta, isStreaming, tokenUsage, error, sendMessage, stopStreaming, loadConversation } = useChat(chatbotId)
  const [draft, setDraft] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextMessage = draft.trim()
    if (!nextMessage) return

    setDraft("")
    await sendMessage(nextMessage)
  }

  const handleLoadConversation = async (conversationId) => {
    try {
      await loadConversation(conversationId)
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
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.35fr]">
      <Card hover={false} className="rounded-[2.2rem] bg-[rgba(255,251,245,0.88)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="editorial-eyebrow text-xs font-semibold uppercase">Assistant context</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1f201d]">{chatbot?.name}</h1>
          </div>
          <Link to={`/chatbots/${chatbotId}/edit`}>
            <Button variant="outline">Edit bot</Button>
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-[1.8rem] bg-[#fffaf1] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#958675]">Welcome message</p>
            <p className="mt-3 text-sm leading-7 text-[#4f473d]">{chatbot?.config?.welcomeMessage}</p>
          </div>
          <div className="rounded-[1.8rem] bg-[#fffaf1] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#958675]">System prompt</p>
            <p className="mt-3 text-sm leading-7 text-[#4f473d]">{chatbot?.config?.systemPrompt}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.6rem] bg-[#eef9ef] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#249a52]">Live token usage</p>
              <p className="mt-2 text-2xl font-semibold text-[#1f201d]">{tokenUsage}</p>
            </div>
            <div className="rounded-[1.6rem] bg-[#f3e7d4] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a6f61]">Integrations attached</p>
              <p className="mt-2 text-2xl font-semibold text-[#1f201d]">{chatbot?.integrations?.length || 0}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.6rem] bg-[#eef9ef] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#249a52]">Primary CTA</p>
              <p className="mt-2 text-sm font-semibold text-[#1f201d]">{chatbot?.automation?.primaryCallToAction || "Not set"}</p>
            </div>
            <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Lead capture</p>
              <p className="mt-2 text-sm font-semibold text-[#1f201d]">{chatbot?.automation?.leadCaptureEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
          {chatbot?.businessProfile?.offerings?.length ? (
            <div className="rounded-[1.8rem] bg-[#fffaf1] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#958675]">Offerings</p>
              <p className="mt-3 text-sm leading-7 text-[#4f473d]">{chatbot.businessProfile.offerings.join(", ")}</p>
            </div>
          ) : null}
          {conversationMeta?.leadCaptured || conversationMeta?.escalated ? (
            <div className="rounded-[1.8rem] border border-[#cfeace] bg-[#eef9ef] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#249a52]">Business signals</p>
              {conversationMeta?.leadCaptured ? (
                <p className="mt-3 text-sm text-[#4f473d]">
                  Lead detected:{" "}
                  {[conversationMeta.lead?.name, conversationMeta.lead?.email, conversationMeta.lead?.company, conversationMeta.lead?.phone]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              ) : null}
              {conversationMeta?.escalated ? (
                <p className="mt-2 text-sm text-[#4f473d]">This conversation triggered a human-support escalation signal.</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1f201d]">Recent conversations</h2>
            <Link to={`/chatbots/${chatbotId}/analytics`} className="text-sm font-medium text-[#249a52]">
              View analytics
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentConversations.length === 0 ? (
              <p className="text-sm text-[#6a6055]">No recent conversations yet.</p>
            ) : (
              recentConversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => handleLoadConversation(conversation._id)}
                  className="block w-full rounded-[1.6rem] border border-[#eadbc7] bg-[#fffaf1] px-4 py-3 text-left transition hover:border-[#d4be9f] hover:bg-[#f4ebdd]"
                >
                  <p className="font-semibold text-[#1f201d]">{conversation.title}</p>
                  <p className="mt-1 text-xs text-[#7a6f61]">{new Date(conversation.updatedAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card hover={false} className="flex min-h-[75vh] flex-col rounded-[2.2rem] bg-[linear-gradient(180deg,_rgba(255,251,245,0.96)_0%,_rgba(251,244,232,0.95)_100%)]">
        <div className="border-b border-[#eadbc7] pb-5">
          <p className="editorial-eyebrow text-xs font-semibold uppercase">Streaming session</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1f201d]">Test the real-time reply flow</h2>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto py-6">
          {messages.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#d8c5af] bg-[#fffaf1] p-8 text-center">
              <p className="text-lg font-semibold text-[#1f201d]">No messages yet</p>
              <p className="mt-2 text-[#6a6055]">Send a prompt to verify streaming and conversation persistence.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.75rem] px-5 py-4 text-sm leading-7 shadow-sm ${
                    message.role === "user"
                      ? "bg-[#1f201d] text-[#fffaf1]"
                      : "border border-[#cfeace] bg-[#eef9ef] text-[#1f201d]"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content || (isStreaming ? "..." : "")}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-[#eadbc7] pt-5">
          <div className="space-y-4">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask the assistant to summarize product policies, query an API, or answer a customer question."
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={isStreaming}>
                Send message
              </Button>
              {isStreaming ? (
                <Button type="button" variant="outline" onClick={stopStreaming}>
                  Stop stream
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ChatInterface
