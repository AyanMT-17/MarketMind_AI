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

    const authToken = localStorage.getItem("authToken")
    if (!authToken) {
      addToast("Please log in to generate forecasts", "error")
      return
    }

    setLoading(true)
    try {
      // Build sales data object for API
      const salesData = {
        currentMonthlyRevenue: Number.parseFloat(inputData.currentRevenue),
        marketingBudget: Number.parseFloat(inputData.marketingBudget),
        targetAudienceSize: inputData.targetAudience ? Number.parseInt(inputData.targetAudience) : null,
        seasonality: inputData.seasonality,
        forecastPeriodMonths: Number.parseInt(inputData.timeframe),
      }

      // Build context string for AI
      const context = `Business with $${salesData.currentMonthlyRevenue.toLocaleString()} monthly revenue, 
        $${salesData.marketingBudget.toLocaleString()} marketing budget, 
        ${salesData.seasonality} seasonality period, 
        forecasting for ${salesData.forecastPeriodMonths} months.
        ${salesData.targetAudienceSize ? `Target audience size: ${salesData.targetAudienceSize.toLocaleString()}` : ''}`

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forecast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ salesData, context }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate forecast")
      }

      const data = await response.json()

      // Set AI-generated forecast
      setForecast({
        aiGenerated: true,
        forecastText: data.forecast,
        model: data.model,
        generatedAt: data.generatedAt,
        tokensUsed: data.tokensUsed,
        inputData: salesData,
      })

      addToast("AI sales forecast generated successfully!", "success")
    } catch (error) {
      console.error("Forecast error:", error)
      addToast(error.message || "Failed to generate forecast", "error")
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">AI Forecast Analysis</h2>
              {forecast.model && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Powered by {forecast.model}
                </span>
              )}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-lg font-bold text-green-600">
                    ${forecast.inputData?.currentMonthlyRevenue?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="text-lg font-bold text-teal-600">
                    ${forecast.inputData?.marketingBudget?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seasonality</p>
                  <p className="text-lg font-bold text-blue-600 capitalize">
                    {forecast.inputData?.seasonality || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="text-lg font-bold text-purple-600">
                    {forecast.inputData?.forecastPeriodMonths || 'N/A'} months
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* AI Generated Forecast Text */}
      {forecast && forecast.forecastText && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Analysis</h2>
          <div className="prose prose-sm max-w-none">
            <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap text-gray-800 leading-relaxed">
              {forecast.forecastText}
            </div>
          </div>

          {forecast.generatedAt && (
            <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
              <span>Generated: {new Date(forecast.generatedAt).toLocaleString()}</span>
              {forecast.tokensUsed && <span>Tokens used: {forecast.tokensUsed}</span>}
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <Button variant="outline" onClick={() => setForecast(null)}>
              Clear Forecast
            </Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(forecast.forecastText)}>
              Copy to Clipboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SalesForecasting
