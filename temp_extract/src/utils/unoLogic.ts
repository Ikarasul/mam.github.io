import { Card, CardColor, CardValue } from '../types';

export function generateDeck(isFlipMode = false): Card[] {
  const colors: Exclude<CardColor, 'wild'>[] = ['red', 'blue', 'green', 'yellow'];
  const values: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
  const deck: Card[] = [];

  let cardIdCounter = 1;
  const nextId = () => `card-${cardIdCounter++}`;

  // Add colored cards
  colors.forEach(color => {
    // Value '0' occurs once per color
    deck.push({ id: nextId(), color, value: '0' });

    // Values '1'-'9', 'skip', 'reverse', 'draw2' occur twice per color
    values.forEach(value => {
      if (value !== '0') {
        deck.push({ id: nextId(), color, value });
        deck.push({ id: nextId(), color, value });
      }
    });

    // If flip mode is enabled, add 2 Flip action cards per color
    if (isFlipMode) {
      deck.push({ id: nextId(), color, value: 'flip' });
      deck.push({ id: nextId(), color, value: 'flip' });
    }
  });

  // Add 4 'wild' and 4 'draw4' cards, and 3 special 'nont_dam' cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'wild' });
    deck.push({ id: nextId(), color: 'wild', value: 'draw4' });
  }
  for (let i = 0; i < 3; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'nont_dam' });
    deck.push({ id: nextId(), color: 'wild', value: 'ai_gun' });
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function isValidPlay(card: Card, activeColor: CardColor, activeValue: CardValue): boolean {
  // Wild cards can always be played
  if (card.color === 'wild') {
    return true;
  }

  // Same color
  if (card.color === activeColor) {
    return true;
  }

  // Same value
  if (card.value === activeValue) {
    return true;
  }

  return false;
}

export function getCardColorClass(color: CardColor): string {
  switch (color) {
    case 'red':
      return 'bg-red-600 text-white border-red-500';
    case 'blue':
      return 'bg-blue-600 text-white border-blue-500';
    case 'green':
      return 'bg-green-600 text-white border-green-500';
    case 'yellow':
      return 'bg-yellow-500 text-black border-yellow-400';
    case 'wild':
      return 'bg-stone-900 border-stone-800 text-white';
    default:
      return 'bg-stone-600 border-stone-500 text-white';
  }
}

export function getCardColorNameThai(color: CardColor): string {
  switch (color) {
    case 'red': return 'สีแดง';
    case 'blue': return 'สีน้ำเงิน';
    case 'green': return 'สีเขียว';
    case 'yellow': return 'สีเหลือง';
    case 'wild': return 'การ์ดเปลี่ยนสี';
    default: return '';
  }
}

export function getCardValueThai(value: CardValue): string {
  switch (value) {
    case 'skip': return 'ข้ามตา (Skip)';
    case 'reverse': return 'ย้อนทิศทาง (Reverse)';
    case 'draw2': return 'หยิบการ์ด +2 (Draw Two)';
    case 'wild': return 'เปลี่ยนสี (Wild)';
    case 'draw4': return 'เปลี่ยนสี +4 (Wild Draw Four)';
    case 'nont_dam': return '👑 นนท์ดำซูเปอร์ป่วน (Nont-Dam Wild)';
    case 'ai_gun': return '👾 ไอกันระเบิดมือ (AI-Gun Chaos)';
    case 'flip': return 'สลับฝั่งโลกกระจก (Flip Side Card) 🌀';
    default: return value;
  }
}
