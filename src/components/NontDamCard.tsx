import React from 'react';
import { Card } from '../types';
import { motion } from 'motion/react';
import { Shield, Sparkles, Smile, MessageSquare, Flame } from 'lucide-react';

interface NontDamCardProps {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isCurrentPlayMarker?: boolean;
}

// Gorgeous 24x24 high-density Stardew Valley style Pixel Art Portrait of Nont-Dam
// Featuring chubby cheeks, deep rich dark chocolate/caramel skin, short black curly curls, and a classy black jacket with a gold chain.
const NONT_DAM_PIXEL_SPRITE = [
  "......HHHHHHHHHHHH......",
  "....HHHHHHHHHHHHHHHH....",
  "...HHHHJJJJJJJJJJHHHH...",
  "..HHHJJJJJJJJJJJJJJHHH..",
  "..HHJJJJJJJJJJJJJJJJHH..",
  ".HHJJJLLLLLLLLLLJJJJJHH.",
  ".HJJLLLLLLLLLLLLLLJJJJH.",
  "HJJLLLLLLLLLLLLLLLLJJJJH",
  "HJJLLSSSSSSSSSSSSLLJJJJH",
  "HJLSSSSLSSSSSSSLSSSSJJJH",
  "HJLSSLEEEEEKKEEEEEESJJJH",
  "HJLSSLEEDDEKKKEDDEESJJJH",
  "HJLSSSLEDDEKKKEDDESSJJJH",
  "HJLSSSSSKSKKKSKSSSSSJSJH",
  "HJLSSRRRSSSSSSRRRSSSKSKH",
  ".JLSSRRRRTTTTTRRRRSKSKK.",
  ".JLSSSSRMMMMMMMSSSSKSKK.",
  "..LSSSSSSMMMMSSSSSKSKK..",
  "...LKKSSSSSKSKSSSKKKK...",
  "....LKKKKKKKKKKKKKKK....",
  ".....WWWWKKKKKKWWWW.....",
  "....CCCCWWWWWWCCCCC.....",
  "...CCCCCCWWBBWCCCCCC....",
  "...CCCCCCWBBBWCCCCCC...."
];

const colorMap: Record<string, string> = {
  '.': 'transparent',
  'H': '#110c08', // very dark midnight curly hair base
  'J': '#2c1e14', // curly hair midtone highlights (Stardew Style)
  'L': '#9d633b', // warm caramel highlights (outer chubby cheeks & forehead)
  'S': '#7b4825', // rich warm dark chocolate primary skin tone (Dam)
  'K': '#522b10', // shaded chocolate brown contours & chin details
  'E': '#ffffff', // crisp eye whites
  'D': '#3b82f6', // playful electric blue irises for handsome contrast!
  'R': '#a53e34', // rosy dark chubby cheeks blush (warm blush glow)
  'M': '#6b1212', // happy deep mouth outline
  'T': '#ffffff', // shiny teeth grin
  'C': '#1e293b', // classy dark jacket / charcoal shirt
  'B': '#eab308', // gold heavy neck chain / gangster chain details
  'W': '#f1f5f9', // high-contrast white shirt collar
};

