import Comment from './Comment';

function PostComments({ post, userProfile, commentText, setCommentText, onAddComment }) {
  return (
    <div className="px-3 pb-3">
      <hr className="mb-3" />

      {/* Comments List */}
      {post.comments?.map((comment, i) => (
        <Comment key={i} comment={comment} />
      ))}

      {/* Add Comment */}
      <div className="flex items-center gap-2 mt-2">
        {userProfile?.profilePic ? (
          <img src={userProfile.profilePic} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {userProfile?.displayName?.[0]?.toUpperCase()}
          </div>
        )}
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAddComment(); }}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none"
        />
        <button
          onClick={onAddComment}
          className="text-blue-600 font-semibold text-sm"
        >
          Post
        </button>
      </div>
    </div>
  );
}

export default PostComments;