import { formatDistanceToNow } from "date-fns";

function getTimeAgo(createdAt) {
  if (!createdAt) return "Just now";
  const postTime = new Date(createdAt);
  const diffInSeconds = Math.floor((new Date() - postTime) / 1000);
  if (diffInSeconds < 10 || diffInSeconds < 0) return "Just now";
  return formatDistanceToNow(postTime, { addSuffix: true });
}

function PostHeader({ post, isOwnPost, onEdit, onDelete, deleteLoading }) {
  return (
    <div className="flex items-center justify-between gap-2 p-3">
      {/* Avatar + Name + Time */}
      <div className="flex items-center gap-2">
        {post.userProfilePic ? (
          <img
            src={post.userProfilePic}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {post.userDisplayName?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm ">{post.userDisplayName}</p>
          <p className="text-xs text-gray-400">
            {getTimeAgo(post.createdAt)}
            {post.edited && <span className="ml-1">(edited)</span>}
          </p>
        </div>
      </div>

      {/* 3-dot Menu */}
      {isOwnPost && (
        <div className="relative group">
          <button className="text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-lg text-lg font-bold">
            ···
          </button>
          <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg z-10 w-36 border hidden group-hover:block">
            <button
              onClick={onEdit}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
            >
              ✏️ Edit Post
            </button>
            <button
              onClick={onDelete}
              disabled={deleteLoading}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-500"
            >
              {deleteLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Deleting...
                </span>
              ) : (
                "🗑️ Delete Post"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostHeader;
