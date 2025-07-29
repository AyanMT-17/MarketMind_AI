"use client"

import { useState } from "react"
import { useToast } from "../contexts/ToastContext"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

function CampaignCreation() {
  const authToken = localStorage.getItem("authToken")
  const { addToast } = useToast()

  const [campaignData, setCampaignData] = useState({
    name: "",
    type: "email",
  })
  const [contentSubject, setContentSubject] = useState("")
  const [contentBody, setContentBody] = useState("")
  const [contentVariations, setContentVariations] = useState([""])
  const [prompt, setPrompt] = useState("")
  const [brandTone, setBrandTone] = useState("")
  const [brandStyle, setBrandStyle] = useState("")
  const [brandTargetAudience, setBrandTargetAudience] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setCampaignData({
      ...campaignData,
      [e.target.name]: e.target.value,
    })
  }

  const handleContentSubjectChange = (e) => {
    setContentSubject(e.target.value)
  }

  const handleContentBodyChange = (e) => {
    setContentBody(e.target.value)
  }

  const handleBrandToneChange = (e) => {
    setBrandTone(e.target.value)
  }

  const handleBrandStyleChange = (e) => {
    setBrandStyle(e.target.value)
  }

  const handleBrandTargetAudienceChange = (e) => {
    setBrandTargetAudience(e.target.value)
  }

  const handleVariationChange = (index, value) => {
    const newVariations = [...contentVariations]
    newVariations[index] = value
    setContentVariations(newVariations)
  }

  const addVariation = () => {
    setContentVariations([...contentVariations, ""])
  }

  const removeVariation = (index) => {
    const newVariations = contentVariations.filter((_, i) => i !== index)
    setContentVariations(newVariations)
  }

  const handlePromptChange = (e) => {
    setPrompt(e.target.value)
  }

  const saveCampaign = async () => {
    if (!campaignData.name || !prompt) {
      addToast("Please fill in campaign name and prompt", "warning")
      return
    }

    setLoading(true)
    try {
      const campaignPayload = {
        name: campaignData.name,
        type: campaignData.type,
        status: "draft",
        content: {
          subject: contentSubject || "No Subject",
          body: contentBody || "",
          variations: contentVariations.filter(v => v.trim() !== ""),
        },
        prompt: prompt,
        brandSettings: {
          tone: brandTone,
          style: brandStyle,
          targetAudience: brandTargetAudience,
        },
        userId: authToken ? JSON.parse(atob(authToken.split('.')[1])).userId : null,
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        credentials: "include",
        body: JSON.stringify(campaignPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save campaign")
      }

      addToast("Campaign saved successfully!", "success")

      // Reset form
      setCampaignData({ name: "", type: "email" })
      setContentSubject("")
      setContentVariations([""])
      setPrompt("")
    } catch (error) {
      addToast(error.message || "Failed to save campaign", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Campaign</h1>

      <Card>
        <div className="space-y-4">
          <Input
            label="Campaign Name"
            name="name"
            value={campaignData.name}
            onChange={handleInputChange}
            placeholder="Enter campaign name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
            <select
              name="type"
              value={campaignData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="ad">Ad</option>
              <option value="blog">Blog</option>
            </select>
          </div>

          <Input
            label="Content Subject"
            name="contentSubject"
            value={contentSubject}
            onChange={handleContentSubjectChange}
            placeholder="Enter content subject"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Body</label>
            <textarea
              value={contentBody}
              onChange={handleContentBodyChange}
              placeholder="Enter content body"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              rows={4}
            />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Variations</label>
              {contentVariations.map((variation, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={variation}
                    onChange={(e) => handleVariationChange(index, e.target.value)}
                    placeholder={`Variation ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  {contentVariations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addVariation}
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                Add Variation
              </button>
            </div>

            <Input
              label="Brand Tone"
              name="brandTone"
              value={brandTone}
              onChange={handleBrandToneChange}
              placeholder="e.g., professional, casual"
            />

            <Input
              label="Brand Style"
              name="brandStyle"
              value={brandStyle}
              onChange={handleBrandStyleChange}
              placeholder="e.g., informative, persuasive"
            />

            <Input
              label="Brand Target Audience"
              name="brandTargetAudience"
              value={brandTargetAudience}
              onChange={handleBrandTargetAudienceChange}
              placeholder="e.g., marketing executives"
            />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Prompt</label>
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Enter content prompt"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              rows={4}
            />
          </div>

          <Button onClick={saveCampaign} loading={loading} className="w-full">
            Save Campaign
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default CampaignCreation
