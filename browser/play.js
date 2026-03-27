/* eslint-env browser */
(() => {
  const STORAGE_KEY = "drawforge.run.play";

  // ─── Game Constants ──────────────────────────────────────────────
  const DEFAULT_PLAYER_HEALTH = 80;
  const DEFAULT_PLAYER_GOLD   = 99;
  const DEFAULT_PLAYER_ENERGY = 3;
  const DEFAULT_STARTER_DECK  = [
    "strike","strike","strike","strike","strike",
    "defend","defend","defend","defend","defend"
  ];

  const NODE_ICONS = { combat: "⚔️", elite: "⭐", boss: "👑", event: "❓" };
  const ENEMY_ICONS = {
    // Early zone
    slime:"🟢", fangling:"🦷", bone_sprite:"💀", ashrat:"🐀",
    grub:"🐛", crypt_bat:"🦇", pale_leech:"🪱",
    // Mid zone
    mossling:"🌿", cinder_fiend:"🔥", plagued_rat:"🐭", hex_crawler:"🕷️",
    rust_knight:"⚒️", shade:"🌫️", curse_hound:"🦊",
    // Late zone
    ironback_toad:"🐸", marrow_hound:"🐺", shadow_brute:"🌑", voidling:"🌀",
    grave_walker:"🧟", barrow_beast:"🐗", siege_golem:"🏗️",
    // Elite
    cultist_captain:"🕯️", bone_warden:"🦴", hexbinder:"🔮",
    plague_doctor:"🩺", void_seer:"👁️",
    // Boss
    spire_guardian:"🗿", ashen_king:"👑", corrupted_pyre:"☄️", hollow_one:"🕳️"
  };

  // ─── Card Library ────────────────────────────────────────────────
  const CARD_LIBRARY = {
    strike:        { id:"strike",        name:"Strike",         cost:1, type:"attack",  rarity:"common",   damage:6 },
    defend:        { id:"defend",        name:"Defend",         cost:1, type:"skill",   rarity:"common",   block:5 },
    mark_of_ruin:  { id:"mark_of_ruin",  name:"Mark of Ruin",   cost:1, type:"skill",   rarity:"common",   hex:1, draw:1 },
    hexblade:      { id:"hexblade",      name:"Hexblade",       cost:1, type:"attack",  rarity:"common",   damage:7, hex:1 },
    reapers_clause:{ id:"reapers_clause",name:"Reaper's Clause", cost:2, type:"attack", rarity:"uncommon", damage:10, costReduceIfHexed:1 },
    fire_sale:     { id:"fire_sale",     name:"Fire Sale",      cost:0, type:"skill",   rarity:"common",   exhaustFromHand:true, draw:2 },
    cremate:       { id:"cremate",       name:"Cremate",        cost:1, type:"skill",   rarity:"common",   exhaustFromHand:true, block:6 },
    grave_fuel:    { id:"grave_fuel",    name:"Grave Fuel",     cost:1, type:"skill",   rarity:"rare",     energyPerExhausted:true },
    brand_the_soul:{ id:"brand_the_soul",name:"Brand the Soul", cost:1, type:"skill",   rarity:"uncommon", hex:1, exhaustFromHand:true },
    harvester:     { id:"harvester",     name:"Harvester",      cost:1, type:"attack",  rarity:"rare",     damage:4, bonusVsHexedOrExhausted:4 },
    charge_up:     { id:"charge_up",     name:"Charge Up",      cost:1, type:"skill",   rarity:"common",   setCharged:true, draw:1 },
    arc_lash:      { id:"arc_lash",      name:"Arc Lash",       cost:1, type:"attack",  rarity:"common",   damage:7, drawIfCharged:1 },
    blood_pact:    { id:"blood_pact",    name:"Blood Pact",     cost:0, type:"skill",   rarity:"rare",     selfDamage:3, energyGain:2, draw:1 },
    spite_shield:  { id:"spite_shield",  name:"Spite Shield",   cost:1, type:"skill",   rarity:"uncommon", block:6, hex:1 },
    // ── Hex ───────────────────────────────────────────────────────────
    deep_hex:         { id:"deep_hex",         name:"Deep Hex",         cost:2, type:"skill",  rarity:"uncommon", hex:3 },
    feast_on_weakness:{ id:"feast_on_weakness", name:"Feast on Weakness",cost:1, type:"attack", rarity:"common",   damage:5, bonusBlockIfHexed:5 },
    curse_spiral:     { id:"curse_spiral",      name:"Curse Spiral",     cost:2, type:"skill",  rarity:"uncommon", hex:1, draw:1 },
    black_seal:       { id:"black_seal",        name:"Black Seal",       cost:0, type:"skill",  rarity:"common",   hex:1, exhaust:true },
    malediction:      { id:"malediction",       name:"Malediction",      cost:1, type:"skill",  rarity:"uncommon", hex:1, weakenEnemy:2 },
    // ── Exhaust ───────────────────────────────────────────────────────
    overclock:        { id:"overclock",         name:"Overclock",        cost:1, type:"skill",  rarity:"uncommon", energyGain:2, discardRandom:1, exhaust:true },
    final_draft:      { id:"final_draft",       name:"Final Draft",      cost:1, type:"skill",  rarity:"uncommon", draw:2, exhaustFromHand:true },
    scorch_nerves:    { id:"scorch_nerves",     name:"Scorch Nerves",    cost:2, type:"attack", rarity:"common",   damage:12, exhaust:true },
    cinder_rush:      { id:"cinder_rush",       name:"Cinder Rush",      cost:1, type:"attack", rarity:"uncommon", damage:6, bonusDamagePerExhaust:3 },
    hollow_ward:      { id:"hollow_ward",       name:"Hollow Ward",      cost:1, type:"skill",  rarity:"common",   block:8, exhaust:true },
    // ── Hex / Exhaust ─────────────────────────────────────────────────
    soul_rend:        { id:"soul_rend",         name:"Soul Rend",        cost:2, type:"attack", rarity:"rare",     damage:9, hexedExhaustAndEnergy:true },
    unseal:           { id:"unseal",            name:"Unseal",           cost:1, type:"attack", rarity:"uncommon", damage:5, bonusVsHex:5, exhaust:true },
    ritual_collapse:  { id:"ritual_collapse",   name:"Ritual Collapse",  cost:2, type:"skill",  rarity:"rare",     exhaustFromHandCount:2, hexPerExhausted:true },
    doom_bell:        { id:"doom_bell",         name:"Doom Bell",        cost:2, type:"skill",  rarity:"rare",     hex:2, exhaustAllSkillsInHand:true },
    hexburst:         { id:"hexburst",          name:"Hexburst",         cost:2, type:"attack", rarity:"rare",     damage:6, consumeHex:true, bonusDamagePerHexConsumed:4 },
    cataclysm_sigil:  { id:"cataclysm_sigil",   name:"Cataclysm Sigil",  cost:3, type:"attack", rarity:"rare",     damage:18, bonusDamagePerHex:4 },
    no_mercy:         { id:"no_mercy",          name:"No Mercy",         cost:2, type:"attack", rarity:"rare",     damage:10, repeatIfHexed:true },
    // ── Charged ───────────────────────────────────────────────────────
    static_guard:     { id:"static_guard",      name:"Static Guard",     cost:1, type:"skill",  rarity:"common",   block:6, energyIfCharged:1 },
    capacitor:        { id:"capacitor",         name:"Capacitor",        cost:0, type:"skill",  rarity:"common",   setCharged:true, exhaust:true },
    release:          { id:"release",           name:"Release",          cost:2, type:"attack", rarity:"uncommon", damage:14, costReduceIfCharged:1, unsetCharged:true },
    guarded_pulse:    { id:"guarded_pulse",     name:"Guarded Pulse",    cost:1, type:"skill",  rarity:"common",   block:5, blockIfCharged:10 },
    flashstep:        { id:"flashstep",         name:"Flashstep",        cost:0, type:"skill",  rarity:"uncommon", flashstep:true },
    // ── Neutral ───────────────────────────────────────────────────────
    pommel:           { id:"pommel",            name:"Pommel",           cost:1, type:"attack", rarity:"common",   damage:7 },
    brace:            { id:"brace",             name:"Brace",            cost:1, type:"skill",  rarity:"common",   block:7 },
    insight:          { id:"insight",           name:"Insight",          cost:1, type:"skill",  rarity:"common",   draw:2 },
    parry:            { id:"parry",             name:"Parry",            cost:0, type:"skill",  rarity:"common",   block:3 },
    heavy_swing:      { id:"heavy_swing",       name:"Heavy Swing",      cost:2, type:"attack", rarity:"common",   damage:12 },
    plan_ahead:       { id:"plan_ahead",        name:"Plan Ahead",       cost:0, type:"skill",  rarity:"common",   draw:1, discardRandom:1 },
    // ── Risk / Energy ─────────────────────────────────────────────────
    empty_the_chamber:{ id:"empty_the_chamber", name:"Empty the Chamber",cost:1, type:"skill",  rarity:"rare",     exhaustHand:true, energyPerExhausted:true },
    last_word:        { id:"last_word",         name:"Last Word",        cost:1, type:"attack", rarity:"rare",     damage:8, bonusDamageIfLastCard:12 },
    // ── Defense / Hex ─────────────────────────────────────────────────
    warding_circle:   { id:"warding_circle",    name:"Warding Circle",   cost:2, type:"skill",  rarity:"uncommon", block:12, costReduceIfHexed:1 }
  };

  // ─── Relics ──────────────────────────────────────────────────────
  const RELICS = [
    // ── Common ──────────────────────────────────────────────────────────
    { id:"iron_core",        name:"Iron Core",          description:"+5 max health and heal 5 immediately",          rarity:"common",   icon:"🪨" },
    { id:"feather_charm",    name:"Feather Charm",      description:"+15 gold immediately",                           rarity:"common",   icon:"🪶" },
    { id:"ember_ring",       name:"Ember Ring",         description:"+1 energy each turn",                            rarity:"common",   icon:"💍" },
    { id:"bone_token",       name:"Bone Token",         description:"Heal 3 after each combat victory",               rarity:"common",   icon:"🦴" },
    { id:"rusted_buckler",   name:"Rusted Buckler",     description:"Start each combat with 4 Block",                 rarity:"common",   icon:"🛡️" },
    { id:"quickened_loop",   name:"Quickened Loop",     description:"Draw 1 extra card on turn 1",                    rarity:"common",   icon:"🔄" },
    { id:"lucky_coin",       name:"Lucky Coin",         description:"+10 gold now; combat rewards give +5 gold",      rarity:"common",   icon:"🪙" },
    { id:"flicker_charm",    name:"Flicker Charm",      description:"First Attack each combat deals +3 damage",       rarity:"common",   icon:"🔮" },
    { id:"pilgrim_map",      name:"Pilgrim's Map",      description:"+10 gold now; non-boss rewards give +3 gold",    rarity:"common",   icon:"🗺️" },
    { id:"leather_thread",   name:"Leather Thread",     description:"+1 max HP after every 3 combats won",            rarity:"common",   icon:"🧵" },
    { id:"ashen_idol",       name:"Ashen Idol",         description:"Gain +1 energy on turn 1 of each combat",        rarity:"common",   icon:"🏺" },
    // ── Uncommon ────────────────────────────────────────────────────────
    { id:"worn_grimoire",    name:"Worn Grimoire",      description:"First Hex each combat applies +1 extra",         rarity:"uncommon", icon:"📖" },
    { id:"coal_pendant",     name:"Coal Pendant",       description:"First card Exhausted each combat draws 1",       rarity:"uncommon", icon:"⛏️" },
    { id:"hex_nail",         name:"Hex Nail",           description:"Attacks deal +2 dmg to Hexed enemies",           rarity:"uncommon", icon:"🔩" },
    { id:"cinder_box",       name:"Cinder Box",         description:"Each Exhaust gives 2 Block",                     rarity:"uncommon", icon:"📦" },
    { id:"volt_shard",       name:"Volt Shard",         description:"Becoming Charged: gain 1 Block, draw 1",         rarity:"uncommon", icon:"⚡" },
    { id:"merchant_ledger",  name:"Merchant's Ledger",  description:"Card rewards offer 1 extra choice",              rarity:"uncommon", icon:"📒" },
    { id:"brass_lantern",    name:"Brass Lantern",      description:"+1 energy per turn in Elite and Boss fights",    rarity:"uncommon", icon:"🔦" },
    { id:"cracked_mirror",   name:"Cracked Mirror",     description:"First Skill each combat is played twice",        rarity:"uncommon", icon:"🪞" },
    { id:"thorn_crest",      name:"Thorn Crest",        description:"When you take HP damage, deal 3 back",           rarity:"uncommon", icon:"🌵" },
    { id:"soot_vessel",      name:"Soot Vessel",        description:"After victory at ≤50% HP, heal 6",               rarity:"uncommon", icon:"🫙" },
    { id:"duelist_thread",   name:"Duelist's Thread",   description:"First Attack each turn deals +2 damage",         rarity:"uncommon", icon:"🗡️" },
    { id:"grave_wick",       name:"Grave Wick",         description:"First Exhaust card each combat costs 0",         rarity:"uncommon", icon:"🕯️" },
    // ── Rare ────────────────────────────────────────────────────────────
    { id:"sigil_engine",     name:"Sigil Engine",       description:"Enemy first hit 3+ Hex: deal 8 damage",          rarity:"rare",     icon:"⚙️" },
    { id:"time_locked_seal", name:"Time-Locked Seal",   description:"First card ≤1 cost each turn costs 0",           rarity:"rare",     icon:"🔒" },
    { id:"phoenix_ash",      name:"Phoenix Ash",        description:"Once per run: survive death at 1 HP",            rarity:"rare",     icon:"🔥" },
    { id:"crown_of_cinders", name:"Crown of Cinders",   description:"+1 energy per turn; costs 2 max HP to obtain",   rarity:"rare",     icon:"👑" },
    { id:"black_prism",      name:"Black Prism",        description:"After 3 Exhausts in one combat, gain 1 energy",  rarity:"rare",     icon:"🔷" },
    { id:"storm_vessel",     name:"Storm Vessel",       description:"Becoming Charged on turn 2+: +1 energy",         rarity:"rare",     icon:"⛈️" },
    { id:"empty_throne",     name:"Empty Throne",       description:"Draw 2 extra on turn 1; draw 1 fewer on turn 2", rarity:"rare",     icon:"🪑" },
    { id:"furnace_heart",    name:"Furnace Heart",      description:"Attack cards that self-Exhaust deal +4 damage",  rarity:"rare",     icon:"🫀" },
    { id:"hex_lantern",      name:"Hex Lantern",        description:"First time you deal damage each combat: Hex 1",  rarity:"rare",     icon:"🏮" },
    { id:"golden_brand",     name:"Golden Brand",       description:"+25 gold now; card rewards offer 1 extra choice",rarity:"rare",     icon:"🏅" },
    // ── Boss ────────────────────────────────────────────────────────────
    { id:"infernal_battery", name:"Infernal Battery",   description:"+1 energy per turn; draw 1 fewer on turn 1",     rarity:"boss",     icon:"🔋" },
    { id:"blood_crucible",   name:"Blood Crucible",     description:"Cards that cost HP: double their energy and draw",rarity:"boss",     icon:"🩸" },
    { id:"hex_crown",        name:"Hex Crown",          description:"Enemies start each combat with Hex 1",           rarity:"boss",     icon:"🔴" },
    { id:"crematorium_bell", name:"Crematorium Bell",   description:"First 2 Exhausts each combat also give +1 energy",rarity:"boss",    icon:"🔔" },
    { id:"storm_diadem",     name:"Storm Diadem",       description:"Start each combat Charged",                      rarity:"boss",     icon:"🌩️" },
    { id:"vault_key",        name:"Vault Key",          description:"Boss fights offer 2 relic choices instead of 1", rarity:"boss",     icon:"🗝️" }
  ];

  // ─── Events ──────────────────────────────────────────────────────
  const EVENT_TEMPLATES = [
    {
      id:"shrine",
      title:"Ancient Shrine",
      text:"A quiet shrine offers healing, a relic, or a chance to refine your deck.",
      createOptions: () => {
        const pool = RELICS.filter((r) => r.rarity === "common" || r.rarity === "uncommon");
        const relic = pickUniqueItems(pool, 1)[0];
        return [
          { id:"heal",   label:"🩹 Recover 10 health", effect:"heal" },
          { id:"relic",  label:`✨ Take ${relic.name}`, effect:"relic", relic },
          { id:"remove", label:"🔥 Remove a card", effect:"remove" }
        ];
      }
    },
    {
      id:"forge",
      title:"Old Forge",
      text:"An old forge lets you sharpen your deck with a free reward card or extra gold.",
      createOptions: () => [
        { id:"gold",   label:"💰 Take 20 gold", effect:"gold", amount:20 },
        { id:"card",   label:"🃏 Take a forged card", effect:"reward_cards", cards:createRewardCardOptions(3) },
        { id:"remove", label:"🔥 Burn a weak card", effect:"remove" }
      ]
    },
    {
      id:"camp",
      title:"Roadside Camp",
      text:"A roadside camp gives you time to recover or prepare for the next fight.",
      createOptions: () => [
        { id:"heal",  label:"🩹 Recover 12 health", effect:"heal", amount:12 },
        { id:"cards", label:"🃏 Take a card",        effect:"reward_cards", cards:createRewardCardOptions(3) },
        { id:"remove",label:"🔥 Remove a card",      effect:"remove" }
      ]
    }
  ];

  // ─── Core Utilities ───────────────────────────────────────────────
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function createCardFromId(id) {
    const card = CARD_LIBRARY[id];
    if (!card) throw new Error(`Unknown card: ${id}`);
    return { ...card };
  }

  function pickUniqueItems(items, count) {
    const pool = [...items];
    const chosen = [];
    while (pool.length > 0 && chosen.length < count) {
      const i = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(i, 1)[0]);
    }
    return chosen;
  }

  function createRewardCardOptions(count = 3) {
    const rarityWeight = { common: 3, uncommon: 2, rare: 1 };
    // Build a weighted pool: each card appears (weight) times so commons are more likely
    const pool = [];
    Object.values(CARD_LIBRARY).forEach((card) => {
      if (card.id === "strike" || card.id === "defend") return;
      const w = rarityWeight[card.rarity] ?? 1;
      for (let i = 0; i < w; i++) pool.push(card.id);
    });
    // Pick without repeating the same card id even if it appears multiple times in the pool
    const seen = new Set();
    const chosen = [];
    const remaining = [...pool];
    while (remaining.length > 0 && chosen.length < count) {
      const i = Math.floor(Math.random() * remaining.length);
      const id = remaining.splice(i, 1)[0];
      if (!seen.has(id)) { seen.add(id); chosen.push(id); }
    }
    return chosen.map(createCardFromId);
  }

  function shuffleCards(cards) {
    const s = [...cards];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  }

  // ─── Map Generation ───────────────────────────────────────────────
  function buildRowTypeSelections(rows, columns) {
    const sel = new Map();
    for (let row = 0; row < rows; row++) {
      if (row === rows - 1 || row === rows - 2) continue;
      const cols = Array.from({ length: columns }, (_, i) => i);
      const events = row > 0 ? new Set(pickUniqueItems(cols, 1)) : new Set();
      const nonEvent = cols.filter((c) => !events.has(c));
      const elites = row > 0 && row % 2 === 0 && row < rows - 2
        ? new Set(pickUniqueItems(nonEvent, 1)) : new Set();
      sel.set(row, { events, elites });
    }
    return sel;
  }

  function getNodeType(row, col, rows, sel = {}) {
    if (row === rows - 1) return "boss";
    if (row === rows - 2) return "elite";
    if (sel.events && sel.events.has(col)) return "event";
    if (sel.elites && sel.elites.has(col)) return "elite";
    return "combat";
  }

  function generateMap({ rows = 5, columns = 3 } = {}) {
    const sel = buildRowTypeSelections(rows, columns);
    const nodes = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        nodes.push({
          id: `r${row}c${col}`, row, col,
          type: getNodeType(row, col, rows, sel.get(row) || {}),
          next: []
        });
      }
    }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < columns; col++) {
        const nextCols = [col];
        if (col > 0) nextCols.push(col - 1);
        if (col < columns - 1) nextCols.push(col + 1);
        byId.get(`r${row}c${col}`).next = nextCols.map((nc) => `r${row+1}c${nc}`);
      }
    }
    return { rows, columns, nodes, currentNodeId: null };
  }

  // ─── Enemy Factory ────────────────────────────────────────────────
  // Each enemy has intents that cycle by turn number.
  // "buff" intents add to enemy.strengthBuff — applied to all subsequent attacks.

  // ── Boss Pool ────────────────────────────────────────────────────────
  const BOSS_POOL = [
    { id:"spire_guardian", name:"Spire Guardian", health:70, rewardGold:50, intents:[
      { type:"attack",       value:12, label:"Crush 12" },
      { type:"block",        value:10, label:"Fortify +10" },
      { type:"multi_attack", value:4,  hits:3, label:"Barrage 3×4" },
      { type:"block",        value:5,  label:"Brace +5" },
      { type:"attack",       value:15, label:"Slam 15" }
    ]},
    { id:"ashen_king", name:"The Ashen King", health:90, rewardGold:50, intents:[
      { type:"attack",       value:11, label:"Crown Strike 11" },
      { type:"block",        value:8,  label:"Bulwark +8" },
      { type:"buff",         value:3,  label:"Decree +3 strength" },
      { type:"attack",       value:15, label:"Crown Strike 15" },
      { type:"multi_attack", value:4,  hits:4, label:"Iron Edict 4×4" }
    ]},
    { id:"corrupted_pyre", name:"Corrupted Pyre", health:85, rewardGold:50, intents:[
      { type:"attack",       value:9,  label:"Smolder 9" },
      { type:"block",        value:10, label:"Flare +10" },
      { type:"multi_attack", value:5,  hits:3, label:"Conflagrate 3×5" },
      { type:"buff",         value:3,  label:"Ignite +3 strength" },
      { type:"attack",       value:14, label:"Incinerate 14" }
    ]},
    { id:"hollow_one", name:"The Hollow One", health:80, rewardGold:50, intents:[
      { type:"buff",         value:3,  label:"Consume +3 strength" },
      { type:"attack",       value:13, label:"Ravage 13" },
      { type:"multi_attack", value:5,  hits:3, label:"Hollow Shriek 3×5" },
      { type:"block",        value:10, label:"Absorb +10" },
      { type:"attack",       value:18, label:"Devour 18" }
    ]}
  ];

  // ── Elite Pool ───────────────────────────────────────────────────────
  const ELITE_POOL = [
    { id:"cultist_captain", name:"Cultist Captain", health:45, rewardGold:25, intents:[
      { type:"attack",       value:9,  label:"Heavy Strike 9" },
      { type:"buff",         value:2,  label:"Rally +2 strength" },
      { type:"multi_attack", value:5,  hits:2, label:"Frenzy 2×5" }
    ]},
    { id:"bone_warden", name:"Bone Warden", health:58, rewardGold:25, intents:[
      { type:"block",        value:10, label:"Guard +10" },
      { type:"attack",       value:14, label:"Reap 14" },
      { type:"multi_attack", value:5,  hits:3, label:"Invoke 3×5" },
      { type:"block",        value:5,  label:"Fortify +5" }
    ]},
    { id:"hexbinder", name:"Hexbinder", health:50, rewardGold:25, intents:[
      { type:"buff",         value:2,  label:"Mark +2 strength" },
      { type:"attack",       value:10, label:"Sear 10" },
      { type:"multi_attack", value:4,  hits:3, label:"Hex Wail 3×4" },
      { type:"attack",       value:14, label:"Sear 14" }
    ]},
    { id:"plague_doctor", name:"Plague Doctor", health:52, rewardGold:25, intents:[
      { type:"buff",         value:3,  label:"Infect +3 strength" },
      { type:"attack",       value:11, label:"Dose 11" },
      { type:"multi_attack", value:4,  hits:3, label:"Swarm 3×4" },
      { type:"attack",       value:16, label:"Purge 16" }
    ]},
    { id:"void_seer", name:"Void Seer", health:48, rewardGold:25, intents:[
      { type:"block",        value:6,  label:"Vision +6" },
      { type:"attack",       value:13, label:"Blast 13" },
      { type:"buff",         value:3,  label:"Drain +3 strength" },
      { type:"multi_attack", value:4,  hits:3, label:"Void Bolt 3×4" }
    ]}
  ];

  // ── Regular Combat Enemies (zone-scaled by row) ───────────────────────

  const EARLY_ENEMIES = [  // row 0 — simple, readable patterns
    { id:"slime",       name:"Slime",       health:30, rewardGold:12, intents:[
      { type:"attack", value:6, label:"Slam 6" },
      { type:"block",  value:6, label:"Harden +6" }
    ]},
    { id:"fangling",    name:"Fangling",    health:26, rewardGold:12, intents:[
      { type:"multi_attack", value:3, hits:2, label:"Flurry 2×3" },
      { type:"attack",       value:8, label:"Pounce 8" }
    ]},
    { id:"bone_sprite", name:"Bone Sprite", health:22, rewardGold:10, intents:[
      { type:"attack",       value:5, label:"Strike 5" },
      { type:"multi_attack", value:2, hits:2, label:"Rattle 2×2" },
      { type:"block",        value:4, label:"Brace +4" }
    ]},
    { id:"ashrat",      name:"Ashrat",      health:24, rewardGold:10, intents:[
      { type:"multi_attack", value:3, hits:2, label:"Gnaw 2×3" },
      { type:"attack",       value:7, label:"Snarl 7" },
      { type:"block",        value:4, label:"Burrow +4" }
    ]},
    { id:"grub",        name:"Grub",        health:18, rewardGold:8, intents:[
      { type:"attack", value:4, label:"Chomp 4" },
      { type:"block",  value:5, label:"Secrete +5" },
      { type:"attack", value:6, label:"Chomp 6" }
    ]},
    { id:"crypt_bat",   name:"Crypt Bat",   health:24, rewardGold:10, intents:[
      { type:"multi_attack", value:3, hits:2, label:"Swoop 2×3" },
      { type:"attack",       value:7, label:"Bite 7" },
      { type:"block",        value:4, label:"Dodge +4" }
    ]},
    { id:"pale_leech",  name:"Pale Leech",  health:22, rewardGold:10, intents:[
      { type:"attack",       value:5, label:"Drain 5" },
      { type:"block",        value:7, label:"Bloat +7" },
      { type:"multi_attack", value:2, hits:2, label:"Burst 2×2" }
    ]}
  ];

  const MID_ENEMIES = [  // row 1 — introduces buff + multi variety
    { id:"mossling",    name:"Mossling",    health:34, rewardGold:12, intents:[
      { type:"buff",   value:2, label:"Grow +2 strength" },
      { type:"attack", value:7, label:"Vine Lash 7" },
      { type:"block",  value:5, label:"Tangle +5" }
    ]},
    { id:"cinder_fiend",name:"Cinder Fiend",health:38, rewardGold:14, intents:[
      { type:"attack", value:8,  label:"Scorch 8" },
      { type:"block",  value:6,  label:"Smolder +6" },
      { type:"attack", value:12, label:"Eruption 12" }
    ]},
    { id:"plagued_rat", name:"Plagued Rat", health:32, rewardGold:14, intents:[
      { type:"multi_attack", value:3, hits:3, label:"Swarm 3×3" },
      { type:"attack",       value:10, label:"Retch 10" },
      { type:"block",        value:5,  label:"Infest +5" }
    ]},
    { id:"hex_crawler", name:"Hex Crawler", health:36, rewardGold:14, intents:[
      { type:"attack", value:7,  label:"Crawl 7" },
      { type:"buff",   value:3,  label:"Strengthen +3" },
      { type:"attack", value:10, label:"Lunge 10" }
    ]},
    { id:"rust_knight", name:"Rust Knight", health:42, rewardGold:14, intents:[
      { type:"block",        value:7, label:"Fortify +7" },
      { type:"attack",       value:9, label:"Slash 9" },
      { type:"multi_attack", value:5, hits:2, label:"Shatter 2×5" }
    ]},
    { id:"shade",       name:"Shade",       health:30, rewardGold:12, intents:[
      { type:"multi_attack", value:4, hits:2, label:"Phase 2×4" },
      { type:"block",        value:6, label:"Fade +6" },
      { type:"attack",       value:10, label:"Ambush 10" }
    ]},
    { id:"curse_hound", name:"Curse Hound", health:36, rewardGold:14, intents:[
      { type:"buff",         value:2, label:"Curse +2 strength" },
      { type:"attack",       value:8, label:"Maul 8" },
      { type:"multi_attack", value:5, hits:2, label:"Berserk 2×5" }
    ]}
  ];

  const LATE_ENEMIES = [  // row 2+ — harder, longer patterns
    { id:"ironback_toad",name:"Ironback Toad",health:44, rewardGold:14, intents:[
      { type:"block",  value:8,  label:"Shell +8" },
      { type:"attack", value:11, label:"Lunge 11" },
      { type:"block",  value:4,  label:"Shell +4" },
      { type:"attack", value:15, label:"Tongue Lash 15" }
    ]},
    { id:"marrow_hound", name:"Marrow Hound",health:36, rewardGold:14, intents:[
      { type:"attack", value:10, label:"Bite 10" },
      { type:"block",  value:6,  label:"Recover +6" },
      { type:"buff",   value:2,  label:"Howl +2 strength" }
    ]},
    { id:"shadow_brute", name:"Shadow Brute",health:48, rewardGold:16, intents:[
      { type:"attack",       value:13, label:"Slam 13" },
      { type:"block",        value:6,  label:"Stance +6" },
      { type:"multi_attack", value:4,  hits:3, label:"Barrage 3×4" }
    ]},
    { id:"voidling",     name:"Voidling",    health:44, rewardGold:16, intents:[
      { type:"buff",   value:2,  label:"Feed +2 strength" },
      { type:"attack", value:9,  label:"Grasp 9" },
      { type:"buff",   value:3,  label:"Surge +3 strength" },
      { type:"attack", value:16, label:"Devour 16" }
    ]},
    { id:"grave_walker", name:"Grave Walker", health:52, rewardGold:16, intents:[
      { type:"block",        value:8,  label:"Shamble +8" },
      { type:"attack",       value:12, label:"Claw 12" },
      { type:"multi_attack", value:4,  hits:3, label:"Wail 3×4" }
    ]},
    { id:"barrow_beast", name:"Barrow Beast", health:46, rewardGold:16, intents:[
      { type:"buff",         value:3,  label:"Bellow +3 strength" },
      { type:"attack",       value:11, label:"Gore 11" },
      { type:"multi_attack", value:4,  hits:3, label:"Charge 3×4" },
      { type:"attack",       value:16, label:"Slam 16" }
    ]},
    { id:"siege_golem",  name:"Siege Golem",  health:58, rewardGold:16, intents:[
      { type:"block",        value:12, label:"Fortify +12" },
      { type:"attack",       value:14, label:"Crush 14" },
      { type:"multi_attack", value:4,  hits:4, label:"Tremor 4×4" }
    ]}
  ];

  function createEnemyForNode(node) {
    if (node.type === "boss")  return pickUniqueItems(BOSS_POOL, 1)[0];
    if (node.type === "elite") return pickUniqueItems(ELITE_POOL, 1)[0];
    let pool;
    if (node.row >= 2) pool = LATE_ENEMIES;
    else if (node.row >= 1) pool = MID_ENEMIES;
    else pool = EARLY_ENEMIES;
    return pickUniqueItems(pool, 1)[0];
  }

  // Random intent selection — never picks the same intent twice in a row.
  // Mutates enemy.lastIntentIndex (safe: always called on a cloned object).
  function resolveEnemyIntent(enemy) {
    const intents = (enemy.intents && enemy.intents.length > 0)
      ? enemy.intents
      : [{ type:"attack", value:5, label:"Attack 5" }];
    if (intents.length === 1) return intents[0];
    const lastIdx = (enemy.lastIntentIndex !== undefined) ? enemy.lastIntentIndex : -1;
    const candidates = intents
      .map((intent, i) => ({ intent, i }))
      .filter(({ i }) => i !== lastIdx);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    enemy.lastIntentIndex = chosen.i;
    return chosen.intent;
  }

  // ─── Run / Combat Logic ───────────────────────────────────────────
  function hasRelic(run, id) { return (run.relics || []).some((r) => r.id === id); }
  function getEnergyBonus(run, nodeType = "combat") {
    let bonus = 0;
    if (hasRelic(run, "ember_ring"))        bonus += 1;
    if (hasRelic(run, "crown_of_cinders"))  bonus += 1;
    if (hasRelic(run, "infernal_battery"))  bonus += 1;
    if (hasRelic(run, "brass_lantern") && (nodeType === "elite" || nodeType === "boss")) bonus += 1;
    return bonus;
  }

  // Centralised exhaust trigger — call after pushing any card to exhaustPile
  function applyExhaustEffects(next, run) {
    next.exhaustedThisTurn       = (next.exhaustedThisTurn||0) + 1;
    next.totalExhaustedThisCombat = (next.totalExhaustedThisCombat||0) + 1;
    if (run && hasRelic(run,"cinder_box")) next.player.block += 2;
    if (run && hasRelic(run,"coal_pendant") && !next.coal_pendant_used) {
      next = drawCards(next, 1); next.coal_pendant_used = true;
    }
    // Crematorium Bell: first 2 Exhausts each combat grant +1 energy
    if (run && hasRelic(run,"crematorium_bell") && (next.crematorium_bell_count||0) < 2) {
      next.player.energy += 1;
      next.crematorium_bell_count = (next.crematorium_bell_count||0) + 1;
    }
    // Black Prism: when total exhausts in combat first reaches 3, gain 1 energy
    if (run && hasRelic(run,"black_prism") && !next.black_prism_fired &&
        (next.totalExhaustedThisCombat||0) >= 3) {
      next.player.energy += 1;
      next.black_prism_fired = true;
    }
    return next;
  }

  function startNewRun() {
    const [bonus] = createRewardCardOptions(1);
    return {
      state: "in_progress",
      player: { health: DEFAULT_PLAYER_HEALTH, maxHp: DEFAULT_PLAYER_HEALTH, gold: DEFAULT_PLAYER_GOLD,
                deck: [...DEFAULT_STARTER_DECK, bonus.id] },
      relics: [],
      phoenix_used: false,
      combatsWon: 0,
      combat: null,
      pendingRewards: null,
      event: null,
      map: generateMap()
    };
  }

  function validateRun(run) {
    if (!run || typeof run !== "object") throw new Error("Saved run is invalid");
    if (!run.player || !Array.isArray(run.player.deck)) throw new Error("Invalid deck");
    if (!run.map || !Array.isArray(run.map.nodes)) throw new Error("Invalid map");
    return run;
  }

  function saveRun(run) { localStorage.setItem(STORAGE_KEY, JSON.stringify(run)); }
  function loadRun() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No saved run");
    return validateRun(JSON.parse(raw));
  }

  function drawCards(combat, count) {
    const next = clone(combat);
    next.reshuffled = false;
    for (let i = 0; i < count; i++) {
      if (next.drawPile.length === 0 && next.discardPile.length > 0) {
        next.drawPile = [...next.discardPile];
        next.discardPile = [];
        next.reshuffled = true;
      }
      if (next.drawPile.length === 0) break;
      next.hand.push(next.drawPile.shift());
    }
    return next;
  }

  function startCombat(run, node) {
    const enemy = createEnemyForNode(node);
    // Hex Crown: enemy starts with Hex 1
    if (hasRelic(run, "hex_crown")) enemy.hex = (enemy.hex||0) + 1;

    let drawCount = 5;
    if (hasRelic(run, "quickened_loop"))    drawCount += 1;
    if (hasRelic(run, "empty_throne"))      drawCount += 2;
    if (hasRelic(run, "infernal_battery"))  drawCount -= 1;

    const startBlock   = hasRelic(run, "rusted_buckler") ? 4 : 0;
    const startCharged = hasRelic(run, "storm_diadem");
    const extraEnergy  = hasRelic(run, "ashen_idol") ? 1 : 0;

    return drawCards({
      state: "active", turn: "player",
      nodeType: node.type,
      enemyTurnNumber: 0,
      enemyIntent: resolveEnemyIntent(enemy, 0),
      firstTurn: true,
      // per-combat relic flags
      grimoire_used:         false,
      coal_pendant_used:     false,
      sigil_fired:           false,
      seal_used_this_turn:   false,
      flicker_used:          false,
      grave_wick_used:       false,
      hex_lantern_used:      false,
      cracked_mirror_used:   false,
      crematorium_bell_count:0,
      black_prism_fired:     false,
      totalExhaustedThisCombat:0,
      // per-turn relic flags
      duelist_used_this_turn:false,
      player: {
        health:  run.player.health,
        block:   startBlock,
        energy:  DEFAULT_PLAYER_ENERGY + getEnergyBonus(run, node.type) + extraEnergy,
        charged: startCharged
      },
      hand: [],
      drawPile: shuffleCards(run.player.deck.map(createCardFromId)),
      discardPile: [],
      exhaustPile: [],
      exhaustedThisTurn: 0,
      enemy
    }, drawCount);
  }

  function playCardAtIndex(combat, idx, run = null) {
    const card = combat.hand[idx];
    if (!card) throw new Error("Card not found");
    if (combat.turn !== "player") throw new Error("Not your turn");

    // ── Cost calculation ──────────────────────────────────────────────
    let cost = card.cost;
    if (card.costReduceIfHexed && (combat.enemy.hex || 0) > 0)
      cost = Math.max(0, cost - card.costReduceIfHexed);
    if (card.costReduceIfCharged && combat.player.charged)
      cost = Math.max(0, cost - card.costReduceIfCharged);
    if (run && hasRelic(run, "time_locked_seal") && !combat.seal_used_this_turn && cost <= 1) cost = 0;
    // Grave Wick: first Exhaust card each combat costs 0
    if (card.exhaust && run && hasRelic(run,"grave_wick") && !combat.grave_wick_used) cost = 0;
    if (combat.player.energy < cost) throw new Error("Not enough energy");

    let next = clone(combat);
    if (run && hasRelic(run, "time_locked_seal") && !next.seal_used_this_turn && card.cost <= 1)
      next.seal_used_this_turn = true;

    next.player.energy -= cost;
    next.hand.splice(idx, 1);

    // ── Exhaust hand early so energyPerExhausted counts it (Empty the Chamber) ──
    if (card.exhaustHand) {
      const toExhaust = [...next.hand];
      next.hand = [];
      for (const c of toExhaust) {
        next.exhaustPile = [...(next.exhaustPile||[]), c];
        next = applyExhaustEffects(next, run);
      }
    }

    // ── Pre-consume hex for Hexburst (before damage calc) ────────────
    let hexConsumed = 0;
    if (card.consumeHex) {
      hexConsumed = next.enemy.hex || 0;
      next.enemy.hex = 0;
    }

    // ── Damage ───────────────────────────────────────────────────────
    if (card.damage || card.bonusVsHex || card.bonusVsExhaust || card.bonusVsHexedOrExhausted ||
        card.bonusDamagePerExhaust || card.bonusDamagePerHex || card.bonusDamagePerHexConsumed ||
        card.bonusDamageIfLastCard) {
      const hexBonus          = (next.enemy.hex||0) > 0 && card.bonusVsHex ? card.bonusVsHex : 0;
      const exhaustBonus      = (next.exhaustPile||[]).length > 0 && card.bonusVsExhaust ? card.bonusVsExhaust : 0;
      const harvHex           = (next.enemy.hex||0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
      const harvEx            = (next.exhaustedThisTurn||0) > 0 && card.bonusVsHexedOrExhausted ? card.bonusVsHexedOrExhausted : 0;
      const nailBonus         = run && hasRelic(run,"hex_nail") && card.type==="attack" && (next.enemy.hex||0) > 0 ? 2 : 0;
      const exhaustDmgBonus   = card.bonusDamagePerExhaust ? (next.exhaustedThisTurn||0) * card.bonusDamagePerExhaust : 0;
      const hexStackBonus     = card.bonusDamagePerHex ? (next.enemy.hex||0) * card.bonusDamagePerHex : 0;
      const hexConsumedBonus  = card.bonusDamagePerHexConsumed ? hexConsumed * card.bonusDamagePerHexConsumed : 0;
      const lastCardBonus     = card.bonusDamageIfLastCard && next.hand.length === 0 ? card.bonusDamageIfLastCard : 0;
      // Relic damage bonuses
      const flickerBonus  = run && hasRelic(run,"flicker_charm") && !next.flicker_used && card.type==="attack" ? 3 : 0;
      const duelistBonus  = run && hasRelic(run,"duelist_thread") && !next.duelist_used_this_turn && card.type==="attack" ? 2 : 0;
      const furnaceBonus  = run && hasRelic(run,"furnace_heart") && card.type==="attack" && card.exhaust ? 4 : 0;
      const total = (card.damage||0) + hexBonus + exhaustBonus + harvHex + harvEx + nailBonus
                  + exhaustDmgBonus + hexStackBonus + hexConsumedBonus + lastCardBonus
                  + flickerBonus + duelistBonus + furnaceBonus;
      const blocked  = Math.min(next.enemy.block||0, total);
      const hpDmg    = total - blocked;
      next.enemy.block  = (next.enemy.block||0) - blocked;
      next.enemy.health -= hpDmg;
      // Mark per-combat / per-turn relic bonuses as used
      if (flickerBonus)  next.flicker_used           = true;
      if (duelistBonus)  next.duelist_used_this_turn  = true;
      // Hex Lantern: first time player deals HP damage, apply Hex 1
      if (hpDmg > 0 && run && hasRelic(run,"hex_lantern") && !next.hex_lantern_used) {
        next.hex_lantern_used = true;
        const extra = run && hasRelic(run,"worn_grimoire") && !next.grimoire_used ? 1 : 0;
        if (extra) next.grimoire_used = true;
        next.enemy.hex = (next.enemy.hex||0) + 1 + extra;
      }
      // Repeat if hexed (No Mercy) — base damage only
      if (card.repeatIfHexed && (next.enemy.hex||0) > 0) {
        const total2   = (card.damage||0) + nailBonus;
        const blocked2 = Math.min(next.enemy.block||0, total2);
        next.enemy.block  = (next.enemy.block||0) - blocked2;
        next.enemy.health -= (total2 - blocked2);
      }
    }

    // ── Block ────────────────────────────────────────────────────────
    if (card.block) {
      const baseBlock = (card.blockIfCharged && next.player.charged) ? card.blockIfCharged : card.block;
      next.player.block += baseBlock +
        ((next.player.energy >= 2 && card.bonusBlockIfHighEnergy) ? card.bonusBlockIfHighEnergy : 0);
      if (card.bonusBlockIfHexed && (next.enemy.hex||0) > 0) next.player.block += card.bonusBlockIfHexed;
    }

    // ── Energy / HP ──────────────────────────────────────────────────
    if (card.energyGain) next.player.energy += card.energyGain;
    if (card.energyPerExhausted) next.player.energy += (next.exhaustedThisTurn||0);
    if (card.selfDamage) {
      next.player.health = Math.max(0, next.player.health - card.selfDamage);
      // Blood Crucible: cards that cost HP double their energy and draw
      if (run && hasRelic(run,"blood_crucible")) {
        if (card.energyGain) next.player.energy += card.energyGain;
        if (card.draw) next = drawCards(next, card.draw);
      }
    }

    // ── Weaken enemy (Malediction) ────────────────────────────────────
    if (card.weakenEnemy) next.enemyWeakened = (next.enemyWeakened||0) + card.weakenEnemy;

    // ── Discard random cards (Overclock, Plan Ahead) ─────────────────
    if (card.discardRandom) {
      const n = Math.min(card.discardRandom, next.hand.length);
      for (let i = 0; i < n; i++) {
        if (next.hand.length === 0) break;
        const ri = Math.floor(Math.random() * next.hand.length);
        const discarded = next.hand.splice(ri, 1)[0];
        next.discardPile = [...(next.discardPile||[]), discarded];
      }
    }

    // ── Hex ──────────────────────────────────────────────────────────
    if (card.hex) {
      const extra = run && hasRelic(run,"worn_grimoire") && !next.grimoire_used ? 1 : 0;
      if (extra) next.grimoire_used = true;
      next.enemy.hex = (next.enemy.hex||0) + card.hex + extra;
      if (run && hasRelic(run,"sigil_engine") && !next.sigil_fired && (next.enemy.hex||0) >= 3) {
        const sb = Math.min(next.enemy.block||0, 8);
        next.enemy.block  = (next.enemy.block||0) - sb;
        next.enemy.health -= (8 - sb);
        next.sigil_fired = true;
      }
    }

    // ── Charged ──────────────────────────────────────────────────────
    if (card.setCharged) {
      next.player.charged = true;
      if (run && hasRelic(run,"volt_shard"))    { next.player.block += 1; next = drawCards(next, 1); }
      if (run && hasRelic(run,"storm_vessel") && !next.firstTurn) next.player.energy += 1;
    }
    if (card.unsetCharged) next.player.charged = false;

    // Flashstep: if already Charged draw 2, else Become Charged
    if (card.flashstep) {
      if (next.player.charged) {
        next = drawCards(next, 2);
      } else {
        next.player.charged = true;
        if (run && hasRelic(run,"volt_shard"))    { next.player.block += 1; next = drawCards(next, 1); }
        if (run && hasRelic(run,"storm_vessel") && !next.firstTurn) next.player.energy += 1;
      }
    }

    // ── Draw ─────────────────────────────────────────────────────────
    if (card.draw) next = drawCards(next, card.draw);
    if (card.drawIfCharged && next.player.charged) next = drawCards(next, card.drawIfCharged);
    if (card.energyIfCharged && next.player.charged) next.player.energy += card.energyIfCharged;

    // ── Soul Rend: if Hexed, exhaust a card + gain 1 energy ──────────
    if (card.hexedExhaustAndEnergy && (next.enemy.hex||0) > 0 && next.hand.length > 0) {
      const ri = Math.floor(Math.random() * next.hand.length);
      const ex = next.hand.splice(ri, 1)[0];
      next.exhaustPile = [...(next.exhaustPile||[]), ex];
      next.player.energy += 1;
      next = applyExhaustEffects(next, run);
    }

    // ── Exhaust 1 card from hand (Fire Sale, Cremate, Final Draft) ────
    if (card.exhaustFromHand && next.hand.length > 0) {
      const ri = Math.floor(Math.random() * next.hand.length);
      const ex = next.hand.splice(ri, 1)[0];
      next.exhaustPile = [...(next.exhaustPile||[]), ex];
      next = applyExhaustEffects(next, run);
    }

    // ── Exhaust up to N from hand (Ritual Collapse) ──────────────────
    if (card.exhaustFromHandCount) {
      const n = Math.min(card.exhaustFromHandCount, next.hand.length);
      for (let i = 0; i < n; i++) {
        if (next.hand.length === 0) break;
        const ri = Math.floor(Math.random() * next.hand.length);
        const ex = next.hand.splice(ri, 1)[0];
        next.exhaustPile = [...(next.exhaustPile||[]), ex];
        next = applyExhaustEffects(next, run);
        if (card.hexPerExhausted) {
          const extra = run && hasRelic(run,"worn_grimoire") && !next.grimoire_used ? 1 : 0;
          if (extra) next.grimoire_used = true;
          next.enemy.hex = (next.enemy.hex||0) + 1 + extra;
        }
      }
    }

    // ── Exhaust all Skills in hand (Doom Bell) ────────────────────────
    if (card.exhaustAllSkillsInHand) {
      const skills = next.hand.filter((c) => c.type === "skill");
      next.hand = next.hand.filter((c) => c.type !== "skill");
      for (const c of skills) {
        next.exhaustPile = [...(next.exhaustPile||[]), c];
        next = applyExhaustEffects(next, run);
      }
    }

    // ── Cracked Mirror: first Skill each combat played twice (no cost, no re-exhaust) ──
    if (run && hasRelic(run,"cracked_mirror") && !next.cracked_mirror_used && card.type === "skill") {
      next.cracked_mirror_used = true;
      if (card.block) {
        const b2 = (card.blockIfCharged && next.player.charged) ? card.blockIfCharged : card.block;
        next.player.block += b2;
        if (card.bonusBlockIfHexed && (next.enemy.hex||0) > 0) next.player.block += card.bonusBlockIfHexed;
      }
      if (card.energyGain) next.player.energy += card.energyGain;
      if (card.hex) {
        const extra = hasRelic(run,"worn_grimoire") && !next.grimoire_used ? 1 : 0;
        if (extra) next.grimoire_used = true;
        next.enemy.hex = (next.enemy.hex||0) + card.hex + extra;
      }
      if (card.setCharged && !next.player.charged) {
        next.player.charged = true;
        if (hasRelic(run,"volt_shard")) { next.player.block += 1; next = drawCards(next, 1); }
      }
      if (card.draw) next = drawCards(next, card.draw);
      if (card.drawIfCharged && next.player.charged) next = drawCards(next, card.drawIfCharged);
      if (card.energyIfCharged && next.player.charged) next.player.energy += card.energyIfCharged;
    }

    // ── Self-exhaust (card goes to exhaustPile instead of discardPile) ─
    if (card.exhaust) {
      next.exhaustPile = [...(next.exhaustPile||[]), card];
      if (run && hasRelic(run,"grave_wick") && !next.grave_wick_used) next.grave_wick_used = true;
      next = applyExhaustEffects(next, run);
    } else {
      next.discardPile = [...(next.discardPile||[]), card];
    }

    if (next.enemy.health <= 0) { next.enemy.health = 0; next.state = "victory"; next.turn = null; }
    return next;
  }

  function applyEnemyIntent(combat, intent, run = null) {
    if (!intent) return combat;
    let next = clone(combat);
    if (intent.type === "attack") {
      const baseDmg = intent.value + (next.enemy.strengthBuff||0);
      const dmg     = Math.max(0, baseDmg - (next.enemyWeakened||0));
      const b       = Math.min(next.player.block, dmg);
      const hpDmg   = dmg - b;
      next.player.block -= b;
      next.player.health = Math.max(0, next.player.health - hpDmg);
      if (hpDmg > 0 && run && hasRelic(run,"thorn_crest")) {
        const tb = Math.min(next.enemy.block||0, 3);
        next.enemy.block  = (next.enemy.block||0) - tb;
        next.enemy.health -= (3 - tb);
      }
    } else if (intent.type === "multi_attack") {
      const baseHit   = intent.value + (next.enemy.strengthBuff||0);
      const dmgPerHit = Math.max(0, baseHit - (next.enemyWeakened||0));
      for (let i = 0; i < (intent.hits||1); i++) {
        const b     = Math.min(next.player.block, dmgPerHit);
        const hpDmg = dmgPerHit - b;
        next.player.block -= b;
        next.player.health = Math.max(0, next.player.health - hpDmg);
        if (hpDmg > 0 && run && hasRelic(run,"thorn_crest")) {
          const tb = Math.min(next.enemy.block||0, 3);
          next.enemy.block  = (next.enemy.block||0) - tb;
          next.enemy.health -= (3 - tb);
        }
        if (next.player.health <= 0) break;
      }
    } else if (intent.type === "block") {
      next.enemy.block = (next.enemy.block||0) + intent.value;
    } else if (intent.type === "buff") {
      // Buff increases enemy strength — all future attacks deal extra damage
      next.enemy.strengthBuff = (next.enemy.strengthBuff||0) + intent.value;
    }
    return next;
  }

  function resolveEndTurn(combat, run) {
    if (combat.state !== "active") return combat;
    let next = applyEnemyIntent(combat, combat.enemyIntent, run);
    next.player.block = 0;
    next.player.energy = DEFAULT_PLAYER_ENERGY + getEnergyBonus(run, combat.nodeType);
    next.player.charged = false;
    next.exhaustedThisTurn = 0;
    next.enemyWeakened = 0;
    next.firstTurn = false;
    next.seal_used_this_turn = false;
    next.duelist_used_this_turn = false;
    if (next.player.health <= 0) {
      if (run && hasRelic(run,"phoenix_ash") && !run.phoenix_used) {
        next.player.health = 1; run.phoenix_used = true;
      } else {
        next.state = "defeat"; next.turn = null; next.enemyIntent = null; return next;
      }
    }
    next.discardPile = [...(next.discardPile||[]), ...(next.hand||[])];
    next.hand = [];
    next.turn = "player";
    next.enemyTurnNumber = (combat.enemyTurnNumber||0) + 1;
    next.enemyIntent = resolveEnemyIntent(next.enemy, next.enemyTurnNumber);
    // Empty Throne: draw 1 fewer on turn 2 (combat.firstTurn is still true when ending turn 1)
    let drawCount = 5;
    if (run && hasRelic(run,"empty_throne") && combat.firstTurn) drawCount -= 1;
    next = drawCards(next, drawCount);
    return next;
  }

  function applyRelic(run, relic) {
    const next = { ...run, relics:[...(run.relics||[]), relic], player:{...run.player} };
    if (relic.id === "iron_core") {
      next.player.maxHp = (next.player.maxHp || DEFAULT_PLAYER_HEALTH) + 5;
      next.player.health = Math.min(next.player.health + 5, next.player.maxHp);
    }
    if (relic.id === "feather_charm")    next.player.gold += 15;
    if (relic.id === "lucky_coin")       next.player.gold += 10;
    if (relic.id === "pilgrim_map")      next.player.gold += 10;
    if (relic.id === "golden_brand")     next.player.gold += 25;
    if (relic.id === "crown_of_cinders") {
      next.player.maxHp = Math.max(1, (next.player.maxHp || DEFAULT_PLAYER_HEALTH) - 2);
      next.player.health = Math.min(next.player.health, next.player.maxHp);
    }
    return next;
  }

  function applyVictory(run, combat) {
    const merchantBonus = (hasRelic(run,"merchant_ledger") ? 1 : 0) + (hasRelic(run,"golden_brand") ? 1 : 0);
    const cardCount     = 3 + merchantBonus;
    const ownedIds      = new Set((run.relics||[]).map((r) => r.id));

    let rewards;
    if (combat.nodeType === "elite") {
      const pool = RELICS.filter((r) => (r.rarity==="common" || r.rarity==="uncommon") && !ownedIds.has(r.id));
      rewards = { cards:createRewardCardOptions(cardCount), gold:25, relic:null,
                  relics:pickUniqueItems(pool, 3), removeCard:true };
    } else if (combat.nodeType === "boss") {
      const bossPool   = RELICS.filter((r) => (r.rarity==="rare" || r.rarity==="boss") && !ownedIds.has(r.id));
      const relicCount = hasRelic(run,"vault_key") ? 2 : 1;
      rewards = {
        cards: createRewardCardOptions(cardCount),
        gold: 50,
        relic: null,
        relics: pickUniqueItems(bossPool, relicCount),
        removeCard: false
      };
    } else {
      rewards = {
        cards: createRewardCardOptions(cardCount),
        gold: 12 + (hasRelic(run,"lucky_coin") ? 5 : 0) + (hasRelic(run,"pilgrim_map") ? 3 : 0),
        relic: null,
        relics: [], removeCard: false
      };
    }

    // Post-combat heals
    let healAmount = 0;
    if (hasRelic(run,"bone_token")) healAmount += 3;
    if (hasRelic(run,"soot_vessel") &&
        combat.player.health <= (run.player.maxHp || DEFAULT_PLAYER_HEALTH) * 0.5) healAmount += 6;
    const newHp = Math.min(combat.player.health + healAmount, run.player.maxHp || DEFAULT_PLAYER_HEALTH);

    // Leather Thread: +1 max HP after every 3 combats won
    const newCombatsWon = (run.combatsWon||0) + 1;
    let newMaxHp = run.player.maxHp || DEFAULT_PLAYER_HEALTH;
    if (hasRelic(run,"leather_thread") && newCombatsWon % 3 === 0) newMaxHp += 1;

    return {
      ...run,
      combatsWon: newCombatsWon,
      player: { ...run.player, maxHp: newMaxHp,
                health: Math.min(newHp, newMaxHp),
                gold: run.player.gold + rewards.gold },
      combat,
      pendingRewards: rewards
    };
  }

  function finishNode(run) {
    const node = run.map.nodes.find((n) => n.id === run.map.currentNodeId);
    return { ...run, combat:null, pendingRewards:null, event:null,
             state: node && node.type==="boss" ? "won" : "in_progress" };
  }

  function afterCardSelection(run) {
    if (run.pendingRewards && run.pendingRewards.removeCard)
      return { ...run, pendingRewards:{ cards:[], gold:0, relic:null, relics:[], removeCard:true } };
    return finishNode(run);
  }

  function claimCardReward(run, card) {
    return afterCardSelection({ ...run, player:{ ...run.player, deck:[...run.player.deck, card.id] } });
  }

  function claimRelicFromChoices(run, relic) {
    const updated = applyRelic(run, relic);
    return { ...updated, pendingRewards:{ ...updated.pendingRewards, relics:[] } };
  }

  function claimRelicReward(run, relic) { return afterCardSelection(applyRelic(run, relic)); }
  function skipRewards(run) { return afterCardSelection(run); }

  function createEventState(node) {
    const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    return { id:`event-${node.id}`, kind:tpl.id, title:tpl.title, text:tpl.text, options:tpl.createOptions(node) };
  }

  function enterNode(run, nodeId) {
    const node = run.map.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error("Node not found");
    if (run.map.currentNodeId === null && node.row !== 0) throw new Error("Invalid start");
    if (run.map.currentNodeId !== null) {
      const cur = run.map.nodes.find((n) => n.id === run.map.currentNodeId);
      if (!cur || !cur.next.includes(nodeId)) throw new Error("Invalid move");
    }
    const next = { ...run, map:{ ...run.map, currentNodeId:nodeId }, pendingRewards:null, event:null };
    if (["combat","elite","boss"].includes(node.type)) { next.combat = startCombat(run, node); return next; }
    if (node.type === "event") { next.combat = null; next.event = createEventState(node); return next; }
    return next;
  }

  function claimEventOption(run, option) {
    let next = { ...run, event:null };
    if (option.effect === "heal")         next = { ...next, player:{ ...next.player, health:Math.min(next.player.health + (option.amount||10), next.player.maxHp || DEFAULT_PLAYER_HEALTH) } };
    if (option.effect === "relic")        next = applyRelic(next, option.relic);
    if (option.effect === "gold")         next = { ...next, player:{ ...next.player, gold:next.player.gold + option.amount } };
    if (option.effect === "reward_cards") next = { ...next, pendingRewards:{ cards:option.cards, gold:0, relic:null, removeCard:false } };
    if (option.effect === "add_card")     next = { ...next, player:{ ...next.player, deck:[...next.player.deck, option.card.id] } };
    if (option.effect === "remove")       next = { ...next, pendingRewards:{ cards:[], gold:0, relic:null, removeCard:true } };
    return next;
  }

  function removeCardFromDeck(run, cardId) {
    const idx = run.player.deck.indexOf(cardId);
    if (idx === -1) return run;
    return finishNode({ ...run, player:{ ...run.player,
      deck:[...run.player.deck.slice(0,idx), ...run.player.deck.slice(idx+1)] } });
  }

  function listAvailableNodes(run) {
    if (run.pendingRewards || run.event || (run.combat && run.combat.state==="active")) return [];
    if (run.map.currentNodeId === null) return run.map.nodes.filter((n) => n.row === 0);
    const cur = run.map.nodes.find((n) => n.id === run.map.currentNodeId);
    if (!cur) return [];
    return run.map.nodes.filter((n) => cur.next.includes(n.id));
  }

  function describeCard(card) {
    const p = [];
    if (card.costReduceIfHexed)      p.push(`Costs ${card.costReduceIfHexed} less if Hexed`);
    if (card.costReduceIfCharged)    p.push(`Costs ${card.costReduceIfCharged} less if Charged`);
    if (card.damage)                 p.push(`Deal ${card.damage} dmg`);
    if (card.bonusVsHex)             p.push(`+${card.bonusVsHex} vs Hexed`);
    if (card.bonusDamagePerHex)      p.push(`+${card.bonusDamagePerHex} per Hex stack`);
    if (card.bonusDamagePerExhaust)  p.push(`+${card.bonusDamagePerExhaust} per Exhausted this turn`);
    if (card.bonusDamageIfLastCard)  p.push(`+${card.bonusDamageIfLastCard} if last card in hand`);
    if (card.consumeHex && card.bonusDamagePerHexConsumed) p.push(`Consume Hex → +${card.bonusDamagePerHexConsumed} per stack`);
    if (card.repeatIfHexed)          p.push("Repeat if Hexed");
    if (card.block) {
      if (card.blockIfCharged)       p.push(`Block ${card.block} (${card.blockIfCharged} if Charged)`);
      else                           p.push(`Gain ${card.block} block`);
    }
    if (card.bonusBlockIfHexed)      p.push(`+${card.bonusBlockIfHexed} block if Hexed`);
    if (card.bonusBlockIfHighEnergy) p.push(`+${card.bonusBlockIfHighEnergy} block if 2+ energy`);
    if (card.draw)                   p.push(`Draw ${card.draw}`);
    if (card.drawIfCharged)          p.push(`Draw ${card.drawIfCharged} if Charged`);
    if (card.discardRandom)          p.push(`Discard ${card.discardRandom} random`);
    if (card.energyGain)             p.push(`+${card.energyGain} energy`);
    if (card.energyPerExhausted)     p.push("+1 energy per Exhausted this turn");
    if (card.energyIfCharged)        p.push(`+${card.energyIfCharged} energy if Charged`);
    if (card.hex)                    p.push(`Apply Hex ${card.hex}`);
    if (card.hexPerExhausted)        p.push("Apply Hex 1 per card Exhausted");
    if (card.weakenEnemy)            p.push(`Weaken: enemy -${card.weakenEnemy} attack this turn`);
    if (card.selfDamage)             p.push(`Lose ${card.selfDamage} HP`);
    if (card.setCharged)             p.push("Become Charged");
    if (card.unsetCharged)           p.push("Lose Charged");
    if (card.flashstep)              p.push("If Charged: draw 2 • Else: Become Charged");
    if (card.hexedExhaustAndEnergy)  p.push("If Hexed: Exhaust a card → +1 energy");
    if (card.exhaustFromHand)        p.push("Exhaust a card from hand");
    if (card.exhaustFromHandCount)   p.push(`Exhaust up to ${card.exhaustFromHandCount} from hand`);
    if (card.exhaustAllSkillsInHand) p.push("Exhaust all Skills in hand");
    if (card.exhaustHand)            p.push("Exhaust your hand");
    if (card.bonusVsExhaust)         p.push(`+${card.bonusVsExhaust} vs Exhausted`);
    if (card.bonusVsHexedOrExhausted) p.push(`+${card.bonusVsHexedOrExhausted} if Hexed or Exhausted`);
    if (card.exhaust)                p.push("Exhaust");
    return p.join(" • ");
  }

  // ─── State ────────────────────────────────────────────────────────
  let currentRun = null;
  let rewardClaiming = false;

  // ─── DOM helpers ──────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function show(...ids) { ids.forEach((id) => $( id) && $( id).classList.remove("hidden")); }
  function hide(...ids) { ids.forEach((id) => $( id) && $( id).classList.add("hidden")); }

  function setHp(barId, currentId, maxId, current, max) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    const bar = $(barId);
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.classList.toggle("low", pct <= 25);
      bar.classList.toggle("mid", pct > 25 && pct <= 50);
    }
    if ($(currentId)) $(currentId).textContent = String(current);
    if ($(maxId))     $(maxId).textContent     = `/ ${max}`;
  }

  // ─── Canvas Card Art ──────────────────────────────────────────────
  function getCardMechanic(card) {
    if (card.selfDamage) return "pact";
    if (card.setCharged || card.blockIfCharged || card.energyIfCharged || card.drawIfCharged || card.flashstep) return "charged";
    if (card.hex && card.type === "skill") return "hex";
    if (card.energyGain || card.energyPerExhausted || card.exhaustHand) return "energy";
    if (card.exhaustFromHand || card.exhaust || card.exhaustFromHandCount || card.exhaustAllSkillsInHand) return "exhaust";
    if (card.block && !card.damage) return "block";
    if (card.draw && !card.damage && !card.block) return "draw";
    if (card.type === "attack") return "attack";
    return "skill";
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawCardArt(canvas, card) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const mechanic = getCardMechanic(card);

    const bgPairs = {
      attack: ["#2a0808","#120000"], hex: ["#1a0a2e","#09000f"],
      charged: ["#1a1500","#0c0900"], energy: ["#1a1200","#0c0900"],
      exhaust: ["#1c1000","#0c0600"], block: ["#001828","#000b14"],
      draw: ["#001a18","#000c0b"], pact: ["#200010","#0d0008"], skill: ["#0a1428","#040c1a"]
    };
    const [c1, c2] = bgPairs[mechanic] || bgPairs.skill;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, c1); bg.addColorStop(1, c2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;

    if (mechanic === "attack") {
      ctx.save(); ctx.translate(cx, cy);
      const slashes = [[0,0,26,"rgba(220,60,30,0.95)",3],[-11,4,20,"rgba(255,120,40,0.7)",2],[10,-5,18,"rgba(200,40,20,0.5)",1.5]];
      slashes.forEach(([ox,oy,len,color,lw]) => {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
        ctx.shadowColor = "rgba(255,80,0,0.7)"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(ox-len, oy-len*0.55); ctx.lineTo(ox+len, oy+len*0.55); ctx.stroke();
      });
      const g = ctx.createRadialGradient(0,0,0,0,0,14);
      g.addColorStop(0,"rgba(255,100,0,0.35)"); g.addColorStop(1,"transparent");
      ctx.fillStyle = g; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
      ctx.restore();

    } else if (mechanic === "hex") {
      ctx.save(); ctx.translate(cx, cy);
      const gHex = ctx.createRadialGradient(0,0,6,0,0,22);
      gHex.addColorStop(0,"rgba(160,0,255,0.85)"); gHex.addColorStop(0.6,"rgba(100,0,180,0.4)"); gHex.addColorStop(1,"transparent");
      ctx.fillStyle = gHex; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(200,100,255,0.85)"; ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(180,0,255,0.9)"; ctx.shadowBlur = 7;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*18, Math.sin(a)*18); ctx.stroke();
      }
      ctx.fillStyle = "rgba(220,150,255,0.95)"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
      ctx.restore();

    } else if (mechanic === "charged") {
      ctx.save(); ctx.translate(cx, cy);
      ctx.shadowColor = "rgba(255,230,0,0.95)"; ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(255,230,0,0.92)";
      ctx.beginPath();
      ctx.moveTo(4,-22); ctx.lineTo(-7,0); ctx.lineTo(2,0);
      ctx.lineTo(-4,22); ctx.lineTo(9,-2); ctx.lineTo(0,-2); ctx.closePath();
      ctx.fill();
      ctx.restore();

    } else if (mechanic === "energy") {
      ctx.save(); ctx.translate(cx, cy);
      const gOrb = ctx.createRadialGradient(-4,-4,2,0,0,20);
      gOrb.addColorStop(0,"rgba(255,220,60,0.95)"); gOrb.addColorStop(0.55,"rgba(200,140,0,0.55)"); gOrb.addColorStop(1,"transparent");
      ctx.fillStyle = gOrb; ctx.shadowColor = "rgba(255,180,0,0.75)"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
      const gCore = ctx.createRadialGradient(-3,-3,0,0,0,8);
      gCore.addColorStop(0,"rgba(255,255,200,0.95)"); gCore.addColorStop(1,"rgba(255,200,0,0.4)");
      ctx.fillStyle = gCore; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
      ctx.restore();

    } else if (mechanic === "exhaust") {
      ctx.save(); ctx.translate(cx, cy+8);
      const flameGrad = ctx.createLinearGradient(0,-28,0,8);
      flameGrad.addColorStop(0,"rgba(255,200,50,0.92)"); flameGrad.addColorStop(0.5,"rgba(255,80,0,0.8)"); flameGrad.addColorStop(1,"rgba(150,30,0,0.25)");
      ctx.fillStyle = flameGrad; ctx.shadowColor = "rgba(255,100,0,0.85)"; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0,8); ctx.bezierCurveTo(-12,0,-16,-14,-6,-20);
      ctx.bezierCurveTo(-2,-10,2,-10,0,-28);
      ctx.bezierCurveTo(8,-16,16,-8,12,0); ctx.bezierCurveTo(8,4,6,8,0,8);
      ctx.fill(); ctx.restore();

    } else if (mechanic === "block") {
      ctx.save(); ctx.translate(cx, cy);
      const shGrad = ctx.createLinearGradient(0,-22,0,20);
      shGrad.addColorStop(0,"rgba(80,180,255,0.92)"); shGrad.addColorStop(1,"rgba(0,60,140,0.7)");
      ctx.fillStyle = shGrad; ctx.strokeStyle = "rgba(120,200,255,0.85)"; ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(0,140,255,0.75)"; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0,-22); ctx.lineTo(18,-14); ctx.lineTo(18,2);
      ctx.bezierCurveTo(18,14,8,20,0,24);
      ctx.bezierCurveTo(-8,20,-18,14,-18,2); ctx.lineTo(-18,-14); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(200,230,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(0,-18); ctx.lineTo(12,-12); ctx.lineTo(12,-4); ctx.lineTo(0,0); ctx.lineTo(-12,-4); ctx.lineTo(-12,-12); ctx.closePath();
      ctx.fill(); ctx.restore();

    } else if (mechanic === "draw") {
      ctx.save(); ctx.translate(cx, cy+4);
      [-14,0,14].forEach((ox, i) => {
        const angle = (i-1)*0.22;
        ctx.save(); ctx.translate(ox*0.6,0); ctx.rotate(angle);
        ctx.fillStyle = i===1 ? "rgba(100,200,255,0.88)" : "rgba(60,120,180,0.62)";
        ctx.strokeStyle = "rgba(140,220,255,0.75)"; ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(80,160,255,0.55)"; ctx.shadowBlur = i===1 ? 9 : 3;
        roundRect(ctx,-9,-16,18,26,3); ctx.fill(); ctx.stroke();
        ctx.restore();
      }); ctx.restore();

    } else if (mechanic === "pact") {
      ctx.save(); ctx.translate(cx, cy);
      const dropGrad = ctx.createRadialGradient(-3,-6,2,0,0,16);
      dropGrad.addColorStop(0,"rgba(255,80,80,0.95)"); dropGrad.addColorStop(1,"rgba(120,0,0,0.6)");
      ctx.fillStyle = dropGrad; ctx.shadowColor = "rgba(200,0,0,0.85)"; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0,-20); ctx.bezierCurveTo(10,-10,14,0,14,6);
      ctx.bezierCurveTo(14,16,-14,16,-14,6); ctx.bezierCurveTo(-14,0,-10,-10,0,-20);
      ctx.fill(); ctx.restore();

    } else {
      ctx.save(); ctx.translate(cx, cy);
      const gSkill = ctx.createRadialGradient(-4,-4,2,0,0,18);
      gSkill.addColorStop(0,"rgba(80,220,255,0.88)"); gSkill.addColorStop(0.6,"rgba(0,100,180,0.42)"); gSkill.addColorStop(1,"transparent");
      ctx.fillStyle = gSkill; ctx.shadowColor = "rgba(0,180,255,0.65)"; ctx.shadowBlur = 13;
      ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
      const gInner = ctx.createRadialGradient(-3,-3,0,0,0,7);
      gInner.addColorStop(0,"rgba(200,240,255,0.95)"); gInner.addColorStop(1,"rgba(0,150,255,0.4)");
      ctx.fillStyle = gInner; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  // ─── Card Component Builder ───────────────────────────────────────
  function makeCardEl(card, opts = {}) {
    const { large = false, unplayable = false, onClick = null } = opts;
    const el = document.createElement("div");
    el.className = [
      "card-component",
      `type-${card.type}`,
      card.rarity ? `rarity-${card.rarity}` : "",
      large ? "large" : "",
      unplayable ? "unplayable" : ""
    ].filter(Boolean).join(" ");

    el.innerHTML = `
      <div class="card-cost cost-${card.cost}">${card.cost}</div>
      <canvas class="card-art-canvas" width="120" height="58"></canvas>
      <div class="card-type-stripe"></div>
      <div class="card-name">${card.name}</div>
      <div class="card-desc">${describeCard(card)}</div>
    `;
    const canvas = el.querySelector("canvas.card-art-canvas");
    if (canvas) drawCardArt(canvas, card);
    if (onClick && !unplayable) el.addEventListener("click", onClick);
    return el;
  }

  function makeRelicCardEl(relic, opts = {}) {
    const { onClick = null } = opts;
    const el = document.createElement("div");
    el.className = "relic-card";
    el.innerHTML = `
      <div class="relic-icon">${relic.icon || "💎"}</div>
      <div class="relic-card-name">${relic.name}</div>
      <div class="relic-card-desc">${relic.description}</div>
    `;
    if (onClick) el.addEventListener("click", onClick);
    return el;
  }

  // ─── Relic Strip ──────────────────────────────────────────────────
  function renderRelicStrip(containerId) {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = "";
    (currentRun.relics || []).forEach((relic) => {
      const badge = document.createElement("div");
      badge.className = "relic-badge";
      badge.innerHTML = `
        ${relic.icon || "💎"}
        <div class="relic-tooltip">
          <div class="relic-name">${relic.name}</div>
          ${relic.description}
        </div>
      `;
      container.appendChild(badge);
    });
  }

  // ─── Floating Damage ─────────────────────────────────────────────
  function floatNumber(text, targetEl, type = "damage") {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const div = document.createElement("div");
    div.className = `float-dmg ${type}`;
    div.textContent = text;
    div.style.left = `${rect.left + rect.width / 2 - 20}px`;
    div.style.top  = `${rect.top + 20}px`;
    document.body.appendChild(div);
    div.addEventListener("animationend", () => div.remove());
  }

  function showTurnBanner(text, variant = "player") {
    const banner = $("turn-banner");
    if (!banner) return;
    const textEl = $("turn-banner-text");
    if (textEl) textEl.textContent = text;
    banner.classList.remove("show", "player-banner", "enemy-banner");
    void banner.offsetWidth; // force reflow
    banner.classList.add("show", variant === "enemy" ? "enemy-banner" : "player-banner");
    banner.addEventListener("animationend", () => {
      banner.classList.remove("show", "player-banner", "enemy-banner");
    }, { once: true });
  }

  function spawnConfetti() {
    const colors = ["#e8c840","#c040e0","#40a0e8","#e05040","#40e880","#ffffff","#f0a020"];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.top = "-10px";
      piece.style.width  = `${6  + Math.random() * 7}px`;
      piece.style.height = `${8  + Math.random() * 7}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.2 + Math.random() * 1.6}s`;
      piece.style.animationDelay    = `${Math.random() * 0.7}s`;
      document.body.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  // ─── Map Render ───────────────────────────────────────────────────
  function renderMap() {
    const { map } = currentRun;
    const available = listAvailableNodes(currentRun);
    const availSet = new Set(available.map((n) => n.id));
    const visitedSet = buildVisitedSet();

    $("map-hp").textContent    = String(currentRun.player.health);
    $("map-gold").textContent  = String(currentRun.player.gold);
    $("map-deck-count").textContent = `${currentRun.player.deck.length} cards`;
    renderRelicStrip("map-relic-strip");

    const canvas = $("map-canvas");
    canvas.innerHTML = '<svg id="map-svg"></svg>';

    const rows = map.rows;
    const columns = map.columns;
    const nodeW = 64, nodeH = 64, gapX = 80, gapY = 90;
    const totalW = columns * nodeW + (columns - 1) * (gapX - nodeW);
    const totalH = rows * nodeH + (rows - 1) * (gapY - nodeH);
    canvas.style.width  = `${totalW + 40}px`;
    canvas.style.height = `${totalH + 40}px`;

    // Position lookup
    const positions = {};
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = 20 + col * gapX;
        const y = 20 + (rows - 1 - row) * gapY;
        positions[`r${row}c${col}`] = { x: x + nodeW / 2, y: y + nodeH / 2, left: x, top: y };
      }
    }

    // Draw SVG paths
    const svg = $("map-svg");
    svg.setAttribute("width", totalW + 40);
    svg.setAttribute("height", totalH + 40);
    map.nodes.forEach((node) => {
      node.next.forEach((nextId) => {
        const a = positions[node.id];
        const b = positions[nextId];
        if (!a || !b) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
        line.setAttribute("stroke", "#2a3050");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
      });
    });

    // Draw nodes
    map.nodes.forEach((node) => {
      const pos = positions[node.id];
      const el = document.createElement("div");
      el.className = [
        "map-node",
        `type-${node.type}`,
        availSet.has(node.id)               ? "available" : "",
        map.currentNodeId === node.id       ? "current"   : "",
        visitedSet.has(node.id) && map.currentNodeId !== node.id ? "visited" : "",
        !availSet.has(node.id) && !visitedSet.has(node.id) && map.currentNodeId !== node.id ? "locked" : ""
      ].filter(Boolean).join(" ");
      el.style.position = "absolute";
      el.style.left = `${pos.left}px`;
      el.style.top  = `${pos.top}px`;
      el.innerHTML  = `<span>${NODE_ICONS[node.type] || "?"}</span>`;
      if (availSet.has(node.id)) {
        el.addEventListener("click", () => {
          currentRun = enterNode(currentRun, node.id);
          saveRun(currentRun);
          render();
        });
      }
      canvas.appendChild(el);
    });
  }

  function buildVisitedSet() {
    const visited = new Set();
    const { map } = currentRun;
    if (!map.currentNodeId) return visited;
    // All nodes that are in the same row or earlier than currentNode are visited
    const curNode = map.nodes.find((n) => n.id === map.currentNodeId);
    if (!curNode) return visited;
    map.nodes.forEach((n) => {
      if (n.row <= curNode.row) visited.add(n.id);
    });
    return visited;
  }

  // ─── Combat Render ────────────────────────────────────────────────
  let prevPlayerHp = null;
  let prevEnemyHp  = null;

  function renderCombat() {
    const { combat } = currentRun;
    if (!combat) return;
    const maxHp = currentRun.player.maxHp || DEFAULT_PLAYER_HEALTH;

    // Floor label
    const nodeLabels = { combat:"Combat", elite:"Elite Encounter", boss:"Boss Battle" };
    $("combat-floor-label").textContent = nodeLabels[combat.nodeType] || "Combat";

    // Player stats
    setHp("player-hp-bar","player-hp-current","player-hp-max", combat.player.health, maxHp);

    // Energy pips
    const pips = $("energy-pips");
    pips.innerHTML = "";
    for (let i = 0; i < DEFAULT_PLAYER_ENERGY + getEnergyBonus(currentRun); i++) {
      const pip = document.createElement("div");
      pip.className = `energy-pip ${i < combat.player.energy ? "filled" : ""}`;
      pips.appendChild(pip);
    }

    // Player badges
    const pb = $("player-badges");
    pb.innerHTML = "";
    if (combat.player.block > 0) pb.innerHTML += `<span class="badge block">🛡️ ${combat.player.block}</span>`;
    if (combat.player.charged)   pb.innerHTML += `<span class="badge charged">⚡ Charged</span>`;

    // Enemy
    const enemyMax = combat._enemyMaxHp || combat.enemy.health;
    if (!combat._enemyMaxHp) combat._enemyMaxHp = combat.enemy.health;
    setHp("enemy-hp-bar","enemy-hp-current","enemy-hp-max", combat.enemy.health, enemyMax);
    $("enemy-name").textContent = combat.enemy.name;
    $("enemy-avatar").textContent = ENEMY_ICONS[combat.enemy.id] || "👹";
    if (combat.nodeType === "elite") $("enemy-avatar").style.fontSize = "52px";
    if (combat.nodeType === "boss")  $("enemy-avatar").style.fontSize = "60px";

    const eb = $("enemy-badges");
    eb.innerHTML = "";
    if ((combat.enemy.block||0) > 0) eb.innerHTML += `<span class="badge block">🛡️ ${combat.enemy.block}</span>`;
    if ((combat.enemy.hex||0) > 0)   eb.innerHTML += `<span class="badge hex">💀 Hex ${combat.enemy.hex}</span>`;

    // Intent
    const intent = combat.enemyIntent;
    if (intent) {
      const intentIcons = { attack:"⚔️", multi_attack:"⚡", block:"🛡️", buff:"💪" };
      let label = intent.label;
      // Show actual damage when enemy has strength buffs stacked
      const sb = combat.enemy.strengthBuff || 0;
      if (sb > 0 && (intent.type === "attack" || intent.type === "multi_attack")) {
        label += ` (+${sb} str)`;
      }
      $("intent-action").textContent = `${intentIcons[intent.type]||""} ${label}`;
    } else {
      $("intent-action").textContent = combat.state === "victory" ? "Defeated" : "—";
    }

    // Turn indicator
    $("combat-turn-label").textContent = combat.turn === "player" ? "Your Turn" : (combat.state === "victory" ? "Victory!" : combat.state);
    $("turn-icon").textContent = combat.turn === "player" ? "🧙" : "👹";

    // Pile counters
    $("draw-count").textContent    = String(combat.drawPile.length);
    $("discard-count").textContent = String(combat.discardPile.length);
    $("exhaust-count").textContent = String((combat.exhaustPile||[]).length);

    // Relic strip
    renderRelicStrip("combat-relic-strip");

    // Floating damage on change
    if (prevPlayerHp !== null && combat.player.health < prevPlayerHp) {
      floatNumber(`-${prevPlayerHp - combat.player.health}`, $("player-avatar"), "damage");
      $("player-avatar").classList.add("shake");
      setTimeout(() => $("player-avatar") && $("player-avatar").classList.remove("shake"), 400);
    }
    if (prevPlayerHp !== null && combat.player.health > prevPlayerHp) {
      floatNumber(`+${combat.player.health - prevPlayerHp}`, $("player-avatar"), "heal");
    }
    if (prevEnemyHp !== null && combat.enemy.health < prevEnemyHp) {
      floatNumber(`-${prevEnemyHp - combat.enemy.health}`, $("enemy-avatar"), "damage");
      $("enemy-avatar").classList.add("shake");
      setTimeout(() => $("enemy-avatar") && $("enemy-avatar").classList.remove("shake"), 400);
    }
    prevPlayerHp = combat.player.health;
    prevEnemyHp  = combat.enemy.health;

    // Hand
    const handArea = $("hand-area");
    handArea.innerHTML = "";
    const isPlayerTurn = combat.turn === "player" && combat.state === "active";

    combat.hand.forEach((card, idx) => {
      const cost = card.costReduceIfHexed && (combat.enemy.hex||0) > 0
        ? Math.max(0, card.cost - card.costReduceIfHexed) : card.cost;
      const cantPlay = !isPlayerTurn || combat.player.energy < cost;
      const el = makeCardEl(card, {
        unplayable: cantPlay,
        onClick: () => {
          // Fly the card up as a ghost
          const rect = el.getBoundingClientRect();
          const ghost = el.cloneNode(true);
          ghost.classList.add("card-flying");
          ghost.style.left   = `${rect.left}px`;
          ghost.style.top    = `${rect.top}px`;
          ghost.style.width  = `${rect.width}px`;
          ghost.style.height = `${rect.height}px`;
          document.body.appendChild(ghost);
          ghost.addEventListener("animationend", () => ghost.remove());

          try {
            const updated = playCardAtIndex(currentRun.combat, idx, currentRun);
            if (updated.state === "victory") {
              currentRun = applyVictory(currentRun, updated);
              spawnConfetti();
            } else {
              currentRun = { ...currentRun, combat:updated,
                             player:{ ...currentRun.player, health:updated.player.health } };
            }
            saveRun(currentRun);
            render();
          } catch (e) { ghost.remove(); /* ignore unplayable clicks */ }
        }
      });
      handArea.appendChild(el);
      // Staggered deal animation
      const delay = idx * 55;
      setTimeout(() => {
        if (el.isConnected) {
          el.classList.add("dealing");
          el.addEventListener("animationend", () => el.classList.remove("dealing"), { once: true });
        }
      }, delay);
    });

    // End turn button
    $("end-turn-btn").disabled = !isPlayerTurn;

    // Debug: skip combat button
    let debugBtn = $("debug-skip-combat");
    if (!debugBtn) {
      debugBtn = document.createElement("button");
      debugBtn.id = "debug-skip-combat";
      debugBtn.textContent = "⚙ Skip Combat";
      debugBtn.style.cssText = "position:fixed;bottom:12px;right:180px;padding:6px 12px;background:#1e2333;border:1px solid #444;border-radius:6px;color:#7a83a8;font-size:11px;cursor:pointer;z-index:50;";
      debugBtn.addEventListener("click", () => {
        if (!currentRun.combat) return;
        const fakeCombat = { ...currentRun.combat, state:"victory", turn:null,
                              enemy:{ ...currentRun.combat.enemy, health:0 } };
        currentRun = applyVictory(currentRun, fakeCombat);
        saveRun(currentRun);
        render();
      });
      document.body.appendChild(debugBtn);
    }
    debugBtn.style.display = combat.state === "active" ? "block" : "none";
  }

  // ─── Reward / Event Render ────────────────────────────────────────
  function renderReward() {
    rewardClaiming = false;
    const run = currentRun;

    function claimOnce(fn) {
      return () => {
        if (rewardClaiming) return;
        rewardClaiming = true;
        fn();
      };
    }

    // ── Event ──
    if (run.event) {
      hide("reward-content", "relic-choice-panel", "removal-panel");
      show("event-panel");
      $("event-title").textContent = run.event.title || "Event";
      $("event-text").textContent  = run.event.text;
      const choices = $("event-choices");
      choices.innerHTML = "";
      run.event.options.forEach((opt) => {
        const wrap = document.createElement("div");
        wrap.className = "event-choice-wrap";

        if (opt.effect === "reward_cards" && opt.cards) {
          // Show label button + preview of card choices below it
          const btn = document.createElement("button");
          btn.className = "event-choice-btn";
          btn.textContent = opt.label;
          btn.addEventListener("click", claimOnce(() => {
            currentRun = claimEventOption(currentRun, opt);
            saveRun(currentRun);
            render();
          }));
          wrap.appendChild(btn);
          const cardRow = document.createElement("div");
          cardRow.className = "event-card-preview-row";
          opt.cards.forEach((card) => {
            cardRow.appendChild(makeCardEl(card, { small: true }));
          });
          wrap.appendChild(cardRow);
        } else if (opt.effect === "add_card" && opt.card) {
          // Show the card component as the clickable element
          const cardEl = makeCardEl(opt.card, {
            large: true,
            onClick: claimOnce(() => {
              currentRun = claimEventOption(currentRun, opt);
              saveRun(currentRun);
              render();
            })
          });
          wrap.appendChild(cardEl);
        } else {
          const btn = document.createElement("button");
          btn.className = "event-choice-btn";
          btn.textContent = opt.label;
          btn.addEventListener("click", claimOnce(() => {
            currentRun = claimEventOption(currentRun, opt);
            saveRun(currentRun);
            render();
          }));
          wrap.appendChild(btn);
        }

        choices.appendChild(wrap);
      });
      return;
    }

    hide("event-panel");
    const pr = run.pendingRewards;
    if (!pr) return;

    // ── Removal phase ──
    if (pr.removeCard && pr.cards.length === 0 && (pr.relics||[]).length === 0) {
      hide("reward-content", "relic-choice-panel", "event-panel");
      show("removal-panel");
      const container = $("removal-cards");
      container.innerHTML = "";
      const uniqueIds = [...new Set(run.player.deck)];
      uniqueIds.forEach((cardId) => {
        const card = CARD_LIBRARY[cardId];
        if (!card) return;
        const el = makeCardEl(card, {
          large: true,
          onClick: claimOnce(() => {
            currentRun = removeCardFromDeck(currentRun, cardId);
            saveRun(currentRun);
            render();
          })
        });
        container.appendChild(el);
      });
      return;
    }

    // ── Elite relic choice (forced — no skip) ──
    if ((pr.relics||[]).length > 0) {
      hide("reward-content", "event-panel", "removal-panel");
      show("relic-choice-panel");
      const row = $("reward-cards-row-relics");
      row.innerHTML = "";
      pr.relics.forEach((relic) => {
        const wrap = document.createElement("div");
        wrap.className = "reward-item";
        wrap.appendChild(makeRelicCardEl(relic, {
          onClick: claimOnce(() => {
            currentRun = claimRelicFromChoices(currentRun, relic);
            saveRun(currentRun);
            render();
          })
        }));
        row.appendChild(wrap);
      });
      return;
    }

    // ── Card / relic rewards ──
    hide("event-panel", "relic-choice-panel", "removal-panel");
    show("reward-content");

    const isElite = pr.removeCard;
    const isBoss = currentRun.combat && currentRun.combat.nodeType === "boss";
    $("reward-header").textContent = isElite ? "Elite Victory!" : (isBoss ? "Boss Defeated!" : "Combat Victory!");

    // Subtitle: only show instructions relevant to what's actually available
    if (pr.cards.length > 0 && pr.relic) {
      $("reward-subtitle").textContent = "Choose a card — or claim the relic";
    } else if (pr.cards.length > 0) {
      $("reward-subtitle").textContent = "Choose a card to add to your deck";
    } else if (pr.relic) {
      $("reward-subtitle").textContent = "Claim your relic reward";
    } else {
      $("reward-subtitle").textContent = "";
    }

    // Skip button: only show if there are cards to skip (never show if only relic is left)
    const skipBtn = $("reward-skip-btn");
    if (pr.cards.length > 0) {
      skipBtn.style.display = "";
      skipBtn.textContent = pr.relic ? "Skip card reward" : "Skip";
    } else {
      skipBtn.style.display = "none";
    }

    const row = $("reward-cards-row");
    row.innerHTML = "";

    pr.cards.forEach((card) => {
      const wrap = document.createElement("div");
      wrap.className = "reward-item";
      wrap.appendChild(makeCardEl(card, {
        large: true,
        onClick: claimOnce(() => {
          currentRun = claimCardReward(currentRun, card);
          saveRun(currentRun);
          render();
        })
      }));
      row.appendChild(wrap);
    });

    if (pr.relic) {
      const wrap = document.createElement("div");
      wrap.className = "reward-item";
      wrap.appendChild(makeRelicCardEl(pr.relic, {
        onClick: claimOnce(() => {
          currentRun = claimRelicReward(currentRun, pr.relic);
          saveRun(currentRun);
          render();
        })
      }));
      row.appendChild(wrap);
    }
  }

  // ─── Deck Overlay ─────────────────────────────────────────────────
  function renderDeckOverlay() {
    const container = $("deck-panel-cards");
    container.innerHTML = "";
    const deck = currentRun.player.deck;
    $("deck-panel-title").textContent = `Your Deck (${deck.length} cards)`;
    deck.forEach((cardId) => {
      const card = CARD_LIBRARY[cardId];
      if (!card) return;
      container.appendChild(makeCardEl(card));
    });
    show("deck-overlay");
  }

  // ─── Main Render ──────────────────────────────────────────────────
  function render() {
    if (!currentRun) return;
    const { state, combat, pendingRewards, event } = currentRun;

    // End state
    if (state === "won" || state === "defeat") {
      renderEndState();
      return;
    }

    // Decide which screen to show
    const inCombat  = combat && combat.state === "active";
    const inReward  = !!(pendingRewards || event);
    hide("screen-start");

    if (inCombat) {
      hide("screen-map", "screen-reward");
      show("screen-combat");
      renderCombat();
    } else if (inReward) {
      hide("screen-map", "screen-combat");
      show("screen-reward");
      renderReward();
      prevPlayerHp = null;
      prevEnemyHp  = null;
      const dbg = $("debug-skip-combat");
      if (dbg) dbg.style.display = "none";
    } else {
      hide("screen-combat", "screen-reward");
      show("screen-map");
      renderMap();
      prevPlayerHp = null;
      prevEnemyHp  = null;
      const dbg = $("debug-skip-combat");
      if (dbg) dbg.style.display = "none";
    }
  }

  function renderEndState() {
    const won = currentRun.state === "won";
    const el = $("screen-end");
    el.className = won ? "win" : "loss";
    $("end-icon").textContent  = won ? "🏆" : "💀";
    $("end-title").textContent = won ? "VICTORY" : "DEFEAT";
    $("end-stats").innerHTML   = [
      `Nodes visited: ${currentRun.map.nodes.filter((n) => n.row < (currentRun.map.rows||5) && currentRun.map.currentNodeId && n.row <= currentRun.map.nodes.find((x) => x.id === currentRun.map.currentNodeId).row).length}`,
      `Relics collected: ${(currentRun.relics||[]).length}`,
      `Cards in deck: ${currentRun.player.deck.length}`,
      `Gold: ${currentRun.player.gold}`
    ].join("<br />");
    show("screen-end");
    hide("screen-map","screen-combat","screen-reward");
  }

  // ─── Event Wiring ─────────────────────────────────────────────────
  $("start-new-run-btn").addEventListener("click", () => {
    currentRun = startNewRun();
    saveRun(currentRun);
    hide("screen-start","screen-end");
    render();
  });

  $("start-load-run-btn").addEventListener("click", () => {
    try {
      currentRun = loadRun();
      hide("screen-start","screen-end");
      render();
    } catch (e) {
      alert("No saved run found.");
    }
  });

  $("end-new-run-btn").addEventListener("click", () => {
    currentRun = startNewRun();
    saveRun(currentRun);
    hide("screen-end");
    render();
  });

  $("end-turn-btn").addEventListener("click", () => {
    if (!currentRun.combat) return;
    const btn = $("end-turn-btn");
    btn.disabled = true;

    showTurnBanner("ENEMY TURN", "enemy");
    const enemyPanel = $("enemy-panel");
    if (enemyPanel) enemyPanel.classList.add("lunging");

    setTimeout(() => {
      if (enemyPanel) enemyPanel.classList.remove("lunging");
      const updated = resolveEndTurn(currentRun.combat, currentRun);
      if (updated.state === "victory") {
        currentRun = applyVictory(currentRun, updated);
        spawnConfetti();
        saveRun(currentRun);
        render();
      } else if (updated.state === "defeat") {
        currentRun = { ...currentRun, combat: updated, state: "defeat" };
        saveRun(currentRun);
        render();
      } else {
        currentRun = { ...currentRun, combat: updated, player:{ ...currentRun.player, health: updated.player.health } };
        saveRun(currentRun);
        showTurnBanner("YOUR TURN", "player");
        setTimeout(() => render(), 400);
      }
    }, 600);
  });

  $("reward-skip-btn").addEventListener("click", () => {
    currentRun = skipRewards(currentRun);
    saveRun(currentRun);
    render();
  });

  $("removal-skip-btn").addEventListener("click", () => {
    currentRun = finishNode(currentRun);
    saveRun(currentRun);
    render();
  });

  // Deck buttons
  ["map-deck-btn","combat-deck-btn"].forEach((id) => {
    $(id) && $(id).addEventListener("click", () => renderDeckOverlay());
  });
  $("deck-close-btn").addEventListener("click", () => hide("deck-overlay"));
  $("deck-overlay").addEventListener("click", (e) => {
    if (e.target === $("deck-overlay")) hide("deck-overlay");
  });

  // ─── Init ─────────────────────────────────────────────────────────
  try {
    const saved = loadRun();
    if (saved) {
      currentRun = saved;
      // Check if continue is valid
      const hasSave = !!localStorage.getItem(STORAGE_KEY);
      if (!hasSave) hide("start-load-run-btn");
    }
  } catch (e) {
    hide("start-load-run-btn");
  }

  show("screen-start");
  hide("screen-map","screen-combat","screen-reward","screen-end","deck-overlay");
})();
