import { Card, CardColor, CardValue } from '../types';
import { motion } from 'motion/react';
import React from 'react';
import { NontDamCard } from './NontDamCard';
import { GunCard } from './GunCard';

interface UnoCardProps {
  card: Card;
  isBack?: boolean;
  playable?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isCurrentPlayMarker?: boolean;
  flipSide?: 'light' | 'dark'; // 'light' is standard, 'dark' is cyber neon flip side
}

// Light side and Dark side colors
const getCardBgColor = (c: CardColor, flipSide: 'light' | 'dark' = 'light'): string => {
  if (flipSide === 'dark') {
    // Cyberpunk Dark background with glowing borders
    return '#121216';
  }
  
  switch (c) {
    case 'red': return '#dc2626';     // Vibrant warm red
    case 'blue': return '#1d4ed8';    // Bright cobalt blue
    case 'green': return '#16a34a';   // Classic clover green
    case 'yellow': return '#eab308';  // Rich bright yellow
    case 'wild': return '#0f172a';    // Dark carbon slate
    default: return '#1d4ed8';
  }
};

// Returns the display color of the card border / features
const getCardFeatureColor = (c: CardColor, flipSide: 'light' | 'dark' = 'light'): string => {
  if (flipSide === 'dark') {
    // Glowing neon counterparts for the dark side
    switch (c) {
      case 'red': return '#f43f5e';     // Hot Pink / Rose
      case 'blue': return '#06b6d4';    // Vibrant Cyber Teal (Cyan)
      case 'green': return '#a855f7';   // Purple / Neon Violet
      case 'yellow': return '#f97316';  // Neon Orange
      case 'wild': return '#10b981';    // Toxic Emerald
      default: return '#06b6d4';
    }
  }

  // Standard high contrast light side colors
  switch (c) {
    case 'red': return '#dc2626';
    case 'blue': return '#1d4ed8';
    case 'green': return '#16a34a';
    case 'yellow': return '#eab308';
    case 'wild': return '#475569';
    default: return '#1d4ed8';
  }
};

// Text shadows to create custom pixel-perfect black outlines
const getPixelOutlineShadow = (color = '#000000', size = 2) => {
  return {
    textShadow: `
      ${size}px 0px 0px ${color}, 
      -${size}px 0px 0px ${color}, 
      0px ${size}px 0px ${color}, 
      0px -${size}px 0px ${color},
      ${size}px ${size}px 0px ${color}, 
      -${size}px -${size}px 0px ${color}, 
      ${size}px -${size}px 0px ${color}, 
      -${size}px ${size}px 0px ${color}
    `
  };
};

// SVG icons for action card symbols with classic styling
const renderActionSymbol = (value: CardValue, featureColor: string, sizeClass = 'w-14 h-14') => {
  if (value === 'skip') {
    return (
      <svg className={sizeClass} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" stroke="#ffffff" strokeWidth="4.5" fill="none" />
        <line x1="8" y1="32" x2="32" y2="8" stroke="#ffffff" strokeWidth="4.5" />
        {/* Stroke shadows */}
        <circle cx="20" cy="20" r="14" stroke="#000000" strokeWidth="1" fill="none" className="opacity-40" />
      </svg>
    );
  }

  if (value === 'reverse') {
    return (
      <svg className={sizeClass} viewBox="0 0 40 40" fill="none">
        {/* Arrow 1 path (top curved arrow going left) */}
        <path d="M8 12h14c5 0 8 3 8 7" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M12 7l-5 5 5 5" stroke="#ffffff" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Arrow 2 path (bottom curved arrow going right) */}
        <path d="M32 28H18c-5 0-8-3-8-7" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M28 23l5 5-5 5" stroke="#ffffff" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Dark drop outlines */}
        <path d="M8 12h14c5 0 8 3 8 7" stroke="#000000" strokeWidth="1" strokeLinecap="round" className="opacity-40" />
        <path d="M32 28H18c-5 0-8-3-8-7" stroke="#000000" strokeWidth="1" strokeLinecap="round" className="opacity-40" />
      </svg>
    );
  }

  if (value === 'flip') {
    // Spinning/helical 3D dual action arrows indicating side change
    return (
      <svg className={`${sizeClass} animate-spin-slow`} viewBox="0 0 40 40" fill="none">
        <path d="M10 20A10 10 0 0 1 28.5 13" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M30 20A10 10 0 0 1 11.5 27" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M10 13l-4 7h8z" fill="#ffffff" />
        <path d="M30 27l4-7h-8z" fill="#ffffff" />
        {/* Portal/Star pattern in center to make it look hyper magic-retro */}
        <circle cx="20" cy="20" r="3" fill="#eab308" />
      </svg>
    );
  }

  return null;
};

