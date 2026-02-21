"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { UserCard } from "@/components/profile/UserCard"
import { UserCardSkeleton } from "@/components/ui/loading-skeleton"
import { Users, GraduationCap, Zap, Star, BookOpen } from "lucide-react"
import Link from "next/link"

type Tab = "partners" | "mentors"

export default function FindPartnersPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>("partners")

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )

  const studyPartners = useQuery(
    api.matching.findStudyPartners,
    isLoaded && isSignedIn && activeTab === "partners" ? {} : "skip"
  )

  const mentors = useQuery(
    api.matching.findMentors,
    isLoaded && isSignedIn && activeTab === "mentors" ? {} : "skip"
  )

  const isBeginner =
    currentUser?.experienceLevel === "Beginner" ||
    (currentUser && !currentUser.experienceLevel)

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl flex items-center gap-2">
          <Users className="h-7 w-7 text-blue-500" />
          Find Partners
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-base">
          Connect with collaborators and mentors based on your skill profile
        </p>
      </div>

      {/* Beginner CTA for Mentors */}
      {isBeginner && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <GraduationCap className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Looking for guidance?
            </p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
              As a beginner, you can find experienced mentors who share your areas of interest.
            </p>
            <button
              onClick={() => setActiveTab("mentors")}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Find a Mentor
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("partners")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "partners"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            Study Partners
          </button>
          <button
            onClick={() => setActiveTab("mentors")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "mentors"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Mentors
          </button>
        </nav>
      </div>

      {/* Study Partners Tab */}
      {activeTab === "partners" && (
        <div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Users with complementary skills who can help broaden your knowledge
          </p>

          {!currentUser?.skills?.length && currentUser !== undefined && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <Star className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Add skills to your profile
                </p>
                <p className="mt-0.5 text-sm text-blue-700 dark:text-blue-400">
                  Matches are based on your skills. Add some to see relevant study partners.
                </p>
                <Link
                  href={`/profile/${currentUser?._id}`}
                  className="mt-2 inline-block text-sm font-medium text-blue-700 underline hover:no-underline dark:text-blue-400"
                >
                  Edit Profile →
                </Link>
              </div>
            </div>
          )}

          {studyPartners === undefined ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          ) : studyPartners.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
              <Users className="mb-3 h-10 w-10 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No study partners found yet
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add skills to your profile or follow more users to find partners
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {studyPartners.items.length} potential partner{studyPartners.items.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {studyPartners.items.map((partner: any) => (
                  <div key={partner.user._id} className="relative">
                    <UserCard user={partner.user} />
                    <div className="mt-1 space-y-1 px-1">
                      {partner.complementarySkills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Can teach you:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {partner.complementarySkills.slice(0, 3).map((skill: string) => (
                              <span
                                key={skill}
                                className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              >
                                {skill}
                              </span>
                            ))}
                            {partner.complementarySkills.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{partner.complementarySkills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {partner.sharedSkills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Shared skills:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {partner.sharedSkills.slice(0, 3).map((skill: string) => (
                              <span
                                key={skill}
                                className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mentors Tab */}
      {activeTab === "mentors" && (
        <div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Experienced users in your field who can guide your learning
          </p>

          {mentors === undefined ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          ) : mentors.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
              <BookOpen className="mb-3 h-10 w-10 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No mentors found
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add skills to your profile to find mentors in your areas of interest
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mentors.items.length} mentor{mentors.items.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mentors.items.map((mentor: any) => (
                  <div key={mentor.user._id} className="relative">
                    <UserCard user={mentor.user} />
                    {mentor.sharedSkills.length > 0 && (
                      <div className="mt-1 px-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Can mentor you in:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {mentor.sharedSkills.slice(0, 4).map((skill: string) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            >
                              <GraduationCap className="h-2.5 w-2.5" />
                              {skill}
                            </span>
                          ))}
                          {mentor.sharedSkills.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{mentor.sharedSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
