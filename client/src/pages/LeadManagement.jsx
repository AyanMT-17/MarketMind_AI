"use client"

import { useState, useEffect } from "react"
import { useToast } from "../contexts/ToastContext"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"

const PIPELINE_STAGES = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
    { value: 'qualified', label: 'Qualified', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'proposal', label: 'Proposal', color: 'bg-orange-100 text-orange-800' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-pink-100 text-pink-800' },
    { value: 'won', label: 'Won', color: 'bg-green-100 text-green-800' },
    { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
]

const getStageInfo = (stage) => PIPELINE_STAGES.find(s => s.value === stage) || PIPELINE_STAGES[0]

function LeadManagement() {
    const authToken = localStorage.getItem("authToken")
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStage, setFilterStage] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLead, setEditingLead] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const { addToast } = useToast()

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        phone: '',
        pipelineStage: 'new',
        dealValue: '',
        probability: '',
    })

    const fetchLeads = async () => {
        try {
            const params = new URLSearchParams()
            if (filterStage !== 'all') params.append('stage', filterStage)
            if (searchQuery) params.append('search', searchQuery)

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/leads?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            )

            if (!response.ok) throw new Error('Failed to fetch leads')

            const data = await response.json()
            setLeads(data.leads || [])
        } catch (error) {
            addToast(error.message || 'Failed to fetch leads', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeads()
    }, [filterStage, searchQuery])

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            company: '',
            phone: '',
            pipelineStage: 'new',
            dealValue: '',
            probability: '',
        })
        setEditingLead(null)
    }

    const openCreateModal = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const openEditModal = (lead) => {
        setFormData({
            firstName: lead.contactInfo.firstName,
            lastName: lead.contactInfo.lastName,
            email: lead.contactInfo.email,
            company: lead.contactInfo.company || '',
            phone: lead.contactInfo.phone || '',
            pipelineStage: lead.pipelineStage,
            dealValue: lead.dealValue?.toString() || '',
            probability: lead.probability?.toString() || '',
        })
        setEditingLead(lead)
        setIsModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const url = editingLead
                ? `${import.meta.env.VITE_API_BASE_URL}/api/leads/${editingLead._id}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/leads`

            const response = await fetch(url, {
                method: editingLead ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    ...formData,
                    dealValue: formData.dealValue ? parseFloat(formData.dealValue) : 0,
                    probability: formData.probability ? parseInt(formData.probability) : 10,
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Operation failed')
            }

            addToast(editingLead ? 'Lead updated successfully!' : 'Lead created successfully!', 'success')
            setIsModalOpen(false)
            resetForm()
            fetchLeads()
        } catch (error) {
            addToast(error.message || 'Operation failed', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (leadId) => {
        if (!confirm('Are you sure you want to delete this lead?')) return

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/leads/${leadId}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            )

            if (!response.ok) throw new Error('Failed to delete lead')

            addToast('Lead deleted successfully!', 'success')
            fetchLeads()
        } catch (error) {
            addToast(error.message || 'Failed to delete lead', 'error')
        }
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
                <Button onClick={openCreateModal}>+ Add New Lead</Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search leads by name, email, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="all">All Stages</option>
                            {PIPELINE_STAGES.map(stage => (
                                <option key={stage.value} value={stage.value}>{stage.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                    <div className="text-2xl font-bold text-green-600">{leads.length}</div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                </Card>
                <Card className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {leads.filter(l => l.pipelineStage === 'new').length}
                    </div>
                    <div className="text-sm text-gray-600">New</div>
                </Card>
                <Card className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                        {leads.filter(l => ['qualified', 'proposal', 'negotiation'].includes(l.pipelineStage)).length}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                </Card>
                <Card className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        ${leads.reduce((sum, l) => sum + (l.dealValue || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                </Card>
            </div>

            {/* Leads Table */}
            <Card>
                {leads.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No leads found</p>
                        <Button onClick={openCreateModal}>Create Your First Lead</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leads.map((lead) => {
                                    const stageInfo = getStageInfo(lead.pipelineStage)
                                    return (
                                        <tr key={lead._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">
                                                    {lead.contactInfo.firstName} {lead.contactInfo.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">{lead.contactInfo.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {lead.contactInfo.company || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageInfo.color}`}>
                                                    {stageInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${(lead.dealValue || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full"
                                                            style={{ width: `${lead.probability || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{lead.probability || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(lead)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lead._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>

                        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                {editingLead ? 'Edit Lead' : 'Create New Lead'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="First Name *"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <Input
                                        label="Last Name *"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Email *"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                    />
                                    <Input
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline Stage</label>
                                    <select
                                        name="pipelineStage"
                                        value={formData.pipelineStage}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        {PIPELINE_STAGES.map(stage => (
                                            <option key={stage.value} value={stage.value}>{stage.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Deal Value ($)"
                                        name="dealValue"
                                        type="number"
                                        value={formData.dealValue}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                    />
                                    <Input
                                        label="Probability (%)"
                                        name="probability"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.probability}
                                        onChange={handleInputChange}
                                        placeholder="10"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={submitting}>
                                        {editingLead ? 'Update Lead' : 'Create Lead'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeadManagement
