import { formatDistanceToNow } from "date-fns";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Post from "../components/Post";
import { db } from "../firebase/config";
import { updateProfile } from "../store/slices/authSlice";
import {
  clearProfile,
  setUserPosts,
  setViewedProfile,
} from "../store/slices/profileSlice";
import { uploadImage } from "../utils/uploadImage";

function Profile() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((s) => s.auth);
  const { viewedProfile, userPosts } = useSelector((s) => s.profile);

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isOwnProfile = currentUser?.uid === userId;
  const postsCount = userPosts?.length || 0;
  const totalLikes =
    userPosts?.reduce((total, post) => total + (post.likes?.length || 0), 0) ||
    0;
  const totalComments =
    userPosts?.reduce(
      (total, post) => total + (post.comments?.length || 0),
      0,
    ) || 0;

  // ✅ Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          // ✅ Safely convert createdAt timestamp
          const safeData = {
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || null,
          };
          dispatch(setViewedProfile(safeData));
          setBio(safeData.bio || "");
          setDisplayName(safeData.displayName || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }
    fetchProfile();
    return () => dispatch(clearProfile());
  }, [userId]);

  // ✅ Fetch posts
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()
          ? d.data().createdAt.toDate().toISOString()
          : null,
      }));
      dispatch(setUserPosts(data));
    });
    return () => unsubscribe();
  }, [userId]);

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setError("Please choose a cover image smaller than 8 MB.");
      e.target.value = "";
      return;
    }
    if (!isOwnProfile || !currentUser?.uid) return;

    setCoverUploading(true);
    setError("");
    try {
      const coverUrl = await uploadImage(file);
      await updateDoc(doc(db, "users", currentUser.uid), {
        coverPic: coverUrl,
      });
      dispatch(updateProfile({ coverPic: coverUrl }));
      dispatch(setViewedProfile({ ...viewedProfile, coverPic: coverUrl }));
    } catch (uploadError) {
      console.error(uploadError);
      setError("We could not upload your cover photo. Please try again.");
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  }

  async function handleProfilePicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await updateDoc(doc(db, "users", currentUser.uid), { profilePic: url });
      dispatch(updateProfile({ profilePic: url }));
      dispatch(setViewedProfile({ ...viewedProfile, profilePic: url }));
    } catch {
      alert("Upload failed.");
    }
    setUploading(false);
  }

  async function handleSaveProfile() {
    const cleanName = displayName.trim();
    const cleanBio = bio.trim();
    if (!cleanName) {
      setError("Your name cannot be empty.");
      return;
    }
    if (cleanName.length > 60 || cleanBio.length > 160) {
      setError(
        "Name must be 60 characters or fewer and bio must be 160 or fewer.",
      );
      return;
    }

    setError("");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        bio: cleanBio,
        displayName: cleanName,
      });
      dispatch(updateProfile({ bio: cleanBio, displayName: cleanName }));
      dispatch(
        setViewedProfile({
          ...viewedProfile,
          bio: cleanBio,
          displayName: cleanName,
        }),
      );
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("We could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Show loading while profile is fetching
  if (!viewedProfile)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* Profile Card */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative h-40 bg-linear-to-r from-blue-500 via-indigo-500 to-violet-600 sm:h-52">
            {viewedProfile?.coverPic && (
              <img
                src={viewedProfile.coverPic}
                alt={`${viewedProfile.displayName || "User"} cover`}
                className="h-full w-full object-cover"
              />
            )}
            {isOwnProfile && (
              <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-slate-900">
                {coverUploading ? "Uploading..." : "Change cover"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={coverUploading}
                  className="hidden"
                />
              </label>
            )}
            {coverUploading && (
              <div className="absolute inset-0 bg-slate-900/20" />
            )}
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="flex items-end justify-between -mt-12 mb-4">
              {/* Profile Pic */}
              <div className="relative">
                {viewedProfile?.profilePic ? (
                  <img
                    src={viewedProfile.profilePic}
                    alt="Profile"
                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-linear-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-lg sm:h-32 sm:w-32 sm:text-4xl">
                    {viewedProfile?.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-gray-200 hover:bg-gray-300 rounded-full p-1 cursor-pointer text-sm">
                    📷
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Edit Button */}
              {isOwnProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {uploading && (
              <p className="mb-2 text-sm font-semibold text-blue-600">
                Uploading profile photo...
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            {/* View Mode */}
            {!isEditing ? (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {viewedProfile?.displayName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {viewedProfile?.bio || "This user has not added a bio yet."}
                </p>
                {/* ✅ Safe createdAt check */}
                <p className="text-gray-400 text-xs mt-2">
                  📅 Joined{" "}
                  {viewedProfile?.createdAt
                    ? formatDistanceToNow(new Date(viewedProfile.createdAt), {
                        addSuffix: true,
                      })
                    : "recently"}
                </p>
              </>
            ) : (
              /* Edit Mode */
              <div className="mt-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength="60"
                  className="mb-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  rows="3"
                  maxLength="160"
                  className="mb-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <div className="mb-2 text-right text-xs text-slate-400">
                  {bio.length}/160
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70 py-4 text-center">
              <div>
                <p className="text-lg font-extrabold text-slate-800">
                  {postsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500">Posts</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800">
                  {totalLikes}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Likes received
                </p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800">
                  {totalComments}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Comments received
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold text-slate-800">Posts</h2>
            <span className="rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-600">
              {postsCount}
            </span>
          </div>
          {userPosts?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="font-bold text-slate-800">No posts yet</p>
              <p className="mt-1 text-sm text-slate-500">
                {isOwnProfile
                  ? "Share your first post from the home feed."
                  : "There are no public posts to show."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {userPosts?.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
