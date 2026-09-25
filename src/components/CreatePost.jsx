import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useSelector } from "react-redux";
import { db } from "../firebase/config";
import { uploadImage, uploadVideo } from "../utils/uploadImage";

function CreatePost({ setIsPosting }) {
  // ✅ receive setIsPosting
  const { currentUser, userProfile } = useSelector((s) => s.auth);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = "success", duration = 3000) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleFileChange(e, type) {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setFileType(type);
    setPreview(URL.createObjectURL(selected));
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setFileType(null);
  }

  async function handleSubmit() {
    if (!content.trim() && !file) return;

    // ✅ Pause listener BEFORE posting
    setIsPosting(true);
    setLoading(true);

    const loadId = showToast(
      fileType === "video" ? "🎥 Uploading video..." : "⏳ Creating post...",
      "loading",
    );

    try {
      let mediaUrl = "";
      if (file && fileType === "image") mediaUrl = await uploadImage(file);
      else if (file && fileType === "video") mediaUrl = await uploadVideo(file);

      await addDoc(collection(db, "posts"), {
        userId: currentUser.uid,
        userDisplayName: userProfile.displayName,
        userProfilePic: userProfile.profilePic || "",
        content: content || "",
        image: fileType === "image" ? mediaUrl : "",
        video: fileType === "video" ? mediaUrl : "",
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
      });

      setContent("");
      setFile(null);
      setPreview(null);
      setFileType(null);

      // ✅ Show loading for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      removeToast(loadId);
      showToast("✅ Post created successfully!", "success");

      // ✅ Show success for 2 seconds THEN resume listener
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(err);
      removeToast(loadId);
      showToast("❌ Failed to post. Try again.", "error");
    }

    setLoading(false);
    setIsPosting(false); // ✅ Resume listener AFTER everything
  }

  return (
    <>
      {/* Bottom Right Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
              toast.type === "success"
                ? "bg-green-500"
                : toast.type === "error"
                  ? "bg-red-500"
                  : toast.type === "loading"
                    ? "bg-blue-500"
                    : "bg-gray-700"
            }`}
          >
            {toast.type === "loading" ? (
              <svg
                className="animate-spin h-4 w-4 text-white"
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
            ) : toast.type === "success" ? (
              "✅"
            ) : (
              "❌"
            )}
            {toast.message}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          {userProfile?.profilePic ? (
            <img
              src={userProfile.profilePic}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {userProfile?.displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <textarea
            placeholder={`What's on your mind, ${userProfile?.displayName}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="1"
            onFocus={(e) => (e.target.rows = 3)}
            onBlur={(e) => (e.target.rows = 1)}
            className=" min-h-[42px] flex-1 resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {preview && (
          <div className="relative mb-3">
            {fileType === "image" ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-cover"
              />
            ) : (
              <video
                src={preview}
                controls
                className="w-full rounded-lg max-h-64"
              />
            )}
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-7 h-7 text-sm flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}

        <hr className="mb-3 border-slate-100" />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <label className="flex items-center gap-1 cursor-pointer text-green-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-semibold">
              📷 Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "image")}
                className="hidden"
              />
            </label>
            <label className="flex items-center gap-1 cursor-pointer text-purple-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-semibold">
              🎥 Video
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, "video")}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && !file)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                {fileType === "video" ? "Uploading..." : "Posting..."}
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default CreatePost;
