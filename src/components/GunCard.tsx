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

// The official, approved Gamer & Pepsi design: Short curly crop hair, sitting in front of computer, eating burger & drinking Pepsi (L) next to Keyboard (W)
const GUN_PIXEL_SPRITE = [
  "........................",
  "......H.H.H.H.H.H.......", // ผมหยิกศอกสั้นๆ ด้านบน
  "....YYYYYYYYYYYYYYYY....", // ผ้าคาดศีรษะสีทอง
  "...YYYYHJJJJJJJJYYYYY...",
  "..YYYHHHHHHHHHHHHHHYYY..",
  "..YYHHHHHHHHHHHHHHHHYY..",
  ".YHHHHHPPPPPPPPPPHHHHHY.",
  ".YHHHHPPPPPPPPPPPPPHHHY.",
  "YHHHPPPPPPPPPPPPPPPPPHHY",
  "YHHHPPEEEEPPPPEEEEPPPHHY", // แว่นตาสีแดงเรืองแสง (สะท้อนแสงหน้าจอคอมพิวเตอร์)
  "YHHHPPEEKKEEPEEKKEEPPYHY",
  "YHHPPEEKKKKEEKKKKEEPPYHY",
  "YHHPPEEKKKKEEKKKKEEPPYHY",
  "YHHHPPPEEEEPPPEEEEPPPHHY",
  "YHHHHPPPPHHHHHHPPPPHHHHY",
  "YHHHHHSSKSSKKSSKSSHHHHHY",
  ".HHHHSSKKKKMMMMKKKKHHHH.", // ปากเลอะเศษขนม
  ".HHHHSSKKWWWMMWWKKKHHHH.", 
  "..HHHSSSKKKBBNBKKKSHHH..", // คาบเบอร์เกอร์คำใหญ่
  "...HSSKKKKKBBNBKKKSSH...",  
  "....SSLLLLRWWWWWRRRR.....", // กระป๋องแป๊บซี่สีน้ำเงิน (L) + คีย์บอร์ด (W) + เสื้อฮู้ดเทาเข้ม
  "...LLRSRRRRWWWWWRRRR....",  // เสื้อสีชาร์โคล (R)
  "..LLRRRSOOGGGGGGOORRRR..", // ถุงขนมสีเขียว (G)
  "..LLRRRSOOGGGGGGOORRRR..", 
  "...RRRRSRRSRRSRRSRRR...."
];

const colorMap: Record<string, string> = {
  '.': 'transparent',
  'Y': '#d97706', // Gold/yellow headband & details
  'H': '#0f0a05', // Very dark curly hair/head base
  'J': '#1c120c', // Hair highlights
  'P': '#1e293b', // Sleek retro black sunglasses frame
  'E': '#ef4444', // Red glowing neon lenses
  'K': '#401811', // Deep dark brown skin contours
  'S': '#693026', // Warm primary dark chocolate skin tone
  'R': '#1f2937', // Dark charcoal/slate hoodie color
  'O': '#eab308', // Gold chains
  'W': '#ffffff', // Keyboard keys / teeth
  'M': '#3b0764', // Deep purple mouth cavity / smile
  'B': '#d97706', // Burger bun
  'N': '#f59e0b', // Melted cheese
  'G': '#22c55e', // Green snack bag
  'L': '#1d4ed8', // Pepsi Blue color for the can on the desk
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

  // Specific quotes and stats for Gamer & Pepsi Goliath
  const stats = [
    { label: 'FAT', val: '999' },
    { label: 'PLAY', val: '24H' },
    { label: 'BURGER', val: 'RNG' }
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
        borderTopColor: '#fca5a5',
        borderLeftColor: '#fca5a5',
        borderBottomColor: '#7f1d1d',
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

      {/* Aligned Top Left Badge */}
      <div className="absolute top-1.5 left-2 flex items-center gap-0.5 text-yellow-400 font-mono font-black text-[8px] tracking-tight">
        <Sparkles size={8} className="text-yellow-400 mr-[2px]" />
        <span style={{ textShadow: pShadow }}>AI-GUN</span>
      </div>

      {/* Aligned Top Right Badge */}
      <div className="absolute top-1.5 right-2 text-cyan-400 font-mono font-black text-[8px] italic" style={{ textShadow: pShadow }}>
        8-BIT
      </div>

      {/* Main visual container */}
      <div className="my-auto flex flex-col items-center justify-center w-full z-10">
        {/* Holographic pixelated portrait holder */}
        <div className="relative w-15 h-15 md:w-18 md:h-18 bg-black/40 border-2 border-red-500/80 flex items-center justify-center shadow-md overflow-visible rounded-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-transparent animate-pulse" />
          
          <GunPixelArt size={size === 'sm' ? 44 : 52} />
        </div>

        {/* Gun Card Text and RPG Stats */}
        {size !== 'sm' && (
          <div className="text-center mt-1.5 w-full">
            <h4 className="font-mono font-extrabold text-[9px] md:text-[10px] text-red-400 tracking-tight flex items-center justify-center gap-0.5 animate-bounce" style={{ textShadow: pShadow }}>
              ★ GAMER 🎮 ★
            </h4>
            
            {/* Retro RPG Stats block */}
            <div className="mt-1 bg-black/60 border border-red-950 px-1 py-0.5 rounded-none inline-flex flex-col gap-[1px] text-[7px] font-mono font-bold text-slate-300 w-11/12 mx-auto leading-none">
              {stats.map((st, i) => (
                <div key={st.label} className={`flex justify-between ${i < 2 ? 'border-b border-red-950/40 pb-[1.5px]' : 'pt-[1.5px]'}`}>
                  <span className={i === 0 ? 'text-rose-450' : i === 1 ? 'text-amber-450' : 'text-cyan-450'}>{st.label}:</span>
                  <span className="text-white">{st.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom info banner */}
      <div 
        className="w-full text-center bg-[#581c87] border-t border-purple-900/60 py-0.5 text-[8px] md:text-[8.5px] font-black text-rose-350 tracking-wider font-mono uppercase"
        style={{ textShadow: '1px 1px 0px #000' }}
      >
        {size === 'sm' ? 'GUN' : '★ GAMER GOLIATH ★'}
      </div>

      {/* Target marker effect */}
      {playable && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-rose-400 border border-black animate-ping" />
      )}
    </motion.div>
  );
};
