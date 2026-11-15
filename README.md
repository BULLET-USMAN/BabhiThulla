# Bhabhi Thulla (भाभी थुल्ला / بھابھی تھلّا)

A modern, responsive, server-authoritative online multiplayer card game based on the traditional Pakistani and South Asian card game **Bhabhi Thulla**.

---

## 🃏 Traditional Rules Summary

Bhabhi Thulla is a fast-paced trick-avoidance card game played with a standard 52-card deck (no jokers) for **3 to 6 players** (defaulting to 4).

1. **The Objective**: Empty your hand of all cards. The last remaining player with cards in hand loses and is crowned the **BHABHI**!
2. **Dealing**: All 52 cards are dealt clockwise.
   - 3 players: 18, 17, 17 cards
   - 4 players: 13, 13, 13, 13 cards
   - 5 players: 11, 11, 10, 10, 10 cards
   - 6 players: 9, 9, 9, 9, 8, 8 cards
3. **The Opening Trick**: The player holding the **Ace of Spades (♠A)** must lead it on the first trick.
4. **Following Suit**: Play proceeds clockwise. The first card sets the leading suit. If you hold a card of the leading suit, you **must follow suit**. You may choose freely among your matching cards.
5. **Giving a "Thulla"**: If you have no cards of the leading suit, you may play any card from another suit. This off-suit play is called giving a **Thulla**!
   - A Thulla immediately halts the trick. Players yet to play are skipped.
   - The player who played the highest card of the original leading suit must **collect all cards in the trick pile** (including the Thulla card) into their hand.
   - That collecting player leads the next trick.
   - Note: An off-suit Thulla card never outranks a leading-suit card.
6. **Clean Tricks**: If all active players follow suit without a Thulla, the trick is clean and the cards are permanently discarded to the dead pile. The player with the highest leading-suit card leads the next trick.
7. **Escaping**: Players who empty their hands escape safely from the match, **provided they are not required to collect a Thulla pile on that trick**. Escaped players take no further turns.
   - If a clean trick winner emptied their hand, the lead passes clockwise to the next active player.
8. **Bhabhi Determination**: When exactly one player remains holding cards, that player is declared **Bhabhi**!
   - Tie-break rule: If all remaining active players simultaneously empty their hands in the final clean trick, the player who played the highest card of the leading suit is declared Bhabhi.

---

## 🏗️ Monorepo Architecture

```
BhabhiThulla/
├── packages/
│   └── shared/                 # Pure TypeScript (Zero UI/Network dependencies)
│       └── src/
│           ├── game/           # Authoritative Bhabhi Thulla Game Engine
│           │   ├── types.ts           # GameState, PlayerGameView, TrickResult, GameAction
│           │   ├── cards.ts           # 52-card builder, rank comparisons, hand sorting
│           │   ├── shuffle.ts         # Crypto RNG & deterministic Mulberry32 seeded RNG
│           │   ├── deal.ts            # Clockwise 3-6 player card distribution
│           │   ├── legalMoves.ts      # Strict suit following & Ace of Spades opening
│           │   ├── trickResolver.ts   # Thulla detection, pile collection & clean discards
│           │   ├── turnManager.ts     # Clockwise turn rotation & skipping escaped players
│           │   ├── invariants.ts      # Conservation validator (always 52 cards total)
│           │   ├── gameEngine.ts      # Pure state transition machine (stepGame, createGame)
│           │   ├── selectors.ts       # getPlayerView (strict opponent card masking)
│           │   ├── botStrategy.ts     # Offline AI decision maker
│           │   └── simulation.test.ts # 1,000 automated end-to-end match simulations
│           ├── models/         # Card, Suit, Rank, PlayerProfile, RoomConfig
│           └── utils/          # Validation and deck helpers
├── apps/
│   ├── web/                    # React 18, Vite, TypeScript, Tailwind CSS
│   │   └── src/
│   │       ├── hooks/          # usePracticeGame (turn scheduler & event coordinator)
│   │       ├── components/     # PlayingCard, CardHand, ResultModal, EventLogDrawer, etc.
│   │       ├── views/          # PracticeGameView, GameTablePreviewView, HomeView, etc.
│   │       └── services/       # Web Audio API sound synthesizer
│   └── server/                 # Express, Node.js, TypeScript backend
│       └── src/
│           ├── app.ts          # Express app, health checks (/api/health, /api/version)
│           └── index.ts        # Graceful shutdown & lifecycle management
├── e2e/                        # Playwright end-to-end browser tests
└── README.md
```

