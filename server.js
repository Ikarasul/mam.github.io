import { WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('แหม่มการ์ด Arena WebSocket Server\n');
});

const wss = new WebSocketServer({ server });
const rooms = new Map(); // roomCode -> RoomState
const botTimers = new Map(); // roomCode -> setTimeout ID

// Helper to generate a room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helpers for Uno Flip logic
function getCardColor(card, flipSide) {
  return (flipSide === 'dark' && card.darkColor) ? card.darkColor : card.color;
}

function getCardValue(card, flipSide) {
  return (flipSide === 'dark' && card.darkValue) ? card.darkValue : card.value;
}

function drawCardFromServerDeck(room) {
  let card = room.deck.pop();
  if (!card) {
    if (room.discardPile.length > 1) {
      const fresh = shuffleServerDeck(room.discardPile.slice(1));
      room.deck.push(...fresh);
      room.discardPile = [room.discardPile[0]];
      card = room.deck.pop();
    }
  }
  return card || null;
}

function executeNontDamEffect(room, activePlayer, step) {
  const effectIndex = Math.floor(Math.random() * 3);
  let logMsg = "";
  let nextStep = step;

  if (effectIndex === 0) {
    // Swap all cards in hand with the opponent having fewest cards (or most if active player is lowest)
    const otherPlayers = room.players.filter(p => p.id !== activePlayer.id);
    if (otherPlayers.length > 0) {
      let targetPlayer = otherPlayers[0];
      const activeCardsCount = activePlayer.cards.length;
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
      
      // Swap hands
      const activeCards = [...activePlayer.cards];
      const targetCards = [...targetPlayer.cards];
      
      activePlayer.cards = targetCards;
      targetPlayer.cards = activeCards;
      
      logMsg = ` 🎤 นนท์ดำเปิดสกิลแรปร้ายกาจ! สลับมือการ์ด (สลับแลก) ระหว่าง ${activePlayer.name} และ ${targetPlayer.name}!`;
    }
  } 
  else if (effectIndex === 1) {
    // Rotate all player hands in the current direction of play
    const hands = room.players.map(p => [...p.cards]);
    const numPlayers = room.players.length;
    for (let i = 0; i < numPlayers; i++) {
      const receiverIndex = (i + room.direction + numPlayers) % numPlayers;
      room.players[receiverIndex].cards = hands[i];
    }
    logMsg = ` 🕺 นนท์ดำแรปเปอร์สายย่อสาดท่าเต้นหมุนพุงสะกดจิต! สลับมือการ์ดของทุกคนส่งเวียนวนต่อกันรอบวงแบทเทิล!`;
  } 
  else {
    // Scream 180dB draws 3 for next player and skips their turn
    const victimIdx = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
    const victim = room.players[victimIdx];
    const cards = [];
    for (let i = 0; i < 3; i++) {
      const c = drawCardFromServerDeck(room);
      if (c) cards.push(c);
    }
    victim.cards.push(...cards);
    logMsg = ` 📢 นนท์ดำกระชากไมค์แรปว้ากเสียงแหลมสูงปรี๊ด 180 เดซิเบลใส่หน้า! ${victim.name} หูอื้ออึึงจับจั่วการ์ด 3 ใบและโดนข้ามตาไปทันที!`;
    nextStep = 2;
  }

  return { logMsg, nextStep };
}

function getRandomTargetPlayer(room, activePlayerId) {
  const others = room.players.filter(p => p.id !== activePlayerId);
  if (others.length === 0) return null;
  return others[Math.floor(Math.random() * others.length)].id;
}

function getRandomColorInHand(player, flipSide) {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const validColors = player.cards
    .map(c => getCardColor(c, flipSide))
    .filter(col => col !== 'wild');
  if (validColors.length === 0) return colors[Math.floor(Math.random() * colors.length)];
  return validColors[Math.floor(Math.random() * validColors.length)];
}

function advanceTurn(room, step = 1) {
  let attempts = 0;
  const maxAttempts = room.players.length;
  
  room.currentPlayerIndex = (room.currentPlayerIndex + (step * room.direction) + room.players.length * 10) % room.players.length;
  
  while (attempts < maxAttempts) {
    const nextPlayer = room.players[room.currentPlayerIndex];
    if (room.frozenTurns && room.frozenTurns[nextPlayer.id] > 0) {
      room.frozenTurns[nextPlayer.id]--;
      room.logs.push({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('th-TH'),
        message: `❄️ ${nextPlayer.name} ถูกแช่แข็ง ข้ามตาเล่นไป! (เหลืออีก ${room.frozenTurns[nextPlayer.id]} รอบ)`,
        type: 'skip'
      });
      room.currentPlayerIndex = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
      attempts++;
    } else {
      break;
    }
  }
}

