import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import logoIconImg from '../assets/logo_icon.png';
import { Sparkles, Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';

// ========================================================
// 1. LOGIN PAGE COMPONENT
// ========================================================
export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification rejected. Check credentials.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex overflow-hidden bg-zenvora-bg relative">
      <ZenvoraBackground mode="centered" />

      {/* Split Left: Branding & Feature Highlights */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 z-10 relative overflow-hidden bg-white/20 border-r border-purple-100">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src={logoIconImg} alt="ZENVORA Logo" className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(124,58,237,0.2)]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zenvora-700 to-zenvora-500 bg-clip-text text-transparent">
            ZENVORA
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <h2 className="text-4xl font-extrabold text-slate-800 leading-tight">
            Organize Tasks.<br />
            Hit Every Deadline.
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Zenvora helps you plan, prioritize, and complete your tasks with smart AI breakdowns, Kanban boards, and real-time team collaboration.
          </p>
          <div className="space-y-3">
            {[
              { icon: '✅', text: 'Create and assign tasks in seconds' },
              { icon: '📊', text: 'Track progress with visual dashboards' },
              { icon: '🤝', text: 'Collaborate with your team in real time' },
              { icon: '🎯', text: 'Set priorities and never miss a due date' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-slate-600">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-400">
          © {new Date().getFullYear()} Zenvora Task Manager. All rights reserved.
        </div>
      </div>

      {/* Split Right: Glass login Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-xl relative border border-white">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 text-sm mt-1">Log in to manage your tasks and projects</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input 
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-slate-700 font-medium text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center pl-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button"
                  onClick={() => alert('Password recovery: A verification link has been dispatched.')}
                  className="text-xs font-semibold text-zenvora-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-slate-700 font-medium text-sm"
                />
              </div>
            </div>

            {/* Action Trigger */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Log In to My Tasks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 text-sm font-medium text-slate-500">
            New to Zenvora?{' '}
            <button onClick={() => navigate('/signup')} className="text-zenvora-600 font-bold hover:underline">
              Create a Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================================
// 2. SIGNUP PAGE & ONBOARDING SYSTEM
// ========================================================
export const Signup = () => {
  const navigate = useNavigate();
  const { signup, updateProfile } = useAuth();
  
  // Registration credentials
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Onboarding Slides control
  const [step, setStep] = useState(1); // 1 = details, 2 = focus slide, 3 = wellness slide, 4 = complete
  const [focusTarget, setFocusTarget] = useState('Productivity');
  const [dailyMood, setDailyMood] = useState('🧘');
  const [selectedAvatar, setSelectedAvatar] = useState('lavender_avatar_1');

  // Password Indicator
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Missing', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500 w-1/4' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-amber-400 w-2/4' };
    if (score === 3) return { score, label: 'Strong', color: 'bg-indigo-400 w-3/4' };
    return { score, label: 'Ascendant Level Security', color: 'bg-emerald-500 w-full' };
  };

  const passStrength = calculatePasswordStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    try {
      await signup(username, email, password);
      // Advance to onboarding slides
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration rejected.');
    }
  };

  const finalizeOnboarding = async () => {
    // Save selections and finalize
    await updateProfile({
      avatar: selectedAvatar,
      onboardingCompleted: true
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-screen flex overflow-hidden bg-zenvora-bg relative items-center justify-center p-6">
      <ZenvoraBackground mode="diagonal" />

      {step === 1 && (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-xl relative border border-white z-10">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Your Account</h1>
            <p className="text-slate-400 text-sm mt-1">Start managing your tasks and projects for free</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Unique Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input 
                  type="text"
                  required
                  placeholder="quantumCoder"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-slate-700 font-medium text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input 
                  type="email"
                  required
                  placeholder="coder@zenvora.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-slate-700 font-medium text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Secret Keyphrase</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-slate-700 font-medium text-sm"
                />
              </div>
              
              {/* Strength Gauge */}
              {password && (
                <div className="pt-2 space-y-1.5 pl-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Keyphrase strength</span>
                    <span className="text-zenvora-600 font-bold uppercase">{passStrength.label}</span>
                  </div>
                  <div className="w-full h-1 bg-purple-100 rounded-full overflow-hidden">
                    <div className={`h-full ${passStrength.color} transition-all duration-300`} />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Create My Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-sm font-medium text-slate-500 pt-2">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-zenvora-600 font-bold hover:underline">
              Log In
            </button>
          </div>
        </div>
      )}

      {/* ==================== ONBOARDING SLIDES ==================== */}
      {step === 2 && (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-xl relative border border-white z-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-zenvora-600 flex items-center justify-center mx-auto mb-2 animate-float">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">What do you want to manage?</h2>
          <p className="text-slate-400 text-sm">Choose your primary use case so Zenvora can personalize your task board experience.</p>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: '💼 Work Projects', value: 'Work Projects' },
              { label: '📚 Study & Learning', value: 'Study & Learning' },
              { label: '✍️ Personal Goals', value: 'Personal Goals' },
              { label: '🤝 Team Tasks', value: 'Team Tasks' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFocusTarget(value)}
                className={`py-4 rounded-xl border font-bold text-xs transition-all duration-300 ${
                  focusTarget === value 
                    ? 'border-zenvora-500 bg-purple-50 text-zenvora-700 shadow-md shadow-purple-100' 
                    : 'border-purple-100 bg-white/30 text-slate-600 hover:bg-white/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6">
            <div className="flex gap-1">
              <span className="w-6 h-1.5 rounded-full bg-zenvora-600" />
              <span className="w-2 h-1.5 rounded-full bg-purple-200" />
              <span className="w-2 h-1.5 rounded-full bg-purple-200" />
            </div>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-xl relative border border-white z-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-zenvora-600 flex items-center justify-center mx-auto mb-2 animate-float">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">How do you prefer to work?</h2>
          <p className="text-slate-400 text-sm">Pick your typical working style so we can tune your task view and reminders.</p>
          
          <div className="grid grid-cols-3 gap-3 py-4">
            {[
              { emoji: '🌅', label: 'Early Bird' },
              { emoji: '🌙', label: 'Night Owl' },
              { emoji: '⚡', label: 'Sprint Mode' },
              { emoji: '🎯', label: 'Deep Focus' },
              { emoji: '🔄', label: 'Flexible' },
              { emoji: '📋', label: 'Structured' },
            ].map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => setDailyMood(label)}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all duration-300 ${
                  dailyMood === label 
                    ? 'border-zenvora-500 bg-purple-50 scale-105 shadow-md shadow-purple-100 text-zenvora-700' 
                    : 'border-purple-100 bg-white/30 hover:bg-white/80 text-slate-600'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex gap-1">
              <span className="w-2 h-1.5 rounded-full bg-purple-200" />
              <span className="w-6 h-1.5 rounded-full bg-zenvora-600" />
              <span className="w-2 h-1.5 rounded-full bg-purple-200" />
            </div>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-xl relative border border-white z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-8 h-8 animate-pulse-subtle" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">You're all set! 🎉</h2>
          <p className="text-slate-400 text-sm">Your account is ready. Here's a quick look at what's waiting for you inside.</p>
          
          <div className="space-y-2 text-left bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>📌 Primary Focus:</span>
              <span className="text-zenvora-600 font-bold">{focusTarget}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>⚙️ Work Style:</span>
              <span className="text-zenvora-600 font-bold">{dailyMood}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>🏆 Starting Level:</span>
              <span className="text-amber-600 font-bold">Level 1 — Beginner</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>✅ Tasks Completed:</span>
              <span className="text-slate-500 font-bold">0 (let's change that!)</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex gap-1">
              <span className="w-2 h-1.5 rounded-full bg-purple-200" />
              <span className="w-2 h-1.5 rounded-full bg-purple-200" />
              <span className="w-6 h-1.5 rounded-full bg-zenvora-600" />
            </div>
            <button
              onClick={finalizeOnboarding}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-bold text-xs"
            >
              Go to My Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
