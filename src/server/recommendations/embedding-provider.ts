import { createLogger } from "@/lib/logger"

const log = createLogger("EmbeddingProvider")

export interface EmbeddingProvider {
  readonly name: string
  readonly dimensions: number
  generateEmbedding(text: string): Promise<number[]>
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>
}

// ─── Deterministic Mock Embedding Provider (Zero-Cost / Tests / Offline) ─────

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock"
  readonly dimensions = 128

  async generateEmbedding(text: string): Promise<number[]> {
    const vector = new Array(this.dimensions).fill(0)
    if (!text || text.trim().length === 0) return vector

    // Generate deterministic values from character codes and word hashes
    const words = text.toLowerCase().split(/\s+/)
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j)
        const dimIndex = (charCode * 31 + j * 17 + i * 13) % this.dimensions
        vector[dimIndex] += (charCode % 10) / 10
      }
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (magnitude > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = vector[i] / magnitude
      }
    }

    return vector
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.generateEmbedding(t)))
  }
}

// ─── Live OpenAI Embedding Provider (Production) ──────────────────────────────

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai"
  readonly dimensions = 1536
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: "text-embedding-3-small",
      }),
    })

    if (!res.ok) {
      log.error("OpenAI embedding request failed", { status: res.status })
      throw new Error(`OpenAI API error: ${res.status}`)
    }

    const data = await res.json()
    return data.data[0].embedding
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: texts.map((t) => t.slice(0, 8000)),
        model: "text-embedding-3-small",
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status}`)
    }

    const data = await res.json()
    return data.data.map((d: any) => d.embedding)
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

export function getEmbeddingProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey && !apiKey.startsWith("mock_")) {
    return new OpenAIEmbeddingProvider(apiKey)
  }
  return new MockEmbeddingProvider()
}
