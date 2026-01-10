"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"

function CampaignList() {
  const authToken = localStorage.getItem("authToken")
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { addToast } = useToast()

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch campaigns")
        }

        const data = await response.json()
        const campaignList = data.campaigns || []
        setCampaigns(campaignList)
        setFilteredCampaigns(campaignList)
      } catch (error) {
        console.error("Error fetching campaigns:", error)
        addToast("Failed to load campaigns", "error")
      } finally {
        setLoading(false)
      }
    }

    if (authToken) {
      fetchCampaigns()
    } else {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    let filtered = campaigns

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((campaign) =>
        campaign.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((campaign) => campaign.status === statusFilter)
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchTerm, statusFilter])

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "scheduled":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage your marketing campaigns</p>
        </div>
        <Link to="/campaign_creation">
          <Button>
            <span className="mr-2">+</span>
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card hover={false}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Campaigns Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign._id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{campaign.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(campaign.createdAt)}
                  </p>
                </div>
                <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                </span>
              </div>

              {/* Campaign Type Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
                  {campaign.type?.charAt(0).toUpperCase() + campaign.type?.slice(1) || "Campaign"}
                </span>
              </div>

              {/* Content Preview */}
              {campaign.content?.subject && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-600 truncate">{campaign.content.subject}</p>
                </div>
              )}

              {/* AI Metadata */}
              {campaign.aiMetadata?.model && (
                <div className="mb-4 text-xs text-gray-500">
                  Generated with: <span className="font-medium">{campaign.aiMetadata.model}</span>
                </div>
              )}

              <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card hover={false}>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first AI-powered marketing campaign
            </p>
            <Link to="/campaign_creation">
              <Button>
                <span className="mr-2">✨</span>
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CampaignList
