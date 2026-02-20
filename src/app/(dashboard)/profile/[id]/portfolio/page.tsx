"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"
import {
  ArrowLeft, Plus, X, ExternalLink, Calendar, Award,
  BookOpen, GraduationCap, FileText, Trash2, Code,
} from "lucide-react"

const TIMELINE_ICONS: Record<string, any> = {
  course: GraduationCap,
  certification: Award,
  publication: FileText,
  award: Award,
}
const TIMELINE_COLORS: Record<string, string> = {
  course: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  certification: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
  publication: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
  award: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400",
}

export default function PortfolioPage() {
  const params = useParams()
  const userId = params.id as Id<"users">
  const { user: clerkUser, isLoaded } = useUser()

  const projects = useQuery(api.portfolio.getProjects, isLoaded ? { userId } : "skip")
  const timeline = useQuery(api.portfolio.getTimeline, isLoaded ? { userId } : "skip")
  const contributionData = useQuery(api.portfolio.getContributionData, isLoaded ? { userId } : "skip")
  const currentUser = useQuery(api.users.getCurrentUser, isLoaded ? {} : "skip")

  const isOwner = currentUser?._id === userId

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [tab, setTab] = useState<"projects" | "timeline" | "activity">("projects")

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href={`/profile/${userId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Portfolio</h1>
        {isOwner && (
          <div className="flex gap-2">
            {tab === "projects" && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Project
              </button>
            )}
            {tab === "timeline" && (
              <button
                onClick={() => setShowTimelineModal(true)}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Milestone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        {(["projects", "timeline", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Projects tab */}
      {tab === "projects" && (
        <ProjectsTab projects={projects} isOwner={isOwner} />
      )}

      {/* Timeline tab */}
      {tab === "timeline" && (
        <TimelineTab timeline={timeline} isOwner={isOwner} />
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <ContributionHeatmap data={contributionData} />
      )}

      {showProjectModal && <AddProjectModal onClose={() => setShowProjectModal(false)} />}
      {showTimelineModal && <AddTimelineModal onClose={() => setShowTimelineModal(false)} />}
    </div>
  )
}

// ─── Projects Tab ───────────────────────────────────────────────

function ProjectsTab({ projects, isOwner }: { projects: any[] | undefined; isOwner: boolean }) {
  const deleteProject = useMutation(api.portfolio.deleteProject)

  if (projects === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Code className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project: any) => (
        <div
          key={project._id}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.title}</h3>
            {isOwner && (
              <button
                onClick={() => deleteProject({ projectId: project._id })}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {project.description}
          </p>
          {project.techStack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {project.techStack.map((tech: string) => (
                <span
                  key={tech}
                  className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          {project.links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {project.links.map((link: string, i: number) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {new URL(link).hostname}
                </a>
              ))}
            </div>
          )}
          {(project.startDate || project.endDate) && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : ""}
              {project.startDate && project.endDate ? " — " : ""}
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Present"}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Timeline Tab ───────────────────────────────────────────────

function TimelineTab({ timeline, isOwner }: { timeline: any[] | undefined; isOwner: boolean }) {
  const deleteItem = useMutation(api.portfolio.deleteTimelineItem)

  if (timeline === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3 py-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1"><div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" /></div>
          </div>
        ))}
      </div>
    )
  }

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Calendar className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">No milestones yet</p>
      </div>
    )
  }

  return (
    <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
      {timeline.map((item: any) => {
        const Icon = TIMELINE_ICONS[item.type] || BookOpen
        const colorClass = TIMELINE_COLORS[item.type] || "bg-gray-100 text-gray-600"
        return (
          <div key={item._id} className="relative">
            <div className={`absolute -left-[29px] flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="ml-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                  {item.institution && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.institution}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(item.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => deleteItem({ itemId: item._id })}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <span className="mt-1 inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs capitalize text-gray-500 dark:text-gray-400">
                {item.type}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Contribution Heatmap ───────────────────────────────────────

function ContributionHeatmap({ data }: { data: Record<string, number> | undefined }) {
  const heatmapCells = useMemo(() => {
    if (!data) return null
    const cells: { date: string; count: number }[] = []
    const today = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      cells.push({ date: key, count: data[key] || 0 })
    }
    return cells
  }, [data])

  if (data === undefined) {
    return <div className="animate-pulse h-32 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
  }

  const totalContributions = heatmapCells
    ? heatmapCells.reduce((sum, c) => sum + c.count, 0)
    : 0

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800"
    if (count <= 2) return "bg-green-200 dark:bg-green-900"
    if (count <= 5) return "bg-green-400 dark:bg-green-700"
    if (count <= 10) return "bg-green-600 dark:bg-green-500"
    return "bg-green-800 dark:bg-green-400"
  }

  // Group into weeks (columns of 7)
  const weeks: { date: string; count: number }[][] = []
  if (heatmapCells) {
    for (let i = 0; i < heatmapCells.length; i += 7) {
      weeks.push(heatmapCells.slice(i, i + 7))
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Activity Heatmap
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {totalContributions} contributions in the last year
      </p>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} contribution${cell.count !== 1 ? "s" : ""}`}
                className={`h-[11px] w-[11px] rounded-[2px] ${getColor(cell.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
        Less
        {[0, 2, 5, 10, 15].map((n) => (
          <div key={n} className={`h-[11px] w-[11px] rounded-[2px] ${getColor(n)}`} />
        ))}
        More
      </div>
    </div>
  )
}

// ─── Add Project Modal ──────────────────────────────────────────

function AddProjectModal({ onClose }: { onClose: () => void }) {
  const addProject = useMutation(api.portfolio.addProject)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [links, setLinks] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await addProject({
        title,
        description,
        techStack: techStack.split(",").map((t) => t.trim()).filter(Boolean),
        links: links.split(",").map((l) => l.trim()).filter(Boolean),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title *" required maxLength={200}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description *" required maxLength={3000} rows={3}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none resize-none" />
          <input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="Tech stack (comma-separated)"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none" />
          <input value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Links (comma-separated)"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={loading || !title.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Adding..." : "Add Project"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Timeline Modal ─────────────────────────────────────────

function AddTimelineModal({ onClose }: { onClose: () => void }) {
  const addItem = useMutation(api.portfolio.addTimelineItem)
  const [type, setType] = useState<"course" | "certification" | "publication" | "award">("course")
  const [title, setTitle] = useState("")
  const [institution, setInstitution] = useState("")
  const [date, setDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await addItem({
        type,
        title,
        institution: institution || undefined,
        date: new Date(date).getTime(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Milestone</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {(["course", "certification", "publication", "award"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`rounded-lg px-2 py-2 text-xs font-medium capitalize transition-colors ${type === t ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                {t}
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" required maxLength={200}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none" />
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution (optional)" maxLength={200}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={loading || !title.trim() || !date} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Adding..." : "Add Milestone"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
