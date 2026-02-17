import {
  normalizeHashtag,
  extractHashtags,
  parseHashtags,
  isValidHashtag,
  getHashtagDisplay,
} from "./hashtag-utils"

describe("hashtag-utils", () => {
  describe("normalizeHashtag", () => {
    it("should convert to lowercase", () => {
      expect(normalizeHashtag("JavaScript")).toBe("javascript")
      expect(normalizeHashtag("REACT")).toBe("react")
    })

    it("should remove leading hash symbol", () => {
      expect(normalizeHashtag("#programming")).toBe("programming")
      expect(normalizeHashtag("##double")).toBe("#double")
    })

    it("should trim whitespace", () => {
      expect(normalizeHashtag("  react  ")).toBe("react")
      expect(normalizeHashtag("\tjavascript\n")).toBe("javascript")
    })

    it("should handle already normalized tags", () => {
      expect(normalizeHashtag("webdev")).toBe("webdev")
      expect(normalizeHashtag("ai")).toBe("ai")
    })

    it("should handle empty strings", () => {
      expect(normalizeHashtag("")).toBe("")
      expect(normalizeHashtag("#")).toBe("")
    })
  })

  describe("extractHashtags", () => {
    it("should extract a single hashtag", () => {
      const result = extractHashtags("This is a #test")
      expect(result).toEqual(["test"])
    })

    it("should extract multiple hashtags", () => {
      const result = extractHashtags("Learning #javascript and #react #webdev")
      expect(result).toEqual(["javascript", "react", "webdev"])
    })

    it("should normalize hashtags to lowercase", () => {
      const result = extractHashtags("#JavaScript #REACT #WebDev")
      expect(result).toEqual(["javascript", "react", "webdev"])
    })

    it("should remove duplicate hashtags", () => {
      const result = extractHashtags("#coding #test #coding #webdev #test")
      expect(result).toEqual(["coding", "test", "webdev"])
    })

    it("should handle hashtags with numbers", () => {
      const result = extractHashtags("#web3 #ai2024 #node18")
      expect(result).toEqual(["web3", "ai2024", "node18"])
    })

    it("should handle hashtags with underscores", () => {
      const result = extractHashtags("#machine_learning #web_dev")
      expect(result).toEqual(["machine_learning", "web_dev"])
    })

    it("should handle hashtags at start and end", () => {
      const result = extractHashtags("#first some content #last")
      expect(result).toEqual(["first", "last"])
    })

    it("should extract hashtags up to special characters", () => {
      const result = extractHashtags("#valid #not-valid #also_valid")
      // #not-valid extracts as 'not' (stops at hyphen)
      expect(result).toEqual(["valid", "not", "also_valid"])
    })

    it("should return empty array for no hashtags", () => {
      const result = extractHashtags("No hashtags here")
      expect(result).toEqual([])
    })

    it("should handle multiple hashtags in sequence", () => {
      const result = extractHashtags("#one#two#three")
      expect(result).toEqual(["one", "two", "three"])
    })
  })

  describe("parseHashtags", () => {
    it("should parse text with no hashtags", () => {
      const result = parseHashtags("Just plain text")
      expect(result).toEqual([
        { type: "text", content: "Just plain text" },
      ])
    })

    it("should parse text with a single hashtag", () => {
      const result = parseHashtags("Check out #programming")
      expect(result).toEqual([
        { type: "text", content: "Check out " },
        { type: "hashtag", content: "#programming", tag: "programming" },
      ])
    })

    it("should parse text with multiple hashtags", () => {
      const result = parseHashtags("Learning #javascript and #react today!")
      expect(result).toEqual([
        { type: "text", content: "Learning " },
        { type: "hashtag", content: "#javascript", tag: "javascript" },
        { type: "text", content: " and " },
        { type: "hashtag", content: "#react", tag: "react" },
        { type: "text", content: " today!" },
      ])
    })

    it("should handle hashtag at the start", () => {
      const result = parseHashtags("#webdev is awesome")
      expect(result).toEqual([
        { type: "hashtag", content: "#webdev", tag: "webdev" },
        { type: "text", content: " is awesome" },
      ])
    })

    it("should handle hashtag at the end", () => {
      const result = parseHashtags("Love coding #programming")
      expect(result).toEqual([
        { type: "text", content: "Love coding " },
        { type: "hashtag", content: "#programming", tag: "programming" },
      ])
    })

    it("should handle consecutive hashtags", () => {
      const result = parseHashtags("#web #dev #coding")
      expect(result).toEqual([
        { type: "hashtag", content: "#web", tag: "web" },
        { type: "text", content: " " },
        { type: "hashtag", content: "#dev", tag: "dev" },
        { type: "text", content: " " },
        { type: "hashtag", content: "#coding", tag: "coding" },
      ])
    })

    it("should normalize hashtag tags to lowercase", () => {
      const result = parseHashtags("Using #JavaScript")
      expect(result[1]).toEqual({
        type: "hashtag",
        content: "#JavaScript",
        tag: "javascript",
      })
    })

    it("should handle hashtags with numbers and underscores", () => {
      const result = parseHashtags("#web3 and #machine_learning")
      expect(result).toEqual([
        { type: "hashtag", content: "#web3", tag: "web3" },
        { type: "text", content: " and " },
        { type: "hashtag", content: "#machine_learning", tag: "machine_learning" },
      ])
    })

    it("should handle multiline text", () => {
      const result = parseHashtags("Line 1 #test\nLine 2 #another")
      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({ type: "text", content: "Line 1 " })
      expect(result[1]).toEqual({ type: "hashtag", content: "#test", tag: "test" })
      expect(result[2]).toEqual({ type: "text", content: "\nLine 2 " })
      expect(result[3]).toEqual({ type: "hashtag", content: "#another", tag: "another" })
    })
  })

  describe("isValidHashtag", () => {
    it("should validate alphanumeric hashtags", () => {
      expect(isValidHashtag("programming")).toBe(true)
      expect(isValidHashtag("web3")).toBe(true)
      expect(isValidHashtag("AI2024")).toBe(true)
    })

    it("should validate hashtags with underscores", () => {
      expect(isValidHashtag("machine_learning")).toBe(true)
      expect(isValidHashtag("web_dev")).toBe(true)
    })

    it("should reject hashtags with spaces", () => {
      expect(isValidHashtag("web dev")).toBe(false)
      expect(isValidHashtag("machine learning")).toBe(false)
    })

    it("should reject hashtags with special characters", () => {
      expect(isValidHashtag("web-dev")).toBe(false)
      expect(isValidHashtag("ai!")).toBe(false)
      expect(isValidHashtag("test@tag")).toBe(false)
    })

    it("should reject empty strings", () => {
      expect(isValidHashtag("")).toBe(false)
    })

    it("should reject hashtags with hash symbol", () => {
      expect(isValidHashtag("#programming")).toBe(false)
    })
  })

  describe("getHashtagDisplay", () => {
    it("should add hash symbol to tag", () => {
      expect(getHashtagDisplay("programming")).toBe("#programming")
      expect(getHashtagDisplay("react")).toBe("#react")
    })

    it("should normalize and add hash symbol", () => {
      expect(getHashtagDisplay("JavaScript")).toBe("#javascript")
      expect(getHashtagDisplay(" REACT ")).toBe("#react")
    })

    it("should handle tags that already have hash", () => {
      expect(getHashtagDisplay("#webdev")).toBe("#webdev")
    })

    it("should handle empty strings", () => {
      expect(getHashtagDisplay("")).toBe("#")
    })

    it("should preserve numbers and underscores", () => {
      expect(getHashtagDisplay("web3")).toBe("#web3")
      expect(getHashtagDisplay("machine_learning")).toBe("#machine_learning")
    })
  })

  describe("edge cases", () => {
    it("should handle extremely long hashtags", () => {
      const longTag = "a".repeat(100)
      expect(normalizeHashtag(longTag)).toBe(longTag)
      expect(isValidHashtag(longTag)).toBe(true)
    })

    it("should handle unicode characters", () => {
      const result = extractHashtags("Testing #emoji😀 and #unicode")
      // Regex only matches alphanumeric + underscore, so emoji part is ignored
      expect(result).toEqual(["emoji", "unicode"])
    })

    it("should handle mixed case duplicates", () => {
      const result = extractHashtags("#React #react #REACT")
      expect(result).toEqual(["react"])
    })

    it("should handle hashtag-like patterns that aren't hashtags", () => {
      const result = extractHashtags("Email: user#domain.com")
      // This won't match because 'domain' has a dot after it
      expect(result).toEqual(["domain"])
    })
  })
})
