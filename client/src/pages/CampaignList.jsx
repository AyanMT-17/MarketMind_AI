"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"

function CampaignList() {
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    // Simulate API call to fetch campaigns
    const fetchCampaigns = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const mockCampaigns = [
          {
            id: 1,
            name: "Summer Sale Campaign",
            status: "active",
            budget: 5000,
            spent: 3200,
            reach: 45000,
            clicks: 1200,
            conversions: 48,
            ctr: 2.67,
            createdAt: "2024-01-15",
          },
          {
            id: 2,
            name: "Product Launch",
            status: "completed",
            budget: 8000,
            spent: 7800,
            reach: 78000,
            clicks: 2100,
            conversions: 89,
            ctr: 2.69,
            createdAt: "2024-01-10",
          },
          {
            id: 3,
            name: "Holiday Special",
            status: "draft",
            budget: 3000,
            spent: 0,
            reach: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            createdAt: "2024-01-20",
          },
          {
            id: 4,
            name: "Brand Awareness",
            status: "active",
            budget: 6000,
            spent: 2400,
            reach: 32000,
            clicks: 890,
            conversions: 23,
            ctr: 2.78,
            createdAt: "2024-01-12",
          },
        ]

        setCampaigns(mockCampaigns)
        setFilteredCampaigns(mockCampaigns)
      } catch (error) {
        console.error("Error fetching campaigns:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  useEffect(() => {
    let filtered = campaigns

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((campaign) => campaign.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <Link to="/campaign-builder">
          <Button>Create New Campaign</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500">Created: {campaign.createdAt}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="text-lg font-semibold text-gray-900">${campaign.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Spent</p>
                <p className="text-lg font-semibold text-gray-900">${campaign.spent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reach</p>
                <p className="text-lg font-semibold text-gray-900">{campaign.reach.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-lg font-semibold text-gray-900">{campaign.conversions}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                CTR: <span className="font-medium">{campaign.ctr}%</span>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No campaigns found matching your criteria.</p>
            <Link to="/campaign-builder" className="inline-block mt-4">
              <Button>Create Your First Campaign</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CampaignList
