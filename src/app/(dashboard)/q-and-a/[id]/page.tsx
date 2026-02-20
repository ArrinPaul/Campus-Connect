"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import {
  ThumbsUp, ThumbsDown, CheckCircle, MessageCircle, ArrowLeft,
  Eye, Tag, Send, Trash2, X
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function QuestionDetailPage() {
  const params = useParams()
  const questionId = params.id as Id<"questions">

  const question = useQuery(api.questions.getQuestion, { questionId })
  const incrementView = useMutation(api.questions.incrementViewCount)
  const voteMutation = useMutation(api.questions.vote)
  const answerMutation = useMutation(api.questions.answerQuestion)
  const acceptAnswerMutation = useMutation(api.questions.acceptAnswer)
  const deleteQuestion = useMutation(api.questions.deleteQuestion)

  const [answerContent, setAnswerContent] = useState("")
  const [answerError, setAnswerError] = useState("")
  const [answerLoading, setAnswerLoading] = useState(false)

  useEffect(() => {
    incrementView({ questionId }).catch(() => {})
  }, [questionId])

  if (question === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    )
  }

  if (question === null) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg text-gray-500">Question not found</p>
        <Link href="/q-and-a" className="text-orange-600 hover:underline text-sm mt-2 inline-block">
          Back to Q&A
        </Link>
      </div>
    )
  }

  const handleVote = async (targetId: string, targetType: "question" | "answer", voteType: "up" | "down") => {
    try {
      await voteMutation({ targetId, targetType, voteType })
    } catch (e) {
      console.error(e)
    }
  }

  const handleAnswer = async () => {
    setAnswerError("")
    setAnswerLoading(true)
    try {
      await answerMutation({ questionId, content: answerContent })
      setAnswerContent("")
    } catch (e: any) {
      setAnswerError(e.message)
    } finally {
      setAnswerLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this question and all answers?")) return
    await deleteQuestion({ questionId })
    window.location.href = "/q-and-a"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/q-and-a" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Q&A
      </Link>

      {/* Question */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex gap-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleVote(questionId, "question", "up")}
              className={`p-1 rounded hover:bg-orange-50 ${
                question.viewerVotes[questionId] === "up" ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold">{question.score}</span>
            <button
              onClick={() => handleVote(questionId, "question", "down")}
              className={`p-1 rounded hover:bg-orange-50 ${
                question.viewerVotes[questionId] === "down" ? "text-red-500" : "text-gray-400"
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{question.title}</h1>
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 mb-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {question.viewCount} views
              </span>
              <span>{question.answerCount} answer{question.answerCount !== 1 ? "s" : ""}</span>
              {question.course && (
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {question.course}
                </span>
              )}
            </div>

            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
              {question.content}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                {question.asker && (
                  <>
                    <img
                      src={question.asker.profilePicture || "/placeholder-avatar.png"}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{question.asker.name}</span>
                  </>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {question.answers.length} Answer{question.answers.length !== 1 ? "s" : ""}
        </h2>

        <div className="space-y-4">
          {question.answers.map((answer: any) => (
            <div
              key={answer._id}
              className={`bg-white border rounded-xl p-5 ${
                answer.isAccepted ? "border-green-300 bg-green-50/30" : ""
              }`}
            >
              <div className="flex gap-4">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleVote(answer._id, "answer", "up")}
                    className={`p-1 rounded hover:bg-orange-50 ${
                      question.viewerVotes[answer._id] === "up" ? "text-orange-500" : "text-gray-400"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <span className="font-semibold">{answer.score}</span>
                  <button
                    onClick={() => handleVote(answer._id, "answer", "down")}
                    className={`p-1 rounded hover:bg-orange-50 ${
                      question.viewerVotes[answer._id] === "down" ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  {answer.isAccepted ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  ) : (
                    <button
                      onClick={() => acceptAnswerMutation({ answerId: answer._id })}
                      className="text-gray-300 hover:text-green-500 mt-1"
                      title="Accept this answer"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                    {answer.content}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {answer.answerer && (
                      <>
                        <img
                          src={answer.answerer.profilePicture || "/placeholder-avatar.png"}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{answer.answerer.name}</span>
                      </>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(answer.createdAt).toLocaleDateString()}
                    </span>
                    {answer.isAccepted && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Accepted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write Answer */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Your Answer</h3>
        <textarea
          rows={5}
          value={answerContent}
          onChange={(e) => setAnswerContent(e.target.value)}
          placeholder="Write your answer..."
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
        />
        {answerError && <p className="text-red-500 text-sm mb-2">{answerError}</p>}
        <button
          onClick={handleAnswer}
          disabled={answerLoading || !answerContent.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {answerLoading ? "Posting..." : "Post Answer"}
        </button>
      </div>
    </div>
  )
}
