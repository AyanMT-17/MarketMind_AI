import { useEffect, useState, startTransition, useDeferredValue } from "react"

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

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
      const response = await fetch(`${apiBaseUrl}/api/chatbots`, {
        headers: getAuthHeaders(),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chatbots")
      }

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
        const response = await fetch(`${apiBaseUrl}/api/chatbots/${chatbotId}`, {
          headers: getAuthHeaders(),
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to load chatbot")
        }

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
    ? `${apiBaseUrl}/api/chatbots/${chatbotId}`
    : `${apiBaseUrl}/api/chatbots`

  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || "Failed to save chatbot")
  }

  return data.chatbot
}

export async function deleteChatbot(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/api/chatbots/${chatbotId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete chatbot")
  }
}

export async function generateDeploymentKey(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/api/chatbots/${chatbotId}/key`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to generate deployment key")
  }

  return data.deploymentKey
}

export async function testAllIntegrations(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/api/chatbots/${chatbotId}/test`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to test integrations")
  }

  return data.results || []
}

export async function fetchIntegrations(chatbotId) {
  const query = chatbotId ? `?chatbotId=${chatbotId}` : ""
  const response = await fetch(`${apiBaseUrl}/api/integrations${query}`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to load integrations")
  }

  return data.integrations || []
}

export async function saveIntegration(integrationId, payload) {
  const method = integrationId ? "PUT" : "POST"
  const url = integrationId
    ? `${apiBaseUrl}/api/integrations/${integrationId}`
    : `${apiBaseUrl}/api/integrations`

  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to save integration")
  }

  return data.integration
}

export async function removeIntegration(integrationId) {
  const response = await fetch(`${apiBaseUrl}/api/integrations/${integrationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete integration")
  }
}

export async function testIntegration(integrationId) {
  const response = await fetch(`${apiBaseUrl}/api/integrations/${integrationId}/test`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to test integration")
  }

  return data.result
}

export async function fetchAnalytics(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/api/analytics/${chatbotId}`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to load analytics")
  }

  return data.analytics
}

export async function fetchUsage(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/api/usage/${chatbotId}`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to load usage")
  }

  return data.usage
}

export async function fetchRecentConversations(chatbotId) {
  const response = await fetch(`${apiBaseUrl}/api/conversations/${chatbotId}/recent`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to load recent conversations")
  }

  return data.conversations || []
}
