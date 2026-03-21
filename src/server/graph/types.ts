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

export interface GraphPostRecommendation {
  _id?: string
  postId: string
  score: number
  reasons?: string[]
  createdAt?: number | null
  content?: string | null
  author?: GraphUser
}
