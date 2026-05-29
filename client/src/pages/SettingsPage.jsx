import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { 
  User, Bell, Zap, Lock, Grid, AlertTriangle, 
  Save, LogOut, Trash2, Info, ShieldCheck, Monitor
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  
  // Active settings tab category
  const [activeTab, setActiveTab] = useState('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Profile Settings
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(localStorage.getItem('zenvora_display_name') || 'greg');
  const [bio, setBio] = useState(localStorage.getItem('zenvora_bio') || 'Deep focus builder & productivity operator.');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'lavender_avatar_1');

  // Pre-made avatars catalog list
  const avatarsList = ['lavender_avatar_1', 'lavender_avatar_2', 'lavender_avatar_3', 'lavender_avatar_4'];

  // 2. Notification Preferences
  const [taskReminders, setTaskReminders] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [focusNotifs, setFocusNotifs] = useState(false);
  const [prodSummaries, setProdSummaries] = useState(true);
  const [achieveNotifs, setAchieveNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);

  // 4. Productivity Preferences
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [startMonday, setStartMonday] = useState(true);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [dailyTaskGoal, setDailyTaskGoal] = useState(8);
  const [preferredHours, setPreferredHours] = useState('9 AM - 5 PM');

  // 5. Security & Session Settings
  const [twoFA, setTwoFA] = useState(false);

  // 6. Workspace Layout preferences
  const [defaultDashboard, setDefaultDashboard] = useState('performance');
  const [boardLayout, setBoardLayout] = useState('kanban');
  const [sidebarCollapse, setSidebarCollapse] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  // 7. Danger Zone - Deletion confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Load persisted user preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zenvora_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTaskReminders(parsed.taskReminders ?? true);
        setDeadlineAlerts(parsed.deadlineAlerts ?? true);
        setFocusNotifs(parsed.focusNotifs ?? false);
        setProdSummaries(parsed.prodSummaries ?? true);
        setAchieveNotifs(parsed.achieveNotifs ?? true);
        setEmailNotifs(parsed.emailNotifs ?? false);
        setPomodoroDuration(parsed.pomodoroDuration ?? 25);
        setBreakDuration(parsed.breakDuration ?? 5);
        setStartMonday(parsed.startMonday ?? true);
        setAutoStartFocus(parsed.autoStartFocus ?? false);
        setDailyTaskGoal(parsed.dailyTaskGoal ?? 8);
        setPreferredHours(parsed.preferredHours ?? '9 AM - 5 PM');
        setTwoFA(parsed.twoFA ?? false);
        setDefaultDashboard(parsed.defaultDashboard ?? 'performance');
        setBoardLayout(parsed.boardLayout ?? 'kanban');
        setSidebarCollapse(parsed.sidebarCollapse ?? false);
        setSelectedLanguage(parsed.selectedLanguage ?? 'english');
      }
    } catch (e) {
      console.warn("Could not read local settings fallback.");
    }
  }, []);

  const handleSaveAllChanges = async (e) => {
    e?.preventDefault();
    setSaveSuccess(false);

    // 1. Sync Profile changes to MongoDB
    await updateProfile({
      username,
      avatar: selectedAvatar
    });

    // 2. Persist local profile fields
    localStorage.setItem('zenvora_display_name', displayName);
    localStorage.setItem('zenvora_bio', bio);

    // 3. Persist layout & workspace settings
    const settingsPayload = {
      taskReminders,
      deadlineAlerts,
      focusNotifs,
      prodSummaries,
      achieveNotifs,
      emailNotifs,
      pomodoroDuration,
      breakDuration,
      startMonday,
      autoStartFocus,
      dailyTaskGoal,
      preferredHours,
      twoFA,
      defaultDashboard,
      boardLayout,
      sidebarCollapse,
      selectedLanguage
    };
    localStorage.setItem('zenvora_settings_v2', JSON.stringify(settingsPayload));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError("Please write the word 'DELETE' to confirm unregistration.");
      return;
    }
    await deleteAccount();
  };

  const creationDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'May 28, 2026';

  const menuItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'productivity', label: 'Productivity Preferences', icon: Zap },
    { id: 'security', label: 'Security Controls', icon: Lock },
    { id: 'workspace', label: 'Workspace Layout', icon: Grid },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, isDanger: true }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto relative h-screen text-slate-800">
      <ZenvoraBackground mode="mesh" />

      <div className="max-w-5xl mx-auto space-y-8 z-10 relative pb-16">
        
        {/* Page Header */}
        <header className="text-left flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Workspace Settings</h1>
            <p className="text-slate-400 text-sm mt-1 font-semibold">
              Manage profile parameters, Pomodoro goals, workspace layout, and security preferences.
            </p>
          </div>
          
          <button
            onClick={handleSaveAllChanges}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </header>

        {/* Save success toast */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-scale-up">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Your Zenvora preferences and database profiles have been synchronized successfully!</span>
          </div>
        )}

        {/* ═══════════════════════ DUAL PANE LAYOUT ═══════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* LEFT SIDEBAR NAVIGATION TABS */}
          <div className="lg:col-span-1 lavender-glass-panel p-4 rounded-3xl border border-purple-100/50 shadow-xl bg-white/70 flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-3 mb-2 block">Settings Navigation</span>
            
            {menuItems.map((item) => {
              const TabIcon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 font-extrabold text-xs transition-all text-left ${
                    isActive
                      ? item.isDanger
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200/50'
                        : 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-lg shadow-purple-250'
                      : item.isDanger
                        ? 'hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-transparent'
                        : 'hover:bg-purple-50/50 text-slate-500 hover:text-purple-600 border border-transparent'
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT COLUMN ACTIVE PANEL CONTENT */}
          <div className="lg:col-span-3 lavender-glass-panel p-8 rounded-3xl border border-purple-100/50 shadow-xl bg-white/70 text-left min-h-[500px] flex flex-col justify-between">
            
            {/* ═══════════════════════ TAB 1: PROFILE ═══════════════════════ */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Profile Settings</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Customize your public workspace information and avatar.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center border-b border-purple-100/50 pb-6">
                  {/* Profile Preview Card */}
                  <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-violet-600 to-purple-500 p-1 shadow-lg shrink-0">
                    <div className="w-full h-full rounded-[20px] bg-white flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                      <div className="w-14 h-14 rounded-full bg-purple-100 border border-purple-200 text-purple-700 font-black text-lg flex items-center justify-center uppercase shadow-inner">
                        {displayName.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-slate-800 truncate max-w-[100px]">{displayName}</h4>
                        <span className="text-[8px] font-bold text-slate-400 truncate block">@{username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Avatar Picker list */}
                  <div className="space-y-3 w-full text-center md:text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Select Avatar Theme</label>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {avatarsList.map((av) => (
                        <button
                          key={av}
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs uppercase transition-all border ${
                            selectedAvatar === av
                              ? 'bg-purple-600 text-white border-purple-500 scale-105 shadow-md shadow-purple-200'
                              : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-100 hover:scale-103'
                          }`}
                        >
                          {av.replace('lavender_avatar_', '#')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 pl-1">Select an unlocked badge number to customize your workspace avatar node.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Workspace Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Display Name</label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Short Profile Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}



            {/* ═══════════════════════ TAB 3: NOTIFICATIONS ═══════════════════════ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Notification Preferences</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Control how and when you receive workspace telemetry updates.</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { id: 'reminders', label: 'Active Task Reminders', desc: 'Alert when a board objective has subtasks incomplete.', state: taskReminders, set: setTaskReminders },
                    { id: 'alerts', label: 'Deadline Alerts & Escalations', desc: 'Critical alert 24h prior to task deadline dates.', state: deadlineAlerts, set: setDeadlineAlerts },
                    { id: 'focus', label: 'Focus Session Completed Events', desc: 'Receive motivational triggers when Pomodoro blocks conclude.', state: focusNotifs, set: setFocusNotifs },
                    { id: 'summaries', label: 'Weekly Productivity Summaries', desc: 'Consolidated performance scoring reports sent weekly.', state: prodSummaries, set: setProdSummaries },
                    { id: 'achievements', label: 'Achievement Unlock Celebrations', desc: 'Play lockscreen celebrations and level XP popups.', state: achieveNotifs, set: setAchieveNotifs },
                    { id: 'email', label: 'Direct Email Alerts Sync', desc: 'Redirect critical notifications to your personal email.', state: emailNotifs, set: setEmailNotifs }
                  ].map((notif) => (
                    <div key={notif.id} className="p-4 rounded-2xl bg-white border border-purple-100/40 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800">{notif.label}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{notif.desc}</p>
                      </div>
                      
                      {/* Premium toggle switch */}
                      <button
                        type="button"
                        onClick={() => notif.set(!notif.state)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                          notif.state ? 'bg-purple-600' : 'bg-slate-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                          notif.state ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* ═══════════════════════ TAB 5: PRODUCTIVITY ═══════════════════════ */}
            {activeTab === 'productivity' && (
              <div className="space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Productivity Preferences</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Calibrate Pomodoro countdown timers and daily objective goals.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Default Pomodoro Block (minutes)</label>
                    <input
                      type="number"
                      value={pomodoroDuration}
                      onChange={(e) => setPomodoroDuration(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Rest Break Duration (minutes)</label>
                    <input
                      type="number"
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Daily Task Completion Goal</label>
                    <input
                      type="number"
                      value={dailyTaskGoal}
                      onChange={(e) => setDailyTaskGoal(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Preferred Focus Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 9 AM - 5 PM"
                      value={preferredHours}
                      onChange={(e) => setPreferredHours(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="flex items-center gap-2 pl-1 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="startMonday"
                      checked={startMonday}
                      onChange={() => setStartMonday(!startMonday)}
                      className="w-4 h-4 rounded text-purple-600 border-purple-200"
                    />
                    <label htmlFor="startMonday" className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
                      Start calendar week on Monday instead of Sunday
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pl-1 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="autoStart"
                      checked={autoStartFocus}
                      onChange={() => setAutoStartFocus(!autoStartFocus)}
                      className="w-4 h-4 rounded text-purple-600 border-purple-200"
                    />
                    <label htmlFor="autoStart" className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
                      Automatically activate deep focus countdown on task launch
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════ TAB 6: SECURITY ═══════════════════════ */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Security Controls</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Toggle authentication options and review active dashboard sessions.</p>
                </div>

                <div className="p-4.5 rounded-2xl border border-purple-100 bg-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">Two-Factor Authentication (2FA)</h4>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Require an authenticated numeric token upon account signin.</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setTwoFA(!twoFA)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                      twoFA ? 'bg-purple-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                      twoFA ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Active Workspace Sessions</label>
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-xl bg-white border border-purple-50 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-emerald-500" />
                        <span>Windows PC - Chrome Browser Node</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] uppercase font-extrabold tracking-wider">Active Now</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/40 border border-purple-50/50 flex items-center justify-between text-xs font-semibold text-slate-400 select-none">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        <span>Android Phone - Native Application Node</span>
                      </div>
                      <span>Logged out</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════ TAB 7: WORKSPACE ═══════════════════════ */}
            {activeTab === 'workspace' && (
              <div className="space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Workspace Customization</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Adjust sidebar behaviors and default layouts for task streams.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Default Dashboard Hub</label>
                    <select
                      value={defaultDashboard}
                      onChange={(e) => setDefaultDashboard(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="performance">Performance Analytics Hub</option>
                      <option value="calendar">Interactive Calendar View</option>
                      <option value="wellness">Wellness Mindfulness Hub</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Default Task Board Layout</label>
                    <select
                      value={boardLayout}
                      onChange={(e) => setBoardLayout(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="kanban">Visual Kanban Grid</option>
                      <option value="list">Detailed Spreadsheet List</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Workspace Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="english">English (US)</option>
                      <option value="spanish">Español (ES)</option>
                      <option value="french">Français (FR)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pl-1 sm:col-span-2 pt-2">
                    <input
                      type="checkbox"
                      id="sidebarCollapse"
                      checked={sidebarCollapse}
                      onChange={() => setSidebarCollapse(!sidebarCollapse)}
                      className="w-4 h-4 rounded text-purple-600 border-purple-200"
                    />
                    <label htmlFor="sidebarCollapse" className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
                      Automatically collapse sidebar menu when screen width reduces
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════ TAB 8: DANGER ZONE ═══════════════════════ */}
            {activeTab === 'danger' && (
              <div className="space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-xl font-black text-rose-600 tracking-tight flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 animate-pulse text-rose-500" />
                    <span>Danger Zone</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Critical destructive account management tasks.</p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-xs text-rose-950">Destructive Actions Warning</h4>
                      <p className="text-[10px] text-rose-700 leading-relaxed font-semibold mt-1">
                        Deleting your Zenvora operator profile is an **irreversible operation**. All completed objectives, accumulated XP scores, active streaks, and wellness mindfulness logs will be physically purged from the MongoDB database cluster forever.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={logout}
                    className="px-5 py-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs shadow-sm hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Logout Active Session</span>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => {
                      setDeleteConfirmText('');
                      setDeleteError('');
                      setShowDeleteModal(true);
                    }}
                    className="px-5 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-650 text-white font-black text-xs shadow-lg shadow-rose-200 hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Delete User Account</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Actions footer */}
            {activeTab !== 'danger' && (
              <div className="border-t border-purple-100/40 pt-6 mt-8 flex justify-end shrink-0">
                <button
                  onClick={handleSaveAllChanges}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ═══════════════════════ CRITICAL SECURITY ACCOUNT PURGE CONFIRMATION MODAL ═══════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in p-4 text-slate-800">
          <div className="w-full max-w-md lavender-glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative z-10 text-center animate-scale-up bg-white border border-rose-250">
            
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-250 animate-bounce">
              <Trash2 size={36} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-extrabold tracking-widest uppercase inline-block">
                PURGE IDENTITY ACCOUNT
              </span>
              <h2 className="text-2xl font-black tracking-tight text-rose-950 uppercase mt-2">
                Are you absolutely sure?
              </h2>
              <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">
                This will irreversibly delete your Zenvora profile and purge all registered tasks and wellness scorecards from MongoDB.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-bold text-center border border-rose-100">
                {deleteError}
              </div>
            )}

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Type <strong className="text-rose-500">DELETE</strong> to confirm unregistration
              </label>
              <input
                type="text"
                placeholder="Type 'DELETE' here..."
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-200/50 bg-rose-50/20 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="py-3.5 rounded-2xl border border-purple-150 bg-white hover:bg-purple-50 text-slate-500 font-bold text-xs shadow-sm active:scale-95 transition-transform"
              >
                Cancel Deletion
              </button>

              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs shadow-xl active:scale-95 transition-transform"
              >
                Confirm Purge
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
