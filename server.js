import { WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('แหม่มการ์ด Arena WebSocket Server\n');
});

const wss = new WebSocketServer({ server });
const rooms = new Map(); // roomCode -> RoomState

// Helper to generate a room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
    if (isFlipMode) {
      deck.push({ id: nextId(), color, value: 'flip' });
      deck.push({ id: nextId(), color, value: 'flip' });
    }
  });

  for (let i = 0; i < 4; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'wild' });
    deck.push({ id: nextId(), color: 'wild', value: 'draw4' });
  }
  for (let i = 0; i < 3; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'nont_dam' });
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

function isValidPlay(card, activeColor, activeValue) {
  if (card.color === 'wild') return true;
  if (card.color === activeColor) return true;
  if (card.value === activeValue) return true;
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
            flipSide: 'light'
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
            ws: ws
          };

          room.players.push(newPlayer);

          // Broadcast join
          broadcastToRoom(code, 'ROOM_UPDATED', {
            players: getCleanPlayers(room.players),
            isFlipMode: room.isFlipMode,
            cardTheme: room.cardTheme
          });

          // Confirm join to client
          sendToClient(ws, 'JOIN_SUCCESS', {
            roomCode: code,
            playerId: playerId,
            players: getCleanPlayers(room.players)
          });
          break;
        }

        case 'START_GAME': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player || !player.isHost) return;

          // Fill rest with bots up to 4 players
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

          let deck = generateServerDeck(room.isFlipMode);
          deck = shuffleServerDeck(deck);
          deck = shuffleServerDeck(deck);

          room.players.forEach(p => {
            p.cards = [];
            for (let i = 0; i < 7; i++) {
              const card = deck.pop();
              if (card) p.cards.push(card);
            }
          });

          let startCardIndex = deck.findIndex(c => c.color !== 'wild' && c.value !== 'skip' && c.value !== 'reverse' && c.value !== 'draw2' && c.value !== 'flip');
          if (startCardIndex === -1) startCardIndex = 0;
          const [startCard] = deck.splice(startCardIndex, 1);

          room.deck = deck;
          room.discardPile = [startCard];
          room.currentPlayerIndex = 0;
          room.direction = 1;
          room.activeColor = startCard.color;
          room.activeValue = startCard.value;
          room.status = 'playing';
          room.winnerId = null;
          room.flipSide = 'light';
          room.hasSaidUno = {};
          room.logs = [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('th-TH'),
              message: `🎮 เริ่มเกมการประลองออนไลน์แล้ว! ${room.players[0].name} เริ่มคนแรก`,
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
          if (!isValidPlay(card, room.activeColor, room.activeValue)) return;

          // Remove card from player hand
          activePlayer.cards.splice(cardIndex, 1);

          let logMsg = `${activePlayer.name} วางการ์ด [${card.color} ${card.value}]`;
          let nextColor = card.color;
          let nextValue = card.value;
          let step = 1;

          // Reverse card
          if (card.value === 'reverse') {
            room.direction = room.direction === 1 ? -1 : 1;
            logMsg += ` 🔄 ย้อนทิศทางของเกม!`;
          }

          // Skip card
          if (card.value === 'skip') {
            if (room.flipSide === 'dark') {
              logMsg += ` 🚫 ข้ามหมดทุกคน! ได้เล่นซ้ำอีกตา!`;
              step = 4;
            } else {
              const nextIndex = (room.currentPlayerIndex + room.direction + 4) % 4;
              logMsg += ` 🚫 ข้ามตาของ ${room.players[nextIndex].name}!`;
              step = 2;
            }
          }

          // Draw 2 (+5 in Dark)
          if (card.value === 'draw2') {
            const victimIdx = (room.currentPlayerIndex + room.direction + 4) % 4;
            const victim = room.players[victimIdx];
            const penalty = room.flipSide === 'dark' ? 5 : 2;
            const cards = [];
            for (let i = 0; i < penalty; i++) {
              const c = room.deck.pop();
              if (c) cards.push(c);
            }
            victim.cards.push(...cards);
            logMsg += ` ➕${penalty} โทษทัณฑ์! ${victim.name} จั่ว ${penalty} ใบและถูกข้าม!`;
            step = 2;
          }

          // Flip card
          if (card.value === 'flip') {
            room.flipSide = room.flipSide === 'light' ? 'dark' : 'light';
            logMsg += room.flipSide === 'dark' 
              ? ` 🌀 พลิกมิติเข้าสู่ [โลกกระจกฝั่งมืด]! 🌌👾`
              : ` 🌀 พลิกกลับเข้าสู่ [โลกสว่างปกติ]! ☀️🌈`;
          }

          // Wild Color Choice or draw4 (+6 in Dark)
          if (card.color === 'wild') {
            if (chosenWildColor) {
              nextColor = chosenWildColor;
              logMsg += ` 🎨 เลือกสีถัดไปเป็น [${chosenWildColor}]`;
            }
            if (card.value === 'draw4') {
              const victimIdx = (room.currentPlayerIndex + room.direction + 4) % 4;
              const victim = room.players[victimIdx];
              const penalty = room.flipSide === 'dark' ? 6 : 4;
              const cards = [];
              for (let i = 0; i < penalty; i++) {
                const c = room.deck.pop();
                if (c) cards.push(c);
              }
              victim.cards.push(...cards);
              logMsg += ` ☠️ เปลี่ยนสีและสาด +${penalty}! ${victim.name} จั่ว ${penalty} ใบและถูกข้าม!`;
              step = 2;
            }
          }

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
            room.currentPlayerIndex = (room.currentPlayerIndex + step * room.direction + 4) % 4;
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

          const card = room.deck.pop();
          if (!card) return;

          activePlayer.cards.push(card);
          const isPlayable = isValidPlay(card, room.activeColor, room.activeValue);
          
          let logMsg = `${activePlayer.name} จั่วการ์ด 1 ใบ`;
          if (isPlayable) {
            logMsg += ` และได้การ์ดที่ลงต่อได้!`;
          } else {
            logMsg += ` ข้ามไปตาคนถัดไป`;
            room.currentPlayerIndex = (room.currentPlayerIndex + room.direction + 4) % 4;
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

          room.hasSaidUno[playerId] = true;
          room.logs.push({
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('th-TH'),
            message: `🔊 ${player.name} ตะโกนลั่นบอร์ด: "อีอ้อ!" 🌟`,
            type: 'uno'
          });

          broadcastGameState(code);
          break;
        }

        case 'RESET_GAME': {
          const code = playerRoomCode;
          if (!code || !rooms.has(code)) return;
          const room = rooms.get(code);

          const player = room.players.find(p => p.id === playerId);
          if (!player || !player.isHost) return;

          // Clear hands and reset status to setup
          room.players.forEach(p => { p.cards = []; });
          room.status = 'setup';
          room.winnerId = null;
          room.deck = [];
          room.discardPile = [];
          room.logs = [];

          // Keep bots or reset them
          room.players = room.players.filter(p => !p.isBot);

          broadcastToRoom(code, 'ROOM_UPDATED', {
            players: getCleanPlayers(room.players),
            isFlipMode: room.isFlipMode,
            cardTheme: room.cardTheme
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

  room.players.forEach(p => {
    if (p.isBot || !p.ws) return;

    // Filter hands for privacy
    const cleanPlayers = room.players.map(other => {
      const isSelf = other.id === p.id;
      return {
        id: other.id,
        name: other.name,
        avatar: other.avatar,
        isBot: other.isBot,
        isHost: !!other.isHost,
        cards: isSelf ? other.cards : [],
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
      status: room.status,
      winnerId: room.winnerId,
      logs: room.logs,
      hasSaidUno: room.hasSaidUno,
      wildColorSelectionCard: room.wildColorSelectionCard,
      flipSide: room.flipSide,
      isFlipMode: room.isFlipMode,
      cardTheme: room.cardTheme
    });
  });
}

function triggerBotTurnsIfNeeded(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'playing') return;

  const current = room.players[room.currentPlayerIndex];
  if (!current || !current.isBot) return;

  // Let bot think and act on server side
  setTimeout(() => {
    const freshRoom = rooms.get(roomCode);
    if (!freshRoom || freshRoom.status !== 'playing') return;
    const bot = freshRoom.players[freshRoom.currentPlayerIndex];
    if (!bot || !bot.isBot) return;

    const playable = bot.cards.filter(c => isValidPlay(c, freshRoom.activeColor, freshRoom.activeValue));
    
    if (playable.length > 0) {
      // Pick strategy
      let card = playable[0];
      const coloredActions = playable.filter(c => c.color !== 'wild' && ['skip', 'reverse', 'draw2'].includes(c.value));
      const numbers = playable.filter(c => c.color !== 'wild' && !['skip', 'reverse', 'draw2'].includes(c.value));
      const wilds = playable.filter(c => c.color === 'wild');

      if (coloredActions.length > 0) {
        card = coloredActions[Math.floor(Math.random() * coloredActions.length)];
      } else if (numbers.length > 0) {
        card = numbers[Math.floor(Math.random() * numbers.length)];
      } else if (wilds.length > 0) {
        card = wilds[Math.floor(Math.random() * wilds.length)];
      }

      // Execute Bot Play
      const idx = bot.cards.findIndex(c => c.id === card.id);
      bot.cards.splice(idx, 1);

      let logMsg = `${bot.name} วางการ์ด [${card.color} ${card.value}]`;
      let nextColor = card.color;
      let nextValue = card.value;
      let step = 1;

      if (card.value === 'reverse') {
        freshRoom.direction = freshRoom.direction === 1 ? -1 : 1;
        logMsg += ` 🔄 ย้อนทิศทางของเกม!`;
      }

      if (card.value === 'skip') {
        if (freshRoom.flipSide === 'dark') {
          logMsg += ` 🚫 ข้ามหมดทุกคน! ได้เล่นซ้ำอีกตา!`;
          step = 4;
        } else {
          const nextIndex = (freshRoom.currentPlayerIndex + freshRoom.direction + 4) % 4;
          logMsg += ` 🚫 ข้ามตาของ ${freshRoom.players[nextIndex].name}!`;
          step = 2;
        }
      }

      if (card.value === 'draw2') {
        const victimIdx = (freshRoom.currentPlayerIndex + freshRoom.direction + 4) % 4;
        const victim = freshRoom.players[victimIdx];
        const penalty = freshRoom.flipSide === 'dark' ? 5 : 2;
        const cards = [];
        for (let i = 0; i < penalty; i++) {
          const c = freshRoom.deck.pop();
          if (c) cards.push(c);
        }
        victim.cards.push(...cards);
        logMsg += ` ➕${penalty} โทษทัณฑ์! ${victim.name} จั่ว ${penalty} ใบและถูกข้าม!`;
        step = 2;
      }

      if (card.value === 'flip') {
        freshRoom.flipSide = freshRoom.flipSide === 'light' ? 'dark' : 'light';
        logMsg += freshRoom.flipSide === 'dark' 
          ? ` 🌀 พลิกมิติเข้าสู่ [โลกกระจกฝั่งมืด]! 🌌👾`
          : ` 🌀 พลิกกลับเข้าสู่ [โลกสว่างปกติ]! ☀️🌈`;
      }

      if (card.color === 'wild') {
        // Choose color bot holds the most
        const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
        bot.cards.forEach(c => { if (c.color !== 'wild') counts[c.color]++; });
        let bestColor = 'red';
        let max = -1;
        Object.keys(counts).forEach(col => {
          if (counts[col] > max) {
            max = counts[col];
            bestColor = col;
          }
        });
        nextColor = bestColor;
        logMsg += ` 🎨 เปลี่ยนสีเป็น [${bestColor}]`;

        if (card.value === 'draw4') {
          const victimIdx = (freshRoom.currentPlayerIndex + freshRoom.direction + 4) % 4;
          const victim = freshRoom.players[victimIdx];
          const penalty = freshRoom.flipSide === 'dark' ? 6 : 4;
          const cards = [];
          for (let i = 0; i < penalty; i++) {
            const c = freshRoom.deck.pop();
            if (c) cards.push(c);
          }
          victim.cards.push(...cards);
          logMsg += ` ☠️ เปลี่ยนสีและสาด +${penalty}! ${victim.name} จั่ว ${penalty} ใบและถูกข้าม!`;
          step = 2;
        }
      }

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
        freshRoom.currentPlayerIndex = (freshRoom.currentPlayerIndex + step * freshRoom.direction + 4) % 4;
      }

      freshRoom.discardPile.unshift(card);
      freshRoom.activeColor = nextColor;
      freshRoom.activeValue = nextValue;

      broadcastGameState(roomCode);
      triggerBotTurnsIfNeeded(roomCode);
    } else {
      // Draw card
      const card = freshRoom.deck.pop();
      if (!card) return;

      bot.cards.push(card);
      const isPlayable = isValidPlay(card, freshRoom.activeColor, freshRoom.activeValue);
      let logMsg = `${bot.name} จั่วการ์ด 1 ใบ`;

      if (isPlayable) {
        // Server plays bot card immediately after a tiny delay to simulate flow
        setTimeout(() => {
          triggerBotTurnsIfNeeded(roomCode);
        }, 800);
      } else {
        logMsg += ` และผ่านตา`;
        freshRoom.currentPlayerIndex = (freshRoom.currentPlayerIndex + freshRoom.direction + 4) % 4;
      }

      freshRoom.logs.push({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('th-TH'),
        message: logMsg,
        type: 'draw'
      });

      broadcastGameState(roomCode);
      if (!isPlayable) {
        triggerBotTurnsIfNeeded(roomCode);
      }
    }
  }, 1200);
}

server.listen(3001, () => {
  console.log('แหม่มการ์ด Arena WebSocket Server running on port 3001');
});
