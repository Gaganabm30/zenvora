import React from 'react';

const ZenvoraBackground = ({ mode = 'diagonal' }) => {
  return (
    <div className="floating-typography-container select-none">
      {/* Decorative Blur Orbs */}
      <div className="mesh-glow-1 top-[-10%] left-[-10%]" />
      <div className="mesh-glow-2 bottom-[-15%] right-[-10%]" />
      
      {/* Cinematic Signature Zenvora Snake-Wave Typography Background (Universally applied for premium branding) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="zenvora-giant-text rotate-[-12deg] tracking-tighter opacity-15">
          ZENVORA ZENVORA ZENVORA
        </div>
      </div>
    </div>
  );
};

export default ZenvoraBackground;
