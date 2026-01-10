"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"

function Dashboard() {
  const authToken = localStorage.getItem("authToken")
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch campaigns to calculate stats
        const campaignsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        // Fetch leads to include in stats
        const leadsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leads`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        const campaignsData = campaignsRes.ok ? await campaignsRes.json() : { campaigns: [] }
        const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [] }

        const campaigns = campaignsData.campaigns || []
        const leads = leadsData.leads || []

        // Calculate real stats from data
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length
        const totalLeads = leads.length
        const potentialRevenue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0)
        const qualifiedLeads = leads.filter(l =>
          ['qualified', 'proposal', 'negotiation', 'won'].includes(l.pipelineStage)
        ).length

        setStats({
          totalCampaigns: campaigns.length,
          activeCampaigns,
          totalLeads,
          qualifiedLeads,
          potentialRevenue,
        })

        // Build recent activity from real data
        const activities = []

        // Add recent campaigns
        campaigns.slice(0, 3).forEach(campaign => {
          activities.push({
            id: `campaign-${campaign._id}`,
            action: `Campaign "${campaign.name}" ${campaign.status === 'active' ? 'is active' : campaign.status === 'draft' ? 'saved as draft' : 'created'}`,
            time: formatTimeAgo(campaign.createdAt),
            type: "campaign",
          })
        })

        // Add recent leads
        leads.slice(0, 2).forEach(lead => {
          activities.push({
            id: `lead-${lead._id}`,
            action: `Lead "${lead.contactInfo?.firstName} ${lead.contactInfo?.lastName}" added`,
            time: formatTimeAgo(lead.createdAt),
            type: "lead",
          })
        })

        // Sort by time and take first 5
        setRecentActivity(activities.slice(0, 5))

      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        addToast("Failed to load dashboard data", "error")
        // Set empty stats on error
        setStats({
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalLeads: 0,
          qualifiedLeads: 0,
          potentialRevenue: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    if (authToken) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [authToken])

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "recently"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: "Total Campaigns", value: stats?.totalCampaigns || 0, icon: "📊", color: "from-blue-500 to-indigo-500" },
    { label: "Active Campaigns", value: stats?.activeCampaigns || 0, icon: "🚀", color: "from-emerald-500 to-teal-500" },
    { label: "Total Leads", value: stats?.totalLeads || 0, icon: "👥", color: "from-purple-500 to-pink-500" },
    { label: "Qualified Leads", value: stats?.qualifiedLeads || 0, icon: "⭐", color: "from-orange-500 to-amber-500" },
    { label: "Pipeline Value", value: `$${(stats?.potentialRevenue || 0).toLocaleString()}`, icon: "💰", color: "from-green-500 to-emerald-500" },
  ]

  const activityIcons = {
    campaign: "🎯",
    lead: "👤",
    ai: "✨",
    forecast: "📊",
    report: "📋",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your marketing overview.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/campaign-builder">
            <Button>
              <span className="mr-2">✨</span>
              Generate Content
            </Button>
          </Link>
          <Link to="/leads">
            <Button variant="outline">
              <span className="mr-2">👥</span>
              Manage Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            {/* Gradient accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`}></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200"
                >
                  <span className="text-xl flex-shrink-0">{activityIcons[activity.type] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity yet</p>
              <p className="text-sm mt-1">Start by creating a campaign or adding leads</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card hover={false}>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/campaign-builder" className="block">
              <div className="group p-4 border-2 border-gray-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-200">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Content Generation</h3>
                    <p className="text-sm text-gray-500">Create marketing content with AI</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link to="/campaigns" className="block">
              <div className="group p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-200">
                    📢
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Campaigns</h3>
                    <p className="text-sm text-gray-500">Manage your marketing campaigns</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link to="/leads" className="block">
              <div className="group p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-200">
                    👥
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lead Management</h3>
                    <p className="text-sm text-gray-500">Track and manage your leads</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link to="/forecasting" className="block">
              <div className="group p-4 border-2 border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-200">
                    📈
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sales Forecasting</h3>
                    <p className="text-sm text-gray-500">AI-powered sales predictions</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-orange-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
