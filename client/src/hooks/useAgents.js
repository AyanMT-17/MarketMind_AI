import { useCallback, useEffect, useState } from "react"
import { getApiBaseUrl } from "../lib/api"

const apiBaseUrl = getApiBaseUrl()

function getAuthHeaders() {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function parseJson(response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || "Request failed")
  }
  return data
}

export function useAgentCatalog() {
  const [agents, setAgents] = useState([])
  const [emailSettings, setEmailSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await parseJson(await fetch(`${apiBaseUrl}/agents`, { headers: getAuthHeaders() }))
      setAgents(data.agents || [])
      setEmailSettings(data.emailSettings || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { agents, emailSettings, loading, error, refresh, setEmailSettings }
}

export function useAgentHistory(filters = {}) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const query = new URLSearchParams()
      if (filters.agentType) query.set("agentType", filters.agentType)
      if (filters.chatbotId) query.set("chatbotId", filters.chatbotId)
      const suffix = query.toString() ? `?${query.toString()}` : ""
      const data = await parseJson(await fetch(`${apiBaseUrl}/agents/history${suffix}`, { headers: getAuthHeaders() }))
      setRuns(data.runs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.agentType, filters.chatbotId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { runs, loading, error, refresh, setRuns }
}

export async function runAgent(payload) {
  const data = await parseJson(await fetch(`${apiBaseUrl}/agents/run`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }))

  return data.run
}

export async function fetchAgentRun(runId) {
  const data = await parseJson(await fetch(`${apiBaseUrl}/agents/runs/${runId}`, {
    headers: getAuthHeaders(),
  }))

  return data.run
}

export async function approveAgentRun(runId) {
  const data = await parseJson(await fetch(`${apiBaseUrl}/agents/runs/${runId}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  }))

  return data.run
}

export async function fetchEmailSettings() {
  const data = await parseJson(await fetch(`${apiBaseUrl}/email-settings`, {
    headers: getAuthHeaders(),
  }))
  return data.settings
}

export async function saveEmailSettings(payload) {
  const data = await parseJson(await fetch(`${apiBaseUrl}/email-settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }))
  return data.settings
}

export async function testEmailSettings() {
  return parseJson(await fetch(`${apiBaseUrl}/email-settings/test`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  }))
}
