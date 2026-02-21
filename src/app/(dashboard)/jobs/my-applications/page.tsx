"use client"

import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { ArrowLeft, Briefcase, MapPin, Building2, Clock } from "lucide-react"
import Link from "next/link"

export default function MyApplicationsPage() {
  const applications = useQuery(api.jobs.getUserApplications)

  const statusColors: Record<string, string> = {
    applied: "bg-yellow-100 text-yellow-700 border-yellow-200",
    viewed: "bg-primary/10 text-primary border-blue-200",
    shortlisted: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  }

  const statusDescriptions: Record<string, string> = {
    applied: "Application submitted",
    viewed: "Viewed by employer",
    shortlisted: "You've been shortlisted!",
    rejected: "Application declined",
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/jobs" className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground text-sm mt-1">Track the status of your job applications</p>
      </div>

      {applications === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No applications yet</p>
          <p className="text-sm">Browse jobs and apply to get started</p>
          <Link href="/jobs" className="text-primary hover:underline text-sm mt-2 inline-block">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(applications as any[]).map((app) => (
            <div key={app._id} className="bg-card border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  {app.job ? (
                    <Link
                      href={`/jobs/${app.job._id}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {app.job.title}
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold text-muted-foreground">Job removed</p>
                  )}
                  {app.job && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {app.job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {app.job.location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[app.status]}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{statusDescriptions[app.status]}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Applied {new Date(app.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
