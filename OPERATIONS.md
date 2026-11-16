# Bhabhi Thulla — Production Operations & Reliability Manual

This manual documents operational maintenance, monitoring, backup procedures, disaster recovery, incident response, and horizontal scaling for the **Bhabhi Thulla** platform.

---

## 🩺 Observability & Health Monitoring

### Endpoints
- **Process Liveness**: `GET /health` (or `GET /api/health`)
  - HTTP 200: Node.js process is active, responding to event loop ticks.
- **Dependency Readiness**: `GET /ready` (or `GET /api/ready`)
  - HTTP 200: PostgreSQL pool is connected, latency is healthy, returns active room counts and player counts.
  - HTTP 503: Database pool connection failed or pending.
- **Platform Version**: `GET /api/version`
  - Returns release phase, semantic version, and feature capabilities.

### Structured Logging
Logs are structured with JSON or formatted timestamps, containing `roomCode`, `matchId`, `revision`, and `requestId`:
```json
{
  "timestamp": "2026-11-16T12:00:00.000Z",
  "level": "INFO",
  "message": "Card played in room",
  "context": {
    "roomCode": "XYW2QL",
    "playerId": "p-1",
    "cardId": "spades-A",
    "turn": 1,
    "isThulla": false
  }
}
```
*Note: Under no circumstances are private hands, encryption keys, or authentication tokens emitted to server logs.*

---

## 💾 Database Backup Strategy

### Backup Frequency & Retention
- **Automated Hourly Snapshots**: Configured in cloud provider (Neon / Render / Supabase).
- **Daily Full Logical Backups**: Retained for 30 days in off-site encrypted storage (e.g. AWS S3 or Cloudflare R2).
- **Weekly Archive Backups**: Retained for 90 days.

### Manual Backup Procedure (`pg_dump`)
Run the following script to create a compressed, custom-format database backup:
```bash
# Export schema and data with custom compression format
pg_dump -Fc --no-owner --no-privileges \
  "$DATABASE_URL" > "bhabhi_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Encryption Key Stability Requirement
Match snapshots stored in `match_snapshots` are encrypted with AES-256-GCM using `GAME_STATE_ENCRYPTION_KEY`.
> [!IMPORTANT]
> When restoring a database backup, the application **must** use the identical `GAME_STATE_ENCRYPTION_KEY` that was active when the snapshots were created. If keys are rotated without re-encrypting historical snapshots, historical matches will fail authentication integrity checks.

---

## 🔄 Disaster Recovery & Restoration

### Restoration Procedure
1. Create or select a clean target PostgreSQL database.
2. Restore the database using `pg_restore`:
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges \
     -d "$TARGET_DATABASE_URL" "bhabhi_backup_YYYYMMDD_HHMMSS.dump"
   ```
3. Run verification queries to ensure database integrity:
   ```sql
   SELECT COUNT(*) FROM guest_identities;
   SELECT COUNT(*) FROM game_matches;
   SELECT COUNT(*) FROM player_statistics;
   ```
4. Start a staging backend instance with the restored database and run the health check:
   ```bash
   curl http://localhost:3001/ready
   ```

---

## 🔙 Deployment Rollback Procedures

### Frontend Rollback (Vercel)
1. Open the Vercel Project Dashboard.
2. Navigate to the **Deployments** tab.
3. Select the previous stable deployment and click **Promote to Production** (instant zero-downtime rollback).

### Backend Rollback (Render)
1. In the Render Dashboard, navigate to the `bhabhi-thulla-server` service.
2. Select **Events / Deploys**.
3. Choose the last known good commit and select **Rollback to this version**.

### Database Schema Migration Rollback
1. All Drizzle ORM migrations are designed to be additive and backward-compatible.
2. In the rare event of a required rollback, assess affected tables. Never execute `DROP TABLE` or `TRUNCATE` against production without verified backups and operator approval.

---

## 📈 Horizontal Scaling Considerations

The default production architecture utilizes a single persistent Node.js/Socket.IO instance, supporting hundreds of concurrent active players. When scaling beyond 1,000+ concurrent players across multiple server nodes:
1. **Redis Socket.IO Adapter**: Deploy `@socket.io/redis-adapter` to broadcast room events across cluster nodes.
2. **Sticky Sessions**: Configure load balancer (e.g., AWS ALB, Nginx, or Cloudflare) with sticky session cookies (`io` cookie) to ensure long-lived WebSocket handshakes persist on the same node.
3. **Distributed Action Mutex**: Replace the in-process per-room mutex (`actionQueue.ts`) with a distributed Redis lock (e.g., Redlock) to serialize card actions across nodes.
