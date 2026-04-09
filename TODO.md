{
  "milestone": {
    "name": "UI + Card System Upgrade",
    "goal": "Upgrade Drawforge from a functional prototype into a polished, scalable deckbuilder by overhauling combat UI, card interactions, card system architecture, art pipeline support, advanced VFX polish, and relic presentation.",
    "outcomes": [
      "Dedicated combat screen layout with clear player, enemy, hand, pile, relic, and turn-control regions",
      "Reusable upgraded card component with support for richer visuals and longer effect text",
      "Click and drag card play interactions with targeting and previews",
      "Enemy intent display and keyword tooltips",
      "Flexible multi-step card effect engine with conditional logic",
      "Visual feedback for damage, block, energy, draw, statuses, relic triggers, and turn transitions",
      "Deep relic UI overhaul with tooltip, trigger, and run-state presentation",
      "Full art pipeline support for cards, relics, enemies, backgrounds, icons, and VFX hooks",
      "Advanced VFX support for card play, targeting, status application, damage, and relic activations",
      "Unit and component tests for all new systems",
      "progress.txt appended after each completed task"
    ],
    "in_scope": [
      "Combat UI layout",
      "Card rendering improvements",
      "Card interaction model",
      "Card effect engine expansion",
      "Keyword tooltip system",
      "Enemy intent UI",
      "Combat feedback layer",
      "Deck, discard, and exhaust pile UI",
      "Deep relic UI overhaul",
      "Full art pipeline",
      "Advanced VFX polish",
      "Animation hooks and sequencing",
      "Asset management and fallback rendering"
    ],
    "tasks": [
      {
        "category": "functional",
        "description": "Create a dedicated combat screen layout with clear regions for player, enemy, hand, piles, relics, and turn controls",
        "steps": [
          "Open an active combat encounter",
          "Render a combat screen container",
          "Render distinct regions for enemy area, player area, hand area, pile area, relic area, and turn controls",
          "Verify layout remains readable with a full hand of cards and active relics",
          "Verify layout supports one enemy without overlapping critical UI",
          "Verify combat UI can render from live combat state"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Render cards using a reusable upgraded card component with support for name, cost, type, effect text, rarity, art frame, and state styling",
        "steps": [
          "Render a card using the new card component",
          "Display the card name, cost, type, effect text, and rarity",
          "Render card art or placeholder art region",
          "Render separate styling for Attack, Skill, and other supported card types",
          "Render disabled styling when the player cannot play the card",
          "Verify the card component can be reused in hand, rewards, deck view, and card library"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Cards in hand support hover and focus states that improve readability, scale, layering, and selection clarity",
        "steps": [
          "Open combat with multiple cards in hand",
          "Hover over a card",
          "Verify the hovered card raises above adjacent cards",
          "Verify the hovered card scales or shifts into a more readable state",
          "Move focus between multiple cards",
          "Verify only the active card is highlighted"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Player can select and play a card through click or drag interaction",
        "steps": [
          "Start the player turn with a playable card in hand",
          "Select a card using the supported interaction model",
          "Verify the selected card enters a pending play state",
          "Play the card on a valid target or targetless flow",
          "Verify energy is spent and the card effect resolves",
          "Verify the played card leaves the hand and transitions correctly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Targeted cards require and support explicit enemy target selection before resolving",
        "steps": [
          "Place a targeted attack card in the player's hand",
          "Select the card",
          "Verify valid enemy targets are highlighted",
          "Choose a valid target",
          "Verify the card resolves against the selected target",
          "Attempt to resolve without a valid target and verify play is blocked"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Selecting a card shows a preview of its main outcome such as expected damage, block, status application, or energy gain",
        "steps": [
          "Select an attack card",
          "Verify the UI previews expected damage on the target",
          "Select a block card",
          "Verify the UI previews expected block gain",
          "Select a status card",
          "Verify the UI previews keyword or debuff application where supported",
          "Deselect the card and verify previews are cleared"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Card definitions support multiple ordered effects such as damage, draw, gain energy, apply Hex, gain block, and Exhaust",
        "steps": [
          "Create a card with multiple ordered effects",
          "Resolve the card in combat",
          "Verify each effect resolves in the defined order",
          "Verify shared state updates between effect steps are respected",
          "Verify cards with one effect still work",
          "Verify unsupported effect definitions fail safely"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Card effects support conditional logic such as bonus damage versus Hexed targets or bonus effects when Charged",
        "steps": [
          "Create a card with a conditional bonus effect",
          "Resolve the card against a target that does not meet the condition",
          "Verify only base effects are applied",
          "Resolve the card against a target that meets the condition",
          "Verify the bonus effect is applied",
          "Verify condition evaluation is deterministic and testable"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Cards support structured keyword metadata for mechanics such as Hex, Charged, Exhaust, Draw, Energy, and Consume",
        "steps": [
          "Create a card with keyword metadata",
          "Render the card in the UI",
          "Verify keyword metadata is available to the renderer",
          "Verify keyword metadata can be used for tooltips, styling, and glossary views",
          "Verify cards without keywords still render correctly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Keyword terms in card text display contextual tooltips that explain current game mechanics",
        "steps": [
          "Render a card containing a supported keyword in its effect text",
          "Hover or focus the keyword",
          "Verify a tooltip appears with the keyword definition",
          "Verify the tooltip content matches the current rules text",
          "Verify multiple supported keywords can render tooltips correctly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Enemy UI displays the next intended action such as attack, defend, buff, debuff, or apply Hex",
        "steps": [
          "Start combat with an enemy that has a planned next action",
          "Render the enemy area",
          "Verify the enemy's intent icon or label is visible",
          "Verify expected values such as damage or block are shown when available",
          "Advance the turn",
          "Verify intent updates for the next enemy action"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Combat UI displays player health, block, energy, statuses, and turn-state information in a dedicated HUD",
        "steps": [
          "Enter combat",
          "Render the player HUD",
          "Verify current health is displayed",
          "Verify current block is displayed",
          "Verify current energy is displayed",
          "Verify active statuses such as Charged are displayed if present",
          "Verify the HUD updates immediately as combat state changes"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Combat UI displays draw pile, discard pile, and exhaust pile counts and supports inspection",
        "steps": [
          "Start combat",
          "Render draw pile, discard pile, and exhaust pile indicators",
          "Verify each pile count matches combat state",
          "Open an inspection view for each pile",
          "Verify the displayed cards match the underlying pile contents",
          "Verify counts update correctly as cards move between piles"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Combat UI includes clear turn controls and messaging for player turn, enemy turn, victory, defeat, and relic-trigger states",
        "steps": [
          "Start the player turn",
          "Verify the end turn control is visible and enabled",
          "End the turn",
          "Verify the UI indicates the enemy turn is active",
          "Complete combat with victory or defeat",
          "Verify the UI displays the correct combat result state",
          "Verify relic-trigger states can display without blocking core combat controls"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Combat interactions provide visible feedback for damage, block gain, energy changes, draw, status application, and relic triggers",
        "steps": [
          "Play an attack card",
          "Verify visible feedback appears for damage dealt",
          "Play a block card",
          "Verify visible feedback appears for block gained",
          "Play an energy or draw card",
          "Verify visible feedback appears for energy or card draw changes",
          "Trigger a status or relic effect and verify feedback is visible"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Combat UI records a lightweight combat log for recent actions and outcomes",
        "steps": [
          "Start combat",
          "Play multiple cards and resolve enemy actions",
          "Verify recent actions are added to the combat log",
          "Verify the log includes card plays, damage, block, statuses, and relic triggers",
          "Verify the log is capped to a reasonable recent history length"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Post-combat reward cards use the same upgraded card presentation and interaction system",
        "steps": [
          "Win a combat encounter",
          "Open the card reward screen",
          "Verify reward cards render using the upgraded card component",
          "Hover or focus a reward card",
          "Verify card text and keywords remain readable",
          "Select a reward and verify it is added to the deck"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Deck inspection uses the upgraded card component and supports scrolling, filtering, or paging for larger decks",
        "steps": [
          "Open the deck view during a run",
          "Render all cards using the upgraded card component",
          "Verify the view remains usable with a larger deck size",
          "Hover or focus a deck card",
          "Verify effect text and keywords remain readable",
          "Verify optional filters or sorting work if implemented"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Relic UI is overhauled to support persistent display, tooltips, trigger states, and run-level inspection",
        "steps": [
          "Start a run with one or more relics",
          "Render relics in the main combat or run HUD",
          "Hover or focus a relic",
          "Verify the relic name, effect text, rarity, and trigger behavior are shown",
          "Trigger a relic during combat and verify the relic visually responds",
          "Open a relic inspection view and verify all acquired relics are listed"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Relic UI supports passive, triggered, and start-of-combat effects with clear visual distinction",
        "steps": [
          "Create relics with passive, triggered, and start-of-combat effects",
          "Render each relic in the UI",
          "Verify each effect type has a readable visual treatment",
          "Start combat and verify start-of-combat relics surface correctly",
          "Trigger an in-combat relic and verify it is visually differentiated from passive relics"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Card definitions are stored in a scalable data-driven format that supports rich presentation fields, art references, keywords, and effect pipelines",
        "steps": [
          "Move existing card definitions into a centralized data structure",
          "Add fields for rarity, art asset reference, frame variant, and keyword metadata",
          "Verify cards can be instantiated from data definitions",
          "Verify the combat engine resolves cards through the shared effect pipeline",
          "Add at least one new multi-effect card using the new format",
          "Verify existing cards still function correctly after migration"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Relic definitions are stored in a scalable data-driven format that supports passive, triggered, and encounter-scoped effects",
        "steps": [
          "Move existing relic definitions into a centralized data structure",
          "Add fields for rarity, asset reference, trigger type, and rules text",
          "Verify relics can be instantiated from data definitions",
          "Verify start-of-combat and passive relics can resolve through shared hooks",
          "Add at least one new triggered relic using the new format",
          "Verify existing relics still function correctly after migration"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "The art pipeline supports loading, validating, and rendering card, relic, enemy, icon, background, and VFX-associated assets",
        "steps": [
          "Define supported asset categories and file reference conventions",
          "Load card, relic, enemy, icon, and background assets through a shared asset system",
          "Verify missing assets fall back to safe placeholder rendering",
          "Verify assets can be referenced from data-driven card and relic definitions",
          "Verify asset loading errors do not crash combat or reward screens"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "The art pipeline supports variant card frames, rarity treatments, and theme-based visual overrides",
        "steps": [
          "Create frame variants for supported card types and rarities",
          "Render cards with different frame treatments",
          "Verify rarity and type visuals do not conflict with text readability",
          "Apply a theme or skin override where supported",
          "Verify variant rendering remains consistent across hand, rewards, and deck views"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "The VFX system supports card play, targeting, hit, block, status application, draw, exhaust, relic trigger, and combat result effects",
        "steps": [
          "Play a card and trigger a card-play VFX event",
          "Target an enemy and trigger a targeting VFX state",
          "Deal damage and verify hit VFX plays",
          "Gain block and verify defense VFX plays",
          "Apply a status or trigger a relic and verify the correct VFX plays",
          "Complete combat and verify victory or defeat VFX can play"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "VFX sequencing is decoupled from combat rules so gameplay remains correct even when effects are disabled, skipped, or delayed",
        "steps": [
          "Resolve combat actions with VFX enabled",
          "Resolve the same combat actions with VFX disabled",
          "Verify gameplay state is identical in both cases",
          "Introduce an intentionally delayed VFX sequence",
          "Verify combat logic remains deterministic and does not block incorrectly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Animation hooks are added for drawing, playing, discarding, exhausting, shuffling, relic triggering, and enemy intent updates",
        "steps": [
          "Draw cards into hand",
          "Verify the UI exposes a draw transition hook",
          "Play, discard, and exhaust cards",
          "Verify each state change exposes the correct transition hook",
          "Trigger a relic or update enemy intent",
          "Verify those UI state changes expose animation hooks",
          "Verify combat state remains correct even if animations are disabled"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "A combat presentation layer coordinates UI state, animation state, preview state, and VFX state without owning combat rules",
        "steps": [
          "Initialize combat presentation state from combat engine data",
          "Trigger card selection and verify preview state updates",
          "Play a card and verify animation and VFX requests are issued",
          "Resolve enemy turn and verify presentation updates correctly",
          "Verify combat engine state remains the source of truth"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "The upgraded card engine includes deterministic unit tests for multi-step effects, conditional logic, targeting, keyword-driven behavior, and visual-trigger hooks",
        "steps": [
          "Add tests for single-effect cards",
          "Add tests for multi-effect cards",
          "Add tests for conditional effect resolution",
          "Add tests for targeted card validation",
          "Add tests for visual-trigger or event-emission hooks where applicable",
          "Verify all card engine tests pass deterministically"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "The relic engine includes deterministic unit tests for passive, start-of-combat, and triggered relic effects",
        "steps": [
          "Add tests for passive relic state application",
          "Add tests for start-of-combat relic resolution",
          "Add tests for triggered relic behavior during combat",
          "Add tests for invalid or unsupported relic definitions",
          "Verify all relic engine tests pass deterministically"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Combat UI includes component-level tests for layout, card interaction states, tooltip rendering, relic display, and pile inspection",
        "steps": [
          "Render the combat screen in a test environment",
          "Verify player HUD, enemy area, hand, relic area, and piles are visible",
          "Verify playable and unplayable card states render differently",
          "Verify hover or focus states are applied correctly",
          "Verify keyword tooltip content renders for supported mechanics",
          "Verify relic tooltip and inspection views render correctly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Asset and fallback rendering paths include tests for missing card art, relic art, enemy art, icons, and background assets",
        "steps": [
          "Render a card with a valid art asset",
          "Render a card with a missing art asset",
          "Verify fallback art or placeholder rendering is used safely",
          "Repeat for relic, enemy, icon, and background assets",
          "Verify missing assets do not crash the screen"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Implementation agents append progress updates for the UI, card system, relic UI, art pipeline, and VFX milestone to progress.txt as tasks are completed",
        "steps": [
          "Complete a task in this milestone",
          "Open progress.txt",
          "Append a concise summary of the completed task",
          "Include the testing coverage added for that task",
          "Verify prior progress entries remain intact"
        ],
        "passes": true
      }
    ]
  }
}
{
  "milestone": {
    "name": "Combat UI Visual Direction and UX Foundation",
    "goal": "Create an original combat and run UI for Drawforge inspired by the readability, tactile card interactions, combat clarity, and visual hierarchy of Slay the Spire, while establishing a distinct visual identity, original asset system, and scalable presentation architecture.",
    "product_requirements": [
      "Combat information must be readable at a glance, including hand, energy, health, block, enemy intent, relics, statuses, and pile counts",
      "Cards must be the primary interaction surface and feel large, readable, responsive, and satisfying to interact with",
      "The UI must clearly communicate whose turn it is, what enemies intend to do, what a selected card will do, and what just happened after each action",
      "The screen must use strong visual hierarchy so the eye naturally prioritizes hand, selected card, target, resources, intent, relics, and secondary information",
      "The visual system must be original and must not copy exact layouts, iconography, frames, or assets from Slay the Spire"
    ],
    "success_criteria": [
      "A first-time player can identify current energy, health, block, enemy intent, and end-turn control in under 5 seconds",
      "A player can hover, inspect, select, target, and play cards without ambiguity",
      "Card text remains readable in hand, reward, and deck views",
      "Enemy intent is visually readable in under 1 second",
      "Relics, statuses, and previews are present without cluttering the main combat loop",
      "The UI remains playable and correct with animations and VFX disabled",
      "The visual system supports original card art, relic art, enemy art, backgrounds, icons, and rarity treatments"
    ],
    "tasks": [
      {
        "category": "functional",
        "description": "Create wireframes for the combat screen that define the original layout for enemy area, player HUD, hand, relic bar, piles, and turn controls",
        "steps": [
          "Create a low-fidelity combat screen wireframe",
          "Define regions for enemy area, player HUD, hand area, relic bar, piles, tooltips, and turn controls",
          "Review the wireframe against readability and hierarchy goals",
          "Verify the layout supports a hand size between 3 and 10 cards",
          "Verify the layout can later support multiple enemies",
          "Document the approved layout as the baseline combat composition"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a visual style guide for Drawforge that defines an original fantasy-tactical UI language inspired by modern deckbuilders",
        "steps": [
          "Define the primary color palette for backgrounds, panels, highlights, and combat states",
          "Define the typography palette for card titles, rules text, UI labels, and numbers",
          "Define spacing, border radius, panel, and framing rules",
          "Define card frame treatments by card type and rarity",
          "Define iconography rules for energy, block, statuses, intents, and piles",
          "Document all rules in a style guide artifact usable by design and engineering"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create an original card frame system that supports readability, type differentiation, rarity treatments, and art placement",
        "steps": [
          "Design a base card frame layout with regions for cost, name, art, type, and rules text",
          "Create frame variants for Attack, Skill, and any additional supported card types",
          "Create rarity treatments for common, uncommon, rare, and special cards",
          "Verify long card text remains readable within the frame",
          "Verify card frames remain distinct without copying another game's exact frame language",
          "Approve the frame system for implementation"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Build a reusable upgraded card component that implements the approved frame system and supports all primary card data",
        "steps": [
          "Render a card using the reusable component",
          "Display cost, name, art region, type, rarity, and rules text",
          "Render card state variants including default, hovered, selected, disabled, and exhausted where applicable",
          "Verify the component supports short and long effect text",
          "Verify the component works in hand, rewards, deck view, shop view, and library view",
          "Verify missing art falls back safely to placeholder rendering"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Implement an arced hand layout that presents cards as the primary interaction surface during combat",
        "steps": [
          "Render the player's hand in the approved hand layout",
          "Support a visually stable presentation from 3 to 10 cards",
          "Verify cards remain readable in dense hand states",
          "Verify card overlap preserves usability and hierarchy",
          "Verify the selected or hovered card can rise above neighbors cleanly",
          "Verify the hand layout is responsive across supported desktop resolutions"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Add card hover, focus, and inspection states that improve readability and reinforce tactile interaction",
        "steps": [
          "Hover over a card in hand",
          "Verify the hovered card raises, scales, or shifts into a more readable state",
          "Move focus between multiple cards",
          "Verify only one primary hover or focus state is active at a time",
          "Open an inspection state for detailed card reading if supported",
          "Verify the interaction improves clarity without obscuring nearby cards or controls"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Support click-to-select and drag-to-play card interactions with clear visual feedback",
        "steps": [
          "Start a player turn with playable cards in hand",
          "Select a card via click and verify it enters a pending state",
          "Drag a card toward a valid target area",
          "Verify the card play affordance becomes visually clear during drag",
          "Release on a valid target and verify the card resolves",
          "Cancel the interaction and verify the card returns to its original state cleanly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Support target highlighting and targeting previews for targeted cards",
        "steps": [
          "Select a targeted card",
          "Highlight valid targets in the enemy area",
          "Hover over a valid target",
          "Verify expected damage, status, or effect preview appears",
          "Attempt to target an invalid entity and verify the action is blocked",
          "Resolve the card and verify the preview disappears after completion"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a dedicated player HUD that clearly displays health, block, energy, statuses, and turn state",
        "steps": [
          "Enter combat and render the player HUD",
          "Display current health and maximum health",
          "Display current block and update it during combat",
          "Display current energy and update it during card play",
          "Display active statuses such as Charged or other future mechanics",
          "Verify the HUD remains readable and visually subordinate to the hand"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create an enemy presentation panel that displays enemy health, statuses, and intent in a readable and original format",
        "steps": [
          "Start combat with an enemy",
          "Render enemy art, health, statuses, and intent",
          "Display intent using icon, text, or hybrid treatment according to the style guide",
          "Display expected values such as attack damage where available",
          "Verify the enemy panel remains readable while a card is selected",
          "Verify intent updates correctly at turn transitions"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Implement enemy intent UI that communicates the next enemy action clearly and quickly",
        "steps": [
          "Start combat with an enemy that has a planned next action",
          "Render the enemy intent treatment",
          "Verify attack, defend, buff, debuff, and status intents can be represented",
          "Verify damage or magnitude values appear where applicable",
          "Advance the turn and verify the intent updates correctly",
          "Verify the intent remains legible in under one second of player attention"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Render draw pile, discard pile, and exhaust pile UI with counts and inspection states",
        "steps": [
          "Start combat and render all pile indicators",
          "Display current counts for draw, discard, and exhaust piles",
          "Open a pile inspection view",
          "Verify the cards shown match the underlying game state",
          "Move cards between piles during combat",
          "Verify counts and inspection contents update correctly"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a persistent relic bar and relic inspection UI that supports passive, triggered, and start-of-combat relic effects",
        "steps": [
          "Start a run with one or more relics",
          "Render relics in the relic bar during combat and run screens",
          "Hover or focus a relic to display its tooltip",
          "Display relic name, rarity, rules text, and trigger type",
          "Open a relic inspection screen that lists all acquired relics",
          "Verify relics remain readable without crowding core combat UI"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a keyword and glossary tooltip system for cards, relics, statuses, and intents",
        "steps": [
          "Render a card or relic containing supported keywords",
          "Hover or focus a keyword",
          "Verify a tooltip appears with the correct rules explanation",
          "Render multiple keywords in a single component",
          "Verify the tooltip system can be reused across combat, rewards, deck, and relic views",
          "Verify tooltip content is sourced from shared rules metadata"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Add card play previews for damage, block, energy, status application, and conditional bonuses",
        "steps": [
          "Select an attack card and hover a target",
          "Verify predicted damage is shown",
          "Select a block card and verify predicted block gain is shown",
          "Select a status card and verify status application preview is shown",
          "Select a card with conditional logic and verify the preview reflects the current state correctly",
          "Deselect the card and verify all previews are removed"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create turn controls and turn-state presentation that clearly communicates player turn, enemy turn, victory, defeat, and transition moments",
        "steps": [
          "Start a player turn and render the end-turn control",
          "Verify the control is prominent and readable",
          "End the turn and verify the enemy turn state is clearly shown",
          "Resolve combat and verify victory or defeat state presentation appears",
          "Verify turn-state messaging does not obstruct primary combat interactions",
          "Verify the turn-state system supports future transitions and boss introductions"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a combat feedback layer for damage, block gain, healing, draw, energy changes, status application, and relic triggers",
        "steps": [
          "Play an attack card and verify visible damage feedback appears",
          "Gain block and verify visible defense feedback appears",
          "Draw cards and verify draw feedback appears",
          "Gain or spend energy and verify resource feedback appears",
          "Apply a status or trigger a relic and verify the effect is communicated visually",
          "Verify feedback improves clarity without slowing combat excessively"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create advanced VFX support for card play, targeting, impacts, status application, relic activation, and victory or defeat moments",
        "steps": [
          "Play a card and trigger card-play VFX",
          "Target an enemy and trigger targeting VFX",
          "Deal damage and trigger hit VFX",
          "Gain block or healing and trigger defensive or restorative VFX",
          "Trigger a relic and verify relic activation VFX plays",
          "Resolve victory or defeat and verify end-of-combat VFX can play"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Ensure all animation and VFX systems are presentation-only and do not own combat rules or block deterministic state progression",
        "steps": [
          "Resolve a combat action with animations and VFX enabled",
          "Resolve the same combat action with animations and VFX disabled",
          "Verify gameplay state is identical in both scenarios",
          "Delay or skip a presentation event intentionally",
          "Verify combat logic remains correct and deterministic",
          "Document the separation between game engine state and presentation state"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a full art pipeline that supports cards, relics, enemies, icons, backgrounds, UI panels, and VFX-associated assets",
        "steps": [
          "Define asset categories and file naming conventions",
          "Define supported formats and asset loading rules",
          "Load card art, relic art, enemy art, icons, and background assets through a shared asset system",
          "Verify assets can be referenced from card, relic, enemy, and UI definitions",
          "Verify missing assets fall back to approved placeholder assets",
          "Verify asset failures do not crash gameplay surfaces"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create asset specs for cards, relics, enemies, statuses, intents, backgrounds, and panel art so content can be produced consistently",
        "steps": [
          "Define card art dimensions, safe areas, and frame overlap rules",
          "Define relic icon dimensions and readability constraints",
          "Define enemy art or portrait composition rules",
          "Define background composition and parallax-safe regions if supported",
          "Define status and intent icon specifications",
          "Publish the asset specification for use by artists and implementation agents"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Support theme-aware rendering for backgrounds, panels, card frames, and major combat surfaces",
        "steps": [
          "Render the baseline combat screen theme",
          "Apply a second theme or visual variant where supported",
          "Verify panels, frames, icons, and backgrounds remain visually coherent",
          "Verify the theme system does not reduce text readability",
          "Verify theme data can be configured without rewriting combat components",
          "Document the theme-aware rendering approach"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a combat presentation layer that coordinates layout state, selection state, preview state, animation state, and VFX state without owning rules logic",
        "steps": [
          "Initialize combat presentation state from game engine combat data",
          "Select a card and verify preview and targeting state update correctly",
          "Play a card and verify animation and VFX requests are issued",
          "Advance to enemy turn and verify presentation state updates correctly",
          "Resolve combat end and verify presentation transitions occur",
          "Verify the combat engine remains the source of truth for rules and outcomes"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create reward, deck, library, and shop card views that reuse the same visual language and upgraded card component",
        "steps": [
          "Open the reward screen and render cards using the shared card component",
          "Open the deck view and verify large deck counts remain usable",
          "Open a card library or collection view if supported",
          "Open the shop view and verify purchasable cards use the same styling rules",
          "Verify hover, tooltip, and inspection behavior remains consistent across all views",
          "Verify shared card rendering reduces duplication across the UI system"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Create a UI review checklist that measures whether the interface achieves the intended deckbuilder-inspired readability and tactile quality",
        "steps": [
          "Define review criteria for readability, hierarchy, clarity, responsiveness, originality, and feedback",
          "Run the checklist against the combat screen",
          "Run the checklist against the reward and deck screens",
          "Document gaps where the UI does not meet the target quality bar",
          "Create follow-up polish items from the review",
          "Store the checklist with the milestone documentation"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Add unit, component, and interaction tests that validate layout, card interaction states, enemy intent, tooltips, relic UI, asset fallback behavior, and presentation-state safety",
        "steps": [
          "Add component tests for combat layout regions and visibility",
          "Add interaction tests for hover, selection, drag, targeting, and cancel flows",
          "Add tests for enemy intent rendering and turn updates",
          "Add tests for tooltip rendering and glossary metadata",
          "Add tests for relic display and inspection behavior",
          "Add tests for missing assets and presentation-disabled scenarios"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Append progress updates for the Combat UI Visual Direction and UX Foundation milestone to progress.txt as tasks are completed",
        "steps": [
          "Complete a task in this milestone",
          "Open progress.txt",
          "Append a concise summary of the completed task",
          "Include the tests added for that task",
          "Verify prior progress entries remain intact",
          "Verify the new entry reflects the milestone name and current status"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Run the full automated test suite after each major phase change before claiming the phase is stable or complete",
        "steps": [
          "Identify that a major phase change or milestone slice has landed",
          "Run the full Jest suite",
          "Run lint",
          "Record any failures and fix them before calling the phase stable",
          "Append the verification result to progress.txt",
          "Verify the repo is green before moving to the next major phase"
        ],
        "passes": true
      },
      {
        "category": "functional",
        "description": "Add CI/CD so Drawforge automatically runs tests and lint on pushes and pull requests",
        "steps": [
          "Choose a CI provider and workflow layout for the repo",
          "Create an automated workflow that installs dependencies and runs the full Jest suite",
          "Run eslint in the same workflow",
          "Verify the workflow triggers on pushes and pull requests",
          "Document the CI expectations in the repo README or contributor docs",
          "Confirm the workflow is green on the default branch"
        ],
        "passes": true
      }
    ]
  }
}
