/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardColor, CardValue, Player, GameLog, GameState } from './types';
import { generateDeck, shuffleDeck, isValidPlay, getCardColorClass, getCardColorNameThai, getCardValueThai } from './utils/unoLogic';
import { UnoCard } from './components/UnoCard';
import { ColorPickerModal } from './components/ColorPickerModal';
import { NontDamCard } from './components/NontDamCard';
import { GunCard } from './components/GunCard';
import { playCardSound, playDrawSound, playUnoSound, playWinSound, playAlertSound, toggleSound, isSoundEnabled, playNontDamSound, playGunScatterSound } from './utils/audio';
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
  const [showcaseGunQuoteIndex, setShowcaseGunQuoteIndex] = useState<number>(0);
  const [isFlipMode, setIsFlipMode] = useState<boolean>(true); // Default to true so users see it immediately!
  const [gunScatterActive, setGunScatterActive] = useState<boolean>(false);

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

  // Handle Turn loop for Bots & Pass-and-Play Transitions
  useEffect(() => {
    if (gameState.status !== 'playing') return;

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

  // Calculate Next Player index
  const getNextPlayerIndex = (currentIndex: number, dir: 1 | -1, step = 1): number => {
    return (currentIndex + step * dir + 4) % 4;
  };

  // Play normal/special card handler (for both bots and player)
  const playCard = (cardId: string, authorPlayerId: string, chosenWildColor?: Exclude<CardColor, 'wild'>) => {
    const activePlayer = gameState.players[gameState.currentPlayerIndex];
    if (activePlayer.id !== authorPlayerId) return; // verification

    const cardToPlay = activePlayer.cards.find(c => c.id === cardId);
    if (!cardToPlay) return;

    // Perform validation
    if (!isValidPlay(cardToPlay, gameState.activeColor, gameState.activeValue)) {
      playAlertSound();
      return;
    }

    if (cardToPlay.value === 'nont_dam') {
      playNontDamSound();
    } else if (cardToPlay.value === 'ai_gun') {
      playGunScatterSound();
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
    let nextColor = cardToPlay.color;
    let nextValue = cardToPlay.value;
    let turnDirection = gameState.direction;
    let logMessage = `${activePlayer.name} วางการ์ด [${getCardColorNameThai(cardToPlay.color)} ${getCardValueThai(cardToPlay.value)}]`;

    let step = 1;

    // Handle Special actions
    if (cardToPlay.value === 'reverse') {
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
    if (cardToPlay.value === 'nont_dam') {
      const effectIndex = Math.floor(Math.random() * 4);
      if (effectIndex === 0) {
        // Reverse direction AND swap 1 random card with neighbors
        turnDirection = (gameState.direction === 1 ? -1 : 1) as 1 | -1;
        
        const hands = afterPlayPlayers.map(p => [...p.cards]);
        const swappedHands = hands.map(() => [] as Card[]);
        
        for (let i = 0; i < 4; i++) {
          const neighborIndex = (i + turnDirection + 4) % 4;
          if (hands[i].length > 0) {
            const randomCardIndex = Math.floor(Math.random() * hands[i].length);
            const [swappedCard] = hands[i].splice(randomCardIndex, 1);
            swappedHands[neighborIndex].push(swappedCard);
          }
        }
        
        for (let i = 0; i < 4; i++) {
          afterPlayPlayers[i].cards = [...hands[i], ...swappedHands[i]];
        }
        
        logMessage += ` 🎤 นนท์ดำเปิดไซฟอร์แรปวนลูปมั่วซั่วเสียงหลงลั่นวง! ทิศทางทวนคืนสลับกลับด้านทันที และเสียงแรปสุดเพี้ยนทำเอาผู้เล่นทุกคนสับสน คว้าสะบัดการ์ดสุ่มแลกคนละใบสะเทือนอารีน่า!`;
      } 
      else if (effectIndex === 1) {
        // Toxic Fart draws 3 for next target and skips them (changed to loud ear-splitting rap)
        const victimIndex = getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection);
        const nextTargetPlayer = afterPlayPlayers[victimIndex];
        
        const drawnCards = popCardsFromLocalDeck(3);
        afterPlayPlayers[victimIndex].cards = [...nextTargetPlayer.cards, ...drawnCards];
        
        logMessage += ` 📢 นนท์ดำกระชากไมค์ขวิด ปล่อยแรปว้ากเสียงแหลมสูงปรี๊ด 180 เดซิเบลใส่หน้า! ${nextTargetPlayer.name} หูอื้ออึึงประสาทเสีย หยิบการ์ดทำที่อุดหูฉุกเฉิน 3 ใบ และข้ามตาไปกุมขมับทันที!`;
        step = 2;
        playDrawSound();
      } 
      else if (effectIndex === 2) {
        // Gravity belly draws cards from max card holder and transfers to active player / min card holder
        let maxCardsCount = -1;
        let maxPlayerIndex = 0;
        let minCardsCount = 999;
        let minPlayerIndex = 0;
        
        afterPlayPlayers.forEach((p, idx) => {
          if (p.cards.length > maxCardsCount) {
            maxCardsCount = p.cards.length;
            maxPlayerIndex = idx;
          }
          if (p.cards.length < minCardsCount) {
            minCardsCount = p.cards.length;
            minPlayerIndex = idx;
          }
        });
        
        if (maxPlayerIndex !== minPlayerIndex && maxCardsCount >= 2) {
          const giver = afterPlayPlayers[maxPlayerIndex];
          const receiver = afterPlayPlayers[minPlayerIndex];
          
          const cardsToTransfer = giver.cards.slice(0, 2);
          giver.cards = giver.cards.slice(2);
          receiver.cards = [...receiver.cards, ...cardsToTransfer];
          
          logMessage += ` 🪙 นนท์ดำแรปอวดรวย ถอดสร้อยทองดงบังปลอมฟาดโชว์เหนือ! แย่งสปอนเซอร์การ์ด 2 ใบจากคุณกุมการ์ดเยอะสุด (${giver.name}) ไปปลอบใจดรอปให้ผู้เล่นที่น้อยเนื้อต่ำใจสุด (${receiver.name}) เพื่อความเท่าเทียมในระบอบฮิปฮอป!`;
        } else {
          afterPlayPlayers.forEach((p, idx) => {
            if (idx !== gameState.currentPlayerIndex) {
              const drawnCards = popCardsFromLocalDeck(1);
              p.cards = [...p.cards, ...drawnCards];
            }
          });
          logMessage += ` 🔥 นนท์ดำท้าแรปแบทเทิลปากเสียรอบทิศ! ทุกคนทนความหนวกหูไม่ไหว โดนบังคับจับการ์ดปลอบใจคนละ 1 ใบ ยกเว้นคนแรปว้ากปวดตับ!`;
        }
      } 
      else {
        // Taunt dance pass 1 card right
        const hands = afterPlayPlayers.map(p => [...p.cards]);
        const swappedHands = hands.map(() => [] as Card[]);
        
        for (let i = 0; i < 4; i++) {
          const neighborIndex = (i + 1) % 4;
          if (hands[i].length > 0) {
            const randomCardIndex = Math.floor(Math.random() * hands[i].length);
            const [swappedCard] = hands[i].splice(randomCardIndex, 1);
            swappedHands[neighborIndex].push(swappedCard);
          }
        }
        
        for (let i = 0; i < 4; i++) {
          afterPlayPlayers[i].cards = [...hands[i], ...swappedHands[i]];
        }
        
        logMessage += ` 🕺 นนท์ดำสาดสเต็ปแรปเปอร์สายย่อส่ายพุงกระเทือนระคายสายตา! ผู้เล่นทนความรำคาญไม่ไหว รีบปัดหน้าการ์ดส้วมๆ สุ่มวนสลับเวียนเทียนไปทางขวาคนละ 1 ใบระบายความร้อนใจ!`;
      }
    }

    if (cardToPlay.value === 'ai_gun') {
      let detailLog = "";
      
      afterPlayPlayers.forEach((p) => {
        if (p.id !== authorPlayerId) {
          const oldLen = p.cards.length;
          // random luck modification: delta can be -2, -1, 0, 1, or 2
          const possibleDeltas = [-2, -1, 0, 1, 2];
          const delta = possibleDeltas[Math.floor(Math.random() * possibleDeltas.length)];
          const targetLen = Math.max(1, oldLen + delta);
          
          if (targetLen > oldLen) {
            const addedCount = targetLen - oldLen;
            const extra = popCardsFromLocalDeck(addedCount);
            p.cards = [...p.cards, ...extra];
          } else if (targetLen < oldLen) {
            p.cards = p.cards.slice(0, targetLen);
          } else {
            p.cards = shuffleDeck(p.cards);
          }
          
          const changeText = targetLen > oldLen 
            ? `ได้รับเพิ่ม ${targetLen - oldLen} ใบ` 
            : targetLen < oldLen 
            ? `สลายลดลง ${oldLen - targetLen} ใบ` 
            : `สะบัดเก็บใหม่ดวงเท่าเดิม`;
            
          detailLog += ` [${p.name}: ${changeText} (${targetLen} ใบ)]`;
        }
      });
      
      setGunScatterActive(true);
      setTimeout(() => {
        setGunScatterActive(false);
      }, 1600);
      
      logMessage += ` 👾 ไอกัน (AI-GUN Chaos) ร่างยักษ์ใหญ่พังกำแพงเปิดแร็คเก็ต! ยิงพลังผลักโต๊ะกระเจิงทำไพ่กระจายปลิวว่อน! คู่แข่งต้องเก็บขึ้นมือใหม่แล้วแต่ดวง: ${detailLog} ส่วนทางฝั่งของ ${activePlayer.name} การ์ดลดลงไป 1 ใบตามกฎกติกาสวรรค์! 🍔💨`;
    }

    const finishNormalTurn = (specifiedColor: CardColor) => {
      let nextIndex = gameState.currentPlayerIndex;

      // Handle card actions that affect the NEXT player or game environment!
      if (cardToPlay.value === 'skip') {
        if (gameState.flipSide === 'dark') {
          logMessage += ` 🚫 [ข้ามแม่งทุกคน] มิติกระจกทำงาน! ข้ามตาผู้เล่นคนอื่นทั้งหมดจนสิทธิ์กลับมาที่ ${afterPlayPlayers[gameState.currentPlayerIndex].name} ได้เล่นต่ออีกตาเฉยเลย! ⚡`;
          step = 4; // Moves 4 steps, which returns to same player in a 4-player game
        } else {
          const skippedPlayer = afterPlayPlayers[getNextPlayerIndex(gameState.currentPlayerIndex, turnDirection)];
          logMessage += ` 🚫 ข้ามตาของ ${skippedPlayer.name}!`;
          step = 2; // Jump 2 spaces
        }
      } 
      else if (cardToPlay.value === 'draw2') {
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
      else if (cardToPlay.value === 'draw4') {
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
      else if (cardToPlay.value === 'flip') {
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

        const nextFlipSide = cardToPlay.value === 'flip' 
          ? (prev.flipSide === 'light' ? 'dark' : 'light') 
          : prev.flipSide;

        return {
          ...prev,
          deck: finalDeck,
          players: afterPlayPlayers,
          discardPile: [cardToPlay, ...prev.discardPile],
          activeColor: specifiedColor,
          activeValue: nextValue,
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
    if (cardToPlay.color === 'wild') {
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

    const isPlayable = isValidPlay(drawnCard, gameState.activeColor, gameState.activeValue);
    
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
    const playableCards = bot.cards.filter(c => isValidPlay(c, gameState.activeColor, gameState.activeValue));

    if (playableCards.length > 0) {
      // Strategize playing: Prioritize Action cards first if another bot has few cards, or prioritize color matches
      // Simple strategy: prefer colored action cards, then normal cards, save wildcards for defense
      let selectedCard = playableCards[0];

      // Find an action card of regular colors
      const coloredActions = playableCards.filter(c => c.color !== 'wild' && ['skip', 'reverse', 'draw2'].includes(c.value));
      const numbers = playableCards.filter(c => c.color !== 'wild' && !['skip', 'reverse', 'draw2'].includes(c.value));
      const wilds = playableCards.filter(c => c.color === 'wild');

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
      const isPlayable = isValidPlay(drawnCard, gameState.activeColor, gameState.activeValue);

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
    let logMessage = `${activePlayer.name} เล่นการ์ด [${getCardColorNameThai(cardPlayed.color)} ${getCardValueThai(cardPlayed.value)}] 🎨 เลือกระบุสีถัดไปเป็น [${getCardColorNameThai(selectedColor)}]`;

    const afterPlayPlayers = gameState.players.map(p => {
      if (p.id === activePlayer.id) {
        return { ...p, cards: updatedCards };
      }
      return p;
    });

    const currentDeck = [...gameState.deck];
    let step = 1;

    if (cardPlayed.value === 'draw4') {
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
      activeValue: cardPlayed.value,
      currentPlayerIndex: nextIndex,
      wildColorSelectionCard: null
    }));

    addLog(logMessage, 'play');
    setHasUserAnnouncedUnoThisTurn(false);
  };

  const getDisplayedPlayer = (): Player | undefined => {
    if (gameState.players.length === 0) return undefined;
    const activeP = gameState.players[gameState.currentPlayerIndex];
    if (activeP && !activeP.isBot) {
      return activeP;
    }
    const firstHuman = gameState.players.find(p => !p.isBot);
    return firstHuman || gameState.players[0];
  };

  // Cheat or Helper: auto suggest playable cards
  const getPlayableCardCount = () => {
    const displayedP = getDisplayedPlayer();
    const userHand = displayedP?.cards || [];
    return userHand.filter(c => isValidPlay(c, gameState.activeColor, gameState.activeValue)).length;
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
      <main className="max-w-7xl mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] relative z-10">
        
        {/* LANDING / SETUP SCREEN */}
        {gameState.status === 'setup' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden"
          >
            {/* Visual background splash */}
            <div className="absolute -top-22 -right-22 w-52 h-52 bg-blue-50/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-22 -left-22 w-52 h-52 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* OVAL LOGO IN THE CENTER AT TOP */}
            <div className="text-center py-2 mb-8 select-none">
              <div className="inline-flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-4 border-yellow-500/80 rounded-[50px] px-14 py-4.5 shadow-[0_0_40px_rgba(234,179,8,0.3)] relative overflow-hidden max-w-sm mx-auto">
                {/* Orbiting ring */}
                <div className="absolute inset-0 border border-dashed border-white/10 rounded-[42px] animate-spin-slow pointer-events-none" />
                <div className="absolute top-1 right-3 text-yellow-500/20 text-lg font-serif">✥</div>
                
                <div className="flex -space-x-1 font-black text-2xl md:text-3xl tracking-tighter italic bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 bg-clip-text text-transparent transform -skew-x-6 drop-shadow-md">
                  MAM CARD
                </div>
                <div className="text-[9px] md:text-[10px] text-slate-300 font-extrabold tracking-widest mt-1 uppercase font-mono bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  ARENA EDITION
                </div>
              </div>
              <p className="text-slate-400 text-[10.5px] font-semibold mt-2.5 max-w-md mx-auto font-sans leading-relaxed">
                แหม่มการ์ด (อีอ้อ!) แรปเปอร์ปะทะก๊วนซิว มิติใหม่ของปัญญาประดิษฐ์สากล 🌀
              </p>
            </div>

            {/* TWO-COLUMN GRID: LEFT CONFIGS / PLAY BUTTON VS RIGHT SHOWCASES AND INSTRUCTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LEFT COLUMN: GAME SETTINGS & LAUNCH CONTROLS (7 columns wide) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                
                {/* Mode Select Tabs */}
                <div className="p-1 bg-slate-950/80 border border-white/5 rounded-2xl flex gap-1.5 shadow-inner">
                  <button
                    onClick={() => { playCardSound(); setLobbyMode('friends'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer ${lobbyMode === 'friends' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                  >
                    <Users size={13} />
                    เล่นกับเพื่อน (Pass)
                  </button>
                  <button
                    onClick={() => { playCardSound(); setLobbyMode('classic'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer ${lobbyMode === 'classic' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                  >
                    <Bot size={13} />
                    บี้บอทเดี่ยว (VS AI)
                  </button>
                  <button
                    onClick={() => { playCardSound(); setLobbyMode('online_mock'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer ${lobbyMode === 'online_mock' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                  >
                    <Globe size={13} />
                    ออนไลน์ (PvP Room)
                  </button>
                </div>

                {/* Main Settings Panel */}
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 min-h-[190px] flex flex-col justify-center">
                  {lobbyMode === 'friends' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">
                          ⚙️ ตั้งค่าโต๊ะแชร์ 4 ที่นั่งผู้ร่วมวงการ์ด
                        </span>
                        <span className="text-[8.5px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 font-bold font-mono">
                          Pass & Play Party
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {lobbySlots.map((slot, sIdx) => {
                          const isMainUser = sIdx === 0;
                          return (
                            <div 
                              key={slot.id} 
                              className="bg-slate-900/70 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between space-y-1.5 transition-all hover:border-blue-500/20"
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    playCardSound();
                                    const avatars = ['👑', '😎', '🤡', '🦊', '🐼', '🐮', '🐰', '🦄', '🦁', '🐸', '🦖', '👻', '👽'];
                                    const curIdx = avatars.indexOf(slot.avatar);
                                    const nextAv = avatars[(curIdx + 1) % avatars.length];
                                    setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, avatar: nextAv } : s));
                                  }}
                                  className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center text-lg hover:bg-slate-800 transition cursor-pointer"
                                  title="คลิกเพื่อสุ่มหัวโมจิกวน"
                                >
                                  {slot.avatar}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-0.5">
                                    ที่นั่ง {sIdx + 1} {isMainUser ? '(โฮสต์)' : ''}
                                  </span>
                                  <input
                                    type="text"
                                    value={slot.name}
                                    onChange={(e) => {
                                      const val = e.target.value.slice(0, 14);
                                      setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, name: val } : s));
                                    }}
                                    placeholder={`แรปเปอร์สายแว้น #${sIdx + 1}`}
                                    className="w-full bg-slate-950 border border-white/5 rounded px-1.5 py-0.5 text-xs text-stone-200 font-extrabold focus:ring-1 focus:ring-blue-500/50 outline-none"
                                  />
                                </div>
                              </div>

                              <div className="flex bg-slate-950 p-0.5 rounded border border-white/5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    playCardSound();
                                    setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, isBot: false } : s));
                                  }}
                                  className={`flex-1 py-0.5 rounded text-[9px] font-black transition ${!slot.isBot ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' : 'text-stone-500 hover:text-stone-300'}`}
                                >
                                  👤 คนเล่น
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playCardSound();
                                    setLobbySlots(prev => prev.map((s, idx) => idx === sIdx ? { ...s, isBot: true, name: s.name.includes('🤖') ? s.name : s.name + ' 🤖' } : s));
                                  }}
                                  className={`flex-1 py-0.5 rounded text-[9px] font-black transition ${slot.isBot ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' : 'text-stone-500 hover:text-stone-300'}`}
                                >
                                  🤖 บอท
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {lobbyMode === 'classic' && (
                    <div className="space-y-2.5">
                      <div className="pb-1.5 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">
                          ⚙️ โหมดดวลเดี่ยวเจอบอทสุ่มปัญญา
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                            ชื่อเล่นผู้เล่นหลักของคุณ 👤
                          </label>
                          <input 
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value.slice(0, 15))}
                            placeholder="ใส่ชื่อเล่นของคุณ..."
                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-orange-500 outline-none font-bold"
                          />
                        </div>

                        <div>
                          <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                            ศัตรูแรปเปอร์ด่านนรกขวัญเสียประจำวัน ⚔️
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {BOT_PROFILES.map((opp) => (
                              <div key={opp.id} className="bg-slate-900/80 border border-white/5 p-1.5 rounded-xl flex flex-col items-center text-center">
                                <span className="text-lg mb-0.5">{opp.avatar}</span>
                                <span className="text-[9px] font-black text-slate-200 truncate max-w-full leading-none">{opp.name}</span>
                                <span className="text-[7.5px] text-slate-500 mt-1 line-clamp-1 leading-tight">{opp.quote}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {lobbyMode === 'online_mock' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                          🌐 เซิร์ฟเวอร์จำลองเกรียนจับคู่ความจำนนท์
                        </span>
                        <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold font-mono">
                          ONLINE ROOMS
                        </span>
                      </div>

                      {onlineSearching ? (
                        <div className="py-2.5 text-center space-y-2">
                          <RefreshCw size={18} className="animate-spin text-emerald-400 mx-auto" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-white">กำลังเขย่าการควบสายแลนพอร์ตสายเหลือง...</p>
                            <p className="text-[10px] text-yellow-400 font-sans">{onlineProgress}</p>
                          </div>
                          <div className="max-w-xs mx-auto bg-slate-950 rounded-full h-1 overflow-hidden border border-white/5 w-full">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300" 
                              style={{ width: `${onlineStep * 33.3}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-stone-400 font-sans leading-tight">
                            สแกนพอร์ตหาคู่แรปปากเก่งสุ่มออนไลน์ (เปิดพอร์ตรอจับชน P2P สเปกขวดโหล)
                          </p>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {[
                              { room: "ห้องลับเจ๊มะพร้าวแรปด่ากลิ่นกะทิ 🥥", id: "#741-26", players: "3/4" },
                              { room: "สนามตดเหลืองพ่นแรปลั่นตึกคนส้วมเต็ม 💨", id: "#808-04", players: "2/4" },
                              { room: "ศึกสายเลือดนนท์ดำ: ชักเว่าแย่งวานแรปร้อยริกเตอร์ 🎤", id: "#999-99", players: "1/4" }
                            ].map((rm, idx) => (
                              <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-white/5 hover:border-emerald-500/20 transition">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="text-[11px] font-bold text-stone-200 truncate leading-tight">{rm.room}</div>
                                  <div className="text-[8px] text-slate-500 font-mono leading-none">{rm.id}</div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-emerald-400 font-bold font-mono">{rm.players}</span>
                                  <button
                                    onClick={() => {
                                      playCardSound();
                                      setOnlineSearching(true);
                                      setOnlineStep(1);
                                      setOnlineProgress("กำลังขยิบตาสแกนพอร์ตสายเหลืองอินเทอร์เน็ตล่ม... 📡");
                                      setTimeout(() => {
                                        setOnlineStep(2);
                                        setOnlineProgress("พบสายสระตรงคู่แข่ง 'ดีเจตับอักเสบ' และ 'ตู่_มอไซต์ซิ่ง' พนันกันกินใบตองต้ม! 🔌");
                                        setTimeout(() => {
                                          setOnlineStep(3);
                                          setOnlineProgress("จับคู่ห้องสำเสร็จเรียบร้อย! คลื่นแรปดังพ่นไฟอารีระยำข้าแล้ว! 🚀");
                                          setTimeout(() => {
                                            setOnlineSearching(false);
                                            startNewGame();
                                          }, 1000);
                                        }, 1100);
                                      }, 1100);
                                    }}
                                    className="px-2 py-0.5 text-[8.5px] font-black bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded cursor-pointer transition uppercase"
                                  >
                                    Join
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-Configurations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Game Speed Controller */}
                  <div className="p-3 bg-slate-950/70 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <span className="block text-[9.5px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 font-mono">
                      ความเร็วสังเวียน ⏱️
                    </span>
                    <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-white/5">
                      {[
                        { name: 'ชิลๆ', ms: 1800 },
                        { name: 'ปกติ', ms: 1200 },
                        { name: 'เร็วปรี๊ด', ms: 600 }
                      ].map((spd) => (
                        <button 
                          key={spd.ms}
                          onClick={() => { playCardSound(); setGameSpeed(spd.ms); }}
                          className={`flex-1 py-1 rounded text-[9.5px] font-bold cursor-pointer transition-all ${gameSpeed === spd.ms ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                          {spd.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Innovated game parameters (Flip Side / Traditional) */}
                  <div className="p-3 bg-slate-950/70 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <span className="block text-[9.5px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 font-mono flex items-center gap-1">
                      <Sparkles size={11} className="text-cyan-400 animate-pulse" /> นวัตกรรมโลกสลับเปลี่ยน 🌀
                    </span>
                    <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-white/5">
                      <button 
                        type="button"
                        onClick={() => { playCardSound(); setIsFlipMode(false); }}
                        className={`flex-1 py-1 rounded text-[9.5px] font-bold cursor-pointer transition-all ${!isFlipMode ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        คลาสสิก 🃏
                      </button>
                      <button 
                        type="button"
                        onClick={() => { playCardSound(); setIsFlipMode(true); }}
                        className={`flex-1 py-1 rounded text-[9.5px] font-bold cursor-pointer transition-all ${isFlipMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        โลกลิฟ 🌀
                      </button>
                    </div>
                  </div>
                </div>

                {/* THE MAIN BIG PLAY ACTION ACTION BUTTON ON THE LEFT SIDE */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={startNewGame}
                  className="w-full bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-black py-4.5 rounded-2xl text-md flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all cursor-pointer font-sans"
                >
                  <Gamepad2 size={16} className="animate-bounce text-stone-100" /> ลิ้มรสชาติผู้ชนะอารีน่า (Start Match!)
                </motion.button>
              </div>

              {/* RIGHT COLUMN: PREVIEWS & HOW-TO-PLAY GUIDELINE AREAS (5 columns wide) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                
                {/* 1. TOP RIGHT: NEW SPECIAL CARD PREVIEWS ("การ์ดใหม่มุมบน") */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      playNontDamSound();
                      setShowcaseQuoteIndex((prev) => (prev + 1) % 5);
                    }}
                    className="w-full text-left bg-slate-950/95 border-2 border-black p-3 rounded-none flex flex-col items-center justify-between relative overflow-hidden group hover:border-[#8b5cf6] transition-all duration-300 shadow-[6px_6px_0px_#000] cursor-pointer h-[190px]"
                    style={{
                      imageRendering: 'pixelated',
                      borderTopColor: '#a855f7',
                      borderLeftColor: '#a855f7',
                      borderRightColor: '#3b0764',
                      borderBottomColor: '#3b0764',
                    }}
                  >
                    <div className="absolute inset-0 bg-[#0c051a] opacity-40 pointer-events-none" />
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none" 
                      style={{
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)',
                        backgroundSize: '100% 4px',
                      }}
                    />
                    
                    <div className="text-center w-full z-10">
                      <span 
                        className="text-[9.5px] font-black text-purple-400 flex items-center justify-center gap-1 font-mono uppercase tracking-widest leading-none"
                        style={{ textShadow: '1px 1px 0px #000' }}
                      >
                        <Sparkles size={11} className="text-yellow-400 animate-pulse" /> การ์ดพิเศษ: นนท์ดำ 👑
                      </span>
                      <span className="block text-[7.5px] text-slate-400 mt-1 font-mono uppercase">★ TAP FOR 8-BIT VOICELINE ★</span>
                    </div>

                    <div className="my-1.5 flex flex-col items-center z-10 w-full scale-75">
                      {/* Retro Pixel Speech Bubble */}
                      <div className="mb-1.5 relative bg-[#1e152e] border-2 border-[#581c87] px-2 py-0.5 rounded-none text-center max-w-full shadow-md min-h-[35px] flex items-center justify-center">
                        <p className="text-[8px] text-purple-200 font-bold font-mono leading-tight">
                          "{[
                            "ชักเว่าแย่งวานนนน! แรปเปอร์คนดำตอกก้นพลาสม่า! 🎤🔥",
                            "โย่ว! คายท่อนเหน่อแรประเบิดกระดานส้วม! 📣💥",
                            "คำติดปากใหม่: ชักเว่าแย่งวานยิ่งแรปยิ่งรัว ตับๆๆๆ! 🤪",
                            "หลีกทางเสียงแว็กสิสิบเดซิเบลพรรคพวกจั่วระส่ำ! 📢✨",
                            "กวนส้นสุดในคีบอร์ด สลับไพ่นอนสลาฟวนโย่ว! 🕺"
                          ][showcaseQuoteIndex]}"
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#581c87]" />
                      </div>

                      <div className="transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
                        <NontDamCard 
                          card={{ id: 'preview-nont', color: 'wild', value: 'nont_dam' }}
                          playable={true}
                          hoverable={false}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="text-[8px] text-center text-yellow-300 font-bold font-mono z-10 bg-[#2e1065] py-0.5 px-2 rounded-none border border-[#4c1d95] w-full leading-none uppercase">
                      👾 RAPPERS: HANDS SWAP OR DRAW 3 👾
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playGunScatterSound();
                      setShowcaseGunQuoteIndex((prev) => (prev + 1) % 5);
                    }}
                    className="w-full text-left bg-slate-950/95 border-2 border-black p-3 rounded-none flex flex-col items-center justify-between relative overflow-hidden group hover:border-[#ef4444] transition-all duration-300 shadow-[6px_6px_0px_#000] cursor-pointer h-[190px]"
                    style={{
                      imageRendering: 'pixelated',
                      borderTopColor: '#fca5a5',
                      borderLeftColor: '#fca5a5',
                      borderRightColor: '#7f1d1d',
                      borderBottomColor: '#7f1d1d',
                    }}
                  >
                    <div className="absolute inset-0 bg-[#1e050a] opacity-40 pointer-events-none" />
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none" 
                      style={{
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)',
                        backgroundSize: '100% 4px',
                      }}
                    />
                    
                    <div className="text-center w-full z-10">
                      <span 
                        className="text-[9.5px] font-black text-rose-400 flex items-center justify-center gap-1 font-mono uppercase tracking-widest leading-none"
                        style={{ textShadow: '1px 1px 0px #000' }}
                      >
                        <Sparkles size={11} className="text-yellow-400 animate-pulse" /> การ์ดพิเศษ: ไอกัน 🍔
                      </span>
                      <span className="block text-[7.5px] text-slate-400 mt-1 font-mono uppercase">★ TAP FOR 8-BIT VOICELINE ★</span>
                    </div>

                    <div className="my-1.5 flex flex-col items-center z-10 w-full scale-75">
                      {/* Retro Pixel Speech Bubble */}
                      <div className="mb-1.5 relative bg-[#2d1219] border-2 border-[#991b1b] px-2 py-0.5 rounded-none text-center max-w-full shadow-md min-h-[35px] flex items-center justify-center">
                        <p className="text-[8px] text-pink-200 font-bold font-mono leading-tight">
                          "{[
                            "เห้ย! การ์ดบินกระจายว่อน! แย่งเก็บกันวายป่วงสิเพื่อน! 💨🔥",
                            "ตูไอกันนะแว้ย! ตีนหนักอัดลมกระแทกจานบิน! 🍔⚡",
                            "ระเบิดไพ่ระเบิดมือ! ดัดแสร้งพวกเก็บการ์ดหนาเตอะ! 🎮💥",
                            "ฮั่นแน่! จั่วเข้าหรือลดโควตา? ทุกอย่างวัดดวงรอบวง! 📢👑",
                            "ไพ่ข้าลดไปใบ ส่วนสูจงโดนกระจัดกระจายเก็บยับ! 🤪⚡"
                          ][showcaseGunQuoteIndex]}"
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#991b1b]" />
                      </div>

                      <div className="transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
                        <GunCard 
                          card={{ id: 'preview-gun', color: 'wild', value: 'ai_gun' }}
                          playable={true}
                          hoverable={false}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="text-[8px] text-center text-yellow-300 font-bold font-mono z-10 bg-[#7f1d1d] py-0.5 px-2 rounded-none border border-[#991b1b] w-full leading-none uppercase">
                      👾 EFFECT: DISCARD 1 & SCATTER EVERYONE! 👾
                    </div>
                  </button>
                </div>

                {/* 2. BOTTOM RIGHT: INTERACTIVE GUIDELINES MANUAL ("อธิบายการเล่นมุมขวา") */}
                <div className="bg-slate-950/85 border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-[230px] overflow-hidden shadow-lg select-none">
                  <div className="pb-1.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1 font-mono uppercase tracking-widest leading-none">
                      📖 วิธีการเล่นและกฎกติกาการ์ด
                    </span>
                    <span className="text-[8px] border border-amber-500/20 bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded font-bold font-mono">
                      PLAY MANUAL
                    </span>
                  </div>

                  {/* Fully scrollable local container for instructions */}
                  <div className="my-2.5 pr-1 space-y-2.5 text-[9.5px] text-slate-300 leading-relaxed font-sans max-h-[140px] overflow-y-auto select-text scrollbar-thin">
                    <div>
                      <h4 className="font-extrabold text-white flex items-center gap-1">🟢 วิธีร่วมสนุกจับคู่</h4>
                      <p className="text-stone-400">
                        ในแต่ละตาผู้จั่ว จะต้องลงการ์ดสัญลักษณ์หรือ <strong className="text-white">"สีเดียวกัน"</strong> หรือ <strong className="text-white">"ค่า/เวคเตอร์ action ตรงกัน"</strong> บนนมโคมเคาน์เตอร์กองประเดิมล่าสุด
                      </p>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white flex items-center gap-1">⚡️ คู่การ์ดวิปริตฝั่งโลกมืดนีออน</h4>
                      <ul className="list-disc list-inside space-y-1.5 pl-1 text-stone-400 font-sans">
                        <li><strong className="text-white">ข้ามตา (Skip):</strong> ข้ามลำดับคนถัดไป <span className="text-yellow-400 font-bold">[โลกกระจก: ข้ามแม่งทุกคน ได้ลงการ์ดเบิ้ลซ้ำ!]</span></li>
                        <li><strong className="text-white">หยิบสอง (+2):</strong> คนถัดไปจั่ว 2 และข้ามการเล่น <span className="text-red-400 font-bold">[โลกกระจก: จั่ว 5 ใบขั้นโหดเหี้ยม!]</span></li>
                        <li><strong className="text-white">เปลี่ยนสี (+4):</strong> สลับสีพร้อมปรับ <span className="text-purple-400 font-bold">[โลกกระจก: สลัดปรับจั่วสะดุ้ง 6 ใบระทม!]</span></li>
                        <li><strong className="text-white">พลิกมิติ (Flip Card 🌀):</strong> พลิกกระดานคว่ำเข้าสู่แดนกระจกสีไฟนีออนสะท้อนแสง การ์ดทั้งหมดจะแปรวิญญาณเพิ่มความปั่นป่วนทวีคูณ!</li>
                        <li>👑 <strong className="text-white">นนท์ดำแรประเบิด:</strong> ระเบิดสุ่มเอฟเฟกต์แรปแซงโค้ง แย่งทอง ย้ายมือ หรือว้าวแรปจับจั่ว 3!</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white">🚨 รีบกุม "อีอ้อ!" (Uno)</h4>
                      <p className="text-stone-400">
                        เมื่อในการ์ตักเหลือการ์ดเพียง 1 ใบ ต้องรีบกุมปุ่มพูดว่า "อีอ้อ!" ทันที! ไม่งั้นถ้าคู่ต่อสู้บอทคว้ากล้องแจ้งจับได้ คุณจะโดนทับโทษสุ่มปรับจั่วการ์ด 2 ใบเข้าตัก!
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <button 
                      onClick={() => { playCardSound(); setShowHowTo(true); }}
                      className="text-[9.5px] font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 py-1.5 px-3 rounded-xl border border-rose-500/20 w-full transition cursor-pointer text-center font-sans tracking-wide"
                    >
                      ✨ คลี่ดูรายละเอียดการ์ดแอ็คชั่นคิ้วขดทั้งหมด (คู่มือเต็มหน้าจอ)
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
                        {/* ACTIVE GAMEBOARD */}
        {gameState.status === 'playing' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* THE BIG GAME TABLE (3 columns wide on large screen) */}
            <div className={`lg:col-span-3 flex flex-col justify-between items-center relative rounded-4xl p-8 min-h-[75vh] border-[12px] transition-all duration-1000 overflow-hidden ${
              gameState.flipSide === 'dark' 
                ? 'border-[#0f001c] bg-radial from-[#150226] via-[#090012] to-[#010006] shadow-[0_25px_60px_-15px_rgba(168,85,247,0.2),inset_0_0_120px_rgba(0,0,0,0.95)]'
                : 'border-[#3f1b04] bg-radial from-[#2a6f53] via-[#1d4d3a] to-[#123024] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(0,0,0,0.6)]'
            }`}>
              
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

              {/* TOP: BOT 2 (Somsri 🦊) */}
              <div className="z-10 text-center">
                <PlayerPanel 
                  player={gameState.players[2]} 
                  isActive={gameState.currentPlayerIndex === 2} 
                  isThinking={isAiThinking && gameState.currentPlayerIndex === 2}
                  bubbleText={thinkingBubble}
                  isWinner={false}
                />
                
                {/* Small compact layout for Top Bot's hand */}
                <div className="flex gap-1 justify-center mt-3">
                  {gameState.players[2]?.cards.map((c, i) => (
                    <div 
                      key={c.id} 
                      className="w-[22px] h-9 bg-red-700 border border-red-600/50 rounded flex items-center justify-center text-[9px] font-black italic text-white shadow-lg transform origin-bottom"
                      style={{ 
                        transform: `rotate(${(i - (gameState.players[2].cards.length - 1)/2) * 4}deg) translateY(${Math.abs(i - (gameState.players[2].cards.length - 1)/2) * 1}px)`,
                        zIndex: i 
                      }}
                    >
                      U
                    </div>
                  ))}
                  {gameState.players[2]?.cards.length === 0 && (
                    <span className="text-slate-500 text-xs">ไม่มีการ์ด</span>
                  )}
                </div>
              </div>

              {/* MIDDLE ROW: BOTS 1 & 3 & DRAW/DISCARD AREA */}
              <div className="w-full flex items-center justify-between gap-4 my-auto z-10 py-6">
                
                {/* LEFT: BOT 1 (Somchai 🤖) */}
                <div className="w-32 flex flex-col items-center text-center">
                  <PlayerPanel 
                    player={gameState.players[1]} 
                    isActive={gameState.currentPlayerIndex === 1} 
                    isThinking={isAiThinking && gameState.currentPlayerIndex === 1}
                    bubbleText={thinkingBubble}
                    isWinner={false}
                  />

                  {/* Fan of cards vertical / compact */}
                  <div className="relative h-16 w-16 mt-3 flex items-center justify-center">
                    {gameState.players[1]?.cards.map((c, i) => (
                      <div 
                        key={c.id}
                        className="absolute w-[22px] h-9 bg-red-700 border border-red-600/50 rounded flex items-center justify-center text-[8px] font-black italic text-white shadow-md origin-bottom"
                        style={{ 
                          transform: `rotate(${(i - (gameState.players[1].cards.length - 1)/2) * 14}deg) translateX(${(i - (gameState.players[1].cards.length - 1)/2) * 3}px)`,
                          zIndex: i 
                        }}
                      >
                        U
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOARD CENTER 3D TRAY / DISH (จานแนว 3D สำหรับวางไพ่) */}
                <div className="flex-1 flex items-center justify-center py-6 my-auto w-full z-10" style={{ perspective: '1200px' }}>
                  <div 
                    className={`relative w-full max-w-[530px] rounded-[50px] border-[6px] transition-all duration-1000 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14 px-8 py-10 ${
                      gameState.flipSide === 'dark'
                        ? 'border-[#7c3aed] bg-gradient-to-b from-[#120024] via-[#21003d] to-[#0a0014]'
                        : 'border-[#d97706] bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#2d1002]'
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
                    <div className={`absolute inset-2.5 rounded-[42px] border-2 pointer-events-none transition-all duration-1000 ${
                      gameState.flipSide === 'dark' 
                        ? 'bg-gradient-to-b from-[#0a0114] to-[#120124] border-[#22023d]'
                        : 'bg-gradient-to-b from-[#0a231c] to-[#123026] border-[#1c0a00]'
                    }`} style={{ boxShadow: 'inset 0 10px 24px rgba(0,0,0,0.9)' }} />

                    {/* Elite golden decorative motifs representing traditional luxury card play */}
                    <span className={`absolute top-3 left-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>
                    <span className={`absolute top-3 right-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>
                    <span className={`absolute bottom-3 left-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>
                    <span className={`absolute bottom-3 right-8 text-lg select-none font-serif ${gameState.flipSide === 'dark' ? 'text-purple-500/30' : 'text-amber-500/30'}`}>✥</span>

                    {/* DRAW PILE */}
                    <div className="flex flex-col items-center gap-3.5 z-10" style={{ transform: 'translateZ(20px)' }}>
                      <span className="text-[10px] font-black text-amber-200/90 tracking-wider font-mono uppercase bg-slate-950/70 border border-white/5 px-2 py-0.5 rounded shadow-md">
                        กองการ์ดจั่ว ({gameState.deck.length})
                      </span>
                      
                      <div className="relative group">
                        {/* Interactive click to draw card */}
                        <button
                          onClick={handleUserDrawCard}
                          disabled={gameState.currentPlayerIndex !== 0 || isAiThinking}
                          className={`group relative focus:outline-none transition-all active:scale-95 cursor-pointer block ${gameState.currentPlayerIndex === 0 && !isAiThinking ? 'hover:scale-105' : ''}`}
                        >
                          {/* 3D stacked layout under draw card */}
                          <div className="absolute -bottom-1.5 -right-1.5 w-24 h-36 md:w-28 md:h-42 bg-slate-950 border border-slate-800/80 rounded-2xl shadow -z-20 transform translate-x-1.5 translate-y-1.5 opacity-90" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-24 h-36 md:w-28 md:h-42 bg-slate-900 border border-slate-800/90 rounded-2xl shadow -z-10 transform translate-x-0.5 translate-y-0.5" />
                          
                          <UnoCard 
                            card={{ id: 'fake-draw', color: 'red', value: '0' }} 
                            isBack 
                            hoverable={gameState.currentPlayerIndex === 0 && !isAiThinking}
                            playable={gameState.currentPlayerIndex === 0 && !isAiThinking} 
                            size="md"
                            flipSide={gameState.flipSide}
                          />
                        </button>

                        {/* Your Turn guidance overlay */}
                        {gameState.currentPlayerIndex === 0 && !isAiThinking && (
                          <div className="absolute -top-3.5 -right-3.5 bg-red-600 text-white font-black px-2.5 py-1 text-[9px] tracking-widest rounded-full shadow-lg border border-white/20 animate-bounce">
                            DRAW CARD!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DISCARD PILE */}
                    <div className="flex flex-col items-center gap-3.5 z-10" style={{ transform: 'translateZ(20px)' }}>
                      <span className="text-[10px] font-black text-amber-200/90 tracking-wider font-mono uppercase bg-slate-950/70 border border-white/5 px-2 py-0.5 rounded shadow-sm justify-center flex items-center gap-1.5">
                        การ์ดบนโต๊ะ 
                        <span className="flex items-center gap-1 bg-white/10 border border-white/5 px-1.5 py-0.5 rounded-full text-zinc-300 font-bold font-mono text-[9px]">
                          {gameState.direction === 1 ? <TrendingUp size={9} className="text-emerald-400" /> : <TrendingDown size={9} className="text-yellow-400" />}
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
                              <UnoCard 
                                card={gameState.discardPile[0]} 
                                hoverable={false} 
                                isCurrentPlayMarker
                                size="md"
                                flipSide={gameState.flipSide}
                              />
                            </div>

                            {/* Highlight Active Match Rules */}
                            <div className={`absolute -bottom-3 -right-3 rounded-full border border-white/10 bg-gradient-to-br ${getCardColorClass(gameState.activeColor)} text-white text-[9px] uppercase font-black px-2.5 py-1 tracking-widest shadow-xl`}>
                              {getCardColorNameThai(gameState.activeColor)} : {gameState.activeValue}
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-36 md:w-28 md:h-42 bg-slate-950 border border-dashed border-slate-800/80 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-mono">
                            EMPTY PILE
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* RIGHT: BOT 3 (Mana 🐼) */}
                <div className="w-32 flex flex-col items-center text-center">
                  <PlayerPanel 
                    player={gameState.players[3]} 
                    isActive={gameState.currentPlayerIndex === 3} 
                    isThinking={isAiThinking && gameState.currentPlayerIndex === 3}
                    bubbleText={thinkingBubble}
                    isWinner={false}
                  />

                  {/* Fan of cards vertical / compact */}
                  <div className="relative h-16 w-16 mt-3 flex items-center justify-center">
                    {gameState.players[3]?.cards.map((c, i) => (
                      <div 
                        key={c.id}
                        className="absolute w-[22px] h-9 bg-red-700 border border-red-600/50 rounded flex items-center justify-center text-[8px] font-black italic text-white shadow-md origin-bottom"
                        style={{ 
                          transform: `rotate(${(i - (gameState.players[3].cards.length - 1)/2) * -14}deg) translateX(${(i - (gameState.players[3].cards.length - 1)/2) * -3}px)`,
                          zIndex: i 
                        }}
                      >
                        U
                      </div>
                    ))}
                  </div>
                </div>

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
                                {isItsTurn && !isAiThinking ? 'ตาของคุณเล่น' : 'รอบางแรปเปอร์สับเปลี่ยน...'}
                              </span>
                            </div>
                            <h3 className="font-black text-base text-white tracking-tight flex items-center gap-1.5">
                              <span className="text-xl">{displayedP?.avatar}</span> {displayedP?.name}
                            </h3>
                          </div>
                        </div>

                        {/* Actions Bar (Declare UNO!) */}
                        <div className="flex items-center gap-4">
                          {unoDeclareWindow && displayedP && unoDeclareWindow.playerId === displayedP.id && (
                            <motion.div 
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                              className="bg-red-600 text-white font-black p-1.5 rounded-lg text-[9px] flex items-center gap-1.5 px-3 uppercase tracking-widest animate-pulse shadow-lg shadow-red-600/30 border border-white/10"
                            >
                              <AlertTriangle size={12} /> กด "อีอ้อ!" ด่วน!
                            </motion.div>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => declareUno(displayedP?.id || 'player-1')}
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
                          <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold font-mono">Color Focus</span>
                          <div className="flex gap-1.5 mt-1.5 justify-end">
                            <div className={`w-3 h-3 rounded-full bg-red-500 transition-all duration-300 ${gameState.activeColor === 'red' ? 'shadow-[0_0_10px_#ef4444] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                            <div className={`w-3 h-3 rounded-full bg-blue-500 transition-all duration-300 ${gameState.activeColor === 'blue' ? 'shadow-[0_0_10px_#3b82f6] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                            <div className={`w-3 h-3 rounded-full bg-emerald-500 transition-all duration-300 ${gameState.activeColor === 'green' ? 'shadow-[0_0_10px_#10b981] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                            <div className={`w-3 h-3 rounded-full bg-amber-400 transition-all duration-300 ${gameState.activeColor === 'yellow' ? 'shadow-[0_0_10px_#fbbf24] scale-125 opacity-100 ring-2 ring-white/30' : 'opacity-25'}`} />
                          </div>
                        </div>
                      </div>

                      {/* THE HUMAN HAND OF CARDS */}
                      <div className="w-full bg-slate-900/30 backdrop-blur-md p-5 rounded-2xl border border-white/5 min-h-[145px] flex items-center justify-center">
                        <div className="flex gap-3 overflow-x-auto py-3 px-1 scrollbar-thin justify-start w-full max-w-full">
                          {playableHand.map((card) => {
                            const playable = isItsTurn && !isAiThinking && isValidPlay(card, gameState.activeColor, gameState.activeValue);
                            return (
                              <div key={card.id} className="flex-shrink-0 transition-transform hover:-translate-y-2.5 duration-300">
                                <UnoCard
                                  card={card}
                                  playable={playable}
                                  onClick={() => playCard(card.id, displayedP!.id)}
                                  size="md"
                                  flipSide={gameState.flipSide}
                                />
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

            {/* SIDE PANEL: COOP GAME LOGS & SCORESTATS (1 column wide) */}
            <div className="flex flex-col justify-between bg-stone-900/40 border border-white/5 p-4 rounded-3xl h-[70vh] lg:h-[75vh] z-20">
              
              {/* Turn cues */}
              <div className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xs text-stone-300 flex items-center gap-1 font-mono uppercase tracking-wider">
                    <Compass size={14} className="text-amber-400" /> สถานะเวลานี้
                  </h3>
                  <div className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    ตาที่ {gameState.logs.filter(l => l.type === 'play').length + 1}
                  </div>
                </div>

                {/* Who's Turn indicator */}
                <div className="bg-stone-950/80 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-lg border border-yellow-400 shadow">
                      {gameState.players[gameState.currentPlayerIndex]?.avatar || '👤'}
                    </div>
                    {isAiThinking && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-stone-950 flex items-center justify-center animate-ping text-[6px]">
                        ●
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-amber-400 uppercase tracking-widest font-mono block">ผู้เล่นตาปัจจุบัน</span>
                    <span className="text-xs font-black text-white block truncate">
                      {gameState.players[gameState.currentPlayerIndex]?.name || 'กำลังรอ...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE SCROLLING LOGS */}
              <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2 max-h-[300px] lg:max-h-none scrollbar-thin">
                <div className="flex items-center gap-1 text-xs font-medium text-stone-400 mb-2 font-mono uppercase">
                  <History size={12} /> เครื่องบันทึกการ์ด (Match Log)
                </div>
                
                {gameState.logs.length === 0 && (
                  <div className="text-center text-xs text-stone-600 py-10">
                    ยังไม่มีความเคลื่อนไหว
                  </div>
                )}

                {gameState.logs.map((log) => {
                  let badgeBg = 'bg-stone-800 text-stone-300';
                  if (log.type === 'play') badgeBg = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                  if (log.type === 'draw') badgeBg = 'bg-yellow-500/10 text-yellow-500/90 border border-yellow-500/20';
                  if (log.type === 'uno') badgeBg = 'bg-red-500/10 text-red-500 font-extrabold border border-red-500/20 animate-pulse';
                  if (log.type === 'win') badgeBg = 'bg-green-500/10 text-green-400 font-extrabold border border-green-500/20';

                  return (
                    <div key={log.id} className="text-xs bg-stone-950/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg} uppercase font-mono`}>
                          {log.type}
                        </span>
                        <span className="text-[9px] text-stone-500 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-stone-300 text-xs font-medium leading-relaxed">{log.message}</p>
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>

              {/* RESET / PANIC OPTIONS */}
              <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('คุณต้องการรีเซ็ตบอร์ดเกมและเริ่มกระดานใหม่ใช่หรือไม่?')) {
                      startNewGame();
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} /> รีเซ็ตเกมใหม่
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('คุณต้องการยอมแพ้และกลับไปเมนูหลักใช่หรือไม่?')) {
                      setGameState(prev => ({ ...prev, status: 'setup' }));
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-red-400 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <AlertTriangle size={12} /> ยอมแพ้เกม
                </button>
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
              onClick={startNewGame}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition cursor-pointer"
            >
              <RotateCcw size={16} /> เริ่มเล่นตาถัดไปทันที (Replay)
            </button>

            <button
              onClick={() => setGameState(prev => ({ ...prev, status: 'setup' }))}
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

      <div className={`
        relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-2xl border transition-all duration-300
        ${isActive 
          ? 'bg-blue-500/25 border-blue-400 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.25)] ring-4 ring-blue-500/20' 
          : 'bg-slate-950/80 border-white/5 opacity-95'}
      `}>
        {player.avatar}

        {/* Turn Pulse Badge */}
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-slate-950 flex items-center justify-center animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </span>
        )}

        {/* Card Counter bubble */}
        <span className={`
          absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono border text-white shadow-md
          ${player.cards.length <= 2 ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-slate-900 border-white/5'}
        `}>
          {player.cards.length}
        </span>
      </div>

      <div className="mt-1.5 flex flex-col items-center">
        <span className="text-[10px] font-bold text-stone-300 block max-w-[80px] truncate">
          {player.name}
        </span>
        {player.cards.length === 1 && (
          <span className="bg-red-500 text-stone-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase font-sans animate-bounce mt-0.5 shadow-sm">
            อีอ้อ!
          </span>
        )}
      </div>

    </div>
  );
};
