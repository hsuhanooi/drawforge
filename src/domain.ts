export const CARD_IDS = [
  "strike",
  "defend",
  "bash",
  "barrier",
  "quick_strike",
  "focus",
  "volley",
  "surge",
  "hex",
  "punish",
  "burnout",
  "crackdown",
  "momentum",
  "wither",
  "siphon_ward",
  "detonate_sigil",
  "lingering_curse"
] as const;

export type CardId = (typeof CARD_IDS)[number];
export type CardType = "attack" | "skill";
export type EventKind = "shrine" | "forge" | "camp";

export interface IntentLike {
  type: string;
  value?: number;
  label: string;
  hits?: number;
}

export interface CombatMutationState {
  player: {
    health: number;
    block: number;
    energy?: number;
  };
  enemy: {
    health: number;
    hex?: number;
    damage?: number;
    intents?: IntentLike[];
  };
  drawCount?: number;
  exhaustPile?: unknown[];
}

export interface Card {
  id: CardId;
  name: string;
  cost: number;
  type: CardType;
  effect: (state: CombatMutationState) => CombatMutationState;
  exhaust?: boolean;
  damage?: number;
  block?: number;
  draw?: number;
  energyGain?: number;
  hex?: number;
  bonusVsHex?: number;
  bonusVsExhaust?: number;
  bonusBlockIfHighEnergy?: number;
  bonusBlockIfHexed?: number;
}

export interface CardDefinitionInput {
  id: CardId;
  name: string;
  cost: number;
  type: CardType;
  effect: (state: CombatMutationState) => CombatMutationState;
  exhaust?: boolean;
}

export interface RelicReward {
  id: string;
  name: string;
  description: string;
}

export type EventOption =
  | { id: string; effect: "heal"; amount: number }
  | { id: string; effect: "relic"; relic: RelicReward }
  | { id: string; effect: "remove" }
  | { id: string; effect: "gold"; amount: number }
  | { id: string; effect: "reward_cards"; cards: Card[] }
  | { id: string; effect: "add_card"; card: Card };

export interface EventState {
  id: string;
  kind: EventKind;
  text: string;
  options: EventOption[];
}

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: "combat" | "event" | "elite" | "boss";
  next: string[];
}

export interface RunState {
  state: string;
  player: {
    health: number;
    gold: number;
    deck: CardId[];
  };
  combat: unknown;
  map: {
    currentNodeId: string | null;
    nodes?: MapNode[];
    rows?: number;
    columns?: number;
  };
}

export type CardFactory = () => Card;
