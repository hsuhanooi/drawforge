{
  "milestone": {
    "name": "Character Identity & World Variety",
    "goal": "Make archetype choice matter throughout the entire run — not just the starting deck — and make boss encounters unpredictable across runs. Add the 4th archetype that the existing Poison cards have been waiting for, and wire the first cross-act event consequence chains.",
    "outcomes": [
      "Reward screens offer cards biased toward the current run's archetype theme, making each archetype feel distinct across the whole run",
      "Boss encounters are unpredictable — Act 1 and Act 2 each have a pool of 3 bosses selected by run seed",
      "Poison Vanguard is a fully playable 4th archetype with its own visual theme and starter relic",
      "Four cross-act event chains make world choices feel consequential across acts",
      "progress.txt appended after each completed task"
    ],
    "in_scope": [
      "Archetype-biased card reward pools (50% themed + 50% general)",
      "2 new Act 1 bosses (Crypt Warden, Stone Idol) — pool of 3",
      "2 new Act 2 bosses (Hex Lord, Bone Emperor) — pool of 3",
      "Boss selection via run seed (deterministic per run, varies across runs)",
      "4th archetype: Poison Vanguard (venom_strike, toxic_cloud, creeping_blight, septic_touch, infectious_wound)",
      "New plague_sigil starter relic for Poison Vanguard",
      "Poison Vanguard visual theme (dark green palette)",
      "runFlags: {} on run state",
      "4 chain event pairs: Ferryman, Devil's Bargain, Haunted Crossroads, Leech Pool",
      "setsFlag field on event options + applyEventChoice wires runFlags",
      "Targeted tests for all four tasks"
    ],
    "tasks": [
      {
        "category": "gameplay",
        "description": "Archetype-biased card reward pools so reward screens reflect the current run's strategic theme",
        "steps": [
          "Add ARCHETYPE_CARD_THEMES mapping in src/rewards.js",
          "Implement buildBiasedPool that splits the reward pool 50% themed / 50% general",
          "Wire buildBiasedPool into createVictoryCardRewards using run.archetype",
          "Ensure fallback to unbiased pool when archetype is null or unrecognized",
          "Add bias assertions to tests/rewards.test.js",
          "Run targeted tests and lint"
        ],
        "passes": true
      },
      {
        "category": "content",
        "description": "Boss variety per act — 2 new Act 1 and 2 new Act 2 bosses with seed-based random selection",
        "steps": [
          "Add Crypt Warden and Stone Idol boss definitions to src/enemies.js",
          "Add Hex Lord and Bone Emperor boss definitions (Bone Emperor is 2-phase) to src/enemies.js",
          "Group bosses into act1BossPool, act2BossPool, act3BossPool arrays",
          "Implement selectBossForAct(act, runSeed) using char-code hash for determinism",
          "Update createEnemyForNode to accept and use runSeed for boss selection",
          "Pass run.seed from src/nodeResolver.js into createEnemyForNode",
          "Add boss pool and determinism assertions to tests/enemies.test.js",
          "Add seed-varied boss name assertions to tests/nodeResolver.test.js",
          "Run targeted tests and lint"
        ],
        "passes": true
      },
      {
        "category": "content",
        "description": "4th playable archetype: Poison Vanguard with green visual theme and plague_sigil starter relic",
        "steps": [
          "Add plague_sigil to src/relicRegistry.js (Enemies you kill while Poisoned carry 2 Poison to the next enemy)",
          "Wire plague_sigil effect in src/browserCombatActions.js (on enemy death while poisoned, set carryover poison)",
          "Add poison_vanguard to ARCHETYPES and ARCHETYPE_RELICS in src/browserRunActions.js",
          "Add poison_vanguard to ARCHETYPES array and VISUAL_THEMES in browser/play.js",
          "Update resolveCardFrameVariant to return venom for poison_vanguard theme",
          "Add poison_vanguard CSS theme variables and venom panel shadow to browser/play.css",
          "Add venom card frame variant CSS alongside hex/ember/storm",
          "Add poison_vanguard archetype choice test to tests/browserRunActions.test.js",
          "Run targeted tests and lint"
        ],
        "passes": true
      },
      {
        "category": "gameplay",
        "description": "Run flags and 4 cross-act event chains so world choices have lasting consequences",
        "steps": [
          "Add runFlags: {} to startNewRun in src/run.js",
          "Add setsFlag field to the_ferryman pay option and devil_bargain deal option and haunted_crossroads deal option and leech_pool bathe option in src/events.js",
          "Add 4 chain event definitions (return_crossing, collectors_visit, spirits_return, the_residue)",
          "Implement findChainEvent(act, runFlags) and extend createEventForNode to accept runFlags and inject chain events",
          "Mark used chain flags on the run to prevent re-triggering",
          "Wire setsFlag and usedFlags into applyEventChoice in src/browserPostNodeActions.js",
          "Pass run.runFlags into createEventForNode at all call sites in src/events.js and src/nodeResolver.js",
          "Add chain event injection assertions to tests/events.test.js",
          "Add setsFlag -> runFlags write assertion to tests/browserPostNodeActions.test.js",
          "Run targeted tests and lint"
        ],
        "passes": true
      }
    ]
  }
}
