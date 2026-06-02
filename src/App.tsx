/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardColor, CardValue, Player, GameLog, GameState } from './types';
import { generateDeck, shuffleDeck, isValidPlay, getCardColorClass, getCardColorNameThai, getCardValueThai, getCardColor, getCardValue } from './utils/unoLogic';
import { UnoCard } from './components/UnoCard';
import { ColorPickerModal } from './components/ColorPickerModal';
import { NontDamCard, NontDamPixelArt } from './components/NontDamCard';
import { LobbyScreen } from './components/LobbyScreen';
import { playCardSound, playDrawSound, playUnoSound, playWinSound, playAlertSound, toggleSound, isSoundEnabled, playNontDamSound } from './utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  Info, 
  Sparkles, 
  Compass, 
  User, 
  Bot, 
  Trophy, 
  Flame, 
  History, 
  Lightbulb, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Heart,
  Users,
  Globe,
  RefreshCw,
  Gamepad2
} from 'lucide-react';

// Pre-defined Bot Personalities
const BOT_PROFILES = [
  { id: 'bot-1', name: 'สมชาย 🤖', avatar: '🤖', desc: 'บอทสุขุมลงการ์ดอย่างมีหลักการ', quote: 'พึ่งโชคมากไปจะไม่ดีนะครับ' },
  { id: 'bot-2', name: 'สมศรี 🦊', avatar: '🦊', desc: 'บอทจ้าวแผนการ ชอบเก็บการ์ดพิเศษไว้ตัดหน้า', quote: 'อย่าเพิ่งคิดว่าจะชนะฉันได้ล่ะ!' },
  { id: 'bot-3', name: 'มานะ 🐼', avatar: '🐼', desc: 'บอทเจ้าสำราญ ชอบลงคอมโบป่วนเกมเสมอ', quote: 'จั่วการ์ดไปเยอะๆ เลยพวกเรา!' }
];

