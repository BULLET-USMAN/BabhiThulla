# Bhabhi Thulla (भाभी थुल्ला / بھابھی تھلّا)

A modern, responsive, server-authoritative online multiplayer card game based on the traditional Pakistani and South Asian card game **Bhabhi Thulla**.

---

## 🃏 About the Game

Bhabhi Thulla is a fast-paced trick-avoidance card game played with a standard 52-card deck (no jokers) for **3 to 6 players** (defaulting to 4).

### Key Rules Summary:
1. **The Objective**: Empty your hand of all cards. The last remaining player with cards in hand loses and is crowned the **Bhabhi**!
2. **Opening Trick**: The player holding the **Ace of Spades (♠A)** must lead it on the first trick.
3. **Following Suit**: Players take clockwise turns. If you hold a card of the leading suit, you **must** follow suit.
4. **Giving a "Thulla"**: If you have no cards of the leading suit, you may play any card from another suit. This is giving a **Thulla**!
   - A Thulla immediately halts the trick.
   - The player who played the highest card of the original leading suit must **collect all cards in the trick pile** and add them to their hand.
   - That player then leads the next trick.
5. **Clean Tricks**: If all active players follow suit without a Thulla, the trick is clean and the cards are permanently discarded to the dead pile. The player with the highest leading-suit card leads the next trick.
6. **Escaping**: Players who empty their hands are safely eliminated from the round (unless they are required to collect a Thulla pile on that trick).

---

## 🏗️ Project Architecture & Monorepo Structure

Built as an npm workspaces monorepo:

```
BhabhiThulla/
├── apps/
│   ├── web/                    # React 18, Vite, TypeScript, Tailwind CSS
│   │   ├── src/
│   │   │   ├── components/     # PlayingCard, CardHand, Modal, Buttons, Badges, etc.
│   │   │   ├── context/        # SettingsContext (local persistence), ToastContext
│   │   │   ├── services/       # Web Audio API sound synthesizer
│   │   │   └── views/          # Home, CreateRoom, JoinRoom, Lobby, GameTable, HowToPlay, Settings
│   └── server/                 # Express, Node.js, TypeScript backend
│       └── src/
│           ├── app.ts          # Express app, health checks (/api/health, /api/version), CORS
│           ├── config/         # Environment variables & runtime ports
│           └── index.ts        # Graceful shutdown & lifecycle management
├── packages/
│   └── shared/                 # Pure TypeScript (Zero UI/Network dependencies)
│       └── src/
│           ├── models/         # Card, Suit, Rank, PlayerProfile, RoomConfig
│           ├── utils/          # Standard deck generator, nickname & room code validators
│           └── constants/      # Game limits, default room settings
├── e2e/                        # Playwright end-to-end smoke tests
├── package.json                # Workspaces root orchestrator
└── README.md
```

---

## 🎨 Design System

Custom card room aesthetics designed for luxury and clarity:
- **Background**: Near-black charcoal (`#0B0E14`) with subtle suit watermarks.
- **Table**: Emerald green felt surface (`#0E3826`) with radial depth, texture vignette, and gold trim.
- **Typography**: Cinzel / Playfair serif for titles, Inter for high-legibility cards and stats.
- **Accents**: Warm restrained gold (`#D4AF37`) and subtle ruby red (`#8B1E1E`).
- **Sound**: Built-in Web Audio API synthesizer for tactile card slaps, trick collections, and Thulla alerts without external asset dependencies.
- **Accessibility**: ARIA attributes on all cards, full keyboard navigation, and reduced-motion toggle.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+ (tested on npm v11)

### Installation
```bash
# Clone the repository
git clone https://github.com/BULLET-USMAN/BabhiThulla.git
cd BabhiThulla

# Install monorepo dependencies across all workspaces
npm install
```

### Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

---

## 🛠️ Development & Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite frontend web server at `http://localhost:5173` |
| `npm run dev:all` | Concurrently runs both the backend server (`:3001`) and frontend (`:5173`) |
| `npm run build` | Builds `@bhabhi/shared`, `@bhabhi/server`, and `@bhabhi/web` |
| `npm run typecheck` | Validates TypeScript types across the entire codebase |
| `npm run lint` | Runs ESLint across all packages and apps |
| `npm test` | Runs all Vitest unit and component tests |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests |

---

## 📦 Phase Status & Roadmap

### ✅ Phase 1: Foundation & UI Design System (Completed)
- [x] Monorepo workspace initialization (`apps/web`, `apps/server`, `packages/shared`).
- [x] Comprehensive `@bhabhi/shared` models (cards, suits, ranks, validation, guest settings).
- [x] Node.js Express server foundation with `/api/health` and graceful termination.
- [x] Complete 52-card SVG component system with face-up, face-down, selected, and highlighted states.
- [x] Interactive Game Table Preview with dark green felt oval, responsive player hand, trick pile, and dynamic 3P/4P/5P/6P opponent geometries.
- [x] Guest profile management with local persistence (nickname, avatar selection).
- [x] Create Room and Join Room flows with format validation.
- [x] Waiting Lobby preview with 1-click room code copying, invite link sharing, and ready checks.
- [x] Comprehensive "How to Play" rulebook with an illustrated Thulla walkthrough.
- [x] Local settings with sound effects toggle, card sizing, and reduced-motion toggle.
- [x] Unit, component, and smoke test suites across Vitest and Playwright.

### ⏳ Phase 2: Server-Authoritative Game Engine & Socket.IO Multiplayer (Upcoming)
- Real-time room management and 6-character room code routing.
- Authoritative card shuffling and dealing (private hands scrubbed from opponents).
- Strict turn enforcement, Ace of Spades opening verification, and legal move validation.
- Thulla detection, pile collection, player elimination, and Bhabhi determination.
- Session tokens with seamless reconnection recovery for refreshed browsers.

---

## 📄 License
MIT
