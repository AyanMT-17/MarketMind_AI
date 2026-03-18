import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { getApiBaseUrl } from '../lib/api'

export default function BusinessPrediction() {
  const { addToast: showToast } = useToast()

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

  const API_BASE_URL = getApiBaseUrl()

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
    } catch {
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
    } catch {
      showToast('Failed to fetch predictions', 'error')
    }
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row')
    }

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
    } catch {
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
    } catch {
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
      } catch {
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
      } catch {
        showToast('Failed to delete prediction', 'error')
      }
    }
  }

  if (loading && businessMetrics.length === 0 && predictions.length === 0) {
    return <div className="flex justify-center items-center h-[60vh]"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 p-2">
      <div className="max-w-7xl mx-auto">
        <h1 className="editorial-title mb-8 text-4xl font-bold text-[#1f201d]">Business Prediction & Analytics</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1f201d]">Business Metrics</h2>
              <Button onClick={() => setShowMetricsForm(!showMetricsForm)} variant="secondary">
                {showMetricsForm ? 'Cancel' : 'Add Metrics'}
              </Button>
            </div>

            {showMetricsForm && (
              <Card className="mb-6 p-6">
                <h3 className="mb-4 text-xl font-bold text-[#1f201d]">Upload Quarterly Data</h3>
                <form onSubmit={handleMetricsSubmit} className="space-y-4">
                  <Input
                    label="Business Name"
                    value={metricsFormData.businessName}
                    onChange={(e) => setMetricsFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    required
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4f473d]">
                      Upload CSV File (Quarter, Year, Revenue, Profit, Customers, Expenses)
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d]"
                    />
                    {csvFile && <p className="mt-2 text-sm text-[#249a52]">{csvFile} uploaded</p>}
                  </div>

                  {metricsFormData.metrics.length > 0 && (
                    <div className="rounded-[1.5rem] bg-[#eef9ef] p-4">
                      <h4 className="mb-2 font-semibold text-[#249a52]">Data Preview ({metricsFormData.metrics.length} quarters)</h4>
                      <div className="max-h-32 overflow-y-auto text-sm text-[#4f473d]">
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
                    className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                    rows="3"
                  />

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Saving...' : 'Save Metrics'}
                    </Button>
                    <Button type="button" onClick={() => setShowMetricsForm(false)} variant="secondary" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="space-y-4">
              {businessMetrics.map(metric => (
                <Card key={metric._id} className="p-4">
                  <h4 className="text-lg font-bold text-[#1f201d]">{metric.businessName}</h4>
                  <p className="mb-2 text-sm text-[#6a6055]">
                    {metric.metrics.length} quarters • Created {new Date(metric.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mb-3 text-sm text-[#4f473d]">
                    <p>Latest: {metric.metrics[metric.metrics.length - 1]?.quarter} {metric.metrics[metric.metrics.length - 1]?.year}</p>
                    <p>Revenue: ${metric.metrics[metric.metrics.length - 1]?.revenue}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedMetrics(metric)
                        setShowPredictionForm(true)
                      }}
                      variant="secondary"
                      className="flex-1"
                    >
                      Generate Prediction
                    </Button>
                    <Button onClick={() => handleDeleteMetrics(metric._id)} variant="danger" className="flex-1">
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}

              {businessMetrics.length === 0 && !showMetricsForm && (
                <p className="py-8 text-center text-[#6a6055]">No business metrics yet. Upload your quarterly data to get started.</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#1f201d]">Predictions</h2>
            </div>

            {showPredictionForm && selectedMetrics && (
              <Card className="mb-6 p-6">
                <h3 className="mb-4 text-xl font-bold text-[#1f201d]">Generate Prediction for {selectedMetrics.businessName}</h3>
                <form onSubmit={handlePredictionSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4f473d]">Prediction Period</label>
                    <select
                      value={predictionFormData.predictionPeriod}
                      onChange={(e) => setPredictionFormData(prev => ({ ...prev, predictionPeriod: e.target.value }))}
                      className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                    >
                      <option value="next_quarter">Next Quarter</option>
                      <option value="next_2_quarters">Next 2 Quarters</option>
                      <option value="next_year">Next Year</option>
                      <option value="next_2_years">Next 2 Years</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Enter your prediction prompt..."
                    value={predictionFormData.userPrompt}
                    onChange={(e) => setPredictionFormData(prev => ({ ...prev, userPrompt: e.target.value }))}
                    className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                    rows="4"
                    required
                  />

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Generating...' : 'Generate Prediction'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPredictionForm(false)
                        setSelectedMetrics(null)
                      }}
                      variant="secondary"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="space-y-4">
              {predictions.map(prediction => (
                <Card key={prediction._id} className="bg-[linear-gradient(180deg,_rgba(255,251,245,0.96)_0%,_rgba(238,249,239,0.9)_100%)] p-4">
                  <h4 className="text-lg font-bold text-[#1f201d]">{prediction.businessName}</h4>
                  <p className="mb-3 text-sm text-[#6a6055]">{prediction.userPrompt}</p>

                  <div className="mb-3 rounded-[1.2rem] bg-[#fffaf1] p-3">
                    <h5 className="mb-2 text-sm font-semibold text-[#4f473d]">Predictions</h5>
                    {prediction.predictions.map((p, i) => (
                      <div key={i} className="mb-1 text-xs text-[#6a6055]">
                        <p><strong>{p.period}:</strong> Revenue ${p.predictedRevenue}, Profit ${p.predictedProfit} (Confidence: {(p.confidenceScore * 100).toFixed(0)}%)</p>
                      </div>
                    ))}
                  </div>

                  {prediction.analysis.summary && (
                    <div className="mb-3 rounded-[1.2rem] bg-[#eef9ef] p-3">
                      <h5 className="mb-1 text-sm font-semibold text-[#249a52]">Analysis</h5>
                      <p className="line-clamp-3 text-xs text-[#4f473d]">{prediction.analysis.summary.substring(0, 200)}...</p>
                      {prediction.analysis.trends.length > 0 && (
                        <p className="mt-1 text-xs text-[#249a52]"><strong>Trends:</strong> {prediction.analysis.trends.slice(0, 2).join(', ')}</p>
                      )}
                    </div>
                  )}

                  <Button onClick={() => handleDeletePrediction(prediction._id)} variant="danger" className="w-full">
                    Delete Prediction
                  </Button>
                </Card>
              ))}

              {predictions.length === 0 && !showPredictionForm && (
                <p className="py-8 text-center text-[#6a6055]">No predictions yet. Select a business metric to generate predictions.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