export const NontDamPixelArt: React.FC<{ size?: number }> = ({ size = 80 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className="image-rendering-pixelated select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {NONT_DAM_PIXEL_SPRITE.map((row, y) => 
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

export const NontDamCard: React.FC<NontDamCardProps> = ({
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

  // Random funny Nont-Dam rapper quotes
  const funnyNontQuotes = [
    "โย่ว! แรปดุเดือดพ่นทองคำกระแทกหู! อ้ากกกกก! 🎤💥",
    "นนท์ดำพ่นแรปรัว ตับๆๆๆ หูเคลือบทองแดงไปเล้ย! 🤪🔥",
    "ชักเว่าแย่งวานนนน! แรปเปอร์ระดับตำนานพ่นไฟพลาสม่าล่าสอนเซอร์! 🎤💥",
    "ตูดใหญ่มุมตึก แรปลั่นด่านร้อยแปดสิบเดซิเบลลล! 📢✨",
    "ฟังแรปสั่นกลองหูขยี้! (ตะโกนท่อนฮุกใส่ไมค์ชำรุด!) 📣🤣"
  ];

  // Pixel shadow helper for font
  const pShadow = '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000';

  return (
    <motion.div
      whileHover={playable && hoverable ? { y: -16, scale: 1.07, rotateZ: 1 } : hoverable ? { y: -4 } : {}}
      whileTap={playable && onClick ? { scale: 0.95 } : {}}
      onClick={playable && onClick ? onClick : undefined}
      className={`
        ${selectedSizeClass} 
        relative bg-[#120b24] text-slate-100
        border-black flex flex-col items-center justify-between select-none overflow-hidden
        transition-all duration-300
        ${playable ? 'cursor-pointer ring-4 ring-yellow-400 font-mono shadow-[6px_6px_0px_#000]' : 'opacity-95 shadow-[4px_4px_0px_#000]'}
        ${isCurrentPlayMarker ? 'ring-4 ring-cyan-400' : ''}
      `}
      style={{
        imageRendering: 'pixelated',
        // Beveled pixel look
        borderTopColor: '#d8b4fe', // light purple
        borderLeftColor: '#d8b4fe',
        borderBottomColor: '#4c1d95', // deep purple
        borderRightColor: '#4c1d95',
      }}
    >
      {/* Glitchy scanline overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none z-10" 
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Cyber circuit purple grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1.5px,transparent_1.5px)] [background-size:6px_6px] opacity-20 pointer-events-none" />

      {/* Retro yellow pixel corner dots */}
      <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-400" />
      <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-400" />
      <div className="absolute bottom-1 left-1 w-1 h-1 bg-cyan-400" />
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-cyan-400" />

      {/* Badge Top Corner */}
      <div className="absolute top-1.5 left-2 flex items-center gap-0.5 text-yellow-400 font-mono font-black text-[8px] tracking-tight">
        <Sparkles size={8} className="text-yellow-400 mr-[2px]" />
        <span style={{ textShadow: pShadow }}>NONT-DAM</span>
      </div>

      <div className="absolute top-1.5 right-2 text-cyan-400 font-mono font-black text-[8px] italic" style={{ textShadow: pShadow }}>
        8-BIT
      </div>

      {/* Main visual - Pixel Art Nont-Dam Container */}
      <div className="my-auto flex flex-col items-center justify-center w-full z-10">
        {/* Glowing holographic blocky back-disk */}
        <div className="relative w-15 h-15 md:w-18 md:h-18 bg-[#1e1b29] border-2 border-yellow-500/80 flex items-center justify-center shadow-md overflow-visible rounded-none">
          {/* Internal cyber glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent animate-pulse" />
          
          <NontDamPixelArt size={size === 'sm' ? 44 : 52} />
        </div>

        {/* Nont Dam Card Text Details */}
        {size !== 'sm' && (
          <div className="text-center mt-1.5 w-full">
            <h4 className="font-mono font-extrabold text-[10px] md:text-[11px] text-yellow-400 tracking-tight flex items-center justify-center gap-0.5" style={{ textShadow: pShadow }}>
              ★ RAPPER 👑 ★
            </h4>
            
            {/* Retro RPG Stats block */}
            <div className="mt-1 bg-black/60 border border-purple-900 px-1 py-0.5 rounded-none inline-flex flex-col gap-[1px] text-[7.5px] font-mono font-bold text-slate-300 w-11/12 mx-auto leading-none">
              <div className="flex justify-between border-b border-purple-950/40 pb-[1.5px]">
                <span className="text-rose-400">RAP:</span>
                <span className="text-white">99</span>
              </div>
              <div className="flex justify-between border-b border-purple-950/40 py-[1.5px]">
                <span className="text-amber-400">ATK:</span>
                <span className="text-white">88</span>
              </div>
              <div className="flex justify-between pt-[1.5px]">
                <span className="text-cyan-400">NOISE:</span>
                <span className="text-white">120dB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info banner */}
      <div 
        className="w-full text-center bg-[#2e1065] border-t border-purple-900/60 py-0.5 text-[8px] md:text-[8.5px] font-black text-purple-300 tracking-wider font-mono uppercase"
        style={{ textShadow: '1px 1px 0px #000' }}
      >
        {size === 'sm' ? 'NONT' : '★ CLASSIC RAP ★'}
      </div>

      {/* Playable light flash indicators */}
      {playable && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 border border-black animate-ping" />
      )}
    </motion.div>
  );
};
