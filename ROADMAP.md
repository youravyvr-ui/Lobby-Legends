# Lobby Legends 2.0 — implementation plan and status

_Written after auditing the existing codebase. Nothing here is claimed as
working unless it has been run._

---

## Phase 1 — Audit (done)

### What works and is worth keeping

| Area | Verdict |
| --- | --- |
| Design system (`css/base.css`, `css/components.css`) | Solid: dark tokens, themes, accents, accessibility classes, wheel, bracket, chat and modal primitives. Keep. |
| Router + shell (`js/app.js`) | Hash router, delegated `data-act` registry, per-screen timers, error screen. Keep — it is a good fit for a Realtime app. |
| Bracket maths (`js/core/utils.js`) | `buildRounds` / `propagate` / `setResult` are correct and reusable. Keep, mirror them server-side. |
| Challenge generator (`js/data/challenges.js`) | Real generation with difficulty tiers and a safety filter. Keep. |
| Game screen, filters, wheel, vote UI | Real, interactive, worth keeping as the UI layer over the new API. |
| Settings, themes, accessibility, export | Real and local. Keep. |

### What is fake, broken or misleading — and will be replaced

| Problem | Where | Fix |
| --- | --- | --- |
| Seven "friends" with invented stats presented as a squad | `js/data/seed.js` | Replace with real profiles from the database. Until then, label the sample squad explicitly as sample data. |
| "Multiplayer" lobbies that only exist on one device | `js/screens/lobbies.js` + `store.js` | Realtime lobby backed by Postgres rows (schema already written). |
| Simulated chat replies, ready-ups, joins, votes on a timer | `lobbies.js`, `games.js` | Delete the simulation; these become real broadcasts. |
| Invite codes that only work locally | `lobbies.js`, `store.js` | `join_lobby(code)` RPC against the shared database. |
| XP, wins, tournament results computed in the browser | `store.js` | Server-owned columns guarded by trigger + `award_xp` RPC. |
| Premium page that "unlocks" a local flag | `premium.js` | Keep as a clearly labelled preview; no billing until a real provider exists. |
| No accounts at all | everywhere | Supabase Auth, profile created by trigger on signup. |

### Decisions made for the rewrite

1. **Keep it a zero-build static bundle.** Supabase JS is loaded from the ESM CDN; nothing is compiled. This preserves "drop the folder on any host".
2. **The database is the source of truth.** The local store becomes a cache + offline fallback for the demo mode, not the authority.
3. **Server-side authority over rewards.** Client never writes `xp`, `wins`, `match`, membership, votes or scores — enforced with `REVOKE` + RLS + `SECURITY DEFINER` RPCs.
4. **Label what is not real.** Local demo mode keeps working but every screen states it is a local demo.

---

## Phase 2 — Backend, auth, profiles (schema done, UI not started)

Done now:

- `supabase/schema.sql`: schema, constraints, indexes, RLS on every table, RPCs, realtime publication.
- `supabase/seed.sql`: curated catalog with official links and no invented prices.
- `js/config.js`: connection settings, empty by default → local demo mode.

Still to do (needs a live project to test against):

- Vendor/load the Supabase client and a `LL.api` adapter with two implementations: `SupabaseApi` and the existing `LocalApi`.
- Auth screens: sign up, sign in, magic-link/password recovery, sign out, session refresh.
- Username uniqueness UX (the schema enforces it; the form needs live feedback).
- Profile screen reading real rows; settings persisted to `profiles.settings`.
- Friends screen: requests, accept/decline, block, online presence via `last_seen`.

**Acceptance:** create an account on device A, sign in on device B, see the same profile, edit settings on one and see them on the other after refresh.

---

## Phase 3 — Real-time lobbies (highest priority after auth)

Not started in the UI. The database side exists.

- Create lobby (public/private, max players) → `create_lobby`.
- Join by code → `join_lobby`, with full/closed/expired errors surfaced.
- Presence: `lobby_members` subscription + heartbeat on `last_seen`.
- Ready toggle → `set_ready`; host kick → `kick_member`; transfer → `transfer_host`; leave → `leave_lobby`; close → `close_lobby`.
- Reconnect handling: resubscribe on `online`, show a "reconnecting" banner, refetch on focus.

**Acceptance:** two signed-in devices in the same lobby; ready state, joins, kicks and chat appear on both within a second.

---

## Phase 4 — Game night picker

- Catalog read from `catalog_games` (already seeded), custom games via `added_by`.
- Filters: platform, players, genre/tags, playtime, budget (only from verified `price_note`).
- Nominations (`nominate_game`), votes (`cast_vote`), live totals from `lobby_votes`.
- Host finalizes (`finalize_vote`) — locked game shown to everyone.
- Random picker restricted to the *lobby's current filtered set*.

**Acceptance:** three members nominate and vote; totals agree on all devices; host locks and every device shows the same winner.

---

## Phase 5 — Party games, tournaments, chat, progression

- Party games need an authoritative state machine. Server side: `party_sessions.state` is written only by RPCs; `submit_party_answer` scores. Client side: subscribe to the session row.
- Trivia, Higher/Lower, Guess the Game, Word Guess, Group Vote — each needs a rules module, a round driver and a results screen.
- Tournaments: create/join, bracket rows generated server-side, `report_tournament_match` (report → opponent confirm → disputed path), `advance_bracket` for progression.
- Chat: `send_message` (rate limited, blocked-user aware), history paging, report a message.
- Progression: `award_xp` only; achievements checked server-side on activity; daily/weekly challenge rows.

**Acceptance:** a full tournament played to a champion by two accounts; XP totals match `xp_events` sums exactly; replaying an activity awards nothing.

---

## Phase 6 — Multi-session testing and polish

- Two browsers + one phone in the same lobby.
- Invalid/expired codes, full lobby, duplicate join, offline recovery.
- Permission checks: non-member cannot read chat (RLS), non-player cannot report a match, member cannot kick.
- Mobile pass on iPhone widths; skeletons; empty states; destructive confirmations.

---

## What is blocking, and what I need from you

**A Supabase project.** I cannot create one from this environment, and without it there is no way to run or test phases 2–5 — and no way to verify the schema against a real Postgres + PostgREST + Realtime stack.

Once you have the project URL and the **anon public** key (safe to be public, it is constrained by RLS), phases 2 and 3 can be built and tested for real, and I will not call anything finished before it works on two devices.
