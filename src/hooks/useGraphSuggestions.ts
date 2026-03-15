"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { GraphSuggestion } from "@/server/graph/types"

interface SuggestionsResponse {
  suggestions: GraphSuggestion[]
}

async function getSuggestions(limit: number): Promise<GraphSuggestion[]> {
  const response = await fetch(`/api/graph/suggestions?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  })

  const data = (await response.json()) as SuggestionsResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch suggestions")
  }

  return data.suggestions
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  })

  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }

  return data
}

export function useGraphSuggestions(limit = 5, enabled = true) {
  return useQuery({
    queryKey: ["graph", "suggestions", limit],
    queryFn: () => getSuggestions(limit),
    enabled,
    staleTime: 60_000,
  })
}

export function useDismissGraphSuggestion(limit = 5) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (targetClerkId: string) =>
      postJson<{ ok: true }>("/api/graph/suggestions/dismiss", { targetClerkId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", "suggestions", limit] })
    },
  })
}

export function useRefreshGraphSuggestions(limit = 5) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      postJson<SuggestionsResponse>("/api/graph/suggestions/refresh", {}),
    onSuccess: (data) => {
      queryClient.setQueryData(["graph", "suggestions", limit], data.suggestions)
    },
  })
}

export function useGraphFollowMutation(limit = 5) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { targetClerkId: string; action?: "follow" | "unfollow" }) =>
      postJson<{ ok: true }>("/api/graph/follows", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", "suggestions", limit] })
    },
  })
}
