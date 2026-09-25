import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CreatePost from "../components/CreatePost";
import Navbar from "../components/Navbar";
import Post from "../components/Post";
import { db } from "../firebase/config";
import { setNotifications } from "../store/slices/notificationSlice";
import { setPosts } from "../store/slices/postSlice";

function Home() {
  const dispatch = useDispatch();
  const { posts } = useSelector((s) => s.posts);
  const { currentUser } = useSelector((s) => s.auth);
  const [isPosting, setIsPosting] = useState(false);

  // ✅ Fetch posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isPosting) {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()
            ? d.data().createdAt.toDate().toISOString()
            : null,
        }));
        dispatch(setPosts(data));
      }
    });
    return () => unsubscribe();
  }, [isPosting]);

  // ✅ Fetch notifications in real-time (for bell badge)
  // ✅ In Home.jsx — remove orderBy from notifications query
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", currentUser.uid),
      // ✅ No orderBy — avoids index requirement
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()
            ? d.data().createdAt.toDate().toISOString()
            : new Date().toISOString(),
        }));

        // ✅ Sort manually
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        dispatch(setNotifications(sorted));
      },
      (error) => {
        console.error("Unable to load notifications:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Navbar />

      <main className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-8 sm:pt-10">
        <header className="mb-7 px-1">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Your community
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Feed
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Catch up with the latest updates from your friends and people you
            follow.
          </p>
        </header>

        <CreatePost setIsPosting={setIsPosting} />

        <div className="mb-4 mt-8 flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-800">Latest posts</h2>
          <span className="rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-600">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {posts.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl">
              ✦
            </div>
            <h3 className="font-bold text-slate-800">Your feed is ready</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Share a thought, photo, or video to start a conversation with your
              community.
            </p>
          </section>
        ) : (
          <section className="space-y-5" aria-label="Posts feed">
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Home;
