"use client"

import { useState } from "react"
import { useToast } from "../contexts/ToastContext"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

function SalesForecasting() {
  const [inputData, setInputData] = useState({
    currentRevenue: "",
    marketingBudget: "",
    targetAudience: "",
    seasonality: "normal",
    timeframe: "3",
  })
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleInputChange = (e) => {
    setInputData({
      ...inputData,
      [e.target.name]: e.target.value,
    })
  }

  const generateForecast = async () => {
    if (!inputData.currentRevenue || !inputData.marketingBudget) {
      addToast("Please fill in all required fields", "warning")
      return
    }

    setLoading(true)
    try {
      // Simulate API call to AI forecasting service
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const currentRev = Number.parseFloat(inputData.currentRevenue)
      const budget = Number.parseFloat(inputData.marketingBudget)
      const months = Number.parseInt(inputData.timeframe)

      // Mock AI forecast calculation
      const baseGrowth = 0.15 // 15% base growth
      const budgetMultiplier = Math.min((budget / currentRev) * 0.1, 0.3) // Budget impact
      const seasonalityMultiplier = inputData.seasonality === "high" ? 1.2 : inputData.seasonality === "low" ? 0.8 : 1

      const projectedGrowth = (baseGrowth + budgetMultiplier) * seasonalityMultiplier
      const projectedRevenue = currentRev * (1 + (projectedGrowth * months) / 12)

      const mockForecast = {
        projectedRevenue: Math.round(projectedRevenue),
        growthRate: Math.round(projectedGrowth * 100 * 10) / 10,
        confidence: 85,
        factors: [
          { name: "Market Trends", impact: "Positive", weight: 25 },
          { name: "Marketing Budget", impact: "Positive", weight: 30 },
          {
            name: "Seasonality",
            impact:
              inputData.seasonality === "high" ? "Positive" : inputData.seasonality === "low" ? "Negative" : "Neutral",
            weight: 20,
          },
          { name: "Competition", impact: "Neutral", weight: 15 },
          { name: "Economic Conditions", impact: "Positive", weight: 10 },
        ],
        monthlyBreakdown: Array.from({ length: months }, (_, i) => ({
          month: i + 1,
          revenue: Math.round(currentRev * (1 + (projectedGrowth * (i + 1)) / months)),
          growth: Math.round(((projectedGrowth * (i + 1)) / months) * 100 * 10) / 10,
        })),
      }

      setForecast(mockForecast)
      addToast("Sales forecast generated successfully!", "success")
    } catch (error) {
      addToast("Failed to generate forecast", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sales Forecasting</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Forecast Parameters</h2>
          <div className="space-y-4">
            <Input
              label="Current Monthly Revenue ($)"
              name="currentRevenue"
              type="number"
              value={inputData.currentRevenue}
              onChange={handleInputChange}
              placeholder="Enter current monthly revenue"
              required
            />

            <Input
              label="Marketing Budget ($)"
              name="marketingBudget"
              type="number"
              value={inputData.marketingBudget}
              onChange={handleInputChange}
              placeholder="Enter marketing budget"
              required
            />

            <Input
              label="Target Audience Size"
              name="targetAudience"
              type="number"
              value={inputData.targetAudience}
              onChange={handleInputChange}
              placeholder="Estimated target audience size"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seasonality</label>
              <select
                name="seasonality"
                value={inputData.seasonality}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="low">Low Season</option>
                <option value="normal">Normal Season</option>
                <option value="high">High Season</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Timeframe (months)</label>
              <select
                name="timeframe"
                value={inputData.timeframe}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>

            <Button onClick={generateForecast} loading={loading} className="w-full">
              {loading ? "Generating Forecast..." : "Generate AI Forecast"}
            </Button>
          </div>
        </Card>

        {/* Forecast Results */}
        {forecast && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Forecast Results</h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Projected Revenue</p>
                  <p className="text-3xl font-bold text-purple-600">${forecast.projectedRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {forecast.growthRate}% growth • {forecast.confidence}% confidence
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Key Factors</h3>
                <div className="space-y-2">
                  {forecast.factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{factor.name}</span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${factor.impact === "Positive" ? "bg-green-100 text-green-800" : ""}
                          ${factor.impact === "Negative" ? "bg-red-100 text-red-800" : ""}
                          ${factor.impact === "Neutral" ? "bg-gray-100 text-gray-800" : ""}
                        `}
                        >
                          {factor.impact}
                        </span>
                        <span className="text-gray-500">{factor.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Monthly Breakdown */}
      {forecast && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projected Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecast.monthlyBreakdown.map((month) => (
                  <tr key={month.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Month {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${month.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.growth}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SalesForecasting
