"use client"

import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import {
  Award, Lock, Star, FileText, MessageCircle, ThumbsUp, Users,
  BookOpen, HelpCircle, Zap, Crown, Shield, TrendingUp
} from "lucide-react"

const badgeIcons: Record<string, React.ReactNode> = {
  first_post: <FileText className="w-6 h-6" />,
  first_comment: <MessageCircle className="w-6 h-6" />,
  popular_post: <ThumbsUp className="w-6 h-6" />,
  helpful: <Star className="w-6 h-6" />,
  scholar: <BookOpen className="w-6 h-6" />,
  teacher: <BookOpen className="w-6 h-6" />,
  questioner: <HelpCircle className="w-6 h-6" />,
  contributor: <TrendingUp className="w-6 h-6" />,
  expert: <Shield className="w-6 h-6" />,
  legend: <Crown className="w-6 h-6" />,
  networker: <Users className="w-6 h-6" />,
  endorsed: <Award className="w-6 h-6" />,
  level_5: <Zap className="w-6 h-6" />,
  level_10: <Zap className="w-6 h-6" />,
}

const badgeColors: Record<string, string> = {
  first_post: "from-blue-400 to-blue-600",
  first_comment: "from-green-400 to-green-600",
  popular_post: "from-pink-400 to-pink-600",
  helpful: "from-yellow-400 to-yellow-600",
  scholar: "from-purple-400 to-purple-600",
  teacher: "from-emerald-400 to-emerald-600",
  questioner: "from-orange-400 to-orange-600",
  contributor: "from-cyan-400 to-cyan-600",
  expert: "from-red-400 to-red-600",
  legend: "from-amber-400 to-amber-600",
  networker: "from-indigo-400 to-indigo-600",
  endorsed: "from-teal-400 to-teal-600",
  level_5: "from-violet-400 to-violet-600",
  level_10: "from-fuchsia-400 to-fuchsia-600",
}

export default function AchievementBadges({ userId }: { userId: Id<"users"> }) {
  const data = useQuery(api.gamification.getAchievements, { userId })

  if (!data) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-xl h-28" />
        ))}
      </div>
    )
  }

  const earnedCount = data.earned.length
  const total = data.all.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Achievements
        </h3>
        <span className="text-sm text-muted-foreground">
          {earnedCount}/{total} unlocked
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {data.all.map((achievement: any) => (
          <div
            key={achievement.badge}
            className={`relative rounded-xl p-3 text-center transition-transform hover:scale-105 ${
              achievement.earned
                ? "bg-card border-2 border-yellow-200 shadow-sm"
                : "bg-muted/50 border border-border opacity-50"
            }`}
          >
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                achievement.earned
                  ? `bg-gradient-to-br ${badgeColors[achievement.badge] || "from-gray-400 to-gray-600"} text-primary-foreground`
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {achievement.earned
                ? badgeIcons[achievement.badge] || <Award className="w-6 h-6" />
                : <Lock className="w-5 h-5" />}
            </div>

            <p className="text-xs font-semibold truncate">{achievement.name}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
              {achievement.description}
            </p>

            {achievement.earned && achievement.earnedAt && (
              <p className="text-[9px] text-muted-foreground mt-1">
                {new Date(achievement.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
