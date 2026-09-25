import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db } from "../firebase/config";
import { deletePost, updatePost } from "../store/slices/postSlice";
import { uploadImage, uploadVideo } from "../utils/uploadImage";
import PostActions from "./PostActions";
import PostComments from "./PostComments";
import PostContent from "./PostContent";
import PostHeader from "./PostHeader";
import Toast from "./Toast";

function Post({ post }) {
  const dispatch = useDispatch();
  const { currentUser, userProfile } = useSelector((s) => s.auth);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // ✅ New edit media states
  const [editImage, setEditImage] = useState(null);
  const [editVideo, setEditVideo] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editMediaType, setEditMediaType] = useState(null);

  const isOwnPost = post.userId === currentUser?.uid;

  function showToast(message, type = "success", duration = 3000) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type !== "loading") {
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        duration,
      );
    }
    return id;
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditContent(post.content);
    setEditImage(null);
    setEditVideo(null);
    setEditPreview(null);
    setEditMediaType(null);
  }

  async function sendNotification(toUserId, type) {
    // Never notify the author about their own activity.
    if (!toUserId || toUserId === currentUser?.uid) return;

    try {
      await addDoc(collection(db, "notifications"), {
        toUserId,
        fromUserId: currentUser.uid,
        fromUserName: userProfile?.displayName || "Someone",
        type,
        postId: post.id,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // A notification failure should not make a successful like/comment fail.
      console.error("Unable to create notification:", err);
    }
  }

  async function handleLike() {
    const alreadyLiked = post.likes?.includes(currentUser?.uid);
    const updatedLikes = alreadyLiked
      ? post.likes.filter((id) => id !== currentUser.uid)
      : [...(post.likes || []), currentUser.uid];
    dispatch(updatePost({ ...post, likes: updatedLikes }));
    await updateDoc(doc(db, "posts", post.id), {
      likes: alreadyLiked
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid),
    });
    if (!alreadyLiked) {
      await sendNotification(post.userId, "like");
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    const loadId = showToast("Adding comment...", "loading");
    try {
      await updateDoc(doc(db, "posts", post.id), {
        comments: arrayUnion({
          userId: currentUser.uid,
          userDisplayName: userProfile?.displayName || "Someone",
          userProfilePic: userProfile?.profilePic || "",
          content: commentText,
          createdAt: new Date().toISOString(),
        }),
      });
      await sendNotification(post.userId, "comment");
      removeToast(loadId);
      showToast("💬 Comment added!", "success");
      setCommentText("");
    } catch {
      removeToast(loadId);
      showToast("❌ Failed to add comment", "error");
    }
  }

  // ✅ Updated handleEdit with image/video support
  async function handleEdit() {
    if (!editContent.trim()) return;
    setEditLoading(true);
    const loadId = showToast("✏️ Saving changes...", "loading");

    try {
      let newImageUrl = post.image || "";
      let newVideoUrl = post.video || "";

      // ✅ Upload new image if selected
      if (editImage) {
        newImageUrl = await uploadImage(editImage);
        newVideoUrl = ""; // clear video if new image
      }

      // ✅ Upload new video if selected
      if (editVideo) {
        newVideoUrl = await uploadVideo(editVideo);
        newImageUrl = ""; // clear image if new video
      }

      // ✅ If media was removed (preview is null and no new file)
      if (!editPreview && !editImage && !editVideo) {
        newImageUrl = "";
        newVideoUrl = "";
      }

      await Promise.all([
        updateDoc(doc(db, "posts", post.id), {
          content: editContent,
          image: newImageUrl,
          video: newVideoUrl,
          edited: true,
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      dispatch(
        updatePost({
          ...post,
          content: editContent,
          image: newImageUrl,
          video: newVideoUrl,
          edited: true,
        }),
      );

      removeToast(loadId);
      showToast("✅ Post updated!", "success");
      setIsEditing(false);
      setEditImage(null);
      setEditVideo(null);
      setEditPreview(null);
      setEditMediaType(null);
    } catch (err) {
      console.error(err);
      removeToast(loadId);
      showToast("❌ Failed to update", "error");
    }
    setEditLoading(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    const loadId = showToast("🗑️ Deleting post...", "loading");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await deleteDoc(doc(db, "posts", post.id));
      removeToast(loadId);
      showToast("✅ Post deleted!", "success", 2000);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      dispatch(deletePost(post.id));
    } catch {
      removeToast(loadId);
      showToast("❌ Failed to delete", "error");
    }
    setDeleteLoading(false);
  }

  return (
    <>
      <Toast toasts={toasts} />
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
        <PostHeader
          post={post}
          isOwnPost={isOwnPost}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          deleteLoading={deleteLoading}
        />

        {/* ✅ Pass all edit media props */}
        <PostContent
          post={post}
          isEditing={isEditing}
          editContent={editContent}
          setEditContent={setEditContent}
          editImage={editImage}
          setEditImage={setEditImage}
          editVideo={editVideo}
          setEditVideo={setEditVideo}
          editPreview={editPreview}
          setEditPreview={setEditPreview}
          editMediaType={editMediaType}
          setEditMediaType={setEditMediaType}
          onSave={handleEdit}
          onCancel={handleCancelEdit}
          editLoading={editLoading}
        />

        <PostActions
          post={post}
          currentUserId={currentUser?.uid}
          onLike={handleLike}
          onToggleComments={() => setShowComments(!showComments)}
        />

        {showComments && (
          <PostComments
            post={post}
            userProfile={userProfile}
            commentText={commentText}
            setCommentText={setCommentText}
            onAddComment={handleAddComment}
          />
        )}
      </div>
    </>
  );
}

export default Post;
