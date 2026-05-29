import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import {
  Sparkles, TrendingUp, Clock, Heart, Zap, AlertTriangle,
  CheckCircle2, Target, Brain, BarChart3, Activity,
  ArrowUp, Minus, Shield, Lightbulb,
  Calendar, ChevronRight, Eye, Cpu
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components (defined outside AnalyticsPage so they don't re-mount)
   ───────────────────────────────────────────────────────────────────────────── */

const AnimatedBar = ({ value, max, color, delay }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(Math.round((value / (max || 100)) * 100)), delay || 0);
    return () => clearTimeout(id);
  }, [value, max, delay]);
  return (
    <div className="w-full h-2 rounded-full bg-purple-100/60 overflow-hidden">
      <div
        className={'h-full rounded-full bg-gradient-to-r ' + (color || 'from-violet-500 to-purple-400') + ' transition-all duration-1000 ease-out'}
        style={{ width: w + '%' }}
      />
    </div>
  );
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white/95 border border-purple-100 rounded-2xl px-4 py-3 shadow-xl text-xs font-bold text-slate-800">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const AIBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-extrabold tracking-widest shadow-lg shadow-purple-300/40">
    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
    {label || 'AI ENGINE'}
  </span>
);

const PanelHeader = ({ Icon, title, subtitle, badge }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-zenvora-600 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="font-extrabold text-slate-800 text-base leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {badge && <AIBadge label={badge} />}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────────────────────────────────────── */
const AnalyticsPage = () => {
  const { token, API_HOST } = useAuth();

  const [tasks,            setTasks]            = useState([]);
  const [wellness,         setWellness]         = useState([]);
  const [calendarSchedule, setCalendarSchedule] = useState({});
  const [loaded,           setLoaded]           = useState(false);
  const [activeIns,        setActiveIns]        = useState(0);
  const [counters,         setCounters]         = useState({ total: 0, done: 0, score: 0, focus: 0 });

  /* insight rotation */
  useEffect(() => {
    const id = setInterval(() => setActiveIns(p => (p + 1) % 4), 4000);
    return () => clearInterval(id);
  }, []);

  /* data fetch */
  useEffect(() => {
    const go = async () => {
      let loadedTasks = null;
      let loadedWellness = null;

      try {
        const res = await fetch(API_HOST + '/api/tasks', { headers: { Authorization: 'Bearer ' + token } });
        if (res.ok) loadedTasks = await res.json();
      } catch (e) {
        console.warn("Failed to fetch tasks from backend", e);
      }

      try {
        const res = await fetch(API_HOST + '/api/wellness', { headers: { Authorization: 'Bearer ' + token } });
        if (res.ok) loadedWellness = await res.json();
      } catch (e) {
        console.warn("Failed to fetch wellness from backend", e);
      }

      // Try reading from localStorage fallbacks if API failed or returned empty/nothing
      if (!loadedTasks || loadedTasks.length === 0) {
        try {
          const local = localStorage.getItem('zenvora_tasks_v2');
          if (local) loadedTasks = JSON.parse(local);
        } catch (e) {}
      }
      if (!loadedWellness || loadedWellness.length === 0) {
        try {
          const local = localStorage.getItem('zenvora_wellness_logs');
          if (local) loadedWellness = JSON.parse(local);
        } catch (e) {}
      }

      // Load calendar timeblocks from localStorage
      try {
        const localCal = localStorage.getItem('zenvora_calendar_schedule_v1');
        if (localCal) setCalendarSchedule(JSON.parse(localCal));
      } catch (e) {
        console.warn("Failed to load calendar schedule", e);
      }

      setTasks(loadedTasks || []);
      setWellness(loadedWellness || []);
      setLoaded(true);
    };
    go();
  }, [token, API_HOST]);

  /* Helper to parse 24h string "HH:MM" → float hours */
  const timeToFloat = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };

  /* ── derived metrics ─────────────────────────────────────────────────────── */
  const total       = tasks.length;
  const done        = tasks.filter(t => t.status === 'done').length;
  const pending     = tasks.filter(t => t.status !== 'done').length;
  const overdue     = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const inProg      = tasks.filter(t => t.status === 'in_progress').length;
  const review      = tasks.filter(t => t.status === 'review').length;
  const todo        = tasks.filter(t => t.status === 'todo').length;
  
  const pct         = total > 0 ? Math.round((done / total) * 100) : 0;
  const score       = total > 0 ? Math.min(100, Math.max(10, done * 15 - overdue * 20 + 70)) : 0;

  // Read actual Pomodoro stopwatch focus time today
  const todayStr = new Date().toDateString();
  let localFocusSeconds = 0;
  let localSessionsCompleted = 0;
  try {
    const statsLocal = localStorage.getItem('zenvora_focus_stats_v1');
    if (statsLocal) {
      const parsed = JSON.parse(statsLocal);
      if (parsed && parsed.lastLoggedDate === todayStr) {
        localFocusSeconds = parsed.focusedTodaySeconds || 0;
        localSessionsCompleted = parsed.sessionsCompleted || 0;
      }
    }
  } catch (e) {
    console.warn("Failed to load local focus stats", e);
  }

  const avgMins = localSessionsCompleted > 0 
    ? Math.round(localFocusSeconds / 60 / localSessionsCompleted) 
    : (wellness.length > 0 
        ? Math.round(wellness.reduce((s, w) => s + (w.focusTimeMinutes || 0), 0) / wellness.length)
        : 0);

  const avgStress   = wellness.length > 0
    ? wellness.reduce((s, w) => s + (w.stressLevel || 0), 0) / wellness.length
    : 0;

  const burnout     = Math.min(100, Math.round(avgStress / 10 * 100 + overdue * 12));
  const burnLabel   = burnout < 30 ? 'Low' : burnout < 60 ? 'Moderate' : 'High';
  const burnColor   = burnout < 30 ? 'text-emerald-600' : burnout < 60 ? 'text-amber-500' : 'text-rose-500';

  // Calculate Focus Hours realistically from past 7 days (including today) using wellness + calendar timeblocks
  let totalWellnessFocusHours = 0;
  let totalCalendarFocusHours = 0;

  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    return d;
  });

  const todayStrISO = new Date();
  todayStrISO.setHours(0,0,0,0);

  wellness.forEach(w => {
    if (!w.date) return;
    const wd = new Date(w.date);
    wd.setHours(0,0,0,0);
    const isPast7 = past7Days.some(d => d.getTime() === wd.getTime());
    if (isPast7) {
      if (wd.getTime() === todayStrISO.getTime()) {
        // Today: take the max of the database log and our live stopwatch to avoid double counting
        const stopwatchMins = localFocusSeconds / 60;
        totalWellnessFocusHours += Math.max(w.focusTimeMinutes || 0, stopwatchMins) / 60;
      } else {
        totalWellnessFocusHours += (w.focusTimeMinutes || 0) / 60;
      }
    }
  });

  // If there are no wellness logs for today in the list, but we have stopwatch seconds today, add it!
  const hasTodayWellnessLog = wellness.some(w => {
    if (!w.date) return false;
    const wd = new Date(w.date);
    wd.setHours(0,0,0,0);
    return wd.getTime() === todayStrISO.getTime();
  });

  if (!hasTodayWellnessLog && localFocusSeconds > 0) {
    totalWellnessFocusHours += (localFocusSeconds / 3600);
  }

  past7Days.forEach(d => {
    const dateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const blocks = calendarSchedule[dateKey] || [];
    blocks.forEach(b => {
      if (b.startTime && b.endTime) {
        const start = timeToFloat(b.startTime);
        const end = timeToFloat(b.endTime);
        if (end > start) {
          totalCalendarFocusHours += (end - start);
        }
      }
    });
  });

  const fHours = Math.round(totalWellnessFocusHours + totalCalendarFocusHours);

  /* animated counters on load */
  useEffect(() => {
    if (!loaded) return;
    const targets = { total, done, score, focus: fHours };
    const steps = 30;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const ratio = step / steps;
      setCounters({
        total: Math.round(targets.total * ratio),
        done:  Math.round(targets.done  * ratio),
        score: Math.round(targets.score * ratio),
        focus: Math.round(targets.focus * ratio),
      });
      if (step >= steps) {
        setCounters(targets);
        clearInterval(id);
      }
    }, 30);
    return () => clearInterval(id);
  }, [loaded, total, done, score, fHours]);

  /* ── chart data ─────────────────────────────────────────────────────────── */
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0,0,0,0);
    const c = tasks.filter(t => {
      if (t.status !== 'done') return false;
      const td = new Date(t.updatedAt || t.completedAt || Date.now());
      td.setHours(0,0,0,0);
      return td.getTime() === d.getTime();
    }).length;
    return { name: DAYS[d.getDay()] + ' ' + d.getDate(), completed: c };
  });

  const pieData = [
    { name: 'Done',        value: done,    color: '#10B981' },
    { name: 'In Progress', value: inProg,  color: '#8B5CF6' },
    { name: 'Review',      value: review,  color: '#6366F1' },
    { name: 'To Do',       value: todo,    color: '#A78BFA' },
  ];

  const barData = [
    { name: 'Low',      done: tasks.filter(t => t.priority === 'low'      && t.status === 'done').length },
    { name: 'Medium',   done: tasks.filter(t => t.priority === 'medium'   && t.status === 'done').length },
    { name: 'High',     done: tasks.filter(t => t.priority === 'high'     && t.status === 'done').length },
    { name: 'Critical', done: tasks.filter(t => t.priority === 'critical' && t.status === 'done').length },
  ];

  /* ── 52-day heatmap ─────────────────────────────────────────────────────── */
  const heatmap = Array.from({ length: 52 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (51 - i));
    d.setHours(0,0,0,0);
    const dateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const calBlocks = calendarSchedule[dateKey] || [];
    const act = tasks.filter(t => {
      if (t.status !== 'done') return false;
      const td = new Date(t.updatedAt || t.completedAt || Date.now());
      td.setHours(0,0,0,0);
      return td.getTime() === d.getTime();
    }).length + wellness.filter(w => {
      const wd = new Date(w.date || Date.now());
      wd.setHours(0,0,0,0);
      return wd.getTime() === d.getTime();
    }).length + calBlocks.length;
    const lvls = ['bg-purple-100/20','bg-purple-300/40','bg-purple-400/70','bg-purple-600'];
    const lv   = act === 0 ? 0 : act === 1 ? 1 : act === 2 ? 2 : 3;
    return { key: i, cls: lvls[lv], glow: lv >= 2,
      tip: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ': ' + act + ' events' };
  });

  /* ── insights ───────────────────────────────────────────────────────────── */
  const insights = [
    { Icon: Zap,           color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200',
      text: pct >= 60
        ? 'You completed ' + pct + '% of tasks — above-average focus performance.'
        : 'Completion rate is ' + pct + '%. Breaking tasks into smaller chunks may help.' },
    { Icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',
      text: overdue > 0
        ? overdue + ' task' + (overdue > 1 ? 's are' : ' is') + ' overdue. Front-loading priority items reduces burnout.'
        : 'No overdue tasks detected. Your scheduling discipline is exceptional.' },
    { Icon: Brain,         color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200',
      text: 'Deep-work sessions average ' + avgMins + ' min. Research suggests 90-min blocks maximize flow.' },
    { Icon: Heart,         color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-200',
      text: burnout > 50
        ? 'Burnout risk is ' + burnLabel + '. Schedule recovery time between high-intensity sprints.'
        : 'Burnout risk is ' + burnLabel + '. You\'re maintaining a healthy work rhythm.' },
  ];

  /* ── predictions ─────────────────────────────────────────────────────────── */
  const preds = [
    { Icon: AlertTriangle,
      grad: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-200/60',
      dot: 'bg-amber-500', badge: 'RISK DETECTED', bCls: 'bg-amber-100 text-amber-700',
      text: overdue > 0
        ? overdue + ' task' + (overdue > 1 ? 's' : '') + ' may spill into next week if not prioritized today.'
        : 'Deadline forecast looks clear. No overflow risk for the next 7 days.',
      conf: overdue > 0 ? 78 : 91, confGrad: 'from-amber-400 to-orange-400' },
    { Icon: Activity,
      grad: 'from-rose-500/10 to-pink-500/5', border: 'border-rose-200/60',
      dot: 'bg-rose-500', badge: 'WORKLOAD ALERT', bCls: 'bg-rose-100 text-rose-700',
      text: pending > 5
        ? 'Thursday may exceed your healthy workload threshold. Consider delegating 2–3 low-priority items.'
        : 'Workload distribution looks balanced. No overload day predicted this week.',
      conf: pending > 5 ? 84 : 88, confGrad: 'from-rose-400 to-pink-400' },
    { Icon: TrendingUp,
      grad: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-200/60',
      dot: 'bg-violet-500', badge: 'OPPORTUNITY', bCls: 'bg-violet-100 text-violet-700',
      text: pct >= 70
        ? 'At current velocity, you will achieve a personal productivity record by end of month.'
        : 'Increasing focus sessions by 20 min/day could boost monthly completion rate by 34%.',
      conf: 73, confGrad: 'from-violet-500 to-purple-400' },
  ];

  const wellBars = [
    { label: 'Focus Score',  val: score,                    color: 'from-violet-500 to-purple-400' },
    { label: 'Energy Level', val: Math.round(100 - burnout * 0.7), color: 'from-emerald-400 to-teal-400' },
    { label: 'Burnout Risk', val: burnout,                  color: 'from-rose-400 to-pink-400' },
    { label: 'Stress Index', val: Math.round(avgStress * 10), color: 'from-amber-400 to-orange-400' },
  ];

  /* ── priority success stats ──────────────────────────────────────────────── */
  const doneHigh = tasks.filter(t => t.priority === 'high' && t.status === 'done').length;
  const totalHigh = tasks.filter(t => t.priority === 'high').length;
  const highPct = totalHigh > 0 ? Math.round((doneHigh / totalHigh) * 100) : 0;

  const doneMed = tasks.filter(t => t.priority === 'medium' && t.status === 'done').length;
  const totalMed = tasks.filter(t => t.priority === 'medium').length;
  const medPct = totalMed > 0 ? Math.round((doneMed / totalMed) * 100) : 0;

  const doneLow = tasks.filter(t => t.priority === 'low' && t.status === 'done').length;
  const totalLow = tasks.filter(t => t.priority === 'low').length;
  const lowPct = totalLow > 0 ? Math.round((doneLow / totalLow) * 100) : 0;

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const formatCardFocusTime = (secs) => {
    if (secs === 0) return "0m";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const currentFocusText = formatCardFocusTime(localFocusSeconds);

  const avgFocusSecs = localSessionsCompleted > 0 ? Math.round(localFocusSeconds / localSessionsCompleted) : 0;
  const avgFocusText = avgFocusSecs > 0 
    ? (avgFocusSecs >= 60 ? `${Math.round(avgFocusSecs / 60)}m` : `${avgFocusSecs}s`) 
    : "0m";

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 p-6 overflow-y-auto relative bg-slate-50/50" style={{ minHeight: '100vh' }}>
      <ZenvoraBackground mode="mesh" />

      <div className="max-w-7xl mx-auto z-10 relative pb-12" style={{ position: 'relative', zIndex: 10 }}>

        {/* ══════════════════════════ 1. HEADER ══════════════════════════════ */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AIBadge label="AI INTELLIGENCE" />
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Engine Active
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              Productivity Intelligence Center
              <Cpu size={28} className="text-zenvora-500 animate-float" />
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-semibold">
              Multi-dimensional cognitive telemetry · Focus analysis · Burnout prediction
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="glass-panel px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 flex items-center gap-2 border border-purple-100">
              <Calendar size={14} className="text-zenvora-500" />
              {dateStr}
            </div>
          </div>
        </header>

        {/* ═══════════════════════ 2. SUMMARY CARDS ═══════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">

          {/* Total Tasks */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 border border-purple-100/80 hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-zenvora-600 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tasks</div>
              <div className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">{counters.total}</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                <ArrowUp size={10} /> Live updates
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 border border-emerald-100/60 hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</div>
              <div className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">{counters.done}</div>
              <div className="mt-2">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                  <span>Rate</span><span>{pct}%</span>
                </div>
                <AnimatedBar value={pct} max={100} color="from-emerald-400 to-teal-400" delay={200} />
              </div>
            </div>
          </div>

          {/* AI Score */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 border border-violet-100/60 hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Score</div>
              <div className="flex items-end gap-1 mt-0.5">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{counters.score}</span>
                <span className="text-sm font-bold text-slate-400 mb-1">/100</span>
              </div>
              <AnimatedBar value={score} max={100} color="from-violet-500 to-purple-400" delay={300} />
            </div>
          </div>

          {/* Burnout Risk */}
          <div className={'glass-panel p-5 rounded-3xl flex flex-col gap-3 hover:-translate-y-0.5 transition-all duration-300 ' +
            (burnout > 60 ? 'border-2 border-rose-300/70 shadow-lg shadow-rose-100/60' : burnout > 30 ? 'border border-amber-200/60' : 'border border-emerald-100/60')}>
            <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' +
              (burnout > 60 ? 'bg-rose-100 text-rose-600' : burnout > 30 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}>
              <AlertTriangle size={18} className={burnout > 60 ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Burnout Risk</div>
              <div className={'text-2xl font-black tracking-tight mt-0.5 ' + burnColor}>{burnLabel}</div>
              <AnimatedBar value={burnout} max={100}
                color={burnout > 60 ? 'from-rose-500 to-pink-400' : burnout > 30 ? 'from-amber-400 to-orange-400' : 'from-emerald-400 to-teal-400'}
                delay={400} />
            </div>
          </div>

          {/* Focus Hours */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 border border-indigo-100/60 hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focus Hours</div>
              <div className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">{currentFocusText}</div>
              <div className="text-[10px] font-bold text-indigo-500 mt-1">7-Day Total: {fHours.toFixed(1)}h</div>
            </div>
          </div>

          {/* Avg Focus */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 border border-purple-100/80 hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-zenvora-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Focus</div>
              <div className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">{avgFocusText}</div>
              <div className={'text-[10px] font-bold mt-1 flex items-center gap-0.5 ' + (avgFocusSecs >= 300 ? 'text-emerald-600' : 'text-amber-500')}>
                {avgFocusSecs >= 300 ? <ArrowUp size={10} /> : <Minus size={10} />}
                <span>Today: {localSessionsCompleted} session{localSessionsCompleted !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ═══════════════════════ 4. CHARTS ROW ════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

          {/* Area Chart */}
          <div className="lg:col-span-3 glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-purple-100/60">
            <PanelHeader Icon={TrendingUp} title="Productivity Trend" subtitle="7-day completion velocity" />
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#A78BFA" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A78BFA" fontSize={10} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" vertical={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#8B5CF6" strokeWidth={2.5}
                    fill="url(#ag1)" dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#7C3AED' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-purple-100/60">
            <PanelHeader Icon={Activity} title="Task Distribution" subtitle="Status across all tasks" />
            <div className="relative animate-fade-in" style={{ height: 160 }}>
              {total > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={3} dataKey="value" stroke="none">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">{pct}%</span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Done</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 h-full">
                  <span className="text-3xl filter grayscale opacity-60">📊</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No tasks allocated</span>
                </div>
              )}
            </div>
            {total > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-purple-50/50 pt-3">
                {pieData.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-[10px] font-bold text-slate-500">{e.name}: {e.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bar + Wellness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-purple-100/60">
            <PanelHeader Icon={BarChart3} title="Priority Performance" subtitle="Completed tasks by priority tier" />
            <div style={{ height: 200 }} className="flex items-center justify-center">
              {tasks.some(t => t.status === 'done') ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={28}>
                    <defs>
                      <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#DDD6FE" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#A78BFA" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A78BFA" fontSize={11} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" vertical={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="done" name="Completed" fill="url(#bg1)" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 h-full">
                  <span className="text-3xl filter grayscale opacity-60">🎯</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No completed tasks yet</span>
                </div>
              )}
            </div>
          </div>

          {/* Wellness */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border border-purple-100/60">
            <PanelHeader Icon={Heart} title="Focus & Wellness" subtitle="Cognitive health and stress telemetry" badge="LIVE" />
            <div className="space-y-4">
              {wellBars.map((b, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>{b.label}</span>
                    <span className="text-slate-400">{b.val}%</span>
                  </div>
                  <AnimatedBar value={b.val} max={100} color={b.color} delay={i * 120} />
                </div>
              ))}
            </div>
            <div className={'p-3 rounded-2xl border text-xs font-semibold leading-relaxed ' +
              (burnout > 60 ? 'bg-rose-50 border-rose-100 text-rose-700' : burnout > 30 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700')}>
              <span className="font-extrabold">Wellness Report: </span>
              {wellness.length > 0 ? (
                burnout > 60
                  ? 'Your workload exceeded healthy limits this week. Schedule intentional recovery time.'
                  : burnout > 30
                    ? 'Moderate stress detected. Consider reducing task density over the next 48 hours.'
                    : 'Optimal wellness profile. Your work-rest balance is in the peak performance zone.'
              ) : (
                'No wellness telemetry logged for this period. Register self-care entries in Wellness Hub to map stress vectors.'
              )}
            </div>
          </div>

        </div>

        {/* ═══════════════════════ 5. HEATMAP ═══════════════════════════════ */}
        <div className="glass-panel p-6 rounded-3xl border border-purple-100/60 mb-8 relative overflow-hidden">
          <PanelHeader Icon={Calendar} title="Productivity Heatmap" subtitle="52-day focus consistency matrix (Tasks + Calendar + Wellness) — hover to inspect" badge="STREAKS" />
          <div className="overflow-x-auto">
            <div className="flex gap-1.5 flex-wrap" style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '6px' }}>
              {heatmap.map(cell => (
                <div
                  key={cell.key}
                  title={cell.tip}
                  className={'w-5 h-5 rounded cursor-pointer hover:scale-125 transition-transform ' + cell.cls +
                    (cell.glow ? ' shadow-sm shadow-purple-400/50' : '')}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-[9px] font-bold text-slate-400">Less</span>
              <div className="flex gap-1.5">
                {['bg-purple-100/20','bg-purple-300/40','bg-purple-400/70','bg-purple-600'].map((c,i) => (
                  <div key={i} className={'w-4 h-4 rounded ' + c} />
                ))}
              </div>
              <span className="text-[9px] font-bold text-slate-400">More</span>
            </div>
          </div>
        </div>

        {/* ════════════════════ 6. TASK PERFORMANCE ══════════════════════════ */}
        <div className="glass-panel p-6 rounded-3xl border border-purple-100/60 mb-8">
          <PanelHeader Icon={Target} title="Task Performance Analytics" subtitle="Completion ranking by priority tier" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { rank: '🥇', label: 'Fastest Category', val: 'High Priority',
                sub: doneHigh + ' of ' + totalHigh + ' completed', bar: highPct, color: 'from-amber-400 to-yellow-400' },
              { rank: '🥈', label: 'Most Active',       val: 'Medium Priority',
                sub: doneMed + ' of ' + totalMed + ' completed', bar: medPct, color: 'from-violet-500 to-purple-400' },
              { rank: '🥉', label: 'Needs Attention',   val: 'Low Priority',
                sub: doneLow + ' of ' + totalLow + ' completed', bar: lowPct, color: 'from-slate-400 to-slate-300' },
            ].map((item, i) => (
              <div key={i} className="bg-white/40 border border-purple-100/60 rounded-2xl p-4 space-y-3 hover:bg-white/70 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.rank}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
                <div>
                  <div className="font-extrabold text-slate-800 text-sm">{item.val}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">{item.sub}</div>
                </div>
                <AnimatedBar value={item.bar} max={100} color={item.color} delay={i * 150} />
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════ 7. PREDICTIONS ═══════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-300/40 animate-pulse-subtle">
              <Eye size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-base">AI Future Prediction System</h2>
              <p className="text-[11px] text-slate-400">Forecasting workload risks, deadline drift, and productivity decline</p>
            </div>
            <div className="ml-auto"><AIBadge label="PREDICTIVE AI" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {preds.map((p, i) => (
              <div key={i} className={'relative p-5 rounded-3xl border bg-gradient-to-br ' + p.grad + ' ' + p.border + ' overflow-hidden hover:-translate-y-0.5 transition-all duration-300'}>
                <div className={'absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-60 ' + p.dot} />
                <div className="flex items-start justify-between mb-3">
                  <div className={'w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 border ' + p.border}>
                    <p.Icon size={16} className="text-slate-600" />
                  </div>
                  <span className={'text-[9px] font-extrabold px-2 py-0.5 rounded-full ' + p.bCls}>{p.badge}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-4">{p.text}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Confidence</span><span>{p.conf}%</span>
                  </div>
                  <AnimatedBar value={p.conf} max={100} color={p.confGrad} delay={i * 200} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
