export interface GraphUser {
  clerkId: string
  convexUserId?: string | null
  name?: string | null
  username?: string | null
  profilePicture?: string | null
  university?: string | null
  role?: string | null
  skills?: string[]
}

export interface GraphSuggestion {
  _id: string
  score: number
  reasons: string[]
  user: GraphUser
}

export interface GraphPostRecommendation {
  _id: string
  score: number
  postId: string
  author: GraphUser
  createdAt?: number | null
  content?: string | null
}
