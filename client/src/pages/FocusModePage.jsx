import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { 
  Play, Pause, RotateCcw, Award, Zap, Clock, Sparkles, CheckCircle, 
  Flame, AlertTriangle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Premium Web Audio Alert Generator (Clean Browser Synthesis)
   ───────────────────────────────────────────────────────────────────────────── */
const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const alertGain = ctx.createGain();

    osc1.connect(alertGain);
    osc2.connect(alertGain);
    alertGain.connect(ctx.destination);

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

    alertGain.gain.setValueAtTime(0.12, ctx.currentTime);
    alertGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.7);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   Futuristic Focus Chamber & Count-Up Stopwatch (Exact Telemetry)
   ───────────────────────────────────────────────────────────────────────────── */
const FocusModePage = () => {
  const { addXP, token, API_HOST } = useAuth();

  // Focus Telemetry Stats (Persisted in localStorage with New-Day Reset)
  const [stats, setStats] = useState(() => {
    const todayStr = new Date().toDateString();
    const defaultStats = {
      focusedTodaySeconds: 0, 
      sessionsCompleted: 0,
      currentStreak: 3,
      lastLoggedDate: todayStr
    };
    try {
      const local = localStorage.getItem('zenvora_focus_stats_v1');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') {
          // If it's a new day, reset today's session telemetry!
          if (parsed.lastLoggedDate !== todayStr) {
            return {
              ...defaultStats,
              currentStreak: parsed.currentStreak || 3
            };
          }

          // Backward compatibility: Convert legacy minutes to seconds
          let seconds = parsed.focusedTodaySeconds;
          if (seconds === undefined && parsed.focusedToday !== undefined) {
            seconds = parsed.focusedToday * 60;
          }

          return {
            focusedTodaySeconds: seconds || 0,
            sessionsCompleted: parsed.sessionsCompleted || 0,
            currentStreak: parsed.currentStreak || 3,
            lastLoggedDate: todayStr
          };
        }
      }
      return defaultStats;
    } catch (e) {
      return defaultStats;
    }
  });

  // Save stats helper
  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem('zenvora_focus_stats_v1', JSON.stringify(newStats));
  };

  const focusedTodaySeconds = stats?.focusedTodaySeconds || 0;
  const sessionsCompleted = stats?.sessionsCompleted || 0;
  const currentStreak = stats?.currentStreak || 3;

  // Stopwatch States
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Overlays & Celebration States
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState({ title: '', body: '', isDoneLog: false });
  const [gainedXP, setGainedXP] = useState(0);
  const [isLogging, setIsLogging] = useState(false);

  // Confetti particles reference
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  // Stopwatch ticking logic
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Format exact time dynamically: e.g. "45s", "1m 15s", "1h 5m 12s"
  const formatExactTime = (totalSeconds) => {
    if (totalSeconds === 0) return "0s";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    let parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(" ");
  };

  // Log active stopwatch session helper (Exact seconds logged)
  const logCurrentSession = () => {
    // Only log sessions that ran for at least 3 seconds to prevent accidental micro-saves
    if (secondsElapsed >= 3) {
      const addedSeconds = secondsElapsed;
      const newFocusedSeconds = focusedTodaySeconds + addedSeconds;
      const newSessions = sessionsCompleted + 1;
      
      saveStats({
        focusedTodaySeconds: newFocusedSeconds,
        sessionsCompleted: newSessions,
        currentStreak: currentStreak,
        lastLoggedDate: new Date().toDateString()
      });
      
      setSecondsElapsed(0);
      return addedSeconds;
    }
    setSecondsElapsed(0);
    return 0;
  };

  // Pause control - commits time to accumulated stats exactly
  const handleToggleTimer = () => {
    if (timerActive) {
      setTimerActive(false);
      const addedSecs = logCurrentSession();
      if (addedSecs > 0) {
        // Award exact proportional XP (1 XP for every 10 seconds of focus, bounded between 5 XP and 25 XP)
        const xpReward = Math.min(25, Math.max(5, Math.round(addedSecs / 10)));
        addXP(xpReward);
        setGainedXP(xpReward);
        setOverlayMessage({
          title: "Session Block Logged!",
          body: `Well done! You focused for exactly ${formatExactTime(addedSecs)}. This session has been compiled into today's focus scoreboard.`,
          isDoneLog: false
        });
        playAlertSound();
        setShowCompletionOverlay(true);
        triggerConfetti();
      }
    } else {
      setTimerActive(true);
    }
  };

  // Reset control
  const handleResetTimer = () => {
    setTimerActive(false);
    setSecondsElapsed(0);
  };

  // "Done for Today" Manual Storing Feature
  const handleDoneToday = async () => {
    // Capture any active running stopwatch time first
    let activeSecs = 0;
    if (timerActive) {
      setTimerActive(false);
      activeSecs = logCurrentSession();
    } else {
      activeSecs = logCurrentSession();
    }

    const finalFocusedSeconds = focusedTodaySeconds + activeSecs;

    if (finalFocusedSeconds === 0) {
      alert("Please focus for at least 3 seconds before logging your day!");
      return;
    }

    setIsLogging(true);
    const xpReward = 20; // 20 XP for self-care manual daily logging
    addXP(xpReward);
    setGainedXP(xpReward);

    const notes = `Mindful focus session successfully captured! Logged total daily focus score of ${formatExactTime(finalFocusedSeconds)}.`;
    const finalMinutes = parseFloat((finalFocusedSeconds / 60).toFixed(2));

    const newEntry = {
      _id: Math.random().toString(),
      mood: '⚡',
      stressLevel: 3,
      sleepHours: 8,
      focusTimeMinutes: finalMinutes,
      burnoutRiskScore: 20,
      notes: notes,
      date: new Date().toISOString()
    };

    // 1. Sync with MERN backend API
    try {
      await fetch(`${API_HOST}/api/wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: '⚡',
          stressLevel: 3,
          sleepHours: 8,
          focusTimeMinutes: finalMinutes,
          notes: notes
        })
      });
    } catch (e) {
      console.warn("Backend offline, focus logging stored locally.");
    }

    // 2. Sync with offline local logs fallback
    try {
      const savedLogs = localStorage.getItem('zenvora_wellness_logs');
      let parsedLogs = [];
      if (savedLogs) {
        parsedLogs = JSON.parse(savedLogs);
      }
      const updated = [newEntry, ...parsedLogs];
      localStorage.setItem('zenvora_wellness_logs', JSON.stringify(updated));
    } catch (err) {
      console.error("Local wellness logging failed:", err);
    }

    setIsLogging(false);
    setOverlayMessage({
      title: "Today's Focus Logged!",
      body: `Magnificent focus practice! Your exact accumulated focus score of ${formatExactTime(finalFocusedSeconds)} has been logged and synchronized with your Zenvora Wellness telemetry database.`,
      isDoneLog: true
    });
    
    setShowCompletionOverlay(true);
    triggerConfetti();
  };

  // Close Success Celebration & reset
  const closeCelebration = () => {
    setShowCompletionOverlay(false);
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
  };

  // Format stopwatch seconds into standard dynamic text (MM:SS or HH:MM:SS)
  const formatTimeText = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const sHrs = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
    const sMins = mins.toString().padStart(2, '0');
    const sSecs = secs.toString().padStart(2, '0');
    
    return `${sHrs}${sMins}:${sSecs}`;
  };

  // Confetti loop
  const triggerConfetti = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#8B5CF6', '#A78BFA', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          r: Math.random() * 4 + 2,
          d: Math.random() * canvas.height,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.random() * 10 - 5,
          tiltAngleIncremental: Math.random() * 0.07 + 0.02,
          tiltAngle: 0
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, idx) => {
          p.tiltAngle += p.tiltAngleIncremental;
          p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
          p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

          if (p.y > canvas.height) {
            p.x = Math.random() * canvas.width;
            p.y = -20;
            p.tilt = Math.random() * 10 - 5;
          }

          ctx.beginPath();
          ctx.lineWidth = p.r;
          ctx.strokeStyle = p.color;
          ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
          ctx.stroke();
        });

        animationFrameId.current = requestAnimationFrame(draw);
      };

      draw();
    }, 100);
  };

  // SVG circular arc math (Represents active minutes ticking visual loop)
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressRatio = (secondsElapsed % 60) / 60;
  const strokeOffset = CIRCUMFERENCE - progressRatio * CIRCUMFERENCE;

  try {
    return (
      <div className="flex-1 p-6 overflow-y-auto relative min-h-screen bg-slate-50/50 text-slate-800 transition-all duration-700">
        <ZenvoraBackground mode="mesh" />

        <div className="max-w-2xl mx-auto z-10 relative pb-12 flex flex-col items-center">
          
          {/* Header */}
          <header className="text-center mb-8 mt-4">
            <div className="flex justify-center items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-extrabold tracking-widest shadow-lg shadow-purple-300/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                STOPWATCH FOCUS ACTIVE
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2.5">
              Deep Focus Chamber
              <Sparkles size={24} className="text-purple-500 animate-pulse" />
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-semibold max-w-md">
              Start the focus count-up timer, track your minutes or hours, and manually capture your daily score when done.
            </p>
          </header>

          {/* MAIN STOPWATCH PANEL */}
          <div className="w-full glass-panel p-8 rounded-3xl flex flex-col items-center text-center relative border border-purple-100/60 overflow-hidden shadow-xl mb-6 bg-white/70 backdrop-blur-md">
            
            {/* Glowing circular SVG count-up */}
            <div className="relative w-64 h-64 flex items-center justify-center my-6 group select-none">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="128" cy="128" r={RADIUS} 
                  stroke="rgba(221, 214, 254, 0.4)" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="128" cy="128" r={RADIUS} 
                  stroke="url(#timerGrad)" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black font-mono tracking-tight text-slate-850">
                  {formatTimeText(secondsElapsed)}
                </span>
                <span className="text-[10px] font-extrabold text-purple-650 uppercase tracking-widest mt-1">
                  {timerActive ? 'FOCUS FLOWING' : 'CHAMBER STANDBY'}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 w-full z-10">
              <button
                onClick={handleToggleTimer}
                className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform ${
                  timerActive 
                    ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' 
                    : 'bg-gradient-to-r from-violet-600 to-purple-500 shadow-purple-250'
                }`}
              >
                {timerActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <button
                onClick={handleResetTimer}
                className="w-12 h-12 rounded-full border border-purple-100 bg-white hover:bg-purple-50 text-slate-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="Reset active stopwatch"
              >
                <RotateCcw size={18} />
              </button>
            </div>

          </div>

          {/* TELEMETRY & DONE TODAY ACTIONS CARD */}
          <div className="w-full glass-panel p-6 rounded-3xl border border-purple-100/60 shadow-xl bg-white/70 backdrop-blur-md text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">TELEMETRY SCORECARD</span>
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">FOCUSED TODAY</span>
                    <span className="text-lg font-black text-slate-800">{formatExactTime(focusedTodaySeconds)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">SESSIONS COMPLETED</span>
                    <span className="text-lg font-black text-slate-800">{sessionsCompleted} Blocks</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Flame size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">STREAK</span>
                    <span className="text-lg font-black text-slate-800">{currentStreak} Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DONE TODAY SUBMIT BUTTON */}
            <button
              onClick={handleDoneToday}
              disabled={focusedTodaySeconds === 0 && secondsElapsed < 3}
              className={`w-full md:w-auto px-6 py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg select-none active:scale-95 ${
                focusedTodaySeconds === 0 && secondsElapsed < 3
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-purple-300/40 hover:shadow-purple-400/50 hover:scale-103'
              }`}
            >
              {isLogging ? (
                <span>Logging...</span>
              ) : (
                <>
                  <Award size={18} />
                  <span>Done for Today</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* QUANTUM COMPLETION CELEBRATION OVERLAY */}
        {showCompletionOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955 backdrop-blur-md animate-fade-in p-4">
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

            <div className="w-full max-w-md lavender-glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative z-10 text-center animate-scale-up text-slate-800">
              
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-250 animate-bounce">
                <Award size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-violet-950 uppercase">{overlayMessage.title}</h2>
                <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                  {overlayMessage.body}
                </p>
              </div>

              {/* Reward feedback box */}
              <div className="space-y-3 text-left bg-purple-50/60 p-5 rounded-2xl border border-purple-100/80 shadow-inner">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> XP REWARDS:</span>
                  <span className="text-amber-600 font-extrabold text-sm">+{gainedXP} XP</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-purple-100/50 pt-2.5">
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-purple-600" /> LOGGED TODAY:</span>
                  <span className="text-purple-700 font-extrabold text-sm">{formatExactTime(focusedTodaySeconds)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-purple-100/50 pt-2.5">
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-600" /> COMPLETED SESSIONS:</span>
                  <span className="text-emerald-700 font-extrabold text-sm uppercase tracking-wider">{sessionsCompleted} Blocks</span>
                </div>
              </div>

              <button
                onClick={closeCelebration}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-sm shadow-xl active:scale-95 transition-transform"
              >
                Acknowledge & Refocus
              </button>

            </div>
          </div>
        )}

      </div>
    );
  } catch (err) {
    console.error("Rendering error in FocusModePage", err);
    return (
      <div className="flex-1 p-8 bg-slate-900 text-white flex flex-col items-center justify-center text-center gap-4 min-h-screen">
        <AlertTriangle className="text-rose-500 w-16 h-16 animate-pulse" />
        <h2 className="text-2xl font-black">Cognitive Calibration Error</h2>
        <p className="text-slate-300 max-w-md text-sm">
          An error occurred: <strong className="text-rose-400">{err.message}</strong>
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('zenvora_focus_stats_v1');
            window.location.reload();
          }}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-transform mt-4"
        >
          Reset Environment Core
        </button>
      </div>
    );
  }
};

export default FocusModePage;
