const { createBrowserRun, chooseArchetype } = require("../src/browserRunActions");
const { startCombatForNode, playCombatCard, endCombatTurn } = require("../src/browserCombatActions");
const { createCardCatalog } = require("../src/cardCatalog");

const CARD_CATALOG = createCardCatalog();
const combatNode = { id: "r0c0", row: 0, col: 0, type: "combat", next: [] };

const makeRun = () => chooseArchetype(createBrowserRun(), "static_duelist");

const startConfiguredCombat = () => {
  const run = makeRun();
  const combat = startCombatForNode(run, combatNode);
  combat.enemyIntent = { type: "block", value: 0, label: "Wait" };
  combat.enemy.health = 80;
  combat.enemy.block = 0;
  combat.player.energy = 3;
  combat.player.strength = 0;
  combat.player.weak = 0;
  combat.player.charged = false;
  combat.enemy.vulnerable = 0;
  combat.enemy.poison = 0;
  combat.powers = [];
  return { run, combat };
};

describe("multi-hit and build-around powers", () => {
  it("flurry_of_blows applies damage across block independently per hit", () => {
    const { run, combat } = startConfiguredCombat();
    combat.enemy.block = 5;
    combat.hand = [{ ...CARD_CATALOG.flurry_of_blows }];

    const nextRun = playCombatCard({ ...run, combat }, 0);

    expect(nextRun.combat.enemy.block).toBe(0);
    expect(nextRun.combat.enemy.health).toBe(73);
  });

  it("volt_barrage hits 3 times normally and 5 times while charged", () => {
    const normal = startConfiguredCombat();
    normal.combat.hand = [{ ...CARD_CATALOG.volt_barrage }];
    const normalRun = playCombatCard({ ...normal.run, combat: normal.combat }, 0);

    const charged = startConfiguredCombat();
    charged.combat.player.charged = true;
    charged.combat.hand = [{ ...CARD_CATALOG.volt_barrage }];
    const chargedRun = playCombatCard({ ...charged.run, combat: charged.combat }, 0);

    expect(normalRun.combat.enemy.health).toBe(71);
    expect(chargedRun.combat.enemy.health).toBe(65);
  });

  it("multi-hit attack applies vulnerable, weak, and strength on each hit", () => {
    const { run, combat } = startConfiguredCombat();
    combat.player.strength = 2;
    combat.player.weak = 1;
    combat.enemy.vulnerable = 1;
    combat.hand = [{ ...CARD_CATALOG.flurry_of_blows }];

    const nextRun = playCombatCard({ ...run, combat }, 0);

    expect(nextRun.combat.enemy.health).toBe(64);
  });

  it("noxious_presence applies poison whenever an attack is played", () => {
    const { run, combat } = startConfiguredCombat();
    combat.powers = [{ id: "noxious_presence", label: "Noxious Presence", ...CARD_CATALOG.noxious_presence }];
    combat.hand = [{ ...CARD_CATALOG.strike }];

    const nextRun = playCombatCard({ ...run, combat }, 0);

    expect(nextRun.combat.enemy.poison).toBe(1);
  });

  it("charged_field makes the player charged and draws an extra card each turn", () => {
    const { run, combat } = startConfiguredCombat();
    combat.hand = [{ ...CARD_CATALOG.charged_field }];
    combat.drawPile = [
      { ...CARD_CATALOG.strike },
      { ...CARD_CATALOG.defend },
      { ...CARD_CATALOG.volt_barrage },
      { ...CARD_CATALOG.arc_lash },
      { ...CARD_CATALOG.static_guard },
      { ...CARD_CATALOG.charge_up }
    ];
    combat.discardPile = [];

    const afterPlay = playCombatCard({ ...run, combat }, 0);
    const afterTurn = endCombatTurn(afterPlay);

    expect(afterTurn.combat.player.charged).toBe(true);
    expect(afterTurn.combat.hand).toHaveLength(6);
  });
});
