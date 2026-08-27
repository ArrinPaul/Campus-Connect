// Mock Supabase server client
const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe("Phase 3 Feature Integration Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
  });

  describe("1. Event Management (P3-03)", () => {
    it("updateEvent succeeds when user is the event creator", async () => {
      const { updateEvent } = await import("@/server/db/events-jobs");

      const mockEvent = { id: "event-1", created_by: "user-123" };
      const mockSingleFetch = jest.fn().mockResolvedValue({ data: mockEvent, error: null });
      const mockSelectFetch = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleFetch }) });

      const mockUpdatedEvent = { id: "event-1", title: "Updated Hackathon" };
      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: mockUpdatedEvent, error: null });
      const mockSelectUpdate = jest.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: mockSelectUpdate }) });

      mockFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: mockSelectFetch,
            update: mockUpdate,
          };
        }
        return {};
      });

      const result = await updateEvent("event-1", "user-123", { title: "Updated Hackathon" });
      expect(result).toEqual(mockUpdatedEvent);
      expect(mockUpdate).toHaveBeenCalledWith({ title: "Updated Hackathon" });
    });

    it("updateEvent rejects with forbidden when user is not creator and not admin", async () => {
      const { updateEvent } = await import("@/server/db/events-jobs");

      const mockEvent = { id: "event-1", created_by: "other-user" };
      const mockSingleFetch = jest.fn().mockResolvedValue({ data: mockEvent, error: null });
      const mockSelectFetch = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleFetch }) });

      mockFrom.mockReturnValue({ select: mockSelectFetch });

      const result = await updateEvent("event-1", "user-123", { title: "Hacked Hackathon" }, false);
      expect(result).toEqual({ error: "Forbidden" });
    });

    it("deleteEvent deletes event when user is the creator", async () => {
      const { deleteEvent } = await import("@/server/db/events-jobs");

      const mockEvent = { id: "event-1", created_by: "user-123" };
      const mockSingleFetch = jest.fn().mockResolvedValue({ data: mockEvent, error: null });
      const mockSelectFetch = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleFetch }) });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: mockSelectFetch,
            delete: mockDelete,
          };
        }
        return {};
      });

      const result = await deleteEvent("event-1", "user-123");
      expect(result).toBe(true);
      expect(mockDeleteEq).toHaveBeenCalledWith("id", "event-1");
    });
  });

  describe("2. Job Management (P3-04)", () => {
    it("updateJob succeeds for authorized poster", async () => {
      const { updateJob } = await import("@/server/db/events-jobs");

      const mockJob = { id: "job-1", posted_by: "user-123" };
      const mockSingleFetch = jest.fn().mockResolvedValue({ data: mockJob, error: null });
      const mockSelectFetch = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleFetch }) });

      const mockUpdatedJob = { id: "job-1", title: "Senior AI Engineer" };
      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: mockUpdatedJob, error: null });
      const mockSelectUpdate = jest.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: mockSelectUpdate }) });

      mockFrom.mockImplementation((table: string) => {
        if (table === "jobs") {
          return {
            select: mockSelectFetch,
            update: mockUpdate,
          };
        }
        return {};
      });

      const result = await updateJob("job-1", "user-123", { title: "Senior AI Engineer" });
      expect(result).toEqual(mockUpdatedJob);
    });

    it("deleteJob deletes job for authorized poster", async () => {
      const { deleteJob } = await import("@/server/db/events-jobs");

      const mockJob = { id: "job-1", posted_by: "user-123" };
      const mockSingleFetch = jest.fn().mockResolvedValue({ data: mockJob, error: null });
      const mockSelectFetch = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleFetch }) });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === "jobs") {
          return {
            select: mockSelectFetch,
            delete: mockDelete,
          };
        }
        return {};
      });

      const result = await deleteJob("job-1", "user-123");
      expect(result).toBe(true);
      expect(mockDeleteEq).toHaveBeenCalledWith("id", "job-1");
    });

    it("getJobApplications returns applications for job poster", async () => {
      const { getJobApplications } = await import("@/server/db/events-jobs");

      const mockJob = { id: "job-1", posted_by: "user-123" };
      const mockSingleJob = jest.fn().mockResolvedValue({ data: mockJob, error: null });
      const mockSelectJob = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleJob }) });

      const mockApps = [
        { id: "app-1", cover_letter: "Excited to apply", applicant: { name: "Alice" } },
      ];
      const mockOrderApps = jest.fn().mockResolvedValue({ data: mockApps, error: null });
      const mockEqApps = jest.fn().mockReturnValue({ order: mockOrderApps });
      const mockSelectApps = jest.fn().mockReturnValue({ eq: mockEqApps });

      mockFrom.mockImplementation((table: string) => {
        if (table === "jobs") return { select: mockSelectJob };
        if (table === "job_applications") return { select: mockSelectApps };
        return {};
      });

      const result = await getJobApplications("job-1", "user-123");
      expect(result).toEqual(mockApps);
    });
  });

  describe("3. Q&A Voting (P3-05)", () => {
    it("voteQuestion adds a new upvote and increments vote_count atomically", async () => {
      const { voteQuestion } = await import("@/server/db/content");

      // No existing reaction
      const mockSingleReaction = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
      const mockSelectReaction = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ single: mockSingleReaction }),
          }),
        }),
      });

      const mockInsertReaction = jest.fn().mockResolvedValue({ data: {}, error: null });

      const mockSingleQuestion = jest.fn().mockResolvedValue({ data: { vote_count: 5 }, error: null });
      const mockSelectQuestion = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleQuestion }) });

      mockRpc.mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "reactions") {
          return {
            select: mockSelectReaction,
            insert: mockInsertReaction,
          };
        }
        if (table === "questions") {
          return {
            select: mockSelectQuestion,
          };
        }
        return {};
      });

      const result = await voteQuestion("question-100", "user-123", "up");

      expect(result.voteCount).toBe(5);
      expect(result.userVote).toBe("up");
      expect(mockInsertReaction).toHaveBeenCalledWith({
        user_id: "user-123",
        target_id: "question-100",
        target_type: "question",
        type: "up",
      });
      expect(mockRpc).toHaveBeenCalledWith("increment_field", {
        table_name: "questions",
        field_name: "vote_count",
        row_id: "question-100",
        increment_by: 1,
      });
    });

    it("voteQuestion toggles off vote when user clicks same vote again", async () => {
      const { voteQuestion } = await import("@/server/db/content");

      // Existing upvote
      const mockExisting = { id: "reaction-1", type: "up" };
      const mockSingleReaction = jest.fn().mockResolvedValue({ data: mockExisting, error: null });
      const mockSelectReaction = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ single: mockSingleReaction }),
          }),
        }),
      });

      const mockDeleteReactionEq = jest.fn().mockResolvedValue({ error: null });
      const mockDeleteReaction = jest.fn().mockReturnValue({ eq: mockDeleteReactionEq });

      const mockSingleQuestion = jest.fn().mockResolvedValue({ data: { vote_count: 4 }, error: null });
      const mockSelectQuestion = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingleQuestion }) });

      mockRpc.mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "reactions") {
          return {
            select: mockSelectReaction,
            delete: mockDeleteReaction,
          };
        }
        if (table === "questions") {
          return {
            select: mockSelectQuestion,
          };
        }
        return {};
      });

      const result = await voteQuestion("question-100", "user-123", "up");

      expect(result.voteCount).toBe(4);
      expect(result.userVote).toBeNull();
      expect(mockDeleteReactionEq).toHaveBeenCalledWith("id", "reaction-1");
      expect(mockRpc).toHaveBeenCalledWith("increment_field", {
        table_name: "questions",
        field_name: "vote_count",
        row_id: "question-100",
        increment_by: -1,
      });
    });
  });
});