function applyCardEffects(room, card, activePlayer, payload) {
  const cColor = getCardColor(card, room.flipSide);
  const cValue = getCardValue(card, room.flipSide);
  
  let targetValue = cValue;
  let logMsg = `${activePlayer.name} วางการ์ด [${cColor} ${cValue}]`;
  if (cValue === 'copy' && room.discardPile.length > 0) {
    const prevCard = room.discardPile[0];
    targetValue = getCardValue(prevCard, room.flipSide);
    logMsg += ` (เลียนแบบความสามารถของ [${getCardColor(prevCard, room.flipSide)} ${targetValue}])`;
  }

  let nextColor = cColor;
  let nextValue = cValue;
  let step = 1;

  // Reverse card
  if (targetValue === 'reverse') {
    room.direction = room.direction === 1 ? -1 : 1;
    logMsg += ` 🔄 ย้อนทิศทางของเกม!`;
  }

  // Skip card
  if (targetValue === 'skip') {
    if (room.flipSide === 'dark') {
      logMsg += ` 🚫 ข้ามหมดทุกคน! ได้เล่นซ้ำอีกตา!`;
      step = 4;
    } else {
      const nextIndex = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
      logMsg += ` 🚫 ข้ามตาของ ${room.players[nextIndex].name}!`;
      step = 2;
    }
  }

  // Draw 2 (+5 in Dark)
  if (targetValue === 'draw2') {
    const victimIdx = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
    const victim = room.players[victimIdx];
    
    const shieldIdx = victim.cards.findIndex(c => getCardValue(c, room.flipSide) === 'shield');
    if (shieldIdx !== -1) {
      victim.cards.splice(shieldIdx, 1);
      logMsg += ` ➕ โทษจั่วทำร้ายสะท้อนใส่ ${victim.name} แต่ถูกบล็อกด้วยการ์ดป้องกัน 🛡️!`;
      step = 2;
    } else {
      const penalty = room.flipSide === 'dark' ? 5 : 2;
      const cards = [];
      for (let i = 0; i < penalty; i++) {
        const c = drawCardFromServerDeck(room);
        if (c) cards.push(c);
      }
      victim.cards.push(...cards);
      logMsg += ` ➕${penalty} โทษทัณฑ์! ${victim.name} จั่ว ${penalty} ใบและถูกข้าม!`;
      step = 2;
    }
  }

  // Flip card
  if (targetValue === 'flip') {
    room.flipSide = room.flipSide === 'light' ? 'dark' : 'light';
    logMsg += room.flipSide === 'dark' 
      ? ` 🌀 พลิกมิติเข้าสู่ [โลกกระจกฝั่งมืด]! 🌌👾`
      : ` 🌀 พลิกกลับเข้าสู่ [โลกสว่างปกติ]! ☀️🌈`;
  }

  // Wild cards
  if (cColor === 'wild') {
    let chosenColor = payload.chosenWildColor;
    if (!chosenColor && activePlayer.isBot) {
      // Choose color bot holds the most
      const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
      activePlayer.cards.forEach(c => { 
        const col = getCardColor(c, room.flipSide);
        if (col !== 'wild') counts[col]++; 
      });
      let bestColor = 'red';
      let max = -1;
      Object.keys(counts).forEach(col => {
        if (counts[col] > max) {
          max = counts[col];
          bestColor = col;
        }
      });
      chosenColor = bestColor;
    }
    if (chosenColor) {
      nextColor = chosenColor;
      logMsg += ` 🎨 เลือกสีถัดไปเป็น [${chosenColor}]`;
    }

    if (targetValue === 'draw4') {
      const victimIdx = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
      const victim = room.players[victimIdx];
      
      const shieldIdx = victim.cards.findIndex(c => getCardValue(c, room.flipSide) === 'shield');
      if (shieldIdx !== -1) {
        victim.cards.splice(shieldIdx, 1);
        logMsg += ` ☠️ เปลี่ยนสีและสาดโทษใส่ ${victim.name} แต่ถูกบล็อกด้วยการ์ดป้องกัน 🛡️!`;
        step = 2;
      } else {
        const penalty = room.flipSide === 'dark' ? 6 : 4;
        const cards = [];
        for (let i = 0; i < penalty; i++) {
          const c = drawCardFromServerDeck(room);
          if (c) cards.push(c);
        }
        victim.cards.push(...cards);
        logMsg += ` ☠️ เปลี่ยนสีและสาด +${penalty}! ${victim.name} จั่ว ${penalty} ใบและถูกข้าม!`;
        step = 2;
      }
    } else if (targetValue === 'nont_dam') {
      const result = executeNontDamEffect(room, activePlayer, step);
      logMsg += result.logMsg;
      step = result.nextStep;
    } else if (targetValue === 'swap') {
      const targetPlayerId = payload.targetPlayerId || (activePlayer.isBot ? getRandomTargetPlayer(room, activePlayer.id) : null);
      const targetPlayer = room.players.find(p => p.id === targetPlayerId);
      if (targetPlayer) {
        const activeHand = [...activePlayer.cards];
        activePlayer.cards = [...targetPlayer.cards];
        targetPlayer.cards = activeHand;
        logMsg += ` ⇄ สลับการ์ดทั้งหมดในมือกับ [${targetPlayer.name}]!`;
      }
    } else if (targetValue === 'spy') {
      const targetPlayerId = payload.targetPlayerId || (activePlayer.isBot ? getRandomTargetPlayer(room, activePlayer.id) : null);
      const targetPlayer = room.players.find(p => p.id === targetPlayerId);
      if (targetPlayer) {
        logMsg += ` 👁️ แอบส่องการ์ดในมือของ [${targetPlayer.name}]!`;
        if (!activePlayer.isBot && activePlayer.ws) {
          sendToClient(activePlayer.ws, 'SPY_RESULT', {
            targetId: targetPlayer.id,
            targetName: targetPlayer.name,
            cards: targetPlayer.cards
          });
        }
      }
    } else if (targetValue === 'target2') {
      const targetPlayerId = payload.targetPlayerId || (activePlayer.isBot ? getRandomTargetPlayer(room, activePlayer.id) : null);
      const targetPlayer = room.players.find(p => p.id === targetPlayerId);
      if (targetPlayer) {
        const shieldIdx = targetPlayer.cards.findIndex(c => getCardValue(c, room.flipSide) === 'shield');
        if (shieldIdx !== -1) {
          targetPlayer.cards.splice(shieldIdx, 1);
          logMsg += ` 🎯 เล็งยิง [${targetPlayer.name}] แต่ถูกบล็อกด้วยการ์ดป้องกัน 🛡️!`;
        } else {
          const cards = [];
          for (let i = 0; i < 2; i++) {
            const c = drawCardFromServerDeck(room);
            if (c) cards.push(c);
          }
          targetPlayer.cards.push(...cards);
          logMsg += ` 🎯 เล็งยิงใส่ [${targetPlayer.name}]! ต้องจั่วการ์ด 2 ใบ!`;
        }
      }
    } else if (targetValue === 'discard') {
      const discardColor = payload.chosenDiscardColor || (activePlayer.isBot ? getRandomColorInHand(activePlayer, room.flipSide) : 'red');
      const beforeCount = activePlayer.cards.length;
      activePlayer.cards = activePlayer.cards.filter(c => getCardColor(c, room.flipSide) !== discardColor);
      const discardedCount = beforeCount - activePlayer.cards.length;
      logMsg += ` 🗑️ ทิ้งการ์ดทั้งหมดที่เป็นสี [${discardColor}] จำนวน ${discardedCount} ใบ!`;
    } else if (targetValue === 'bomb') {
      logMsg += ` 💣 ระเบิดจั่วกระจายวง! ทุกคนยกเว้นคนลงต้องจั่วการ์ดคนละ 1 ใบ!`;
      room.players.forEach(p => {
        if (p.id !== activePlayer.id) {
          const c = drawCardFromServerDeck(room);
          if (c) p.cards.push(c);
        }
      });
    }
  }

  // Special colored skills (double, strike, freeze)
  if (targetValue === 'double') {
    logMsg += ` 2️⃣ รัน Double! ผู้เล่นได้สิทธิ์ลงการ์ดเลขใดก็ได้ทับเพิ่มอีก 1 ใบในตานี้!`;
    step = 0;
  }

  if (targetValue === 'strike') {
    const victimIdx = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
    const victim = room.players[victimIdx];
    
    const shieldIdx = victim.cards.findIndex(c => getCardValue(c, room.flipSide) === 'shield');
    if (shieldIdx !== -1) {
      victim.cards.splice(shieldIdx, 1);
      logMsg += ` ⚡ Strike จู่โจมสายฟ้าแลบใส่ ${victim.name} แต่ถูกบล็อกด้วยการ์ดป้องกัน 🛡️!`;
      step = 2;
    } else {
      const drawn = [];
      let foundRed = false;
      let drawLimit = 20;
      while (!foundRed && drawLimit > 0) {
        const c = drawCardFromServerDeck(room);
        if (!c) break;
        drawn.push(c);
        if (getCardColor(c, room.flipSide) === 'red') {
          foundRed = true;
        }
        drawLimit--;
      }
      victim.cards.push(...drawn);
      logMsg += ` ⚡ Strike จู่โจมสายฟ้าแลบ! ${victim.name} ต้องจั่วการ์ดสะสม ${drawn.length} ใบจนกว่าจะพบสีแดงและถูกข้าม!`;
      step = 2;
    }
  }

  if (targetValue === 'freeze') {
    const victimIdx = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
    const victim = room.players[victimIdx];
    room.frozenTurns[victim.id] = (room.frozenTurns[victim.id] || 0) + 2;
    logMsg += ` ❄️ แช่แข็งกักขังการขยับของ ${victim.name} นาน 2 รอบบอร์ด!`;
    step = 2;
  }

  if (targetValue === 'shield') {
    logMsg += ` 🛡️ วางโล่ป้องกันการจั่ว (ไม่มีผลจั่วสะสมขณะนี้)`;
  }

  return { logMsg, nextColor, nextValue, step };
}

