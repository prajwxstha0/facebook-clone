import { formatDistanceToNow } from 'date-fns';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase/config';

const NOTIFICATION_TYPES = {
  like: { icon: '👍', background: 'bg-red-100' },
  comment: { icon: '💬', background: 'bg-blue-100' },
  friendRequest: { icon: '👥', background: 'bg-green-100' },
  friendAccepted: { icon: '🤝', background: 'bg-purple-100' },
  general: { icon: '🔔', background: 'bg-slate-100' }
};

const NOTIFICATION_MESSAGES = {
  like: name => `${name} liked your post`,
  comment: name => `${name} commented on your post`,
  friendRequest: name => `${name} sent you a friend request`,
  friendAccepted: name => `${name} accepted your friend request`,
  general: () => 'You have a new notification'
};

function getNotificationType(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.general;
}

function getNotificationMessage(notification) {
  const createMessage = NOTIFICATION_MESSAGES[notification.type] || NOTIFICATION_MESSAGES.general;
  return createMessage(notification.fromUserName);
}

function getNotificationDestination(type) {
  if (type === 'like' || type === 'comment') return '/';
  if (type === 'friendRequest' || type === 'friendAccepted') return '/friends';
  return null;
}

function NotificationCard({ notification, onOpen, onDelete, deleting }) {
  const typeStyle = getNotificationType(notification.type);
  const isUnread = !notification.read;

  return (
    <div
      onClick={onOpen}
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md ${isUnread ? 'border-l-4 border-l-blue-500' : ''}`}
    >
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xl ${typeStyle.background}`}>
        {typeStyle.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${isUnread ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
          {getNotificationMessage(notification)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {isUnread && <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
      <button
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete notification"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {deleting ? '…' : '×'}
      </button>
    </div>
  );
}

function Notifications() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(s => s.auth) || {};

  // ✅ Use local state instead of Redux
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;
  const visibleNotifications = notifications.filter(n =>
    filter === 'all' || (filter === 'unread' && !n.read)
  );
  const hasVisibleNotifications = visibleNotifications.length > 0;

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(d => {
          const docData = d.data();
          return {
            id: d.id,
            toUserId: docData.toUserId || '',
            fromUserId: docData.fromUserId || '',
            fromUserName: docData.fromUserName || 'Someone',
            type: docData.type || 'general',
            read: docData.read || false,
            postId: docData.postId || '',
            createdAt: docData.createdAt?.toDate
              ? docData.createdAt.toDate().toISOString()
              : new Date().toISOString()
          };
        });

        // ✅ Sort newest first
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error('Unable to load notifications:', error);
        setError('We could not load your notifications. Please refresh and try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Update every unread notification in one batch operation.
  async function handleMarkAllRead() {
    setError('');
    setActionLoading('all');
    try {
      const batch = writeBatch(db);
      notifications
        .filter(n => !n.read)
        .forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
      await batch.commit();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error(err);
      setError('Could not mark all notifications as read. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  // Mark one notification as read and open its related content.
  async function handleMarkRead(notification) {
    try {
      if (!notification.read) {
        await updateDoc(
          doc(db, 'notifications', notification.id),
          { read: true }
        );
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }

      const destination = getNotificationDestination(notification.type);
      if (destination) navigate(destination);
    } catch (err) {
      console.error(err);
      setError('Could not open this notification. Please try again.');
    }
  }

  async function handleDelete(notification, event) {
    event.stopPropagation();
    setActionLoading(notification.id);
    try {
      await deleteDoc(doc(db, 'notifications', notification.id));
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Unable to delete notification:', err);
      setError('Could not delete the notification. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">

        <header className="mb-7">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Stay connected</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Notifications</h1>
              <p className="mt-2 text-sm text-slate-500">Keep up with the activity around you.</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={actionLoading === 'all'} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                Mark all as read
              </button>
            )}
          </div>
        </header>

        <div className="mb-4 flex gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          {['all', 'unread'].map(option => (
            <button key={option} onClick={() => setFilter(option)} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition ${filter === option ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              {option} {option === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10 gap-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-500 text-sm">Loading notifications...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-500 font-semibold">
              No notifications yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              When someone likes or comments on your post, you'll see it here.
            </p>
          </div>
        )}

        {/* Notification List */}
        {!loading && notifications.length > 0 && !hasVisibleNotifications && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-slate-800">You are all caught up</p>
            <p className="mt-1 text-sm text-slate-500">There are no unread notifications.</p>
          </div>
        )}

        {!loading && hasVisibleNotifications && (
          <div className="space-y-3">
            {visibleNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onOpen={() => handleMarkRead(notification)}
                onDelete={event => handleDelete(notification, event)}
                deleting={actionLoading === notification.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;