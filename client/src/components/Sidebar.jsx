import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoIconImg from '../assets/logo_icon.png';
import { 
  LayoutDashboard, 
  Kanban, 
  Calendar, 
  BarChart3, 
  Timer, 
  MessageSquare, 
  HeartPulse, 
  Users, 
  Trophy, 
  Settings, 
  LogOut,
  Sparkles,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Task Board', path: '/tasks', icon: Kanban },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Focus Mode', path: '/focus', icon: Timer },
    { name: 'Wellness Hub', path: '/wellness', icon: HeartPulse },
    { name: 'Team Space', path: '/teams', icon: Users },
    { name: 'Achievements', path: '/achievements', icon: Trophy },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <aside className="w-72 h-[calc(100vh-2rem)] my-4 ml-4 rounded-3xl glass-panel flex flex-col p-6 z-20 shrink-0 sticky top-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img src={logoIconImg} alt="ZENVORA Logo" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.25)]" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zenvora-700 to-zenvora-500 bg-clip-text text-transparent">
            ZENVORA
          </h1>
        </div>
      </div>

      {/* User Stats Mini Widget */}
      <div className="mb-6 p-4 rounded-2xl bg-white/40 border border-purple-100/50 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center font-bold text-zenvora-700 border border-white">
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-slate-800">{user.username}</h4>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-0.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
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
        className="mt-6 flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[14px] text-rose-500 hover:bg-rose-50/50 transition-all duration-300 text-left"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
