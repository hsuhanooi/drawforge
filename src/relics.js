const RELICS = [
  {
    id: "iron_core",
    name: "Iron Core",
    description: "+5 max health and heal 5 immediately"
  },
  {
    id: "feather_charm",
    name: "Feather Charm",
    description: "Gain 15 gold immediately"
  },
  {
    id: "ember_ring",
    name: "Ember Ring",
    description: "Start combat with +1 energy"
  }
];

const createRelicReward = (index = 0) => RELICS[index % RELICS.length];

const addRelicToRun = (run, relic) => {
  const relics = [...(run.relics || []), relic];
  const nextPlayer = { ...run.player };

  if (relic.id === "iron_core") {
    nextPlayer.health += 5;
  }

  if (relic.id === "feather_charm") {
    nextPlayer.gold += 15;
  }

  return {
    ...run,
    relics,
    player: nextPlayer
  };
};

const getCombatEnergyBonus = (run) => ((run.relics || []).some((relic) => relic.id === "ember_ring") ? 1 : 0);

module.exports = {
  RELICS,
  createRelicReward,
  addRelicToRun,
  getCombatEnergyBonus
};