// Generate the card deck
function generateServerDeck(isFlipMode = false) {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
  const deck = [];
  let cardIdCounter = 1;
  const nextId = () => `card-online-${cardIdCounter++}`;

  colors.forEach(color => {
    deck.push({ id: nextId(), color, value: '0' });
    values.forEach(value => {
      if (value !== '0') {
        deck.push({ id: nextId(), color, value });
        deck.push({ id: nextId(), color, value });
      }
    });

    // Special colored skills (2 cards per skill per specific color)
    if (color === 'yellow') {
      deck.push({ id: nextId(), color: 'yellow', value: 'double' });
      deck.push({ id: nextId(), color: 'yellow', value: 'double' });
    } else if (color === 'red') {
      deck.push({ id: nextId(), color: 'red', value: 'strike' });
      deck.push({ id: nextId(), color: 'red', value: 'strike' });
    } else if (color === 'blue') {
      deck.push({ id: nextId(), color: 'blue', value: 'freeze' });
      deck.push({ id: nextId(), color: 'blue', value: 'freeze' });
    } else if (color === 'green') {
      deck.push({ id: nextId(), color: 'green', value: 'copy' });
      deck.push({ id: nextId(), color: 'green', value: 'copy' });
    }

    if (isFlipMode) {
      deck.push({ id: nextId(), color: color, value: 'flip' });
      deck.push({ id: nextId(), color: color, value: 'flip' });
    }
  });

  // Add standard wild cards
  for (let i = 0; i < 6; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'wild' });
    deck.push({ id: nextId(), color: 'wild', value: 'draw4' });
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'nont_dam' });
  }

  // Add 2 of each new wild card
  const newWilds = ['swap', 'shield', 'bomb', 'spy', 'target2', 'discard'];
  newWilds.forEach(val => {
    deck.push({ id: nextId(), color: 'wild', value: val });
    deck.push({ id: nextId(), color: 'wild', value: val });
  });

  if (isFlipMode) {
    const numbers = deck.filter(c => c.color !== 'wild' && !['skip', 'reverse', 'draw2', 'flip', 'double', 'strike', 'freeze', 'copy'].includes(c.value));
    const actions = deck.filter(c => ['skip', 'reverse', 'draw2', 'flip', 'double', 'strike', 'freeze', 'copy'].includes(c.value));
    const wilds = deck.filter(c => c.color === 'wild');

    const shufflePairs = (arr) => {
      const pairs = arr.map(c => ({ color: c.color, value: c.value }));
      for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      }
      return pairs;
    };

    const shuffledNumbers = shufflePairs(numbers);
    const shuffledActions = shufflePairs(actions);
    const shuffledWilds = shufflePairs(wilds);

    let numIdx = 0;
    let actIdx = 0;
    let wildIdx = 0;

    deck.forEach(card => {
      if (card.color !== 'wild' && !['skip', 'reverse', 'draw2', 'flip', 'double', 'strike', 'freeze', 'copy'].includes(card.value)) {
        const pair = shuffledNumbers[numIdx++];
        card.darkColor = pair.color;
        card.darkValue = pair.value;
      } else if (['skip', 'reverse', 'draw2', 'flip', 'double', 'strike', 'freeze', 'copy'].includes(card.value)) {
        const pair = shuffledActions[actIdx++];
        card.darkColor = pair.color;
        card.darkValue = pair.value;
      } else {
        const pair = shuffledWilds[wildIdx++];
        card.darkColor = pair.color;
        card.darkValue = pair.value;
      }
    });
  }

  return deck;
}

function shuffleServerDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isValidPlay(card, activeColor, activeValue, flipSide) {
  const cColor = getCardColor(card, flipSide);
  const cValue = getCardValue(card, flipSide);

  if (cColor === 'wild') return true;
  if (cColor === activeColor) return true;
  if (cValue === activeValue) return true;
  return false;
}

wss.on('connection', (ws) => {
  let playerRoomCode = null;
  let playerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case 'CREATE_ROOM': {
          const { hostName, avatar, isFlipMode, cardTheme } = payload;
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          playerRoomCode = code;
          playerId = `player-${Date.now()}`;

          const hostPlayer = {
            id: playerId,
            name: hostName || 'ผู้เล่นหลัก',
            avatar: avatar || '👑',
            cards: [],
            isBot: false,
            isHost: true,
            isResigned: false,
            ws: ws
          };

          const roomState = {
            code,
            isFlipMode: !!isFlipMode,
            cardTheme: cardTheme || 'pixel',
            players: [hostPlayer],
            status: 'setup',
            deck: [],
            discardPile: [],
            currentPlayerIndex: 0,
            direction: 1,
            activeColor: 'red',
            activeValue: '0',
            winnerId: null,
            logs: [],
            hasSaidUno: {},
            wildColorSelectionCard: null,
            flipSide: 'light',
            botsEnabled: true,
            frozenTurns: {}
          };

          rooms.set(code, roomState);

          sendToClient(ws, 'ROOM_CREATED', {
            roomCode: code,
            playerId: playerId,
            players: getCleanPlayers(roomState.players)
          });
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, playerName, avatar } = payload;
          const code = roomCode.toUpperCase();
          if (!rooms.has(code)) {
            sendToClient(ws, 'ERROR', { message: 'ไม่พบห้องนี้ รหัสห้องอาจไม่ถูกต้อง ❌' });
            break;
          }

          const room = rooms.get(code);
          if (room.status !== 'setup') {
            sendToClient(ws, 'ERROR', { message: 'เกมเริ่มไปแล้ว ไม่สามารถเข้าร่วมได้ ❌' });
            break;
          }

          if (room.players.length >= 4) {
            sendToClient(ws, 'ERROR', { message: 'ห้องเต็มแล้ว (สูงสุด 4 คน) ❌' });
            break;
          }

          playerRoomCode = code;
          playerId = `player-${Date.now()}`;

          const newPlayer = {
            id: playerId,
            name: playerName || 'ผู้เข้าร่วม',
            avatar: avatar || '😎',
            cards: [],
            isBot: false,
            isHost: false,
            isResigned: false,
            ws: ws
          };

          room.players.push(newPlayer);

          // Broadcast join
          broadcastToRoom(code, 'ROOM_UPDATED', {
            players: getCleanPlayers(room.players),
            isFlipMode: room.isFlipMode,
            cardTheme: room.cardTheme,
            botsEnabled: room.botsEnabled
          });

          // Confirm join to client
          sendToClient(ws, 'JOIN_SUCCESS', {
            roomCode: code,
            playerId: playerId,
            players: getCleanPlayers(room.players),
            botsEnabled: room.botsEnabled
          });
          break;
        }

        case 'TOGGLE_BOTS': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player || !player.isHost) return;

          const { enabled } = payload;
          room.botsEnabled = !!enabled;

          broadcastToRoom(code, 'ROOM_UPDATED', {
            players: getCleanPlayers(room.players),
            isFlipMode: room.isFlipMode,
            cardTheme: room.cardTheme,
            botsEnabled: room.botsEnabled
          });
          break;
        }

        case 'START_GAME': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player || !player.isHost) return;

          // Check if at least 2 players are present when bots are disabled
          if (!room.botsEnabled && room.players.length < 2) {
            sendToClient(ws, 'ERROR', { message: 'ต้องมีผู้เล่นอย่างน้อย 2 คนเพื่อเริ่มเกม! ❌' });
            return;
          }

          // Fill rest with bots up to 4 players if bots are enabled
          if (room.botsEnabled) {
            const needed = 4 - room.players.length;
            const botNames = ['สมชาย 🤖', 'สมศรี 🦊', 'มานะ 🐼'];
            const botAvatars = ['🤖', '🦊', '🐼'];
            
            for (let i = 0; i < needed; i++) {
              room.players.push({
                id: `bot-${Date.now()}-${i}`,
                name: botNames[i],
                avatar: botAvatars[i],
                cards: [],
                isBot: true,
                isHost: false
              });
            }
          }

          let deck = generateServerDeck(room.isFlipMode);
          deck = shuffleServerDeck(deck);
          deck = shuffleServerDeck(deck);

          room.players.forEach(p => {
            p.cards = [];
            p.isResigned = false;
            for (let i = 0; i < 7; i++) {
              const card = deck.pop();
              if (card) p.cards.push(card);
            }
          });

          let startCardIndex = deck.findIndex(c => c.color !== 'wild' && c.value !== 'skip' && c.value !== 'reverse' && c.value !== 'draw2' && c.value !== 'flip');
          if (startCardIndex === -1) startCardIndex = 0;
          const [startCard] = deck.splice(startCardIndex, 1);

          const startingPlayerIndex = Math.floor(Math.random() * room.players.length);

          room.deck = deck;
          room.discardPile = [startCard];
          room.currentPlayerIndex = startingPlayerIndex;
          room.direction = 1;
          room.activeColor = startCard.color;
          room.activeValue = startCard.value;
          room.status = 'playing';
          room.winnerId = null;
          room.flipSide = 'light';
          room.hasSaidUno = {};
          room.frozenTurns = {};
          room.logs = [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('th-TH'),
              message: `🎲 สุ่มผู้เล่นเริ่มก่อน... และผู้ที่ได้เริ่มตาก่อนคือ 👉 [${room.players[startingPlayerIndex].name}]!`,
              type: 'system'
            },
            {
              id: `log-${Date.now()}-card`,
              timestamp: new Date().toLocaleTimeString('th-TH'),
              message: `🎬 การ์ดเริ่มต้นคือ [${startCard.color} ${startCard.value}]`,
              type: 'system'
            }
          ];

          broadcastGameState(code);
          triggerBotTurnsIfNeeded(code);
          break;
        }

        case 'PLAY_CARD': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const activePlayer = room.players[room.currentPlayerIndex];
          if (activePlayer.id !== playerId) return;

          const { cardId, chosenWildColor } = payload;
          const cardIndex = activePlayer.cards.findIndex(c => c.id === cardId);
          if (cardIndex === -1) return;

          const card = activePlayer.cards[cardIndex];
          if (!isValidPlay(card, room.activeColor, room.activeValue, room.flipSide)) return;

          // Remove card from player hand
          activePlayer.cards.splice(cardIndex, 1);

          let { logMsg, nextColor, nextValue, step } = applyCardEffects(room, card, activePlayer, payload);

          // Check Win
          if (activePlayer.cards.length === 0) {
            room.status = 'gameover';
            room.winnerId = activePlayer.id;
            logMsg += ` 🏆🎉 ${activePlayer.name} การ์ดหมดเกลี้ยง ชนะการประลองแล้ว!`;
          }

          // Append log
          room.logs.push({
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('th-TH'),
            message: logMsg,
            type: 'play'
          });

          // Check low deck count
          if (room.deck.length < 10) {
            const fresh = shuffleServerDeck(room.discardPile.slice(1));
            room.deck.push(...fresh);
            room.discardPile = [room.discardPile[0]];
          }

          // Move current player index
          if (room.status === 'playing') {
            advanceTurn(room, step);
          }

          // Put card in discard pile
          room.discardPile.unshift(card);
          room.activeColor = nextColor;
          room.activeValue = nextValue;

          broadcastGameState(code);
          triggerBotTurnsIfNeeded(code);
          break;
        }

        case 'DRAW_CARD': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const activePlayer = room.players[room.currentPlayerIndex];
          if (activePlayer.id !== playerId) return;

          let card = drawCardFromServerDeck(room);
          
          if (!card) {
            // Still no card, pass turn
            room.currentPlayerIndex = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
            broadcastGameState(code);
            return;
          }

          activePlayer.cards.push(card);
          const isPlayable = isValidPlay(card, room.activeColor, room.activeValue, room.flipSide);
          
          let logMsg = `${activePlayer.name} จั่วการ์ด 1 ใบ`;
          if (isPlayable) {
            logMsg += ` และได้การ์ดที่ลงต่อได้!`;
          } else {
            logMsg += ` ข้ามไปตาคนถัดไป`;
            room.currentPlayerIndex = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
          }

          room.logs.push({
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('th-TH'),
            message: logMsg,
            type: 'draw'
          });

          broadcastGameState(code);
          triggerBotTurnsIfNeeded(code);
          break;
        }

        case 'DECLARE_UNO': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player) return;

          // Check if we can catch someone else who has 1 card and hasn't said UNO
          const victims = room.players.filter(p => p.id !== playerId && p.cards.length === 1 && !room.hasSaidUno[p.id]);

          if (victims.length > 0) {
            let logMsg = `🚨 ${player.name} ตาไวจัด! ชี้หน้าจับกุมคนที่ลืมพูด "อีอ้อ!" 🚨`;
            
            victims.forEach(v => {
              const cardsToDraw = [];
              for (let i = 0; i < 2; i++) {
                const c = drawCardFromServerDeck(room);
                if (c) cardsToDraw.push(c);
              }
              v.cards.push(...cardsToDraw);
              room.hasSaidUno[v.id] = true; // Mark as resolved so they aren't caught twice
              logMsg += `\n👉 ${v.name} โดนลงโทษจั่ว 2 ใบ!`;
            });

            room.logs.push({
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('th-TH'),
              message: logMsg,
              type: 'system'
            });
          }

          // Always declare for self
          room.hasSaidUno[playerId] = true;
          
          if (victims.length === 0) {
            room.logs.push({
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('th-TH'),
              message: `🔊 ${player.name} ตะโกนลั่นบอร์ด: "อีอ้อ!" 🌟`,
              type: 'uno'
            });
          }

          broadcastGameState(code);
          break;
        }

        case 'RESIGN': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player) return;

          player.isResigned = true;
          room.logs.push({
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('th-TH'),
            message: `🏳️ ${player.name} ได้ยอมแพ้ไฟท์นี้แล้ว และกำลังรับชมเกม (เปิดบอทช่วยเล่นอัตโนมัติ) 🍿`,
            type: 'system'
          });

          broadcastGameState(code);
          triggerBotTurnsIfNeeded(code);
          break;
        }

        case 'RESET_GAME': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player || !player.isHost) return;

          // Clear hands and reset status to setup
          room.players.forEach(p => {
            p.cards = [];
            p.isResigned = false;
          });
          room.status = 'setup';
          room.winnerId = null;
          room.deck = [];
          room.discardPile = [];
          room.logs = [];
          room.frozenTurns = {};

          // Keep bots or reset them
          room.players = room.players.filter(p => !p.isBot);

          broadcastToRoom(code, 'ROOM_UPDATED', {
            players: getCleanPlayers(room.players),
            isFlipMode: room.isFlipMode,
            cardTheme: room.cardTheme,
            botsEnabled: room.botsEnabled
          });
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    if (playerRoomCode && rooms.has(playerRoomCode)) {
      const room = rooms.get(playerRoomCode);
      const disconnectedPlayer = room.players.find(p => p.id === playerId);
      room.players = room.players.filter(p => p.id !== playerId);

      if (room.players.length === 0 || room.players.every(p => p.isBot)) {
        rooms.delete(playerRoomCode);
        if (botTimers.has(playerRoomCode)) {
          clearTimeout(botTimers.get(playerRoomCode));
          botTimers.delete(playerRoomCode);
        }
      } else {
        // Re-assign host if needed
        if (disconnectedPlayer && disconnectedPlayer.isHost) {
          const nextHuman = room.players.find(p => !p.isBot);
          if (nextHuman) {
            nextHuman.isHost = true;
          }
        }

        room.logs.push({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('th-TH'),
          message: `🔌 ${disconnectedPlayer ? disconnectedPlayer.name : 'ผู้เล่น'} ออกจากการเชื่อมต่อ`,
          type: 'system'
        });

        if (room.status === 'playing') {
          room.currentPlayerIndex = (room.currentPlayerIndex) % room.players.length;
          broadcastGameState(playerRoomCode);
          triggerBotTurnsIfNeeded(playerRoomCode);
        } else {
          broadcastToRoom(playerRoomCode, 'ROOM_UPDATED', {
            players: getCleanPlayers(room.players),
            isFlipMode: room.isFlipMode,
            cardTheme: room.cardTheme
          });
        }
      }
    }
  });
});

