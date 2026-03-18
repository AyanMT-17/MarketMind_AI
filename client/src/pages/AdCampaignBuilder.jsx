import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { getApiBaseUrl } from '../lib/api'

export default function AdCampaignBuilder() {
  const { addToast: showToast } = useToast()

  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platform: 'facebook',
    budget: '',
    dailyBudget: '',
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      gender: 'all',
      interests: '',
      demographics: '',
      locations: ''
    },
    adContent: {
      headline: '',
      description: '',
      primaryImage: '',
      callToAction: 'Learn More',
      landingUrl: ''
    },
    schedule: {
      startDate: '',
      endDate: '',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      timeSlots: ''
    }
  })

  const API_BASE_URL = getApiBaseUrl()

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
      const data = await response.json()
      if (data.success) {
        setCampaigns(data.campaigns)
      }
    } catch {
      showToast('Failed to fetch campaigns', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('audience_')) {
      const field = name.replace('audience_', '')
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          [field]: value
        }
      }))
    } else if (name.startsWith('content_')) {
      const field = name.replace('content_', '')
      setFormData(prev => ({
        ...prev,
        adContent: {
          ...prev.adContent,
          [field]: value
        }
      }))
    } else if (name.startsWith('schedule_')) {
      const field = name.replace('schedule_', '')
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget),
        dailyBudget: parseFloat(formData.dailyBudget) || 0,
        targetAudience: {
          ...formData.targetAudience,
          ageRange: {
            min: parseInt(formData.targetAudience.ageRange.min),
            max: parseInt(formData.targetAudience.ageRange.max)
          },
          interests: formData.targetAudience.interests.split(',').map(i => i.trim()),
          demographics: formData.targetAudience.demographics.split(',').map(d => d.trim()),
          locations: formData.targetAudience.locations.split(',').map(l => l.trim())
        },
        schedule: {
          ...formData.schedule,
          timeSlots: formData.schedule.timeSlots.split(',').map(t => t.trim())
        }
      }

      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `${API_BASE_URL}/campaigns/${editingId}` : `${API_BASE_URL}/campaigns`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        showToast(editingId ? 'Campaign updated successfully' : 'Campaign created successfully', 'success')
        setShowForm(false)
        setEditingId(null)
        setFormData({
          name: '',
          description: '',
          platform: 'facebook',
          budget: '',
          dailyBudget: '',
          targetAudience: {
            ageRange: { min: 18, max: 65 },
            gender: 'all',
            interests: '',
            demographics: '',
            locations: ''
          },
          adContent: {
            headline: '',
            description: '',
            primaryImage: '',
            callToAction: 'Learn More',
            landingUrl: ''
          },
          schedule: {
            startDate: '',
            endDate: '',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            timeSlots: ''
          }
        })
        fetchCampaigns()
      }
    } catch {
      showToast('Failed to save campaign', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (campaign) => {
    setEditingId(campaign._id)
    setFormData({
      name: campaign.name,
      description: campaign.description,
      platform: campaign.platform,
      budget: campaign.budget.toString(),
      dailyBudget: campaign.dailyBudget.toString(),
      targetAudience: {
        ageRange: campaign.targetAudience.ageRange,
        gender: campaign.targetAudience.gender,
        interests: campaign.targetAudience.interests.join(', '),
        demographics: campaign.targetAudience.demographics.join(', '),
        locations: campaign.targetAudience.locations.join(', ')
      },
      adContent: campaign.adContent,
      schedule: {
        startDate: campaign.schedule.startDate,
        endDate: campaign.schedule.endDate,
        daysOfWeek: campaign.schedule.daysOfWeek,
        timeSlots: campaign.schedule.timeSlots.join(', ')
      }
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        })
        const data = await response.json()
        if (data.success) {
          showToast('Campaign deleted successfully', 'success')
          fetchCampaigns()
        }
      } catch {
        showToast('Failed to delete campaign', 'error')
      }
    }
  }

  if (loading && campaigns.length === 0) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 p-2">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="editorial-title text-4xl font-bold text-[#1f201d]">Ad Campaigns</h1>
          <Button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
            }}
            variant="secondary"
          >
            {showForm ? 'Cancel' : 'Create Campaign'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#1f201d]">
              {editingId ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Campaign Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4f473d]">Platform</label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="google">Google Ads</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>
              </div>

              <textarea
                name="description"
                placeholder="Campaign Description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                rows="2"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Total Budget ($)"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Daily Budget ($)"
                  name="dailyBudget"
                  type="number"
                  value={formData.dailyBudget}
                  onChange={handleInputChange}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xl font-semibold text-[#1f201d]">Target Audience</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Min Age"
                    name="audience_ageRange.min"
                    type="number"
                    value={formData.targetAudience.ageRange.min}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        targetAudience: {
                          ...prev.targetAudience,
                          ageRange: { ...prev.targetAudience.ageRange, min: parseInt(e.target.value) }
                        }
                      }))
                    }}
                  />
                  <Input
                    label="Max Age"
                    name="audience_ageRange.max"
                    type="number"
                    value={formData.targetAudience.ageRange.max}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        targetAudience: {
                          ...prev.targetAudience,
                          ageRange: { ...prev.targetAudience.ageRange, max: parseInt(e.target.value) }
                        }
                      }))
                    }}
                  />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4f473d]">Gender</label>
                    <select
                      name="audience_gender"
                      value={formData.targetAudience.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                    >
                      <option value="all">All</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Interests (comma separated)"
                  name="audience_interests"
                  value={formData.targetAudience.interests}
                  onChange={handleInputChange}
                  placeholder="e.g., Technology, Sports, Travel"
                />
                <Input
                  label="Demographics (comma separated)"
                  name="audience_demographics"
                  value={formData.targetAudience.demographics}
                  onChange={handleInputChange}
                  placeholder="e.g., College educated, Tech savvy"
                />
                <Input
                  label="Locations (comma separated)"
                  name="audience_locations"
                  value={formData.targetAudience.locations}
                  onChange={handleInputChange}
                  placeholder="e.g., USA, UK, Canada"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xl font-semibold text-[#1f201d]">Ad Content</h3>
                <Input
                  label="Headline"
                  name="content_headline"
                  value={formData.adContent.headline}
                  onChange={handleInputChange}
                  required
                />
                <textarea
                  name="content_description"
                  placeholder="Ad Description"
                  value={formData.adContent.description}
                  onChange={handleInputChange}
                  className="w-full rounded-[1.35rem] border border-[#e4d5c2] bg-[#fffaf1] px-4 py-3 text-[#1f201d] focus:border-[#3fc46f] focus:outline-none focus:ring-4 focus:ring-[#dff5e3]"
                  rows="3"
                />
                <Input
                  label="Primary Image URL"
                  name="content_primaryImage"
                  value={formData.adContent.primaryImage}
                  onChange={handleInputChange}
                  type="url"
                />
                <Input
                  label="Landing URL"
                  name="content_landingUrl"
                  value={formData.adContent.landingUrl}
                  onChange={handleInputChange}
                  type="url"
                  required
                />
                <Input
                  label="Call To Action"
                  name="content_callToAction"
                  value={formData.adContent.callToAction}
                  onChange={handleInputChange}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xl font-semibold text-[#1f201d]">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    name="schedule_startDate"
                    type="date"
                    value={formData.schedule.startDate}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="End Date"
                    name="schedule_endDate"
                    type="date"
                    value={formData.schedule.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Campaign'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <Card key={campaign._id} className="p-6 hover:shadow-lg transition">
              <h3 className="mb-2 text-xl font-bold text-[#1f201d]">{campaign.name}</h3>
              <p className="mb-4 text-sm text-[#6a6055]">{campaign.description}</p>
              
              <div className="mb-4 space-y-2 text-sm text-[#4f473d]">
                <p><strong>Platform:</strong> {campaign.platform}</p>
                <p><strong>Budget:</strong> ${campaign.budget.toFixed(2)}</p>
                <p><strong>Status:</strong> <span className={`rounded-full px-2.5 py-1 text-xs ${campaign.status === 'active' ? 'bg-[#eef9ef] text-[#249a52]' : 'bg-[#f3e7d4] text-[#6a6055]'}`}>{campaign.status}</span></p>
                <p><strong>Performance:</strong></p>
                <div className="ml-2 text-xs">
                  <p>Impressions: {campaign.performance.impressions}</p>
                  <p>Clicks: {campaign.performance.clicks}</p>
                  <p>CTR: {campaign.performance.ctr.toFixed(2)}%</p>
                  <p>Spend: ${campaign.performance.spend.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(campaign)}
                  variant="secondary"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(campaign._id)}
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {campaigns.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-lg text-[#6a6055]">No campaigns yet. Create your first campaign to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
