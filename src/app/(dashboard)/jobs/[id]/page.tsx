"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import {
  Briefcase, MapPin, Clock, DollarSign, Users, Building2, Globe,
  ArrowLeft, Trash2, Send, X, CheckCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as Id<"jobs">

  const job = useQuery(api.jobs.getJob, { jobId })
  const deleteJob = useMutation(api.jobs.deleteJob)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showApplications, setShowApplications] = useState(false)

  if (job === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    )
  }

  if (job === null) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg text-gray-500">Job not found</p>
        <Link href="/jobs" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm("Delete this job listing? All applications will be removed.")) return
    await deleteJob({ jobId })
    router.push("/jobs")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/jobs" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      {/* Header */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{job.title}</h1>
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
                  <Globe className="w-3 h-3 inline mr-1" />Remote
                </span>
              )}
              {job.isExpired && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Expired
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
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
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {job.applicantCount} applicant
                {job.applicantCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-destructive"
              title="Delete job"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Posted by */}
        {job.poster && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Image
              src={job.poster.profilePicture || "/placeholder-avatar.png"}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium">{job.poster.name}</p>
              <p className="text-xs text-gray-400">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Description</h2>
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {job.description}
        </div>
      </div>

      {/* Skills */}
      {job.skillsRequired.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.skillsRequired.map((skill: string) => (
              <span
                key={skill}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Apply / Already Applied */}
      {!job.isExpired && (
        <div className="bg-white border rounded-xl p-6 text-center">
          {job.viewerApplication ? (
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                You applied — Status:{" "}
                <span className="capitalize">{job.viewerApplication.status}</span>
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
            >
              <Send className="w-4 h-4" /> Easy Apply
            </button>
          )}
        </div>
      )}

      {/* View Applications (Poster) */}
      <div className="bg-white border rounded-xl p-6">
        <button
          onClick={() => setShowApplications(!showApplications)}
          className="text-primary hover:underline text-sm font-medium"
        >
          {showApplications ? "Hide Applications" : "View Applications (Poster Only)"}
        </button>
        {showApplications && <ApplicationsList jobId={jobId} />}
      </div>

      {showApplyModal && (
        <ApplyModal jobId={jobId} onClose={() => setShowApplyModal(false)} />
      )}
    </div>
  )
}

function ApplyModal({ jobId, onClose }: { jobId: Id<"jobs">; onClose: () => void }) {
  const apply = useMutation(api.jobs.applyToJob)
  const [coverLetter, setCoverLetter] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setError("")
    setLoading(true)
    try {
      await apply({
        jobId,
        coverLetter: coverLetter || undefined,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Apply to this Position</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cover Letter (optional)</label>
            <textarea
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{coverLetter.length}/3000</p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApplicationsList({ jobId }: { jobId: Id<"jobs"> }) {
  const apps = useQuery(api.jobs.getJobApplications, { jobId })
  const updateStatus = useMutation(api.jobs.updateApplicationStatus)

  if (apps === undefined)
    return <p className="text-gray-400 text-sm mt-3">Loading...</p>

  if (!Array.isArray(apps))
    return <p className="text-red-400 text-sm mt-3">Only the poster can view applications.</p>

  if (apps.length === 0)
    return <p className="text-gray-400 text-sm mt-3">No applications yet.</p>

  const statusColors: Record<string, string> = {
    applied: "bg-yellow-100 text-yellow-700",
    viewed: "bg-blue-100 text-blue-700",
    shortlisted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }

  return (
    <div className="mt-4 space-y-3">
      {apps.map((app) => (
        <div key={app._id} className="border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={app.applicant?.profilePicture || "/placeholder-avatar.png"}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-sm">{app.applicant?.name || "Unknown"}</p>
              {app.applicant?.university && (
                <p className="text-xs text-gray-500">{app.applicant.university}</p>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[app.status]}`}>
                {app.status}
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            {app.status !== "shortlisted" && (
              <button
                onClick={() =>
                  updateStatus({ applicationId: app._id, status: "shortlisted" })
                }
                className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
              >
                Shortlist
              </button>
            )}
            {app.status !== "rejected" && (
              <button
                onClick={() =>
                  updateStatus({ applicationId: app._id, status: "rejected" })
                }
                className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
              >
                Reject
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
