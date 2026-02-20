"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import {
  Search, Briefcase, MapPin, Clock, DollarSign, Users, Plus,
  Building2, Globe, Filter, X
} from "lucide-react"
import Link from "next/link"

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"job" | "internship" | "">("")
  const [remoteFilter, setRemoteFilter] = useState<boolean | undefined>(undefined)
  const [showPostModal, setShowPostModal] = useState(false)

  const jobs = useQuery(api.jobs.searchJobs, {
    query: searchQuery || undefined,
    type: typeFilter || undefined,
    remote: remoteFilter,
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            Job &amp; Internship Board
          </h1>
          <p className="text-gray-500 mt-1">
            Find opportunities or post openings for the community
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/jobs/my-applications"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            My Applications
          </Link>
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Post a Job
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500" />

          {/* Type filter */}
          <div className="flex gap-1">
            {(["", "job", "internship"] as const).map((t) => (
              <button
                key={t || "all"}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  typeFilter === t
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "hover:bg-gray-50"
                }`}
              >
                {t === "" ? "All Types" : t === "job" ? "Jobs" : "Internships"}
              </button>
            ))}
          </div>

          {/* Remote filter */}
          <div className="flex gap-1">
            {([undefined, true, false] as const).map((r, i) => (
              <button
                key={i}
                onClick={() => setRemoteFilter(r)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  remoteFilter === r
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "hover:bg-gray-50"
                }`}
              >
                {r === undefined ? "Any Location" : r ? "Remote" : "On-site"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      {!jobs ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No jobs found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <Link
              key={job._id}
              href={`/jobs/${job._id}`}
              className="block bg-white border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.type === "internship"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {job.type === "internship" ? "Internship" : "Full-time"}
                    </span>
                    {job.remote && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Globe className="w-3 h-3 inline mr-1" />
                        Remote
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" /> {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> {job.salary}
                      </span>
                    )}
                    {job.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {job.duration}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{job.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {job.skillsRequired.slice(0, 6).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skillsRequired.length > 6 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400">
                        +{job.skillsRequired.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4 flex-shrink-0">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Users className="w-4 h-4" />
                    {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {showPostModal && <PostJobModal onClose={() => setShowPostModal(false)} />}
    </div>
  )
}

function PostJobModal({ onClose }: { onClose: () => void }) {
  const postJob = useMutation(api.jobs.postJob)
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    type: "job" as "job" | "internship",
    location: "",
    remote: false,
    duration: "",
    skillsRequired: "",
    salary: "",
    expiresInDays: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    try {
      const expiresAt = form.expiresInDays
        ? Date.now() + parseInt(form.expiresInDays) * 86400 * 1000
        : undefined

      await postJob({
        title: form.title,
        company: form.company,
        description: form.description,
        type: form.type,
        location: form.location,
        remote: form.remote,
        duration: form.duration || undefined,
        skillsRequired: form.skillsRequired
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        salary: form.salary || undefined,
        expiresAt,
      })
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Post a Job / Internship</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Frontend Developer"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="e.g. TechCorp"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <div className="flex gap-2">
              {(["job", "internship"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`px-4 py-2 rounded-lg text-sm border ${
                    form.type === t
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {t === "job" ? "Full-time Job" : "Internship"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe responsibilities, requirements..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. San Francisco, CA"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => setForm((f) => ({ ...f, remote: e.target.checked }))}
                  className="rounded"
                />
                Remote friendly
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Salary</label>
              <input
                value={form.salary}
                onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                placeholder="e.g. $120k-$150k"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <input
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="e.g. 3 months"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Required Skills</label>
            <input
              value={form.skillsRequired}
              onChange={(e) => setForm((f) => ({ ...f, skillsRequired: e.target.value }))}
              placeholder="e.g. React, TypeScript, Node.js"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Comma separated</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expires in (days)</label>
            <input
              type="number"
              value={form.expiresInDays}
              onChange={(e) => setForm((f) => ({ ...f, expiresInDays: e.target.value }))}
              placeholder="e.g. 30"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post Job"}
          </button>
        </div>
      </div>
    </div>
  )
}
