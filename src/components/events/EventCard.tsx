"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, MapPin, Video, Users, Globe } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface Organizer {
  _id: Id<"users">
  name: string
  profilePicture?: string
}

interface EventCardProps {
  event: {
    _id: Id<"events">
    title: string
    description: string
    eventType: "in_person" | "virtual" | "hybrid"
    startDate: number
    endDate: number
    location?: string
    virtualLink?: string
    attendeeCount: number
    maxAttendees?: number
    organizer?: Organizer | null
    viewerRsvp?: "going" | "maybe" | "not_going" | null
    rsvpStatus?: "going" | "maybe" | "not_going"
  }
}

const EVENT_TYPE_CONFIG = {
  in_person: { icon: MapPin, label: "In Person", color: "text-green-600 dark:text-green-400" },
  virtual: { icon: Video, label: "Virtual", color: "text-blue-600 dark:text-blue-400" },
  hybrid: { icon: Globe, label: "Hybrid", color: "text-purple-600 dark:text-purple-400" },
}

const RSVP_COLORS = {
  going: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  maybe: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  not_going: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
}

export function EventCard({ event }: EventCardProps) {
  const typeConfig = EVENT_TYPE_CONFIG[event.eventType]
  const TypeIcon = typeConfig.icon
  const rsvpStatus = event.viewerRsvp ?? event.rsvpStatus

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }

  const isPast = event.startDate < Date.now()

  return (
    <Link href={`/events/${event._id}`}>
      <div className={`group rounded-xl border bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isPast ? "opacity-70 border-gray-200 dark:border-gray-700" : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
              {event.title}
            </h3>
            {event.organizer && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                by {event.organizer.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rsvpStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${RSVP_COLORS[rsvpStatus]}`}>
                {rsvpStatus === "not_going" ? "Not going" : rsvpStatus}
              </span>
            )}
            {isPast && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                Past
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {event.description}
        </p>

        {/* Meta info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatTime(event.startDate)} – {formatTime(event.endDate)}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${typeConfig.color}`}>
            <TypeIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{typeConfig.label}</span>
            {event.location && event.eventType !== "virtual" && (
              <span className="text-gray-400 dark:text-gray-500">· {event.location}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {event.attendeeCount} going
              {event.maxAttendees && ` / ${event.maxAttendees} max`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
