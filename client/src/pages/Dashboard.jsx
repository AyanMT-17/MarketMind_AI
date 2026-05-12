"use client"

import { useState, useEffect } from "react"
import { useProjects } from "../hooks/useProjects"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import Modal from "../components/UI/Modal"
import StrategyReport from "../components/StrategyReport"
import { useToast } from "../contexts/ToastContext"

function Dashboard() {
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    deleteProject, 
    fetchProjects, 
    generateStrategy,
    getReports
  } = useProjects()
  
  const { addToast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectReports, setProjectReports] = useState({}) // { projectId: [reports] }
  const [reportModal, setReportModal] = useState({ isOpen: false, type: "", data: null, title: "" })
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    targetAudience: "",
    competitors: "",
    coreFeatures: ""
  })

  // Load reports for all projects
  useEffect(() => {
    const loadAllReports = async () => {
      const reportsMap = {};
      for (const project of projects) {
        try {
          const reports = await getReports(project._id);
          reportsMap[project._id] = reports;
        } catch (err) {
          console.error(`Failed to load reports for project ${project._id}`, err);
        }
      }
      setProjectReports(reportsMap);
    };

    if (projects.length > 0) {
      loadAllReports();
    }
  }, [projects, getReports]);

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createProject({
        ...newProject,
        competitors: newProject.competitors.split(",").map(s => s.trim()).filter(Boolean),
        coreFeatures: newProject.coreFeatures.split(",").map(s => s.trim()).filter(Boolean)
      })
      addToast("Project created successfully", "success")
      setIsCreating(false)
      setNewProject({ name: "", description: "", targetAudience: "", competitors: "", coreFeatures: "" })
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return
    try {
      await deleteProject(projectId)
      addToast("Project deleted", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleGenerate = async (projectId, type, title) => {
    setIsGenerating(true)
    try {
      const report = await generateStrategy(projectId, type)
      setReportModal({
        isOpen: true,
        type: report.type,
        data: report.data,
        title: title
      })
      addToast(`${title} generated!`, "success")
      // Refresh reports for this project
      const updatedReports = await getReports(projectId);
      setProjectReports(prev => ({ ...prev, [projectId]: updatedReports }));
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setIsGenerating(false)
    }
  }

  const openExistingReport = (projectId, type, title) => {
    const report = projectReports[projectId]?.find(r => r.type === type);
    if (report) {
      setReportModal({
        isOpen: true,
        type: report.type,
        data: report.data,
        title: title
      });
    }
  }

  const hasReport = (projectId, type) => {
    return projectReports[projectId]?.some(r => r.type === type);
  }

  const renderStrategyButton = (project, type, title) => {
    const exists = hasReport(project._id, type);
    return (
      <Button 
        variant={exists ? "primary" : "secondary"} 
        size="sm"
        disabled={isGenerating}
        onClick={() => exists ? openExistingReport(project._id, type, title) : handleGenerate(project._id, type, title)}
      >
        {exists ? `View ${title}` : `Generate ${title}`}
      </Button>
    );
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[#6a6055]">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-[#eadbc7] bg-[linear-gradient(135deg,_rgba(255,251,245,0.95)_0%,_rgba(247,236,217,0.92)_55%,_rgba(223,245,227,0.85)_120%)] p-8 text-[#1f201d] shadow-[0_28px_70px_rgba(77,56,24,0.08)]">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div>
            <p className="editorial-eyebrow text-xs font-semibold uppercase">Strategic Co-Founder Suite</p>
            <h1 className="editorial-title mt-4 max-w-2xl text-4xl font-semibold leading-tight">
              Validate ideas, build launch plans, and refine your pitch before writing code.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f564b]">
              Define your startup idea and let the AI generate a 100-day execution plan, deep competitor analysis, and organic growth strategies.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? "Cancel" : "New Startup Idea"}
              </Button>
              <Button variant="secondary" size="lg" onClick={fetchProjects}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Active Projects", value: projects.length },
              { label: "Strategy Engines", value: "4 Active" }
            ].map((item) => (
              <div key={item.label} className="rounded-[1.8rem] border border-[#eadbc7] bg-[#fffaf1] p-5">
                <p className="text-sm text-[#7a6f61]">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#1f201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <Card hover={false} className="border-red-100 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : null}

      {isCreating && (
        <Card hover={false} className="rounded-[1.9rem] bg-[rgba(255,251,245,0.88)]">
          <h2 className="text-2xl font-semibold text-[#1f201d] mb-4">Define Your Startup Idea</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#544b40] mb-1">Project Name</label>
                <Input
                  required
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  placeholder="e.g., AutoDev AI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#544b40] mb-1">Target Audience</label>
                <Input
                  value={newProject.targetAudience}
                  onChange={e => setNewProject({...newProject, targetAudience: e.target.value})}
                  placeholder="e.g., Software Engineers"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#544b40] mb-1">Core Description</label>
              <Input
                required
                value={newProject.description}
                onChange={e => setNewProject({...newProject, description: e.target.value})}
                placeholder="A brief summary of the problem it solves."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#544b40] mb-1">Competitors (comma separated)</label>
                <Input
                  value={newProject.competitors}
                  onChange={e => setNewProject({...newProject, competitors: e.target.value})}
                  placeholder="e.g., GitHub Copilot, Cursor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#544b40] mb-1">Core Features (comma separated)</label>
                <Input
                  value={newProject.coreFeatures}
                  onChange={e => setNewProject({...newProject, coreFeatures: e.target.value})}
                  placeholder="e.g., Automated PR Reviews"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </Card>
      )}

      {projects.length === 0 && !isCreating ? (
        <Card hover={false} className="rounded-[2rem] border-dashed border-[#d8c5af] bg-[rgba(255,251,245,0.86)] py-16 text-center">
          <p className="text-lg font-semibold text-[#1f201d]">No projects yet</p>
          <p className="mt-2 text-[#6a6055]">Define your first startup idea to unlock the strategy engines.</p>
          <div className="mt-6 inline-flex">
            <Button onClick={() => setIsCreating(true)}>Create new project</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {projects.map((project) => (
            <Card key={project._id} hover={false} className="rounded-[1.9rem] bg-[rgba(255,251,245,0.88)]">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#1f201d]">{project.name}</h3>
                    <p className="mt-2 text-sm text-[#6a6055]">{project.description}</p>
                    {project.targetAudience && (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#249a52]">
                        {project.targetAudience}
                      </p>
                    )}
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(project._id)}>
                    Delete
                  </Button>
                </div>

                {(project.competitors?.length > 0 || project.coreFeatures?.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {project.competitors?.length > 0 && (
                      <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Competitors</p>
                        <p className="mt-2 text-sm font-semibold text-[#1f201d] truncate">{project.competitors.join(", ")}</p>
                      </div>
                    )}
                    {project.coreFeatures?.length > 0 && (
                      <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Key Features</p>
                        <p className="mt-2 text-sm font-semibold text-[#1f201d] truncate">{project.coreFeatures.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2 border-t border-[#eadbc7] pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8a7b69]">Strategy Engines</p>
                  <div className="flex flex-wrap gap-2">
                    {renderStrategyButton(project, "validation", "Market Validation")}
                    {renderStrategyButton(project, "launch-plan", "Launch Plan")}
                    {renderStrategyButton(project, "100-day-plan", "100-Day Plan")}
                    <Button 
                      variant="secondary" 
                      size="sm"
                      disabled={true}
                    >
                      Pitch Simulator (WIP)
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1f201d]/60 backdrop-blur-md">
          <LoadingSpinner size="lg" />
          <p className="mt-6 text-lg font-medium text-white">AI is crafting your strategy...</p>
          <p className="mt-2 text-sm text-white/60 text-center max-w-xs">Analyzing market fit, competitors, and growth levers.</p>
        </div>
      )}

      <Modal 
        isOpen={reportModal.isOpen} 
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        title={reportModal.title}
      >
        <StrategyReport type={reportModal.type} data={reportModal.data} />
      </Modal>
    </div>
  )
}

export default Dashboard
