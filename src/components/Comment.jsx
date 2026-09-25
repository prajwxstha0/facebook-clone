function Comment({ comment }) {
  return (
    <div className="flex items-start gap-2 mb-2">
      {comment.userProfilePic ? (
        <img
          src={comment.userProfilePic}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
          {comment.userDisplayName?.[0]?.toUpperCase()}
        </div>
      )}
      <div className="bg-gray-100 rounded-2xl px-3 py-2 text-sm">
        <p className="font-semibold text-xs">{comment.userDisplayName}</p>
        <p>{comment.content}</p>
      </div>
    </div>
  );
}

export default Comment;
