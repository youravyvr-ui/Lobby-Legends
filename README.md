# Lobby Legends

A mobile-first gaming companion for friend groups: spin a wheel to pick what to play, run private lobbies with invite codes, vote on games, take on challenges, run single-elimination tournaments and track who is actually the best in the group.

It is a **zero-build static web app** — plain HTML, CSS and JavaScript with no dependencies and no paid services.

---

## Run it

Any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open `index.html` from that server. Opening the file directly also works, but a server is closer to the real thing (clipboard, `navigator.share` and the web app manifest behave better over http/https).

---

## Let others test it

There is nothing to build and no server code: any host that serves these files serves the whole app.

**GitHub Pages (free, recommended)**

1. Push the project to a GitHub repository.
2. In the repository: **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Share `https://<user>.github.io/<repo>/`.

**Drag-and-drop hosts** — Netlify Drop, Cloudflare Pages or Vercel: drag the project folder in, leave the build command empty and the publish directory at `/`.

**Same Wi-Fi, no host at all** — `python3 -m http.server 8000`, then open `http://<your-computer-ip>:8000` on the phones in the room.

### What testers actually get

Each visitor gets their own copy of the sample squad in their own browser. The site is installable (`manifest.webmanifest` + `icon.svg`), so it can sit on a home screen like a real app, and Settings has a "Send this app to a friend" button that uses the system share sheet.

Because there is no backend yet, testing is **single-device by design**:

- progress, lobbies and brackets live in each tester's browser;
- an invite code only works on the device that created it;
- two people cannot share a live lobby.

So point testers at the solo flows — the wheel, filters, challenges, a bracket, leaderboards, profile and settings — and read the demo labels on lobbies and premium together. Shared lobbies need the backend described at the bottom of this file.

---

## Backend status (Supabase)

The v2 groundwork is in place: the database, the security rules and the server-side write paths are defined. The app UI is **not** wired to them yet, so it still runs as a single-device local demo until you connect a project.

- `supabase/schema.sql` — profiles, friends, lobbies, members, nominations and votes, chat, catalog, matches, XP events, achievements, tournaments and party-game sessions, with Row Level Security on every table.
- The same file makes the client unable to write XP, wins, lobby membership, votes or bracket scores directly. All of it goes through `SECURITY DEFINER` functions that check who is calling: `create_lobby`, `join_lobby`, `set_ready`, `leave_lobby`, `kick_member`, `transfer_host`, `close_lobby`, `nominate_game`, `cast_vote`, `finalize_vote`, `send_message`, `log_match`, `complete_challenge`, `report_tournament_match`, `submit_party_answer`, plus an internal `award_xp` that a unique key stops from paying the same activity twice.
- `supabase/seed.sql` — the curated catalog with official publisher links. Prices are only present where a title is genuinely free to play; everything else is `NULL` rather than invented.
- `js/config.js` — where the project URL and anon key go.

**To connect it:** follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for the click-by-click version with screenshots-in-words, or the short form:

1. Create a project at supabase.com (the free tier is enough).
2. SQL editor: run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Project Settings → API: copy the **Project URL** and the **anon public** key into `js/config.js`. The anon key is public by design and limited by RLS — never paste the `service_role` key into frontend code.
4. Authentication → Providers: enable Email, and turn off "Confirm email" while testing so sign-ups can sign in immediately.
5. Realtime is already published for `lobbies`, `lobby_members`, `lobby_messages`, `lobby_votes`, `lobby_nominations`, `party_sessions` and `tournament_matches`.

See `ROADMAP.md` for what is done, what is next and what is still missing.

---

## What works today

Everything below is real, interactive and persisted locally. There is no fake button: anything that is only a preview is labelled **demo** in the UI.

| Area | Behaviour |
| --- | --- |
| Home | Profile, level ring with XP curve, daily streak, quick stats, active lobbies, live brackets, recent results, a daily challenge and a featured challenge that rotates every 9s (dots to jump). |
| Game picker | Personal game library, filters for platform / genre / player count / playtime, an animated spin wheel with skip and reroll, plus "open a lobby with this game" and "challenge" shortcuts. |
| Library | 24 catalogue games (Fortnite, Minecraft, Roblox, Rocket League, Call of Duty, GTA Online, Valorant, Apex Legends, …) and custom games with your own name, icon, genre, platform, player cap and playtime. |
| Squad vote | Start a 2–5 game vote from the library; friends' votes arrive with staggered delays so the vote feels alive. |
| Lobbies | Create private lobbies with unique 6-character codes, join by code or invite link (`#/join/CODE`), ready states, game pools with live add/remove, group voting with a host "lock result", quick chat announcements and a message feed. Lobby ownership transfers when the host leaves. |
| Challenges | Generator with four difficulties (easy 40 XP → insane 300 XP) and five categories (skill, funny, teamwork, survival, competitive), per-game flavour for supported titles, custom challenges with a safety filter, completion log and XP rewards. |
| Tournaments | 4- and 8-player single-elimination brackets, participant picking, random seeding, score entry with tie validation, automatic winner progression, champion and runner-up, match log, history and a demo "simulate remaining" shortcut. |
| Leaderboards | All-time and weekly boards, metrics for XP / wins / challenges / cups / win rate, podium, full ranking, player cards and head-to-head rivalries with manual win/loss logging. |
| Profile | Avatar, username, bio, region, accent colour, favourite games, XP and level, achievements with unlock conditions, match history, challenge history and a trophy case. |
| Premium | Labelled demo upgrade page with monthly/yearly mock plans, feature list and a demo unlock that sets a local flag only. No checkout, no card fields, no subscription. |
| Settings | Account, export JSON, reset, dark theme presets, accent colours, accessibility (reduced motion, larger text, high contrast, interface sounds), privacy toggles and notification preferences. |

