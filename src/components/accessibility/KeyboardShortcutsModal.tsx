"use client"

import { useEffect } from "react"
import { Keyboard, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/* ─── Data ───────────────────────────────────────────────────── */

interface ShortcutGroup {
  label: string
  shortcuts: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["G", "F"], description: "Go to Feed" },
      { keys: ["G", "D"], description: "Go to Discover" },
      { keys: ["G", "M"], description: "Go to Messages" },
      { keys: ["G", "B"], description: "Go to Bookmarks" },
      { keys: ["G", "P"], description: "Go to Profile" },
      { keys: ["G", "S"], description: "Go to Settings" },
    ],
  },
  {
    label: "General",
    shortcuts: [
      { keys: ["/"], description: "Focus search" },
      { keys: ["?"], description: "Open keyboard shortcuts" },
      { keys: ["Esc"], description: "Close dialog / drop-down" },
    ],
  },
  {
    label: "Accessibility",
    shortcuts: [
      { keys: ["Tab"], description: "Move focus forward" },
      { keys: ["Shift", "Tab"], description: "Move focus backward" },
      { keys: ["Enter", "Space"], description: "Activate focused item" },
    ],
  },
]

/* ─── Kbd badge ──────────────────────────────────────────────── */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={[
        "inline-flex items-center justify-center",
        "min-w-[1.75rem] h-7 px-1.5",
        "rounded border border-border bg-muted",
        "text-xs font-mono font-medium text-muted-foreground",
        "shadow-[0_1px_0_0_hsl(var(--border))]",
      ].join(" ")}
    >
      {children}
    </kbd>
  )
}

/* ─── Component ──────────────────────────────────────────────── */

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        aria-labelledby="kbd-shortcuts-title"
        aria-describedby="kbd-shortcuts-desc"
      >
        <DialogHeader>
          <DialogTitle
            id="kbd-shortcuts-title"
            className="flex items-center gap-2 text-base"
          >
            <Keyboard className="h-4 w-4 text-primary" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="kbd-shortcuts-desc">
            Use these shortcuts to navigate Campus Connect faster.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-6 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <dl className="space-y-2">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.description}
                    className="flex items-center justify-between gap-4"
                  >
                    <dt className="text-sm text-foreground">{s.description}</dt>
                    <dd className="flex items-center gap-1 flex-shrink-0">
                      {s.keys.map((key, i) => (
                        <span key={key} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-xs text-muted-foreground" aria-label="then">
                              +
                            </span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
