import { useMutation, useQuery, api } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

export interface GraphUser {
  id: string
  authId: string
  name: string
  username: string
  profilePicture?: string
  bio?: string
}

export interface GraphSuggestion {
  user: GraphUser
  reasons: string[]
  score: number
  _id?: string
}

export function useGraphSuggestions(limit = 5, enabled = true) {
  const queryClient = useQueryClient()
  const data = useQuery<GraphSuggestion[]>(enabled ? api.suggestions.getSuggestions : null, { limit })
  const dismiss = useMutation(api.suggestions.dismissSuggestion)

  return {
    data: data ?? [],
    isLoading: data === undefined && enabled,
    dismissSuggestion: async (targetAuthId: string) => {
      await dismiss({ targetAuthId })
      queryClient.invalidateQueries({ queryKey: [api.suggestions.getSuggestions._path] })
    }
  }
}

export function useGraphFollowMutation(limit = 5) {
  const queryClient = useQueryClient()
  const follow = useMutation(api.follows.followUser)

  return {
    mutateAsync: async (params: { targetAuthId: string; action?: "follow" | "unfollow" }) => {
      // @ts-ignore - legacy API compatibility
      await follow(params)
      queryClient.invalidateQueries({ queryKey: [api.suggestions.getSuggestions._path] })
      queryClient.invalidateQueries({ queryKey: [api.follows.getFollowing._path] })
    }
  }
}
