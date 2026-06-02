import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { NontDamCard } from './NontDamCard';
import { CardColor } from '../types';

interface LobbySlot {
  id: string;
  name: string;
  isBot: boolean;
  avatar: string;
  botId?: string;
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
    "\u{1F4E3} \u0E04\u0E32\u0E22\u0E17\u0E48\u0E2D\u0E19\u0E41\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E1A\u0E34\u0E14\u0E01\u0E23\u0E30\u0E14\u0E32\u0E19!",
    "\u{1F92A} \u0E22\u0E34\u0E48\u0E07\u0E41\u0E23\u0E1B\u0E22\u0E34\u0E48\u0E07\u0E23\u0E31\u0E27 \u0E15\u0E31\u0E1A\u0E46\u0E46 \u0E2B\u0E39\u0E15\u0E36\u0E07!",
    "\u{1F4E2} \u0E41\u0E27\u0E47\u0E01\u0E2A\u0E34\u0E2A\u0E34\u0E1A\u0E40\u0E14\u0E0B\u0E34\u0E40\u0E1A\u0E25 \u0E01\u0E38\u0E21\u0E02\u0E21\u0E31\u0E1A!",
    "\u{1F57A} \u0E2A\u0E25\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E1B\u0E48\u0E27\u0E19\u0E22\u0E31\u0E1A\u0E40\u0E22\u0E34\u0E19\u0E42\u0E22\u0E48\u0E27!"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto px-2"
    >
      {/* ====== LOGO ====== */}
      <div className="text-center mb-10 select-none">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block mb-3"
        >
          <div className="w-28 h-28 mx-auto rounded-[2rem] bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 flex items-center justify-center shadow-[0_12px_40px_rgba(251,146,60,0.35)] border-4 border-white/20">
            <span className="text-6xl drop-shadow-lg">{'\u{1F3B4}'}</span>
          </div>
        </motion.div>
        <h1 className="font-black text-4xl md:text-5xl bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-400 bg-clip-text text-transparent tracking-tight">
          MAM CARD
        </h1>
        <p className="text-slate-400 text-base mt-2 font-medium">
          {'\u0E40\u0E01\u0E21\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E38\u0E14\u0E21\u0E31\u0E19 \u0E40\u0E25\u0E48\u0E19\u0E07\u0E48\u0E32\u0E22 \u0E2A\u0E19\u0E38\u0E01\u0E17\u0E38\u0E01\u0E23\u0E2D\u0E1A! \u{1F525}'}
        </p>
      </div>

