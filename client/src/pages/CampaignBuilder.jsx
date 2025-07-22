"use client"

import { useState } from "react"
import { useToast } from "../contexts/ToastContext"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

function CampaignBuilder() {
  const [campaignData, setCampaignData] = useState({
    name: "",
    target: "",
    budget: "",
    duration: "",
  })
  const [aiPrompt, setAiPrompt] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { addToast } = useToast()

  const handleInputChange = (e) => {
    setCampaignData({
      ...campaignData,
      [e.target.name]: e.target.value,
    })
  }

  const generateContent = async () => {
    if (!aiPrompt.trim()) {
      addToast("Please enter a prompt for AI content generation", "warning")
      return
    }

    setGenerating(true)
    try {
      // Simulate API call to AI content generation
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      // Simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockContent = `🚀 Exciting ${campaignData.name || "Campaign"} Alert! 

Transform your business with our innovative solutions designed specifically for ${campaignData.target || "your target audience"}. 

✨ Key Benefits:
• Increase efficiency by up to 40%
• Reduce costs while maximizing ROI
• 24/7 customer support included
• Easy integration with existing systems

💰 Special Offer: Get started with just $${campaignData.budget || "999"} and see results in ${campaignData.duration || "30 days"}!

Don't miss out on this limited-time opportunity. Join thousands of satisfied customers who have already transformed their business.

#Innovation #BusinessGrowth #Success`

      setGeneratedContent(mockContent)
      addToast("AI content generated successfully!", "success")
    } catch (error) {
      addToast("Failed to generate content", "error")
    } finally {
      setGenerating(false)
    }
  }

  const saveCampaign = async () => {
    if (!campaignData.name || !generatedContent) {
      addToast("Please fill in campaign details and generate content", "warning")
      return
    }

    setLoading(true)
    try {
      // Simulate API call to save campaign
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaignData,
          content: generatedContent,
          createdAt: new Date().toISOString(),
        }),
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      addToast("Campaign saved successfully!", "success")

      // Reset form
      setCampaignData({ name: "", target: "", budget: "", duration: "" })
      setAiPrompt("")
      setGeneratedContent("")
    } catch (error) {
      addToast("Failed to save campaign", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Campaign Builder</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              name="name"
              value={campaignData.name}
              onChange={handleInputChange}
              placeholder="Enter campaign name"
            />

            <Input
              label="Target Audience"
              name="target"
              value={campaignData.target}
              onChange={handleInputChange}
              placeholder="e.g., Small business owners, Tech enthusiasts"
            />

            <Input
              label="Budget ($)"
              name="budget"
              type="number"
              value={campaignData.budget}
              onChange={handleInputChange}
              placeholder="Enter budget amount"
            />

            <Input
              label="Duration (days)"
              name="duration"
              type="number"
              value={campaignData.duration}
              onChange={handleInputChange}
              placeholder="Campaign duration in days"
            />
          </div>
        </Card>

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
            <Button onClick={saveCampaign} loading={loading}>
              Save Campaign
            </Button>
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
