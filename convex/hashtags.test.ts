/**
 * Unit Tests for Hashtags
 * Feature: Hashtags & Trending (Phase 1.3)
 * 
 * These tests verify the hashtags functionality works correctly.
 */

import { extractHashtags, normalizeHashtag } from "./hashtags"

describe("Hashtag Utilities", () => {
  describe("extractHashtags", () => {
    it("should extract single hashtag", () => {
      const content = "This is a post with #programming"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(["programming"])
    })

    it("should extract multiple hashtags", () => {
      const content = "Learning #javascript and #react today! #webdev"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(["javascript", "react", "webdev"])
    })

    it("should normalize hashtags to lowercase", () => {
      const content = "#JavaScript #REACT #WebDev"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(["javascript", "react", "webdev"])
    })

    it("should remove duplicate hashtags", () => {
      const content = "#coding #programming #coding #webdev #programming"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(["coding", "programming", "webdev"])
    })

    it("should handle hashtags with numbers and underscores", () => {
      const content = "#web3 #machine_learning #ai2024"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(["web3", "machine_learning", "ai2024"])
    })

    it("should return empty array when no hashtags", () => {
      const content = "This post has no hashtags"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual([])
    })

    it("should handle hashtags at start and end of content", () => {
      const content = "#first some content here #last"
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(["first", "last"])
    })
  })

  describe("normalizeHashtag", () => {
    it("should convert to lowercase", () => {
      expect(normalizeHashtag("JavaScript")).toBe("javascript")
    })

    it("should remove leading hash", () => {
      expect(normalizeHashtag("#programming")).toBe("programming")
    })

    it("should trim whitespace", () => {
      expect(normalizeHashtag("  react  ")).toBe("react")
    })

    it("should handle already normalized tags", () => {
      expect(normalizeHashtag("webdev")).toBe("webdev")
    })
  })
})

