"use client"

import { useState } from "react"
import { useToast } from "../contexts/ToastContext"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

function CampaignBuilder() {
  const authToken = localStorage.getItem("authToken")
  const [campaignData, setCampaignData] = useState({
    name: "",
    target: "",
    budget: "",
    duration: "",
    type: "", // added campaign type
  })
  const [aiPrompt, setAiPrompt] = useState("")
  const [optimizationType, setoptimizationType] = useState("") // added content type for AI generation
  const [generatedContent, setGeneratedContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { addToast } = useToast()

  // New states for campaign content subject and variations
  const [contentSubject, setContentSubject] = useState("")
  const [contentVariations, setContentVariations] = useState([""])


  const generateContent = async () => {
    if (!aiPrompt.trim()) {
      addToast("Please enter a prompt for AI content generation", "warning")
      return
    }

    setGenerating(true)
    try {
      const brandSettings = {} // optionally get from user profile or form
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", 
          Authorization: `Bearer ${authToken}` },
        credentials: "include",
        body: JSON.stringify({ prompt: aiPrompt, contentType : optimizationType, brandSettings }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      addToast("AI content generated successfully!", "success")
    } catch (error) {
      addToast(error.message || "Failed to generate content", "error")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">AI Content Generation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AI Content Generation */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Content Generation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Prompt</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what kind of content you want to generate..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={optimizationType}
                onChange={(e) => setoptimizationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="email">Email</option>
                <option value="social">Social</option>
                <option value="ad">Ad</option>
                <option value="blog">Blog</option>
              </select>
            </div>

            <Button onClick={generateContent} loading={generating} className="w-full">
              {generating ? "Generating Content..." : "Generate AI Content"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Content</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{generatedContent}</pre>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setGeneratedContent("")}>
              Clear Content
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CampaignBuilder