      {/* ====== STEP 1: Pick Mode ====== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shadow">1</div>
          <h2 className="text-base font-bold text-white">{'\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E2B\u0E21\u0E14\u0E40\u0E25\u0E48\u0E19'}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { mode: 'friends' as const, icon: '\u{1F46B}', label: '\u0E40\u0E25\u0E48\u0E19\u0E01\u0E31\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19', sub: '\u0E2A\u0E48\u0E07\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E27\u0E19\u0E40\u0E25\u0E48\u0E19\nPass & Play', color: 'blue' },
            { mode: 'classic' as const, icon: '\u{1F916}', label: '\u0E2A\u0E39\u0E49\u0E01\u0E31\u0E1A\u0E1A\u0E2D\u0E17', sub: '\u0E1D\u0E36\u0E01\u0E0B\u0E49\u0E2D\u0E21\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27\nVS AI 3 \u0E15\u0E31\u0E27', color: 'orange' },
            { mode: 'online_mock' as const, icon: '\u{1F310}', label: '\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C', sub: '\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E02\u0E49\u0E32\u0E23\u0E48\u0E27\u0E21\n\u0E40\u0E25\u0E48\u0E19\u0E1C\u0E48\u0E32\u0E19 Wi-Fi', color: 'emerald' },
          ]).map(({ mode, icon, label, sub, color }) => (
            <motion.button
              key={mode}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { playCardSound(); setLobbyMode(mode); }}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 text-center overflow-hidden ${
                lobbyMode === mode
                  ? `bg-gradient-to-b from-${color}-500/20 to-${color}-600/10 border-2 border-${color}-400 shadow-[0_0_20px_rgba(100,180,250,0.2)]`
                  : 'bg-white/[0.03] border-2 border-transparent hover:bg-white/[0.06] hover:border-white/10'
              }`}
              style={lobbyMode === mode ? {
                borderColor: color === 'blue' ? '#60a5fa' : color === 'orange' ? '#fb923c' : '#34d399',
                background: `linear-gradient(to bottom, ${color === 'blue' ? 'rgba(59,130,246,0.15)' : color === 'orange' ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)'}, transparent)`
              } : {}}
            >
              <div className="text-4xl mb-2">{icon}</div>
              <div className="font-bold text-white text-sm leading-tight">{label}</div>
              <div className="text-[10px] text-slate-400 mt-1.5 leading-snug whitespace-pre-line">{sub}</div>
              {lobbyMode === mode && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: color === 'blue' ? '#60a5fa' : color === 'orange' ? '#fb923c' : '#34d399' }}
                >
                  <span className="text-[10px] text-white font-black">{'\u2713'}</span>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ====== STEP 2: Setup ====== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xs font-black shadow">2</div>
          <h2 className="text-base font-bold text-white">
            {lobbyMode === 'friends' ? '\u0E08\u0E31\u0E14\u0E17\u0E35\u0E48\u0E19\u0E31\u0E48\u0E07' : lobbyMode === 'classic' ? '\u0E15\u0E31\u0E49\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19' : '\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E19'}
          </h2>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={lobbyMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-white/[0.04] rounded-2xl border border-white/8 p-5"
          >
            {/* Friends Mode */}
            {lobbyMode === 'friends' && (
              <div className="space-y-3">
                {lobbySlots.map((slot, sIdx) => {
                  const isMainUser = sIdx === 0;
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isMainUser
                          ? 'bg-blue-500/8 border border-blue-500/15'
                          : 'bg-white/[0.02] border border-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          playCardSound();
                          setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, avatar: cycleAvatar(s.avatar) } : s));
                        }}
                        className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl hover:bg-slate-700 transition cursor-pointer active:scale-90 border-2 border-white/10 hover:border-white/20 shrink-0"
                      >
                        {slot.avatar}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                          {isMainUser ? '\u2B50 \u0E17\u0E35\u0E48\u0E19\u0E31\u0E48\u0E07 1 (\u0E04\u0E38\u0E13)' : `\u0E17\u0E35\u0E48\u0E19\u0E31\u0E48\u0E07 ${sIdx + 1}`}
                        </div>
                        <input
                          type="text"
                          value={slot.name}
                          onChange={(e) => {
                            const val = e.target.value.slice(0, 14);
                            setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, name: val } : s));
                          }}
                          placeholder={`\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E40\u0E25\u0E48\u0E19 ${sIdx + 1}`}
                          className="w-full bg-slate-900/60 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-white font-semibold focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-slate-600"
                        />
                      </div>

                      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5 shrink-0">
                        <button
                          type="button"
                          onClick={() => { playCardSound(); setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, isBot: false } : s)); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !slot.isBot ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {'\u{1F464}'} {'\u0E04\u0E19'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { playCardSound(); setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, isBot: true, name: s.name.includes('\u{1F916}') ? s.name : s.name + ' \u{1F916}' } : s)); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            slot.isBot ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {'\u{1F916}'} {'\u0E1A\u0E2D\u0E17'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Classic Mode */}
            {lobbyMode === 'classic' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">{'\u{1F464}'} {'\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13'}</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value.slice(0, 15))}
                    placeholder={'\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19...'}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-orange-500/40 outline-none font-semibold placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-300 mb-2">{'\u{1F916}'} {'\u0E04\u0E39\u0E48\u0E41\u0E02\u0E48\u0E07\u0E1A\u0E2D\u0E17 AI'}</span>
                  <div className="flex gap-3">
                    {botProfiles.map((opp) => (
                      <div key={opp.id} className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-xl text-center hover:border-orange-500/20 transition">
                        <div className="text-3xl mb-1">{opp.avatar}</div>
                        <div className="text-xs font-bold text-white truncate">{opp.name}</div>
                        <div className="text-[9px] text-slate-500 mt-1 italic leading-tight">"{opp.quote}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Online Mode */}
            {lobbyMode === 'online_mock' && (
              <>
                {onlineRoomCode === null ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">👤 {'โปรไฟล์ (กดรูปเพื่อเปลี่ยน)'}</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            playCardSound();
                            setLobbySlots(prev => prev.map((s, idx) => idx === 0 ? { ...s, avatar: cycleAvatar(s.avatar) } : s));
                          }}
                          className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl hover:bg-slate-700 transition cursor-pointer active:scale-90 border-2 border-white/10 shrink-0"
                        >
                          {lobbySlots[0].avatar}
                        </button>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value.slice(0, 15))}
                          placeholder={'ใส่ชื่อเล่น...'}
                          className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-emerald-500/40 outline-none font-semibold placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">🌐 {'ที่อยู่เซิร์ฟเวอร์ WebSocket'}</label>
                      <input
                        type="text"
                        value={onlineServerAddr}
                        onChange={(e) => setOnlineServerAddr(e.target.value)}
                        placeholder="ตัวอย่าง: localhost:3001 หรือ ws://192.168.1.10:3001"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none font-mono placeholder:text-slate-600"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                        💡 {'เล่นบน Netlify: ต้องเปิดรันเซิร์ฟเวอร์ด้วยคำสั่ง node server.js ในเครื่องคอมพิวเตอร์ก่อน จากนั้นระบุ IP ของเครื่องหรือ localhost:3001 (หากเล่นเครื่องเดียวกัน)'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => connectWebSocket('create')}
                        disabled={isConnecting}
                        className="py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-black text-sm rounded-xl cursor-pointer transition shadow-lg flex items-center justify-center gap-2"
                      >
                        {isConnecting ? (
                          <><RefreshCw size={14} className="animate-spin" /> {'\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07...'}</>
                        ) : (
                          <><span className="text-xl">{'\u{1F3E0}'}</span> {'\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48'}</>
                        )}
                      </motion.button>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={roomCodeInput}
                          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                          placeholder={'\u0E23\u0E2B\u0E31\u0E2A'}
                          className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-lg font-mono font-black tracking-[0.3em] text-center focus:ring-2 focus:ring-emerald-500/40 outline-none placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (roomCodeInput.length !== 4) {
                              alert('\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A\u0E2B\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A 4 \u0E2B\u0E25\u0E31\u0E01 \u26A0\uFE0F');
                              return;
                            }
                            connectWebSocket('join', roomCodeInput);
                          }}
                          disabled={isConnecting || roomCodeInput.length !== 4}
                          className="px-4 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-black text-sm rounded-xl cursor-pointer transition shrink-0 disabled:opacity-30"
                        >
                          {'\u0E40\u0E02\u0E49\u0E32\u0E23\u0E48\u0E27\u0E21'}
                        </motion.button>
                      </div>
                    </div>

                    {onlineError && (
                      <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>{onlineError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-5 bg-gradient-to-b from-emerald-900/20 to-transparent border border-emerald-500/15 rounded-xl">
                      <div className="text-xs text-emerald-400/60 font-semibold uppercase tracking-widest mb-1">{'\u{1F511}'} {'\u0E23\u0E2B\u0E31\u0E2A\u0E2B\u0E49\u0E2D\u0E07'}</div>
                      <div className="text-4xl font-black text-emerald-300 tracking-[0.5em] font-mono select-all">{onlineRoomCode}</div>
                      <div className="text-xs text-slate-500 mt-2">{'\u0E1A\u0E2D\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19\u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E35\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E02\u0E49\u0E32\u0E23\u0E48\u0E27\u0E21!'}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-300 mb-2">{'\u{1F465}'} {'\u0E1C\u0E39\u0E49\u0E40\u0E25\u0E48\u0E19'} ({onlinePlayers.length}/4)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {onlinePlayers.map((player: any) => (
                          <div key={player.id} className="flex items-center gap-2.5 p-2.5 bg-slate-900/40 border border-white/5 rounded-xl">
                            <span className="text-xl">{player.avatar}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-white truncate">{player.name}</div>
                              <div className="text-[10px] text-slate-500">{player.isHost ? '\u{1F451} \u0E42\u0E2E\u0E2A\u0E15\u0E4C' : '\u{1F464} \u0E1C\u0E39\u0E49\u0E40\u0E25\u0E48\u0E19'}</div>
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: 4 - onlinePlayers.length }).map((_, i) => (
                          <div key={i} className="flex items-center justify-center p-2.5 border border-dashed border-white/8 rounded-xl text-sm text-slate-600 h-14">
                            <span className="animate-pulse">{'\u0E23\u0E2D\u0E1C\u0E39\u0E49\u0E40\u0E25\u0E48\u0E19...'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {onlineIsHost ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => wsRef.current?.send(JSON.stringify({ type: 'START_GAME' }))}
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-xl shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
                        >
                          <Play size={16} fill="currentColor" /> {'\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E01\u0E21!'}
                        </motion.button>
                      ) : (
                        <div className="text-center py-3.5 bg-slate-900/30 border border-dashed border-white/10 rounded-xl text-slate-400 text-sm font-semibold animate-pulse">
                          {'\u23F3'} {'\u0E23\u0E2D\u0E42\u0E2E\u0E2A\u0E15\u0E4C\u0E01\u0E14\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E01\u0E21...'}
                        </div>
                      )}
                      <button
                        onClick={disconnectWebSocket}
                        className="w-full py-2.5 text-red-400 hover:text-red-300 text-sm font-semibold cursor-pointer transition hover:bg-red-500/5 rounded-xl"
                      >
                        {'\u{1F6AA}'} {'\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E49\u0E2D\u0E07'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ====== STEP 3: Settings ====== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-black shadow">3</div>
          <h2 className="text-base font-bold text-white">{'\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E01\u0E21'}</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Speed */}
          <div className="bg-white/[0.04] rounded-2xl border border-white/8 p-4">
            <div className="text-xs font-semibold text-slate-400 mb-2.5">{'\u23F1\uFE0F'} {'\u0E04\u0E27\u0E32\u0E21\u0E40\u0E23\u0E47\u0E27'}</div>
            <div className="space-y-1.5">
              {[
                { name: '\u{1F422} \u0E0A\u0E34\u0E25\u0E46', ms: 1800 },
                { name: '\u{1F44D} \u0E1B\u0E01\u0E15\u0E34', ms: 1200 },
                { name: '\u26A1 \u0E40\u0E23\u0E47\u0E27', ms: 600 }
              ].map((spd) => (
                <button
                  key={spd.ms}
                  onClick={() => { playCardSound(); setGameSpeed(spd.ms); }}
                  className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    gameSpeed === spd.ms
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {spd.name}
                </button>
              ))}
            </div>
          </div>

          {/* Flip Mode */}
          <div className="bg-white/[0.04] rounded-2xl border border-white/8 p-4">
            <div className="text-xs font-semibold text-slate-400 mb-2.5">{'\u{1F300}'} {'\u0E42\u0E2B\u0E21\u0E14\u0E1E\u0E25\u0E34\u0E01'}</div>
            <div className="space-y-1.5">
              <button
                onClick={() => { playCardSound(); setIsFlipMode(false); }}
                className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  !isFlipMode ? 'bg-amber-500 text-white shadow-md' : 'bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {'\u{1F0CF}'} {'\u0E1B\u0E01\u0E15\u0E34'}
              </button>
              <button
                onClick={() => { playCardSound(); setIsFlipMode(true); }}
                className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  isFlipMode ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' : 'bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {'\u{1F300}'} Flip
              </button>
              <div className="text-[9px] text-slate-600 text-center pt-0.5">{'\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E25\u0E31\u0E07!'}</div>
            </div>
          </div>

          {/* Card Theme */}
          <div className="bg-white/[0.04] rounded-2xl border border-white/8 p-4">
            <div className="text-xs font-semibold text-slate-400 mb-2.5">{'\u{1F3A8}'} {'\u0E18\u0E35\u0E21\u0E01\u0E32\u0E23\u0E4C\u0E14'}</div>
            <div className="space-y-1.5">
              <button
                onClick={() => { playCardSound(); setCardTheme('pixel'); }}
                className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  cardTheme === 'pixel' ? 'bg-orange-500 text-white shadow-md' : 'bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {'\u{1F47E}'} {'\u0E1E\u0E34\u0E01\u0E40\u0E0B\u0E25\u0E2D\u0E32\u0E23\u0E4C\u0E15'}
              </button>
              <button
                onClick={() => { playCardSound(); setCardTheme('neon'); }}
                className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  cardTheme === 'neon' ? 'bg-cyan-500 text-white shadow-md' : 'bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {'\u26A1'} {'\u0E19\u0E35\u0E2D\u0E2D\u0E19'}
              </button>
              <div className="text-[9px] text-slate-600 text-center pt-0.5">{'\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E32\u0E01\u0E32\u0E23\u0E4C\u0E14'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== START BUTTON ====== */}
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleMainStartMatch}
        className="w-full py-5 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 hover:from-pink-400 hover:via-orange-400 hover:to-yellow-400 shadow-[0_10px_40px_rgba(251,146,60,0.3)] hover:shadow-[0_14px_50px_rgba(251,146,60,0.4)] transition-all cursor-pointer flex items-center justify-center gap-3 mb-6"
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.5 }}
          className="text-3xl"
        >
          {'\u{1F3AE}'}
        </motion.span>
        {'\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E01\u0E21!'}
      </motion.button>

      {/* ====== Bottom Info ====== */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Nont-Dam card */}
        <button
          type="button"
          onClick={() => {
            playNontDamSound();
            setShowcaseQuoteIndex((prev) => (prev + 1) % 5);
          }}
          className="bg-purple-500/8 border border-purple-500/15 rounded-2xl p-4 cursor-pointer hover:bg-purple-500/12 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{'\u{1F451}'}</span>
            <div>
              <div className="text-xs font-bold text-purple-300">{'\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E19\u0E19\u0E17\u0E4C\u0E14\u0E33'}</div>
              <div className="text-[9px] text-slate-500">{'\u0E01\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1F\u0E31\u0E07\u0E40\u0E2A\u0E35\u0E22\u0E07!'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-all shrink-0">
              <NontDamCard
                card={{ id: 'preview-nont', color: 'wild' as CardColor, value: 'nont_dam' }}
                playable={true}
                hoverable={false}
                size="sm"
              />
            </div>
            <p className="text-[10px] text-purple-300/70 italic leading-relaxed flex-1">
              "{nontDamQuotes[showcaseQuoteIndex]}"
            </p>
          </div>
        </button>

        {/* How to play */}
        <button
          type="button"
          onClick={() => { playCardSound(); setShowHowTo(true); }}
          className="bg-amber-500/8 border border-amber-500/15 rounded-2xl p-4 cursor-pointer hover:bg-amber-500/12 transition-all text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{'\u{1F4D6}'}</span>
            <div>
              <div className="text-xs font-bold text-amber-300">{'\u0E27\u0E34\u0E18\u0E35\u0E40\u0E25\u0E48\u0E19 & \u0E01\u0E0E'}</div>
              <div className="text-[9px] text-slate-500">{'\u0E01\u0E14\u0E14\u0E39\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E40\u0E15\u0E47\u0E21'}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-amber-400">{'\u2022'}</span> {'\u0E25\u0E07\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E35\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E48\u0E32\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19'}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-amber-400">{'\u2022'}</span> {'\u0E01\u0E32\u0E23\u0E4C\u0E14 Wild \u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E15\u0E25\u0E2D\u0E14'}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-amber-400">{'\u2022'}</span> {'\u0E40\u0E2B\u0E25\u0E37\u0E2D 1 \u0E43\u0E1A \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14 UNO!'}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-amber-400">{'\u2022'}</span> {'\u0E25\u0E07\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2B\u0E21\u0E14\u0E21\u0E37\u0E2D\u0E01\u0E48\u0E2D\u0E19\u0E0A\u0E19\u0E30!'}</div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
