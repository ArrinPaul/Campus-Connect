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
  in_person: { icon: MapPin, label: "In Person", color: "text-accent-emerald" },
  virtual: { icon: Video, label: "Virtual", color: "text-primary" },
  hybrid: { icon: Globe, label: "Hybrid", color: "text-accent-violet" },
}

const RSVP_COLORS = {
  going: "bg-accent-emerald/15 text-accent-emerald",
  maybe: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  not_going: "bg-muted text-muted-foreground bg-muted text-muted-foreground",
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
      <div className={`group rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isPast ? "opacity-70 border-border" : "border-border hover:border-primary/50 hover:border-primary"}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary truncate">
              {event.title}
            </h3>
            {event.organizer && (
              <p className="text-xs text-muted-foreground mt-0.5">
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground bg-muted text-muted-foreground">
                Past
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {event.description}
        </p>

        {/* Meta info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatTime(event.startDate)} – {formatTime(event.endDate)}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${typeConfig.color}`}>
            <TypeIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{typeConfig.label}</span>
            {event.location && event.eventType !== "virtual" && (
              <span className="text-muted-foreground">· {event.location}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