export default function App() {
  // Game Setup State
  const [userName, setUserName] = useState('นักเล่นการ์ดไร้พ่าย');
  const [gameSpeed, setGameSpeed] = useState<number>(1500); // ms delay
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [showcaseQuoteIndex, setShowcaseQuoteIndex] = useState<number>(0);
  const [isFlipMode, setIsFlipMode] = useState<boolean>(true); // Default to true so users see it immediately!
  const [cardTheme, setCardTheme] = useState<'pixel' | 'neon'>('pixel'); // Default to pixel art!

  // New Customizable Lobby Slots for 4 Players!
  const [lobbySlots, setLobbySlots] = useState([
    { id: 'player-1', name: 'คุณขี้โม้โอ้อวด 👑', isBot: false, avatar: '👑' },
    { id: 'player-2', name: 'สมชายสายแว้น 🏍️', isBot: true, avatar: '🤖', botId: 'bot-1' },
    { id: 'player-3', name: 'เจ๊สมศรีกลิ่นน้ำปลา 🦊', isBot: true, avatar: '🦊', botId: 'bot-2' },
    { id: 'player-4', name: 'มานะสายพี้ใบตอง 🐼', isBot: true, avatar: '🐼', botId: 'bot-3' },
  ]);

  // Selected lobby mode ('classic' or 'friends' or 'online_mock')
  const [lobbyMode, setLobbyMode] = useState<'classic' | 'friends' | 'online_mock'>('friends');

  // Interactive multiplayer Pass & Play cover overlay screen holder
  const [passCoverActivePlayer, setPassCoverActivePlayer] = useState<Player | null>(null);

  // Simulated online matchmaking state triggers
  const [onlineSearching, setOnlineSearching] = useState(false);
  const [onlineProgress, setOnlineProgress] = useState('');
  const [onlineStep, setOnlineStep] = useState(0);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    players: [],
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: 'red',
    activeValue: '0',
    status: 'setup',
    winnerId: null,
    logs: [],
    hasSaidUno: {},
    wildColorSelectionCard: null,
    flipModeEnabled: false,
    flipSide: 'light'
  });

  // Assistant states
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [thinkingBubble, setThinkingBubble] = useState<string | null>(null);
  const [unoButtonGlow, setUnoButtonGlow] = useState<boolean>(false);
  const [hasUserAnnouncedUnoThisTurn, setHasUserAnnouncedUnoThisTurn] = useState<boolean>(false);
  const [nontDamVisualEffect, setNontDamVisualEffect] = useState<{
    title: string;
    description: string;
    quote: string;
  } | null>(null);
  const [swappingAnimation, setSwappingAnimation] = useState<'clockwise' | 'counter-clockwise' | 'giver-to-receiver' | null>(null);
  const [swapParty, setSwapParty] = useState<{ giver: 'bottom' | 'left' | 'top' | 'right'; receiver: 'bottom' | 'left' | 'top' | 'right' } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  
  // Timer for user to declared UNO after down to 1 card
  const [unoDeclareWindow, setUnoDeclareWindow] = useState<{
    active: boolean;
    playerId: string;
    expiresAt: number;
  } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // Real WebSocket states
  const wsRef = useRef<WebSocket | null>(null);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [onlinePlayerId, setOnlinePlayerId] = useState<string | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [onlineIsHost, setOnlineIsHost] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const [onlineServerAddr, setOnlineServerAddr] = useState<string>(() => {
    const saved = localStorage.getItem('mam_card_server_addr');
    if (saved) return saved;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'localhost:3001' : 'mam-github-io.onrender.com';
  });

  const handleSetOnlineServerAddr = (addr: string) => {
    setOnlineServerAddr(addr);
    localStorage.setItem('mam_card_server_addr', addr);
  };

  // Close connection on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = (action: 'create' | 'join', codeToJoin?: string) => {
    setIsConnecting(true);
    setOnlineError(null);

    if (wsRef.current) {
      wsRef.current.close();
    }

    let serverAddr = onlineServerAddr.trim();
    if (!serverAddr.startsWith('ws://') && !serverAddr.startsWith('wss://')) {
      const isLocal = serverAddr.includes('localhost') || serverAddr.includes('127.0.0.1');
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const resolvedProtocol = isLocal ? 'ws://' : protocol;
      serverAddr = `${resolvedProtocol}${serverAddr}`;
    }

    const socket = new WebSocket(serverAddr);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
      if (action === 'create') {
        socket.send(JSON.stringify({
          type: 'CREATE_ROOM',
          payload: {
            hostName: userName,
            avatar: lobbySlots[0].avatar,
            isFlipMode: isFlipMode,
            cardTheme: cardTheme
          }
        }));
      } else if (action === 'join' && codeToJoin) {
        socket.send(JSON.stringify({
          type: 'JOIN_ROOM',
          payload: {
            roomCode: codeToJoin,
            playerName: userName,
            avatar: lobbySlots[0].avatar
          }
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        switch (type) {
          case 'ROOM_CREATED': {
            setOnlineRoomCode(payload.roomCode);
            setOnlinePlayerId(payload.playerId);
            setOnlinePlayers(payload.players);
            setOnlineIsHost(true);
            setIsConnecting(false);
            break;
          }
          case 'ROOM_UPDATED': {
            setOnlinePlayers(payload.players);
            break;
          }
          case 'JOIN_SUCCESS': {
            setOnlineRoomCode(payload.roomCode);
            setOnlinePlayerId(payload.playerId);
            setOnlinePlayers(payload.players);
            setOnlineIsHost(false);
            setIsConnecting(false);
            break;
          }
          case 'GAME_STATE_UPDATED': {
            const prevActiveId = gameState.discardPile[0]?.id;
            const newActiveCard = payload.discardPile[0];
            const newActiveId = newActiveCard?.id;
            const cardValue = (payload.flipSide === 'dark' && newActiveCard?.darkValue) 
              ? newActiveCard.darkValue 
              : newActiveCard?.value;

            if (newActiveId && newActiveId !== prevActiveId && cardValue === 'nont_dam') {
              playNontDamSound();
              const lastLog = payload.logs[payload.logs.length - 1];
              let title = "🎤 แรปเปอร์นนท์ดำอาละวาด!";
              let description = lastLog ? lastLog.message : "นนท์ดำใช้การ์ดความสามารถพิเศษป่วนทั้งกระดาน!";
              let quote = "โย่ว! แรปดุเดือดพ่นทองคำกระแทกหู! อ้ากกกกก! 🎤💥";

              if (lastLog?.message.includes("180 เดซิเบล")) {
                title = "📢 ไมค์ทองคำว้าก 180 เดซิเบล";
                quote = "ตูดใหญ่มุมตึก แรปลั่นด่านร้อยแปดสิบเดซิเบลลล! 📢✨";
              } else if (lastLog?.message.includes("สลับแลก") || lastLog?.message.includes("สับสน")) {
                title = "🎤 ไซเฟอร์แรปสลับม้วนตลบ";
                quote = "โย่ว! แรปดุเดือดพ่นทองคำกระแทกหู! อ้ากกกกก! 🎤💥";
              } else if (lastLog?.message.includes("สร้อยทอง") || lastLog?.message.includes("อวดรวย")) {
                title = "🪙 สร้อยทองดงบัง Flex!";
                quote = "นนท์ดำพ่นแรปรัว ตับๆๆๆ หูเคลือบทองแดงไปเล้ย! 🤪🔥";
              } else if (lastLog?.message.includes("สเต็ป") || lastLog?.message.includes("สายย่อ")) {
                title = "🕺 สเต็ปย่อส่ายพุงสั่นสะเทือน";
                quote = "ชักเว่าแย่งวานนนน! แรปเปอร์ระดับตำนานพ่นไฟพลาสม่าล่าสอนเซอร์! 🎤💥";
              }

              setNontDamVisualEffect({ title, description, quote });
              setTimeout(() => {
                setNontDamVisualEffect(null);
              }, 4200);
            }

            setGameState({
              deck: Array.from({ length: payload.deckCount }, (_, i) => ({ id: `deck-${i}` } as Card)),
              discardPile: payload.discardPile,
              players: payload.players,
              currentPlayerIndex: payload.currentPlayerIndex,
              direction: payload.direction,
              activeColor: payload.activeColor,
              activeValue: payload.activeValue,
              status: payload.status,
              winnerId: payload.winnerId,
              logs: payload.logs,
              hasSaidUno: payload.hasSaidUno,
              wildColorSelectionCard: payload.wildColorSelectionCard,
              flipModeEnabled: payload.isFlipMode,
              flipSide: payload.flipSide
            });
            setIsFlipMode(payload.isFlipMode);
            setCardTheme(payload.cardTheme);
            break;
          }
          case 'ERROR': {
            setOnlineError(payload.message);
            setIsConnecting(false);
            if (wsRef.current) {
              wsRef.current.close();
            }
            break;
          }
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setOnlineRoomCode(null);
      setOnlinePlayerId(null);
      setOnlinePlayers([]);
      setOnlineIsHost(false);
      setIsConnecting(false);
    };

    socket.onerror = () => {
      setOnlineError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ WebSocket ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่ ❌');
      setIsConnecting(false);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setOnlineRoomCode(null);
    setOnlinePlayerId(null);
    setOnlinePlayers([]);
    setOnlineIsHost(false);
    setGameState(prev => ({ ...prev, status: 'setup' }));
  };


  // Handle Turn loop for Bots & Pass-and-Play Transitions
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    if (lobbyMode === 'online_mock') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    // Monitor if the user needs to say UNO or faced a penalty
    if (unoDeclareWindow && Date.now() > unoDeclareWindow.expiresAt) {
      // Challenge window expired. Check if someone should challenge!
      handleChallengeTimeout();
    }

    // Is it AI Bot's turn?
    if (currentPlayer.isBot) {
      setIsAiThinking(true);
      // Give them a funny saying!
      const botProfile = BOT_PROFILES.find(b => b.id === currentPlayer.id) || 
                         (currentPlayer.id.includes('bot-2') ? BOT_PROFILES[1] : 
                          currentPlayer.id.includes('bot-3') ? BOT_PROFILES[2] : BOT_PROFILES[0]);
      if (botProfile) {
        setThinkingBubble(botProfile.quote);
      } else {
        setThinkingBubble("ศึกนี้ข้าต้องขิงระเบิดสะเก็ดดาว!");
      }

      const timer = setTimeout(() => {
        executeBotTurn(currentPlayer);
      }, gameSpeed);

      return () => clearTimeout(timer);
    } else {
      setIsAiThinking(false);
      setThinkingBubble(null);
      // If user has 2 cards and plays 1, trigger glowing UNO button to alert them
      if (currentPlayer.cards.length === 2) {
        setUnoButtonGlow(true);
      } else {
        setUnoButtonGlow(false);
      }

      // Pass Cover screen for Multi-human games
      const numHumans = gameState.players.filter(p => !p.isBot).length;
      if (numHumans > 1) {
        setPassCoverActivePlayer(currentPlayer);
      }
    }
  }, [gameState.currentPlayerIndex, gameState.status]);

  // Helper: Append a new log
  const addLog = (message: string, type: GameLog['type'] = 'system') => {
    const newLog: GameLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      type
    };
    setGameState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog]
    }));
  };

  // Sound handler
  const handleToggleSound = () => {
    const isNowOn = toggleSound();
    setSoundOn(isNowOn);
  };

  // Setup / Initialize Game
  const startNewGame = () => {
    playCardSound();
    // 1. Generate standard deck and shuffle
    let newDeck = generateDeck(isFlipMode);
    newDeck = shuffleDeck(newDeck);

    // 2. Setup players based on lobby mode
    let allPlayers: Player[] = [];
    
    if (lobbyMode === 'friends') {
      allPlayers = lobbySlots.map((slot, index) => ({
        id: slot.id,
        name: slot.name || `แรปเปอร์เบอร์ #${index + 1}`,
        cards: [],
        isBot: slot.isBot,
        avatar: slot.avatar
      }));
    } else if (lobbyMode === 'online_mock') {
      allPlayers = [
        { id: 'player-1', name: userName || 'คุณแรปเปอร์หลักสิบ', cards: [], isBot: false, avatar: '👑' },
        { id: 'player-2', name: 'ดีเจตับอักเสบ 🎧', cards: [], isBot: true, avatar: '😎' },
        { id: 'player-3', name: 'ตู่_มอไซต์ซิ่ง 🏍️', cards: [], isBot: true, avatar: '🤡' },
        { id: 'player-4', name: 'เจ๊สมรกลิ่นปลาร้า 👩‍🍳', cards: [], isBot: true, avatar: '🦊' }
      ];
    } else {
      // Classic Mode
      const humanPlayer: Player = {
        id: 'player-1',
        name: userName || 'คุณ',
        cards: [],
        isBot: false,
        avatar: '👑'
      };
      const botPlayers: Player[] = BOT_PROFILES.map((profile, i) => ({
        id: `player-${i + 2}`,
        name: profile.name,
        cards: [],
        isBot: true,
        avatar: profile.avatar
      }));
      allPlayers = [humanPlayer, ...botPlayers];
    }

    // Deal cards sequentially
    for (let i = 0; i < 7; i++) {
      allPlayers.forEach(p => {
        const card = newDeck.pop();
        if (card) p.cards.push(card);
      });
    }

    // 3. Find first card for discard pile that is NOT wild/special/flip
    let startCardIndex = newDeck.findIndex(c => c.color !== 'wild' && c.value !== 'skip' && c.value !== 'reverse' && c.value !== 'draw2' && c.value !== 'flip');
    if (startCardIndex === -1) startCardIndex = 0; // Fallback
    
    const [startCard] = newDeck.splice(startCardIndex, 1);
    const initialDiscardPile = [startCard];

    // Reset Uno timers
    setUnoDeclareWindow(null);
    setHasUserAnnouncedUnoThisTurn(false);
    setPassCoverActivePlayer(null);

    // 4. Update GameState
    setGameState({
      deck: newDeck,
      discardPile: initialDiscardPile,
      players: allPlayers,
      currentPlayerIndex: 0, // First slot goes first
      direction: 1, // Clockwise
      activeColor: startCard.color,
      activeValue: startCard.value,
      status: 'playing',
      winnerId: null,
      logs: [],
      hasSaidUno: {},
      wildColorSelectionCard: null,
      flipModeEnabled: isFlipMode,
      flipSide: 'light'
    });

    addLog(`🎮 เกมใหม่เริ่มต้นแล้ว! ${allPlayers[0].name} เริ่มตาก่อนเพื่อน`, 'system');
    addLog(`🎬 การ์ดเริ่มต้นคือ [${getCardColorNameThai(startCard.color)} ${getCardValueThai(startCard.value)}]`, 'system');
  };

  const handleMainStartMatch = () => {
    if (lobbyMode === 'online_mock') {
      if (onlineRoomCode === null) {
        alert('กรุณาสร้างห้องหรือเข้าร่วมห้องก่อนเพื่อเล่นออนไลน์ ⚠️');
      } else if (onlineIsHost) {
        wsRef.current?.send(JSON.stringify({ type: 'START_GAME' }));
      } else {
        alert('เฉพาะหัวหน้าห้อง (Host) เท่านั้นที่สามารถกดเริ่มเกมได้ 🚫');
      }
    } else {
      startNewGame();
    }
  };

  const handleResetOrReplay = () => {
    if (lobbyMode === 'online_mock') {
      if (onlineIsHost) {
        if (window.confirm('คุณต้องการรีเซ็ตบอร์ดเกมและเริ่มกระดานใหม่ใช่หรือไม่?')) {
          wsRef.current?.send(JSON.stringify({ type: 'RESET_GAME' }));
        }
      } else {
        alert('เฉพาะหัวหน้าห้อง (Host) เท่านั้นที่สามารถรีเซ็ตเกมได้ 🚫');
      }
    } else {
      if (window.confirm('คุณต้องการรีเซ็ตบอร์ดเกมและเริ่มกระดานใหม่ใช่หรือไม่?')) {
        startNewGame();
      }
    }
  };

  const handleResignOrQuit = () => {
    if (lobbyMode === 'online_mock') {
      if (window.confirm('คุณต้องการออกจากห้องและกลับไปเมนูหลักใช่หรือไม่?')) {
        disconnectWebSocket();
      }
    } else {
      if (window.confirm('คุณต้องการยอมแพ้และกลับไปเมนูหลักใช่หรือไม่?')) {
        setGameState(prev => ({ ...prev, status: 'setup' }));
      }
    }
  };

  const handleReplayGame = () => {
    if (lobbyMode === 'online_mock') {
      if (onlineIsHost) {
        wsRef.current?.send(JSON.stringify({ type: 'RESET_GAME' }));
      } else {
        alert('เฉพาะหัวหน้าห้อง (Host) เท่านั้นที่สามารถเริ่มเล่นตาถัดไปได้ 🚫');
      }
    } else {
      startNewGame();
    }
  };

  const handleBackToHome = () => {
    if (lobbyMode === 'online_mock') {
      disconnectWebSocket();
    } else {
      setGameState(prev => ({ ...prev, status: 'setup' }));
    }
  };

  // Calculate Next Player index
  const getNextPlayerIndex = (currentIndex: number, dir: 1 | -1, step = 1): number => {
    return (currentIndex + step * dir + 4) % 4;
  };

  const playCard = (cardId: string, authorPlayerId: string, chosenWildColor?: Exclude<CardColor, 'wild'>) => {
    const activePlayer = gameState.players[gameState.currentPlayerIndex];
    if (!activePlayer || activePlayer.id !== authorPlayerId) return; // verification

    if (lobbyMode === 'online_mock') {
      const cardToPlay = activePlayer.cards.find(c => c.id === cardId);
      if (!cardToPlay) return;

      if (!isValidPlay(cardToPlay, gameState.activeColor, gameState.activeValue, gameState.flipSide)) {
        playAlertSound();
        return;
      }

      if (cardToPlay.color === 'wild') {
        setGameState(prev => ({
          ...prev,
          wildColorSelectionCard: cardToPlay
        }));
      } else {
        wsRef.current?.send(JSON.stringify({
          type: 'PLAY_CARD',
          payload: { cardId }
        }));
      }
      return;
    }

    const getPlayerPositionName = (playerId: string): 'bottom' | 'left' | 'top' | 'right' => {
      if (getPlayerAtPosition('bottom')?.id === playerId) return 'bottom';
      if (getPlayerAtPosition('left')?.id === playerId) return 'left';
      if (getPlayerAtPosition('top')?.id === playerId) return 'top';
      if (getPlayerAtPosition('right')?.id === playerId) return 'right';
      return 'bottom';
    };

    const cardToPlay = activePlayer.cards.find(c => c.id === cardId);
    if (!cardToPlay) return;

    // Perform validation
    if (!isValidPlay(cardToPlay, gameState.activeColor, gameState.activeValue, gameState.flipSide)) {
      playAlertSound();
      return;
    }

    if (getCardValue(cardToPlay, gameState.flipSide) === 'nont_dam') {
      playNontDamSound();
    } else {
      playCardSound();
    }

    // Check if player had exactly 2 cards, meaning they now have 1 card!
    const goingToHaveUno = activePlayer.cards.length === 2;
    const isHuman = !activePlayer.isBot;

    // Trigger Challenge window for Human
    if (goingToHaveUno) {
      if (isHuman) {
        if (!hasUserAnnouncedUnoThisTurn) {
          // Player didn't prepay "UNO". Give them 3 seconds to declare it!
          setUnoDeclareWindow({
            active: true,
            playerId: activePlayer.id,
            expiresAt: Date.now() + 3200
          });
        }
      } else {
        // AI always declares UNO instantly (95% of time, with funny style)
        const saidUno = Math.random() < 0.95;
        if (saidUno) {
          declareUno(activePlayer.id, true);
        }
      }
    }

    // Move card from player hand to discard pile
    const updatedCards = activePlayer.cards.filter(c => c.id !== cardId);

    // Modify active colors/values
    const currentColor = getCardColor(cardToPlay, gameState.flipSide);
    const currentValue = getCardValue(cardToPlay, gameState.flipSide);
    let nextColor = currentColor;
    let nextValue = currentValue;
    let turnDirection = gameState.direction;
    let logMessage = `${activePlayer.name} วางการ์ด [${getCardColorNameThai(currentColor)} ${getCardValueThai(currentValue)}]`;

    let step = 1;

    // Handle Special actions
    if (getCardValue(cardToPlay, gameState.flipSide) === 'reverse') {
      turnDirection = (gameState.direction === 1 ? -1 : 1) as 1 | -1;
      logMessage += ` 🔄 ย้อนทิศทางของเกม!`;
    }

    // Apply card-play state updates immediately to support wild selections
    const afterPlayPlayers = gameState.players.map(p => {
      if (p.id === authorPlayerId) {
        return { ...p, cards: updatedCards };
      }
      return p;
    });

    const currentDeck = [...gameState.deck];
    const popCardsFromLocalDeck = (count: number): Card[] => {
      const drawn: Card[] = [];
      for (let i = 0; i < count; i++) {
        const c = currentDeck.pop();
        if (c) drawn.push(c);
      }
      return drawn;
    };

    // Handle special chaotic effects of NONT-DAM card
    if (getCardValue(cardToPlay, gameState.flipSide) === 'nont_dam') {
      const effectIndex = Math.floor(Math.random() * 3); // 3 chaotic skill effects
      let effectTitle = "";
      let effectDesc = "";
      let effectQuote = "";

      if (effectIndex === 0) {
        // Swap all cards in hand with the opponent having fewest cards (or most if active player is lowest)
        const otherPlayers = afterPlayPlayers.filter(p => p.id !== activePlayer.id);
        let targetPlayer = otherPlayers[0];
        
        const activeCardsCount = afterPlayPlayers[gameState.currentPlayerIndex].cards.length;
        const isMinOverall = otherPlayers.every(p => p.cards.length >= activeCardsCount);
        
        if (isMinOverall) {
          let maxCards = -1;
          otherPlayers.forEach(p => {
            if (p.cards.length > maxCards) {
              maxCards = p.cards.length;
              targetPlayer = p;
            }
          });
        } else {
          let minCards = 999;
          otherPlayers.forEach(p => {
            if (p.cards.length < minCards) {
              minCards = p.cards.length;
              targetPlayer = p;
            }
          });
        }
        
        // Swap hands!
        const activeCards = [...afterPlayPlayers[gameState.currentPlayerIndex].cards];
        const targetCards = [...targetPlayer.cards];
        
        afterPlayPlayers[gameState.currentPlayerIndex].cards = targetCards;
        afterPlayPlayers.forEach(p => {
          if (p.id === targetPlayer.id) {
            p.cards = activeCards;
          }
        });
        
        logMessage += ` 🎤 นนท์ดำเปิดสกิลแรปร้ายกาจ! สั่งสลับการ์ดทั้งหมดในมือระหว่าง ${activePlayer.name} และ ${targetPlayer.name} สลับขั้วชะตากรรมอารีน่า!`;
        effectTitle = "🎤 แรปสะกดจิตสลับมือการ์ด";
        effectDesc = `สลับมือการ์ดทั้งหมดในมือของคุณ (${activePlayer.name}) กับผู้เล่นคู่แข่ง (${targetPlayer.name}) พลิกสถานการณ์ทันที!`;
        effectQuote = "โย่ว! สลับการ์ดทั้งมือไปเลยพวก! ชะตากรรมเปลี่ยนในพริบตา! 🎤💥";
        
        const activePos = getPlayerPositionName(activePlayer.id);
        const targetPos = getPlayerPositionName(targetPlayer.id);
        setSwapParty({ giver: activePos, receiver: targetPos });
        setSwappingAnimation('giver-to-receiver');
        setTimeout(() => {
          setSwappingAnimation(null);
          setSwapParty(null);
        }, 2000);
      } 
      else if (effectIndex === 1) {
        // Rotate all player hands in the current direction of play
        const hands = afterPlayPlayers.map(p => [...p.cards]);
        
        for (let i = 0; i < 4; i++) {
          const receiverIndex = (i + turnDirection + 4) % 4;
          afterPlayPlayers[receiverIndex].cards = hands[i];
        }
        
        logMessage += ` 🕺 นนท์ดำแรปเปอร์สายย่อสาดท่าเต้นหมุนพุงสะกดจิต! สลับมือการ์ดของทุกคนส่งเวียนวนต่อกันรอบวงแบทเทิล!`;
        effectTitle = "🕺 สเต็ปสลับมือเวียนรอบวง";
        effectDesc = `สลับมือการ์ดทั้งหมดของทุกคนเวียนส่งต่อไปยังเพื่อนข้าง ๆ ตามทิศทางทวน/ตามเข็มนาฬิกา!`;
        effectQuote = "ชักเว่าแย่งวานนนน! การ์ดบินสลับปลิวไปทั่วทั้งห้องแบทเทิล! 🎤💥";
        
        setSwappingAnimation(turnDirection === 1 ? 'clockwise' : 'counter-clockwise');
        setTimeout(() => setSwappingAnimation(null), 2000);
      } 
      else {
        // Toxic scream draws 3 for next player and skips their turn
        const victimIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection);
        const nextTargetPlayer = afterPlayPlayers[victimIndex];
        
        const drawnCards = popCardsFromLocalDeck(3);
        afterPlayPlayers[victimIndex].cards = [...nextTargetPlayer.cards, ...drawnCards];
        
        logMessage += ` 📢 นนท์ดำกระชากไมค์แรปว้ากเสียงแหลมสูงปรี๊ด 180 เดซิเบลใส่หน้า! ${nextTargetPlayer.name} หูอื้ออึึงจับจั่วการ์ดทำที่อุดหู 3 ใบและโดนข้ามตาไปทันที!`;
        step = 2;
        playDrawSound();
        effectTitle = "📢 ไมค์ทองคำว้าก 180 เดซิเบล";
        effectDesc = `${nextTargetPlayer.name} โดนแรปว้ากใส่หน้าแสบหูประสาทเสีย บังคับจั่วการ์ด 3 ใบและโดนข้ามตาทันที!`;
        effectQuote = "ตูดใหญุมุมตึก แรปลั่นด่านร้อยแปดสิบเดซิเบลลล! 📢✨";
      }

      setNontDamVisualEffect({
        title: effectTitle,
        description: effectDesc,
        quote: effectQuote
      });
      setTimeout(() => {
        setNontDamVisualEffect(null);
      }, 4200);
    }

    const finishNormalTurn = (specifiedColor: CardColor) => {
      let nextIndex = gameState.currentPlayerIndex;

      // Handle card actions that affect the NEXT player or game environment!
      if (getCardValue(cardToPlay, gameState.flipSide) === 'skip') {
        if (gameState.flipSide === 'dark') {
          logMessage += ` 🚫 [ข้ามแม่งทุกคน] มิติกระจกทำงาน! ข้ามตาผู้เล่นคนอื่นทั้งหมดจนสิทธิ์กลับมาที่ ${afterPlayPlayers[gameState.currentPlayerIndex].name} ได้เล่นต่ออีกตาเฉยเลย! ⚡`;
          step = 4; // Moves 4 steps, which returns to same player in a 4-player game
        } else {
          const skippedPlayer = afterPlayPlayers[getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection)];
          logMessage += ` 🚫 ข้ามตาของ ${skippedPlayer.name}!`;
          step = 2; // Jump 2 spaces
        }
      } 
      else if (getCardValue(cardToPlay, gameState.flipSide) === 'draw2') {
        const victimIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection);
        const nextTargetPlayer = afterPlayPlayers[victimIndex];
        const penaltyCount = gameState.flipSide === 'dark' ? 5 : 2;
        
        // Draw penaltyCount cards for them
        const drawnCards = popCardsFromLocalDeck(penaltyCount);
        
        afterPlayPlayers[victimIndex].cards = [...nextTargetPlayer.cards, ...drawnCards];
        logMessage += ` ➕${penaltyCount} โทษทัณฑ์แดนกระจก! ${nextTargetPlayer.name} โดนจับจั่วรวม ${penaltyCount} ใบและข้ามตาหัวร้อนจัด!`;
        step = 2; // Jump 2 spaces
        playDrawSound();
      }
      else if (getCardValue(cardToPlay, gameState.flipSide) === 'draw4') {
        const victimIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection);
        const nextTargetPlayer = afterPlayPlayers[victimIndex];
        const penaltyCount = gameState.flipSide === 'dark' ? 6 : 4;
        
        // Draw penaltyCount cards for them
        const drawnCards = popCardsFromLocalDeck(penaltyCount);
        
        afterPlayPlayers[victimIndex].cards = [...nextTargetPlayer.cards, ...drawnCards];
        logMessage += ` ☠️ โดนเปลี่ยนสี +${penaltyCount}! ${nextTargetPlayer.name} โดนจ้องตบจั่วเพิ่มเลเวลวิกฤต ${penaltyCount} ใบและถูกข้ามตา!`;
        step = 2; // Jump 2 spaces
        playDrawSound();
      }
      else if (getCardValue(cardToPlay, gameState.flipSide) === 'flip') {
        const nextSide = gameState.flipSide === 'light' ? 'dark' : 'light';
        logMessage += nextSide === 'dark'
          ? ` 🌀 ประตูมิติโลกกระจกเปิดออก! พลิกกระดานเข้าสู่ [มิติความมืดเรืองแสงนีออน]! การ์ดทุกใบได้อัปเกรดพลังบวกทวีคูณขั้นสยอง! 🌌👾`
          : ` 🌀 พลิกประตูมิติกระจกนำทางกลับเข้าสู่ [มิติแสงสว่างดั้งเดิม]! ทุกอย่างกลับคืนสู่สามัญ ☀️🌈`;
      }

      // Check Winner
      const winner = afterPlayPlayers.find(p => p.cards.length === 0);
      if (winner) {
        // We have a winner!
        playWinSound();
        addLog(logMessage, 'play');
        addLog(`🏆🎉 ${winner.name} การ์ดหมดเกลี้ยงมือ ชงชัยชนะแห่งดวลศึกอารีน่าครั้งนี้!`, 'win');
        
        setGameState(prev => ({
          ...prev,
          deck: currentDeck,
          players: afterPlayPlayers,
          discardPile: [cardToPlay, ...prev.discardPile],
          status: 'gameover',
          winnerId: winner.id
        }));
        return;
      }

      // Proceed to normal next turn
      nextIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection, step);

      setGameState(prev => {
        // Replenish deck from discard if low
        let finalDeck = currentDeck;
        if (finalDeck.length < 10) {
          const freshDeck = shuffleDeck(prev.discardPile.slice(1));
          finalDeck = [...finalDeck, ...freshDeck];
        }

        const nextFlipSide = getCardValue(cardToPlay, prev.flipSide) === 'flip' 
          ? (prev.flipSide === 'light' ? 'dark' : 'light') 
          : prev.flipSide;

        const resolvedActiveColor = getCardValue(cardToPlay, prev.flipSide) === 'flip'
          ? getCardColor(cardToPlay, nextFlipSide)
          : specifiedColor;

        const resolvedActiveValue = getCardValue(cardToPlay, prev.flipSide) === 'flip'
          ? getCardValue(cardToPlay, nextFlipSide)
          : nextValue;

        return {
          ...prev,
          deck: finalDeck,
          players: afterPlayPlayers,
          discardPile: [cardToPlay, ...prev.discardPile],
          activeColor: resolvedActiveColor,
          activeValue: resolvedActiveValue,
          direction: turnDirection,
          currentPlayerIndex: nextIndex,
          wildColorSelectionCard: null,
          flipSide: nextFlipSide
        };
      });

      addLog(logMessage, 'play');
      setHasUserAnnouncedUnoThisTurn(false);
    };

    // If played a wild or draw4, human must open picker, AI resolves instantly
    if (getCardValue(cardToPlay, gameState.flipSide) === 'nont_dam') {
      const colors: Exclude<CardColor, 'wild'>[] = ['red', 'blue', 'green', 'yellow'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      logMessage += ` 🎨 สุ่มเปลี่ยนสีหลักรอบถัดไปเป็น [${getCardColorNameThai(chosenColor)}]`;
      finishNormalTurn(chosenColor);
    } else if (cardToPlay.color === 'wild') {
      if (isHuman) {
        // Open modal
        setGameState(prev => ({
          ...prev,
          wildColorSelectionCard: cardToPlay,
          deck: currentDeck,
          // Just temporarily update hands so UI is clean, modal holds resolution
          players: afterPlayPlayers
        }));
      } else {
        // AI chooses the color it has the most of!
        const aiRemainingCards = updatedCards;
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        aiRemainingCards.forEach(c => {
          if (c.color !== 'wild') colorCounts[c.color]++;
        });
        
        let chosenColor: Exclude<CardColor, 'wild'> = 'red';
        let maxCount = -1;
        (Object.keys(colorCounts) as Exclude<CardColor, 'wild'>[]).forEach(col => {
          if (colorCounts[col] > maxCount) {
            maxCount = colorCounts[col];
            chosenColor = col;
          }
        });

        logMessage += ` 🎨 เปลี่ยนสีหลักให้กลายเป็น [${getCardColorNameThai(chosenColor)}]`;
        finishNormalTurn(chosenColor);
      }
    } else {
      finishNormalTurn(nextColor);
    }
  };

  // Challenge timer check when user forgot UNO
  const handleChallengeTimeout = () => {
    if (!unoDeclareWindow) return;
    const { playerId } = unoDeclareWindow;
    const player = gameState.players.find(p => p.id === playerId);
    
    if (player && player.cards.length === 1 && !gameState.hasSaidUno[playerId]) {
      // If none of Bots challenged, the timer just fades. But bots challenge 70% of times!
      const randomChallenge = Math.random() < 0.70;
      if (randomChallenge) {
        const botChallenger = gameState.players.filter(p => p.isBot)[Math.floor(Math.random() * 3)];
        
        playAlertSound();
        const { drawnCards, cleanDeck } = drawMultipleCards(gameState.deck, 2);
        
        const updatedPlayers = gameState.players.map(p => {
          if (p.id === playerId) {
            return { ...p, cards: [...p.cards, ...drawnCards] };
          }
          return p;
        });

        setGameState(prev => ({
          ...prev,
          deck: cleanDeck,
          players: updatedPlayers
        }));

        addLog(`🚨 ${botChallenger.name} ชี้หน้าจับกุมคุณ! "คุณลืมพูดว่า อีอ้อ!" โดยปรับให้จั่วการ์ดโทษ 2 ใบ!`, 'system');
      }
    }
    setUnoDeclareWindow(null);
  };

  // Draw multiple cards helper
  const drawMultipleCards = (sourceDeck: Card[], count: number): { drawnCards: Card[]; cleanDeck: Card[] } => {
    const drawnCards: Card[] = [];
    const deckCopy = [...sourceDeck];
    for (let i = 0; i < count; i++) {
      const c = deckCopy.pop();
      if (c) drawnCards.push(c);
    }
    return { drawnCards, cleanDeck: deckCopy };
  };

  // Declare UNO manually
  const declareUno = (playerId: string, automated = false) => {
    if (lobbyMode === 'online_mock') {
      playUnoSound();
      wsRef.current?.send(JSON.stringify({ type: 'DECLARE_UNO' }));
      setHasUserAnnouncedUnoThisTurn(true);
      setUnoButtonGlow(false);
      return;
    }

    playUnoSound();
    
    // Set declared status
    setGameState(prev => ({
      ...prev,
      hasSaidUno: {
        ...prev.hasSaidUno,
        [playerId]: true
      }
    }));

    const author = gameState.players.find(p => p.id === playerId);
    if (!author) return;

    if (automated) {
      addLog(`🔊 ${author.name} ตะโกนออกไมค์ดังๆ: "อีอ้อ! (การ์ดข้าพเจ้าเหลือใบเดียวเฟ้ยแกล้งสิวะ!)" 🌟`, 'uno');
    } else {
      addLog(`✨ คุณได้สติเตือนตัวเอง! ตะโกนลั่นห้อง: "อี อ้อ!!!" 🌟`, 'uno');
      setHasUserAnnouncedUnoThisTurn(true);
      setUnoButtonGlow(false);
      // Cancel active penalty timer if user announced in time
      if (unoDeclareWindow && unoDeclareWindow.playerId === playerId) {
        setUnoDeclareWindow(null);
      }
    }
  };

  // Humand Draw Card Action
  const handleUserDrawCard = () => {
    const activePlayer = gameState.players[gameState.currentPlayerIndex];
    if (!activePlayer || activePlayer.isBot || isAiThinking) return;

    if (lobbyMode === 'online_mock') {
      wsRef.current?.send(JSON.stringify({ type: 'DRAW_CARD' }));
      return;
    }

    playDrawSound();

    const deckCopy = [...gameState.deck];
    const drawnCard = deckCopy.pop();

    if (!drawnCard) {
      // Reconstitute pile
      addLog(`⚠️ การ์ดหมดกองจั่ว สับกองการ์ดใหม่!`, 'system');
      return;
    }

    const updatedPlayers = gameState.players.map((p, index) => {
      if (index === gameState.currentPlayerIndex) {
        return { ...p, cards: [...p.cards, drawnCard] };
      }
      return p;
    });

    const isPlayable = isValidPlay(drawnCard, gameState.activeColor, gameState.activeValue, gameState.flipSide);
    
    if (isPlayable) {
      addLog(`📥 ${activePlayer.name} จั่วได้การ์ด [${getCardColorNameThai(drawnCard.color)} ${getCardValueThai(drawnCard.value)}] และลงต่อได้ทันที!`, 'draw');
    } else {
      addLog(`📥 ${activePlayer.name} จั่วได้ระบม และไม่สามารถเล่นใบนั้นได้ ข้ามตาไปคนถัดไป`, 'draw');
    }

    setGameState(prev => {
      return {
        ...prev,
        deck: deckCopy,
        players: updatedPlayers,
        // If not playable, advance current turn, otherwise wait for player to click or decide
        currentPlayerIndex: isPlayable ? prev.currentPlayerIndex : getNextPlayerIndex(prev.currentPlayerIndex, prev.direction)
      };
    });
  };

  // Bot intelligence logic execution
  const executeBotTurn = (bot: Player) => {
    // 1. Separate cards into playable and unplayable
    const playableCards = bot.cards.filter(c => isValidPlay(c, gameState.activeColor, gameState.activeValue, gameState.flipSide));

    if (playableCards.length > 0) {
      // Strategize playing: Prioritize Action cards first if another bot has few cards, or prioritize color matches
      // Simple strategy: prefer colored action cards, then normal cards, save wildcards for defense
      let selectedCard = playableCards[0];

      // Find an action card of regular colors
      const coloredActions = playableCards.filter(c => getCardColor(c, gameState.flipSide) !== 'wild' && ['skip', 'reverse', 'draw2'].includes(getCardValue(c, gameState.flipSide)));
      const numbers = playableCards.filter(c => getCardColor(c, gameState.flipSide) !== 'wild' && !['skip', 'reverse', 'draw2'].includes(getCardValue(c, gameState.flipSide)));
      const wilds = playableCards.filter(c => getCardColor(c, gameState.flipSide) === 'wild');

      if (coloredActions.length > 0) {
        // play the action card to mess with competitor!
        selectedCard = coloredActions[Math.floor(Math.random() * coloredActions.length)];
      } else if (numbers.length > 0) {
        selectedCard = numbers[Math.floor(Math.random() * numbers.length)];
      } else if (wilds.length > 0) {
        selectedCard = wilds[Math.floor(Math.random() * wilds.length)];
      }

      playCard(selectedCard.id, bot.id);
    } else {
      // Draw card
      const deckCopy = [...gameState.deck];
      const drawnCard = deckCopy.pop();

      if (!drawnCard) {
        // Suffle pile
        return;
      }

      const updatedBotCards = [...bot.cards, drawnCard];
      const isPlayable = isValidPlay(drawnCard, gameState.activeColor, gameState.activeValue, gameState.flipSide);

      const modifiedPlayers = gameState.players.map(p => {
        if (p.id === bot.id) {
          return { ...p, cards: updatedBotCards };
        }
        return p;
      });

      if (isPlayable) {
        // Play it immediately
        setGameState(prev => ({
          ...prev,
          deck: deckCopy,
          players: modifiedPlayers
        }));
        // Play the card!
        setTimeout(() => {
          playCard(drawnCard.id, bot.id);
        }, 800);
      } else {
        // End of turn, pass
        const nextIdx = getNextPlayerIndex(gameState.currentPlayerIndex, gameState.direction);
        setGameState(prev => ({
          ...prev,
          deck: deckCopy,
          players: modifiedPlayers,
          currentPlayerIndex: nextIdx
        }));
        addLog(`📥 ${bot.name} ไม่มีการ์ดเล่น ต้องจั่ว 1 ใบและผ่านตา`, 'draw');
        playDrawSound();
      }
    }
  };

  // Color selection callback from dialog
  const handleResolveColorChoice = (selectedColor: Exclude<CardColor, 'wild'>) => {
    if (!gameState.wildColorSelectionCard) return;
    
    if (lobbyMode === 'online_mock') {
      wsRef.current?.send(JSON.stringify({
        type: 'PLAY_CARD',
        payload: {
          cardId: gameState.wildColorSelectionCard.id,
          chosenWildColor: selectedColor
        }
      }));
      setGameState(prev => ({
        ...prev,
        wildColorSelectionCard: null
      }));
      return;
    }

    const cardPlayed = gameState.wildColorSelectionCard;
    const activePlayer = gameState.players[gameState.currentPlayerIndex];
    if (!activePlayer) return;

    // Check if player had exactly 2 cards, and is down to 1
    const goingToHaveUno = activePlayer.cards.length === 2;
    if (goingToHaveUno && !hasUserAnnouncedUnoThisTurn) {
      setUnoDeclareWindow({
        active: true,
        playerId: activePlayer.id,
        expiresAt: Date.now() + 3200
      });
    }

    const updatedCards = activePlayer.cards.filter(c => c.id !== cardPlayed.id);
    let turnDirection = gameState.direction;
    const currentColor = getCardColor(cardPlayed, gameState.flipSide);
    const currentValue = getCardValue(cardPlayed, gameState.flipSide);
    let logMessage = `${activePlayer.name} เล่นการ์ด [${getCardColorNameThai(currentColor)} ${getCardValueThai(currentValue)}] 🎨 เลือกระบุสีถัดไปเป็น [${getCardColorNameThai(selectedColor)}]`;

    const afterPlayPlayers = gameState.players.map(p => {
      if (p.id === activePlayer.id) {
        return { ...p, cards: updatedCards };
      }
      return p;
    });

    const currentDeck = [...gameState.deck];
    let step = 1;

    if (getCardValue(cardPlayed, gameState.flipSide) === 'draw4') {
      const victimIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection);
      const nextTargetPlayer = afterPlayPlayers[victimIndex];
      
      const drawnCards: Card[] = [];
      for (let i = 0; i < 4; i++) {
        const c = currentDeck.pop();
        if (c) drawnCards.push(c);
      }

      afterPlayPlayers[victimIndex].cards = [...nextTargetPlayer.cards, ...drawnCards];
      logMessage += ` ☠️ โดน +4! ${nextTargetPlayer.name} ดักหน้าจั่ว 4 ใบหนักๆ และถูกข้ามตา!`;
      step = 2;
      playDrawSound();
    }

    // Winner verification
    const winner = afterPlayPlayers.find(p => p.cards.length === 0);
    if (winner) {
      playWinSound();
      addLog(logMessage, 'play');
      addLog(`🏆🎉 ${winner.name} การ์ดหมดเกลี้ยงมือแล้ว! รับชัยชนะอันงดงามไปครอง!`, 'win');
      
      setGameState(prev => ({
        ...prev,
        deck: currentDeck,
        players: afterPlayPlayers,
        discardPile: [cardPlayed, ...prev.discardPile],
        status: 'gameover',
        winnerId: winner.id,
        wildColorSelectionCard: null
      }));
      return;
    }

    const nextIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection, step);

    setGameState(prev => ({
      ...prev,
      deck: currentDeck,
      players: afterPlayPlayers,
      discardPile: [cardPlayed, ...prev.discardPile],
      activeColor: selectedColor,
      activeValue: getCardValue(cardPlayed, gameState.flipSide),
      currentPlayerIndex: nextIndex,
      wildColorSelectionCard: null
    }));

    addLog(logMessage, 'play');
    setHasUserAnnouncedUnoThisTurn(false);
  };

  const getDisplayedPlayer = (): Player | undefined => {
    if (gameState.players.length === 0) return undefined;
    if (lobbyMode === 'online_mock' && onlinePlayerId) {
      return gameState.players.find(p => p.id === onlinePlayerId) || gameState.players[0];
    }
    const activeP = gameState.players[gameState.currentPlayerIndex];
    if (activeP && !activeP.isBot) {
      return activeP;
    }
    const firstHuman = gameState.players.find(p => !p.isBot);
    return firstHuman || gameState.players[0];
  };

  // Helper to resolve card lists for both local and online privacy-mode players
  const getPlayerCards = (p: Player) => {
    if (p.cards && p.cards.length > 0) return p.cards;
    if (p.cardCount && p.cardCount > 0) {
      return Array.from({ length: p.cardCount }, (_, i) => ({ id: `dummy-${p.id}-${i}`, color: 'red', value: '0' } as Card));
    }
    return [];
  };

  // Helper to dynamically rotate player positions based on local player index
  const getPlayerAtPosition = (pos: 'bottom' | 'left' | 'top' | 'right'): Player | undefined => {
    if (gameState.players.length === 0) return undefined;
    const localIdx = gameState.players.findIndex(p => p.id === (lobbyMode === 'online_mock' ? onlinePlayerId : 'player-1'));
    const baseIdx = localIdx !== -1 ? localIdx : 0;
    
    let targetIdx = baseIdx;
    if (pos === 'left') targetIdx = (baseIdx + 1) % 4;
    else if (pos === 'top') targetIdx = (baseIdx + 2) % 4;
    else if (pos === 'right') targetIdx = (baseIdx + 3) % 4;
    
    return gameState.players[targetIdx];
  };

  // Helper to determine if it is the local human player's active turn
  const isLocalPlayerTurn = () => {
    if (gameState.players.length === 0) return false;
    if (lobbyMode === 'online_mock') {
      return gameState.players[gameState.currentPlayerIndex]?.id === onlinePlayerId;
    }
    return gameState.currentPlayerIndex === 0; // Local / Classic / VS AI modes use index 0
  };

  // Cheat or Helper: auto suggest playable cards
  const getPlayableCardCount = () => {
    const displayedP = getDisplayedPlayer();
    const userHand = displayedP?.cards || [];
    return userHand.filter(c => isValidPlay(c, gameState.activeColor, gameState.activeValue, gameState.flipSide)).length;
  };

  const renderMiniCard = (key: string, index: number, total: number, position: 'top' | 'left' | 'right', actualCard?: { id: string; color: string; value: string }) => {
    const center = (total - 1) / 2;
    const offset = index - center;
    const fanSpread = 6; // degrees between each card in the fan

    let transformStr = '';

    if (position === 'top') {
      // Top player: base 0deg (bottoms point down), fan spreads left-right
      const angle = offset * fanSpread;
      const transX = offset * 8;
      const transY = Math.abs(offset) * 1.5;
      transformStr = `translateX(${transX}px) translateY(${transY}px) rotateZ(${angle}deg)`;
    } else if (position === 'left') {
      // Left player: base 45deg — bottoms point lower-right ↘
      const angle = 45 + offset * fanSpread;
      const spreadAlong = offset * 8;
      transformStr = `rotateZ(${angle}deg) translateX(${spreadAlong}px) translateY(-12px)`;
    } else if (position === 'right') {
      // Right player: base -45deg — bottoms point lower-left ↙
      const angle = -45 + offset * fanSpread;
      const spreadAlong = offset * 8;
      transformStr = `rotateZ(${angle}deg) translateX(${spreadAlong}px) translateY(-12px)`;
    }


    // In flip mode (any side): show actual card face when real data exists
    // Normal mode: always show card back
    const isFlipMode = gameState.flipModeEnabled;
    const hasRealCard = actualCard && !actualCard.id.startsWith('dummy');
    const showFaceUp = isFlipMode && hasRealCard;

    const displayCard = showFaceUp
      ? { id: actualCard!.id, color: actualCard!.color as any, value: actualCard!.value as any }
      : { id: `fake-${key}`, color: 'red' as any, value: '0' as any };
    const showBack = !showFaceUp;

    // Bigger cards in flip mode so values are readable
    const cardScale = position === 'top'
      ? (isFlipMode ? 1.0 : 0.85)
      : (isFlipMode ? 0.82 : 0.65);
    const cardSize: 'sm' | 'md' | 'lg' = position === 'top' ? 'sm' : 'sm';

    return (
      <div 
        key={key}
        className="absolute transition-all duration-300 origin-bottom"
        style={{
          transform: `${transformStr} scale(${cardScale})`,
          zIndex: index,
        }}
      >
        <motion.div
          layoutId={actualCard && !actualCard.id.startsWith('dummy') ? `card-${actualCard.id}` : undefined}
          initial={
            position === 'top' ? { y: 250, scale: 0.2, opacity: 0 } :
            position === 'left' ? { x: 250, scale: 0.2, opacity: 0 } :
            { x: -250, scale: 0.2, opacity: 0 }
          }
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 150 }}
        >
          <UnoCard 
            card={displayCard}
            isBack={showBack} 
            size={cardSize} 
            theme={cardTheme} 
            flipSide={isFlipMode ? (gameState.flipSide === 'light' ? 'dark' : 'light') : gameState.flipSide}
            hoverable={false} 
          />
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans transition-colors duration-500 overflow-x-hidden select-none bg-slate-950 relative">
      {/* Ambient Background Radial Glow (Immersive UI) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_transparent_70%)]" />

      {/* Header bar controls */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1 font-black text-2xl tracking-tighter bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 bg-clip-text text-transparent italic">
            แหม่มการ์ด
          </div>
          <span className="hidden sm:inline bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-widest font-bold">
            IMMERSIVE CARD ARENA
          </span>
        </div>

        <div className="flex items-center gap-2">
          {gameState.status === 'playing' && (
            <>
              <button
                onClick={handleResetOrReplay}
                className="py-1.5 px-3 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-stone-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> รีเซ็ต
              </button>
              <button
                onClick={handleResignOrQuit}
                className="py-1.5 px-3 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-red-400 hover:text-red-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <AlertTriangle size={12} /> ยอมแพ้
              </button>
            </>
          )}

          <button
            onClick={handleToggleSound}
            className="p-2.5 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Sound toggle"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => setShowHowTo(true)}
            className="p-2.5 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="How to play"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className={`w-full max-w-[98vw] mx-auto p-3 flex flex-col items-center justify-center relative z-10 ${gameState.status === 'playing' ? 'h-[calc(100vh-75px)] max-h-[calc(100vh-75px)] overflow-hidden' : 'min-h-[calc(100vh-80px)]'}`}>
        
        {/* LANDING / SETUP SCREEN */}
        {gameState.status === 'setup' && (
          <LobbyScreen
            lobbyMode={lobbyMode}
            lobbySlots={lobbySlots}
            userName={userName}
            gameSpeed={gameSpeed}
            isFlipMode={isFlipMode}
            cardTheme={cardTheme}
            showcaseQuoteIndex={showcaseQuoteIndex}
            onlineRoomCode={onlineRoomCode}
            onlinePlayerId={onlinePlayerId}
            onlinePlayers={onlinePlayers}
            onlineIsHost={onlineIsHost}
            roomCodeInput={roomCodeInput}
            onlineError={onlineError}
            isConnecting={isConnecting}
            botProfiles={BOT_PROFILES}
            onlineServerAddr={onlineServerAddr}
            setOnlineServerAddr={handleSetOnlineServerAddr}
            setLobbyMode={setLobbyMode}
            setLobbySlots={setLobbySlots}
            setUserName={setUserName}
            setGameSpeed={setGameSpeed}
            setIsFlipMode={setIsFlipMode}
            setCardTheme={setCardTheme}
            setShowcaseQuoteIndex={setShowcaseQuoteIndex}
            setRoomCodeInput={setRoomCodeInput}
            setShowHowTo={setShowHowTo}
            playCardSound={playCardSound}
            playNontDamSound={playNontDamSound}
            connectWebSocket={connectWebSocket}
            disconnectWebSocket={disconnectWebSocket}
            handleMainStartMatch={handleMainStartMatch}
            wsRef={wsRef}
          />
        )}
        {/* ACTIVE GAMEBOARD */}
        {gameState.status === 'playing' && (
          <div className="w-full h-full max-h-full flex flex-col items-center overflow-hidden">
            
            {/* THE BIG GAME TABLE */}
            <div className={`w-full max-w-full flex-1 flex flex-col justify-between items-center relative rounded-3xl p-3 sm:p-5 border transition-all duration-1000 overflow-hidden ${
              nontDamVisualEffect ? 'animate-nont-shake animate-flash-purple' : ''
            } ${
              gameState.flipSide === 'dark' 
                ? 'border-purple-950/40 bg-radial from-[#150226] via-[#090012] to-[#010006] shadow-[0_25px_60px_-15px_rgba(168,85,247,0.25),inset_0_0_120px_rgba(0,0,0,0.95)]'
                : 'border-emerald-950/40 bg-radial from-[#2a6f53] via-[#1d4d3a] to-[#123024] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(0,0,0,0.6)]'
            }`}>
              
              {/* Floating Game Status Widget in Top Right */}
              <div className="absolute top-4 right-4 z-20 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-3 shadow-lg select-none">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm border border-yellow-400 shadow">
                    {gameState.players[gameState.currentPlayerIndex]?.avatar || '👤'}
                  </div>
                  {isAiThinking && (
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center animate-ping text-[6px]">
                      ●
                    </span>
                  )}
                </div>
                
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-amber-400 uppercase tracking-widest font-mono font-bold">
                      ตาที่ {gameState.logs.filter(l => l.type === 'play').length + 1}
                    </span>
                    <span className="text-[8px] text-stone-400 font-mono flex items-center gap-0.5">
                      {gameState.direction === 1 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {gameState.direction === 1 ? "ตามเข็ม" : "ทวนเข็ม"}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white block max-w-[80px] truncate">
                    {gameState.players[gameState.currentPlayerIndex]?.name || 'กำลังรอ...'}
                  </span>
                </div>
              </div>

              {/* Floating Collapsible Logs Widget in Top Left */}
              <div className="absolute top-4 left-4 z-20 flex flex-col items-start pointer-events-auto">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-stone-300 hover:text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-md select-none"
                >
                  <History size={11} className="text-cyan-400" />
                  Match Log {gameState.logs.length > 0 && `(${gameState.logs.length})`}
                </button>

                <AnimatePresence>
                  {showLogs && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 w-[260px] max-h-[220px] overflow-y-auto bg-slate-950/90 border border-white/10 rounded-2xl p-2.5 shadow-xl scrollbar-thin space-y-1.5"
                    >
                      {gameState.logs.length === 0 ? (
                        <div className="text-center text-[10px] text-stone-600 py-4">
                          ยังไม่มีความเคลื่อนไหว
                        </div>
                      ) : (
                        gameState.logs.slice().reverse().map((log) => {
                          let badgeBg = 'bg-stone-850 text-stone-400';
                          if (log.type === 'play') badgeBg = 'bg-blue-500/10 text-blue-400';
                          if (log.type === 'draw') badgeBg = 'bg-yellow-500/10 text-yellow-400';
                          if (log.type === 'uno') badgeBg = 'bg-red-500/10 text-red-500 animate-pulse';
                          if (log.type === 'win') badgeBg = 'bg-green-500/10 text-green-400';

                          return (
                            <div key={log.id} className="text-[10px] bg-white/5 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className={`text-[7px] font-bold px-1 rounded-sm ${badgeBg} uppercase font-mono`}>
                                  {log.type}
                                </span>
                                <span className="text-[7px] text-stone-500 font-mono">{log.timestamp}</span>
                              </div>
                              <p className="text-stone-300 font-medium leading-tight">{log.message}</p>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* ROTATING DIRECTION INDICATOR & VELVET GLOW */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none flex items-center justify-center">
                {/* Immersive UI Direction Dials */}
                <div className="absolute w-[450px] h-[450px] border border-dashed border-white/5 rounded-full flex items-center justify-center">
                  <div className={`w-[380px] h-[380px] border border-emerald-500/10 rounded-full ${gameState.direction === 1 ? 'animate-spin-slow' : 'animate-spin-slow-reverse'}`}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500/40" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500/40" />
                  </div>
                </div>
                {/* Velvet central light shadow */}
                <div className="absolute w-[380px] h-[380px] rounded-full bg-emerald-500/5 mix-blend-color-dodge blur-3xl" />
              </div>

              {/* TOP PLAYER */}
              {(() => {
                const topPlayer = getPlayerAtPosition('top');
                const topCards = topPlayer ? getPlayerCards(topPlayer) : [];
                const topActive = topPlayer && gameState.players[gameState.currentPlayerIndex]?.id === topPlayer.id;
                return (
                  <div className="z-10 text-center flex flex-col items-center">
                    {topPlayer && (
                      <PlayerPanel 
                        player={topPlayer} 
                        isActive={!!topActive} 
                        isThinking={isAiThinking && !!topActive}
                        bubbleText={thinkingBubble}
                        isWinner={false}
                      />
                    )}
                    {/* Top Player hand — fan pointing downward */}
                    <div 
                      className="relative h-24 w-64 mt-1 flex items-end justify-center overflow-visible"
                    >
                      {topCards.map((c, i) => 
                        renderMiniCard(`top-${c.id}`, i, topCards.length, 'top', c)
                      )}
                      {topPlayer && topCards.length === 0 && (
                        <span className="text-slate-500 text-xs absolute">ไม่มีการ์ด</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* MIDDLE ROW: BOTS 1 & 3 & DRAW/DISCARD AREA */}
              <div className="w-full flex items-center justify-between gap-4 my-auto z-10 py-6 middle-row">
                
                {/* LEFT PLAYER — avatar top-left, fan spreading inward ↘ */}
                {(() => {
                  const leftPlayer = getPlayerAtPosition('left');
                  const leftCards = leftPlayer ? getPlayerCards(leftPlayer) : [];
                  const leftActive = leftPlayer && gameState.players[gameState.currentPlayerIndex]?.id === leftPlayer.id;
                  return (
                    <div className="relative flex flex-col items-start" style={{ width: '130px', minHeight: '180px' }}>
                      {/* Avatar pinned to top-left */}
                      {leftPlayer && (
                        <PlayerPanel 
                            player={leftPlayer} 
                            isActive={!!leftActive} 
                            isThinking={isAiThinking && !!leftActive}
                            bubbleText={thinkingBubble}
                            isWinner={false}
                          />
                      )}
                      {/* Card fan — centred in the left column area */}
                      <div 
                        className="relative flex-1 w-full mt-2 flex items-center justify-center overflow-visible"
                        style={{ minHeight: '120px' }}
                      >
                        {leftCards.map((c, i) => 
                          renderMiniCard(`left-${c.id}`, i, leftCards.length, 'left', c)
                        )}
                        {leftPlayer && leftCards.length === 0 && (
                          <span className="text-slate-500 text-xs absolute">ไม่มีการ์ด</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* BOARD CENTER 3D TRAY / DISH (จานแนว 3D สำหรับวางไพ่) */}
                <div className="flex-1 flex items-center justify-center py-6 my-auto w-full z-10 board-dish-wrapper" style={{ perspective: '1200px' }}>
                  <div 
                    className={`relative w-full max-w-[530px] rounded-[50px] border transition-all duration-1000 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14 px-8 py-10 board-dish ${
                      gameState.flipSide === 'dark'
                        ? 'border-purple-500/20 bg-gradient-to-b from-[#120024] via-[#21003d] to-[#0a0014]'
                        : 'border-amber-500/20 bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#2d1002]'
                    }`}
                    style={{ 
                      transform: 'rotateX(22deg) rotateY(0deg) translateZ(0px)',
                      transformStyle: 'preserve-3d',
                      boxShadow: gameState.flipSide === 'dark'
                        ? 'inset 0 10px 40px rgba(0,0,0,0.95), 0 25px 65px rgba(0,0,0,0.85), 0 0 35px rgba(124,58,237,0.35)'
                        : 'inset 0 10px 40px rgba(0,0,0,0.95), 0 25px 65px rgba(0,0,0,0.85), 0 0 35px rgba(217,119,6,0.15)'
                    }}
                  >
                    {/* Inner felt recess of the 3D disk */}
                    <div className={`absolute inset-2.5 rounded-[42px] border border-white/5 pointer-events-none transition-all duration-1000 ${
                      gameState.flipSide === 'dark' 
                        ? 'bg-gradient-to-b from-[#0a0114] to-[#120124]'
                        : 'bg-gradient-to-b from-[#0a231c] to-[#123026]'
                    }`} style={{ boxShadow: 'inset 0 10px 24px rgba(0,0,0,0.9)' }} />

                    {/* Elite golden decorative motifs representing traditional luxury card play */}
                    <span className={`absolute top-3 left-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>
                    <span className={`absolute top-3 right-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>
                    <span className={`absolute bottom-3 left-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>
                    <span className={`absolute bottom-3 right-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>

                    {/* Flying Cards Animation Layer */}
                    {swappingAnimation && (
                      <div className="absolute inset-0 z-30 pointer-events-none overflow-visible flex items-center justify-center">
                        {(() => {
                          const positions = {
                            bottom: { x: 0, y: 190, rotate: 0 },
                            left: { x: -200, y: 0, rotate: 90 },
                            top: { x: 0, y: -190, rotate: 180 },
                            right: { x: 200, y: 0, rotate: -90 }
                          };

                          let paths: Array<{ from: { x: number; y: number; rotate: number }; to: { x: number; y: number; rotate: number }; delay: number }> = [];

                          if (swappingAnimation === 'clockwise') {
                            paths = [
                              { from: positions.bottom, to: positions.left, delay: 0 },
                              { from: positions.left, to: positions.top, delay: 0.15 },
                              { from: positions.top, to: positions.right, delay: 0.3 },
                              { from: positions.right, to: positions.bottom, delay: 0.45 }
                            ];
                          } else if (swappingAnimation === 'counter-clockwise') {
                            paths = [
                              { from: positions.bottom, to: positions.right, delay: 0 },
                              { from: positions.right, to: positions.top, delay: 0.15 },
                              { from: positions.top, to: positions.left, delay: 0.3 },
                              { from: positions.left, to: positions.bottom, delay: 0.45 }
                            ];
                          } else if (swappingAnimation === 'giver-to-receiver' && swapParty) {
                            const fromPos = positions[swapParty.giver] || positions.bottom;
                            const toPos = positions[swapParty.receiver] || positions.top;
                            paths = [
                              { from: fromPos, to: toPos, delay: 0 },
                              { from: fromPos, to: toPos, delay: 0.25 }
                            ];
                          }

                          return paths.map((path, idx) => (
                            <motion.div
                              key={`${swappingAnimation}-${idx}`}
                              initial={{ 
                                x: path.from.x, 
                                y: path.from.y, 
                                rotate: path.from.rotate,
                                opacity: 0,
                                scale: 0.6
                              }}
                              animate={{ 
                                x: path.to.x, 
                                y: path.to.y, 
                                rotate: path.to.rotate + 360,
                                opacity: [0, 1, 1, 0],
                                scale: [0.6, 1, 1, 0.6]
                              }}
                              transition={{
                                duration: 1.1,
                                delay: path.delay,
                                ease: "easeInOut"
                              }}
                              className="absolute w-12 h-18 bg-[#120b24] border border-purple-500 rounded-lg shadow-[0_0_12px_rgba(168,85,247,0.7)] flex items-center justify-center"
                              style={{ transformStyle: 'preserve-3d' }}
                            >
                              <div className="w-full h-full bg-gradient-to-br from-purple-700 to-indigo-950 flex items-center justify-center p-1 rounded-lg">
                                <div className="w-full h-full border border-purple-400/20 flex items-center justify-center bg-black/40 rounded-sm">
                                  <span className="text-[8px] text-yellow-400 font-mono font-bold">★</span>
                                </div>
                              </div>
                            </motion.div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* DRAW PILE */}
                    <div className="flex flex-col items-center gap-5 z-10" style={{ transform: 'translateZ(20px)' }}>
                      <span className="text-xs font-bold text-amber-200/90 tracking-wide font-sans bg-slate-950/80 border border-white/10 px-3 py-1 rounded-full shadow-md">
                        กองการ์ดจั่ว ({gameState.deck.length})
                      </span>
                      
                      <div className="relative group">
                        <button
                          onClick={handleUserDrawCard}
                          disabled={!isLocalPlayerTurn() || isAiThinking}
                          className={`group relative focus:outline-none transition-all active:scale-95 cursor-pointer block ${isLocalPlayerTurn() && !isAiThinking ? 'hover:scale-105' : ''}`}
                        >
                          <div className="absolute -bottom-1.5 -right-1.5 w-24 h-36 md:w-28 md:h-42 bg-slate-950 border border-slate-800/80 rounded-2xl shadow -z-20 transform translate-x-1.5 translate-y-1.5 opacity-90" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-24 h-36 md:w-28 md:h-42 bg-slate-900 border border-slate-800/90 rounded-2xl shadow -z-10 transform translate-x-0.5 translate-y-0.5" />
                          
                          {(() => {
                             const isFlipMode = gameState.flipModeEnabled;
                             const nextCard = isFlipMode && gameState.deck.length > 0
                               ? gameState.deck[gameState.deck.length - 1]
                               : null;
                             
                             if (nextCard) {
                               return (
                                 <UnoCard 
                                   card={nextCard} 
                                   isBack={false} 
                                   hoverable={isLocalPlayerTurn() && !isAiThinking}
                                   playable={isLocalPlayerTurn() && !isAiThinking} 
                                   size="md"
                                   flipSide={gameState.flipSide === 'light' ? 'dark' : 'light'}
                                   theme={cardTheme}
                                 />
                               );
                             }
                             
                             return (
                               <UnoCard 
                                 card={{ id: 'fake-draw', color: 'red', value: '0' }} 
                                 isBack 
                                 hoverable={isLocalPlayerTurn() && !isAiThinking}
                                 playable={isLocalPlayerTurn() && !isAiThinking} 
                                 size="md"
                                 flipSide={gameState.flipSide}
                                 theme={cardTheme}
                               />
                             );
                           })()}
                        </button>

                        {isLocalPlayerTurn() && !isAiThinking && (
                          <div className="absolute -top-3.5 -right-3.5 bg-red-600 text-white font-black px-2.5 py-1 text-[9px] tracking-widest rounded-full shadow-lg border border-white/20 animate-bounce">
                            DRAW CARD!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DISCARD PILE */}
                    <div className="flex flex-col items-center gap-5 z-10" style={{ transform: 'translateZ(20px)' }}>
                      <span className="text-xs font-bold text-amber-200/90 tracking-wide font-sans bg-slate-950/80 border border-white/10 px-3 py-1 rounded-full shadow-md justify-center flex items-center gap-1.5 font-mono">
                        การ์ดบนโต๊ะ 
                        <span className="flex items-center gap-1 bg-white/10 border border-white/5 px-2 py-0.5 rounded-full text-zinc-300 font-bold font-sans text-[10px]">
                          {gameState.direction === 1 ? <TrendingUp size={10} className="text-emerald-400" /> : <TrendingDown size={10} className="text-yellow-400" />}
                          {gameState.direction === 1 ? "ตามเข็ม" : "ทวนเข็ม"}
                        </span>
                      </span>

                      <div className="relative">
                        {gameState.discardPile.length > 0 ? (
                          <div className="relative">
                            {/* Active card matching layout border glow */}
                            <div className={`p-1 rounded-2xl transition-all duration-500 ${
                              gameState.activeColor === 'red' ? 'shadow-[0_0_35px_rgba(239,68,68,0.55)]' :
                              gameState.activeColor === 'blue' ? 'shadow-[0_0_35px_rgba(34,211,238,0.55)]' :
                              gameState.activeColor === 'green' ? 'shadow-[0_0_35px_rgba(16,185,129,0.55)]' :
                              gameState.activeColor === 'yellow' ? 'shadow-[0_0_35px_rgba(234,179,8,0.55)]' :
                              'shadow-[0_0_35px_rgba(255,255,255,0.25)]'
                            }`}>
                              <motion.div
                                key={gameState.discardPile[0]?.id}
                                layoutId={`card-${gameState.discardPile[0]?.id}`}
                                transition={{ type: 'spring', damping: 24, stiffness: 140 }}
                              >
                                <UnoCard 
                                  card={gameState.discardPile[0]} 
                                  size="md"
                                  flipSide={gameState.flipSide}
                                  theme={cardTheme}
                                  playable={false}
                                  hoverable={false}
                                  isCurrentPlayMarker
                                />
                              </motion.div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-36 md:w-28 md:h-42 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs text-slate-500">
                            ไม่มีการ์ด
                          </div>
                        )}

                        {/* Show current active color focus indicators next to discard pile if active color differs from current card color */}
                        {gameState.discardPile.length > 0 && gameState.discardPile[0].color === 'wild' && (
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-yellow-400 flex items-center gap-1 shadow">
                            สีหลัก: {getCardColorNameThai(gameState.activeColor)}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* RIGHT PLAYER — avatar top-right, fan spreading inward ↙ */}
                {(() => {
                  const rightPlayer = getPlayerAtPosition('right');
                  const rightCards = rightPlayer ? getPlayerCards(rightPlayer) : [];
                  const rightActive = rightPlayer && gameState.players[gameState.currentPlayerIndex]?.id === rightPlayer.id;
                  return (
                    <div className="relative flex flex-col items-end" style={{ width: '130px', minHeight: '180px' }}>
                      {/* Avatar pinned to top-right */}
                      {rightPlayer && (
                        <PlayerPanel 
                          player={rightPlayer} 
                          isActive={!!rightActive} 
                          isThinking={isAiThinking && !!rightActive}
                          bubbleText={thinkingBubble}
                          isWinner={false}
                        />
                      )}
                      {/* Card fan — centred in the right column area */}
                      <div 
                        className="relative flex-1 w-full mt-2 flex items-center justify-center overflow-visible"
                        style={{ minHeight: '120px' }}
                      >
                        {rightCards.map((c, i) => 
                          renderMiniCard(`right-${c.id}`, i, rightCards.length, 'right', c)
                        )}
                        {rightPlayer && rightCards.length === 0 && (
                          <span className="text-slate-500 text-xs absolute">ไม่มีการ์ด</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* BOTTOM: YOU (Player 👑) & CONTROLS */}
              <div className="w-full z-10 pt-4 border-t border-white/10 space-y-4">
                
                {/* Immersive Dashboard Header */}
                {(() => {
                  const displayedP = getDisplayedPlayer();
                  const isItsTurn = displayedP ? (gameState.players[gameState.currentPlayerIndex]?.id === displayedP.id) : false;
                  const playableHand = displayedP?.cards || [];
                  return (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${isItsTurn && !isAiThinking ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-slate-600'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">
                                การจั่วและการเล่นการ์ดของคุณ
                              </span>
                              <span className="text-white font-extrabold text-xs">
                                👑 คุณชี้โม้โอ้อวด 👑
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Uno / Ee-Aor Declare Button */}
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => declareUno(displayedP?.id || 'human-player')}
                            className={`
                              px-8 py-2.5 text-white font-black italic tracking-tighter text-xl rounded-full border border-white/20 shadow-lg uppercase transition-all duration-300 cursor-pointer
                              ${unoButtonGlow || (unoDeclareWindow && displayedP && unoDeclareWindow.playerId === displayedP.id)
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/50 ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-950 animate-pulse' 
                                : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white'}
                            `}
                          >
                            อีอ้อ!
                          </motion.button>
                        </div>

                        {/* Color Focus Ring Indicators */}
                        <div className="text-right hidden sm:block">
                          <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold font-mono">COLOR FOCUS</span>
                          <div className="flex gap-1.5 mt-1.5 justify-end">
                            <div className={`w-3 h-3 rounded-full bg-red-500 transition-all duration-300 ${gameState.activeColor === 'red' ? 'shadow-[0_0_10px_#ef4444] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                            <div className={`w-3 h-3 rounded-full bg-blue-500 transition-all duration-300 ${gameState.activeColor === 'blue' ? 'shadow-[0_0_10px_#3b82f6] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                            <div className={`w-3 h-3 rounded-full bg-green-500 transition-all duration-300 ${gameState.activeColor === 'green' ? 'shadow-[0_0_10px_#10b981] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                            <div className={`w-3 h-3 rounded-full bg-amber-400 transition-all duration-300 ${gameState.activeColor === 'yellow' ? 'shadow-[0_0_10px_#fbbf24] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                          </div>
                        </div>
                      </div>

                      {/* THE HUMAN HAND OF CARDS */}
                      <div className="w-full bg-slate-900/30 backdrop-blur-md p-5 rounded-2xl border border-white/5 min-h-[220px] md:min-h-[240px] flex items-center justify-center user-hand-panel">
                        <div className="flex gap-3 overflow-x-auto py-4 px-2 scrollbar-thin justify-start w-full max-w-full">
                          {playableHand.map((card) => {
                            const playable = isItsTurn && !isAiThinking && isValidPlay(card, gameState.activeColor, gameState.activeValue, gameState.flipSide);
                            return (
                              <div key={card.id} className="flex-shrink-0 transition-transform hover:-translate-y-2.5 duration-300">
                                <motion.div
                                  layoutId={`card-${card.id}`}
                                  initial={{ y: -250, scale: 0.2, opacity: 0 }}
                                  animate={{ y: 0, scale: 1, opacity: 1 }}
                                  transition={{ type: 'spring', damping: 22, stiffness: 150 }}
                                >
                                  <UnoCard
                                    card={card}
                                    playable={playable}
                                    onClick={() => playCard(card.id, displayedP!.id)}
                                    size="md"
                                    flipSide={gameState.flipSide}
                                    theme={cardTheme}
                                  />
                                </motion.div>
                              </div>
                            );
                          })}
                          {playableHand.length === 0 && (
                            <span className="text-slate-500 text-xs text-center mx-auto">ยินดีด้วยคุณสยบเกมสำมะเรดแล้ว!</span>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

              </div>

            </div>

          </div>
        )}

        {/* GAMEOVER SCREEN */}
        {gameState.status === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl text-center bg-slate-900/40 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-5xl md:text-6xl mb-4 animate-bounce">🏆</div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 uppercase">
              สิ้นสุดการประลองการ์ด!
            </h1>

            {gameState.winnerId === 'human-player' ? (
              <div className="my-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-lg">
                <h2 className="text-2xl font-black text-emerald-400 mb-1">🎉 คุณเป็นผู้ชนะ! 🎉</h2>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">
                  สุดยอดอย่างยิ่ง! ลบการ์ดหมดบอร์ดในเวลารวดเร็ว เอาชนะบอททั้ง 3 ตัวไปได้อย่างขาวสะอาด
                </p>
              </div>
            ) : (
              <div className="my-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/35 shadow-lg">
                <h2 className="text-xl font-black text-red-400 mb-1">
                  ผู้ชนะคือ {gameState.players.find(p => p.id === gameState.winnerId)?.name || 'คู่แข่ง'}
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">
                  ไม่เป็นไรนะ! การ์ดมีขึ้นมีลง ไว้แก้ตัวใหม่ในศึกถัดไป บอทเก่งมากต้องกุมขมับเลยทีเดียว
                </p>
              </div>
            )}

            {/* Leaderboard/stats preview */}
            <div className="space-y-2 mb-8 font-sans text-left">
              <span className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest font-mono block mb-4">
                จำนวนการ์ดคงเหลือของแถวคู่แข่ง 📊
              </span>
              <div className="space-y-2.5">
                {gameState.players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-lg">{p.avatar}</span>
                      <span className="font-extrabold text-white">{p.name} {p.id === 'human-player' ? '(คุณ)' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-mono font-bold">{p.cards.length} ใบ</span>
                      <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500" 
                          style={{ width: `${Math.max(5, 100 - p.cards.length * 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleReplayGame}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition cursor-pointer"
            >
              <RotateCcw size={16} /> เริ่มเล่นตาถัดไปทันที (Replay)
            </button>

            <button
              onClick={handleBackToHome}
              className="mt-3 w-full bg-slate-950/80 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white font-medium py-3 rounded-xl text-sm transition cursor-pointer"
            >
              กลับสู่หน้าโฮม
            </button>
          </motion.div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center border-t border-white/5 text-xs text-slate-500 font-mono">
        © 2026 แหม่มการ์ด Arena • ดีไซน์กะทัดรัด สบายตา มิติใหม่ของปัญญาประดิษฐ์
      </footer>

      {/* COLOR PICKER OVERLAY MODAL */}
      <ColorPickerModal 
        isOpen={gameState.wildColorSelectionCard !== null}
        onSelect={handleResolveColorChoice}
        flipSide={gameState.flipSide}
      />

      {/* HOW TO MANUAL OVERLAY MODAL */}
      <AnimatePresence>
        {showHowTo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowTo(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 z-10 max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <h2 className="text-xl md:text-2xl font-black text-white mb-4 flex items-center gap-2">
                📖 คู่มือเรียนรู้วิธีการเล่น แหม่มการ์ด 
              </h2>

              <div className="space-y-4 text-xs md:text-sm text-stone-300 leading-relaxed font-sans">
                <div>
                  <h3 className="font-bold text-amber-400 text-sm mb-1.5 flex items-center gap-1">🟢 วิธีจับคู่เล่นแบบง่าย</h3>
                  <p>
                    ในแต่ละตา คุณต้องวางการ์ดให้ตรงกับการ์ดล่าสุดบนโต๊ะ โดยยึดหลัก <span className="text-white font-bold">"สีเดียวกัน"</span> หรือ <span className="text-white font-bold">"มีสัญลักษณ์คู่เหมือนกัน"</span> (เช่น เลขตรงกัน หรือเป็น Skip เหมือนกัน)
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-amber-400 text-sm mb-1.5 flex items-center gap-1">⚡️ หน้าที่ของคู่การ์ดพิเศษ</h3>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-stone-400 font-sans">
                    <li><strong className="text-white">ข้ามตา (Skip):</strong> ข้ามผู้เล่นลำดับต่อไป</li>
                    <li><strong className="text-white">ย้อนศร (Reverse):</strong> เดินเรื่องทิศกลับทาง (ตามเข็ม/ทวนเข็ม)</li>
                    <li><strong className="text-white">หยิบสอง (+2):</strong> คนถัดไปจั่ว 2 ใบ และข้ามตาเล่น</li>
                    <li><strong className="text-white">เปลี่ยนสี (Wild):</strong> เลือกสีใดก็ได้เป็นตัวนำรอบถัดไป</li>
                    <li><strong className="text-white">เปลี่ยนสี+สี่ (Wild Draw +4):</strong> เลือกสีใหม่ และถล่มคนถัดไปจั่ว 4 ใบพร้อมข้ามตา!</li>
                    <li><span className="text-purple-400 font-black">นนท์ดำซูเปอร์ป่วน (Legendary Nont-Dam):</span> เปลี่ยนสี และสุ่มโจมตีกวนโอ๊ยด้วยเสียงแรปร้ายกาจ! (แรปเสียงหลงหมุนเปลี่ยนทิศสลับการ์ดรอบข้าง, สาดแรปว้าก 180 เดซิเบลจนหูอื้อจั่ว 3 ข้ามตา, หรือแรปสลายมิตรคาร์ดสุ่มเวียนรอบวง)</li>
                  </ul>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-2xl flex gap-2">
                  <div className="text-base">📢</div>
                  <div className="space-y-1">
                    <strong className="text-white">กฎเหล็ก "อีอ้อ!" (Ee-Aor!)</strong>
                    <p className="text-stone-400 text-xs">
                      เมื่อคุณกำลังจะเหลือการ์ดเพียงใบเดียวในมือ ต้องกดปุ่มประกาศ "อีอ้อ!" ทันที คาสิโนจะมีเวลากดท้าทายคุณ 3 วินาที หากลืมกดโดนปรับจั่ว 2 ใบฟรี!
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 text-center uppercase font-mono pt-4 border-t border-white/5">
                  กดมุมภาพหรือพื้นที่ทับหลังเพื่อกลับสู่เกม
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASS & PLAY DEVICE REVEAL SECURITY COVERS */}
      {passCoverActivePlayer && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md p-8 md:p-10 rounded-3xl bg-slate-900 border border-amber-500/35 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-6xl animate-bounce">📱</div>
            
            <h1 className="text-2xl md:text-3xl font-black text-amber-400 uppercase tracking-tight">
              ส่งอุปกรณ์ให้แรปเปอร์คนถัดไป!
            </h1>
            
            <div className="space-y-2 font-sans text-slate-300">
              <p className="text-sm">
                รบกวนยื่นอุปกรณ์เครื่องนี้ทางกายภาพให้แก่:
              </p>
              <div className="text-xl md:text-2xl font-black text-white bg-slate-950/80 p-4 border border-white/5 rounded-2xl flex items-center justify-center gap-2">
                <span>{passCoverActivePlayer.avatar}</span>
                <span className="text-yellow-400">{passCoverActivePlayer.name}</span>
              </div>
              <p className="text-xs text-rose-400 font-extrabold animate-pulse pt-2 leading-relaxed">
                ⚠️ ผู้ร่วมสังเวียนท่านอื่นห้ามแอบเพ่งสายตาอย่างเด็ดขาด!
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playCardSound();
                setPassCoverActivePlayer(null);
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs md:text-sm font-black rounded-xl cursor-pointer shadow-lg hover:shadow-amber-500/25 transition duration-300 flex items-center justify-center gap-2"
            >
              👁️ คลิกที่นี่เพื่อยืนยันสิทธิ์แล้วรับอุปกรณ์มาเล่น!
            </motion.button>
          </div>
        </div>
      )}

      {/* NONT-DAM SPECIAL CARD EFFECT OVERLAY MODAL */}
      <AnimatePresence>
        {nontDamVisualEffect && (
          <div className="fixed top-20 right-4 md:right-6 z-50 w-[320px] md:w-[360px] overflow-hidden pointer-events-auto">
            <motion.div 
              initial={{ x: 300, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 300, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 130 }}
              className="relative w-full bg-[#120b24] border-[4px] rounded-none p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8),_0_0_30px_rgba(168,85,247,0.3)] flex flex-col gap-3"
              style={{
                borderColor: '#d8b4fe', // light purple border
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.8), 0 0 30px rgba(168,85,247,0.3)',
                imageRendering: 'pixelated'
              }}
            >
              {/* Scanline glitch decoration */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none z-10" 
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%)',
                  backgroundSize: '100% 4px',
                }}
              />

              {/* Header */}
              <div className="text-yellow-400 font-mono font-black text-[9px] tracking-widest flex items-center justify-between uppercase border-b border-purple-900/60 pb-1.5 z-20">
                <span className="flex items-center gap-1">
                  <Sparkles size={10} className="text-yellow-400 animate-spin-slow" />
                  ★ LEGENDARY NONT-DAM ★
                </span>
                <button 
                  onClick={() => setNontDamVisualEffect(null)}
                  className="text-stone-400 hover:text-white cursor-pointer transition-colors px-1 font-sans"
                >
                  ✕
                </button>
              </div>

              {/* Content Row: Avatar left, Title/Subtitle right */}
              <div className="flex items-start gap-3 z-20">
                {/* Pixel Art Portrait */}
                <div className="flex-shrink-0 relative p-1 bg-black border-2 border-yellow-500 shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent animate-pulse" />
                  <NontDamPixelArt size={56} />
                </div>

                {/* Active Special Skill name */}
                <div className="flex-grow min-w-0 space-y-1">
                  <span className="text-[8px] text-cyan-400 uppercase tracking-widest font-mono font-black block">Special Skill Triggered</span>
                  <h2 
                    className="text-xs md:text-sm font-black text-white uppercase tracking-tight truncate"
                    style={{ textShadow: '1px 1px 0px #000' }}
                  >
                    {nontDamVisualEffect.title}
                  </h2>
                  <p className="text-[10px] text-stone-400 font-sans leading-tight">
                    {nontDamVisualEffect.description}
                  </p>
                </div>
              </div>

              {/* Funny lyrics / rap shout */}
              <div className="w-full bg-purple-950/40 border border-purple-900/40 p-2.5 rounded-none z-20">
                <p className="text-amber-300 font-bold text-[10px] md:text-[11px] italic leading-tight font-mono text-center">
                  "{nontDamVisualEffect.quote}"
                </p>
              </div>

              {/* Skip button at bottom */}
              <div className="flex justify-end z-20">
                <button
                  onClick={() => setNontDamVisualEffect(null)}
                  className="px-3 py-1 border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-[8px] text-slate-400 hover:text-white uppercase font-mono tracking-wider transition-colors cursor-pointer"
                >
                  Skip Effect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Compact Sub-component to minimize token logic inside App
interface PlayerPanelProps {
  player: Player;
  isActive: boolean;
  isThinking: boolean;
  bubbleText: string | null;
  isWinner: boolean;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ player, isActive, isThinking, bubbleText, isWinner }) => {
  if (!player) return null;

  return (
    <div className="relative flex flex-col items-center">
      
      {/* Bot Thinking Speech bubble */}
      <AnimatePresence>
        {isThinking && bubbleText && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-14 bg-slate-950/95 border border-white/10 rounded-xl p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] max-w-[130px] z-30 pointer-events-none"
          >
            <p className="text-[9px] text-slate-200 font-bold leading-tight font-sans">
              "{bubbleText}"
            </p>
            {/* arrow bubble pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-x-[5px] border-x-transparent border-t-[5px] border-t-slate-950" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active turn sonar ping outer ring */}
      {isActive && (
        <span className="absolute inset-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-cyan-400 animate-ping opacity-60 pointer-events-none" />
      )}

      <div className={`
        relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 border-[2.5px]
        ${isActive 
          ? 'bg-gradient-to-br from-blue-500/25 via-indigo-500/20 to-purple-500/20 border-cyan-400 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-4 ring-cyan-500/10' 
          : 'bg-gradient-to-br from-slate-900/90 to-slate-950/95 border-white/10 opacity-90'}
      `}>
        <span className="select-none">{player.avatar}</span>

        {/* Turn Pulse Badge */}
        {isActive && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-950 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </span>
        )}

        {/* Card Counter Badge - Shaped like a tiny card! */}
        <span className={`
          absolute -bottom-1.5 -right-1.5 w-6 h-8 rounded-[4px] flex flex-col items-center justify-center text-[10px] font-black font-mono border shadow-lg transition-all duration-300
          ${player.cards.length <= 2 
            ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-400 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
            : 'bg-gradient-to-b from-slate-800 to-slate-950 border-white/20 text-yellow-400 shadow-[0_4px_8px_rgba(0,0,0,0.5)]'}
        `}>
          <span className="text-[10px] leading-none select-none">{player.cards.length}</span>
        </span>
      </div>

      <div className="mt-2 flex flex-col items-center">
        <span className="text-[10px] font-bold text-stone-300 block max-w-[80px] truncate">
          {player.name}
        </span>
        {player.cards.length === 1 && (
          <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase font-sans animate-bounce mt-1 shadow-[0_2px_6px_rgba(239,68,68,0.4)]">
            อีอ้อ!
          </span>
        )}
      </div>

    </div>
  );
};
