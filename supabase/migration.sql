-- ============================================================================
-- Campus Connect — Supabase PostgreSQL Migration
-- ============================================================================
-- Run this in your Supabase SQL Editor to create all tables.
-- After creating tables, enable RLS and create policies.
-- ============================================================================

-- ============================================================================
-- 1. USERS (extended from Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'User',
  username TEXT UNIQUE,
  bio TEXT DEFAULT '',
  university TEXT DEFAULT '',
  role TEXT DEFAULT 'Student' CHECK (role IN ('Student', 'Research Scholar', 'Faculty')),
  experience_level TEXT DEFAULT 'Beginner' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  profile_picture TEXT,
  skills TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. FOLLOWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================================
-- 3. POSTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  bookmark_count INT DEFAULT 0,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT CHECK (media_type IN ('image', 'video', 'file', 'link')),
  media_file_names TEXT[] DEFAULT '{}',
  link_preview JSONB,
  community_id UUID,
  poll_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. REACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'laugh', 'wow', 'sad', 'scholarly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- ============================================================================
-- 6. CONVERSATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CONVERSATION PARTICIPANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================================================
-- 8. MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 9. COMMUNITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Academic',
  cover_image TEXT,
  member_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. COMMUNITY MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- ============================================================================
-- 11. COMMUNITY INVITES
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id),
  invitee_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_type TEXT DEFAULT 'in_person' CHECK (event_type IN ('in_person', 'virtual', 'hybrid')),
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  community_id UUID REFERENCES communities(id),
  created_by UUID REFERENCES users(id),
  attendee_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. EVENT ATTENDEES
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ============================================================================
-- 14. JOBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT,
  type TEXT DEFAULT 'full_time' CHECK (type IN ('full_time', 'part_time', 'internship', 'contract')),
  salary TEXT,
  skills TEXT[] DEFAULT '{}',
  application_deadline TIMESTAMPTZ,
  posted_by UUID REFERENCES users(id),
  application_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. JOB APPLICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- ============================================================================
-- 16. STORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  background_color TEXT DEFAULT '#111111',
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================================================
-- 17. STORY VIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);

-- ============================================================================
-- 18. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  from_user_id UUID REFERENCES users(id),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 19. BOOKMARKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================================================
-- 20. HASHTAGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  post_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 21. POST HASHTAGS (junction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

-- ============================================================================
-- 22. POLLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 23. POLL VOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_id, user_id)
);

-- ============================================================================
-- 24. REPOSTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reposter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_post_id, reposter_id)
);

-- ============================================================================
-- 25. QUESTIONS (Q&A)
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  answer_count INT DEFAULT 0,
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 26. QUESTION ANSWERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  vote_count INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 27. RESOURCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  course TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INT,
  uploaded_by UUID REFERENCES users(id),
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 28. RESEARCH PAPERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  abstract TEXT DEFAULT '',
  authors TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  vote_count INT DEFAULT 0,
  review_count INT DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 29. MARKETPLACE LISTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2),
  category TEXT DEFAULT 'other' CHECK (category IN ('books', 'electronics', 'furniture', 'services', 'other')),
  images TEXT[] DEFAULT '{}',
  contact_info TEXT,
  posted_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 30. USER REPUTATION (Gamification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  level INT DEFAULT 1,
  badges JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 31. PRESENCE (Online Status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'dnd', 'invisible', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 32. SKILL ENDORSEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  endorser_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill, endorser_id)
);

-- ============================================================================
-- 33. PORTFOLIO PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 34. PORTFOLIO CERTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  date_obtained TIMESTAMPTZ,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 35. ADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  target_url TEXT,
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 36. SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_count ON hashtags(post_count DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_questions_author ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_research_papers_author ON research_papers(uploaded_by);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- USERS: anyone can read profiles, only owner can update
CREATE POLICY "Public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- FOLLOWS: anyone can read, only self can follow/unfollow
CREATE POLICY "Public follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Follow users" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow users" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- POSTS: anyone can read, only author can create/update/delete
CREATE POLICY "Public posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- COMMENTS: anyone can read, only author can create/update/delete
CREATE POLICY "Public comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- REACTIONS: anyone can read, only self can react/unreact
CREATE POLICY "Public reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Add reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remove reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- CONVERSATIONS: only participants can read
CREATE POLICY "Participant conversations" ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- CONVERSATION PARTICIPANTS: only participants can read
CREATE POLICY "Participant access" ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "Add participants" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MESSAGES: only conversation participants can read/create
CREATE POLICY "Participant messages read" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Participant messages insert" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- COMMUNITIES: anyone can read, only creator can update
CREATE POLICY "Public communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Create communities" ON communities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update own communities" ON communities FOR UPDATE USING (auth.uid() = created_by);

-- COMMUNITY MEMBERS: anyone can read, members can join/leave
CREATE POLICY "Public member lists" ON community_members FOR SELECT USING (true);
CREATE POLICY "Join community" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave community" ON community_members FOR DELETE USING (auth.uid() = user_id);

-- COMMUNITY INVITES: only involved users can read
CREATE POLICY "View own invites" ON community_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);
CREATE POLICY "Create invites" ON community_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Respond to invite" ON community_invites FOR UPDATE USING (auth.uid() = invitee_id);

-- EVENTS: anyone can read, only creator can update/delete
CREATE POLICY "Public events" ON events FOR SELECT USING (true);
CREATE POLICY "Create events" ON events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update own events" ON events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Delete own events" ON events FOR DELETE USING (auth.uid() = created_by);

