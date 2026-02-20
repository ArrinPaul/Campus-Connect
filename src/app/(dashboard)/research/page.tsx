"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import Link from "next/link"
import {
  Search, FileText, Plus, Tag, Users, ExternalLink,
  BookOpen, X,
} from "lucide-react"

function PaperCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
      <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 mb-1" />
      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

export default function ResearchPage() {
  const { isLoaded } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [tab, setTab] = useState<"browse" | "collaborate">("browse")

  const papers = useQuery(
    api.papers.searchPapers,
    isLoaded
      ? { query: searchQuery || undefined, tag: tagFilter || undefined, limit: 30 }
      : "skip"
  )

  const collabPapers = useQuery(
    api.papers.getCollaborationOpportunities,
    isLoaded && tab === "collaborate" ? { limit: 30 } : "skip"
  )

  const displayPapers = tab === "collaborate" ? collabPapers : papers

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Research Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discover papers, find collaborators, and share your work
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Upload Paper
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        {(["browse", "collaborate"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t === "browse" ? "Browse Papers" : "Looking for Collaborators"}
          </button>
        ))}
      </div>

      {/* Search bar */}
      {tab === "browse" && (
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Paper list */}
      {displayPapers === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <PaperCardSkeleton key={i} />)}
        </div>
      ) : displayPapers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {tab === "collaborate"
              ? "No collaboration opportunities right now"
              : "No papers found"}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Upload the first paper
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayPapers.map((paper: any) => (
            <Link
              key={paper._id}
              href={`/research/${paper._id}`}
              className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {paper.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {paper.authors.join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {paper.abstract}
                  </p>
                  {paper.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {paper.tags.slice(0, 5).map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {paper.tags.length > 5 && (
                        <span className="text-xs text-gray-400">+{paper.tags.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
                {paper.lookingForCollaborators && (
                  <span className="flex-shrink-0 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <Users className="inline h-3 w-3 mr-1" />
                    Collaborators Wanted
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                {paper.uploader && (
                  <span className="flex items-center gap-1">
                    {paper.uploader.profilePicture ? (
                      <Image src={paper.uploader.profilePicture} alt="" width={16} height={16} className="rounded-full" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-blue-600 text-[8px] text-white flex items-center justify-center font-bold">
                        {paper.uploader.name.charAt(0)}
                      </div>
                    )}
                    {paper.uploader.name}
                  </span>
                )}
                {paper.doi && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    DOI: {paper.doi}
                  </span>
                )}
                <span>{paper.citationCount} citations</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadPaperModal onClose={() => setShowUploadModal(false)} />}
    </div>
  )
}

// ─── Upload Paper Modal ─────────────────────────────────────────

function UploadPaperModal({ onClose }: { onClose: () => void }) {
  const uploadPaper = useMutation(api.papers.uploadPaper)
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [authors, setAuthors] = useState("")
  const [doi, setDoi] = useState("")
  const [tags, setTags] = useState("")
  const [lookingForCollaborators, setLookingForCollaborators] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await uploadPaper({
        title,
        abstract,
        authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
        doi: doi || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        lookingForCollaborators,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload paper")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Upload Paper</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={300}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Abstract *</label>
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              required
              maxLength={5000}
              rows={4}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authors * (comma-separated)</label>
            <input
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              required
              placeholder="Alice Smith, Bob Jones"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DOI (optional)</label>
            <input
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              maxLength={100}
              placeholder="10.1234/example"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="machine learning, NLP, transformers"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={lookingForCollaborators}
              onChange={(e) => setLookingForCollaborators(e.target.checked)}
              className="rounded border-gray-300"
            />
            Looking for collaborators
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !abstract.trim() || !authors.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Paper"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
