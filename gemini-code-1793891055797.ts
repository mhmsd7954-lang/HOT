export type Gender = 'boy' | 'girl';

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  titles: string[];
}

export interface HistoryEntry {
  id: string;
  gameId: string;
  gameTitle: string;
  text: string;
  at: number;
}

export interface PartyState {
  players: Player[];
  scores: Record<string, number>;
  history: HistoryEntry[];
}

export type Tone =
  | 'gold'
  | 'coral'
  | 'mint'
  | 'violet'
  | 'pink'
  | 'amber'
  | 'sky'
  | 'rose'
  | 'lime'
  | 'orchid'
  | 'sand'
  | 'teal'
  | 'indigo';

export type GameIconName =
  | 'mask'
  | 'wheel'
  | 'pepper'
  | 'crown'
  | 'music'
  | 'timer'
  | 'fork'
  | 'ban'
  | 'letters'
  | 'brain'
  | 'pen'
  | 'grid'
  | 'book'
  | 'mic'
  | 'hourglass'
  | 'check'
  | 'link'
  | 'user'
  | 'story'
  | 'swap'
  | 'chain'
  | 'theater';

export interface GameDefinition {
  id: string;
  title: string;
  tagline: string;
  description: string;
  minPlayers: number;
  maxPlayers?: number;
  duration: string;
  tone: Tone;
  icon: GameIconName;
  badge?: string;
}