-- EVENT ATTENDEES: anyone can read, only self can RSVP
CREATE POLICY "Public attendee lists" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "RSVP to events" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cancel RSVP" ON event_attendees FOR DELETE USING (auth.uid() = user_id);

-- JOBS: anyone can read, only poster can update/delete
CREATE POLICY "Public jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Post jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Update own jobs" ON jobs FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Delete own jobs" ON jobs FOR DELETE USING (auth.uid() = posted_by);

-- JOB APPLICATIONS: applicant and job poster can read
CREATE POLICY "View own applications" ON job_applications FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM jobs WHERE id = job_id AND posted_by = auth.uid()
  ));
CREATE POLICY "Apply to jobs" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STORIES: anyone can read, only author can create/delete
CREATE POLICY "Public stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Create stories" ON stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Delete own stories" ON stories FOR DELETE USING (auth.uid() = author_id);

-- STORY VIEWS: only self can insert
CREATE POLICY "Record story views" ON story_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "View story stats" ON story_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM stories WHERE id = story_id AND author_id = auth.uid()));

-- NOTIFICATIONS: only owner can read/update
CREATE POLICY "Own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- BOOKMARKS: only self can read/create/delete
CREATE POLICY "Own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- HASHTAGS: anyone can read, authenticated can insert
CREATE POLICY "Public hashtags" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Create hashtags" ON hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- POST HASHTAGS: anyone can read
CREATE POLICY "Public post hashtags" ON post_hashtags FOR SELECT USING (true);
CREATE POLICY "Link posts to hashtags" ON post_hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- POLLS: anyone can read, only creator can insert
CREATE POLICY "Public polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = created_by);

-- POLL VOTES: only self can vote
CREATE POLICY "View poll votes" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Vote on polls" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- REPOSTS: anyone can read, only self can create/delete
CREATE POLICY "Public reposts" ON reposts FOR SELECT USING (true);
CREATE POLICY "Create reposts" ON reposts FOR INSERT WITH CHECK (auth.uid() = reposter_id);
CREATE POLICY "Delete own reposts" ON reposts FOR DELETE USING (auth.uid() = reposter_id);

-- QUESTIONS: anyone can read, only author can update/delete
CREATE POLICY "Public questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Create questions" ON questions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own questions" ON questions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete own questions" ON questions FOR DELETE USING (auth.uid() = author_id);

-- QUESTION ANSWERS: anyone can read, only author can update/delete
CREATE POLICY "Public answers" ON question_answers FOR SELECT USING (true);
CREATE POLICY "Create answers" ON question_answers FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own answers" ON question_answers FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete own answers" ON question_answers FOR DELETE USING (auth.uid() = author_id);

-- RESOURCES: anyone can read, only uploader can update/delete
CREATE POLICY "Public resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Upload resources" ON resources FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Update own resources" ON resources FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Delete own resources" ON resources FOR DELETE USING (auth.uid() = uploaded_by);

-- RESEARCH PAPERS: anyone can read, only uploader can update/delete
CREATE POLICY "Public papers" ON research_papers FOR SELECT USING (true);
CREATE POLICY "Upload papers" ON research_papers FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Update own papers" ON research_papers FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Delete own papers" ON research_papers FOR DELETE USING (auth.uid() = uploaded_by);

-- MARKETPLACE: anyone can read, only poster can update/delete
CREATE POLICY "Public listings" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Create listings" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Update own listings" ON marketplace_listings FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Delete own listings" ON marketplace_listings FOR DELETE USING (auth.uid() = posted_by);

-- USER REPUTATION: anyone can read, system can update
CREATE POLICY "Public reputation" ON user_reputation FOR SELECT USING (true);
CREATE POLICY "Upsert reputation" ON user_reputation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update reputation" ON user_reputation FOR UPDATE USING (auth.uid() = user_id);

-- PRESENCE: anyone can read, only self can update
CREATE POLICY "Public presence" ON presence FOR SELECT USING (true);
CREATE POLICY "Update own presence" ON presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update presence" ON presence FOR UPDATE USING (auth.uid() = user_id);

-- SKILL ENDORSEMENTS: anyone can read, only self can endorse
CREATE POLICY "Public endorsements" ON skill_endorsements FOR SELECT USING (true);
CREATE POLICY "Endorse skills" ON skill_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);
CREATE POLICY "Remove endorsements" ON skill_endorsements FOR DELETE USING (auth.uid() = endorser_id);

-- PORTFOLIO: anyone can read, only owner can modify
CREATE POLICY "Public portfolios" ON portfolio_projects FOR SELECT USING (true);
CREATE POLICY "Add projects" ON portfolio_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own projects" ON portfolio_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own projects" ON portfolio_projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public certifications" ON portfolio_certifications FOR SELECT USING (true);
CREATE POLICY "Add certifications" ON portfolio_certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own certifications" ON portfolio_certifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own certifications" ON portfolio_certifications FOR DELETE USING (auth.uid() = user_id);

-- ADS: only admin can manage
CREATE POLICY "Admin manage ads" ON ads FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- SUBSCRIPTIONS: only owner can read
CREATE POLICY "Own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_marketplace_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  INSERT INTO public.user_reputation (user_id)
  VALUES (NEW.id);
  INSERT INTO public.presence (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- DONE
-- ============================================================================