function getCleanPlayers(players) {
  return players.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isBot: p.isBot,
    isHost: !!p.isHost,
    isResigned: !!p.isResigned,
    cardCount: p.cards.length
  }));
}

function sendToClient(ws, type, payload) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// Broadcast to room helper
function broadcastToRoom(roomCode, type, payload) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.forEach(p => {
    if (!p.isBot && p.ws) {
      sendToClient(p.ws, type, payload);
    }
  });
}

function broadcastGameState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Prepare public top deck card if in flip mode
  let topDeckCardToSend = null;
  if (room.isFlipMode && room.deck.length > 0) {
    const topCard = room.deck[room.deck.length - 1];
    if (room.flipSide === 'light') {
      topDeckCardToSend = {
        id: topCard.id,
        darkColor: topCard.darkColor,
        darkValue: topCard.darkValue
      };
    } else {
      topDeckCardToSend = {
        id: topCard.id,
        color: topCard.color,
        value: topCard.value
      };
    }
  }

  room.players.forEach(p => {
    if (p.isBot || !p.ws) return;

    // Filter hands for privacy: in Flip Mode, show only the public side of other players' cards
    const cleanPlayers = room.players.map(other => {
      const isSelf = other.id === p.id;
      let cardsToSend = [];
      if (isSelf) {
        cardsToSend = other.cards;
      } else if (room.isFlipMode) {
        if (room.flipSide === 'light') {
          // Public side is Dark side
          cardsToSend = other.cards.map(c => ({
            id: c.id,
            darkColor: c.darkColor,
            darkValue: c.darkValue
          }));
        } else {
          // Public side is Light side
          cardsToSend = other.cards.map(c => ({
            id: c.id,
            color: c.color,
            value: c.value
          }));
        }
      }

      return {
        id: other.id,
        name: other.name,
        avatar: other.avatar,
        isBot: other.isBot,
        isHost: !!other.isHost,
        isResigned: !!other.isResigned,
        cards: cardsToSend,
        cardCount: other.cards.length
      };
    });

    sendToClient(p.ws, 'GAME_STATE_UPDATED', {
      players: cleanPlayers,
      currentPlayerIndex: room.currentPlayerIndex,
      direction: room.direction,
      activeColor: room.activeColor,
      activeValue: room.activeValue,
      discardPile: room.discardPile,
      deckCount: room.deck.length,
      topDeckCard: topDeckCardToSend,
      status: room.status,
      winnerId: room.winnerId,
      logs: room.logs,
      hasSaidUno: room.hasSaidUno,
      wildColorSelectionCard: room.wildColorSelectionCard,
      flipSide: room.flipSide,
      isFlipMode: room.isFlipMode,
      cardTheme: room.cardTheme,
      frozenTurns: room.frozenTurns
    });
  });
}

