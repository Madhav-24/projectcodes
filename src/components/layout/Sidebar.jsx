import { NavLink } from "react-router-dom";
import { FaChartLine, FaVideo, FaBell, FaFileAlt, FaRegComments, FaCogs, FaUsers, FaLock } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useAlertContext } from "../../context/AlertContext.jsx";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from '../../api/client.js';

const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/admin/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/admin/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/admin/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/admin/messages", icon: <FaRegComments /> },
  { label: "Authentication", to: "/admin/authentication", icon: <FaLock /> },
  { label: "Settings", to: "/admin/settings", icon: <FaCogs /> },
];

const supervisorLinks = [
  { label: "Dashboard", to: "/supervisor/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/supervisor/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/supervisor/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/supervisor/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/supervisor/messages", icon: <FaRegComments /> },
  { label: "Settings", to: "/supervisor/settings", icon: <FaCogs /> },
];

const engineerLinks = [
  { label: "Dashboard", to: "/engineer/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/engineer/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/engineer/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/engineer/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/engineer/messages", icon: <FaRegComments /> },
  { label: "Settings", to: "/engineer/settings", icon: <FaCogs /> },
];

const projectManagerLinks = [
  { label: "Dashboard", to: "/project-manager/dashboard", icon: <FaChartLine /> },
  { label: "Camera", to: "/project-manager/camera", icon: <FaVideo /> },
  { label: "Alerts", to: "/project-manager/alerts", icon: <FaBell /> },
  { label: "Reports", to: "/project-manager/reports", icon: <FaFileAlt /> },
  { label: "Messages", to: "/project-manager/messages", icon: <FaRegComments /> },
  { label: "Settings", to: "/project-manager/settings", icon: <FaCogs /> },
];

function Sidebar() {
  const { profile, logout } = useAuthContext();
  const { hasNewAlert, markAlertsViewed } = useAlertContext();
  const location = useLocation();
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

  const db = null; // db removed — using REST API

  useEffect(() => {
    if (!profile?.uid && !profile?.id) return;
    const userId = profile.uid || profile.id;

    // Load last read timestamps from localStorage
    const stored = localStorage.getItem(`messages_read_${userId}`);
    if (stored) {
      setLastReadTimestamps(JSON.parse(stored));
    }

    // Poll messages every 30 seconds for unread badge
    let active = true;
    async function fetchMessages() {
      if (!active) return;
      try {
        const data = await api.get('/api/messages');
        if (active) setMessages(data);
      } catch (err) {
        // silently ignore — unread badge is non-critical
      }
      if (active) setTimeout(fetchMessages, 30000);
    }
    fetchMessages();
    return () => { active = false; };
  }, [profile?.uid, profile?.id]);

  // Check if there are any unread messages
  const hasUnreadMessages = messages.some((message) => {
    const userId = profile?.uid || profile?.id;
    if (message.receiverId !== userId) return false;
    const lastRead = lastReadTimestamps[message.senderId];
    if (!lastRead) return true;
    return new Date(message.createdAt || message.timestamp) > new Date(lastRead);
  });

  useEffect(() => {
    if (location.pathname.includes('/alerts')) {
      markAlertsViewed();
    }
  }, [location.pathname, markAlertsViewed]);

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
              {link.label === "Alerts" && hasNewAlert && (
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
