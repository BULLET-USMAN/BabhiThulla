CREATE TABLE "game_matches" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"room_id" varchar(64) NOT NULL,
	"room_code" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"bhabhi_player_id" varchar(64),
	"total_tricks" integer DEFAULT 0 NOT NULL,
	"final_revision" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_rooms" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"room_code" varchar(10) NOT NULL,
	"host_player_id" varchar(64) NOT NULL,
	"max_players" integer DEFAULT 4 NOT NULL,
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_identities" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(50) NOT NULL,
	"avatar_id" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"guest_identity_id" varchar(64) NOT NULL,
	"credential_hash" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "match_activities" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"match_id" varchar(64) NOT NULL,
	"revision" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"public_payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_player_results" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"match_id" varchar(64) NOT NULL,
	"guest_identity_id" varchar(64) NOT NULL,
	"nickname" varchar(50) NOT NULL,
	"avatar" varchar(30) NOT NULL,
	"was_bhabhi" boolean DEFAULT false NOT NULL,
	"escaped" boolean DEFAULT false NOT NULL,
	"escape_order" integer,
	"final_card_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_snapshots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"match_id" varchar(64) NOT NULL,
	"revision" integer NOT NULL,
	"encrypted_state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_statistics" (
	"guest_identity_id" varchar(64) PRIMARY KEY NOT NULL,
	"total_games" integer DEFAULT 0 NOT NULL,
	"total_escapes" integer DEFAULT 0 NOT NULL,
	"total_bhabhi_results" integer DEFAULT 0 NOT NULL,
	"total_thullas_given" integer DEFAULT 0 NOT NULL,
	"total_piles_collected" integer DEFAULT 0 NOT NULL,
	"total_cards_collected" integer DEFAULT 0 NOT NULL,
	"total_tricks_played" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_players" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"room_id" varchar(64) NOT NULL,
	"guest_identity_id" varchar(64) NOT NULL,
	"seat_index" integer NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "game_matches" ADD CONSTRAINT "game_matches_room_id_game_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."game_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_guest_identity_id_guest_identities_id_fk" FOREIGN KEY ("guest_identity_id") REFERENCES "public"."guest_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_activities" ADD CONSTRAINT "match_activities_match_id_game_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."game_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_results" ADD CONSTRAINT "match_player_results_match_id_game_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."game_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_results" ADD CONSTRAINT "match_player_results_guest_identity_id_guest_identities_id_fk" FOREIGN KEY ("guest_identity_id") REFERENCES "public"."guest_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_snapshots" ADD CONSTRAINT "match_snapshots_match_id_game_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."game_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_statistics" ADD CONSTRAINT "player_statistics_guest_identity_id_guest_identities_id_fk" FOREIGN KEY ("guest_identity_id") REFERENCES "public"."guest_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_id_game_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."game_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_guest_identity_id_guest_identities_id_fk" FOREIGN KEY ("guest_identity_id") REFERENCES "public"."guest_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_matches_room" ON "game_matches" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_game_matches_status" ON "game_matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_game_matches_room_code" ON "game_matches" USING btree ("room_code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_game_rooms_code" ON "game_rooms" USING btree ("room_code");--> statement-breakpoint
CREATE INDEX "idx_game_rooms_status" ON "game_rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_guest_sessions_guest" ON "guest_sessions" USING btree ("guest_identity_id");--> statement-breakpoint
CREATE INDEX "idx_guest_sessions_hash" ON "guest_sessions" USING btree ("credential_hash");--> statement-breakpoint
CREATE INDEX "idx_match_activities_match" ON "match_activities" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_match_player_results_match" ON "match_player_results" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_match_player_results_guest" ON "match_player_results" USING btree ("guest_identity_id");--> statement-breakpoint
CREATE INDEX "idx_match_snapshots_match_rev" ON "match_snapshots" USING btree ("match_id","revision");--> statement-breakpoint
CREATE INDEX "idx_room_players_room" ON "room_players" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_room_players_guest" ON "room_players" USING btree ("guest_identity_id");