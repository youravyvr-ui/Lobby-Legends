# Connecting Lobby Legends to Supabase

Ten minutes on a phone, free tier, no card. Do these in order.

---

## 1. Make an account

Go to **supabase.com** and choose **Start your project**. Sign in with GitHub — you already have an account, so this is one tap and no new password.

## 2. Create the project

- **New project** (pick the default organisation).
- **Name**: `lobby-legends`
- **Database password**: tap generate and **save it in your password manager**. You rarely need it, but it cannot be recovered.
- **Region**: the one closest to you (e.g. `West EU (Ireland)` for the UK/EU).
- **Plan:** Free. No card required.

Press **Create new project** and leave the tab — provisioning takes about two minutes.

## 2½. Get the code to paste

The SQL lives in this repo, so you can copy it straight from GitHub on the phone:

- Schema: `https://raw.githubusercontent.com/youravyvr-ui/Lobby-Legends/main/supabase/schema.sql`
- Catalog: `https://raw.githubusercontent.com/youravyvr-ui/Lobby-Legends/main/supabase/seed.sql`

Open each link, select all the text, copy it. (If you are reading this on the phone, keep them in a notes app until you reach step 4.)

---

## 3. Wait for the project to finish

The dashboard shows **Setting up project…** until it is ready. Then you get the project home.

## 4. Run the schema

1. Left sidebar → **SQL Editor** → **New query**.
2. Paste the whole of `schema.sql`.
3. Tap **Run** (or `Cmd/Ctrl + Enter`).
4. You should see **Success. No rows returned**.

This creates every table, all the Row Level Security policies, the server-side functions that guard XP and scores, and turns on Realtime for lobbies.

## 5. Load the game catalog

New query again → paste `seed.sql` → **Run**. You should see "Success. 24 rows".

If you instead see a `permission denied for table catalog_games` error, you are running as the wrong role: make sure you are in the SQL editor of the project itself, not in an API client — the SQL editor runs as the database owner and bypasses RLS.

## 6. Copy your two connection values

**Project Settings** (gear icon) → **API**:

- **Project URL** — looks like `https://abcdefghijkl.supabase.co`
- **Project API keys → `anon` / `public`** — a long `eyJ…` string.

The `anon` key is **meant to be public**. It only lets the browser do what the RLS policies in the schema allow. Never copy the `service_role` key into the app — that one bypasses RLS and belongs only on a server.

## 7. Turn on email sign-in

**Authentication → Providers → Email**:

- Leave **Enable email provider** on.
- While testing, turn **Confirm email** off. Otherwise every new account has to click a link before it can sign in.
- **Authentication → URL Configuration**: set **Site URL** to your app's address, `https://youravyvr-ui.github.io/Lobby-Legends/`. Add the same value under **Redirect URLs**. Magic links and password recovery will bounce here instead of to `localhost`.

## 8. Hand the values over

Either:

- paste the **Project URL** and **anon key** into `js/config.js` (`supabaseUrl`, `supabaseAnonKey`), or
- send them in the chat and I will put them in.

Either way they end up in a public file. That is fine and expected for the anon key; if you would rather not have them public, keep the repo private while testing (Pages then needs a paid plan, but the local demo still runs from the folder).

---

## Checking it worked

SQL Editor → New query → run this:

```sql
select count(*) as games from public.catalog_games;
select tablename, policyname from pg_policies where schemaname = 'public' order by tablename;
```

You should get 24 games, and a row per policy — that list is the actual security model, so it should look long.

---

## Troubleshooting

**"relation … already exists"** — the schema is written to be re-runnable, but if you edited it, start from a fresh project.

**Sign-up works, then the app says "profile not found"** — the `on_auth_user_created` trigger did not run. Re-run the section of `schema.sql` above the profiles table, then check `select * from public.profiles;`.

**Realtime gives nothing** — confirm Realtime is enabled for the project (Database → Replication) and that the tables show under the `supabase_realtime` publication.

**The app shows someone else's lobby as empty** — that is RLS working: only members and the host can read a private lobby.

**The project paused itself** — the free tier pauses after about a week of no activity. Open the dashboard and tap **Restore project**; data is kept.

---

## What is still true after this

Connecting Supabase gives the app a real database and real accounts. The UI still has to be wired to it — that is phases 2 and 3 in `ROADMAP.md`, and it cannot be built or tested until this setup is done.
