import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { 
  Trophy, Zap, Shield, Crown, Medal, Sparkles, AlertTriangle, 
  Flame, Award, CheckCircle, Clock, Star, Calendar, RefreshCw
} from 'lucide-react';

const playLevelSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {}
};

const AchievementsPage = () => {
  const { token, API_HOST } = useAuth();
  
  // Real database states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [statsData, setStatsData] = useState({
    completedTasks: 0,
    focusSessions: 0,
    focusHours: 0,
    totalTasks: 0
  });
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Confetti overlay trigger
  const [celebrateUnlock, setCelebrateUnlock] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  const fetchAchievementsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Evaluate & Sync Achievements API call
      const evalRes = await fetch(`${API_HOST}/api/achievements/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!evalRes.ok) throw new Error("Could not authenticate achievements telemetry sync.");
      const evalData = await evalRes.json();
      
      setProfileData(evalData.user);
      setStatsData(evalData.stats);
      
      // Check if newly unlocked or leveled up
      if (evalData.newlyUnlocked && evalData.newlyUnlocked.length > 0) {
        setUnlockedBadges(evalData.newlyUnlocked);
        setCelebrateUnlock(true);
        playLevelSound();
        triggerConfettiLoop();
      } else if (evalData.leveledUp) {
        setUnlockedBadges([{ id: 'levelup', title: `Ascendant Level ${evalData.user.level}`, description: 'You have scaled your level tier to a new height!' }]);
        setCelebrateUnlock(true);
        playLevelSound();
        triggerConfettiLoop();
      }

      // 2. Fetch Leaderboard API call
      const leadRes = await fetch(`${API_HOST}/api/users/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeaderboard(leadData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed syncing authenticated metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievementsData();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const triggerConfettiLoop = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];
      for (let i = 0; i < 120; i++) {
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

  const closeCelebration = () => {
    setCelebrateUnlock(false);
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
  };

  // Real-time Badge Catalogs based on profileData
  const streak = profileData?.streak || 0;
  const xp = profileData?.xp || 0;
  const level = profileData?.level || 1;
  const username = profileData?.username || 'Operator';
  const achievementsList = profileData?.achievements || [];

  const completedTasks = statsData.completedTasks || 0;
  const focusSessions = statsData.focusSessions || 0;
  const focusHours = statsData.focusHours || 0.0;

  const catalog = [
    {
      id: 'first_task',
      title: 'First Quantum Step',
      description: 'Successfully archive your first deep focus objective.',
      icon: Shield,
      color: 'from-blue-500 to-indigo-500',
      unlocked: achievementsList.some(a => a.id === 'first_task'),
      progressText: completedTasks >= 1 ? '1/1 Complete' : '0/1 Tasks Completed',
      percent: completedTasks >= 1 ? 100 : 0
    },
    {
      id: 'task_master',
      title: 'Task Master',
      description: 'Conquer and archive 50 deep focus objectives on the board.',
      icon: Medal,
      color: 'from-violet-600 to-purple-600',
      unlocked: achievementsList.some(a => a.id === 'task_master'),
      progressText: `${Math.min(50, completedTasks)}/50 tasks archived`,
      percent: Math.min(100, Math.round((completedTasks / 50) * 100))
    },
    {
      id: 'focus_champion',
      title: 'Focus Champion',
      description: 'Conclude 20 deep focus blocks to calibrate productivity score.',
      icon: Crown,
      color: 'from-emerald-500 to-teal-500',
      unlocked: achievementsList.some(a => a.id === 'focus_champion'),
      progressText: `${Math.min(20, focusSessions)}/20 stopwatch blocks logged`,
      percent: Math.min(100, Math.round((focusSessions / 20) * 100))
    },
    {
      id: 'streak_legend',
      title: 'Streak Legend',
      description: 'Build momentum by maintaining a consecutive 7-day focus streak.',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
      unlocked: achievementsList.some(a => a.id === 'streak_legend'),
      progressText: `${Math.min(7, streak)}/7 consecutive days`,
      percent: Math.min(100, Math.round((streak / 7) * 100))
    },
    {
      id: 'deadline_hero',
      title: 'Deadline Hero',
      description: 'Archive high-priority objectives cleanly before deadlines expire.',
      icon: Award,
      color: 'from-rose-500 to-pink-500',
      unlocked: achievementsList.some(a => a.id === 'deadline_hero'),
      progressText: achievementsList.some(a => a.id === 'deadline_hero') ? '1/1 tasks completed on time' : 'No tasks done before deadline',
      percent: achievementsList.some(a => a.id === 'deadline_hero') ? 100 : 0
    },
    {
      id: 'consistency_king',
      title: 'Consistency King',
      description: 'Demonstrate optimal workplace consistency with 15 tasks done and streak >= 3.',
      icon: Star,
      color: 'from-indigo-600 to-violet-600',
      unlocked: achievementsList.some(a => a.id === 'consistency_king'),
      progressText: `${Math.min(15, completedTasks)}/15 tasks, ${Math.min(3, streak)}/3 streak`,
      percent: Math.min(100, Math.round(((Math.min(15, completedTasks) + Math.min(3, streak)) / 18) * 100))
    },
    {
      id: 'zen_seeker',
      title: 'Zen Seeker',
      description: 'Record stress and meditative logs in perfect equilibrium.',
      icon: Sparkles,
      color: 'from-fuchsia-500 to-pink-500',
      unlocked: achievementsList.some(a => a.id === 'zen_seeker'),
      progressText: achievementsList.some(a => a.id === 'zen_seeker') ? 'Equilibrium Active' : 'Perfect wellness log needed',
      percent: achievementsList.some(a => a.id === 'zen_seeker') ? 100 : 0
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen bg-slate-50/50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <ZenvoraBackground mode="mesh" />
        <RefreshCw className="w-12 h-12 text-violet-600 animate-spin" />
        <h2 className="text-xl font-bold tracking-tight">Synchronizing Gamified Milestones...</h2>
        <p className="text-slate-400 text-xs font-semibold">Contacting authenticated secure telemetry node</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen bg-slate-50/50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <ZenvoraBackground mode="mesh" />
        <AlertTriangle className="w-16 h-16 text-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black">Connection Sync Failure</h2>
        <p className="text-slate-400 text-xs font-semibold max-w-sm text-center">
          {error}
        </p>
        <button
          onClick={fetchAchievementsData}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all mt-2"
        >
          Retry Calibration Sync
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen text-slate-800">
      <ZenvoraBackground mode="mesh" />

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative pb-16">
        
        {/* Page Header */}
        <header className="text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span>Personalized Achievements</span>
              <Trophy className="w-7 h-7 text-purple-500 animate-float" />
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-semibold">
              Live authenticated gamification center tracking XP progression, milestones, and daily streaks.
            </p>
          </div>
          
          <button 
            onClick={fetchAchievementsData}
            title="Recalibrate and sync achievements"
            className="self-start md:self-auto px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-600 hover:text-purple-700 flex items-center gap-2 font-bold text-xs shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Scorecard</span>
          </button>
        </header>

        {/* ═══════════════════════ AUTHENTIC USER STATS PROFILE CARD ═══════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User Scorecard Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real Level Progress Panel */}
            <div className="lavender-glass-panel p-8 rounded-3xl text-left border border-white/60 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl bg-white/70">
              
              {/* Profile Avatar Spot */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 to-purple-500 p-1 shadow-lg relative group">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-3xl uppercase text-purple-700 font-sans tracking-wide">
                    {username.substring(0, 2)}
                  </div>
                  
                  {/* Glowing Flame indicator overlay */}
                  {streak > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg animate-pulse" title="Active Streak Active!">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Progress details */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-baseline gap-1">
                  <div>
                    <h2 className="text-2xl font-black text-slate-850 uppercase tracking-tight flex items-center gap-2">
                      {username}
                      <span className="text-xs font-extrabold text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded-lg border border-purple-200/40">Tier {level}</span>
                    </h2>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Secure Authenticated Operator Account</p>
                  </div>
                  
                  <span className="text-xs font-black text-purple-600 tracking-wider">
                    {xp % 100}/100 XP to Tier {level + 1}
                  </span>
                </div>

                {/* Progress Bar track */}
                <div className="space-y-1.5">
                  <div className="w-full h-4 rounded-full bg-purple-100/60 overflow-hidden p-0.5 border border-purple-200/20">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 transition-all duration-700 shadow-inner"
                      style={{ width: `${xp % 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Tier {level}</span>
                    <span>Total: {xp} Accumulated XP</span>
                    <span>Tier {level + 1}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* REAL USER STATISTICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Stat 1: Completed Tasks */}
              <div className="lavender-glass-panel p-5 rounded-2xl flex items-center gap-4 bg-white/70 shadow-sm border border-purple-100/40">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Completed Tasks</span>
                  <span className="text-2xl font-black text-slate-800">{completedTasks}</span>
                  <span className="text-[8px] text-slate-400 block font-bold mt-0.5">of {statsData.totalTasks || 0} registered</span>
                </div>
              </div>

              {/* Stat 2: Focus Hours */}
              <div className="lavender-glass-panel p-5 rounded-2xl flex items-center gap-4 bg-white/70 shadow-sm border border-purple-100/40">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Focus Hours</span>
                  <span className="text-2xl font-black text-slate-800">{focusHours}h</span>
                  <span className="text-[8px] text-indigo-500 block font-bold mt-0.5">{focusSessions} total blocks</span>
                </div>
              </div>

              {/* Stat 3: Streak Level */}
              <div className="lavender-glass-panel p-5 rounded-2xl flex items-center gap-4 bg-white/70 shadow-sm border border-purple-100/40 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-left z-10 relative">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Daily Streak</span>
                  <span className="text-2xl font-black text-slate-800">{streak} Days</span>
                  <span className="text-[8px] text-amber-600 block font-bold mt-0.5">Productive consistency</span>
                </div>
              </div>

            </div>

            {/* REAL USER BADGES LIST */}
            <div className="lavender-glass-panel p-6 rounded-3xl text-left bg-white/60 shadow-xl border border-purple-100/50 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <span>Productivity Milestones Unlocked</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {achievementsList.length} of {catalog.length} Earned
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Track your real performance telemetry to earn exclusive ascendant badges.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog.map((badge, idx) => {
                  const IconComp = badge.icon;
                  return (
                    <div 
                      key={idx}
                      className={`p-4.5 rounded-2xl border transition-all flex gap-4 ${
                        badge.unlocked
                          ? 'border-purple-250 bg-white/95 shadow-md shadow-purple-100/20 hover:-translate-y-0.5'
                          : 'border-purple-50 bg-white/30 opacity-40 select-none'
                      }`}
                    >
                      {/* Badge Icon Slot */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm border-purple-200/10 ${
                        badge.unlocked 
                          ? `bg-gradient-to-tr ${badge.color} text-white animate-float` 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        <IconComp className="w-7 h-7" />
                      </div>

                      {/* Details & Live Progress */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="font-bold text-xs text-slate-850 truncate">{badge.title}</h4>
                          <span className={`text-[8px] font-black uppercase shrink-0 px-2 py-0.5 rounded-full ${
                            badge.unlocked ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {badge.unlocked ? 'Earned' : 'Locked'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed pr-2">
                          {badge.description}
                        </p>
                        
                        {/* Interactive mini progress bar */}
                        <div className="space-y-1 pt-0.5">
                          <div className="w-full h-1.5 rounded-full bg-purple-50 overflow-hidden">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${badge.color} transition-all duration-500`}
                              style={{ width: `${badge.percent}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {badge.progressText}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Leaderboard Column - REAL USERS ONLY */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Real Board database panel */}
            <div className="lavender-glass-panel p-6 rounded-3xl flex flex-col text-left bg-white/70 shadow-xl border border-purple-100/50 min-h-[460px]">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <span>Zenvora Leaderboard</span>
                  <Crown className="w-5 h-5 text-amber-500" />
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Authentic operator grid sorted by real XP levels</p>
              </div>

              {leaderboard.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5 p-6">
                  <Shield className="w-10 h-10 text-purple-300 animate-float" />
                  <span className="text-xs font-black text-slate-500 uppercase">Leaderboard Offline</span>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-[200px]">
                    No other users registered in MDB. Get your friends to sign up!
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex-1 space-y-3.5">
                  {leaderboard.map((operator, index) => {
                    const opName = operator?.username || 'Anonymous';
                    const isSelf = opName === username;
                    const rank = index + 1;
                    return (
                      <div 
                        key={operator?._id || index} 
                        className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                          isSelf 
                            ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-lg shadow-purple-250' 
                            : 'bg-white border border-purple-100/30 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black w-5 text-center ${isSelf ? 'text-white' : 'text-slate-400'}`}>
                            #{rank}
                          </span>
                          
                          {/* Avatar Circle */}
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs uppercase ${
                            isSelf ? 'bg-white/20 border-white/30 text-white' : 'bg-purple-50 border-purple-100 text-purple-700'
                          }`}>
                            {opName.substring(0, 2)}
                          </div>

                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-xs tracking-tight flex items-center gap-1.5 truncate max-w-[120px]">
                              {opName}
                              {isSelf && <span className="text-[7px] font-black uppercase bg-white text-purple-700 px-1 rounded-sm">YOU</span>}
                            </span>
                            <span className={`text-[9px] font-semibold mt-0.5 ${isSelf ? 'text-white/70' : 'text-slate-400'}`}>
                              Tier {operator?.level || 1} Operator
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end">
                          <span className="text-xs font-black">{operator.xp} XP</span>
                          {operator.streak > 0 && (
                            <span className={`text-[8px] font-extrabold flex items-center gap-0.5 uppercase tracking-wider mt-0.5 ${
                              isSelf ? 'text-amber-200' : 'text-amber-500'
                            }`}>
                              <Flame className="w-2.5 h-2.5" />
                              {operator.streak}d
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ═══════════════════════ MILLISECOND QUANTUM ACHIEVEMENT UNLOCK CELEBRATION ═══════════════════════ */}
      {celebrateUnlock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in p-4">
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

          <div className="w-full max-w-md lavender-glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative z-10 text-center animate-scale-up bg-white text-slate-800 border border-purple-200/50">
            
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-250 animate-bounce">
              <Trophy size={40} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-extrabold tracking-widest uppercase inline-block">
                ACHIEVEMENT ACQUIRED
              </span>
              <h2 className="text-2xl font-black tracking-tight text-violet-950 uppercase mt-2">
                Unprecedented Milestone!
              </h2>
            </div>

            {/* List of newly unlocked badges */}
            <div className="space-y-3">
              {unlockedBadges.map((badge, idx) => (
                <div key={idx} className="bg-purple-50/60 p-4.5 rounded-2xl border border-purple-100 shadow-inner text-left flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-purple-950">{badge.title}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={closeCelebration}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-sm shadow-xl active:scale-95 transition-transform"
            >
              Acknowledge & Continue
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default AchievementsPage;
