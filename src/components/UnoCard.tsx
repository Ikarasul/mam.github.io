import { Card, CardColor, CardValue } from '../types';
import { motion } from 'motion/react';
import React from 'react';
import { NontDamCard } from './NontDamCard';

interface UnoCardProps {
  card: Card;
  isBack?: boolean;
  playable?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isCurrentPlayMarker?: boolean;
  flipSide?: 'light' | 'dark'; // 'light' is standard, 'dark' is cyber neon flip side
  theme?: 'pixel' | 'neon';
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
        {/* Portal/Star pattern in center to make it look magic-retro */}
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

// --- RENDER FUNCTIONS FOR 8-BIT PIXEL ART THEME ---

const getPixelCardBgColor = (c: CardColor, flipSide: 'light' | 'dark' = 'light'): string => {
  if (flipSide === 'dark') {
    switch (c) {
      case 'red': return '#f43f5e';     // Dark side Pink/Magenta
      case 'blue': return '#06b6d4';    // Dark side Teal
      case 'green': return '#a855f7';   // Dark side Purple
      case 'yellow': return '#f97316';  // Dark side Orange
      case 'wild': return '#121216';    // Dark carbon slate
      default: return '#06b6d4';
    }
  }
  
  switch (c) {
    case 'red': return '#dc2626';     // Light side Red
    case 'blue': return '#1d4ed8';    // Light side Blue
    case 'green': return '#16a34a';   // Light side Green
    case 'yellow': return '#eab308';  // Light side Yellow
    case 'wild': return '#0f172a';    // Dark carbon slate
    default: return '#1d4ed8';
  }
};

const renderPixelCardBack = (isDark: boolean) => {
  if (isDark) {
    // ===== DARK FLIP SIDE BACK: Deep space, neon teal/cyan accent =====
    return (
      <svg
        viewBox="0 0 32 48"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      >
        {/* Deep dark BG */}
        <rect x="0" y="0" width="32" height="48" fill="#0d0d1a" />
        {/* Outer neon border */}
        <rect x="1" y="1" width="30" height="46" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
        {/* Inner grid lines */}
        <line x1="16" y1="1" x2="16" y2="47" stroke="#06b6d420" strokeWidth="0.5" />
        <line x1="1" y1="24" x2="31" y2="24" stroke="#06b6d420" strokeWidth="0.5" />
        {/* Diagonal stripes */}
        <path d="M0,12 L12,0 M0,28 L28,0 M0,44 L32,12 M4,48 L32,20 M18,48 L32,34" stroke="#06b6d415" strokeWidth="1" />
        {/* Central dark oval */}
        <rect x="6" y="12" width="20" height="24" rx="7" ry="11"
          fill="#581c87" stroke="#f43f5e" strokeWidth="1.5"
          transform="rotate(-18 16 24)"
        />
        {/* UNO FLIP text */}
        <g transform="rotate(-10 16 24)">
          <text x="16.5" y="22" fontFamily="'Press Start 2P', monospace" fontSize="5.5"
            fill="#06b6d4" textAnchor="middle" fontWeight="bold" stroke="#000000" strokeWidth="1.2" paintOrder="stroke fill">
            อีอ้อ!
          </text>
          <text x="16" y="29" fontFamily="'Silkscreen', monospace" fontSize="3.5"
            fill="#f43f5e" textAnchor="middle" fontWeight="bold" stroke="#000000" strokeWidth="0.8" paintOrder="stroke fill">
            ▼ DARK ▼
          </text>
        </g>
        {/* Corner neon dots */}
        <circle cx="4" cy="4" r="1.5" fill="#06b6d4" />
        <circle cx="28" cy="4" r="1.5" fill="#f43f5e" />
        <circle cx="4" cy="44" r="1.5" fill="#f43f5e" />
        <circle cx="28" cy="44" r="1.5" fill="#06b6d4" />
      </svg>
    );
  }

  // ===== LIGHT FLIP SIDE BACK: Bright red, yellow gold, classic UNO FLIP =====
  return (
    <svg
      viewBox="0 0 32 48"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
    >
      {/* Black background */}
      <rect x="0" y="0" width="32" height="48" fill="#0c0a09" />
      {/* Outer border */}
      <rect x="1.5" y="1.5" width="29" height="45" fill="none" stroke="#eab308" strokeWidth="1" />
      {/* Diagonal pinstripe lines */}
      <path d="M0,8 L8,0 M0,20 L20,0 M0,32 L32,0 M0,44 L32,12 M8,48 L32,24 M20,48 L32,36" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
      {/* Slanted oval */}
      <rect x="6" y="12" width="20" height="24" rx="7" ry="11"
        fill="#dc2626" stroke="#f59e0b" strokeWidth="1"
        transform="rotate(-18 16 24)"
      />
      {/* Text Logo in Center */}
      <g transform="rotate(-10 16 24)">
        <text x="16.5" y="24" fontFamily="'Press Start 2P', monospace" fontSize="5.5"
          fill="#facc15" textAnchor="middle" fontWeight="bold" stroke="black" strokeWidth="1.2" paintOrder="stroke fill">
          อีอ้อ!
        </text>
        <text x="16" y="31" fontFamily="'Silkscreen', monospace" fontSize="3.2"
          fill="#ffffff" textAnchor="middle" fontWeight="bold" stroke="black" strokeWidth="0.8" paintOrder="stroke fill" opacity="0.85">
          ▲ ARENA ▲
        </text>
      </g>
      {/* Corner dots */}
      <circle cx="4" cy="4" r="1.5" fill="#eab308" />
      <circle cx="28" cy="4" r="1.5" fill="#eab308" />
      <circle cx="4" cy="44" r="1.5" fill="#eab308" />
      <circle cx="28" cy="44" r="1.5" fill="#eab308" />
    </svg>
  );
};

const renderPixelCardFront = (
  color: CardColor,
  value: CardValue,
  isDark: boolean
) => {
  // Use solid background color for both light and dark sides
  const bgHexColor = getPixelCardBgColor(color, isDark ? 'dark' : 'light');
  
  const highlightColor = 'rgba(255, 255, 255, 0.45)';
  const shadowColor = 'rgba(0, 0, 0, 0.3)';

  // Inside the oval, light side uses card color, dark side uses white/light colors for text/lines
  const designColor = isDark ? '#ffffff' : bgHexColor;

  // Determine what is displayed in the center
  let centerElement = null;

  if (value === 'wild' || value === 'draw4') {
    // 4-color oval
    centerElement = (
      <g transform="rotate(-18 16 24)">
        <clipPath id={`oval-clip-${color}-${value}`}>
          <rect x="6" y="12" width="20" height="24" rx="7" ry="11" />
        </clipPath>
        <g clipPath={`url(#oval-clip-${color}-${value})`}>
          {/* Quadrants */}
          <rect x="5" y="11" width="11" height="13" fill={isDark ? '#f43f5e' : '#dc2626'} />
          <rect x="16" y="11" width="11" height="13" fill={isDark ? '#06b6d4' : '#1d4ed8'} />
          <rect x="5" y="24" width="11" height="13" fill={isDark ? '#f97316' : '#eab308'} />
          <rect x="16" y="24" width="11" height="13" fill={isDark ? '#a855f7' : '#16a34a'} />
        </g>
        {/* Draw 4 / Draw 6 text inside wild */}
        {value === 'draw4' && (
          <text
            x="16.5"
            y="28.5"
            fontFamily="'Press Start 2P', monospace"
            fontSize="8"
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
            stroke="black"
            strokeWidth="1.8"
            paintOrder="stroke fill"
          >
            {isDark ? '+6' : '+4'}
          </text>
        )}
      </g>
    );
  } else if (value === 'skip') {
    centerElement = (
      <g>
        <circle cx="16" cy="24" r="7.5" stroke={designColor} strokeWidth="2.2" fill="none" />
        <line x1="10.5" y1="29.5" x2="21.5" y2="18.5" stroke={designColor} strokeWidth="2.2" />
      </g>
    );
  } else if (value === 'reverse') {
    centerElement = (
      <g>
        <g stroke={designColor} strokeWidth="2" strokeLinecap="square" fill="none">
          <path d="M7,18 h9 a4,4 0 0,1 4,4" />
          <path d="M25,30 h-9 a4,4 0 0,1 -4,-4" />
        </g>
        <path d="M8,14 l-4,4 l4,4 z" fill={designColor} />
        <path d="M24,34 l4,-4 l-4,-4 z" fill={designColor} />
      </g>
    );
  } else if (value === 'draw2') {
    // Light side is +2, Dark side is +5
    const drawText = isDark ? '+5' : '+2';
    centerElement = (
      <text
        x="16"
        y="28.5"
        fontFamily="'Press Start 2P', monospace"
        fontSize="8"
        fill={designColor}
        textAnchor="middle"
        fontWeight="bold"
        stroke="black"
        strokeWidth="1.8"
        paintOrder="stroke fill"
      >
        {drawText}
      </text>
    );
  } else if (value === 'flip') {
    // Beautiful premium flipping cards icon in pixel art
    centerElement = (
      <g>
        {/* Curved rotation arrow */}
        <path d="M10,24 A6,6 0 1,1 22,24" stroke={designColor} strokeWidth="1.5" fill="none" />
        <path d="M22,24 A6,6 0 1,1 10,24" stroke={designColor} strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
        {/* Overlapping cards (one horizontal/tilted, one vertical) */}
        {/* Card 1 */}
        <rect x="13.5" y="17.5" width="5" height="9" fill={isDark ? '#000000' : '#ffffff'} stroke={designColor} strokeWidth="1.2" />
        {/* Card 2 (rotated) */}
        <rect x="13.5" y="17.5" width="5" height="9" fill={isDark ? '#000000' : '#ffffff'} stroke={designColor} strokeWidth="1.2" transform="rotate(25 16 22)" />
      </g>
    );
  } else {
    // Normal numbers 0-9
    centerElement = (
      <text
        x="16.5"
        y="30"
        fontFamily="'Press Start 2P', monospace"
        fontSize="16.5"
        fill={designColor}
        textAnchor="middle"
        fontWeight="bold"
        stroke="black"
        strokeWidth="2.2"
        paintOrder="stroke fill"
        transform="skewX(-6)"
      >
        {value}
      </text>
    );
  }

  // Corner label helpers
  const cornerText = (() => {
    switch (value) {
      case 'skip': return 'Ø';
      case 'reverse': return 'R';
      case 'draw2': return isDark ? '+5' : '+2';
      case 'wild': return 'W';
      case 'draw4': return isDark ? '+6' : '+4';
      case 'flip': return 'F';
      default: return value;
    }
  })();

  return (
    <svg
      viewBox="0 0 32 48"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
    >
      {/* Outer border & Background */}
      <rect x="0" y="0" width="32" height="48" fill="#000000" />
      <rect x="1" y="1" width="30" height="46" fill={bgHexColor} />

      {/* 3D highlights */}
      <line x1="2" y1="2" x2="29" y2="2" stroke={highlightColor} strokeWidth="1" />
      <line x1="2" y1="3" x2="2" y2="45" stroke={highlightColor} strokeWidth="1" />
      <line x1="2" y1="45" x2="29" y2="45" stroke={shadowColor} strokeWidth="1" />
      <line x1="29" y1="2" x2="29" y2="44" stroke={shadowColor} strokeWidth="1" />

      {/* Slanted central oval (drawn for non-wild cards as white oval in light side, black oval in dark side) */}
      {value !== 'wild' && value !== 'draw4' && (
        <rect
          x="6"
          y="12"
          width="20"
          height="24"
          rx="7"
          ry="11"
          fill={isDark ? '#000000' : '#ffffff'}
          transform="rotate(-18 16 24)"
        />
      )}

      {/* Center symbol / number */}
      {centerElement}

      {/* Top Left Corner */}
      <text
        x="4.5"
        y="9"
        fontFamily="'Press Start 2P', monospace"
        fontSize="5.5"
        fill="#ffffff"
        textAnchor="middle"
        stroke="black"
        strokeWidth="1.2"
        paintOrder="stroke fill"
      >
        {cornerText}
      </text>

      {/* Bottom Right Corner (rotated 180) */}
      <g transform="rotate(180 16 24)">
        <text
          x="4.5"
          y="9"
          fontFamily="'Press Start 2P', monospace"
          fontSize="5.5"
          fill="#ffffff"
          textAnchor="middle"
          stroke="black"
          strokeWidth="1.2"
          paintOrder="stroke fill"
        >
          {cornerText}
        </text>
      </g>
    </svg>
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
  theme = 'pixel',
}) => {
  const isDark = flipSide === 'dark';
  const color = (isDark && card.darkColor) ? card.darkColor : card.color;
  const value = (isDark && card.darkValue) ? card.darkValue : card.value;
  
  const isSpecial = ['skip', 'reverse', 'draw2', 'wild', 'draw4', 'nont_dam', 'flip'].includes(value);

  const getCardDescription = (): string => {
    if (isDark) {
      switch (value) {
        case 'skip': return 'ข้ามผู้เล่นทุกคนจนกว่าจะวนกลับมารอบตัวเองอีกครั้ง! 🚫';
        case 'reverse': return 'สลับทิศทางการเล่นทวนเข็ม/ตามเข็ม 🔄';
        case 'draw2': return 'จั่วเบิ้ล 5 ใบ! ผู้เล่นคนถัดไปต้องจั่ว 5 ใบและโดนข้ามตา ➕๕';
        case 'wild': return 'เปลี่ยนสีสลบลาย! สิทธิ์ระบุสีหลักถัดไป (ชมพู/เทล/ม่วง/ส้ม) 🎨';
        case 'draw4': return 'มหาภัยจั่ว 6 ใบ! เปลี่ยนสีหลักและให้คนถัดไปจั่ว 6 ใบพร้อมโดนข้ามตา ☠️';
        case 'flip': return 'พลิกมิติกระจก! สลับหน้าการ์ดทุกคนกลับสู่มิติโลกสว่าง (Light Side) 🌀';
        case 'nont_dam': return '👑 นนท์ดำสุดแรร์! สุ่มแรปแบทเทิลป่วนกระแทกหูรอบโต๊ะคนละ 1 ใบ หรือแลกการ์ดสุ่มวนขวา หรือโอนการ์ดช่วยคนจน!';
        default: return '';
      }
    } else {
      switch (value) {
        case 'skip': return 'ข้ามตาผู้เล่น! ผู้เล่นคนถัดไปโดนข้ามตา 1 รอบ 🚫';
        case 'reverse': return 'สลับทิศทางการเล่นทวนเข็ม/ตามเข็ม 🔄';
        case 'draw2': return 'จั่วเจ็บ 2 ใบ! ผู้เล่นคนถัดไปต้องจั่ว 2 ใบและโดนข้ามตา ➕๒';
        case 'wild': return 'เปลี่ยนสีหลัก! สิทธิ์ระบุสีหลักถัดไป (แดง/น้ำเงิน/เขียว/เหลือง) 🎨';
        case 'draw4': return 'จั่วโหด 4 ใบ! เปลี่ยนสีหลักและให้คนถัดไปจั่ว 4 ใบพร้อมโดนข้ามตา ☠️';
        case 'flip': return 'สลับมิติกระจก! พลิกการ์ดทุกคนเข้าสู่มิติโลกมืดเรืองแสง (Dark Side) 🌀';
        case 'nont_dam': return '👑 นนท์ดำสุดแรร์! สุ่มแรปแบทเทิลป่วนกระแทกหูรอบโต๊ะคนละ 1 ใบ หรือแลกการ์ดสุ่มวนขวา หรือโอนการ์ดช่วยคนจน!';
        default: return '';
      }
    }
  };

  const tooltipText = getCardDescription();

  const renderTooltip = () => {
    if (isBack || !isSpecial || !tooltipText) return null;

    return (
      <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-44 p-2.5 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl text-[10px] text-zinc-100 font-sans leading-normal text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 transform scale-95 group-hover:scale-100 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-[1px] border-[5px] border-transparent border-t-slate-950/95" />
        <div className="font-extrabold text-[10.5px] text-amber-400 mb-1 border-b border-white/10 pb-1 uppercase tracking-wider font-sans">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </div>
        <p className="font-medium text-slate-300 font-sans">{tooltipText}</p>
      </div>
    );
  };


  // Custom class for size
  const sizeClasses = {
    sm: 'w-14 h-20 text-[10px] rounded-lg border-2 size-sm-card',
    md: 'w-28 h-42 md:w-32 md:h-46 rounded-[14px] border-[3.5px] size-md-card',
    lg: 'w-32 h-48 md:w-36 md:h-54 rounded-2xl border-4 size-lg-card',
  };

  const pixelSizeClasses = {
    sm: 'w-14 h-20 text-[10px] rounded-none border-2 border-black size-sm-card',
    md: 'w-28 h-42 md:w-32 md:h-46 rounded-none border-[3.5px] border-black size-md-card',
    lg: 'w-32 h-48 md:w-36 md:h-54 rounded-none border-4 border-black size-lg-card',
  };

  const selectedSizeClass = theme === 'pixel' ? pixelSizeClasses[size] : sizeClasses[size];

  // --- RENDER COMPACT RETRO BACKFACE ---
  if (isBack) {
    if (theme === 'pixel') {
      return (
        <motion.div
          whileHover={hoverable ? { y: -8, rotateZ: 1, scale: 1.02 } : {}}
          className={`${selectedSizeClass} relative overflow-hidden select-none flex flex-col justify-between`}
          style={{ 
            imageRendering: 'pixelated',
            boxShadow: '0 6px 12px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.4)',
          }}
        >
          {renderPixelCardBack(isDark)}
        </motion.div>
      );
    }

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

          {/* Central Oval Slanted with Crimson/Violet glow */}
          <div 
            className={`absolute -rotate-[22deg] w-[140%] h-[55%] border-[3.5px] transition-all duration-500 ${isDark ? 'shadow-[0_0_20px_rgba(168,85,247,0.55)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.55)]'}`}
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
      <div className="group relative">
        <NontDamCard 
          card={card}
          playable={playable}
          onClick={onClick}
          hoverable={hoverable}
          size={size}
          isCurrentPlayMarker={isCurrentPlayMarker}
        />
        {renderTooltip()}
      </div>
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

  // --- RENDER PIXEL THEME CARD FRONT ---
  if (theme === 'pixel') {
    return (
      <div className="relative group">
        {/* PIXEL SELECTION OUTLINES */}
        {(playable || isCurrentPlayMarker) && (
          <div className="absolute inset-[-4px] md:inset-[-6px] pointer-events-none z-30 animate-pulse">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-[4px] border-l-[4px]" style={{ borderColor: isDark ? featureHexColor : '#22d3ee' }} />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-[4px] border-r-[4px]" style={{ borderColor: isDark ? featureHexColor : '#22d3ee' }} />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[4px] border-l-[4px]" style={{ borderColor: isDark ? featureHexColor : '#22d3ee' }} />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[4px] border-r-[4px]" style={{ borderColor: isDark ? featureHexColor : '#22d3ee' }} />
          </div>
        )}

        <motion.div
          whileHover={playable && hoverable ? { y: -15, scale: 1.05, rotate: -0.5 } : hoverable ? { y: -3 } : {}}
          whileTap={playable && onClick ? { scale: 0.95 } : {}}
          onClick={playable && onClick ? onClick : undefined}
          className={`
            ${selectedSizeClass} 
            relative p-0 flex flex-col select-none overflow-hidden
            transition-all duration-150
            ${playable ? 'cursor-pointer shadow-[0_15px_30px_rgba(0,0,0,0.6)]' : 'opacity-[0.96] shadow-[0_5px_15px_rgba(0,0,0,0.35)]'}
          `}
          style={{ 
            imageRendering: 'pixelated',
            backgroundColor: '#000000',
          }}
        >
          {renderPixelCardFront(color, value, isDark)}

          {/* Tiny glow badge indicating interactive state */}
          {playable && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 border border-slate-950 animate-ping z-20 pointer-events-none" />
          )}
        </motion.div>
        {renderTooltip()}
      </div>
    );
  }

  // --- RENDER MINI CARD ('sm') IN NEON THEME ---
  if (size === 'sm') {
    return (
      <div className="relative group">
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
            boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
            width: '100%',
            height: '100%'
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
        {renderTooltip()}
      </div>
    );
  }

  // --- RENDER CLASSIC HIGH FIDELITY RETRO UNO CARD ('md' or 'lg') IN NEON THEME ---
  const isSpecialAction = ['skip', 'reverse', 'draw2', 'wild', 'draw4', 'flip'].includes(value);

  return (
    <div className="relative group">
      
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
          
          {/* Slanted elliptical felt backdrop segment */}
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
      {renderTooltip()}
    </div>
  );
};
