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
│           ├── protocol/       # WebSocket event contracts, payloads, and validations
│           └── utils/          # Validation and deck helpers
├── apps/
│   ├── web/                    # React 18, Vite, TypeScript, Tailwind CSS
│   │   └── src/
│   │       ├── animations/     # AnimationQueue & deterministic visual transitions
│   │       ├── audio/          # Procedural Web Audio API sound synthesizer
│   │       ├── context/        # MultiplayerContext, SettingsContext, ToastContext
│   │       ├── hooks/          # usePracticeGame, useGameAudio
│   │       ├── components/     # PlayingCard, CardHand, EmoteBar, EmoteOverlay, DealingOverlay, etc.
│   │       ├── views/          # MultiplayerGameView, PracticeGameView, HomeView, etc.
│   │       └── services/       # Socket.IO client, SoundService
│   └── server/                 # Express, Node.js, TypeScript backend
│       └── src/
│           ├── app.ts          # Express app, health checks (/api/health, /api/version)
│           ├── socket/         # Socket.IO handlers (room, gameplay, reactions, disconnect)
│           ├── rooms/          # RoomManager, Room, SessionStore
│           └── security/       # Rate limiting, payload validation (Zod)
├── e2e/                        # Playwright end-to-end browser tests
└── README.md
```

---

## 🎮 Game Modes

### 1. Online Real-Time Multiplayer
- **Private Rooms**: Create private rooms with custom player limits (3 to 6 players, defaulting to 4).
- **Invitation Links & Codes**: Join seamlessly via 6-character room codes (`ROOM_CODE_REGEX = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/`) or direct invitation links.
- **Strict Privacy**: Server only transmits private hands to their verified owners; opponents receive card counts and card backs.
- **Graceful Reconnection**: Disconnects trigger a 120-second match pause. Reconnecting players restore their exact seat, hand, and turn state using secure session tokens.
- **Rematch Voting**: Synchronized rematch voting enables back-to-back matches without leaving the room.

### 2. Offline Practice Mode (vs Bots)
- Fully functional offline play against rule-abiding computer opponents.
- Fair AI that only inspects its legal moves and public table state.
- Interactive bot reactions: Bots celebrate Thullas, mourn penalty collections, and applaud escapes!

---

## ✨ Phase 4: Premium Experience & Polish

### 🎨 Visual Effects & Animation Subsystem
- **Deterministic Animation Queue**: Visual transitions (`AnimationQueue`) decoupled from authoritative engine results. Stale animations are discarded automatically on server updates.
- **Card Dealing Sequence**: Realistic clockwise deal with shuffle flutter sound and skippable prompt.
- **Dramatic Thulla Alert**: Highlighting the off-suit play, marking the highest lead card, bouncing "THULLA!" overlay, and animating pile collection.
- **Trick Resolution & Discard**: Clear winner indicator and smooth card sweep into discard pile.
- **Celebration & Defeat**: "Escaped #X" rank badge upon safe exit; "BHABHI MIL GAYI!" crown screen on match finish.

### 🔊 Procedural Web Audio API Sound System
Synthesized in real-time with zero external audio assets:
- Card Select (subtle high-pitch click)
- Card Play (tactile felt thump)
- Card Deal (rapid card slide)
- Shuffle Flutter (multi-frequency flutter)
- Trick Sweep (whoosh)
- **Thulla Impact** (brass strike + sub-bass punch)
- Pile Collect (ascending scoop)
- Player Escape (triumphant 4-tone arpeggio)
- Bhabhi Finish (playful minor trombone sting)
- Player Joined, Button Click, Rematch Chime, Emote Pop

### 💬 Live Emotes & Quick Chat
- **Real-time Reactions**: 8 animated emojis (`😂`, `😎`, `😱`, `😭`, `👏`, `💀`, `🔥`, `❤️`).
- **Quick Chat Messages**: 8 pre-scripted phrases ("THULLA!", "Nice move!", "You're next!", "Good game!", "Let's go!", "Oops!", "Play faster!", "Rematch?").
- Rate-limited sliding window (5 per 3 seconds in production) and mute settings.

### 🃏 Large Hand Adaptive Support
When penalty Thulla piles grow hands to 20–30+ cards:
- Dynamic overlap spacing (`-space-x-8 sm:-space-x-12 md:-space-x-14`).
- Horizontal smooth scrolling with dedicated Chevron buttons.
- Drag-and-drop and double-click to play directly into the trick pile.

### 📱 Responsive & Accessible Design
- Optimized for mobile portrait (375px+), mobile landscape, tablet, and desktop viewports.
- Touch-friendly 44px+ hitboxes and safe-area insets.
- WCAG AA contrast compliance and `reduced-motion` support.

---

## 🛡️ Phase 5: Reliability, Persistence, Statistics & Anti-Cheat

### 🗄️ Relational Database Architecture (PostgreSQL + Drizzle ORM)
Fully persistent, crash-recoverable game state and player history backed by PostgreSQL and managed with Drizzle ORM:
- **9 Relational Tables**:
  - `guest_identities`: Persistent guest profiles, nicknames, and avatar preferences.
  - `guest_sessions`: HMAC-hashed reconnect tokens and 30-day session expiry.
  - `game_rooms`: Private room configurations, player caps, and statuses.
  - `room_players`: Player seat indices, ready statuses, and room membership.
  - `game_matches`: Authoritative match records, start/finish timestamps, total tricks, and Bhabhi player outcomes.
  - `match_snapshots`: Incremental match revisions stored with authenticated **AES-256-GCM** encryption.
  - `match_player_results`: Finalized match records per player (escapes, ranks, cards remaining, penalties).
  - `player_statistics`: Authoritative lifetime metrics (games, escapes, Bhabhi counts, Thullas given, piles collected, cards collected, rates).
  - `match_activities`: Audit log of in-game actions for auditing and anti-cheat verification.
- **Zero-Config In-Memory Database Fallback**: Built-in hermetic `pg-mem` engine automatically runs in CI and development environments when a live PostgreSQL instance is not connected.

### 🔐 Cryptographic State Encryption & Anti-Cheat
- **AES-256-GCM State Encryption**: Every match revision is encrypted with an initialization vector (IV) and authentication tag (`AES-256-GCM`). Tampered database states are rejected automatically.
- **HMAC-SHA256 Session Verification**: Cryptographically signed reconnect tokens survive backend restarts and server migrations without exposing sensitive credentials.
- **Per-Room Action Serialization**: In-memory action mutex serializes player moves per room, preventing race conditions, double-submissions, and simultaneous card plays.
- **Strict Anti-Cheat Enforcement**:
  - Turn order validation (rejects out-of-turn plays).
  - Card ownership validation (rejects cards not in the player's hand).
  - Compulsory suit following validation (detects and blocks illegal reneging / revoking).
  - State invariance check (strictly enforces the 52-card conservation invariant at all times).
  - Zero Opponent Hand Leakage: Server-side views strip all private cards from network packets, DB logs, and public state broadcasts.

### 🔄 Crash Recovery & Seamless Reconnection
- **Server Restart Recovery**: On startup, `recoverActiveRoomsFromDatabase()` reconstructs all in-progress matches, private hands, seat positions, and incomplete tricks directly from the latest snapshot into a paused state without redealing or reshuffling cards.
- **120-Second Reconnection Grace Period**: Disconnected players can refresh their browser or switch networks, automatically rejoining their active match and receiving their private hand.

### 📊 Player Statistics, Match History & Room Standings
- **Statistics Dashboard (`/stats`)**: Lifetime profile overview, 6 KPI cards (Games Played, Escapes, Bhabhi Count, Thullas Given, Piles Collected, Cards Collected), escape rate %, Bhabhi rate %, and paginated recent match history.
- **Private Room Standings**: In-room leaderboard modal ranking friends by escape rate and games played directly from the Lobby or End-of-Match dialog.
- **Rematch Voting**: Synchronized rematch tallying and instant clean redeal without room recreation.

---

## 🚀 Phase 6: Production Readiness, Security Hardening, Cloud Deployment & CI/CD

### 🌐 Cloud Deployment Architecture
- **Frontend**: Configured for continuous deployment on **Vercel** with client-side SPA routing rewrites, immutable static asset caching, and security headers ([vercel.json](file:///e:/Downloads/Projects/BhabhiThulla/vercel.json)).
- **Backend**: Configured for high-reliability hosting on **Render** (or compatible persistent Node.js platforms) with `0.0.0.0` binding, `trust proxy` configuration, and graceful SIGTERM/SIGINT shutdown handling.
- **Database**: Managed PostgreSQL integration with SSL support, connection pool tuning, and automated deployment migrations ([migrate.ts](file:///e:/Downloads/Projects/BhabhiThulla/apps/server/src/db/migrate.ts)).
- **Comprehensive Documentation**:
  - [DEPLOYMENT.md](file:///e:/Downloads/Projects/BhabhiThulla/DEPLOYMENT.md): Step-by-step cloud hosting instructions for Vercel, Render, and Managed PostgreSQL.
  - [OPERATIONS.md](file:///e:/Downloads/Projects/BhabhiThulla/OPERATIONS.md): Operational monitoring, backup and restore procedures, and rollback plans.
  - [SECURITY.md](file:///e:/Downloads/Projects/BhabhiThulla/SECURITY.md): Anti-cheat specifications, card privacy guarantees, and vulnerability reporting.

### 🔒 Security Hardening & Observability
- **Helmet Security Middleware**: Content Security Policy (CSP), anti-clickjacking frameguards, strict MIME sniffing protection (`nosniff`), and request body limits (64 KB).
- **Endpoint Health Checks**: Standard `/health` (liveness) and `/ready` (dependency readiness) endpoints with latency telemetry.
- **Startup Environment Validation**: Strict Zod-based configuration parsing preventing insecure default keys from running in production.
- **Automated CI/CD**: Ready-to-use GitHub Actions workflow ([ci.yml](file:///e:/Downloads/Projects/BhabhiThulla/deploy/workflows/ci.yml)) testing lint, strict typechecks, unit tests, E2E browser tests, and production builds on every push and pull request.

---

## 📱 Phase 7: Android Application, Cross-Platform Multiplayer & Native Mobile Experience

### 🤖 Capacitor Android Architecture
- **Single Monorepo Source of Truth**: The Android application is generated via **Capacitor 8.6.2** in `apps/web/android/`, sharing the identical React UI, TypeScript game engine, and networking layer with the web client.
- **Cross-Platform Multiplayer**: Android and web browser players play together in the same private rooms using the authoritative Node.js + Socket.IO backend and Supabase PostgreSQL.
- **Client Security Guarantee**: The Android app contains zero database credentials, service-role keys, or `DATABASE_URL` strings; all operations route via authenticated HTTPS and WSS connections.
- **Native Mobile Features**:
  - **Haptic Vibration Feedback**: Subtle tactile pulses on card selection, card play, turn changes, Thulla events, and victory/defeat ([haptics.ts](file:///e:/Downloads/Projects/BhabhiThulla/apps/web/src/platform/haptics.ts)).
  - **Android Hardware Back-Button Handling**: Multi-level priority back handler intercepting in-game quits with confirmation dialogs and closing modals before returning home ([lifecycle.ts](file:///e:/Downloads/Projects/BhabhiThulla/apps/web/src/platform/lifecycle.ts)).
  - **App Lifecycle Recovery**: Restores Socket.IO connections and resynchronizes game state on app resume from sleep or background.
  - **Native Room Sharing**: System share sheet for room invitations with seamless clipboard fallback ([sharing.ts](file:///e:/Downloads/Projects/BhabhiThulla/apps/web/src/platform/sharing.ts)).
  - **Offline Play vs Bots**: Practice mode is 100% self-contained locally with zero server or internet dependencies.
- **Complete Android Guides**:
  - [ANDROID_SETUP.md](file:///e:/Downloads/Projects/BhabhiThulla/ANDROID_SETUP.md): Beginner-friendly Windows setup for JDK 17/21, Android Studio, and SDK configuration.
  - [ANDROID_BUILD.md](file:///e:/Downloads/Projects/BhabhiThulla/ANDROID_BUILD.md): Step-by-step instructions for building Debug APKs, signed Release APKs, and Google Play Android App Bundles (AAB).

---

## 🛠️ Development & Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite frontend web server at `http://localhost:5173` |
| `npm run dev:all` | Concurrently runs backend server (`:3001`) and frontend (`:5173`) |
| `npm run build` | Compiles `@bhabhi/shared`, `@bhabhi/server`, and `@bhabhi/web` |
| `npm run typecheck` | Validates strict TypeScript types across all workspaces |
| `npm run lint` | Runs ESLint across all packages and apps (0 warnings, 0 errors) |
| `npm test` | Runs all 153 unit, integration, and platform tests |
| `npm run test:e2e` | Runs Playwright browser tests across Desktop and Mobile viewports |
| `npm run android:sync` | Compiles web assets and synchronizes the native Android project |
| `npm run android:open` | Opens the native Android project in Android Studio |
| `npm run db:generate` | Generates Drizzle database migrations |
| `npm run db:migrate` | Runs Drizzle migrations against the configured Supabase PostgreSQL database |

---

## 📦 Phase Status & Roadmap

- [x] **Phase 1: Project Foundation & UI Design System**
- [x] **Phase 2: Complete Game Engine & Playable Practice Mode**
- [x] **Phase 3: Real-Time Online Multiplayer & Private Rooms**
- [x] **Phase 4: Premium Gameplay Experience, Animations, Audio & Emotes**
- [x] **Phase 5: Multiplayer Reliability, Persistent Storage, Player Statistics & Recovery**
- [x] **Phase 6: Production Readiness, Security Hardening, Cloud Deployment & CI/CD**
- [x] **Phase 7: Android Application, Cross-Platform Multiplayer, Native Mobile Experience & APK Release**

---

## 📄 License
MIT