---

## 🤖 Playable Practice Mode (vs Bots)

Phase 2 introduces a completely playable, offline **Play vs Bots** mode directly from the home screen:
- **Player Counts**: Choose from 3, 4, 5, or 6 players (1 human + 2 to 5 bots).
- **Authoritative Engine**: Driven entirely by the pure TypeScript game engine.
- **Fair Bot AI**: Bots inspect only their own legal moves and public table cards—they **never** peek at other players' private hands.
- **Visual Feedback**:
  - Valid playable cards are highlighted with a gold elevation ring; illegal cards are dimmed with tooltips explaining why they cannot be played.
  - Animated Thulla banner notifying who gave Thulla and who collects the pile.
  - Interactive activity panel tracking every card play, Thulla, and escape.
  - Fun end-game modal ("BHABHI MIL GAYI!") displaying the finishing order and rematch button.

---

## 🛠️ Development & Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite frontend web server at `http://localhost:5173` |
| `npm run dev:all` | Concurrently runs both the backend server (`:3001`) and frontend (`:5173`) |
| `npm run build` | Compiles `@bhabhi/shared`, `@bhabhi/server`, and `@bhabhi/web` |
| `npm run typecheck` | Validates strict TypeScript types across all workspaces |
| `npm run lint` | Runs ESLint across all packages and apps |
| `npm test` | Runs all 71 Vitest tests (including 1,000 automated game simulations) |
| `npm run test:e2e` | Runs Playwright browser tests across Desktop and Mobile viewports |

---

## 📦 Phase Status & Roadmap

### ✅ Phase 1: Foundation & UI Design System
- Monorepo workspace initialization (`apps/web`, `apps/server`, `packages/shared`).
- Standard 52-card SVG component system, emerald felt table geometry, and responsive views.
- Local guest profile persistence (nickname and 8 avatars).

### ✅ Phase 2: Game Engine & Playable Practice Mode (Completed)
- [x] Pure TypeScript Bhabhi Thulla game engine in `packages/shared/src/game/`.
- [x] Cryptographically secure shuffling (`crypto.getRandomValues`) and deterministic seeded PRNG for testing.
- [x] Clockwise dealing for 3, 4, 5, and 6 players.
- [x] Ace of Spades opening rule enforcement.
- [x] Strict suit-following validation (`getLegalMoves`, `isLegalMove`).
- [x] Automatic Thulla detection and pile collection by highest leading-suit card.
- [x] Clean trick resolution and discard pile management.
- [x] Player escape detection, skipping escaped seats, and Bhabhi declaration.
- [x] 52-card conservation invariant checks after every state transition.
- [x] **1,000 automated match simulations** across 3–6 player counts with 100% termination and 0 violations.
- [x] Fully playable offline practice mode (`/practice`) with bot turn scheduler and Thulla alerts.
- [x] End-game modal ("BHABHI MIL GAYI!") with finishing rankings and instant rematch.

### ⏳ Phase 3: Server-Authoritative Online Multiplayer (Upcoming)
- Socket.IO multiplayer rooms and 6-character room codes.
- WebSocket message contracts and state synchronization.
- Server-authoritative card dealing with hidden hands masked from clients.
- Session recovery tokens for seamless reconnection upon browser refresh.

---

## 📄 License
MIT
