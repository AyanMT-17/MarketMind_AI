import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import LoadingSpinner from '../components/UI/LoadingSpinner'

export default function BusinessPrediction() {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  const navigate = useNavigate()

  const [businessMetrics, setBusinessMetrics] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showMetricsForm, setShowMetricsForm] = useState(false)
  const [showPredictionForm, setShowPredictionForm] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState(null)
  const [csvFile, setCsvFile] = useState(null)

  const [metricsFormData, setMetricsFormData] = useState({
    businessName: '',
    metrics: [],
    notes: ''
  })

  const [predictionFormData, setPredictionFormData] = useState({
    userPrompt: '',
    predictionPeriod: 'next_quarter'
  })

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    fetchBusinessMetrics()
    fetchPredictions()
  }, [])

  const fetchBusinessMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
      const data = await response.json()
      if (data.success) {
        setBusinessMetrics(data.metrics)
      }
    } catch (error) {
      showToast('Failed to fetch business metrics', 'error')
    }
  }

  const fetchPredictions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/predictions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
      const data = await response.json()
      if (data.success) {
        setPredictions(data.predictions)
      }
    } catch (error) {
      showToast('Failed to fetch predictions', 'error')
    }
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const metrics = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < 4) continue

      metrics.push({
        quarter: values[0],
        year: parseInt(values[1]),
        revenue: parseFloat(values[2]),
        profit: parseFloat(values[3]),
        customers: values[4] ? parseInt(values[4]) : 0,
        expenses: values[5] ? parseFloat(values[5]) : 0
      })
    }

    return metrics
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const metrics = parseCSV(event.target.result)
        setMetricsFormData(prev => ({
          ...prev,
          metrics
        }))
        setCsvFile(file.name)
        showToast(`Uploaded ${metrics.length} quarters of data`, 'success')
      } catch (error) {
        showToast(`CSV format error: ${error.message}`, 'error')
      }
    }
    reader.readAsText(file)
  }

  const handleMetricsSubmit = async (e) => {
    e.preventDefault()
    if (!metricsFormData.businessName || metricsFormData.metrics.length === 0) {
      showToast('Please provide business name and metrics data', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          businessName: metricsFormData.businessName,
          metrics: metricsFormData.metrics,
          notes: metricsFormData.notes,
          csvSource: {
            filename: csvFile || 'manual-entry',
            uploadedAt: new Date()
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        showToast('Business metrics saved successfully', 'success')
        setShowMetricsForm(false)
        setMetricsFormData({
          businessName: '',
          metrics: [],
          notes: ''
        })
        setCsvFile(null)
        fetchBusinessMetrics()
      }
    } catch (error) {
      showToast('Failed to save metrics', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePredictionSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMetrics || !predictionFormData.userPrompt) {
      showToast('Please select metrics and enter a prompt', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          businessMetricsId: selectedMetrics._id,
          userPrompt: predictionFormData.userPrompt,
          predictionPeriod: predictionFormData.predictionPeriod
        })
      })

      const data = await response.json()
      if (data.success) {
        showToast('Prediction generated successfully', 'success')
        setShowPredictionForm(false)
        setPredictionFormData({
          userPrompt: '',
          predictionPeriod: 'next_quarter'
        })
        setSelectedMetrics(null)
        fetchPredictions()
      } else {
        showToast(data.message || 'Failed to generate prediction', 'error')
      }
    } catch (error) {
      showToast('Failed to generate prediction', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMetrics = async (id) => {
    if (confirm('Are you sure you want to delete this metrics data?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/business-metrics/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        })
        const data = await response.json()
        if (data.success) {
          showToast('Metrics deleted successfully', 'success')
          fetchBusinessMetrics()
        }
      } catch (error) {
        showToast('Failed to delete metrics', 'error')
      }
    }
  }

  const handleDeletePrediction = async (id) => {
    if (confirm('Are you sure you want to delete this prediction?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/predictions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        })
        const data = await response.json()
        if (data.success) {
          showToast('Prediction deleted successfully', 'success')
          fetchPredictions()
        }
      } catch (error) {
        showToast('Failed to delete prediction', 'error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Business Prediction & Analytics</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business Metrics Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Business Metrics</h2>
              <Button
                onClick={() => setShowMetricsForm(!showMetricsForm)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {showMetricsForm ? 'Cancel' : 'Add Metrics'}
              </Button>
            </div>

            {showMetricsForm && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Upload Quarterly Data</h3>
                <form onSubmit={handleMetricsSubmit} className="space-y-4">
                  <Input
                    label="Business Name"
                    value={metricsFormData.businessName}
                    onChange={(e) => setMetricsFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV File (Quarter, Year, Revenue, Profit, Customers, Expenses)
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {csvFile && <p className="text-sm text-green-600 mt-2">✓ {csvFile} uploaded</p>}
                  </div>

                  {metricsFormData.metrics.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-semibold text-blue-900 mb-2">Data Preview ({metricsFormData.metrics.length} quarters)</h4>
                      <div className="text-sm text-blue-800 max-h-32 overflow-y-auto">
                        {metricsFormData.metrics.map((m, i) => (
                          <p key={i}>{m.quarter} {m.year}: Revenue ${m.revenue}, Profit ${m.profit}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    placeholder="Additional notes about your business..."
                    value={metricsFormData.notes}
                    onChange={(e) => setMetricsFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    rows="3"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? 'Saving...' : 'Save Metrics'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowMetricsForm(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="space-y-4">
              {businessMetrics.map(metric => (
                <Card key={metric._id} className="p-4">
                  <h4 className="font-bold text-lg text-gray-800">{metric.businessName}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {metric.metrics.length} quarters • Created {new Date(metric.createdAt).toLocaleDateString()}
                  </p>
                  <div className="text-sm text-gray-700 mb-3">
                    <p>Latest: {metric.metrics[metric.metrics.length - 1]?.quarter} {metric.metrics[metric.metrics.length - 1]?.year}</p>
                    <p>Revenue: ${metric.metrics[metric.metrics.length - 1]?.revenue}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedMetrics(metric)
                        setShowPredictionForm(true)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      Generate Prediction
                    </Button>
                    <Button
                      onClick={() => handleDeleteMetrics(metric._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}

              {businessMetrics.length === 0 && !showMetricsForm && (
                <p className="text-gray-600 text-center py-8">No business metrics yet. Upload your quarterly data to get started.</p>
              )}
            </div>
          </div>

          {/* Predictions Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Predictions</h2>
            </div>

            {showPredictionForm && selectedMetrics && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Generate Prediction for {selectedMetrics.businessName}</h3>
                <form onSubmit={handlePredictionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prediction Period</label>
                    <select
                      value={predictionFormData.predictionPeriod}
                      onChange={(e) => setPredictionFormData(prev => ({ ...prev, predictionPeriod: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="next_quarter">Next Quarter</option>
                      <option value="next_2_quarters">Next 2 Quarters</option>
                      <option value="next_year">Next Year</option>
                      <option value="next_2_years">Next 2 Years</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Enter your prediction prompt... (e.g., 'What factors might impact growth? Consider market trends and seasonal variations')"
                    value={predictionFormData.userPrompt}
                    onChange={(e) => setPredictionFormData(prev => ({ ...prev, userPrompt: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    rows="4"
                    required
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? 'Generating...' : 'Generate Prediction'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPredictionForm(false)
                        setSelectedMetrics(null)
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="space-y-4">
              {predictions.map(prediction => (
                <Card key={prediction._id} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                  <h4 className="font-bold text-lg text-gray-800">{prediction.businessName}</h4>
                  <p className="text-sm text-gray-600 mb-3">{prediction.userPrompt}</p>

                  <div className="bg-white p-3 rounded mb-3">
                    <h5 className="font-semibold text-sm text-gray-700 mb-2">Predictions</h5>
                    {prediction.predictions.map((p, i) => (
                      <div key={i} className="text-xs text-gray-600 mb-1">
                        <p><strong>{p.period}:</strong> Revenue ${p.predictedRevenue}, Profit ${p.predictedProfit} (Confidence: {(p.confidenceScore * 100).toFixed(0)}%)</p>
                      </div>
                    ))}
                  </div>

                  {prediction.analysis.summary && (
                    <div className="bg-blue-50 p-3 rounded mb-3">
                      <h5 className="font-semibold text-sm text-blue-900 mb-1">Analysis</h5>
                      <p className="text-xs text-blue-800 line-clamp-3">{prediction.analysis.summary.substring(0, 200)}...</p>
                      {prediction.analysis.trends.length > 0 && (
                        <p className="text-xs text-blue-700 mt-1"><strong>Trends:</strong> {prediction.analysis.trends.slice(0, 2).join(', ')}</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleDeletePrediction(prediction._id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
                  >
                    Delete Prediction
                  </button>
                </Card>
              ))}

              {predictions.length === 0 && !showPredictionForm && (
                <p className="text-gray-600 text-center py-8">No predictions yet. Select a business metric to generate predictions.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
