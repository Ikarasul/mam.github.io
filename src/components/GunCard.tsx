import React from 'react';
import { Card } from '../types';
import { motion } from 'motion/react';
import gunPortrait from '../assets/gun_card_portrait.png';

interface GunCardProps {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isCurrentPlayMarker?: boolean;
}

export const GunCard: React.FC<GunCardProps> = ({
  card,
  playable = false,
  onClick,
  hoverable = true,
  size = 'md',
  isCurrentPlayMarker = false,
}) => {
  const sizeClasses = {
    sm: 'w-14 h-22 rounded-none border-2 shadow p-0.5',
    md: 'w-24 h-36 md:w-28 md:h-42 rounded-none border-[3px] p-0',
    lg: 'w-28 h-44 md:w-32 md:h-50 rounded-none border-[4px] p-0',
  };

  const selectedSizeClass = sizeClasses[size];

  // RPG stats from the reference image
  const stats = [
    { label: 'HP',  val: '88',  color: '#f87171' },
    { label: 'LVL', val: '14',  color: '#fbbf24' },
    { label: 'ATT', val: '12',  color: '#a78bfa' },
  ];

  const pShadow = '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000';

  return (
    <motion.div
      whileHover={playable && hoverable ? { y: -16, scale: 1.07, rotateZ: -1 } : hoverable ? { y: -4 } : {}}
      whileTap={playable && onClick ? { scale: 0.95 } : {}}
      onClick={playable && onClick ? onClick : undefined}
      className={`
        ${selectedSizeClass}
        relative text-slate-100
        border-black flex flex-col items-center justify-between select-none overflow-hidden
        transition-all duration-300
        ${playable ? 'cursor-pointer ring-4 ring-yellow-400 font-mono shadow-[6px_6px_0px_#000]' : 'opacity-95 shadow-[4px_4px_0px_#000]'}
        ${isCurrentPlayMarker ? 'ring-4 ring-rose-500' : ''}
      `}
      style={{
        background: 'linear-gradient(180deg, #0f1e3a 0%, #1a2d55 50%, #0d1b38 100%)',
        borderTopColor: '#93c5fd',
        borderLeftColor: '#93c5fd',
        borderBottomColor: '#1e3a8a',
        borderRightColor: '#1e3a8a',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)',
          backgroundSize: '100% 3px',
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-yellow-400 z-20" />
      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-400 z-20" />
      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-blue-400 z-20" />
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-blue-400 z-20" />

      {/* Top name banner */}
      <div
        className="w-full text-center py-0.5 px-1 text-[7px] md:text-[8px] font-black font-mono tracking-widest uppercase z-10 flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #1d4ed8)',
          textShadow: pShadow,
          color: '#fbbf24',
          borderBottom: '1px solid #1e40af',
        }}
      >
        {size === 'sm' ? 'GUN' : '⭐ GABE THE GAMER ⭐'}
      </div>

      {/* Portrait image — ใช้รูปจริงจาก generate_image */}
      <div className="relative flex-1 w-full overflow-hidden">
        <img
          src={gunPortrait}
          alt="Gabe the Gamer"
          className="w-full h-full object-cover object-top"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        {/* Dark overlay gradient at bottom for stats readability */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0d1b38] to-transparent z-10" />

        {/* RPG Stats overlay (bottom of image, hidden for sm) */}
        {size !== 'sm' && (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 font-mono px-1 pb-0.5"
            style={{ background: 'rgba(5,15,40,0.82)' }}
          >
            {stats.map((st) => (
              <div
                key={st.label}
                className="flex justify-between items-center"
                style={{ fontSize: '6px', lineHeight: '9px' }}
              >
                <span style={{ color: st.color, textShadow: pShadow }}>{st.label}:</span>
                <span className="text-white font-bold">{st.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom flavor banner */}
      <div
        className="w-full text-center py-0.5 text-[6px] md:text-[7px] font-black font-mono uppercase tracking-wider flex-shrink-0 z-10"
        style={{
          background: 'linear-gradient(90deg, #1d4ed8, #1e40af)',
          color: '#e0f2fe',
          textShadow: '1px 1px 0px #000',
          borderTop: '1px solid #1e40af',
        }}
      >
        {size === 'sm' ? 'GAMER' : 'BURGERS & PEPSI 🎮🍔'}
      </div>

      {/* Playable ping indicator */}
      {playable && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 border border-black animate-ping z-30" />
      )}
    </motion.div>
  );
};

// Export GunPixelArt as fallback (kept for backward compat if imported elsewhere)
export const GunPixelArt: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <img
    src={gunPortrait}
    alt="Gabe the Gamer"
    width={size}
    height={size}
    style={{ imageRendering: 'pixelated', objectFit: 'cover' }}
    draggable={false}
  />
);
