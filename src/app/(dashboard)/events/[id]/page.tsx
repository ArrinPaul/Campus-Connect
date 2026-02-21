"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"
import Link from "next/link"
import {
  Calendar, Clock, MapPin, Video, Globe, Users, ArrowLeft,
  CheckCircle, HelpCircle, XCircle, ExternalLink, Share2,
} from "lucide-react"

const EVENT_TYPE_CONFIG = {
  in_person: { icon: MapPin, label: "In Person", color: "text-green-600 dark:text-green-400" },
  virtual: { icon: Video, label: "Virtual", color: "text-blue-600 dark:text-blue-400" },
  hybrid: { icon: Globe, label: "Hybrid", color: "text-purple-600 dark:text-purple-400" },
}

const RSVP_OPTIONS = [
  { status: "going" as const, label: "Going", icon: CheckCircle, color: "bg-green-600 hover:bg-green-700 text-white" },
  { status: "maybe" as const, label: "Maybe", icon: HelpCircle, color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  { status: "not_going" as const, label: "Not Going", icon: XCircle, color: "bg-gray-500 hover:bg-gray-600 text-white" },
]

function EventDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-6 px-4">
      <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-20 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as Id<"events">
  const { isLoaded, isSignedIn } = useUser()
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [rsvpError, setRsvpError] = useState("")

  const event = useQuery(
    api.events.getEvent,
    isLoaded ? { eventId } : "skip"
  )

  const attendees = useQuery(
    api.events.getEventAttendees,
    isLoaded ? { eventId } : "skip"
  )

  const rsvpEvent = useMutation(api.events.rsvpEvent)

  const handleRsvp = async (status: "going" | "maybe" | "not_going") => {
    setRsvpError("")
    setRsvpLoading(true)
    try {
      await rsvpEvent({ eventId, status })
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : "Failed to RSVP")
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!event) return
    const start = new Date(event.startDate)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")
    const end = new Date(event.endDate)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location ?? event.virtualLink ?? "")}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })

  if (event === undefined) return <EventDetailSkeleton />
  if (event === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Calendar className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Event not found</p>
        <Link href="/events" className="mt-3 text-sm text-blue-600 hover:underline">← Back to Events</Link>
      </div>
    )
  }

  const typeConfig = EVENT_TYPE_CONFIG[event.eventType as keyof typeof EVENT_TYPE_CONFIG]
  const TypeIcon = typeConfig.icon
  const isPast = event.startDate < Date.now()
  const isFull = event.maxAttendees !== undefined && event.attendeeCount >= event.maxAttendees && event.viewerRsvp !== "going"

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back navigation */}
      <Link
        href="/events"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Title + Organizer */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {event.title}
          </h1>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex-shrink-0 rounded-full border border-gray-200 dark:border-gray-700 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
            title="Copy link"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {event.organizer && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-6 w-6">
              {event.organizer.profilePicture ? (
                <Image src={event.organizer.profilePicture} alt={event.organizer.name} fill className="rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {event.organizer.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Organized by{" "}
              <Link
                href={`/profile/${event.organizer._id}`}
                className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {event.organizer.name}
              </Link>
            </span>
          </div>
        )}
      </div>

      {/* Key details card */}
      <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
        {/* Date */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(event.startDate)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(event.startDate)} – {formatTime(event.endDate)}</p>
          </div>
          {isPast && <span className="ml-auto text-xs rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-500 dark:text-gray-400">Ended</span>}
        </div>

        {/* Type */}
        <div className={`flex items-center gap-3 px-4 py-3 ${typeConfig.color}`}>
          <TypeIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{typeConfig.label}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-3 px-4 py-3">
            <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">{event.location}</p>
          </div>
        )}

        {/* Virtual link */}
        {event.virtualLink && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Video className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <a
              href={event.virtualLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Join Online
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Attendees */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Users className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{event.attendeeCount}</span> going
            {event.maxAttendees && <span className="text-gray-400 dark:text-gray-500"> / {event.maxAttendees} max</span>}
          </p>
        </div>
      </div>

      {/* RSVP section */}
      {isSignedIn && !isPast && (
        <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Will you attend?</p>
          <div className="flex gap-2">
            {RSVP_OPTIONS.map(({ status, label, icon: Icon, color }) => (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                disabled={rsvpLoading || (isFull && status === "going")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                  event.viewerRsvp === status
                    ? `${color} ring-2 ring-offset-2 ring-current`
                    : "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {isFull && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">This event is at full capacity.</p>
          )}
          {rsvpError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{rsvpError}</p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">About this event</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.description || "No description provided."}</p>
      </div>

      {/* Community link */}
      {event.community && (
        <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Community</p>
          <Link
            href={`/c/${event.community.slug}`}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {event.community.name}
          </Link>
        </div>
      )}

      {/* Attendees list */}
      {attendees && attendees.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Attendees ({attendees.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {attendees.slice(0, 12).map((attendee: any) => (
              <Link
                key={attendee._id}
                href={`/profile/${attendee._id}`}
                title={attendee.name}
                className="group"
              >
                <div className="relative h-8 w-8">
                  {attendee.profilePicture ? (
                    <Image
                      src={attendee.profilePicture}
                      alt={attendee.name}
                      fill
                      className="rounded-full object-cover ring-2 ring-white dark:ring-gray-800 group-hover:ring-blue-300"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800 group-hover:ring-blue-300">
                      {attendee.name.charAt(0)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {attendees.length > 12 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                +{attendees.length - 12}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Calendar */}
      <div className="mt-4">
        <button
          onClick={handleAddToCalendar}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Calendar className="h-4 w-4" />
          Add to Google Calendar
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
