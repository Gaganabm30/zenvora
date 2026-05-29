import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { Sparkles, Heart, Activity, ShieldAlert, CheckCircle, Info } from 'lucide-react';

const WellnessHubPage = () => {
  const { token, API_HOST, addXP } = useAuth();
  
  // Form inputs
  const [selectedMood, setSelectedMood] = useState('🧘');
  const [stressLevel, setStressLevel] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [wellnessNotes, setWellnessNotes] = useState('');
  
  // History logs
  const [logs, setLogs] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadWellnessLogs = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/wellness`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.warn('Backend offline, using local wellness logger fallback:');
      const savedLogs = localStorage.getItem('zenvora_wellness_logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        const defaultLogs = [
          { mood: '🧘', stressLevel: 3, sleepHours: 8, burnoutRiskScore: 15, date: new Date().toISOString() },
          { mood: '😊', stressLevel: 4, sleepHours: 7, burnoutRiskScore: 25, date: new Date(Date.now() - 86400000).toISOString() }
        ];
        setLogs(defaultLogs);
        localStorage.setItem('zenvora_wellness_logs', JSON.stringify(defaultLogs));
      }
    }
  };

  useEffect(() => {
    loadWellnessLogs();
  }, [token]);

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    setSubmitSuccess(false);

    // Dynamic Burnout calculation: (stressLevel * 8) - (sleepHours * 4) + 10
    let score = (stressLevel * 8) - (sleepHours * 4) + 20;
    score = Math.max(0, Math.min(100, score));

    const newEntry = {
      _id: Math.random().toString(),
      mood: selectedMood,
      stressLevel: parseInt(stressLevel),
      sleepHours: parseInt(sleepHours),
      burnoutRiskScore: score,
      notes: wellnessNotes,
      date: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_HOST}/api/wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEntry)
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs([data, ...logs]);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Offline fallback logger
      const updated = [newEntry, ...logs];
      setLogs(updated);
      localStorage.setItem('zenvora_wellness_logs', JSON.stringify(updated));
      addXP(15); // Gain 15 XP for logging self-care!
    }

    setWellnessNotes('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const latestLog = logs[0] || { burnoutRiskScore: 20, stressLevel: 5 };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen">
      <ZenvoraBackground mode="diagonal" />

      <div className="max-w-6xl mx-auto space-y-6 z-10 relative">
        <header className="text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mindfulness & Wellness Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Prevent cognitive exhaustion and balance focus scores</p>
        </header>

        {/* ----------------------------------------------------
           METRIC PLOTS SPLIT
           ---------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Logging Form */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl text-left space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Log Self-Care State</h3>
              <p className="text-xs text-slate-400">Record daily baseline mindfulness parameters</p>
            </div>

            {submitSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Self-care coordinates saved. 15 XP logged!</span>
              </div>
            )}

            <form onSubmit={handleSubmitLog} className="space-y-4">
              
              {/* Emojis selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Baseline Mood</label>
                <div className="flex flex-wrap gap-2.5">
                  {['😊', '😴', '🤯', '😔', '⚡', '🧘'].map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setSelectedMood(emoji)}
                      className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border transition-all ${
                        selectedMood === emoji
                          ? 'border-zenvora-500 bg-purple-50 scale-105 shadow-sm'
                          : 'border-purple-100 bg-white/20 hover:bg-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 pl-1">
                  <span className="uppercase tracking-wider">Stress Index Range</span>
                  <span className="text-rose-500 font-extrabold">{stressLevel}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stressLevel}
                  onChange={(e) => setStressLevel(e.target.value)}
                  className="w-full accent-purple-600 cursor-ew-resize"
                />
              </div>

              {/* Sleep Hours Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 pl-1">
                  <span className="uppercase tracking-wider">Sleep Duration</span>
                  <span className="text-indigo-500 font-extrabold">{sleepHours} Hours</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={12}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="w-full accent-purple-600 cursor-ew-resize"
                />
              </div>

              {/* Self-care notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Daily Mindfulness notes</label>
                <textarea
                  placeholder="Draft focus goals, mental blocks or observations..."
                  value={wellnessNotes}
                  onChange={(e) => setWellnessNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs font-medium text-slate-700 h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs shadow-md hover:opacity-90"
              >
                Log Self-Care coordinates
              </button>

            </form>
          </div>

          {/* Right Column: Burnout Warnings & Historic Feed */}
          <div className="space-y-8 text-left">
            
            {/* Burnout risk visual card */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-white flex flex-col gap-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Burnout Vector Index</h3>
                <p className="text-xs text-slate-400 mt-0.5">Continuous cognitive overload projection</p>
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <span className="text-4xl font-black text-slate-800">{latestLog.burnoutRiskScore}%</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  latestLog.burnoutRiskScore >= 60 
                    ? 'bg-rose-100 text-rose-700 animate-pulse' 
                    : latestLog.burnoutRiskScore >= 35 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {latestLog.burnoutRiskScore >= 60 ? 'Overload Risk' : latestLog.burnoutRiskScore >= 35 ? 'Moderate' : 'Optimal'}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    latestLog.burnoutRiskScore >= 60 ? 'bg-rose-500' : 'bg-zenvora-500'
                  }`}
                  style={{ width: `${latestLog.burnoutRiskScore}%` }}
                />
              </div>

              {latestLog.burnoutRiskScore >= 60 && (
                <div className="mt-2 p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-rose-600 font-semibold leading-relaxed">
                    AI Alert: Burnout threshold crossed. We strongly recommend immediate distraction block and lo-fi breathing sequences.
                  </p>
                </div>
              )}
            </div>

            {/* Past Logs Feed */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
              <h3 className="font-extrabold text-slate-800 text-base">Mindfulness History</h3>
              
              <div className="space-y-3 overflow-y-auto max-h-[12rem] pr-1">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log._id} className="p-3.5 rounded-2xl bg-white border border-purple-50/50 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{log.mood}</span>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-bold text-slate-700">Stress: {log.stressLevel}/10</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{new Date(log.date).toDateString()}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-700">{log.burnoutRiskScore}% risk</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-slate-400 gap-2 py-8">
                    <Info className="w-8 h-8 text-purple-200" />
                    <span className="text-xs font-semibold">No logs drafted yet.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default WellnessHubPage;
