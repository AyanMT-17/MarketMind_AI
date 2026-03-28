import { useEffect, useState, startTransition, useDeferredValue } from "react"
import { getApiBaseUrl } from "../lib/api"
import { fetchWithDedup, fetchWithRetry } from "../lib/api-with-retry"

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

const apiBaseUrl = getApiBaseUrl()

export function useChatbots() {
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)

  const fetchChatbots = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetchWithDedup(`${apiBaseUrl}/chatbots`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          throw new Error("Rate limited. Please wait before trying again.")
        }
        throw new Error(errorData.message || "Failed to load chatbots")
      }

      const data = await response.json()

      startTransition(() => {
        setChatbots(data.chatbots || [])
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChatbots()
  }, [])

  const filteredChatbots = chatbots.filter((chatbot) => {
    const query = deferredSearch.trim().toLowerCase()
    if (!query) return true

    return [chatbot.name, chatbot.description, chatbot.status, chatbot.businessProfile?.industry, chatbot.businessProfile?.targetAudience, chatbot.businessProfile?.businessName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  })

  return {
    chatbots,
    filteredChatbots,
    loading,
    error,
    search,
    setSearch,
    refresh: fetchChatbots,
  }
}

export function useChatbot(chatbotId) {
  const [chatbot, setChatbot] = useState(null)
  const [loading, setLoading] = useState(Boolean(chatbotId))
  const [error, setError] = useState("")

  useEffect(() => {
    if (!chatbotId) {
      setLoading(false)
      return
    }

    const fetchChatbot = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await fetchWithDedup(`${apiBaseUrl}/chatbots/${chatbotId}`, {
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 429) {
            throw new Error("Rate limited. Please wait before trying again.")
          }
          throw new Error(errorData.message || "Failed to load chatbot")
        }

        const data = await response.json()

        setChatbot(data.chatbot)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchChatbot()
  }, [chatbotId])

  return { chatbot, setChatbot, loading, error }
}

export async function saveChatbot(chatbotId, payload) {
  const method = chatbotId ? "PUT" : "POST"
  const url = chatbotId
    ? `${apiBaseUrl}/chatbots/${chatbotId}`
    : `${apiBaseUrl}/chatbots`

  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to save chatbot")
  }

  const data = await response.json()
  return data.chatbot
}

export async function deleteChatbot(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/chatbots/${chatbotId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to delete chatbot")
  }
}

export async function generateDeploymentKey(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/chatbots/${chatbotId}/key`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to generate deployment key")
  }

  const data = await response.json()
  return data.deploymentKey
}

export async function testAllIntegrations(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/chatbots/${chatbotId}/test`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to test integrations")
  }

  const data = await response.json()
  return data.results || []
}

export async function fetchIntegrations(chatbotId) {
  const query = chatbotId ? `?chatbotId=${chatbotId}` : ""
  const response = await fetch(`${apiBaseUrl}/integrations${query}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to load integrations")
  }

  const data = await response.json()
  return data.integrations || []
}

export async function saveIntegration(integrationId, payload) {
  const method = integrationId ? "PUT" : "POST"
  const url = integrationId
    ? `${apiBaseUrl}/integrations/${integrationId}`
    : `${apiBaseUrl}/integrations`

  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to save integration")
  }

  const data = await response.json()
  return data.integration
}

export async function removeIntegration(integrationId) {
  const response = await fetch(`${apiBaseUrl}/integrations/${integrationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to delete integration")
  }
}

export async function testIntegration(integrationId) {
  const response = await fetch(`${apiBaseUrl}/integrations/${integrationId}/test`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to test integration")
  }

  const data = await response.json()
  return data.result
}

export async function fetchAnalytics(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/analytics/${chatbotId}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to load analytics")
  }

  const data = await response.json()
  return data.analytics
}

export async function fetchUsage(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/usage/${chatbotId}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || "Failed to load usage")
  }

  const data = await response.json()
  return data.usage
}

export async function fetchRecentConversations(chatbotId) {
  const response = await fetchWithDedup(`${apiBaseUrl}/conversations/${chatbotId}/recent`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const errorData = await response.json()
    if (response.status === 429) {
      throw new Error("Rate limited. Please wait before trying again.")
    }
    throw new Error(errorData.message || "Failed to load recent conversations")
  }

  const data = await response.json()
  return data.conversations || []
}
