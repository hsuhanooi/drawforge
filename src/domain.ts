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
  "lingering_curse",
  "mark_of_ruin",
  "hexblade",
  "reapers_clause",
  "fire_sale",
  "cremate",
  "grave_fuel",
  "brand_the_soul",
  "harvester",
  "charge_up",
  "arc_lash",
  "blood_pact",
  "spite_shield"
] as const;

export type CardId = (typeof CARD_IDS)[number];
export type CardType = "attack" | "skill" | "power" | "curse";
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
    charged?: boolean;
  };
  enemy: {
    health: number;
    hex?: number;
    damage?: number;
    block?: number;
    intents?: IntentLike[];
    name?: string;
    rewardGold?: number;
  };
  drawCount?: number;
  exhaustPile?: unknown[];
  exhaustedThisTurn?: number;
  exhaustFromHand?: boolean;
}

export interface CombatState extends CombatMutationState {
  state: "active" | "victory" | "defeat";
  turn: "player" | "enemy" | null;
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  exhaustPile?: Card[];
  enemyTurnNumber?: number;
  enemyIntent?: IntentLike | null;
  enemyPhase?: string | null;
}

export type CardRarity = "common" | "uncommon" | "rare";

export interface CardKeyword {
  key: string;
  label?: string;
}

export interface CardCondition {
  kind: "enemy_hexed" | "player_charged" | "exhausted_this_turn" | "player_energy_at_least";
  value?: number;
}

export interface CardEffectStep {
  type: "damage" | "block" | "draw" | "energy" | "hex" | "exhaust_hand" | "conditional";
  amount?: number;
  condition?: CardCondition;
  then?: CardEffectStep[];
  else?: CardEffectStep[];
}

export interface Card {
  id: CardId;
  name: string;
  cost: number;
  type: CardType;
  effect?: (state: CombatState) => CombatState;
  effects?: CardEffectStep[];
  exhaust?: boolean;
  rarity?: CardRarity;
  keywords?: CardKeyword[];
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
  effect?: (state: CombatState) => CombatState;
  effects?: CardEffectStep[];
  exhaust?: boolean;
  rarity?: CardRarity;
  keywords?: CardKeyword[];
}

export interface RelicReward {
  id: string;
  name: string;
  description: string;
  rarity?: "common" | "uncommon" | "rare";
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