// Render segments of four quadrants for color-changing Wild Cards
const renderWildWheel = (flipSide: 'light' | 'dark' = 'light', sizeClass = 'w-16 h-16') => {
  // Use light side vs dark side neon palette for color segments
  const colors = flipSide === 'dark' 
    ? { topL: '#f43f5e', topR: '#06b6d4', botL: '#f97316', botR: '#a855f7' }  // Pink, Teal, Orange, Purple
    : { topL: '#dc2626', topR: '#1d4ed8', botL: '#eab308', botR: '#16a34a' }; // Red, Blue, Yellow, Green

  return (
    <div className={`${sizeClass} relative rounded-full border-[3.5px] border-black overflow-hidden bg-black flex rotate-[15deg] shadow-lg`}>
      {/* Absolute quadrants */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2" style={{ backgroundColor: colors.topL }} />
      <div className="absolute top-0 right-0 w-1/2 h-1/2" style={{ backgroundColor: colors.topR }} />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2" style={{ backgroundColor: colors.botL }} />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2" style={{ backgroundColor: colors.botR }} />
      <div className="absolute inset-1 border border-white/20 rounded-full" />
      
      {/* Center retro target pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-[2.5px] border-black flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
      </div>
    </div>
  );
};

export const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isBack = false,
  playable = false,
  onClick,
  hoverable = true,
  size = 'md',
  isCurrentPlayMarker = false,
  flipSide = 'light',
}) => {
  const { color, value } = card;

  // Custom class for size
  const sizeClasses = {
    sm: 'w-14 h-20 text-[10px] rounded-lg border-2',
    md: 'w-28 h-42 md:w-32 md:h-46 rounded-[14px] border-[3.5px]',
    lg: 'w-32 h-48 md:w-36 md:h-54 rounded-2xl border-4',
  };

  const selectedSizeClass = sizeClasses[size];
  const isDark = flipSide === 'dark';

  // --- RENDER COMPACT RETRO BACKFACE ---
  if (isBack) {
    return (
      <motion.div
        whileHover={hoverable ? { y: -8, rotateZ: 1, scale: 1.02 } : {}}
        className={`${selectedSizeClass} relative overflow-hidden bg-[#18181b] border-white p-1 select-none flex flex-col justify-between`}
        style={{ 
          imageRendering: 'pixelated',
          boxShadow: '0 6px 12px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.4)',
          borderColor: isDark ? '#a855f7' : '#ffffff' // Glowing violet border in Dark mode back
        }}
      >
        {/* Outer frame styling */}
        <div className="w-full h-full border-[2.5px] border-[#0c0a09] rounded-lg bg-[#0e0c0b] relative flex flex-col items-center justify-center p-2">
          {/* Subtle diagonal pinstripes */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" 
               style={{
                 backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 4px, transparent 4px, transparent 15px)'
               }} 
          />

          {/* Central Oval Slanted with Crimson glow */}
          <div 
            className="absolute -rotate-[22deg] w-[140%] h-[55%] border-[3.5px] shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            style={{ 
              borderRadius: '50%',
              backgroundColor: isDark ? '#581c87' : '#dc2626', // Purple back of flip / red standard back
              borderColor: isDark ? '#c084fc' : '#f59e0b'
            }}
          />

          {/* Golden/White Text Logo in Center */}
          <div className="rotate-[-10deg] z-10 flex flex-col items-center relative">
            <span 
              className="font-black tracking-tighter text-xl md:text-2xl uppercase italic text-center select-none"
              style={{
                color: isDark ? '#ffffff' : '#facc15',
                ...getPixelOutlineShadow('#000000', 3)
              }}
            >
              อีอ้อ!
            </span>
            <span className="text-[7.5px] font-mono tracking-widest text-[#f59e0b] font-black uppercase -mt-1 block opacity-90" style={getPixelOutlineShadow('#000000', 1)}>
              {isDark ? '▼ DARK ▼' : '▲ ARENA ▲'}
            </span>
          </div>

          {/* Corner suit dots / design dots */}
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-red-500 shadow border border-black/30" />
          <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow border border-black/30" />
        </div>
      </motion.div>
    );
  }

  // Rare Nont-Dam wrapper custom card (User requested: การ์ดนนท์ดำไม่ต้องยุ่งก่อน)
  // Let's pass all standard properties to it without modification
  if (value === 'nont_dam' && !isBack) {
    return (
      <NontDamCard 
        card={card}
        playable={playable}
        onClick={onClick}
        hoverable={hoverable}
        size={size}
        isCurrentPlayMarker={isCurrentPlayMarker}
      />
    );
  }

  // Rare Gun wrapper custom card
  if (value === 'ai_gun' && !isBack) {
    return (
      <GunCard 
        card={card}
        playable={playable}
        onClick={onClick}
        hoverable={hoverable}
        size={size}
        isCurrentPlayMarker={isCurrentPlayMarker}
      />
    );
  }

  // Resolve color mappings for display
  const bgHexColor = getCardBgColor(color, flipSide as 'light' | 'dark');
  const featureHexColor = getCardFeatureColor(color, flipSide as 'light' | 'dark');

  // Helper corner char mappings
  const getCornerValue = (v: CardValue): string => {
    switch (v) {
      case 'skip': return '🚫';
      case 'reverse': return '🔄';
      case 'draw2': return '+2';
      case 'wild': return '❖';
      case 'draw4': return '+4';
      case 'flip': return '🌀';
      default: return v;
    }
  };

  const displayChar = getCornerValue(value);

  // --- RENDER MINI CARD ('sm') ---
  if (size === 'sm') {
    return (
      <motion.div
        whileHover={playable && hoverable ? { y: -6, scale: 1.05 } : {}}
        onClick={playable && onClick ? onClick : undefined}
        className={`
          ${selectedSizeClass} 
          relative border-white select-none overflow-hidden
          flex flex-col items-center justify-between p-1.5
          ${playable ? 'cursor-pointer' : 'opacity-85'}
        `}
        style={{ 
          backgroundColor: bgHexColor,
          borderColor: isDark && color !== 'wild' ? featureHexColor : '#ffffff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
        }}
      >
        {/* Holographic Glowing Border indicator */}
        {(playable || isCurrentPlayMarker) && (
          <div className="absolute inset-0 border-[2px] border-cyan-400 z-20 animate-pulse pointer-events-none" />
        )}

        {/* Top left corner val */}
        <span className="self-start text-[10px] font-black leading-none" style={{ color: '#ffffff', ...getPixelOutlineShadow('#000000', 1.5) }}>
          {displayChar}
        </span>

        {/* Center icon */}
        <div className="my-auto scale-90">
          {color === 'wild' ? (
            <div className="w-5 h-5 rounded-full border border-black overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-blue-500" />
            </div>
          ) : (
            <span className="text-sm font-black text-white" style={getPixelOutlineShadow('#000000', 1.5)}>{displayChar}</span>
          )}
        </div>

        {/* Bottom right corner rotated */}
        <span className="self-end text-[10px] font-black leading-none rotate-180" style={{ color: '#ffffff', ...getPixelOutlineShadow('#000000', 1.5) }}>
          {displayChar}
        </span>
      </motion.div>
    );
  }

  // --- RENDER CLASSIC HIGH FIDELITY RETRO UNO CARD ('md' or 'lg') ---
  const isSpecialAction = ['skip', 'reverse', 'draw2', 'wild', 'draw4', 'flip'].includes(value);

  return (
    <div className="relative">
      
      {/* 3D NEON SELECTION OUTLINES */}
      {(playable || isCurrentPlayMarker) && (
        <div className="absolute inset-[-5px] md:inset-[-7px] pointer-events-none z-30">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[5px] border-l-[5px] rounded-sm transform scale-110" 
               style={{ 
                 borderColor: isDark ? featureHexColor : '#22d3ee',
                 boxShadow: `0 0 12px ${isDark ? featureHexColor : '#22d3ee'}`
               }} 
          />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[5px] border-r-[5px] rounded-sm transform scale-110" 
               style={{ 
                 borderColor: isDark ? featureHexColor : '#22d3ee',
                 boxShadow: `0 0 12px ${isDark ? featureHexColor : '#22d3ee'}`
               }} 
          />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[5px] border-l-[5px] rounded-sm transform scale-110" 
               style={{ 
                 borderColor: isDark ? featureHexColor : '#22d3ee',
                 boxShadow: `0 0 12px ${isDark ? featureHexColor : '#22d3ee'}`
               }} 
          />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[5px] border-r-[5px] rounded-sm transform scale-110" 
               style={{ 
                 borderColor: isDark ? featureHexColor : '#22d3ee',
                 boxShadow: `0 0 12px ${isDark ? featureHexColor : '#22d3ee'}`
               }} 
          />
        </div>
      )}

      {/* RENDER DYNAMIC CARD ENVELOPE */}
      <motion.div
        whileHover={playable && hoverable ? { y: -15, scale: 1.05, rotate: -0.5 } : hoverable ? { y: -3 } : {}}
        whileTap={playable && onClick ? { scale: 0.95 } : {}}
        onClick={playable && onClick ? onClick : undefined}
        className={`
          ${selectedSizeClass} 
          relative p-1.5 flex flex-col select-none overflow-hidden
          transition-all duration-150 border-white
          ${playable ? 'cursor-pointer shadow-[0_15px_30px_rgba(0,0,0,0.6)]' : 'opacity-[0.96] shadow-[0_5px_15px_rgba(0,0,0,0.35)]'}
        `}
        style={{ 
          imageRendering: 'pixelated',
          backgroundColor: bgHexColor,
          borderColor: isDark && color !== 'wild' ? featureHexColor : '#ffffff',
        }}
      >
        {/* Subtle decorative inner border card line */}
        <div 
          className="absolute inset-1.5 rounded-[9px] md:rounded-[12px] border-[2px] pointer-events-none opacity-85" 
          style={{ borderColor: isDark && color !== 'wild' ? `${featureHexColor}55` : '#ffffff88' }}
        />

        {/* TOP-LEFT VALUE DISPLAY */}
        <div className="absolute top-3.5 left-3.5 flex flex-col items-center leading-none z-10">
          <span 
            className="text-[19px] md:text-[23px] font-black font-sans italic" 
            style={{ 
              color: '#ffffff', 
              ...getPixelOutlineShadow('#000000', 2.2) 
            }}
          >
            {displayChar}
          </span>
        </div>

        {/* TOP-RIGHT MODE TYPE BADGE */}
        {value === 'flip' && (
          <div className="absolute top-3.5 right-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 border border-white px-1.5 py-0.5 rounded-sm flex items-center justify-center text-[7.5px] font-black scale-90 z-20 shadow">
            FLIP SIDE
          </div>
        )}
        {value !== 'flip' && color !== 'wild' && (
          <div className="absolute top-3.5 right-3.5 border border-white/50 px-1.5 py-0.5 rounded-sm flex items-center justify-center text-[7px] font-black font-mono scale-90 z-10 opacity-75 text-white bg-black/20">
            {isDark ? 'DARK' : 'LIGHT'}
          </div>
        )}

        {/* CENTRAL HERO CANVAS OVAL */}
        <div className="flex-1 my-7 flex items-center justify-center relative">
          
          {/* Slanted elliptical felt backdrop segment strictly matching the uploaded picture guidelines */}
          <div 
            className="absolute -rotate-[22deg] w-[118%] h-[68%] border-[3.5px] shadow-inner"
            style={{ 
              borderRadius: '50%',
              backgroundColor: isDark ? '#1a1a24' : bgHexColor, // Tilted colored oval matches card bg
              borderColor: isDark ? featureHexColor : '#ffffff', // Outlined in white
              boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.6)'
            }}
          />

          {/* Central main symbol */}
          <div className="z-10 flex items-center justify-center w-full h-full transform -skew-x-[8deg]">
            {value === 'wild' || value === 'draw4' ? (
              renderWildWheel(flipSide as 'light' | 'dark', 'w-16 h-16 md:w-20 md:h-20')
            ) : isSpecialAction ? (
              renderActionSymbol(value, featureHexColor, 'w-14 h-14 md:w-16 md:h-16')
            ) : (
              // Huge digits styled identically to the retro classic outline
              <span 
                className="text-[64px] md:text-[76px] font-extrabold font-sans italic tracking-tighter leading-none"
                style={{ 
                  color: '#ffffff', 
                  ...getPixelOutlineShadow('#000000', 4.5),
                  transform: 'scaleY(1.15) rotate(-3deg)'
                }}
              >
                {value}
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM-RIGHT ROTATED VALUE DISPLAY */}
        <div className="absolute bottom-3.5 right-3.5 flex flex-col items-center leading-none rotate-180 z-10">
          <span 
            className="text-[19px] md:text-[23px] font-black font-sans italic" 
            style={{ 
              color: '#ffffff', 
              ...getPixelOutlineShadow('#000000', 2.2) 
            }}
          >
            {displayChar}
          </span>
        </div>

        {/* Tiny glow badge indicating interactive state */}
        {playable && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 border border-slate-950 animate-ping z-20 pointer-events-none" />
        )}
      </motion.div>
    </div>
  );
};
