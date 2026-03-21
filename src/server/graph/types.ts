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
}

export interface GraphRecommendation {
  postId: string
  score: number
  reasons: string[]
}
