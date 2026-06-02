import React from 'react';
import { Card } from '../types';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface GunCardProps {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isCurrentPlayMarker?: boolean;
}

// Gorgeous 24x24 high-density Retro Pixel Art Portrait of AI-Gun (ไอกัน)
// Depicting a stout, broad-shouldered, tall, dark-skinned character wearing sleek sunglasses, a yellow headband, and a red track jacket.
const GUN_PIXEL_SPRITE = [
  "......YYYYYYYYYYYY......",
  "....YYYYYYYYYYYYYYYY....",
  "...YYYYHJJJJJJJJYYYYY...",
  "..YYYHHHHHHHHHHHHHHYYY..",
  "..YYHHHHHHHHHHHHHHHHYY..",
  ".YHHHHHPPPPPPPPPPHHHHHY.",
  ".YHHHHPPPPPPPPPPPPPHHHY.",
  "YHHHPPPPPPPPPPPPPPPPPHHY",
  "YHHHPPEEEEPPPPEEEEPPPHHY",
  "YHHHPPEEKKEEPEEKKEEPPYHY",
  "YHHPPEEKKKKEEKKKKEEPPYHY",
  "YHHPPEEKKKKEEKKKKEEPPYHY",
  "YHHHPPPEEEEPPPEEEEPPPHHY",
  "YHHHHPPPPHHHHHHPPPPHHHHY",
  "YHHHHHSSKSSKKSSKSSHHHHHY",
  ".HHHHSSKSSKKSSKSSKHHHH.",
  ".HHHHSSKKKKKKKKSSKHHHH.",
  "..HHHSSSKKKKKKSSSKHHH..",
  "...HSSKKKKKKKKKKSSH...",
  "....SSRRRRRRRRRRSS.....",
  "...RRRSRRSRRSRRSRRR....",
  "..RRRRRSOOSSOOSORRRR...",
  "..RRRRRSOOSSOOSORRRR...",
  "...RRRRSRRSRRSRRSRRR...."
];

const colorMap: Record<string, string> = {
  '.': 'transparent',
  'Y': '#d97706', // Gold/yellow headband & details
  'H': '#0f0a05', // Very dark curly hair/head base
  'J': '#1c120c', // Hair highlights
  'P': '#1e293b', // Sleek retro black cyber sunglasses frame
  'E': '#ef4444', // Red glowing neon lenses for high sci-fi aura!
  'K': '#401811', // Deep dark brown shaded skin contours
  'S': '#693026', // Warm, majestic mahogany/dark chocolate primary skin tone (Gun)
  'R': '#dc2626', // High-contrast red street-track athletic jacket
  'O': '#eab308', // Shiny heavy gold chains resting on his chest
};

export const GunPixelArt: React.FC<{ size?: number }> = ({ size = 80 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className="image-rendering-pixelated select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {GUN_PIXEL_SPRITE.map((row, y) => 
        row.split('').map((char, x) => {
          const color = colorMap[char];
          if (color === 'transparent') return null;
          return (
            <rect 
              key={`${x}-${y}`} 
              x={x} 
              y={y} 
              width={1.05} 
              height={1.05} 
              fill={color} 
            />
          );
        })
      )}
    </svg>
  );
};

