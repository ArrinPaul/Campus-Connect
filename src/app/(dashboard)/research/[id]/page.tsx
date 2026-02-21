"use client"

import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft, FileText, ExternalLink, Users, Tag, Download,
  Calendar, Trash2,
} from "lucide-react"
import { useState } from "react"

function PaperDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-6 px-4 max-w-3xl mx-auto">
      <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-32 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

export default function PaperDetailPage() {
  const params = useParams()
  const paperId = params.id as Id<"papers">
  const { user: clerkUser, isLoaded } = useUser()

  const paper = useQuery(api.papers.getPaper, isLoaded ? { paperId } : "skip")
  const deletePaper = useMutation(api.papers.deletePaper)
  const [deleting, setDeleting] = useState(false)

  if (paper === undefined) return <PaperDetailSkeleton />
  if (paper === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-muted-foreground">Paper not found</p>
        <Link href="/research" className="mt-3 text-sm text-primary hover:underline">← Back to Research Hub</Link>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm("Delete this paper? This cannot be undone.")) return
    setDeleting(true)
    try {
      await deletePaper({ paperId })
      window.location.href = "/research"
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/research"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Research Hub
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
        {paper.title}
      </h1>

      {/* Authors */}
      <p className="text-sm text-muted-foreground mb-4">
        {paper.authors.join(", ")}
      </p>

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-3 mb-5 text-xs text-muted-foreground">
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            DOI: {paper.doi}
          </a>
        )}
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {paper.citationCount} citations
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(paper.createdAt).toLocaleDateString()}
        </span>
        {paper.lookingForCollaborators && (
          <span className="flex items-center gap-1 text-success dark:text-green-400 font-medium">
            <Users className="h-3 w-3" />
            Looking for Collaborators
          </span>
        )}
      </div>

      {/* Tags */}
      {paper.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {paper.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs text-primary"
            >
              <Tag className="inline h-3 w-3 mr-0.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Abstract */}
      <div className="mb-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">Abstract</h2>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {paper.abstract}
        </p>
      </div>

      {/* PDF link */}
      {paper.pdfUrl && (
        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-primary hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download PDF
          <ExternalLink className="h-3 w-3 ml-auto" />
        </a>
      )}

      {/* Uploaded by */}
      {paper.uploader && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Uploaded by</p>
          <Link href={`/profile/${paper.uploader._id}`} className="flex items-center gap-2 hover:text-primary">
            {paper.uploader.profilePicture ? (
              <Image src={paper.uploader.profilePicture} alt="" width={28} height={28} className="rounded-full" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {paper.uploader.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-foreground">
              {paper.uploader.name}
            </span>
          </Link>
        </div>
      )}

      {/* Linked platform authors */}
      {paper.linkedAuthors && paper.linkedAuthors.length > 0 && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Authors on Platform</p>
          <div className="flex flex-wrap gap-2">
            {paper.linkedAuthors.map((author: any) => (
              <Link
                key={author._id}
                href={`/profile/${author._id}`}
                className="flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-700 px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {author.profilePicture ? (
                  <Image src={author.profilePicture} alt="" width={20} height={20} className="rounded-full" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                    {author.name.charAt(0)}
                  </div>
                )}
                <span className="text-foreground">{author.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete button (owner only) */}
      {paper.uploader && clerkUser && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-sm text-destructive hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete Paper"}
        </button>
      )}
    </div>
  )
}
