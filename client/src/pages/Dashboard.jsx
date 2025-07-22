"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import LoadingSpinner from "../components/UI/LoadingSpinner"

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStats({
          totalCampaigns: 24,
          activeCampaigns: 8,
          totalReach: 125000,
          conversionRate: 3.2,
          revenue: 45600,
        })

        setRecentActivity([
          { id: 1, action: 'Campaign "Summer Sale" launched', time: "2 hours ago", type: "campaign" },
          { id: 2, action: 'AI content generated for "Product Launch"', time: "4 hours ago", type: "ai" },
          { id: 3, action: "Sales forecast updated", time: "6 hours ago", type: "forecast" },
          { id: 4, action: 'New campaign "Holiday Special" created', time: "1 day ago", type: "campaign" },
          { id: 5, action: "Performance report generated", time: "2 days ago", type: "report" },
        ])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Link to="/campaign-builder">
            <Button>Create Campaign</Button>
          </Link>
          <Link to="/forecasting">
            <Button variant="outline">View Forecast</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.totalCampaigns}</div>
          <div className="text-sm text-gray-600 mt-1">Total Campaigns</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.activeCampaigns}</div>
          <div className="text-sm text-gray-600 mt-1">Active Campaigns</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{stats.totalReach.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">Total Reach</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.conversionRate}%</div>
          <div className="text-sm text-gray-600 mt-1">Conversion Rate</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-indigo-600">${stats.revenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">Revenue</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`
                  w-2 h-2 rounded-full
                  ${activity.type === "campaign" ? "bg-purple-500" : ""}
                  ${activity.type === "ai" ? "bg-blue-500" : ""}
                  ${activity.type === "forecast" ? "bg-green-500" : ""}
                  ${activity.type === "report" ? "bg-orange-500" : ""}
                `}
                ></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/campaign-builder" className="block">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🎨</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Create New Campaign</h3>
                    <p className="text-sm text-gray-500">Build a new marketing campaign with AI assistance</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/campaigns" className="block">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <h3 className="font-medium text-gray-900">View All Campaigns</h3>
                    <p className="text-sm text-gray-500">Manage and analyze your marketing campaigns</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/forecasting" className="block">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📈</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Sales Forecasting</h3>
                    <p className="text-sm text-gray-500">Get AI-powered sales predictions</p>
                  </div>
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
