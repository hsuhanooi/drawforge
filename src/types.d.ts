export type CardId =
  | "strike"
  | "defend"
  | "bash"
  | "barrier"
  | "quick_strike"
  | "focus"
  | "volley"
  | "surge"
  | "hex"
  | "punish"
  | "burnout"
  | "crackdown"
  | "momentum"
  | "wither"
  | "siphon_ward"
  | "detonate_sigil"
  | "lingering_curse"
  | "venom_strike"
  | "toxic_cloud"
  | "creeping_blight"
  | "septic_touch"
  | "infectious_wound"
  | "ember_throw"
  | "kindle"
  | "scorch"
  | "funeral_pyre"
  | "smoldering_brand";

export type CardType = "attack" | "skill";

export interface CombatStateLike {
  player: {
    health: number;
    block?: number;
    energy?: number;
  };
  enemy: {
    health: number;
    hex?: number;
    damage?: number;
    intents?: Array<{ type: string; value?: number; label: string; hits?: number }>;
  };
  drawPile?: Card[];
  hand?: Card[];
  discardPile?: Card[];
  exhaustPile?: Card[];
  state?: string;
  turn?: string | null;
  enemyTurnNumber?: number;
  enemyIntent?: { type: string; value?: number; label: string; hits?: number };
}

export interface Card {
  id: CardId;
  name: string;
  cost: number;
  type: CardType;
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
  effect: (state: any) => any;
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

export interface EventNodeInput {
  id: string;
  row: number;
  col: number;
}

export interface EventState {
  id: string;
  kind: "shrine" | "forge" | "camp";
  text: string;
  options: EventOption[];
}

export interface RunPlayerState {
  health: number;
  gold?: number;
  deck: CardId[];
}

export interface RunStateLike {
  player: RunPlayerState;
}

export type CardFactory = () => Card;
