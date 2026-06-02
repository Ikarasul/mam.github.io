import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertTriangle, Users, Globe, Play } from 'lucide-react';
import { NontDamCard } from './NontDamCard';
import { UnoCard } from './UnoCard';
import { CardColor } from '../types';

interface LobbySlot {
  id: string;
  name: string;
  isBot: boolean;
  avatar: string;
  botId?: string;
  enabled?: boolean;
}

interface BotProfile {
  id: string;
  name: string;
  avatar: string;
  desc: string;
  quote: string;
}

interface LobbyScreenProps {
  // State
  lobbyMode: 'classic' | 'friends' | 'online_mock';
  lobbySlots: LobbySlot[];
  userName: string;
  gameSpeed: number;
  isFlipMode: boolean;
  cardTheme: 'pixel' | 'neon';
  showcaseQuoteIndex: number;
  onlineRoomCode: string | null;
  onlinePlayerId: string | null;
  onlinePlayers: any[];
  onlineIsHost: boolean;
  roomCodeInput: string;
  onlineError: string | null;
  isConnecting: boolean;
  botProfiles: BotProfile[];
  onlineServerAddr: string;
  setOnlineServerAddr: (addr: string) => void;
  // Setters
  setLobbyMode: (mode: 'classic' | 'friends' | 'online_mock') => void;
  setLobbySlots: React.Dispatch<React.SetStateAction<LobbySlot[]>>;
  setUserName: (name: string) => void;
  setGameSpeed: (speed: number) => void;
  setIsFlipMode: (flip: boolean) => void;
  setCardTheme: (theme: 'pixel' | 'neon') => void;
  setShowcaseQuoteIndex: React.Dispatch<React.SetStateAction<number>>;
  setRoomCodeInput: (code: string) => void;
  setShowHowTo: (show: boolean) => void;
  // Actions
  playCardSound: () => void;
  playNontDamSound: () => void;
  connectWebSocket: (action: 'create' | 'join', codeToJoin?: string) => void;
  disconnectWebSocket: () => void;
  handleMainStartMatch: () => void;
  wsRef: React.RefObject<WebSocket | null>;
}

