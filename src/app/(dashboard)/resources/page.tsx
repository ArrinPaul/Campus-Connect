"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import {
  BookOpen, Search, Star, Download, Upload, Plus, X, Filter
} from "lucide-react"

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)

  const resources = useQuery(api.resources.getResources, {
    query: searchQuery || undefined,
    course: courseFilter || undefined,
  })

  const downloadResource = useMutation(api.resources.downloadResource)
  const rateResource = useMutation(api.resources.rateResource)

  const handleDownload = async (resourceId: Id<"resources">, fileUrl?: string) => {
    await downloadResource({ resourceId })
    if (fileUrl) window.open(fileUrl, "_blank")
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            Study Resources
          </h1>
          <p className="text-muted-foreground mt-1">Share and discover study materials</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-primary-foreground rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Upload Resource
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resources, courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by course (e.g. CS101)"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-60"
          />
          {courseFilter && (
            <button onClick={() => setCourseFilter("")} className="text-muted-foreground hover:text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Resources Grid */}
      {!resources ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No resources found</p>
          <p className="text-sm">Be the first to share study materials!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {resources.map((resource) => (
            <div key={resource._id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{resource.title}</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                  {resource.course}
                </span>
              </div>

              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{resource.description}</p>

              {resource.subject && (
                <p className="text-xs text-muted-foreground mb-3">Subject: {resource.subject}</p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => rateResource({ resourceId: resource._id, rating: i + 1 })}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          i < Math.round(resource.rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {resource.rating.toFixed(1)} ({resource.ratingCount})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> {resource.downloadCount} downloads
                  </span>
                  {resource.uploader && (
                    <span>by {resource.uploader.name}</span>
                  )}
                </div>

                {resource.fileUrl && (
                  <button
                    onClick={() => handleDownload(resource._id, resource.fileUrl)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded text-sm hover:bg-emerald-100"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && <UploadResourceModal onClose={() => setShowUploadModal(false)} />}
    </div>
  )
}

function UploadResourceModal({ onClose }: { onClose: () => void }) {
  const upload = useMutation(api.resources.uploadResource)
  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    subject: "",
    fileUrl: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    try {
      await upload({
        title: form.title,
        description: form.description,
        course: form.course,
        subject: form.subject || undefined,
        fileUrl: form.fileUrl || undefined,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upload Resource</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Data Structures Notes"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Course *</label>
            <input
              value={form.course}
              onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
              placeholder="e.g. CS101"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Computer Science"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the resource..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">File URL</label>
            <input
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 bg-emerald-600 text-primary-foreground rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Resource"}
          </button>
        </div>
      </div>
    </div>
  )
}
