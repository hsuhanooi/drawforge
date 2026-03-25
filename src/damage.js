const applyDamage = (combat, amount) => {
  const blockAbsorb = Math.min(combat.player.block, amount);
  const remaining = amount - blockAbsorb;

  return {
    ...combat,
    player: {
      ...combat.player,
      block: combat.player.block - blockAbsorb,
      health: Math.max(0, combat.player.health - remaining)
    }
  };
};

module.exports = {
  applyDamage
};
