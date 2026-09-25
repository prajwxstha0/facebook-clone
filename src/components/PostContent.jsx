import { useRef, useState } from "react";

function PostContent({
  post,
  isEditing,
  editContent,
  setEditContent,
  setEditImage,
  setEditVideo,
  editPreview,
  setEditPreview,
  editMediaType,
  setEditMediaType,
  onSave,
  onCancel,
  editLoading,
}) {
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [showFullText, setShowFullText] = useState(false);

  const content = post.content || "";
  const isLongContent = content.length > 280;
  const visibleContent =
    !isLongContent || showFullText
      ? content
      : `${content.slice(0, 280).trim()}…`;
  const hasMedia = Boolean(post.image || post.video);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5 MB.");
      e.target.value = "";
      return;
    }
    setEditImage(file);
    setEditVideo(null);
    setEditMediaType("image");
    setEditPreview(URL.createObjectURL(file));
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/") || file.size > 50 * 1024 * 1024) {
      alert("Please choose a video smaller than 50 MB.");
      e.target.value = "";
      return;
    }
    setEditVideo(file);
    setEditImage(null);
    setEditMediaType("video");
    setEditPreview(URL.createObjectURL(file));
  }

  function removeMedia() {
    setEditImage(null);
    setEditVideo(null);
    setEditPreview(null);
    setEditMediaType(null);
  }

  if (isEditing) {
    return (
      <div className="px-3 pb-3">
        {/* Text */}
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows="3"
          placeholder="Write a thoughtful update..."
          className="mb-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        {/* ✅ Current or New Media Preview */}
        {editPreview ? (
          <div className="relative mb-3">
            {editMediaType === "image" ? (
              <img
                src={editPreview}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-cover"
              />
            ) : (
              <video
                src={editPreview}
                controls
                className="w-full rounded-lg max-h-64"
              />
            )}
            <button
              onClick={removeMedia}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-sm transition hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          // ✅ Show existing post media if no new media selected
          <>
            {post.image && post.image !== "" && (
              <div className="relative mb-3">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full rounded-lg max-h-64 object-cover"
                />
                <button
                  onClick={() => setEditPreview(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-sm transition hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
            {post.video && post.video !== "" && (
              <div className="relative mb-3">
                <video
                  src={post.video}
                  controls
                  className="w-full rounded-lg max-h-64"
                />
                <button
                  onClick={() => setEditPreview(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-sm transition hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        {/* ✅ Media Upload Buttons */}
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
            📷 Photo
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100">
            🎥 Video
            <input
              type="file"
              accept="video/*"
              ref={videoInputRef}
              onChange={handleVideoChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Save / Cancel */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={onSave}
            disabled={editLoading || !editContent.trim()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editLoading ? (
              <>
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
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="pb-3">
      {content && (
        <div className="px-4 sm:px-5">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">
            {visibleContent}
          </p>
          {isLongContent && (
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="mt-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              {showFullText ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {hasMedia && (
        <div className="mt-3 overflow-hidden border-y border-slate-100 bg-slate-50">
          {post.image && (
            <button
              onClick={() =>
                window.open(post.image, "_blank", "noopener,noreferrer")
              }
              className="group relative block w-full"
              aria-label="Open post image"
            >
              <img
                src={post.image}
                alt="Post content"
                className="max-h-[560px] w-full object-cover transition duration-300 group-hover:brightness-[0.98]"
              />
              <span className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                View full img
              </span>
            </button>
          )}
          {post.video && (
            <video
              src={post.video}
              controls
              playsInline
              preload="metadata"
              className="max-h-[560px] w-full bg-black object-contain"
            >
              Your browser does not support video playback.
            </video>
          )}
        </div>
      )}

      {!content && !hasMedia && (
        <div className="mx-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 sm:mx-5">
          This post has no content.
        </div>
      )}
    </div>
  );
}

export default PostContent;
