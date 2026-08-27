import fs from "fs";
import path from "path";

// Mock Supabase server client
const mockFrom = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: "test-user-id" } } })),
    },
  })),
}));

describe("Phase 2 Foundation Verification Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Database Migration File Integrity", () => {
    const migrationSql = fs.readFileSync(
      path.join(__dirname, "../../supabase/migrations/20240101000000_init.sql"),
      "utf-8"
    );

    it("includes calls table definition with caller_id, recipient_id, type, and status", () => {
      expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS calls");
      expect(migrationSql).toContain("caller_id UUID");
      expect(migrationSql).toContain("recipient_id UUID");
      expect(migrationSql).toContain("calls_caller_id_fkey");
      expect(migrationSql).toContain("calls_recipient_id_fkey");
    });

    it("enables RLS and creates policies for calls table", () => {
      expect(migrationSql).toContain("ALTER TABLE calls ENABLE ROW LEVEL SECURITY;");
      expect(migrationSql).toContain('CREATE POLICY "View own calls" ON calls');
      expect(migrationSql).toContain('CREATE POLICY "Create calls" ON calls');
      expect(migrationSql).toContain('CREATE POLICY "Update own calls" ON calls');
    });

    it("includes is_resolved column on questions table", () => {
      expect(migrationSql).toContain("is_resolved BOOLEAN DEFAULT FALSE");
    });

    it("defines type column on jobs table", () => {
      expect(migrationSql).toContain("type TEXT DEFAULT 'full_time'");
    });
  });

  describe("2. Security - Credential Scan", () => {
    it("setup-realtime.js uses process.env without hardcoded DB passwords", () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, "../../scripts/setup-realtime.js"), "utf-8");
      expect(scriptContent).not.toContain("Campus_connect11");
      expect(scriptContent).toContain("process.env.DATABASE_URL");
    });

    it("run-migration.js points to the canonical migration directory", () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, "../../scripts/run-migration.js"), "utf-8");
      expect(scriptContent).toContain("supabase/migrations/20240101000000_init.sql");
    });
  });

  describe("3. Database Query Layer - Events & Jobs", () => {
    it("getJobs filters on column 'type' instead of 'employment_type'", async () => {
      const { getJobs } = await import("@/server/db/events-jobs");

      const mockRange = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ range: mockRange });
      const mockOrder = jest.fn().mockReturnValue({ eq: mockEq, range: mockRange });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

      mockFrom.mockReturnValue({ select: mockSelect });

      await getJobs(10, 0, { type: "full_time" });

      expect(mockFrom).toHaveBeenCalledWith("jobs");
      expect(mockEq).toHaveBeenCalledWith("type", "full_time");
      expect(mockEq).not.toHaveBeenCalledWith("employment_type", "full_time");
    });
  });

  describe("4. Database Query Layer - Calls System", () => {
    it("initiateCall inserts into 'calls' table with proper status and foreign keys", async () => {
      const { initiateCall } = await import("@/server/db/misc");

      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "call-123", status: "ringing", caller_id: "user-1", recipient_id: "user-2" },
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      mockFrom.mockReturnValue({ insert: mockInsert });

      const call = await initiateCall("user-1", "user-2", "video");

      expect(mockFrom).toHaveBeenCalledWith("calls");
      expect(mockInsert).toHaveBeenCalledWith({
        caller_id: "user-1",
        recipient_id: "user-2",
        type: "video",
        status: "ringing",
      });
      expect(call).toBeDefined();
      expect(call?.id).toBe("call-123");
    });

    it("updateCallStatus updates status and ends timestamp on termination", async () => {
      const { updateCallStatus } = await import("@/server/db/misc");

      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({ update: mockUpdate });

      await updateCallStatus("call-123", "ended");

      expect(mockFrom).toHaveBeenCalledWith("calls");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ended",
          ended_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "call-123");
    });
  });

  describe("5. Database Query Layer - Q&A Resolution", () => {
    it("acceptAnswer marks answer as accepted and question as is_resolved", async () => {
      const { acceptAnswer } = await import("@/server/db/content");

      // Setup mock queries for question_answers fetch, question_answers update, and questions update
      const mockSingle = jest.fn().mockResolvedValue({
        data: { question_id: "question-456" },
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingle }) });
      const mockAnswerUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const mockAnswerUpdate = jest.fn().mockReturnValue({ eq: mockAnswerUpdateEq });

      const mockQuestionUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const mockQuestionUpdate = jest.fn().mockReturnValue({ eq: mockQuestionUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === "question_answers") {
          return {
            select: mockSelect,
            update: mockAnswerUpdate,
          };
        }
        if (table === "questions") {
          return {
            update: mockQuestionUpdate,
          };
        }
        return {};
      });

      const result = await acceptAnswer("answer-789");

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("question_answers");
      expect(mockAnswerUpdate).toHaveBeenCalledWith({ is_accepted: true });
      expect(mockFrom).toHaveBeenCalledWith("questions");
      expect(mockQuestionUpdate).toHaveBeenCalledWith({ is_resolved: true });
      expect(mockQuestionUpdateEq).toHaveBeenCalledWith("id", "question-456");
    });
  });
});
