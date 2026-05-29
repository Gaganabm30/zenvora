import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoIconImg from '../assets/logo_icon.png';
import { Sparkles, LogIn, UserPlus, ArrowRight, Lock } from 'lucide-react';

/* ════════════════════════════════════
   ZENVORA  —  Auth Entry Portal
   Matches reference design exactly
   ════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="zp-root">

      {/* ══════════════════════════════
          BACKGROUND LAYER
      ══════════════════════════════ */}
      <div className="zp-bg" aria-hidden="true">

        {/* Giant 3-D ZENVORA snake-text */}
        <div className="zp-giant-text">ZENVORA</div>

        {/* Flowing ribbon / tube shapes — SVG */}
        <svg className="zp-ribbons" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice"
             xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Ribbon gradient */}
            <linearGradient id="rb1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#c4b5fd" stopOpacity="0.55"/>
              <stop offset="50%"  stopColor="#a78bfa" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.20"/>
            </linearGradient>
            <linearGradient id="rb2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#e9d5ff" stopOpacity="0.40"/>
              <stop offset="50%"  stopColor="#c084fc" stopOpacity="0.30"/>
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15"/>
            </linearGradient>
            <filter id="blur-ribbon">
              <feGaussianBlur stdDeviation="6"/>
            </filter>
          </defs>

          {/* LEFT  — top looping ribbon */}
          <path className="zp-ribbon zp-ribbon-a"
            d="M -80 120 C 60 60, 180 200, 100 320 C 20 440, -60 360, 40 480 C 140 600, 280 520, 200 640"
            stroke="url(#rb1)" strokeWidth="38" fill="none"
            filter="url(#blur-ribbon)" strokeLinecap="round"/>

          {/* LEFT  — inner thinner ribbon */}
          <path className="zp-ribbon zp-ribbon-b"
            d="M -40 140 C 80 80, 200 220, 120 340 C 40 460, -40 380, 60 500 C 160 620, 300 540, 220 660"
            stroke="url(#rb1)" strokeWidth="14" fill="none"
            filter="url(#blur-ribbon)" strokeLinecap="round" opacity="0.6"/>

          {/* BOTTOM-RIGHT — flowing ribbon */}
          <path className="zp-ribbon zp-ribbon-c"
            d="M 900 820 C 1050 720, 1200 780, 1350 680 C 1500 580, 1460 440, 1380 340 C 1300 240, 1180 280, 1260 160"
            stroke="url(#rb2)" strokeWidth="44" fill="none"
            filter="url(#blur-ribbon)" strokeLinecap="round"/>

          {/* BOTTOM-RIGHT — thinner inner */}
          <path className="zp-ribbon zp-ribbon-d"
            d="M 940 830 C 1090 730, 1240 790, 1390 690 C 1540 590, 1500 450, 1420 350"
            stroke="url(#rb2)" strokeWidth="16" fill="none"
            filter="url(#blur-ribbon)" strokeLinecap="round" opacity="0.5"/>

          {/* BOTTOM CENTER glow streak */}
          <ellipse className="zp-ribbon zp-ribbon-e"
            cx="860" cy="740" rx="160" ry="40"
            fill="url(#rb2)" filter="url(#blur-ribbon)" opacity="0.45"/>
        </svg>

        {/* Soft ambient colour orbs */}
        <div className="zp-orb zp-orb-tl" />
        <div className="zp-orb zp-orb-br" />
        <div className="zp-orb zp-orb-center" />
      </div>

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <header className="zp-nav">
        {/* Logo */}
        <button className="zp-nav-logo flex items-center gap-2.5" onClick={() => navigate('/')}>
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img src={logoIconImg} alt="ZENVORA Logo" className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(124,58,237,0.2)]" />
          </div>
          <span className="zp-nav-logo-label">ZENVORA</span>
        </button>

        {/* Auth buttons — always visible, no dashboard link */}
        <nav className="zp-nav-right">
          <button id="nav-login" className="zp-nav-login" onClick={() => navigate('/login')}>
            <Lock size={14} />
            Login
          </button>
          <button id="nav-signup" className="zp-nav-signup" onClick={() => navigate('/signup')}>
            <UserPlus size={14} />
            Sign Up
          </button>
        </nav>
      </header>

      {/* ══════════════════════════════
          CENTRE CARD
      ══════════════════════════════ */}
      <main className="zp-main">
        <div className="zp-card">

          {/* Brand Header with Logo in Front */}
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-md border border-purple-100/50 flex items-center justify-center p-2 shadow-lg shadow-purple-100/25 animate-float shrink-0">
              <img src={logoIconImg} alt="ZENVORA Logo" className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(139,92,245,0.25)]" />
            </div>
            <h1 className="zp-brand leading-none select-none">
              ZENVORA
            </h1>
          </div>

          {/* Divider */}
          <div className="zp-divider mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 inline-block mx-0.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block mx-0.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block mx-0.5" />
          </div>

          {/* Subtitle */}
          <p className="zp-subtitle">
            Smart task management and<br />productivity workspace.
          </p>

          {/* Primary: Login */}
          <button id="hero-login" className="zp-btn-login" onClick={() => navigate('/login')}>
            <LogIn size={17} className="zp-btn-icon" />
            <span className="zp-btn-label">Login to Zenvora</span>
            <ArrowRight size={16} className="zp-btn-arrow" />
          </button>

          {/* Secondary: Sign Up */}
          <button id="hero-signup" className="zp-btn-signup" onClick={() => navigate('/signup')}>
            <UserPlus size={17} className="zp-btn-icon" />
            <span className="zp-btn-label">Create an Account</span>
            <ArrowRight size={16} className="zp-btn-arrow" />
          </button>

        </div>
      </main>
    </div>
  );
};

export default LandingPage;
