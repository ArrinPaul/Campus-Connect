// Mock Convex generated API
export const api = {
  users: {
    updateProfile: 'users:updateProfile',
    addSkill: 'users:addSkill',
    removeSkill: 'users:removeSkill',
    getCurrentUser: 'users:getCurrentUser',
    getUserById: 'users:getUserById',
    searchUsers: 'users:searchUsers',
    createUserFromWebhook: 'users:createUserFromWebhook',
    updateUserFromWebhook: 'users:updateUserFromWebhook',
  },
  posts: {
    getFeedPosts: 'posts:getFeedPosts',
    getPostById: 'posts:getPostById',
    createPost: 'posts:createPost',
    deletePost: 'posts:deletePost',
    likePost: 'posts:likePost',
    unlikePost: 'posts:unlikePost',
    hasUserLikedPost: 'posts:hasUserLikedPost',
  },
}
