import {
  faBell,
  faHome,
  faUserFriends,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentUser, userProfile } = useSelector((s) => s.auth) || {};
  const unreadCount = useSelector((s) => s.notifications?.unreadCount ?? 0);

  async function handleLogout() {
    await logout();
    navigate("/signup");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <h1
          onClick={() => navigate("/")}
          className="cursor-pointer text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
        >
          <span className="text-blue-600">New</span>Book
        </h1>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Home */}
          <button
            onClick={() => navigate("/")}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Home"
          >
            <span className="hidden sm:inline">Home</span>
            <span className="sm:hidden">
              <FontAwesomeIcon icon={faHome} />
            </span>
          </button>

          {/* Friends */}
          <button
            onClick={() => navigate("/friends")}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="hidden sm:inline">Friends</span>
            <span className="sm:hidden">
              <FontAwesomeIcon icon={faUserFriends} />
            </span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">
              <FontAwesomeIcon icon={faBell} />
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar */}
          <div
            onClick={() => navigate(`/profile/${currentUser?.uid}`)}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
          >
            {userProfile?.profilePic ? (
              <img
                src={userProfile.profilePic}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {userProfile?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold hidden md:block">
              {userProfile?.displayName}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
