"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Mail, 
  Heart, 
  Bookmark, 
  TrendingUp, 
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"

/**
 * Admin Monitoring Dashboard
 * Real-time system statistics and health monitoring
 */
export default function AdminDashboardPage() {
  const stats = useQuery(api.monitoring.getSystemStats)
  const topContributors = useQuery(api.monitoring.getTopContributors)
  const performanceMetrics = useQuery(api.monitoring.getPerformanceMetrics)

  if (stats === undefined || topContributors === undefined || performanceMetrics === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Determine system status
  const systemStatus = performanceMetrics.status === "high" ? "busy" : "healthy"
  const statusColor = systemStatus === "healthy" ? "text-green-600" : "text-yellow-600"
  const StatusIcon = systemStatus === "healthy" ? CheckCircle2 : AlertCircle

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform statistics and health metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
          <span className={`text-sm font-medium ${statusColor}`}>
            System {systemStatus === "healthy" ? "Healthy" : "Busy"}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Last hour activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estimated QPS</p>
              <p className="text-2xl font-bold">{performanceMetrics.estimatedQPS}</p>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.recentOperations} operations/hour
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Load Status</p>
              <p className="text-2xl font-bold capitalize">{performanceMetrics.status}</p>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.status === "high" ? "Above average" : "Within normal range"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+{stats.users.lastHour}</span> last hour
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+{stats.users.last24Hours}</span> last 24h
            </p>
          </CardContent>
        </Card>

        {/* Total Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posts.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+{stats.posts.lastHour}</span> last hour
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+{stats.posts.last24Hours}</span> last 24h
            </p>
          </CardContent>
        </Card>

        {/* Total Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+{stats.comments.lastHour}</span> last hour
            </p>
          </CardContent>
        </Card>

        {/* Total Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+{stats.messages.lastHour}</span> last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.engagement.totalReactions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.engagement.avgReactionsPerPost} avg per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.engagement.totalBookmarks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saved by users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.communities.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active communities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Contributors
          </CardTitle>
          <CardDescription>Most active users by post count</CardDescription>
        </CardHeader>
        <CardContent>
          {topContributors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No contributors yet
            </p>
          ) : (
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.username}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{contributor.name}</p>
                      <p className="text-sm text-muted-foreground">@{contributor.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{contributor.postCount}</p>
                    <p className="text-xs text-muted-foreground">posts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </p>
    </div>
  )
}
