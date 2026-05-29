import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoIconImg from '../assets/logo_icon.png';
import { 
  LayoutDashboard, 
  Kanban, 
  Calendar, 
  BarChart3, 
  Timer, 
  HeartPulse, 
  Users, 
  Trophy, 
  Settings, 
  LogOut,
  Zap,
  X,
  Menu
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar whenever route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const menuItems = [
    { name: 'Dashboard',   path: '/dashboard',    icon: LayoutDashboard },
    { name: 'Task Board',  path: '/tasks',         icon: Kanban },
    { name: 'Calendar',    path: '/calendar',      icon: Calendar },
    { name: 'Analytics',   path: '/analytics',     icon: BarChart3 },
    { name: 'Focus Mode',  path: '/focus',         icon: Timer },
    { name: 'Wellness Hub',path: '/wellness',      icon: HeartPulse },
    { name: 'Team Space',  path: '/teams',         icon: Users },
    { name: 'Achievements',path: '/achievements',  icon: Trophy },
    { name: 'Settings',    path: '/settings',      icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  /* ── Sidebar inner content (shared between desktop & mobile drawer) ── */
  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 mb-8">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img
              src={logoIconImg}
              alt="ZENVORA Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.25)]"
            />
          </div>
          <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zenvora-700 to-zenvora-500 bg-clip-text text-transparent">
            ZENVORA
          </h1>
        </div>

        {/* Close button — mobile only */}
        <button
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-zenvora-600 hover:bg-white/60 transition-all"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Stats Mini Widget */}
      <div className="mb-6 p-4 rounded-2xl bg-white/40 border border-purple-100/50 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center font-bold text-zenvora-700 border border-white shrink-0">
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-slate-800">{user.username}</h4>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-0.5">
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Streak: {user.streak} days</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>Level {user.level}</span>
            <span>{user.xp % 100}/100 XP</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-zenvora-500 to-zenvora-300 transition-all duration-500"
              style={{ width: `${user.xp % 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[14px] transition-all duration-300
              ${isActive
                ? 'bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white shadow-md shadow-purple-200/50'
                : 'text-slate-600 hover:text-zenvora-600 hover:bg-white/50'
              }
            `}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="mt-6 flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[14px] text-rose-500 hover:bg-rose-50/50 transition-all duration-300 text-left w-full"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span>Logout</span>
      </button>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-72 h-[calc(100vh-2rem)] my-4 ml-4 rounded-3xl glass-panel flex-col p-6 z-20 shrink-0 sticky top-4">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{
          background: 'rgba(248, 246, 255, 0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(167, 139, 250, 0.25)',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.06)',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-zenvora-600 hover:bg-purple-50 transition-all active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo centred */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2"
        >
          <img src={logoIconImg} alt="ZENVORA" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-zenvora-700 to-zenvora-500 bg-clip-text text-transparent">
            ZENVORA
          </span>
        </button>

        {/* User avatar (right side) */}
        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center font-bold text-xs text-zenvora-700 border border-white shadow-sm">
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
        </div>
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer (slides in from left) ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full z-50 flex flex-col p-6 transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 'min(80vw, 300px)',
          background: 'linear-gradient(135deg, rgba(248, 246, 255, 0.98) 0%, rgba(235, 228, 255, 0.98) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRight: '1px solid rgba(167, 139, 250, 0.35)',
          boxShadow: '8px 0 40px rgba(124, 58, 237, 0.15)',
        }}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