export function LobbyScreen(props: LobbyScreenProps) {
  const {
    lobbyMode, lobbySlots, userName, gameSpeed, isFlipMode, cardTheme,
    showcaseQuoteIndex, onlineRoomCode, onlinePlayers, onlineIsHost,
    roomCodeInput, onlineError, isConnecting, botProfiles,
    onlineServerAddr, setOnlineServerAddr,
    setLobbyMode, setLobbySlots, setUserName, setGameSpeed, setIsFlipMode,
    setCardTheme, setShowcaseQuoteIndex, setRoomCodeInput, setShowHowTo,
    playCardSound, playNontDamSound, connectWebSocket, disconnectWebSocket,
    handleMainStartMatch, wsRef
  } = props;

  const avatarList = ['\u{1F451}', '\u{1F60E}', '\u{1F921}', '\u{1F98A}', '\u{1F43C}', '\u{1F42E}', '\u{1F430}', '\u{1F984}', '\u{1F981}', '\u{1F438}', '\u{1F996}', '\u{1F47B}', '\u{1F47D}'];

  const cycleAvatar = (currentAvatar: string) => {
    const curIdx = avatarList.indexOf(currentAvatar);
    return avatarList[(curIdx + 1) % avatarList.length];
  };

  const nontDamQuotes = [
    "\u{1F3A4} \u0E41\u0E23\u0E1B\u0E40\u0E1B\u0E2D\u0E23\u0E4C\u0E04\u0E19\u0E14\u0E33\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E15\u0E2D\u0E01\u0E01\u0E49\u0E19\u0E1E\u0E25\u0E32\u0E2A\u0E21\u0E48\u0E32!",
    "\u{1F4E3} \u0E04\u0E32\u0E22\u0E17\u0E48\u0E2D\u0E19\u0E41\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E1B\u0E23\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E23\u0E30\u0E14\u0E32\u0E19!",
    "\u{1F92A} \u0E22\u0E34\u0E48\u0E07\u0E41\u0E23\u0E1B\u0E22\u0E34\u0E48\u0E07\u0E23\u0E31\u0E27 \u0E15\u0E31\u0E1A\u0E46\u0E46 \u0E2B\u0E39\u0E15\u0E36\u0E07!",
    "\u{1F4E2} \u0E41\u0E27\u0E47\u0E01\u0E2A\u0E34\u0E2A\u0E34\u0E1A\u0E40\u0E14\u0E0B\u0E34\u0E40\u0E1A\u0E25 \u0E01\u0E38\u0E21\u0E02\u0E21\u0E31\u0E1A!",
    "\u{1F57A} \u0E2A\u0E25\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E1B\u0E48\u0E27\u0E19\u0E22\u0E31\u0E1A\u0E40\u0E22\u0E34\u0E19\u0E42\u0E22\u0E48\u0E27!"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-4 pb-12"
    >
      {/* ====== HEADER ====== */}
      <div className="arcade-header mt-4">
        <div className="pixel-logo">
          <span className="text-6xl drop-shadow-md">🎴</span>
        </div>
        <h1 className="title-text text-3xl md:text-5xl">MAM CARD</h1>
        <p className="subtitle mt-2">ARCADE TERMINAL // V1.0</p>
      </div>

      {/* ========================================= */}
      {/* TIER 1: MODES & THEMES                      */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8 mb-8">
        
        {/* --- MODE SELECTOR --- */}
        <div className="md:col-span-8">
          <div className="arcade-step-title !bg-cyan-500/10 !border-cyan-400">
            <span className="arcade-step-num !text-cyan-400">01</span>
            <h2 className="arcade-step-text text-sm">เลือกโหมดการเล่น</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { mode: 'friends' as const, icon: <Users size={24} />, label: 'เล่นเครื่องเดียวกัน' },
              { mode: 'classic' as const, icon: <Play size={24} />, label: 'สู้กับบอท' },
              { mode: 'online_mock' as const, icon: <Globe size={24} />, label: 'ออนไลน์' },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => { playCardSound(); setLobbyMode(mode); }}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 border-2 transition-all rounded-xl ${
                  lobbyMode === mode 
                    ? 'border-rose-400 bg-rose-400/10 shadow-[0_0_15px_rgba(251,113,133,0.3)]' 
                    : 'border-slate-800/60 bg-[#161622] hover:border-slate-700'
                }`}
              >
                <div className={`${lobbyMode === mode ? 'text-rose-400' : 'text-slate-500'}`}>
                  {icon}
                </div>
                <div className={`font-mono font-bold text-xs tracking-wider ${lobbyMode === mode ? 'arcade-text-highlight' : 'text-slate-500'}`}>{label}</div>
                {lobbyMode === mode && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-rose-400 animate-ping rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* --- CARD THEME --- */}
        <div className="md:col-span-4">
          <div className="arcade-step-title !bg-purple-500/10 !border-purple-400">
            <span className="arcade-step-num !text-purple-400">02</span>
            <h2 className="arcade-step-text text-sm">รูปแบบการ์ด</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { playCardSound(); setCardTheme('pixel'); }}
              className={`flex flex-col items-center justify-center p-4 border-2 transition-all rounded-xl ${
                cardTheme === 'pixel' ? 'border-purple-400 bg-purple-400/10 shadow-[0_0_15px_rgba(192,132,252,0.3)]' : 'border-slate-800/60 bg-[#161622] hover:border-slate-700'
              }`}
            >
              <span className="text-3xl mb-2">👾</span>
              <span className={`font-bold text-[10px] ${cardTheme === 'pixel' ? 'arcade-text-highlight' : 'text-slate-500'}`}>พิกเซล</span>
            </button>
            <button
              onClick={() => { playCardSound(); setCardTheme('neon'); }}
              className={`flex flex-col items-center justify-center p-4 border-2 transition-all rounded-xl ${
                cardTheme === 'neon' ? 'border-sky-400 bg-sky-400/10 shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'border-slate-800/60 bg-[#161622] hover:border-slate-700'
              }`}
            >
              <span className="text-3xl mb-2">⚡</span>
              <span className={`font-bold text-[10px] ${cardTheme === 'neon' ? 'arcade-text-highlight' : 'text-slate-500'}`}>นีออน</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================= */}
      {/* TIER 2: ROSTER & SYSTEM CONFIG            */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        
        {/* --- LEFT: ROSTER --- */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="arcade-step-title !mb-0 !bg-purple-500/10 !border-purple-400">
            <span className="arcade-step-num !text-purple-400">03</span>
            <h2 className="arcade-step-text text-sm">
              {lobbyMode === 'friends' ? 'จัดทีมผู้เล่น' : lobbyMode === 'classic' ? 'ข้อมูลผู้ท้าชิง' : 'สถานีเชื่อมต่อ'}
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={lobbyMode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {/* --- FRIENDS MODE --- */}
              {lobbyMode === 'friends' && (
                <div className="arcade-panel flex flex-col gap-3">
                  {lobbySlots.map((slot, sIdx) => {
                    const isMainUser = sIdx === 0;
                    const isEnabled = slot.enabled !== false;
                    return (
                      <div key={slot.id} className={`arcade-slot ${isMainUser ? 'is-active' : ''} ${!isEnabled ? 'opacity-40 grayscale' : ''} !p-3`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isEnabled) return;
                            playCardSound();
                            setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, avatar: cycleAvatar(s.avatar) } : s));
                          }}
                          className="arcade-avatar-btn shrink-0"
                          title="เปลี่ยนรูป"
                          disabled={!isEnabled}
                        >
                          {slot.avatar}
                        </button>
                        <div className="flex-1 min-w-0">
                          <label className="arcade-label !mb-1 text-[8px] text-slate-500">
                            {isMainUser ? 'ผู้เล่นที่ 1 (คุณ)' : `ผู้เล่นที่ ${sIdx + 1}`}
                          </label>
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => {
                              if (!isEnabled) return;
                              const val = e.target.value.slice(0, 14);
                              setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, name: val } : s));
                            }}
                            placeholder="ใส่ชื่อผู้เล่น..."
                            className="arcade-input !py-1.5 !text-sm border-none"
                            disabled={!isEnabled}
                          />
                        </div>
                        <div className="arcade-toggle-group shrink-0 flex-col sm:flex-row !border-slate-700">
                          <button
                            type="button"
                            onClick={() => { playCardSound(); setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, isBot: false, enabled: true } : s)); }}
                            className={`arcade-toggle-btn !px-3 !py-2 ${isEnabled && !slot.isBot ? 'active' : ''}`}
                          >
                            คน
                          </button>
                          <button
                            type="button"
                            onClick={() => { playCardSound(); setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, isBot: true, enabled: true, name: s.name.includes('\u{1F916}') ? s.name : s.name + ' \u{1F916}' } : s)); }}
                            className={`arcade-toggle-btn !px-3 !py-2 ${isEnabled && slot.isBot ? '!bg-amber-500 !text-black' : ''}`}
                          >
                            AI
                          </button>
                          {!isMainUser && (
                            <button
                              type="button"
                              onClick={() => { playCardSound(); setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, enabled: false } : s)); }}
                              className={`arcade-toggle-btn !px-3 !py-2 ${!isEnabled ? '!bg-red-500 !text-white' : ''}`}
                            >
                              ปิด
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* --- CLASSIC MODE (VS AI) --- */}
              {lobbyMode === 'classic' && (
                <div className="arcade-panel flex flex-col gap-6">
                  <div className="arcade-slot is-active">
                    <button
                      type="button"
                      onClick={() => {
                        playCardSound();
                        setLobbySlots(prev => prev.map((s, idx) => idx === 0 ? { ...s, avatar: cycleAvatar(s.avatar) } : s));
                      }}
                      className="arcade-avatar-btn shrink-0"
                    >
                      {lobbySlots[0].avatar}
                    </button>
                    <div className="flex-1">
                      <label className="arcade-label">รหัสผู้ท้าชิง (ชื่อของคุณ)</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value.slice(0, 15))}
                        placeholder="ใส่ชื่อของคุณ..."
                        className="arcade-input border-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="arcade-label border-b-2 border-slate-800 pb-2 mb-4">คู่ต่อสู้ AI ของระบบ</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {botProfiles.map((opp) => (
                        <div key={opp.id} className="arcade-slot !flex-col !gap-2 !p-4 text-center border-dashed border-slate-700 bg-black/40">
                          <div className="text-4xl drop-shadow-md">{opp.avatar}</div>
                          <div className="font-bold text-[11px] text-red-400 truncate w-full tracking-wider font-mono">{opp.name}</div>
                          <div className="text-[8px] text-slate-500 italic leading-snug">"{opp.quote}"</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- ONLINE MODE --- */}
              {lobbyMode === 'online_mock' && (
                <div className="arcade-panel flex flex-col gap-6 min-h-[300px]">
                  {onlineRoomCode === null ? (
                    <>
                      {/* Offline State */}
                      <div className="arcade-slot is-active">
                        <button
                          type="button"
                          onClick={() => {
                            playCardSound();
                            setLobbySlots(prev => prev.map((s, idx) => idx === 0 ? { ...s, avatar: cycleAvatar(s.avatar) } : s));
                          }}
                          className="arcade-avatar-btn shrink-0"
                        >
                          {lobbySlots[0].avatar}
                        </button>
                        <div className="flex-1">
                          <label className="arcade-label">ชื่อผู้เล่นออนไลน์</label>
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value.slice(0, 15))}
                            placeholder="ใส่ชื่อของคุณ..."
                            className="arcade-input border-none"
                          />
                        </div>
                      </div>

                      <div className="p-4 border-2 border-slate-800 bg-black">
                        <label className="arcade-label !text-slate-500">ที่อยู่เซิร์ฟเวอร์ (IP)</label>
                        <input
                          type="text"
                          value={onlineServerAddr}
                          onChange={(e) => setOnlineServerAddr(e.target.value)}
                          placeholder="localhost:3001"
                          className="arcade-input !text-xs !p-2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {/* JOIN */}
                        <div className="p-4 border-2 border-cyan-900 bg-cyan-950/20 relative">
                          <label className="arcade-label !absolute -top-2.5 left-2 bg-[#0e0c0b] px-2 !text-cyan-400">เข้าร่วมห้อง</label>
                          <input
                            type="text"
                            value={roomCodeInput}
                            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                            placeholder="กรอกรหัส"
                            className="arcade-input !text-center tracking-[4px] mb-3 !bg-black"
                          />
                          <button
                            onClick={() => connectWebSocket('join', roomCodeInput)}
                            disabled={isConnecting || !roomCodeInput}
                            className="w-full py-2 bg-cyan-500 text-black font-black font-mono text-sm disabled:opacity-50 hover:bg-cyan-400"
                          >
                            CONNECT
                          </button>
                        </div>
                        {/* HOST */}
                        <div className="p-4 border-2 border-amber-900 bg-amber-950/20 relative flex flex-col justify-end">
                          <label className="arcade-label !absolute -top-2.5 left-2 bg-[#0e0c0b] px-2 !text-amber-400">สร้างห้องใหม่</label>
                          <button
                            onClick={() => connectWebSocket('create')}
                            disabled={isConnecting}
                            className="w-full py-4 bg-amber-500 text-black font-black font-mono text-sm disabled:opacity-50 hover:bg-amber-400"
                          >
                            HOST BATTLE
                          </button>
                        </div>
                      </div>
                      {onlineError && (
                        <div className="text-[10px] font-mono text-red-500 bg-red-950/40 p-2 border border-red-900 flex items-center gap-2">
                          <AlertTriangle size={14} /> {onlineError}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Connected State */}
                      <div className="flex justify-between items-center border-b-4 border-slate-800 pb-4">
                        <div>
                          <label className="arcade-label !text-emerald-400 animate-pulse">รหัสผ่านห้อง (ส่งให้เพื่อน)</label>
                          <div className="text-4xl font-black arcade-text-highlight tracking-[8px] font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                            {onlineRoomCode}
                          </div>
                        </div>
                        <button 
                          onClick={disconnectWebSocket} 
                          className="px-3 py-2 border-2 border-red-900 text-red-500 hover:bg-red-950 font-mono text-[10px] uppercase font-bold"
                        >
                          ออก
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                        {onlinePlayers.map((p: any) => (
                          <div key={p.id} className={`arcade-slot ${p.id.includes('player') ? 'is-active !border-emerald-500 !bg-emerald-500/10' : ''}`}>
                            <span className="text-3xl">{p.avatar}</span>
                            <span className="text-sm font-bold arcade-text-highlight truncate flex-1 font-mono">{p.name}</span>
                            {p.isHost && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 font-black uppercase">หัวห้อง</span>}
                          </div>
                        ))}
                        {[...Array(Math.max(0, 4 - onlinePlayers.length))].map((_, i) => (
                          <div key={`empty-${i}`} className="arcade-slot opacity-30 border-dashed border-slate-600">
                            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                            <span className="text-xs text-slate-500 font-bold uppercase font-mono tracking-widest">รอผู้เล่น...</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        {onlineIsHost ? (
                          <button
                            onClick={() => wsRef.current?.send(JSON.stringify({ type: 'START_GAME' }))}
                            className="arcade-btn-start !py-4"
                          >
                            เริ่มประลอง!
                          </button>
                        ) : (
                          <div className="text-center py-4 bg-slate-900/30 border-2 border-dashed border-slate-700 text-slate-400 text-xs font-mono font-bold animate-pulse">
                            กำลังรอหัวห้องกดเริ่มเกม...
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- RIGHT: SYSTEM SETTINGS --- */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="arcade-step-title !mb-0 !bg-indigo-500/10 !border-indigo-400">
            <span className="arcade-step-num !text-indigo-400">04</span>
            <h2 className="arcade-step-text text-sm">ตั้งค่าระบบเพิ่มเติม</h2>
          </div>
          
          <div className="arcade-panel flex flex-col gap-6">
            {/* Game Speed */}
            <div>
              <label className="arcade-label text-[9px] mb-2 flex justify-between">
                <span>ความเร็วเกม</span>
                <span className="text-slate-500">{gameSpeed === 1800 ? 'ช้า' : gameSpeed === 1200 ? 'ปกติ' : 'เร็วสุด'}</span>
              </label>
              <div className="arcade-toggle-group">
                <button onClick={() => { playCardSound(); setGameSpeed(1800); }} className={`arcade-toggle-btn !py-3 ${gameSpeed === 1800 ? 'active' : ''}`}>ช้า</button>
                <button onClick={() => { playCardSound(); setGameSpeed(1200); }} className={`arcade-toggle-btn !py-3 ${gameSpeed === 1200 ? 'active' : ''}`}>ปกติ</button>
                <button onClick={() => { playCardSound(); setGameSpeed(600); }} className={`arcade-toggle-btn !py-3 ${gameSpeed === 600 ? 'active' : ''}`}>เทอร์โบ</button>
              </div>
            </div>

            {/* Flip Mode */}
            <div>
              <label className="arcade-label text-[9px] mb-2">โหมดพลิกการ์ด (FLIP)</label>
              <div className="arcade-toggle-group">
                <button onClick={() => { playCardSound(); setIsFlipMode(false); }} className={`arcade-toggle-btn !py-3 ${!isFlipMode ? 'active' : ''}`}>ปิด</button>
                <button onClick={() => { playCardSound(); setIsFlipMode(true); }} className={`arcade-toggle-btn !py-3 ${isFlipMode ? 'active' : ''}`}>เปิด</button>
              </div>
            </div>
            
            {/* Start Button moved here to balance the right column */}
            <div className="mt-4">
              <button
                onClick={handleMainStartMatch}
                className="arcade-btn-start !py-5 !text-xl"
                disabled={lobbyMode === 'online_mock'} // Online mode uses its own start button
                style={{ opacity: lobbyMode === 'online_mock' ? 0.3 : 1, cursor: lobbyMode === 'online_mock' ? 'not-allowed' : 'pointer' }}
              >
                เริ่มประลอง!
              </button>
              {lobbyMode !== 'online_mock' && (
                <p className="text-center text-[8px] text-slate-600 mt-3 font-mono tracking-widest uppercase">
                  Insert coin to continue
                </p>
              )}
            </div>
          </div>
        </div>

      </div>


      {/* ========================================= */}
      {/* BOTTOM INFO CARDS                         */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t-2 border-slate-800/50">
        <button
          type="button"
          onClick={() => { playNontDamSound(); setShowcaseQuoteIndex((prev) => (prev + 1) % 5); }}
          className="arcade-panel !p-4 hover:border-purple-500 transition-colors text-left group flex items-start gap-4 overflow-hidden relative"
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full" />
          
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            className="shrink-0 relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] w-24 h-36 md:w-28 md:h-[10.5rem]"
          >
            {/* Front: Nont-Dam Card */}
            <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} className="absolute inset-0">
              <NontDamCard card={{ id: 'preview-nont', color: 'wild' as CardColor, value: 'nont_dam' }} playable={true} hoverable={false} size="md" />
            </div>
            {/* Back: Standard UNO Back */}
            <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="absolute inset-0">
              <UnoCard card={{ id: 'back-preview', color: 'red' as CardColor, value: '0' }} isBack={true} size="md" theme={cardTheme} />
            </div>
          </motion.div>

          <div className="relative z-10 flex-1 ml-2">
            <label className="arcade-label !text-purple-400 !mb-2 flex items-center gap-2">
              <span className="text-xl">👑</span> ข้อมูลการ์ดนนท์ดำ
            </label>
            <div className="space-y-1.5 mb-3 font-mono text-xs text-slate-300">
              <div className="flex gap-2 text-rose-300">ความสามารถหลัก: สุ่มเอฟเฟกต์ 1 ใน 3 อย่าง!</div>
              <div className="flex gap-2 pl-2"><span className="text-purple-500">1.</span> สลับการ์ดในมือกับคู่แข่ง 1 คน</div>
              <div className="flex gap-2 pl-2"><span className="text-purple-500">2.</span> หมุนเวียนการ์ดในมือของทุกคนรอบวง</div>
              <div className="flex gap-2 pl-2"><span className="text-purple-500">3.</span> แรปว้ากให้คนถัดไปจั่ว 3 ใบ + ข้ามตา!</div>
              <div className="flex gap-2 text-cyan-300">★ บังคับเปลี่ยนสีหลักเสมอ (Wild)</div>
            </div>
            <p className="text-xs text-purple-400/80 italic leading-relaxed font-mono border-t border-purple-900/50 pt-2.5">
              "{nontDamQuotes[showcaseQuoteIndex]}"
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { playCardSound(); setShowHowTo(true); }}
          className="arcade-panel !p-4 hover:border-amber-500 transition-colors text-left"
        >
          <label className="arcade-label !text-amber-400 !mb-2 flex items-center gap-2">
            <span className="text-lg">📖</span> กติกาการประลอง
          </label>
          <div className="space-y-1.5 font-mono text-[9px] text-slate-400 uppercase">
            <div className="flex gap-2"><span className="text-amber-500">▶</span> วางสีหรือตัวเลขให้ตรงกัน</div>
            <div className="flex gap-2"><span className="text-amber-500">▶</span> การ์ด Wild ใช้เปลี่ยนสีได้ตลอด</div>
            <div className="flex gap-2"><span className="text-amber-500">▶</span> เหลือใบสุดท้ายต้องกด อีอ้อ!</div>
            <div className="flex gap-2"><span className="text-amber-500">▶</span> ไพ่หมดมือคนแรกคือผู้ชนะ</div>
          </div>
        </button>
      </div>

    </motion.div>
  );
}
