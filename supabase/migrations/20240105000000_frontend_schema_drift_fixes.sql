-- ============================================================================
-- Adds columns for fields several forms have been sending since before this
-- migration, which had no matching column and were silently dropped (or, for
-- events/jobs, caused the insert to fail outright — see docs/TASKS.md §2 for
-- the full account of each). All additive, all nullable — safe against
-- existing rows and existing code that doesn't yet set them.
-- ============================================================================

-- questions: AskQuestionModal.tsx sends `course`
ALTER TABLE questions ADD COLUMN IF NOT EXISTS course TEXT;

-- events: CreateEventModal.tsx sends `virtualLink` and `maxAttendees`
ALTER TABLE events ADD COLUMN IF NOT EXISTS virtual_link TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INT;

-- jobs: PostJobModal.tsx sends `remote` and `duration`
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remote BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration TEXT;

-- marketplace_listings: both CreateListingModal.tsx and EditListingModal.tsx
-- send `condition`; CreateListingModal.tsx also sends `university`
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS condition TEXT
  CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor'));
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS university TEXT;
