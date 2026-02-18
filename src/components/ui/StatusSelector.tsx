"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Circle, Moon, MinusCircle, EyeOff } from "lucide-react"

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
    icon: <Circle className="h-3 w-3 fill-green-500 text-green-500" />,
    color: "text-green-500",
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
    icon: <MinusCircle className="h-3 w-3 fill-red-500 text-red-500" />,
    color: "text-red-500",
    description: "Suppress notifications",
  },
  {
    value: "invisible",
    label: "Invisible",
    icon: <EyeOff className="h-3 w-3 text-gray-400" />,
    color: "text-gray-400",
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
      console.error("Failed to update status:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCustomStatusSave = async () => {
    setIsUpdating(true)
    try {
      await setCustomStatusMutation({ customStatus })
    } catch (err) {
      console.error("Failed to set custom status:", err)
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
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent"
              }
              disabled:opacity-50
            `}
          >
            <span className="flex-shrink-0">{option.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </div>
            {selectedStatus === option.value && (
              <span className="text-blue-500 text-xs font-medium">Active</span>
            )}
          </button>
        ))}
      </div>

      {/* Custom Status Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {customStatus !== currentCustomStatus && (
            <button
              onClick={handleCustomStatusSave}
              disabled={isUpdating}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {customStatus.length}/100 characters
        </p>
      </div>
    </div>
  )
}