States are covered: skeleton loading on boot, empty states for every list, success toasts, error toasts and a recoverable error screen if a screen fails to render.

---

## Demo limitations (read this)

This build has **no backend**. Be clear about that when you share it:

- **Storage** is `localStorage` under `lobby-legends:v1` on one device. Clearing site data wipes progress.
- **Friend activity is simulated.** Lobby chat replies, ready-ups, joins and votes by friends are scripted on a timer so the demo feels alive. Nobody else is connected.
- **Invite links only work on your own device.** Real invites need a shared database.
- **Group stats and other players are sample data.** Only your own logged matches, challenges and bracket results are real (self-reported) records. Lobby Legends never claims to show official game statistics.
- **Premium is a preview.** Selecting a plan toggles a local demo flag. There is no billing integration, no payment details are collected and no subscription exists.
- **Notifications are preferences only.** No push service or service worker is wired up.

No API keys, tokens or passwords exist in this app, and there is no password storage at all — there is no auth yet.

---

## Architecture

```
index.html               app shell + script order
manifest.webmanifest     install metadata (home screen)
icon.svg                 app icon
css/base.css             design tokens, themes, layout, accessibility modes
css/components.css       buttons, cards, wheel, bracket, chat, modals, toasts
js/core/utils.js         ids, formatting, XP curve, bracket helpers
js/core/store.js         single source of truth, localStorage, achievements, XP
js/data/games.js         game catalogue + filter vocabulary
js/data/challenges.js    challenge templates, generator, safety filter
js/data/seed.js          sample squad, lobbies, matches, brackets
js/ui/components.js      reusable render helpers + icons + modal/toast
js/screens/*.js          one module per screen, registered in LL.screens
js/app.js                hash router, shell chrome, event delegation, timers
```

Key conventions:

- **Screen modules** export `render(params)` and optional `mount(root, params)` onto `LL.screens`.
- **Event delegation**: every interactive element carries `data-act="namespace:action"` and handlers live in one global `LL.actions` registry, so re-renders never lose listeners. Text inputs that persist data use explicit save buttons or `data-change-act` so re-rendering doesn't steal focus mid-typing.
- **State changes** go through `LL.store.update()` / `S.save()` + `S.emit()`, and subscribers re-render the current screen while keeping scroll position.
- **Bracket math** is shared in `utils.js` (`buildRounds`, `propagate`, `setResult`) so seeding and user edits follow the same code path.
- **Theming** is CSS custom properties on `<html data-theme data-accent>`; accessibility toggles add classes to the root.

---

## Path to a real product

The local store is deliberately shaped like a database schema so it can be swapped for a real API without rewriting screens.

**Suggested tables / collections**

```
users(id, email, created_at)
profiles(user_id, username, avatar, bio, region, accent, xp, level, weekly_xp, streak)
games(id, name, genre, platforms, min_players, max_players, minutes, custom, owner_id)
user_games(user_id, game_id)                 -- library
lobbies(id, code, name, owner_id, status, pool, locked_game, created_at)
lobby_members(lobby_id, user_id, ready, joined_at)
lobby_votes(lobby_id, user_id, game_id)
lobby_messages(id, lobby_id, user_id, text, kind, created_at)
matches(id, user_id, game_id, outcome, score, mode, opponent, created_at)
challenges(id, title, body, game_id, category, difficulty, xp, owner_id, pack_id)
challenge_completions(user_id, challenge_id, completed_at)
tournaments(id, group_id, name, game_id, size, status, champion_id, created_at)
tournament_participants(tournament_id, user_id, seed)
tournament_matches(id, tournament_id, round, slot, a_id, b_id, score_a, score_b, winner_id, confirmed_by)
rivalries(group_id, user_a, user_b, wins_a, wins_b)
groups(id, name, invite_code) / group_members(group_id, user_id, role)
entitlements(user_id, plan, status, current_period_end, provider_ref)
```

**Realtime lobbies.** Use a managed realtime service or WebSockets with one channel per lobby (`lobby:{id}`): presence for ready state, broadcast for votes and chat. Keep server-authoritative validation for votes and tournament scores (reject a score that doesn't match the current bracket state) instead of trusting the client.

**Auth** should be an OAuth/passwordless provider (Apple, Google, magic link). Never store passwords client-side, and never ship a service-role key in the bundle. Row-level security should scope every row to the caller's group.

**Subscriptions** belong entirely on the server: create a checkout session server-side, verify webhooks, and write an `entitlements` row the client only *reads*. The client must never be the source of truth for premium access — which is exactly why the preview here only flips a local flag and says so.

**Notifications** would be a service worker plus push subscription stored server-side, fed by the same events that already drive in-app toasts.
