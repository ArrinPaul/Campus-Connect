"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  // Redirect authenticated users to feed
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/feed")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">Campus Connect</h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl">
          Connect with students, researchers, and academics. Collaborate on projects and participate in hackathons.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border-2 border-blue-600 dark:border-blue-400 px-8 py-3 text-lg font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            Why Campus Connect?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Connect</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Build your academic network by connecting with students, researchers, and faculty
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Collaborate</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find collaborators for research projects and share your expertise
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Create</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Participate in hackathons and bring your innovative ideas to life
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

