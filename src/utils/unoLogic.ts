import { Card, CardColor, CardValue } from '../types';

export function getCardColor(card: Card, flipSide: 'light' | 'dark'): CardColor {
  return (flipSide === 'dark' && card.darkColor) ? card.darkColor : card.color;
}

export function getCardValue(card: Card, flipSide: 'light' | 'dark'): CardValue {
  return (flipSide === 'dark' && card.darkValue) ? card.darkValue : card.value;
}

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

    // Values '1'-'9' occur twice, but action cards (skip, reverse, draw2) occur 3 times per color
    values.forEach(value => {
      if (value !== '0') {
        const isAction = ['skip', 'reverse', 'draw2'].includes(value as string);
        const repeatCount = isAction ? 3 : 2;
        for (let i = 0; i < repeatCount; i++) {
          deck.push({ id: nextId(), color, value });
        }
      }
    });

    // If flip mode is enabled, add 3 Flip action cards per color
    if (isFlipMode) {
      for (let i = 0; i < 3; i++) {
        deck.push({ id: nextId(), color, value: 'flip' });
      }
    }
  });

  // Add 8 'wild' and 8 'draw4' cards, and 10 special 'nont_dam' cards
  for (let i = 0; i < 8; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'wild' });
    deck.push({ id: nextId(), color: 'wild', value: 'draw4' });
  }
  for (let i = 0; i < 10; i++) {
    deck.push({ id: nextId(), color: 'wild', value: 'nont_dam' });
  }

  if (isFlipMode) {
    // Group deck cards by type
    const numbers = deck.filter(c => c.color !== 'wild' && c.value !== 'skip' && c.value !== 'reverse' && c.value !== 'draw2' && c.value !== 'flip');
    const actions = deck.filter(c => c.value === 'skip' || c.value === 'reverse' || c.value === 'draw2' || c.value === 'flip');
    const wilds = deck.filter(c => c.color === 'wild');

    // Helper to shuffle a copied list of pairs
    const shufflePairs = (arr: Card[]) => {
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
      if (card.color !== 'wild' && card.value !== 'skip' && card.value !== 'reverse' && card.value !== 'draw2' && card.value !== 'flip') {
        const pair = shuffledNumbers[numIdx++];
        card.darkColor = pair.color;
        card.darkValue = pair.value;
      } else if (card.value === 'skip' || card.value === 'reverse' || card.value === 'draw2' || card.value === 'flip') {
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

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function isValidPlay(card: Card, activeColor: CardColor, activeValue: CardValue, flipSide: 'light' | 'dark' = 'light'): boolean {
  const cardColor = getCardColor(card, flipSide);
  const cardValue = getCardValue(card, flipSide);

  // Wild cards can always be played
  if (cardColor === 'wild') {
    return true;
  }

  // Same color
  if (cardColor === activeColor) {
    return true;
  }

  // Same value
  if (cardValue === activeValue) {
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
    case 'flip': return 'สลับฝั่งโลกกระจก (Flip Side Card) 🌀';
    default: return value;
  }
}
