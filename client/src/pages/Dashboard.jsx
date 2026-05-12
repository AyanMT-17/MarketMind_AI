"use client"

import { useState } from "react"
import { useProjects } from "../hooks/useProjects"
import Card from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"

function Dashboard() {
  const { projects, loading, error, createProject, deleteProject, fetchProjects } = useProjects()
  const { addToast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    targetAudience: "",
    competitors: "",
    coreFeatures: ""
  })

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
    try {
      await deleteProject(projectId)
      addToast("Project deleted", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  if (loading) {
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
              { label: "Strategy Engines", value: "5 Active" }
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
              <label className="block text-sm font-medium text-[#544b40] mb-1">Core Description</label>
              <Input
                required
                value={newProject.description}
                onChange={e => setNewProject({...newProject, description: e.target.value})}
                placeholder="A brief summary of the problem it solves."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#544b40] mb-1">Target Audience</label>
              <Input
                value={newProject.targetAudience}
                onChange={e => setNewProject({...newProject, targetAudience: e.target.value})}
                placeholder="e.g., Software Engineers, Content Creators"
              />
            </div>
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
                placeholder="e.g., Automated PR Reviews, Inline Suggestions"
              />
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
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f201d]">{project.name}</h3>
                    <p className="mt-2 text-sm text-[#6a6055]">{project.description}</p>
                    {project.targetAudience && (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#249a52]">
                        {project.targetAudience}
                      </p>
                    )}
                  </div>
                </div>

                {(project.competitors?.length > 0 || project.coreFeatures?.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {project.competitors?.length > 0 && (
                      <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Competitors</p>
                        <p className="mt-2 text-sm font-semibold text-[#1f201d]">{project.competitors.join(", ")}</p>
                      </div>
                    )}
                    {project.coreFeatures?.length > 0 && (
                      <div className="rounded-[1.6rem] bg-[#fffaf1] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#958675]">Key Features</p>
                        <p className="mt-2 text-sm font-semibold text-[#1f201d]">{project.coreFeatures.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-2 border-t border-[#eadbc7] pt-4">
                  {/* Phase 5 modules would be linked here */}
                  <Button variant="secondary" onClick={() => alert("Generate Market Validation (Coming soon)")}>Market Validation</Button>
                  <Button variant="secondary" onClick={() => alert("Generate Launch Plan (Coming soon)")}>Launch Plan</Button>
                  <Button variant="secondary" onClick={() => alert("Pitch Simulator (Coming soon)")}>Pitch Simulator</Button>
                  <Button variant="danger" onClick={() => handleDelete(project._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
