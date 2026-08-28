const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://urxgegqlyzvvvdyukjrg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGdlZ3FseXp2dnZkeXVranJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY3NzUyMCwiZXhwIjoyMDk5MjUzNTIwfQ.wq8pg6w53gm78UyC7h9b45n4OJq9CPGLmR8y_mPx37U');

async function seedPosts() {
  const { data: users } = await supabase.from('users').select('id, name').limit(3);
  if (!users || users.length === 0) { console.log('No users found to seed'); return; }

  const u1 = users[0];
  const u2 = users.length > 1 ? users[1] : users[0];

  const posts = [
    {
      author_id: u1.id,
      content: 'Just finished my midterms! Anyone up for some basketball at the rec center later today?',
      like_count: 5,
      comment_count: 2,
    },
    {
      author_id: u2.id,
      content: 'I created a study guide for CS 101. Let me know if you want the link!',
      like_count: 12,
      comment_count: 0,
    },
    {
      author_id: u1.id,
      content: 'The coffee at the library cafe is actually getting better.',
      like_count: 8,
      comment_count: 1,
    }
  ];

  const { error } = await supabase.from('posts').insert(posts);
  if (error) console.error('Error inserting posts:', error);
  else console.log('Successfully seeded posts!');
  
  process.exit(0);
}
seedPosts();