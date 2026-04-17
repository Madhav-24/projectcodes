import { NavLink } from "react-router-dom";
import { FaChartLine, FaVideo, FaBell, FaFileAlt, FaRegComments, FaMapMarkerAlt, FaCogs, FaUsers, FaLock } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { collection, getFirestore, onSnapshot, orderBy, query } from 'firebase/firestore';
import app from '../../firebase/firebaseConfig.js';

const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/admin/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/admin/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/admin/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/admin/messages", icon: <FaRegComments /> },
  { label: "Site Allocation", to: "/admin/site-allocation", icon: <FaMapMarkerAlt /> },
  { label: "Authentication", to: "/admin/authentication", icon: <FaLock /> },
  { label: "Settings", to: "/admin/settings", icon: <FaCogs /> },
];

const supervisorLinks = [
  { label: "Dashboard", to: "/supervisor/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/supervisor/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/supervisor/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/supervisor/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/supervisor/messages", icon: <FaRegComments /> },
];

const engineerLinks = [
  { label: "Dashboard", to: "/engineer/dashboard", icon: <FaChartLine /> },
  { label: "Alerts", to: "/engineer/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/engineer/reports", icon: <FaFileAlt /> },
  { label: "Camera", to: "/engineer/camera", icon: <FaVideo /> },
  { label: "Messages", to: "/engineer/messages", icon: <FaRegComments /> },
];

const projectManagerLinks = [
  { label: "Dashboard", to: "/project-manager/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/project-manager/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/project-manager/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/project-manager/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/project-manager/messages", icon: <FaRegComments /> },
];

function Sidebar() {
  const { profile, logout } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});
  const links = 
    profile?.role === "admin" 
      ? adminLinks 
      : profile?.role === "supervisor" 
      ? supervisorLinks 
      : profile?.role === "engineer"
      ? engineerLinks
      : profile?.role === "project_manager"
      ? projectManagerLinks
      : engineerLinks;

  const db = getFirestore(app);

  useEffect(() => {
    if (!profile?.uid) return;

    // Load last read timestamps from localStorage
    const stored = localStorage.getItem(`messages_read_${profile.uid}`);
    if (stored) {
      setLastReadTimestamps(JSON.parse(stored));
    }

    // Listen to messages
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, [profile?.uid]);

  // Check if there are any unread messages
  const hasUnreadMessages = messages.some((message) => {
    if (message.receiverId !== profile?.uid) return false;
    const lastRead = lastReadTimestamps[message.senderId];
    if (!lastRead) return true;
    return message.timestamp?.toDate?.() > new Date(lastRead);
  });

  return (
    <aside className="fixed left-0 top-0 min-h-screen w-72 border-r border-slate-700 bg-slate-900 px-5 py-6 hidden lg:flex flex-col z-50">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Construction AI</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Project Monitor</h1>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
              isActive ? "bg-blue-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="text-lg relative">
              {link.icon}
              {link.label === "Messages" && hasUnreadMessages && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></div>
              )}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-4 pt-8">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-600/30 border border-purple-500 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{profile?.name || 'User'}</p>
              <p className="text-xs text-slate-400 capitalize">{profile?.role || 'guest'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 border border-slate-600"
        >
          <FaUsers className="text-lg" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
