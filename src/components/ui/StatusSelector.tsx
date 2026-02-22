"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Circle, Moon, MinusCircle, EyeOff } from "lucide-react"
import { createLogger } from "@/lib/logger"

const log = createLogger("StatusSelector")

type Status = "online" | "away" | "dnd" | "invisible"

interface StatusSelectorProps {
  currentStatus?: Status
  currentCustomStatus?: string
  onStatusChange?: (status: Status) => void
}

const statusOptions: { value: Status; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  {
    value: "online",
    label: "Online",
    icon: <Circle className="h-3 w-3 fill-green-500 text-success" />,
    color: "text-success",
    description: "You appear online to others",
  },
  {
    value: "away",
    label: "Away",
    icon: <Moon className="h-3 w-3 fill-yellow-500 text-yellow-500" />,
    color: "text-yellow-500",
    description: "You appear as away",
  },
  {
    value: "dnd",
    label: "Do Not Disturb",
    icon: <MinusCircle className="h-3 w-3 fill-red-500 text-destructive" />,
    color: "text-destructive",
    description: "Suppress notifications",
  },
  {
    value: "invisible",
    label: "Invisible",
    icon: <EyeOff className="h-3 w-3 text-muted-foreground" />,
    color: "text-muted-foreground",
    description: "Appear offline to others",
  },
]

/**
 * StatusSelector
 * Dropdown/inline selector for setting user activity status.
 */
export function StatusSelector({
  currentStatus = "online",
  currentCustomStatus = "",
  onStatusChange,
}: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<Status>(currentStatus)
  const [customStatus, setCustomStatus] = useState(currentCustomStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateStatus = useMutation(api.presence.updateStatus)
  const setCustomStatusMutation = useMutation(api.presence.setCustomStatus)

  const handleStatusChange = async (status: Status) => {
    setSelectedStatus(status)
    setIsUpdating(true)
    try {
      await updateStatus({ status })
      onStatusChange?.(status)
    } catch (err) {
      setSelectedStatus(currentStatus) // revert
      log.error("Failed to update status", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCustomStatusSave = async () => {
    setIsUpdating(true)
    try {
      await setCustomStatusMutation({ customStatus })
    } catch (err) {
      log.error("Failed to set custom status", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCustomStatusKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCustomStatusSave()
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Options */}
      <div className="space-y-1">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={isUpdating}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
              ${
                selectedStatus === option.value
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-accent/50 border border-transparent"
              }
              disabled:opacity-50
            `}
          >
            <span className="flex-shrink-0">{option.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {option.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
            {selectedStatus === option.value && (
              <span className="text-primary text-xs font-medium">Active</span>
            )}
          </button>
        ))}
      </div>

      {/* Custom Status Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Custom Status
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customStatus}
            onChange={(e) => setCustomStatus(e.target.value)}
            onKeyDown={handleCustomStatusKeyDown}
            onBlur={handleCustomStatusSave}
            placeholder="What's on your mind? (e.g., Studying 📚)"
            maxLength={100}
            className="flex-1 rounded-lg border border-border bg-card bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {customStatus !== currentCustomStatus && (
            <button
              onClick={handleCustomStatusSave}
              disabled={isUpdating}
              className="px-3 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {customStatus.length}/100 characters
        </p>
      </div>
    </div>
  )
}
