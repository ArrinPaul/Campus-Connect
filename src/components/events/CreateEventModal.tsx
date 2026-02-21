"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { X, Calendar, MapPin, Video, Globe } from "lucide-react"

interface CreateEventModalProps {
  onClose: () => void
  communityId?: Id<"communities">
}

const EVENT_TYPES = [
  { value: "in_person", label: "In Person", icon: MapPin },
  { value: "virtual", label: "Virtual", icon: Video },
  { value: "hybrid", label: "Hybrid", icon: Globe },
] as const

function fromDatetimeLocal(s: string): number {
  return new Date(s).getTime()
}

export function CreateEventModal({ onClose, communityId }: CreateEventModalProps) {
  const router = useRouter()
  const createEvent = useMutation(api.events.createEvent)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState<"in_person" | "virtual" | "hybrid">("in_person")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [location, setLocation] = useState("")
  const [virtualLink, setVirtualLink] = useState("")
  const [maxAttendees, setMaxAttendees] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) { setError("Title is required"); return }
    if (!startDate) { setError("Start date is required"); return }
    if (!endDate) { setError("End date is required"); return }

    const startTs = fromDatetimeLocal(startDate)
    const endTs = fromDatetimeLocal(endDate)
    if (endTs <= startTs) { setError("End date must be after start date"); return }

    setIsSubmitting(true)
    try {
      const eventId = await createEvent({
        title: title.trim(),
        description: description.trim(),
        eventType,
        startDate: startTs,
        endDate: endTs,
        location: location.trim() || undefined,
        virtualLink: virtualLink.trim() || undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        communityId,
      })
      onClose()
      router.push(`/events/${eventId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Create Event</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Event Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Weekly Study Group — Algorithms"
              className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="What's this event about?"
              className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Event type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEventType(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    eventType === value
                      ? "border-blue-500 bg-primary/10 dark:bg-blue-900/20 text-primary"
                      : "border-border text-muted-foreground hover:border-border hover:border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Location */}
          {(eventType === "in_person" || eventType === "hybrid") && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building / Room / Address"
                className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Virtual link */}
          {(eventType === "virtual" || eventType === "hybrid") && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                value={virtualLink}
                onChange={(e) => setVirtualLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Max attendees */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Max Attendees <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <input
              type="number"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              min={1}
              placeholder="Leave empty for unlimited"
              className="w-full rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-destructive dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-border border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
