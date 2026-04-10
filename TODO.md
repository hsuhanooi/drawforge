{
  "milestone": {
    "name": "Economy, Rewards, and Run Depth",
    "goal": "Turn Drawforge from a now-complete Living Spire baseline into a run that sustains interesting decisions across all three acts by fixing shop value, reward cadence, deck growth, and route-level run thickness.",
    "outcomes": [
      "Shops become worth visiting instead of automatic skips",
      "Reward screens regularly offer meaningful card, relic, and gold decisions",
      "Decks grow beyond the starter shell at a healthy pace across a full run",
      "Rest sites, shops, and events each support distinct strategic tradeoffs",
      "Runs feel longer and richer without reintroducing burn-in instability",
      "progress.txt appended after each completed task"
    ],
    "in_scope": [
      "Shop inventory and pricing rebalance",
      "Reward-value rebalance",
      "Card acquisition pacing",
      "Gold economy tuning",
      "Rest-site decision depth",
      "Route/node distribution tuning",
      "Run telemetry and burn-in validation for economy outcomes",
      "Targeted tests for reward/shop/run-depth systems"
    ],
    "tasks": [
      {
        "category": "balance",
        "description": "Rebalance shop pricing and inventory so shops are no longer routinely skipped",
        "steps": [
          "Inspect current shop prices, gold gains, and inventory composition across Acts 1-3",
          "Tune card, relic, and removal pricing so at least two shop actions are commonly affordable",
          "Improve shop inventory quality weighting so visits surface stronger cards, relics, or utility",
          "Verify shop screens still render correctly with the updated item mix",
          "Add or update tests covering shop generation and pricing expectations"
        ],
        "passes": true
      },
      {
        "category": "balance",
        "description": "Increase card reward quality and deck-growth pacing so runs do not stagnate near the starter deck",
        "steps": [
          "Inspect current reward pools and skip patterns from the burn-in and code paths",
          "Tune reward card quality and archetype relevance so post-combat picks are more compelling",
          "Adjust acquisition pacing so decks typically grow beyond the low-teens by late run",
          "Verify reward flow remains stable and does not regress the burn-in harness",
          "Add or update tests covering reward-option generation and deck-growth assumptions"
        ],
        "passes": false
      },
      {
        "category": "balance",
        "description": "Retune gold economy across combats, elites, shops, and events so spending decisions become strategic instead of starved or trivial",
        "steps": [
          "Audit gold inflow from combats, elites, bosses, and events across acts",
          "Tune gold payouts relative to new shop pricing so route choice matters",
          "Ensure event gold outcomes and shop costs do not create obvious dominant paths",
          "Run targeted simulations or deterministic checks on spendability across sample runs",
          "Add tests covering gold payout and economy invariants where practical"
        ],
        "passes": false
      },
      {
        "category": "gameplay",
        "description": "Deepen rest-site decisions so rest is not dominated by a single always-correct action",
        "steps": [
          "Inspect current campfire options and usage patterns after the upgrade expansion",
          "Add or tune alternate rest-site choices such as heal, smith, purge, or archetype utility where appropriate",
          "Balance those options so each can be right in different board or deck states",
          "Verify campfire UI and action resolution stay stable for all supported options",
          "Add or update tests covering campfire choice availability and effects"
        ],
        "passes": false
      },
      {
        "category": "content",
        "description": "Tune map node distribution and route incentives so runs feel thicker and support more varied economic paths",
        "steps": [
          "Review current Dense, Sparse, and Gauntlet template outputs against the new 3-act structure",
          "Adjust node-type distribution for shops, rests, combats, events, and elites to improve route diversity",
          "Ensure each template creates different but viable economy and upgrade opportunities",
          "Verify map generation stays deterministic by seed and compatible with traversal logic",
          "Add or update map-generation tests for the new routing expectations"
        ],
        "passes": false
      },
      {
        "category": "verification",
        "description": "Add run-depth telemetry and validation so economy improvements are measured instead of guessed",
        "steps": [
          "Extend automated validation or harness reporting to capture deck size, gold spend, shop usage, and reward pick rates",
          "Run medium and long validation samples on the new economy tuning",
          "Confirm runs are longer and richer without reviving dead-end or reward-flow bugs",
          "Log findings in progress.txt and use them to tighten any remaining weak spots",
          "Run the full test suite and lint before marking the milestone stable"
        ],
        "passes": false
      }
    ]
  }
}
