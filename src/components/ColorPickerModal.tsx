import React from 'react';
import { CardColor } from '../types';
import { motion } from 'motion/react';
import { playCardSound } from '../utils/audio';
import { UnoCard } from './UnoCard';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelect: (color: Exclude<CardColor, 'wild'>) => void;
  flipSide?: 'light' | 'dark';
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onSelect, flipSide = 'light' }) => {
  if (!isOpen) return null;

  const isDark = flipSide === 'dark';

  const choices: { color: Exclude<CardColor, 'wild'>; label: string; bg: string; border: string; text: string; hover: string; pulse: string }[] = isDark ? [
    { 
      color: 'red', 
      label: 'สีชมพู (Pink)', 
      bg: 'bg-[#f43f5e] hover:bg-rose-600', 
      border: 'border-rose-400',
      text: 'text-white', 
      hover: 'shadow-rose-500/50',
      pulse: 'ring-rose-400'
    },
    { 
      color: 'blue', 
      label: 'สีเขียวน้ำทะเล (Teal)', 
      bg: 'bg-[#06b6d4] hover:bg-cyan-600', 
      border: 'border-cyan-400',
      text: 'text-white', 
      hover: 'shadow-cyan-500/50',
      pulse: 'ring-cyan-400'
    },
    { 
      color: 'green', 
      label: 'สีม่วง (Purple)', 
      bg: 'bg-[#a855f7] hover:bg-purple-600', 
      border: 'border-purple-400',
      text: 'text-white', 
      hover: 'shadow-purple-500/50',
      pulse: 'ring-purple-400'
    },
    { 
      color: 'yellow', 
      label: 'สีส้ม (Orange)', 
      bg: 'bg-[#f97316] hover:bg-orange-600', 
      border: 'border-orange-400',
      text: 'text-white', 
      hover: 'shadow-orange-500/50',
      pulse: 'ring-orange-400'
    },
  ] : [
    { 
      color: 'red', 
      label: 'สีแดง (Red)', 
      bg: 'bg-red-500 hover:bg-red-600', 
      border: 'border-red-400',
      text: 'text-white', 
      hover: 'shadow-red-500/50',
      pulse: 'ring-red-400'
    },
    { 
      color: 'blue', 
      label: 'สีน้ำเงิน (Blue)', 
      bg: 'bg-blue-500 hover:bg-blue-600', 
      border: 'border-blue-400',
      text: 'text-white', 
      hover: 'shadow-blue-500/50',
      pulse: 'ring-blue-400'
    },
    { 
      color: 'green', 
      label: 'สีเขียว (Green)', 
      bg: 'bg-emerald-500 hover:bg-emerald-600', 
      border: 'border-emerald-400',
      text: 'text-white', 
      hover: 'shadow-emerald-500/50',
      pulse: 'ring-emerald-400'
    },
    { 
      color: 'yellow', 
      label: 'สีเหลือง (Yellow)', 
      bg: 'bg-amber-400 hover:bg-amber-500', 
      border: 'border-amber-300',
      text: 'text-stone-900', 
      hover: 'shadow-amber-400/50',
      pulse: 'ring-amber-300'
    },
  ];

  const handleSelect = (color: Exclude<CardColor, 'wild'>) => {
    playCardSound();
    onSelect(color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 p-6 md:p-8 text-center shadow-2xl z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-blue-500 to-yellow-500" />
        
        <h2 className="text-xl md:text-2xl font-black text-white tracking-wide mb-2">
          เลือกสีถัดไป 🎨
        </h2>
        
        <p className="text-stone-400 text-sm md:text-base mb-6">
          คุณเล่นการ์ดพิเศษ! เลือกสีที่คุณต้องการเปลี่ยนให้เป็นสีถัดไปในการเล่น
        </p>

        <div className="grid grid-cols-2 gap-6 justify-items-center">
          {choices.map((choice) => (
            <button
              key={choice.color}
              onClick={() => handleSelect(choice.color)}
              className="flex flex-col items-center gap-2.5 focus:outline-none group cursor-pointer"
            >
              <div className="transition-transform group-hover:scale-105 active:scale-95 duration-200">
                <UnoCard 
                  card={{ id: `picker-${choice.color}`, color: choice.color, value: 'A' as any }}
                  isBack={false}
                  size="md"
                  theme="pixel"
                  flipSide={flipSide}
                  hoverable={false}
                />
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-amber-400 transition-colors font-sans">
                {choice.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-stone-500 font-mono italic">
          แนะแนว: บอทคู่แข่งเดาทางยากขึ้นเมื่อคุณเลือกสีที่มีในการ์ดมือเยอะที่สุด!
        </p>
      </motion.div>
    </div>
  );
};
