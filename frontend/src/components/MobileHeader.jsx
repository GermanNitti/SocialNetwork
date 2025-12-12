import { Link } from "react-router-dom";
import MacanudosLogo from "./MacanudosLogo";
import NotificationBell from "./NotificationBell";
import FriendRequests from "./FriendRequests";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

export default function MobileHeader() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-3 py-2 md:hidden backdrop-blur">
      <Link to="/feed" className="flex items-center gap-2">
        <MacanudosLogo showText size={80} />
      </Link>
      <div className="flex items-center gap-2">
        <FriendRequests iconOnly />
        <NotificationBell iconOnly />
        <Link to={`/profile/${user.username}`}>
          <Avatar user={user} size={32} />
        </Link>
      </div>
    </header>
  );
}
