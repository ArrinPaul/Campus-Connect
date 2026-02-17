"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reactionEmojis, reactionLabels, ReactionType } from "./ReactionPicker"
import Link from "next/link"

interface ReactionModalProps {
  targetId: string
  targetType: "post" | "comment"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReactionModal({
  targetId,
  targetType,
  open,
  onOpenChange,
}: ReactionModalProps) {
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | "all">("all")

  const reactions = useQuery(api.reactions.getReactions, {
    targetId,
    targetType,
  })

  const reactionUsers = useQuery(
    api.reactions.getReactionUsers,
    open
      ? {
          targetId,
          targetType,
          reactionType: selectedReaction === "all" ? undefined : selectedReaction,
        }
      : "skip"
  )

  if (!reactions || reactions.total === 0) {
    return null
  }

  const availableReactions = Object.entries(reactions.counts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as ReactionType,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>

        <Tabs
          value={selectedReaction}
          onValueChange={(value) => setSelectedReaction(value as ReactionType | "all")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full overflow-x-auto" style={{
            gridTemplateColumns: `repeat(${availableReactions.length + 1}, minmax(0, 1fr))`
          }}>
            <TabsTrigger value="all" className="flex items-center gap-1">
              All
              <Badge variant="secondary" className="ml-1">
                {reactions.total}
              </Badge>
            </TabsTrigger>
            {availableReactions.map(({ type, count }) => (
              <TabsTrigger
                key={type}
                value={type}
                className="flex items-center gap-1"
              >
                <span>{reactionEmojis[type]}</span>
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value={selectedReaction} className="mt-0">
              {reactionUsers && reactionUsers.length > 0 ? (
                <div className="space-y-2">
                  {reactionUsers.filter((item) => item.user !== null).map((item, index) => (
                    <Link
                      key={index}
                      href={`/profile/${item.user!._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => onOpenChange(false)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={item.user!.profilePicture}
                          alt={item.user!.name}
                        />
                        <AvatarFallback>
                          {item.user!.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.user!.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.user!.role}
                        </p>
                      </div>
                      <div className="text-2xl">
                        {reactionEmojis[item.reactionType as ReactionType]}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reactions yet
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
