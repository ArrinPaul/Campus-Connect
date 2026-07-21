import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getPostById } from "@/server/db/posts"

// GET /api/posts/single?id=xxx
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id") ?? url.searchParams.get("postId")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const rawPost = await getPostById(id)
    if (!rawPost) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const rawAuthor = (rawPost as any).author || {}
    const author = {
      _id: rawAuthor.id || rawAuthor._id || (rawPost as any).author_id || (rawPost as any).authorId,
      name: rawAuthor.name || rawAuthor.username || "User",
      profilePicture: rawAuthor.profile_picture || rawAuthor.profilePicture,
      role: rawAuthor.role || "Student",
    }

    const post = {
      ...rawPost,
      _id: (rawPost as any).id || (rawPost as any)._id || id,
      authorId: (rawPost as any).author_id || (rawPost as any).authorId,
      content: (rawPost as any).content || "",
      createdAt: typeof (rawPost as any).created_at === "string" 
        ? new Date((rawPost as any).created_at).getTime() 
        : (rawPost as any).created_at || (rawPost as any).createdAt || Date.now(),
      commentCount: (rawPost as any).comment_count ?? (rawPost as any).commentCount ?? 0,
      likeCount: (rawPost as any).like_count ?? (rawPost as any).likeCount ?? 0,
      shareCount: (rawPost as any).share_count ?? (rawPost as any).shareCount ?? 0,
    }

    return NextResponse.json({ post, author, ...post })
  } catch (err) {
    return internalError(err)
  }
}
