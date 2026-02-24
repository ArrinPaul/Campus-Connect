import { CreatePost } from './CreatePost';
import { FeedList } from './FeedList';
import { StoryRow } from '@/components/stories/StoryRow';

export function Feed() {
  return (
    <div className="space-y-4">
      <StoryRow />
      <CreatePost />
      <FeedList />
    </div>
  );
}