export const GunCard: React.FC<GunCardProps> = ({
  card,
  playable = false,
  onClick,
  hoverable = true,
  size = 'md',
  isCurrentPlayMarker = false,
}) => {
  const sizeClasses = {
    sm: 'w-14 h-22 rounded-none border-2 shadow p-1',
    md: 'w-24 h-36 md:w-28 md:h-42 rounded-none border-[3px] p-2',
    lg: 'w-28 h-44 md:w-32 md:h-50 rounded-none border-[4px] p-2.5',
  };

  const selectedSizeClass = sizeClasses[size];

  // Random funny quote blocks for the legendary AI-Gun
  const funnyGunQuotes = [
    "เห้ย! การ์ดบินกระจายว่อน! แย่งเก็บกันวายป่วงสิเพื่อน! 💨🔥",
    "ตูไอกันนะแว้ย! ตีนหนักอัดลมกระแทกจานบิน! 🍔⚡",
    "ระเบิดไพ่ระเบิดมือ! ดัดสันดานพวกเก็บสะสมหนาเตอะ! 🎮💥",
    "ฮั่นแน่! จั่วเข้าหรือลดโควตา? ทุกอย่างวัดดวงด้วยก้นคนดีย์โย่ว! 📢👑",
    "ไพ่ข้าลดไปใบ ส่วนสูจงโดนกระจายวาดเก็บกันยับเยิน! 🤪⚡"
  ];

  // Pixel font outline shadows
  const pShadow = '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000';

  return (
    <motion.div
      whileHover={playable && hoverable ? { y: -16, scale: 1.07, rotateZ: -1 } : hoverable ? { y: -4 } : {}}
      whileTap={playable && onClick ? { scale: 0.95 } : {}}
      onClick={playable && onClick ? onClick : undefined}
      className={`
        ${selectedSizeClass} 
        relative bg-[#2d0b12] text-slate-100
        border-black flex flex-col items-center justify-between select-none overflow-hidden
        transition-all duration-300
        ${playable ? 'cursor-pointer ring-4 ring-yellow-400 font-mono shadow-[6px_6px_0px_#000]' : 'opacity-95 shadow-[4px_4px_0px_#000]'}
        ${isCurrentPlayMarker ? 'ring-4 ring-rose-500' : ''}
      `}
      style={{
        imageRendering: 'pixelated',
        // Beveled retro pixel border looks
        borderTopColor: '#fca5a5', // light neon peach red
        borderLeftColor: '#fca5a5',
        borderBottomColor: '#7f1d1d', // deep dark blood-red
        borderRightColor: '#7f1d1d',
      }}
    >
      {/* Scanline pattern overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none z-10" 
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Grid overlay for tactical cyber feel */}
      <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] [background-size:6.5px_6.5px] opacity-15 pointer-events-none" />

      {/* Cyberpunk corner accent blocks */}
      <div className="absolute top-1 left-1 w-1 h-1 bg-red-400" />
      <div className="absolute top-1 right-1 w-1 h-1 bg-red-400" />
      <div className="absolute bottom-1 left-1 w-1 h-1 bg-yellow-400" />
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-yellow-400" />

      {/* Aligned Top Left Badge matching Nont-Dam */}
      <div className="absolute top-1.5 left-2 flex items-center gap-0.5 text-yellow-400 font-mono font-black text-[8px] tracking-tight">
        <Sparkles size={8} className="text-yellow-400 mr-[2px]" />
        <span style={{ textShadow: pShadow }}>AI-GUN</span>
      </div>

      {/* Aligned Top Right Badge matching Nont-Dam */}
      <div className="absolute top-1.5 right-2 text-cyan-400 font-mono font-black text-[8px] italic" style={{ textShadow: pShadow }}>
        8-BIT
      </div>

      {/* Main visual container */}
      <div className="my-auto flex flex-col items-center justify-center w-full z-10">
        {/* Holographic pixelated portrait holder */}
        <div className="relative w-15 h-15 md:w-18 md:h-18 bg-[#2d1219] border-2 border-red-500/80 flex items-center justify-center shadow-md overflow-visible rounded-none">
          {/* Cyber light pulse inside frame */}
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-transparent animate-pulse" />
          
          <GunPixelArt size={size === 'sm' ? 44 : 52} />
        </div>

        {/* Gun Card Text and RPG Stats */}
        {size !== 'sm' && (
          <div className="text-center mt-1.5 w-full">
            <h4 className="font-mono font-extrabold text-[10px] md:text-[11px] text-red-400 tracking-tight flex items-center justify-center gap-0.5" style={{ textShadow: pShadow }}>
              ★ GOLIATH 👑 ★
            </h4>
            
            {/* Retro RPG Stats block matched perfectly to NontDamCard */}
            <div className="mt-1 bg-black/60 border border-red-950 px-1 py-0.5 rounded-none inline-flex flex-col gap-[1px] text-[7.5px] font-mono font-bold text-slate-300 w-11/12 mx-auto leading-none">
              <div className="flex justify-between border-b border-red-950/40 pb-[1.5px]">
                <span className="text-rose-400">FAT:</span>
                <span className="text-white">99</span>
              </div>
              <div className="flex justify-between border-b border-red-950/40 py-[1.5px]">
                <span className="text-amber-400">CHAOS:</span>
                <span className="text-white">95</span>
              </div>
              <div className="flex justify-between pt-[1.5px]">
                <span className="text-cyan-400">SCATTER:</span>
                <span className="text-white">RNG</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info banner matched perfectly with NontDamCard layout */}
      <div 
        className="w-full text-center bg-[#581c87] border-t border-purple-900/60 py-0.5 text-[8px] md:text-[8.5px] font-black text-rose-300 tracking-wider font-mono uppercase"
        style={{ textShadow: '1px 1px 0px #000' }}
      >
        {size === 'sm' ? 'GUN' : '★ CHAOS SCATTER ★'}
      </div>

      {/* Target marker effect */}
      {playable && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-rose-400 border border-black animate-ping" />
      )}
    </motion.div>
  );
};