function triggerBotTurnsIfNeeded(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'playing') return;

  const current = room.players[room.currentPlayerIndex];
  if (!current || (!current.isBot && !current.isResigned)) return;

  // Clear existing timer if any
  if (botTimers.has(roomCode)) {
    clearTimeout(botTimers.get(roomCode));
  }

  // Let bot think and act on server side
  const timerId = setTimeout(() => {
    botTimers.delete(roomCode);
    const freshRoom = rooms.get(roomCode);
    if (!freshRoom || freshRoom.status !== 'playing') return;
    const bot = freshRoom.players[freshRoom.currentPlayerIndex];
    if (!bot || (!bot.isBot && !bot.isResigned)) return;

    const playable = bot.cards.filter(c => isValidPlay(c, freshRoom.activeColor, freshRoom.activeValue, freshRoom.flipSide));
    
    if (playable.length > 0) {
      // Pick strategy
      const nextPlayerIdx = (freshRoom.currentPlayerIndex + freshRoom.direction + freshRoom.players.length) % freshRoom.players.length;
      const nextPlayer = freshRoom.players[nextPlayerIdx];
      const isNextPlayerThreat = (nextPlayer && nextPlayer.cards.length <= 2);

      const coloredActions = playable.filter(c => {
        const col = getCardColor(c, freshRoom.flipSide);
        const val = getCardValue(c, freshRoom.flipSide);
        return col !== 'wild' && ['skip', 'reverse', 'draw2', 'flip'].includes(val);
      });
      const numbers = playable.filter(c => {
        const col = getCardColor(c, freshRoom.flipSide);
        const val = getCardValue(c, freshRoom.flipSide);
        return col !== 'wild' && !['skip', 'reverse', 'draw2', 'flip', 'nont_dam'].includes(val);
      });
      const wilds = playable.filter(c => getCardColor(c, freshRoom.flipSide) === 'wild' || getCardValue(c, freshRoom.flipSide) === 'nont_dam');

      let card = null;

      if (isNextPlayerThreat) {
        // STRATEGY: Defensive play
        const draw4s = wilds.filter(c => getCardValue(c, freshRoom.flipSide) === 'draw4');
        const draws = coloredActions.filter(c => getCardValue(c, freshRoom.flipSide) === 'draw2');
        const skips = coloredActions.filter(c => getCardValue(c, freshRoom.flipSide) === 'skip');
        const reverses = coloredActions.filter(c => getCardValue(c, freshRoom.flipSide) === 'reverse');

        if (draw4s.length > 0) card = draw4s[0];
        else if (draws.length > 0) card = draws[0];
        else if (skips.length > 0) card = skips[0];
        else if (reverses.length > 0) card = reverses[0];
      }

      if (!card) {
        // STRATEGY: Smart matching or reduction
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        bot.cards.forEach(c => {
          const col = getCardColor(c, freshRoom.flipSide);
          if (col !== 'wild') colorCounts[col]++;
        });

        const prioritizedNonWilds = [...numbers, ...coloredActions].sort((a, b) => {
          const countA = colorCounts[getCardColor(a, freshRoom.flipSide)] || 0;
          const countB = colorCounts[getCardColor(b, freshRoom.flipSide)] || 0;
          return countB - countA;
        });

        if (prioritizedNonWilds.length > 0) {
          card = prioritizedNonWilds[0];
        } else if (wilds.length > 0) {
          card = wilds[0];
        }
      }

      if (!card) card = playable[0];

      // Execute Bot Play
      const idx = bot.cards.findIndex(c => c.id === card.id);
      bot.cards.splice(idx, 1);

      let { logMsg, nextColor, nextValue, step } = applyCardEffects(freshRoom, card, bot, {});

      if (bot.cards.length === 0) {
        freshRoom.status = 'gameover';
        freshRoom.winnerId = bot.id;
        logMsg += ` 🏆🎉 ${bot.name} การ์ดหมดแล้ว ชนะเกม!`;
      }

      // Check Uno say trigger (90% bot declares immediately)
      if (bot.cards.length === 1 && Math.random() < 0.9) {
        freshRoom.hasSaidUno[bot.id] = true;
        logMsg += ` (และได้พูด "อีอ้อ!" แล้วด้วย) 🌟`;
      }

      freshRoom.logs.push({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('th-TH'),
        message: logMsg,
        type: 'play'
      });

      if (freshRoom.deck.length < 10) {
        const fresh = shuffleServerDeck(freshRoom.discardPile.slice(1));
        freshRoom.deck.push(...fresh);
        freshRoom.discardPile = [freshRoom.discardPile[0]];
      }

      if (freshRoom.status === 'playing') {
        advanceTurn(freshRoom, step);
      }

      freshRoom.discardPile.unshift(card);
      freshRoom.activeColor = nextColor;
      freshRoom.activeValue = nextValue;

      broadcastGameState(roomCode);
      triggerBotTurnsIfNeeded(roomCode);
    } else {
      // Draw card
      let card = drawCardFromServerDeck(freshRoom);

      if (!card) {
        // Still no card, pass turn
        freshRoom.currentPlayerIndex = (freshRoom.currentPlayerIndex + freshRoom.direction + freshRoom.players.length) % freshRoom.players.length;
        broadcastGameState(roomCode);
        triggerBotTurnsIfNeeded(roomCode);
        return;
      }

      bot.cards.push(card);
      const isPlayable = isValidPlay(card, freshRoom.activeColor, freshRoom.activeValue, freshRoom.flipSide);
      let logMsg = `${bot.name} จั่วการ์ด 1 ใบ`;

      if (isPlayable) {
        logMsg += ` และได้การ์ดที่ลงต่อได้!`;
        freshRoom.logs.push({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('th-TH'),
          message: logMsg,
          type: 'draw'
        });
        broadcastGameState(roomCode);
        triggerBotTurnsIfNeeded(roomCode);
      } else {
        logMsg += ` และผ่านตา`;
        freshRoom.currentPlayerIndex = (freshRoom.currentPlayerIndex + freshRoom.direction + freshRoom.players.length) % freshRoom.players.length;
        freshRoom.logs.push({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('th-TH'),
          message: logMsg,
          type: 'draw'
        });
        broadcastGameState(roomCode);
        triggerBotTurnsIfNeeded(roomCode);
      }
    }
  }, 1200);
  
  botTimers.set(roomCode, timerId);
}

server.listen(3001, () => {
  console.log('แหม่มการ์ด Arena WebSocket Server running on port 3001');
});
