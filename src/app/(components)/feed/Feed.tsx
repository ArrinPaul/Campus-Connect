import { CreatePost } from './CreatePost';
import { FeedList } from './FeedList';

export function Feed() {
  return (
    <div className="space-y-4">
      <CreatePost />
      <FeedList />
    </div>
  );
}
