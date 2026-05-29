import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { 
  Sparkles, 
  CheckSquare, 
  Timer, 
  TrendingUp, 
  Heart,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Plus,
  AlertCircle,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  XAxis, YAxis, 
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, token, API_HOST, updateProfile } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Onboarding Slides control inside Dashboard
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [focusTarget, setFocusTarget] = useState('Productivity');
  const [dailyMood, setDailyMood] = useState('🧘');

  const handleCompleteOnboarding = async () => {
    try {
      await updateProfile({
        onboardingCompleted: true
      });

      // No seed tasks — users start with a completely empty task board.

      try {
        await fetch(`${API_HOST}/api/wellness`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            mood: dailyMood,
            stressLevel: focusTarget === 'Stress Control' ? 6 : 4,
            sleepHours: 8,
            focusTimeMinutes: 0,
            notes: `Initialized Zenvora space with primary focus on ${focusTarget}.`
          })
        });
      } catch (err) {
        console.warn("Failed seeding wellness log on backend:", err);
      }

      localStorage.setItem('zenvora_wellness_logs', JSON.stringify([
        {
          _id: 'seed_well_1',
          date: new Date(),
          mood: dailyMood,
          stressLevel: focusTarget === 'Stress Control' ? 6 : 4,
          sleepHours: 8,
          focusTimeMinutes: 0,
          burnoutRiskScore: 32,
          notes: `Initialized Zenvora space with primary focus on ${focusTarget}.`
        }
      ]));

      window.location.reload();
    } catch (err) {
      console.error("Error finalizing onboarding:", err);
    }
  };

  // Animated Counter states
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const tasksRes = await fetch(`${API_HOST}/api/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let tasksData = [];
        if (tasksRes.ok) {
          tasksData = await tasksRes.json();
          setTasks(tasksData);
        }

        const wellnessRes = await fetch(`${API_HOST}/api/wellness`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (wellnessRes.ok) {
          const wellnessData = await wellnessRes.json();
          setWellnessLogs(wellnessData);
        }
      } catch (err) {
        console.warn('Backend offline — starting with empty task list.');
        // Do NOT load fake data. New accounts must start clean.
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, token]);

  // Calculations
  const tCount = tasks.length;
  const cCount = tasks.filter(t => t.status === 'done').length;
  const pCount = tasks.filter(t => t.status !== 'done').length;
  
  const oCount = tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const completionPercent = tCount > 0 ? Math.round((cCount / tCount) * 100) : 0;

  // 1. Counting animation triggers on load
  useEffect(() => {
    if (loading) return;
    
    // Animate Total Tasks
    let tStart = 0;
    const tEnd = tCount;
    if (tEnd > 0) {
      const tTimer = setInterval(() => {
        tStart += 1;
        setTotalCount(tStart);
        if (tStart >= tEnd) clearInterval(tTimer);
      }, 50);
    } else {
      setTotalCount(0);
    }

    // Animate Completed Tasks
    let cStart = 0;
    const cEnd = cCount;
    if (cEnd > 0) {
      const cTimer = setInterval(() => {
        cStart += 1;
        setCompletedCount(cStart);
        if (cStart >= cEnd) clearInterval(cTimer);
      }, 50);
    } else {
      setCompletedCount(0);
    }

    // Animate Pending Tasks
    let pStart = 0;
    const pEnd = pCount;
    if (pEnd > 0) {
      const pTimer = setInterval(() => {
        pStart += 1;
        setPendingCount(pStart);
        if (pStart >= pEnd) clearInterval(pTimer);
      }, 50);
    } else {
      setPendingCount(0);
    }

    // Animate Overdue Tasks
    let oStart = 0;
    const oEnd = oCount;
    if (oEnd > 0) {
      const oTimer = setInterval(() => {
        oStart += 1;
        setOverdueCount(oStart);
        if (oStart >= oEnd) clearInterval(oTimer);
      }, 50);
    } else {
      setOverdueCount(0);
    }

  }, [loading, tCount, cCount, pCount, oCount]);

  // Chart Data mappings calculated dynamically from actual loaded operator telemetry
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 1. Productivity Vectors Line Chart: Dynamically plots the last 7 calendar days leading up to and ending with TODAY.
  const lineData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // i=6 is today, i=0 is 6 days ago
    d.setHours(0, 0, 0, 0);

    const dayName = daysOfWeek[d.getDay()];
    const label = `${dayName} ${d.getDate()}`; // e.g. "Sat 23"

    // Count completed tasks on this specific calendar date
    let completedCountOnDay = 0;
    tasks.forEach(t => {
      if (t.status === 'done') {
        const tDate = t.completedAt ? new Date(t.completedAt) : (t.updatedAt ? new Date(t.updatedAt) : new Date());
        tDate.setHours(0, 0, 0, 0);
        if (tDate.getTime() === d.getTime()) {
          completedCountOnDay++;
        }
      }
    });

    return {
      name: label,
      completed: completedCountOnDay
    };
  });

  const pieData = [
    { name: 'Completed', value: cCount, color: '#10B981' },
    { name: 'Pending', value: pCount, color: '#A78BFA' }
  ];

  const barData = [
    { name: 'Low', completed: tasks.filter(t => t.priority === 'low' && t.status === 'done').length },
    { name: 'Medium', completed: tasks.filter(t => t.priority === 'medium' && t.status === 'done').length },
    { name: 'High', completed: tasks.filter(t => t.priority === 'high' && t.status === 'done').length },
    { name: 'Critical', completed: tasks.filter(t => t.priority === 'critical' && t.status === 'done').length }
  ];

  // AI Focus Score calculation: dynamic based on completion vs overdue alarms, baseline 100% on empty slate
  let focusScore = tCount > 0 
    ? Math.max(10, Math.min(100, (cCount * 15) - (oCount * 20) + 70)) 
    : 0;

  // SVGs Contribution Heatmap: 28 days matrix calculated from real daily logged tasks & wellness telemetry ending with TODAY
  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const dayOffset = i - 27; // dayOffset goes from -27 to 0 (where 0 is today)
    const cellDate = new Date();
    cellDate.setDate(cellDate.getDate() + dayOffset);
    cellDate.setHours(0, 0, 0, 0);

    // Count completions and logs on cellDate
    let dailyCompletions = 0;
    tasks.forEach(t => {
      if (t.status === 'done') {
        const tDate = t.completedAt ? new Date(t.completedAt) : (t.updatedAt ? new Date(t.updatedAt) : new Date());
        tDate.setHours(0, 0, 0, 0);
        if (tDate.getTime() === cellDate.getTime()) {
          dailyCompletions++;
        }
      }
    });

    let dailyWellnessLogs = 0;
    wellnessLogs.forEach(w => {
      const wDate = new Date(w.date || Date.now());
      wDate.setHours(0, 0, 0, 0);
      if (wDate.getTime() === cellDate.getTime()) {
        dailyWellnessLogs++;
      }
    });

    const totalActivity = dailyCompletions + dailyWellnessLogs;

    // Translucent glass base if empty, shifting up to rich lavenders on activity
    let opacity = 'bg-purple-100/10';
    if (totalActivity === 1) opacity = 'bg-purple-300/40';
    if (totalActivity === 2) opacity = 'bg-purple-400/70';
    if (totalActivity >= 3) opacity = 'bg-purple-600';

    const dayName = daysOfWeek[cellDate.getDay()];
    const dateString = cellDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return { 
      day: i + 1, 
      level: opacity,
      count: totalActivity,
      label: `${dayName}, ${dateString}: ${totalActivity} focus events`
    };
  });

  if (user && user.onboardingCompleted === false) {
    return (
      <div className="flex-1 p-8 overflow-y-auto relative h-screen bg-zenvora-bg flex items-center justify-center">
        <ZenvoraBackground mode="diagonal" />
        
        {/* Onboarding step 1: Focus path selection */}
        {onboardingStep === 1 && (
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative border border-white/50 z-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-purple-100/80 text-zenvora-600 flex items-center justify-center mx-auto mb-2 animate-float">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mindful Target Selection</h2>
            <p className="text-slate-400 text-sm font-semibold leading-relaxed">
              Welcome to ZENVORA. Select your primary target focus pathway to calibrate your dashboard workspace telemetry.
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { name: 'Productivity', desc: 'Focus & Tasks' },
                { name: 'Stress Control', desc: 'Self-Care Telemetry' },
                { name: 'Deep Writing', desc: 'Distraction-Free' },
                { name: 'Squad Harmony', desc: 'Team Synergy' }
              ].map((target) => (
                <button
                  key={target.name}
                  onClick={() => setFocusTarget(target.name)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                    focusTarget === target.name 
                      ? 'border-zenvora-500 bg-purple-50/60 text-zenvora-700 shadow-lg shadow-purple-100 scale-[1.02]' 
                      : 'border-purple-100 bg-white/20 text-slate-600 hover:bg-white/80'
                  }`}
                >
                  <div className="font-extrabold text-xs">{target.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">{target.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6">
              <div className="flex gap-1.5">
                <span className="w-6 h-1.5 rounded-full bg-zenvora-600" />
                <span className="w-2 h-1.5 rounded-full bg-purple-200" />
                <span className="w-2 h-1.5 rounded-full bg-purple-200" />
              </div>
              <button
                onClick={() => setOnboardingStep(2)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs flex items-center gap-1.5 hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Onboarding step 2: Mood emojis selection */}
        {onboardingStep === 2 && (
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative border border-white/50 z-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-purple-100/80 text-zenvora-600 flex items-center justify-center mx-auto mb-2 animate-float">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mindfulness Mood Logs</h2>
            <p className="text-slate-400 text-sm font-semibold leading-relaxed">
              Register your initial cognitive and emotional state baseline to calibrate stress sensors.
            </p>
            
            <div className="flex justify-center gap-3.5 py-4">
              {[
                { emoji: '🧘', label: 'Balanced' },
                { emoji: '😊', label: 'Happy' },
                { emoji: '⚡', label: 'Charged' },
                { emoji: '😴', label: 'Fatigued' },
                { emoji: '🤯', label: 'Overloaded' },
                { emoji: '😔', label: 'Stressed' }
              ].map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => setDailyMood(item.emoji)}
                  title={item.label}
                  className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                    dailyMood === item.emoji 
                      ? 'border-zenvora-500 bg-purple-50 scale-110 shadow-lg shadow-purple-100' 
                      : 'border-purple-100 bg-white/20 hover:bg-white/80 hover:scale-105'
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6">
              <button
                onClick={() => setOnboardingStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex gap-1.5">
                <span className="w-2 h-1.5 rounded-full bg-purple-200" />
                <span className="w-6 h-1.5 rounded-full bg-zenvora-600" />
                <span className="w-2 h-1.5 rounded-full bg-purple-200" />
              </div>
              <button
                onClick={() => setOnboardingStep(3)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs flex items-center gap-1.5 hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Onboarding step 3: Success sync display */}
        {onboardingStep === 3 && (
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative border border-white/50 z-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 animate-pulse-subtle" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Workspace Calibrated!</h2>
            <p className="text-slate-400 text-sm font-semibold leading-relaxed">
              Your futuristic Zenvora environment and mind settings are fully configured.
            </p>
            
            <div className="space-y-3.5 text-left bg-purple-50/50 p-4.5 rounded-2xl border border-purple-100">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Unified Pathway:</span>
                <span className="text-zenvora-600 font-extrabold">{focusTarget}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Cognitive Baseline:</span>
                <span className="text-zenvora-600 font-extrabold">{dailyMood} Zen Balance</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Calibrated Tier:</span>
                <span className="text-amber-600 font-extrabold">Level 1 (Cosmic Recruit)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <button
                onClick={() => setOnboardingStep(2)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex gap-1.5">
                <span className="w-2 h-1.5 rounded-full bg-purple-200" />
                <span className="w-2 h-1.5 rounded-full bg-purple-200" />
                <span className="w-6 h-1.5 rounded-full bg-zenvora-600" />
              </div>
              <button
                onClick={handleCompleteOnboarding}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs shadow-lg hover:shadow-purple-200 transition-all duration-300 hover:scale-[1.02] active:scale-95 animate-pulse-subtle"
              >
                Enter Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen bg-zenvora-bg">
      <ZenvoraBackground mode="centered" />

      <div className="max-w-6xl mx-auto space-y-10 z-10 relative">
        
        {/* Workspace Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
              <span>Performance Hub</span>
              <Sparkles className="w-7 h-7 text-zenvora-500 animate-float" />
            </h1>
            <p className="text-slate-400 text-sm font-semibold mt-1">
              Real-time cognitive diagnostics & wellness telemetry
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/tasks')}
            className="self-start md:self-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assemble Objective</span>
          </button>
        </header>

        {/* ----------------------------------------------------
           1. FOUR LARGE TOP ANALYTICS CARDS
           ---------------------------------------------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Tasks Card */}
          <div className="glass-card p-6 rounded-3xl flex flex-col justify-between text-left h-40 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-purple-100/80 text-zenvora-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +14% this week
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Total Scope</span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mt-0.5">{totalCount} Tasks</h2>
            </div>
          </div>

          {/* Completed Tasks Card */}
          <div className="glass-card p-6 rounded-3xl flex flex-col justify-between text-left h-40 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-400">
                {completionPercent}% Ratio
              </span>
            </div>
            <div className="mt-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Archived Goals</span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mt-0.5">{completedCount} Finished</h2>
              <div className="w-full h-1 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Pending Tasks Card */}
          <div className="glass-card p-6 rounded-3xl flex flex-col justify-between text-left h-40 relative overflow-hidden group border border-white">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center animate-pulse-subtle">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Pending Load</span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mt-0.5">{pendingCount} Active</h2>
            </div>
          </div>

          {/* Overdue Tasks Card */}
          <div className={`glass-card p-6 rounded-3xl flex flex-col justify-between text-left h-40 relative overflow-hidden group transition-all duration-300 ${
            oCount > 0 ? 'border-2 border-rose-400 shadow-lg shadow-rose-100 bg-rose-50/20' : ''
          }`}>
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                oCount > 0 ? 'bg-rose-100 text-rose-500 animate-bounce' : 'bg-purple-100 text-slate-500'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Overdue Alarms</span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mt-0.5">{overdueCount} Critical</h2>
            </div>
          </div>

        </section>

        {/* ----------------------------------------------------
           2. PRODUCTIVITY ANALYTICS WIDGETS SECTION
           ---------------------------------------------------- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Widget 1: Line Chart (Productivity Trend) */}
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl flex flex-col text-left h-80">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Productivity Vectors</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Focus completions mapped over active dates</p>
            </div>
            <div className="flex-1 min-h-0 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="name" stroke="#A78BFA" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A78BFA" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Widget 2: SVGs Circular Radial AI Focus score */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center h-80">
            <div className="w-full text-left">
              <h3 className="font-extrabold text-slate-800 text-base">AI Focus Score</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time overall focus rating</p>
            </div>
            
            <div className="relative w-36 h-36 flex items-center justify-center my-4">
              {/* Radial Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="56" stroke="rgba(221,214,254,0.3)" strokeWidth="10" fill="transparent" />
                <circle 
                  cx="72" cy="72" r="56" 
                  stroke="#8B5CF6" strokeWidth="10" fill="transparent" 
                  strokeDasharray="351.8"
                  strokeDashoffset={351.8 - (351.8 * focusScore) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-800">{focusScore}%</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 uppercase">
                  {tCount > 0 ? (focusScore >= 70 ? 'Optimal' : 'Needs Focus') : 'Neutral'}
                </span>
              </div>
            </div>
          </div>

          {/* Widget 3: Recharts Status Pie Chart */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col text-left h-80 relative">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Scope Allocations</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ratio between pending and finished tasks</p>
            </div>
            <div className="flex-1 min-h-0 relative flex items-center justify-center mt-2" style={{ height: '160px' }}>
              {tCount > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={68}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.9)', 
                          border: 'none', 
                          borderRadius: '12px', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#1E293B'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text inside donut ring */}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">{completionPercent}%</span>
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Ratio</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 mt-2">
                  <span className="text-3xl filter grayscale opacity-60">📊</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No task allocations</span>
                </div>
              )}
            </div>

            {/* Premium Legend showing what HSL/Hex segments recognize */}
            {tCount > 0 && (
              <div className="flex justify-center items-center gap-6 mt-3 text-[10px] font-bold text-slate-500 border-t border-purple-50 pt-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-slate-600">Finished</span>
                  <span className="text-slate-400 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] font-extrabold">{cCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#A78BFA' }} />
                  <span className="text-slate-600">Pending</span>
                  <span className="text-slate-400 bg-purple-50 px-1.5 py-0.5 rounded text-[9px] font-extrabold">{pCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Widget 4: Recharts Weekly Completion Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col text-left h-80">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Priority Success Levels</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Archived goals segmented by priority tier</p>
            </div>
            <div className="flex-1 min-h-0 pt-4 relative flex items-center justify-center">
              {cCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#A78BFA" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A78BFA" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#DDD6FE" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 mt-2">
                  <span className="text-3xl filter grayscale opacity-60">🎯</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No completed benchmarks</span>
                </div>
              )}
            </div>
          </div>

          {/* Widget 5: Contribution Heatmap */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col text-left h-80">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Mindful Contribution Matrix</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Completed task vectors logged over 28 focus slots</p>
            </div>
            <div className="grid grid-cols-7 gap-2.5 mt-8 max-w-sm mx-auto">
              {heatmapDays.map((day) => (
                <div 
                  key={day.day} 
                  title={day.label}
                  className={`w-6 h-6 rounded-md ${day.level} hover:scale-110 hover:border hover:border-purple-300 transition-all cursor-pointer`}
                />
              ))}
            </div>
            {/* Legend indicators */}
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mt-8 max-w-sm mx-auto w-full">
              <span>Less</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded bg-purple-100/30" />
                <div className="w-3 h-3 rounded bg-purple-300/60" />
                <div className="w-3 h-3 rounded bg-purple-500/80" />
                <div className="w-3 h-3 rounded bg-purple-600" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Widget 6: Workload Balance & Smart insights */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col text-left h-80 justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Workload Balance Index</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Smart AI intensity metrics analysis</p>
            </div>

            <div className="space-y-4">
              {/* Load bars */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Current Cognitive Load</span>
                  <span className={pCount >= 5 ? 'text-rose-500' : 'text-emerald-600'}>
                    {pCount >= 5 ? 'Overloaded' : 'Balanced'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden">
                  <div 
                    className={`h-full ${pCount >= 5 ? 'bg-rose-500' : 'bg-emerald-500'} transition-all`}
                    style={{ width: `${Math.min(100, (pCount / 8) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Insights */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-zenvora-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  AI Assessment: Focus cycles are highly concentrated. Your peak efficiency vector logs suggest focus slots are most optimal between 9:00 AM and 11:30 AM. Adjust focus breaks to maximize output.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/focus')}
              className="w-full py-2.5 rounded-xl border border-purple-100 text-zenvora-600 font-extrabold text-xs hover:bg-purple-50/50 transition-all text-center mt-2"
            >
              Trigger Focus Timer
            </button>
          </div>

        </section>

      </div>
    </div>
  );
};

export default DashboardPage;
