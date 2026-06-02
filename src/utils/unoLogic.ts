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

    // If flip mode is enabled, add 3 Flip action cards per color
    if (isFlipMode) {
      for (let i = 0; i < 3; i++) {
        deck.push({ id: nextId(), color, value: 'flip' });
      }
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
  const newWilds: CardValue[] = ['swap', 'shield', 'bomb', 'spy', 'target2', 'discard'];
  newWilds.forEach(val => {
    deck.push({ id: nextId(), color: 'wild', value: val });
    deck.push({ id: nextId(), color: 'wild', value: val });
  });

  if (isFlipMode) {
    // Group deck cards by type
    const numbers = deck.filter(c => c.color !== 'wild' && !['skip', 'reverse', 'draw2', 'flip', 'double', 'strike', 'freeze', 'copy'].includes(c.value));
    const actions = deck.filter(c => ['skip', 'reverse', 'draw2', 'flip', 'double', 'strike', 'freeze', 'copy'].includes(c.value));
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
    case 'swap': return 'สลับการ์ดทั้งหมด (Wild Swap) ⇄';
    case 'shield': return 'ป้องกันการจั่ว (Wild Shield) 🛡️';
    case 'bomb': return 'ระเบิดจั่วรอบวง (Wild Bomb) 💣';
    case 'spy': return 'ส่องการ์ดเพื่อน (Wild Spy) 👁️';
    case 'target2': return 'เล็งเป้าจั่ว 2 (Wild Target +2) 🎯';
    case 'discard': return 'ทิ้งสีหมดมือ (Wild Discard) 🗑️';
    case 'double': return 'เล่นคู่เบิ้ลการ์ด (Yellow Double) 2️⃣';
    case 'strike': return 'จู่โจมสายฟ้าแลบ (Red Strike) ⚡';
    case 'freeze': return 'แช่แข็งกุมขมับ (Blue Freeze) ❄️';
    case 'copy': return 'เลียนแบบการ์ดก่อนหน้า (Green Copy) ⎘';
    default: return value;
  }
}
