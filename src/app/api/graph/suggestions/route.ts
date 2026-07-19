import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "5")

    // Fetch current user details to calculate profile similarity
    const { data: currentUserProfile } = await supabase
      .from("users")
      .select("university, skills")
      .eq("id", user.id)
      .single()

    // Get current user's community memberships
    const { data: userMemberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id)
    const userCommunityIds = userMemberships?.map(m => m.community_id) || []

    // Get users current user is already following
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      
    const followingIds = following?.map(f => f.following_id) || []
    followingIds.push(user.id) // exclude self

    // Fetch candidate users to score
    const { data: candidates, error: candidateError } = await supabase
      .from("users")
      .select("id, name, username, profile_picture, bio, university, skills, follower_count")
      .not('id', 'in', `(${followingIds.join(',')})`)
      .limit(200)

    if (candidateError) throw candidateError
    if (!candidates || candidates.length === 0) {
      return NextResponse.json([])
    }

    // Get mutual connections: who do the friends we follow follow?
    const friendsIds = followingIds.filter(id => id !== user.id)
    const mutualFollowCounts: Record<string, number> = {}
    
    if (friendsIds.length > 0) {
      const { data: friendsFollows } = await supabase
        .from("follows")
        .select("following_id")
        .in("follower_id", friendsIds)
        
      friendsFollows?.forEach(ff => {
        mutualFollowCounts[ff.following_id] = (mutualFollowCounts[ff.following_id] || 0) + 1
      })
    }

    // Get candidate community memberships
    const candidateCommunityMap: Record<string, string[]> = {}
    const candidateIds = candidates.map(c => c.id)
    const { data: candidateMemberships } = await supabase
      .from("community_members")
      .select("user_id, community_id")
      .in("user_id", candidateIds)
      
    candidateMemberships?.forEach(cm => {
      if (!candidateCommunityMap[cm.user_id]) {
        candidateCommunityMap[cm.user_id] = []
      }
      candidateCommunityMap[cm.user_id].push(cm.community_id)
    })

    // Score candidates based on Facebook algorithms:
    // 1. Mutual connections: +30 per mutual connection
    // 2. Same university: +50
    // 3. Shared skills: +20 per shared skill
    // 4. Same communities: +15 per shared community
    // 5. Popularity: +0.1 * follower_count (capped at 20)
    const scored = candidates.map(c => {
      let score = 0
      const reasons: string[] = []

      // 1. Mutual connections
      const mutuals = mutualFollowCounts[c.id] || 0
      if (mutuals > 0) {
        score += mutuals * 30
        reasons.push(`${mutuals} mutual connection${mutuals > 1 ? 's' : ''}`)
      }

      // 2. Shared university
      if (currentUserProfile?.university && c.university === currentUserProfile.university) {
        score += 50
        reasons.push(`Studies at ${c.university}`)
      }

      // 3. Shared skills
      if (currentUserProfile?.skills && c.skills) {
        const userSkills = (currentUserProfile.skills || []) as string[]
        const candidateSkills = (c.skills || []) as string[]
        const sharedSkills = candidateSkills.filter((s: string) => userSkills.includes(s))
        if (sharedSkills.length > 0) {
          score += sharedSkills.length * 20
          reasons.push(`Shared skill${sharedSkills.length > 1 ? 's' : ''}: ${sharedSkills.slice(0, 2).join(', ')}`)
        }
      }

      // 4. Shared communities
      if (userCommunityIds.length > 0 && candidateCommunityMap[c.id]) {
        const sharedComms = candidateCommunityMap[c.id].filter(cid => userCommunityIds.includes(cid))
        if (sharedComms.length > 0) {
          score += sharedComms.length * 15
          reasons.push(`In ${sharedComms.length} same community/communities`)
        }
      }

      // 5. Popularity fallback
      if (c.follower_count && c.follower_count > 0) {
        score += Math.min(20, Math.floor(c.follower_count * 0.1))
      }

      if (reasons.length === 0) {
        reasons.push("Popular on Campus Connect")
      }

      return {
        candidate: c,
        score,
        reasons
      }
    })

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score)
    const topScored = scored.slice(0, limit)

    // Map to expected GraphSuggestion format
    const formatted = topScored.map(item => ({
      _id: item.candidate.id,
      user: {
        id: item.candidate.id,
        authId: item.candidate.id,
        name: item.candidate.name,
        username: item.candidate.username,
        profilePicture: item.candidate.profile_picture,
        bio: item.candidate.bio
      },
      reasons: item.reasons,
      score: item.score
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    return internalError(err)
  }
}
