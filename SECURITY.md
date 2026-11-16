# Bhabhi Thulla — Security Policy & Hardening Specification

This document details the security architecture, anti-cheat mechanisms, card privacy guarantees, and vulnerability reporting procedures for **Bhabhi Thulla**.

---

## 🃏 Card Privacy Guarantee (Zero Opponent Hand Leakage)

Bhabhi Thulla enforces absolute card secrecy at the architecture level:
1. **Server-Authoritative Views**: The game server never transmits another player's private cards over the wire.
2. **View Selectors**: The `getPlayerView(gameState, playerId)` selector automatically masks all opponent hands, exposing solely their integer card count and public state:
   ```ts
   // Opponent representation in network payloads:
   {
     id: "player-2",
     nickname: "Bob",
     avatar: "avatar-2",
     cardCount: 13,
     hasEscaped: false
   }
   ```
3. **Automated Verification**: The test suite ([antiCheat.test.ts](file:///e:/Downloads/Projects/BhabhiThulla/apps/server/src/security/antiCheat.test.ts)) asserts that private cards are omitted from player views, public views, database activity logs, and error responses.

---

## 🔐 Cryptography & Identity Protection

1. **AES-256-GCM State Encryption**: Incremental match revisions stored in PostgreSQL are encrypted using authenticated AES-256-GCM with a 96-bit initialization vector (IV) and a 128-bit authentication tag. Tampered database rows are rejected automatically upon read.
2. **HMAC-SHA256 Session Reconnection**: Reconnection tokens are signed using HMAC-SHA256 and stored as hashes in the database. Attackers with read-only access to database dumps cannot forge session tokens or hijack active matches.
3. **Constant-Time Comparison**: Session validation uses `crypto.timingSafeEqual` to prevent timing attacks.

---

## 🛡️ Anti-Cheat & Game Integrity Enforcement

The server validates every action before state mutation:
- **Turn Order**: Rejects out-of-turn card submissions.
- **Card Ownership**: Rejects plays of cards not held in the player's hand.
- **Compulsory Following Suit**: Verifies that players hold no matching cards of the lead suit before permitting an off-suit play (preventing illegal reneging / revoking).
- **Ace of Spades Opening**: Enforces that the holder of ♠A leads it on the opening trick.
- **Paused Game State**: Rejects action submissions while a match is paused for player reconnection.
- **Duplicate Request Deduplication**: In-flight and replayed action IDs (`requestId`) are deduplicated idempotently.
- **Per-Room Mutex**: In-memory action queues serialize concurrent moves per room, preventing race conditions.

---

## 🌐 HTTP & Network Security

1. **Security Headers (Helmet)**:
   - `Content-Security-Policy`: Restricts resource loading to self and authorized WebSocket endpoints.
   - `X-Frame-Options: DENY`: Prevents clickjacking.
   - `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
   - `Referrer-Policy: strict-origin-when-cross-origin`: Protects referrer leakage.
2. **CORS & Origin Validation**: Cross-Origin Resource Sharing is locked to configured client origins (`CLIENT_ORIGIN`). Wildcards are disallowed in production.
3. **Rate Limiting**:
   - HTTP guest registration endpoint: max 20 registrations / minute per IP.
   - Socket.IO gameplay actions: sliding window rate-limiting per connection.
   - Emotes & quick chat: max 5 messages per 3 seconds.
4. **Payload Limiting**: Express JSON parser enforces a 64 KB maximum payload limit to mitigate body-flooding DoS attacks.
5. **Sanitized Error Handling**: Stack traces, SQL queries, and internal file paths are withheld in production responses.

---

## 📬 Reporting a Vulnerability

If you discover a security vulnerability in Bhabhi Thulla, please report it privately:
- **Email**: `security@bhabhithulla.example.com` (or create a private GitHub Security Advisory).
- **Response SLA**: Initial acknowledgement within 24 hours.

Please do not open public GitHub issues for security vulnerabilities.
