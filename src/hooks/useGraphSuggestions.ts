import { useMutation, useQueryClient } from "@tanstack/react-query"
import { postJson } from "@/lib/api-client"

export function useGraphSuggestions(limit = 5) {
  const queryClient = useQueryClient()

  const dismissMutation = useMutation({
    mutationFn: (targetAuthId: string) =>
      postJson<{ ok: true }>("/api/graph/suggestions/dismiss", { targetAuthId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graph/suggestions"] })
    },
  })

  return {
    dismissSuggestion: dismissMutation.mutateAsync,
    isDismissing: dismissMutation.isPending,
  }
}

export function useGraphFollowMutation(limit = 5) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { targetAuthId: string; action?: "follow" | "unfollow" }) =>
      postJson<{ ok: true }>("/api/graph/follows", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graph/suggestions"] })
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] })
    },
  })
}
