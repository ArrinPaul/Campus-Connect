"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import {
  MessageCircle, ThumbsUp, ThumbsDown, Search, Plus, Eye, CheckCircle, Tag, X
} from "lucide-react"
import Link from "next/link"

export default function QandAPage() {
  const [sort, setSort] = useState<"newest" | "votes" | "unanswered">("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [showAskModal, setShowAskModal] = useState(false)

  const questions = useQuery(api.questions.getQuestions, {
    sort,
    query: searchQuery || undefined,
    tag: tagFilter || undefined,
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-orange-500" />
            Q&amp;A Forum
          </h1>
          <p className="text-muted-foreground mt-1">Ask questions, share knowledge</p>
        </div>
        <button
          onClick={() => setShowAskModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-primary-foreground rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" /> Ask Question
        </button>
      </div>

      {/* Search & Sort */}
      <div className="bg-card border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(["newest", "votes", "unanswered"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  sort === s ? "bg-orange-100 text-orange-700 border-orange-300" : "hover:bg-muted/50"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm w-40"
            />
            {tagFilter && (
              <button onClick={() => setTagFilter("")} className="text-muted-foreground hover:text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      {!questions ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No questions found</p>
          <p className="text-sm">Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Link
              key={q._id}
              href={`/q-and-a/${q._id}`}
              className="block bg-card border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Vote / Stats Column */}
                <div className="flex flex-col items-center gap-1 text-sm min-w-[60px]">
                  <div className="flex items-center gap-1 font-semibold">
                    <ThumbsUp className="w-3 h-3" />
                    {q.score}
                  </div>
                  <div className={`flex items-center gap-1 ${q.answerCount > 0 ? "text-success" : "text-muted-foreground"}`}>
                    <MessageCircle className="w-3 h-3" />
                    {q.answerCount}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    {q.viewCount}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{q.title}</h3>
                    {q.acceptedAnswerId && (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm line-clamp-1 mb-2">{q.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {q.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {q.asker && <span>by {q.asker.name}</span>}
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAskModal && <AskQuestionModal onClose={() => setShowAskModal(false)} />}
    </div>
  )
}

function AskQuestionModal({ onClose }: { onClose: () => void }) {
  const askQuestion = useMutation(api.questions.askQuestion)
  const [form, setForm] = useState({
    title: "",
    content: "",
    course: "",
    tags: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    try {
      await askQuestion({
        title: form.title,
        content: form.content,
        course: form.course || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      })
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Ask a Question</h2>
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
              placeholder="e.g. How to implement binary search?"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Details *</label>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Describe your question in detail..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Course (optional)</label>
            <input
              value={form.course}
              onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
              placeholder="e.g. CS101"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. algorithms, python, sorting"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Comma separated, max 10</p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 bg-orange-500 text-primary-foreground rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post Question"}
          </button>
        </div>
      </div>
    </div>
  )
}
