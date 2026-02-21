"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400",
    expired: "bg-muted text-muted-foreground",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? colors.expired}`}>
      {status}
    </span>
  )
}

export default function AdsDashboardPage() {
  const analytics = useQuery(api.ads.getAdAnalytics, {})
  const deleteAd = useMutation(api.ads.deleteAd)
  const updateAd = useMutation(api.ads.updateAd)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (adId: Id<"ads">) => {
    if (!confirm("Delete this ad? This cannot be undone.")) return
    setDeleting(adId)
    try {
      await deleteAd({ adId })
    } finally {
      setDeleting(null)
    }
  }

  const handleToggle = async (adId: Id<"ads">, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    await updateAd({ adId, status: newStatus as "active" | "paused" })
  }

  const totalImpressions = analytics?.reduce((s: number, a) => s + a.impressions, 0) ?? 0
  const totalClicks = analytics?.reduce((s: number, a) => s + a.clicks, 0) ?? 0
  const avgCtr =
    totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 10000) / 100
      : 0

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ad Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your campaigns and track performance.</p>
        </div>
        <Link
          href="/ads/create"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Ad
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Impressions", value: totalImpressions.toLocaleString() },
          { label: "Total Clicks", value: totalClicks.toLocaleString() },
          { label: "Avg CTR", value: `${avgCtr}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ads table */}
      {analytics === undefined ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : analytics.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-muted/20">
          <p className="text-muted-foreground">No ads yet.</p>
          <Link href="/ads/create" className="text-primary text-sm mt-2 inline-block hover:underline">
            Create your first ad →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Ad Title", "Status", "Impressions", "Clicks", "CTR", "Budget", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics.map((ad) => (
                <tr key={ad.adId.toString()} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{ad.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ad.status} />
                  </td>
                  <td className="px-4 py-3">{ad.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3">{ad.ctr}%</td>
                  <td className="px-4 py-3">${(ad.budget / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleToggle(ad.adId, ad.status)}
                      className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors"
                    >
                      {ad.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => handleDelete(ad.adId)}
                      disabled={deleting === ad.adId.toString()}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-destructive hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {deleting === ad.adId.toString() ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
