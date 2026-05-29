import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Sidebar Shell
import Sidebar from './components/Sidebar';
import FloatingAIAssistant from './components/FloatingAIAssistant';

// Import Page Modules
import LandingPage from './pages/LandingPage';
import { Login, Signup } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import TaskBoardPage from './pages/TaskBoardPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FocusModePage from './pages/FocusModePage';
import WellnessHubPage from './pages/WellnessHubPage';
import TeamCollaborationPage from './pages/TeamCollaborationPage';
import AchievementsPage from './pages/AchievementsPage';
import SettingsPage from './pages/SettingsPage';

// Routes where the sidebar should be visible (workspace only)
const WORKSPACE_ROUTES = [
  '/dashboard',
  '/tasks',
  '/calendar',
  '/analytics',
  '/focus',
  '/wellness',
  '/teams',
  '/achievements',
  '/settings',
];

// Private Route Guard
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-zenvora-bg flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zenvora-600 to-zenvora-400 animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Syncing Zenvora...</span>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Show sidebar only when logged in AND on a workspace route
  const showSidebar = user && WORKSPACE_ROUTES.some(r => pathname.startsWith(r));

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-zenvora-bg font-sans">
      {/* Sidebar — workspace only, never on landing/login/signup */}
      {showSidebar && <Sidebar />}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Routes>
          {/* Public — landing page (no sidebar, no redirect even if logged in) */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth pages — redirect to dashboard if already logged in */}
          <Route path="/login"  element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

          {/* Secure Workspace Views */}
          <Route path="/dashboard"    element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/tasks"        element={<PrivateRoute><TaskBoardPage /></PrivateRoute>} />
          <Route path="/calendar"     element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/analytics"    element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          <Route path="/focus"        element={<PrivateRoute><FocusModePage /></PrivateRoute>} />
          <Route path="/wellness"     element={<PrivateRoute><WellnessHubPage /></PrivateRoute>} />
          <Route path="/teams"        element={<PrivateRoute><TeamCollaborationPage /></PrivateRoute>} />
          <Route path="/achievements" element={<PrivateRoute><AchievementsPage /></PrivateRoute>} />
          <Route path="/settings"     element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Floating AI Companion — only visible inside secure workspace */}
      {showSidebar && <FloatingAIAssistant />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
