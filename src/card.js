const createCard = ({ id, name, cost, type, effect, exhaust = false }) => ({
  id,
  name,
  cost,
  type,
  effect,
  exhaust
});

module.exports = {
  createCard
};