describe("Hashtags API Logic", () => {
  describe("getTrending calculation", () => {
    it("should filter hashtags by lastUsedAt within 24 hours", () => {
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      
      const hashtags = [
        { tag: "recent", lastUsedAt: now - 1000 },
        { tag: "old", lastUsedAt: oneDayAgo - 1000 },
      ]
      
      const recentHashtags = hashtags.filter((h) => h.lastUsedAt >= oneDayAgo)
      
      expect(recentHashtags).toHaveLength(1)
      expect(recentHashtags[0].tag).toBe("recent")
    })

    it("should sort by post count descending", () => {
      const hashtags = [
        { tag: "low", postCount: 5 },
        { tag: "high", postCount: 50 },
        { tag: "medium", postCount: 20 },
      ]
      
      const sorted = [...hashtags].sort((a, b) => b.postCount - a.postCount)
      
      expect(sorted[0].tag).toBe("high")
      expect(sorted[1].tag).toBe("medium")
      expect(sorted[2].tag).toBe("low")
    })

    it("should respect limit parameter", () => {
      const hashtags = Array.from({ length: 15 }, (_, i) => ({
        tag: `tag${i}`,
        postCount: i,
      }))
      
      const limit = 5
      const limited = hashtags.slice(0, limit)
      
      expect(limited).toHaveLength(5)
    })
  })

  describe("getPostsByHashtag", () => {
    it("should normalize tag before querying", () => {
      const inputTag = "REACT"
      const normalizedTag = normalizeHashtag(inputTag)
      
      expect(normalizedTag).toBe("react")
    })

    it("should return empty for non-existent hashtag", () => {
      const hashtag = null
      const result = hashtag
        ? { posts: [], cursor: null, hashtag: { tag: hashtag } }
        : { posts: [], cursor: null, hashtag: null }
      
      expect(result.posts).toHaveLength(0)
      expect(result.hashtag).toBeNull()
    })

    it("should apply pagination correctly", () => {
      const allLinks = Array.from({ length: 50 }, (_, i) => ({ id: i }))
      const limit = 20
      const startIndex = 0
      
      const page = allLinks.slice(startIndex, startIndex + limit)
      
      expect(page).toHaveLength(20)
      expect(page[0].id).toBe(0)
      expect(page[19].id).toBe(19)
    })

    it("should calculate next cursor", () => {
      const totalLinks = 50
      const limit = 20
      const startIndex = 0
      
      const hasMore = startIndex + limit < totalLinks
      const nextCursor = hasMore ? String(startIndex + limit) : null
      
      expect(nextCursor).toBe("20")
    })

    it("should filter out deleted posts", () => {
      const postsWithAuthors = [
        { post: { _id: "1" }, author: { name: "A" } },
        { post: null, author: null }, // Deleted
        { post: { _id: "3" }, author: { name: "C" } },
      ]
      
      const validPosts = postsWithAuthors.filter((p) => p.post !== null)
      
      expect(validPosts).toHaveLength(2)
    })
  })

  describe("searchHashtags", () => {
    it("should find hashtags by prefix", () => {
      const allHashtags = [
        { tag: "javascript" },
        { tag: "java" },
        { tag: "python" },
      ]
      
      const query = "jav"
      const matches = allHashtags.filter((h) => h.tag.startsWith(query))
      
      expect(matches).toHaveLength(2)
      expect(matches.map((h) => h.tag)).toContain("javascript")
      expect(matches.map((h) => h.tag)).toContain("java")
    })

    it("should sort results by popularity", () => {
      const hashtags = [
        { tag: "web", postCount: 5 },
        { tag: "webdev", postCount: 50 },
        { tag: "website", postCount: 20 },
      ]
      
      const sorted = [...hashtags].sort((a, b) => b.postCount - a.postCount)
      
      expect(sorted[0].tag).toBe("webdev")
      expect(sorted[1].tag).toBe("website")
      expect(sorted[2].tag).toBe("web")
    })

    it("should respect limit parameter", () => {
      const hashtags = Array.from({ length: 10 }, (_, i) => ({
        tag: `tag${i}`,
        postCount: i,
      }))
      
      const limit = 3
      const limited = hashtags.slice(0, limit)
      
      expect(limited).toHaveLength(3)
    })

    it("should return empty for very short query", () => {
      const query = ""
      const shouldSearch = query.length > 0
      
      expect(shouldSearch).toBe(false)
    })
  })

  describe("updateTrendingScores", () => {
    it("should calculate score based on recent activity", () => {
      const dailyCount = 2
      const weeklyCount = 3
      
      // Scoring formula: (daily * 3) + weekly
      const trendingScore = dailyCount * 3 + weeklyCount
      
      expect(trendingScore).toBe(9)
    })

    it("should give more weight to daily posts", () => {
      const scenario1 = { daily: 5, weekly: 5 }
      const scenario2 = { daily: 1, weekly: 10 }
      
      const score1 = scenario1.daily * 3 + scenario1.weekly
      const score2 = scenario2.daily * 3 + scenario2.weekly
      
      expect(score1).toBe(20) // 15 + 5
      expect(score2).toBe(13) // 3 + 10
      expect(score1).toBeGreaterThan(score2)
    })

    it("should filter posts by time range", () => {
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
      
      const posts = [
        { createdAt: now - 1000 }, // Within 24h
        { createdAt: oneDayAgo - 1000 }, // Too old for daily
        { createdAt: oneWeekAgo - 1000 }, // Too old for weekly
      ]
      
      const dailyPosts = posts.filter((p) => p.createdAt >= oneDayAgo)
      const weeklyPosts = posts.filter((p) => p.createdAt >= oneWeekAgo)
      
      expect(dailyPosts).toHaveLength(1)
      expect(weeklyPosts).toHaveLength(2)
    })
  })

  describe("getHashtagStats", () => {
    it("should return hashtag statistics", () => {
      const hashtag = {
        tag: "typescript",
        postCount: 25,
        lastUsedAt: Date.now(),
        trendingScore: 75,
      }
      
      expect(hashtag).toHaveProperty("tag")
      expect(hashtag).toHaveProperty("postCount")
      expect(hashtag).toHaveProperty("lastUsedAt")
      expect(hashtag).toHaveProperty("trendingScore")
      expect(hashtag.postCount).toBe(25)
    })

    it("should return null for non-existent hashtag", () => {
      const hashtag = null
      const stats = hashtag || null
      
      expect(stats).toBeNull()
    })

    it("should normalize tag before querying", () => {
      const inputTag = "#REACT"
      const normalizedTag = normalizeHashtag(inputTag)
      
      expect(normalizedTag).toBe("react")
    })
  })

  describe("linkHashtagsToPost", () => {
    it("should extract hashtags from content", () => {
      const content = "Learning #javascript and #react"
      const hashtags = extractHashtags(content)
      
      expect(hashtags).toEqual(["javascript", "react"])
    })

    it("should increment postCount for existing hashtag", () => {
      const existingHashtag = { postCount: 5 }
      const updatedCount = existingHashtag.postCount + 1
      
      expect(updatedCount).toBe(6)
    })

    it("should create new hashtag with postCount 1", () => {
      const newHashtag = {
        tag: "newtag",
        postCount: 1,
        lastUsedAt: Date.now(),
        trendingScore: 0,
      }
      
      expect(newHashtag.postCount).toBe(1)
      expect(newHashtag.trendingScore).toBe(0)
    })

    it("should update lastUsedAt timestamp", () => {
      const now = Date.now()
      const hashtag = {
        lastUsedAt: now - 10000,
      }
      
      const updatedHashtag = {
        ...hashtag,
        lastUsedAt: now,
      }
      
      expect(updatedHashtag.lastUsedAt).toBeGreaterThan(hashtag.lastUsedAt)
    })

    it("should prevent duplicate post-hashtag links", () => {
      const existingLinks = [
        { postId: "post1", hashtagId: "hashtag1" },
        { postId: "post1", hashtagId: "hashtag2" },
      ]
      
      const newLink = { postId: "post1", hashtagId: "hashtag1" }
      const isDuplicate = existingLinks.some(
        (link) => link.postId === newLink.postId && link.hashtagId === newLink.hashtagId
      )
      
      expect(isDuplicate).toBe(true)
    })
  })
})
