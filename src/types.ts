export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type CardValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'draw4' | 'nont_dam' | 'flip';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isBot: boolean;
  avatar: string;
}

export interface GameLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'play' | 'draw' | 'skip' | 'reverse' | 'uno' | 'system' | 'win';
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  activeColor: CardColor; // Current color matching requirement (changes on wild)
  activeValue: CardValue; // Current value matching requirement
  status: 'playing' | 'gameover' | 'setup';
  winnerId: string | null;
  logs: GameLog[];
  hasSaidUno: Record<string, boolean>; // playerId -> true
  wildColorSelectionCard: Card | null; // Card that triggered a wild picker
  flipModeEnabled: boolean;
  flipSide: 'light' | 'dark';
}
