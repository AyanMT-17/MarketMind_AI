import { useCallback, useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import { fetchRecentConversations } from "./useChatbot"
import { getApiBaseUrl, getServerBaseUrl } from "../lib/api"

const apiBaseUrl = getApiBaseUrl()
const serverBaseUrl = getServerBaseUrl()

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export function useChat(chatbotId) {
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState("")
  const [conversationMeta, setConversationMeta] = useState({
    leadCaptured: false,
    lead: null,
    escalated: false,
  })
  const [recentConversations, setRecentConversations] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [tokenUsage, setTokenUsage] = useState(0)
  const [error, setError] = useState("")
  const abortRef = useRef(null)
  const socketRef = useRef(null)
  const pendingConversationRef = useRef("")

  const loadRecentConversations = useCallback(async () => {
    if (!chatbotId) return

    try {
      const data = await fetchRecentConversations(chatbotId)
      setRecentConversations(data)
    } catch (err) {
      setError(err.message)
    }
  }, [chatbotId])

  useEffect(() => {
    loadRecentConversations()
  }, [loadRecentConversations])

  const appendAssistantChunk = useCallback((chunk) => {
    setMessages((prev) => {
      const next = [...prev]
      const lastIndex = next.length - 1

      if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
        next[lastIndex] = {
          ...next[lastIndex],
          content: `${next[lastIndex].content}${chunk}`,
        }
      }

      return next
    })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!chatbotId || !token) return undefined

    const socket = io(serverBaseUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    })

    socketRef.current = socket

    socket.on("response_chunk", ({ conversationId: nextConversationId, content }) => {
      if (nextConversationId && nextConversationId !== conversationId) {
        pendingConversationRef.current = nextConversationId
      }
      appendAssistantChunk(content || "")
    })

    socket.on("response_done", async (payload) => {
      setConversationId(payload.conversationId || pendingConversationRef.current || "")
      setTokenUsage(payload.tokensUsed || 0)
      setConversationMeta({
        leadCaptured: Boolean(payload.lead?.email || payload.lead?.phone),
        lead: payload.lead || null,
        escalated: Boolean(payload.escalated),
      })
      setIsStreaming(false)
      pendingConversationRef.current = payload.conversationId || ""
      await loadRecentConversations()
    })

    socket.on("chat_error", (payload) => {
      setError(payload.message || "Socket streaming failed")
      setIsStreaming(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [appendAssistantChunk, chatbotId, conversationId, loadRecentConversations])

  const loadConversation = async (nextConversationId) => {
    if (!nextConversationId) return

    setError("")
    const response = await fetch(`${apiBaseUrl}/conversations/${nextConversationId}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to load conversation")
    }

    setConversationId(data.conversation._id)
    setMessages(data.conversation.messages || [])
    setConversationMeta({
      leadCaptured: Boolean(data.conversation.metadata?.leadCaptured),
      lead: data.conversation.metadata?.lead || null,
      escalated: Boolean(data.conversation.metadata?.escalated),
    })
  }

  const sendMessage = async (message) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || !chatbotId || isStreaming) return

    setError("")
    setIsStreaming(true)
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmedMessage,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      },
    ])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      if (socketRef.current?.connected) {
        pendingConversationRef.current = conversationId || ""
        socketRef.current.emit("send_message", {
          chatbotId,
          conversationId: conversationId || undefined,
          message: trimmedMessage,
        })
        return
      }

      const response = await fetch(`${apiBaseUrl}/chat/${chatbotId}/message`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: trimmedMessage,
          conversationId: conversationId || undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Failed to start chat stream")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      const applyEvent = (eventBlock) => {
        const eventMatch = eventBlock.match(/event:\s*(.+)/)
        const dataMatch = eventBlock.match(/data:\s*(.+)/)
        if (!eventMatch || !dataMatch) return

        const eventName = eventMatch[1].trim()
        const payload = JSON.parse(dataMatch[1])

        if (eventName === "chunk") {
          appendAssistantChunk(payload.content || "")
        }

        if (eventName === "done") {
          setConversationId(payload.conversationId || "")
          setTokenUsage(payload.tokensUsed || 0)
          setConversationMeta({
            leadCaptured: Boolean(payload.lead?.email || payload.lead?.phone),
            lead: payload.lead || null,
            escalated: Boolean(payload.escalated),
          })
        }

        if (eventName === "error") {
          setError(payload.message || "Streaming failed")
        }
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const blocks = buffer.split("\n\n")
        buffer = blocks.pop() || ""
        blocks.forEach(applyEvent)
      }

      await loadRecentConversations()
    } catch (err) {
      setError(err.message)
      setMessages((prev) =>
        prev.map((entry, index) =>
          index === prev.length - 1 && entry.role === "assistant" && !entry.content
            ? { ...entry, content: "The assistant could not respond. Please try again." }
            : entry
        )
      )
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const stopStreaming = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  return {
    messages,
    conversationId,
    recentConversations,
    conversationMeta,
    isStreaming,
    tokenUsage,
    error,
    sendMessage,
    stopStreaming,
    loadConversation,
    refreshConversations: loadRecentConversations,
  }
}
