function PostActions({ post, currentUserId, onLike, onToggleComments }) {
  const alreadyLiked = post.likes?.includes(currentUserId);

  return (
    <>
      {/* Stats */}
      <div className="px-3 py-2 border-t border-b flex justify-between text-xs text-gray-500">
        <span>👍 {post.likes?.length || 0} Likes</span>
        <span>💬 {post.comments?.length || 0} Comments</span>
      </div>

      {/* Buttons */}
      <div className="flex justify-around py-1">
        <button
          onClick={onLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-full justify-center hover:bg-gray-100 ${
            alreadyLiked ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          👍 Like
        </button>
        <button
          onClick={onToggleComments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 w-full justify-center hover:bg-gray-100"
        >
          💬 Comment
        </button>
      </div>
    </>
  );
}

export default PostActions;