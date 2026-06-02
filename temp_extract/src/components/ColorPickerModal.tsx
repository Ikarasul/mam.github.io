import React from 'react';
import { CardColor } from '../types';
import { motion } from 'motion/react';
import { playCardSound } from '../utils/audio';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelect: (color: Exclude<CardColor, 'wild'>) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onSelect }) => {
  if (!isOpen) return null;

  const choices: { color: Exclude<CardColor, 'wild'>; label: string; bg: string; border: string; text: string; hover: string; pulse: string }[] = [
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

        <div className="grid grid-cols-2 gap-4">
          {choices.map((choice) => (
            <motion.button
              key={choice.color}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(choice.color)}
              className={`
                ${choice.bg} ${choice.text} border-b-4 ${choice.border}
                flex flex-col items-center justify-center p-5 rounded-2xl
                font-bold text-base md:text-lg shadow-lg ${choice.hover} hover:shadow-xl
                transition-all duration-150 cursor-pointer focus:outline-none focus:ring-4 ${choice.pulse}
              `}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 mb-2 border border-white/10 flex items-center justify-center shadow-inner font-extrabold text-sm">
                A
              </div>
              {choice.label.split(' ')[0]}
            </motion.button>
          ))}
        </div>

        <p className="mt-6 text-xs text-stone-500 font-mono italic">
          แนะแนว: บอทคู่แข่งเดาทางยากขึ้นเมื่อคุณเลือกสีที่มีในการ์ดมือเยอะที่สุด!
        </p>
      </motion.div>
    </div>
  );
};
