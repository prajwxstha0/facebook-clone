import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { db } from '../firebase/config';
import {
  setAllUsers,
  setFriendRequests,
  setFriends,
  setSentRequests
} from '../store/slices/friendSlice';

function Friends() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, userProfile } = useSelector(s => s.auth);
  const { allUsers, friendRequests, sentRequests, friends } = useSelector(s => s.friends);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('suggestions'); // suggestions | requests | friends
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  // ✅ Use useRef for generating unique IDs
const toastIdRef = useRef(0);

  // ✅ Toast helpers
  function showToast(message, type = 'success', duration = 3000) {
  toastIdRef.current += 1;        // ✅ increment ref instead of Date.now()
  const id = toastIdRef.current;
  setToasts(prev => [...prev, { id, message, type }]);
  if (type !== 'loading') {
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }
  return id;
}

function removeToast(id) {
  setToasts(prev => prev.filter(t => t.id !== id));
}

  // ✅ Fetch all users
  useEffect(() => {
    async function fetchUsers() {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.uid !== currentUser.uid);
      dispatch(setAllUsers(users));
      setLoading(false);
    }
    fetchUsers();
  }, []);

useEffect(() => {
  // ✅ Requests YOU received (pending)
  const receivedQ = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const unsubReceived = onSnapshot(receivedQ, (snapshot) => {
    const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    dispatch(setFriendRequests(requests));
  });

  // ✅ Requests YOU sent (pending)
  const sentQ = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const unsubSent = onSnapshot(sentQ, (snapshot) => {
    const sent = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    dispatch(setSentRequests(sent));
  });

  // ✅ Friends where YOU sent the request
  const friendsQ1 = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', currentUser.uid),
    where('status', '==', 'accepted')
  );

  // ✅ Friends where YOU received the request
  const friendsQ2 = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', currentUser.uid),
    where('status', '==', 'accepted')
  );

  let friendsSent = [];
  let friendsReceived = [];

  const unsubFriends1 = onSnapshot(friendsQ1, (snapshot) => {
    friendsSent = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // ✅ Combine both lists
    const allFriends = [...friendsSent, ...friendsReceived];
    dispatch(setFriends(allFriends));
  });

  const unsubFriends2 = onSnapshot(friendsQ2, (snapshot) => {
    friendsReceived = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // ✅ Combine both lists
    const allFriends = [...friendsSent, ...friendsReceived];
    dispatch(setFriends(allFriends));
  });

  return () => {
    unsubReceived();
    unsubSent();
    unsubFriends1();
    unsubFriends2();
  };
}, []);

  // ✅ Send friend request
  async function handleSendRequest(toUser) {
    const loadId = showToast('Sending request...', 'loading');
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: userProfile.displayName,
        fromUserPic: userProfile.profilePic || '',
        toUserId: toUser.uid,
        toUserName: toUser.displayName,
        toUserPic: toUser.profilePic || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        toUserId: toUser.uid,
        fromUserId: currentUser.uid,
        fromUserName: userProfile.displayName,
        type: 'friendRequest',
        read: false,
        createdAt: serverTimestamp()
      });

      removeToast(loadId);
      showToast('✅ Friend request sent!', 'success');
    } catch (err) {
      removeToast(loadId);
      showToast('❌ Failed to send request', 'error');
    }
  }

  // ✅ Cancel sent request
  async function handleCancelRequest(requestId) {
    const loadId = showToast('Cancelling...', 'loading');
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'cancelled'
      });
      removeToast(loadId);
      showToast('✅ Request cancelled', 'success');
    } catch {
      removeToast(loadId);
      showToast('❌ Failed to cancel', 'error');
    }
  }

  // ✅ Accept friend request
  async function handleAccept(request) {
    const loadId = showToast('Accepting...', 'loading');
    try {
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      // Send notification to requester
      await addDoc(collection(db, 'notifications'), {
        toUserId: request.fromUserId,
        fromUserId: currentUser.uid,
        fromUserName: userProfile.displayName,
        type: 'friendAccepted',
        read: false,
        createdAt: serverTimestamp()
      });

      removeToast(loadId);
      showToast('✅ Friend request accepted!', 'success');
    } catch {
      removeToast(loadId);
      showToast('❌ Failed to accept', 'error');
    }
  }

  // ✅ Decline friend request
  async function handleDecline(requestId) {
    const loadId = showToast('Declining...', 'loading');
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined'
      });
      removeToast(loadId);
      showToast('✅ Request declined', 'success');
    } catch {
      removeToast(loadId);
      showToast('❌ Failed to decline', 'error');
    }
  }

  // ✅ Unfriend
  async function handleUnfriend(requestId) {
    const loadId = showToast('Unfriending...', 'loading');
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'unfriended'
      });
      removeToast(loadId);
      showToast('✅ Unfriended', 'success');
    } catch {
      removeToast(loadId);
      showToast('❌ Failed to unfriend', 'error');
    }
  }

  // ✅ Helper checks
  function isFriend(uid) {
    return friends.some(f =>
      (f.fromUserId === currentUser.uid && f.toUserId === uid) ||
      (f.toUserId === currentUser.uid && f.fromUserId === uid)
    );
  }

  function hasSentRequest(uid) {
    return sentRequests.some(r => r.toUserId === uid);
  }

  function getSentRequestId(uid) {
    return sentRequests.find(r => r.toUserId === uid)?.id;
  }

  function getFriendRequestId(uid) {
    return friends.find(f =>
      (f.fromUserId === currentUser.uid && f.toUserId === uid) ||
      (f.toUserId === currentUser.uid && f.fromUserId === uid)
    )?.id;
  }

  // ✅ Filter users based on search
  const filteredUsers = allUsers.filter(u =>
    `${u.displayName || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase().trim())
  );

  // ✅ Suggestions = users who are NOT friends and no pending request
  const suggestions = filteredUsers.filter(u =>
    !isFriend(u.uid) && !hasSentRequest(u.uid)
  );
  const visibleRequests = friendRequests.filter(r =>
    `${r.fromUserName || ''}`.toLowerCase().includes(search.toLowerCase().trim())
  );
  const visibleFriends = friends.filter(friend => {
    const name = friend.fromUserId === currentUser.uid ? friend.toUserName : friend.fromUserName;
    return `${name || ''}`.toLowerCase().includes(search.toLowerCase().trim());
  });

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Navbar />
      <Toast toasts={toasts} />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="mb-7">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Your network</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Friends</h1>
          <p className="mt-2 text-sm text-slate-500">Find people, manage requests, and grow your circle.</p>
        </header>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search friends"
            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Tabs */}
        <div className="mt-4 flex overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          {['suggestions', 'requests', 'sent', 'friends'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-w-0 flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === t
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t === 'requests'
                ? `Requests ${friendRequests.length > 0 ? `(${friendRequests.length})` : ''}`
                : t === 'sent'
                ? `Sent ${sentRequests.length > 0 ? `(${sentRequests.length})` : ''}`
                : t === 'friends'
                ? `Friends ${friends.length > 0 ? `(${friends.length})` : ''}`
                : 'Suggestions'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center text-sm text-slate-500 shadow-sm">Loading your network...</div>
        ) : (
          <>
            {/* ===== SUGGESTIONS TAB ===== */}
            {tab === 'suggestions' && (
              <>
                <h2 className="font-bold text-gray-700 mb-3">
                  People You May Know
                </h2>
                {suggestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <h3 className="font-bold text-slate-800">No people found</h3>
                    <p className="mt-1 text-sm text-slate-500">Try another name or email address.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map(user => (
                      <UserCard
                        key={user.uid}
                        user={user}
                        onViewProfile={() => navigate(`/profile/${user.uid}`)}
                        actionButton={
                          hasSentRequest(user.uid) ? (
                            <button
                              onClick={() => handleCancelRequest(getSentRequestId(user.uid))}
                              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 rounded-lg text-sm font-semibold mt-2"
                            >
                              Cancel Request
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(user)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-lg text-sm font-semibold mt-2"
                            >
                              + Add Friend
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ===== REQUESTS TAB ===== */}
            {tab === 'requests' && (
              <>
                <h2 className="font-bold text-gray-700 mb-3">
                  Friend Requests
                </h2>
                {visibleRequests.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                    No pending requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleRequests.map(request => (
                      <div key={request.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                        {/* Avatar */}
                        {request.fromUserPic ? (
                          <img
                            src={request.fromUserPic}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover cursor-pointer"
                            onClick={() => navigate(`/profile/${request.fromUserId}`)}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold cursor-pointer"
                            onClick={() => navigate(`/profile/${request.fromUserId}`)}
                          >
                            {request.fromUserName?.[0]?.toUpperCase()}
                          </div>
                        )}

                        {/* Name */}
                        <div className="flex-1">
                          <p
                            className="font-semibold text-sm cursor-pointer hover:underline"
                            onClick={() => navigate(`/profile/${request.fromUserId}`)}
                          >
                            {request.fromUserName}
                          </p>
                          <p className="text-xs text-gray-400">
                            Sent you a friend request
                          </p>
                        </div>

                        {/* Accept / Decline */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleAccept(request)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ===== SENT REQUESTS TAB ===== */}
            {tab === 'sent' && (
              <>
                <h2 className="mb-3 font-bold text-gray-700">Sent Requests</h2>
                {sentRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                    No pending requests have been sent.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map(request => (
                      <div key={request.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        {request.toUserPic ? (
                          <img src={request.toUserPic} alt={request.toUserName} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">
                            {request.toUserName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{request.toUserName}</p>
                          <p className="text-xs text-amber-600">Awaiting response</p>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ===== FRIENDS TAB ===== */}
            {tab === 'friends' && (
  <>
    <h2 className="font-bold text-gray-700 mb-3">
      Your Friends ({friends.length})
    </h2>
    {visibleFriends.length === 0 ? (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
        No friends yet. Send some requests!
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFriends.map(friend => {
          // ✅ Figure out which side is the friend
          const isISender = friend.fromUserId === currentUser.uid;
          const friendUid = isISender ? friend.toUserId : friend.fromUserId;
          const friendName = isISender ? friend.toUserName : friend.fromUserName;
          const friendPic = isISender
            ? friend.toUserPic || ''
            : friend.fromUserPic || '';

          return (
            <UserCard
              key={friend.id}
              user={{
                uid: friendUid,
                displayName: friendName,
                profilePic: friendPic
              }}
              onViewProfile={() => navigate(`/profile/${friendUid}`)}
              actionButton={
                <button
                  onClick={() => handleUnfriend(friend.id)}
                  className="w-full bg-gray-200 hover:bg-red-100 hover:text-red-500 text-gray-700 py-1 rounded-lg text-sm font-semibold mt-2"
                >
                  ✓ Friends
                </button>
              }
            />
          );
        })}
      </div>
    )}
  </>
)}
          </>
        )}
      </main>
    </div>
  );
}

// ✅ Reusable User Card
function UserCard({ user, onViewProfile, actionButton }) {
  return (
    <div className="group flex h-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg">
      <div className="cursor-pointer" onClick={onViewProfile}>
        {user.profilePic ? (
          <img
            src={user.profilePic}
            alt={user.displayName}
            className="mb-3 h-16 w-16 rounded-full object-cover ring-4 ring-slate-50 transition group-hover:ring-blue-50"
          />
        ) : (
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-sm">
            {user.displayName?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <p
        className="mb-1 mt-0 max-w-full cursor-pointer truncate px-2 text-sm font-bold text-slate-800 hover:text-blue-600"
        onClick={onViewProfile}
      >
        {user.displayName}
      </p>
      {actionButton}
    </div>
  );
}

export default Friends;