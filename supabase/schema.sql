-- ============================================================
-- Lobby Legends 2.0 — Supabase schema, policies and RPCs
-- ============================================================
-- Run this in the Supabase SQL editor of your project.
-- It is written to be re-runnable: tables use IF NOT EXISTS and
-- functions use CREATE OR REPLACE.
--
-- Security model in one line: the client never writes XP, wins,
-- membership or bracket state directly. Those go through the
-- SECURITY DEFINER RPCs at the bottom, which validate the caller.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar       text not null default '🦈' check (char_length(avatar) <= 8),
  bio          text not null default '' check (char_length(bio) <= 200),
  region       text not null default '' check (char_length(region) <= 24),
  accent       text not null default 'neon' check (accent in ('neon', 'orange', 'blue', 'red')),
  xp           integer not null default 0 check (xp >= 0),
  weekly_xp    integer not null default 0 check (weekly_xp >= 0),
  week_key     text not null default to_char(now(), 'IYYY-"W"IW'),
  streak       integer not null default 0 check (streak >= 0),
  wins         integer not null default 0 check (wins >= 0),
  losses       integer not null default 0 check (losses >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  last_seen    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists profiles_username_key on public.profiles (lower(username));
create index if not exists profiles_xp_idx on public.profiles (xp desc);
create index if not exists profiles_weekly_idx on public.profiles (weekly_xp desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Settings live in their own table so they can be owner-only. Column grants
-- cannot be row-conditional, so keeping them on `profiles` would let any
-- signed-in user read everyone's privacy settings.
create table if not exists public.profile_settings (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  settings   jsonb not null default jsonb_build_object(
               'theme', 'midnight',
               'reduceMotion', false,
               'highContrast', false,
               'largeText', false,
               'sound', true,
               'privacy', jsonb_build_object(
                 'showStats', true, 'allowInvites', true,
                 'showHistory', true, 'appearInLeaderboard', true),
               'notifications', jsonb_build_object(
                 'lobbyInvites', true, 'tournamentUpdates', true,
                 'dailyChallenge', true)
             ),
  updated_at timestamptz not null default now()
);

drop trigger if exists profile_settings_updated_at on public.profile_settings;
create trigger profile_settings_updated_at
  before update on public.profile_settings
  for each row execute function public.set_updated_at();

-- Every new profile gets a settings row alongside it.
create or replace function public.handle_new_profile_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile_settings();

-- A profile is created for every new auth user, with a unique default handle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate   text;
  n           int := 0;
begin
  base_handle := regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email, 'player'), '@', 1)),
    '[^A-Za-z0-9_]', '', 'g'
  );
  if char_length(base_handle) < 3 then
    base_handle := 'player';
  end if;
  candidate := left(base_handle, 16);
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    n := n + 1;
    candidate := left(base_handle, 20 - char_length(n::text)) || n::text;
    if n > 999 then
      candidate := 'player' || substr(new.id::text, 1, 6);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username, avatar)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'avatar', '🦈'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stats columns are server-owned: block any client update that touches them.
create or replace function public.guard_profile_stats()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('lobbylegends.stats_write', true), 'off') <> 'on' then
    if new.xp <> old.xp
       or new.weekly_xp <> old.weekly_xp
       or new.wins <> old.wins
       or new.losses <> old.losses
       or new.games_played <> old.games_played
       or new.streak <> old.streak then
      raise exception 'Stat columns are server-owned; use the reward RPCs.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_stats on public.profiles;
create trigger profiles_guard_stats
  before update on public.profiles
  for each row execute function public.guard_profile_stats();

-- ------------------------------------------------------------
-- Friends
-- ------------------------------------------------------------

create table if not exists public.friend_requests (
  id         uuid primary key default gen_random_uuid(),
  requester  uuid not null references public.profiles(id) on delete cascade,
  addressee  uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending'
             check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);

create index if not exists friend_requests_addressee_idx
  on public.friend_requests (addressee, status);
create index if not exists friend_requests_requester_idx
  on public.friend_requests (requester, status);

create table if not exists public.blocked_users (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);

-- ------------------------------------------------------------
-- Game catalog (curated, with user-added custom entries)
-- ------------------------------------------------------------

create table if not exists public.catalog_games (
  id           text primary key check (id ~ '^[a-z0-9-]{2,48}$'),
  title        text not null check (char_length(title) between 1 and 80),
  description  text not null default '' check (char_length(description) <= 400),
  category     text not null default 'Party',
  platforms    text[] not null default '{}',
  min_players  integer not null default 1 check (min_players >= 1),
  max_players  integer not null default 1 check (max_players >= min_players),
  minutes      integer check (minutes > 0 and minutes <= 600),
  tags         text[] not null default '{}',
  official_url text check (official_url is null or official_url ~ '^https://'),
  price_note   text check (price_note is null or char_length(price_note) <= 80),
  added_by     uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists catalog_games_category_idx on public.catalog_games (category);
create index if not exists catalog_games_players_idx on public.catalog_games (max_players);

create table if not exists public.library_entries (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    text not null references public.catalog_games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ------------------------------------------------------------
-- Lobbies
-- ------------------------------------------------------------

create table if not exists public.lobbies (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name           text not null check (char_length(name) between 1 and 60),
  host_id        uuid not null references public.profiles(id) on delete cascade,
  visibility     text not null default 'private' check (visibility in ('private', 'public')),
  max_players    integer not null default 8 check (max_players between 2 and 16),
  status         text not null default 'open' check (status in ('open', 'voting', 'locked', 'closed')),
  locked_game_id text references public.catalog_games(id),
  created_at     timestamptz not null default now(),
  closed_at      timestamptz
);

create index if not exists lobbies_host_idx on public.lobbies (host_id);
create index if not exists lobbies_visibility_idx on public.lobbies (visibility, status);
create index if not exists lobbies_created_idx on public.lobbies (created_at desc);

create table if not exists public.lobby_members (
  lobby_id   uuid not null references public.lobbies(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  ready      boolean not null default false,
  joined_at  timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (lobby_id, user_id)
);

create index if not exists lobby_members_user_idx on public.lobby_members (user_id);

create table if not exists public.lobby_nominations (
  lobby_id     uuid not null references public.lobbies(id) on delete cascade,
  game_id      text not null references public.catalog_games(id) on delete cascade,
  nominated_by uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (lobby_id, game_id)
);

create table if not exists public.lobby_votes (
  lobby_id uuid not null,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  game_id  text not null,
  voted_at timestamptz not null default now(),
  primary key (lobby_id, user_id),
  foreign key (lobby_id, game_id)
    references public.lobby_nominations (lobby_id, game_id) on delete cascade
);

create table if not exists public.lobby_messages (
  id         bigint generated always as identity primary key,
  lobby_id   uuid not null references public.lobbies(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  body       text not null check (char_length(body) between 1 and 400),
  kind       text not null default 'chat' check (kind in ('chat', 'system')),
  created_at timestamptz not null default now()
);

create index if not exists lobby_messages_lobby_idx
  on public.lobby_messages (lobby_id, created_at desc);

create table if not exists public.message_reports (
  id         uuid primary key default gen_random_uuid(),
  message_id bigint not null references public.lobby_messages(id) on delete cascade,
  reporter   uuid not null references public.profiles(id) on delete cascade,
  reason     text not null check (char_length(reason) between 3 and 200),
  created_at timestamptz not null default now(),
  resolved   boolean not null default false,
  unique (message_id, reporter)
);

-- ------------------------------------------------------------
-- Matches, XP and achievements
-- ------------------------------------------------------------

create table if not exists public.matches (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    text references public.catalog_games(id) on delete set null,
  outcome    text not null check (outcome in ('win', 'loss')),
  score      text check (char_length(score) <= 32),
  mode       text check (char_length(mode) <= 32),
  opponent   text check (char_length(opponent) <= 32),
  source     text not null default 'self_reported'
             check (source in ('self_reported', 'party_game', 'tournament')),
  created_at timestamptz not null default now()
);

create index if not exists matches_user_idx on public.matches (user_id, created_at desc);

create table if not exists public.xp_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('match', 'challenge', 'tournament', 'party_game', 'achievement')),
  ref        text not null,
  amount     integer not null check (amount between 1 and 500),
  created_at timestamptz not null default now(),
  -- the same activity can never pay out twice
  unique (user_id, kind, ref)
);

create index if not exists xp_events_user_idx on public.xp_events (user_id, created_at desc);

create table if not exists public.user_achievements (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  achievement text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement)
);

create table if not exists public.challenge_completions (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null,
  difficulty  text not null check (difficulty in ('easy', 'medium', 'hard', 'insane')),
  xp          integer not null check (xp between 0 and 500),
  completed_at timestamptz not null default now(),
  -- one completion per challenge per day
  unique (user_id, challenge_id, (completed_at::date))
);

-- ------------------------------------------------------------
-- Tournaments
-- ------------------------------------------------------------

create table if not exists public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  game_id     text references public.catalog_games(id) on delete set null,
  host_id     uuid not null references public.profiles(id) on delete cascade,
  size        integer not null check (size in (4, 8)),
  status      text not null default 'open' check (status in ('open', 'active', 'complete', 'cancelled')),
  champion_id uuid references public.profiles(id) on delete set null,
  runner_up_id uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tournaments_host_idx on public.tournaments (host_id);

create table if not exists public.tournament_participants (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  seed          integer,
  joined_at     timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create table if not exists public.tournament_matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round         integer not null check (round >= 0),
  slot          integer not null check (slot >= 0),
  player_a      uuid references public.profiles(id) on delete set null,
  player_b      uuid references public.profiles(id) on delete set null,
  score_a       integer check (score_a >= 0),
  score_b       integer check (score_b >= 0),
  winner_id     uuid references public.profiles(id) on delete set null,
  status        text not null default 'pending'
                check (status in ('pending', 'reported', 'confirmed', 'disputed')),
  reported_by   uuid references public.profiles(id) on delete set null,
  confirmed_by  uuid references public.profiles(id) on delete set null,
  reported_at   timestamptz,
  confirmed_at  timestamptz,
  unique (tournament_id, round, slot),
  check (score_a is null or score_b is null or score_a <> score_b)
);

create index if not exists tournament_matches_tour_idx
  on public.tournament_matches (tournament_id, round, slot);

-- ------------------------------------------------------------
-- Playable party games
-- ------------------------------------------------------------

create table if not exists public.party_sessions (
  id         uuid primary key default gen_random_uuid(),
  lobby_id   uuid not null references public.lobbies(id) on delete cascade,
  game       text not null check (game in ('trivia', 'higher_lower', 'guess_game', 'word_guess', 'group_vote')),
  status     text not null default 'lobby' check (status in ('lobby', 'active', 'finished')),
  round      integer not null default 0 check (round >= 0),
  state      jsonb not null default '{}'::jsonb,  -- authoritative, written by RPCs only
  started_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists party_sessions_lobby_idx on public.party_sessions (lobby_id, created_at desc);

create table if not exists public.party_answers (
  session_id uuid not null references public.party_sessions(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  round      integer not null check (round >= 0),
  answer     jsonb not null default '{}'::jsonb,
  is_correct boolean,
  points     integer not null default 0 check (points >= 0),
  answered_at timestamptz not null default now(),
  primary key (session_id, user_id, round)
);

-- The correct answer for a round is never readable by a client: it lives here,
-- with RLS on and no policy at all, so only the SECURITY DEFINER scorer sees it.
create table if not exists public.party_secrets (
  session_id uuid not null references public.party_sessions(id) on delete cascade,
  round      integer not null check (round >= 0),
  expected   text not null,
  primary key (session_id, round)
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles             enable row level security;
alter table public.profile_settings     enable row level security;
alter table public.friend_requests      enable row level security;
alter table public.blocked_users        enable row level security;
alter table public.catalog_games        enable row level security;
alter table public.library_entries      enable row level security;
alter table public.lobbies              enable row level security;
alter table public.lobby_members        enable row level security;
alter table public.lobby_nominations    enable row level security;
alter table public.lobby_votes          enable row level security;
alter table public.lobby_messages       enable row level security;
alter table public.message_reports      enable row level security;
alter table public.matches              enable row level security;
alter table public.xp_events            enable row level security;
alter table public.user_achievements    enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.tournaments          enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_matches   enable row level security;
alter table public.party_sessions       enable row level security;
alter table public.party_answers        enable row level security;
alter table public.party_secrets        enable row level security;
revoke all on public.party_secrets from anon, authenticated;

-- Membership checks as SECURITY DEFINER so policies never recurse.
create or replace function public.is_lobby_member(p_lobby uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.lobby_members
    where lobby_id = p_lobby and user_id = auth.uid()
  );
$$;

create or replace function public.is_lobby_host(p_lobby uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.lobbies
    where id = p_lobby and host_id = auth.uid()
  );
$$;

-- Profiles: public fields are world-readable to signed-in users,
-- settings and the full row only to the owner.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Column-level privacy: the row policy allows reading public profile fields,
-- and the grants below make sure settings and email-ish data are not in that set.
revoke all on public.profiles from anon, authenticated;
grant select (id, username, avatar, bio, region, accent, xp, weekly_xp, streak,
              wins, losses, games_played, created_at, last_seen)
  on public.profiles to authenticated;
grant update (username, avatar, bio, region, accent)
  on public.profiles to authenticated;
grant insert (id, username, avatar) on public.profiles to authenticated;

-- Settings: strictly owner-only.
drop policy if exists profile_settings_own on public.profile_settings;
create policy profile_settings_own on public.profile_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Friend requests
drop policy if exists friend_requests_select on public.friend_requests;
create policy friend_requests_select on public.friend_requests
  for select to authenticated
  using (requester = auth.uid() or addressee = auth.uid());

drop policy if exists friend_requests_insert on public.friend_requests;
create policy friend_requests_insert on public.friend_requests
  for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');

-- Only the addressee can accept or decline; the requester can only cancel (delete).
drop policy if exists friend_requests_update on public.friend_requests;
drop policy if exists friend_requests_accept on public.friend_requests;
create policy friend_requests_accept on public.friend_requests
  for update to authenticated
  using (addressee = auth.uid())
  with check (addressee = auth.uid() and status in ('accepted', 'declined'));

drop policy if exists friend_requests_delete on public.friend_requests;
create policy friend_requests_delete on public.friend_requests
  for delete to authenticated
  using (requester = auth.uid() or addressee = auth.uid());

-- Blocks
drop policy if exists blocked_select on public.blocked_users;
create policy blocked_select on public.blocked_users
  for select to authenticated using (user_id = auth.uid());
drop policy if exists blocked_write on public.blocked_users;
create policy blocked_write on public.blocked_users
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Catalog: readable by everyone signed in; custom entries owned by their author.
drop policy if exists catalog_select on public.catalog_games;
create policy catalog_select on public.catalog_games
  for select to authenticated using (true);

drop policy if exists catalog_insert_custom on public.catalog_games;
create policy catalog_insert_custom on public.catalog_games
  for insert to authenticated
  with check (added_by = auth.uid());

drop policy if exists catalog_update_own on public.catalog_games;
create policy catalog_update_own on public.catalog_games
  for update to authenticated
  using (added_by = auth.uid()) with check (added_by = auth.uid());

drop policy if exists catalog_delete_own on public.catalog_games;
create policy catalog_delete_own on public.catalog_games
  for delete to authenticated using (added_by = auth.uid());

-- Library
drop policy if exists library_own on public.library_entries;
create policy library_own on public.library_entries
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Lobbies: members + host can read, everyone can read public open lobbies.
drop policy if exists lobbies_select on public.lobbies;
create policy lobbies_select on public.lobbies
  for select to authenticated
  using (
    host_id = auth.uid()
    or public.is_lobby_member(id)
    or (visibility = 'public' and status <> 'closed')
  );

-- Lobby writes happen through RPCs only (see the revokes below).
drop policy if exists lobbies_update_host on public.lobbies;
create policy lobbies_update_host on public.lobbies
  for update to authenticated
  using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists lobby_members_select on public.lobby_members;
create policy lobby_members_select on public.lobby_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_lobby_member(lobby_id));

drop policy if exists lobby_nominations_select on public.lobby_nominations;
create policy lobby_nominations_select on public.lobby_nominations
  for select to authenticated using (public.is_lobby_member(lobby_id));

drop policy if exists lobby_votes_select on public.lobby_votes;
create policy lobby_votes_select on public.lobby_votes
  for select to authenticated using (public.is_lobby_member(lobby_id));

drop policy if exists lobby_messages_select on public.lobby_messages;
create policy lobby_messages_select on public.lobby_messages
  for select to authenticated using (public.is_lobby_member(lobby_id));

drop policy if exists message_reports_insert on public.message_reports;
create policy message_reports_insert on public.message_reports
  for insert to authenticated with check (reporter = auth.uid());

drop policy if exists message_reports_select on public.message_reports;
create policy message_reports_select on public.message_reports
  for select to authenticated using (reporter = auth.uid());

-- Matches / XP / achievements: read your own, plus public aggregate stats.
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select to authenticated using (user_id = auth.uid());

drop policy if exists xp_events_select on public.xp_events;
create policy xp_events_select on public.xp_events
  for select to authenticated using (user_id = auth.uid());

drop policy if exists achievements_select on public.user_achievements;
create policy achievements_select on public.user_achievements
  for select to authenticated using (true);

drop policy if exists challenge_completions_select on public.challenge_completions;
create policy challenge_completions_select on public.challenge_completions
  for select to authenticated using (user_id = auth.uid());

-- Tournaments
drop policy if exists tournaments_select on public.tournaments;
create policy tournaments_select on public.tournaments
  for select to authenticated using (true);

drop policy if exists tournaments_insert on public.tournaments;
create policy tournaments_insert on public.tournaments
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists tournaments_update_host on public.tournaments;
create policy tournaments_update_host on public.tournaments
  for update to authenticated
  using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists tournament_participants_select on public.tournament_participants;
create policy tournament_participants_select on public.tournament_participants
  for select to authenticated using (true);

drop policy if exists tournament_matches_select on public.tournament_matches;
create policy tournament_matches_select on public.tournament_matches
  for select to authenticated using (true);

-- Party games: participants read; writes go through RPCs.
drop policy if exists party_sessions_select on public.party_sessions;
create policy party_sessions_select on public.party_sessions
  for select to authenticated using (public.is_lobby_member(lobby_id));

drop policy if exists party_answers_select on public.party_answers;
create policy party_answers_select on public.party_answers
  for select to authenticated
  using (exists (
    select 1 from public.party_sessions s
    where s.id = session_id and public.is_lobby_member(s.lobby_id)
  ));

-- Direct client writes that must never happen:
revoke insert, update, delete on public.lobbies from authenticated;
revoke insert, update, delete on public.lobby_members from authenticated;
revoke insert, update, delete on public.lobby_nominations from authenticated;
revoke insert, update, delete on public.lobby_votes from authenticated;
revoke insert, update, delete on public.lobby_messages from authenticated;
revoke insert, update, delete on public.matches from authenticated;
revoke insert, update, delete on public.xp_events from authenticated;
revoke insert, update, delete on public.user_achievements from authenticated;
revoke insert, update, delete on public.challenge_completions from authenticated;
revoke insert, update, delete on public.tournament_participants from authenticated;
revoke insert, update, delete on public.tournament_matches from authenticated;
revoke insert, update, delete on public.party_sessions from authenticated;
revoke insert, update, delete on public.party_answers from authenticated;
grant select on public.lobbies, public.lobby_members, public.lobby_nominations,
  public.lobby_votes, public.lobby_messages, public.matches, public.xp_events,
  public.user_achievements, public.challenge_completions, public.tournaments,
  public.tournament_participants, public.tournament_matches, public.party_sessions,
  public.party_answers
  to authenticated;
grant select, insert on public.message_reports to authenticated;

-- ------------------------------------------------------------
-- RPCs — the only way to change lobby, bracket and XP state
-- ------------------------------------------------------------

-- Unique 6-character lobby code.
create or replace function public.new_lobby_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  for attempt in 1..40 loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.lobbies where code = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'Could not allocate a lobby code';
end;
$$;

create or replace function public.create_lobby(
  p_name text,
  p_visibility text default 'private',
  p_max_players int default 8,
  p_game_ids text[] default '{}'
)
returns public.lobbies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lobby public.lobbies;
  v_game  text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into public.lobbies (code, name, host_id, visibility, max_players)
  values (
    public.new_lobby_code(),
    coalesce(nullif(trim(p_name), ''), 'Game night'),
    auth.uid(),
    case when p_visibility = 'public' then 'public' else 'private' end,
    greatest(2, least(16, coalesce(p_max_players, 8)))
  )
  returning * into v_lobby;

  insert into public.lobby_members (lobby_id, user_id, ready)
  values (v_lobby.id, auth.uid(), true);

  foreach v_game in array coalesce(p_game_ids, '{}') loop
    if exists (select 1 from public.catalog_games where id = v_game) then
      insert into public.lobby_nominations (lobby_id, game_id, nominated_by)
      values (v_lobby.id, v_game, auth.uid())
      on conflict do nothing;
    end if;
  end loop;

  insert into public.lobby_messages (lobby_id, kind, body)
  values (v_lobby.id, 'system', 'Lobby created · invite code ' || v_lobby.code);

  return v_lobby;
end;
$$;

create or replace function public.join_lobby(p_code text)
returns public.lobbies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lobby public.lobbies;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_lobby from public.lobbies
  where code = upper(trim(p_code));

  if v_lobby.id is null then
    raise exception 'No lobby with that code' using errcode = 'P0002';
  end if;
  if v_lobby.status = 'closed' then
    raise exception 'That lobby is closed' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.lobby_members
    where lobby_id = v_lobby.id and user_id = auth.uid()
  ) then
    return v_lobby;  -- duplicate join is a no-op
  end if;

  select count(*) into v_count from public.lobby_members where lobby_id = v_lobby.id;
  if v_count >= v_lobby.max_players then
    raise exception 'That lobby is full' using errcode = 'P0003';
  end if;

  insert into public.lobby_members (lobby_id, user_id)
  values (v_lobby.id, auth.uid());

  insert into public.lobby_messages (lobby_id, kind, body)
  values (v_lobby.id, 'system',
    (select username from public.profiles where id = auth.uid()) || ' joined the lobby');

  return v_lobby;
end;
$$;

create or replace function public.set_ready(p_lobby uuid, p_ready boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lobby_members
     set ready = coalesce(p_ready, false), last_seen = now()
   where lobby_id = p_lobby and user_id = auth.uid();

  if not found then
    raise exception 'You are not in that lobby' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.leave_lobby(p_lobby uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host   uuid;
  v_next   uuid;
  v_left   int;
begin
  select host_id into v_host from public.lobbies where id = p_lobby for update;
  if v_host is null then
    return;
  end if;

  delete from public.lobby_members where lobby_id = p_lobby and user_id = auth.uid();

  select count(*) into v_left from public.lobby_members where lobby_id = p_lobby;

  if v_left = 0 then
    update public.lobbies
       set status = 'closed', closed_at = now()
     where id = p_lobby;
    delete from public.lobbies where id = p_lobby and closed_at is not null
      and created_at < now() - interval '1 minute';
  elsif v_host = auth.uid() then
    select user_id into v_next
      from public.lobby_members
     where lobby_id = p_lobby
     order by joined_at
     limit 1;
    update public.lobbies set host_id = v_next where id = p_lobby;
    insert into public.lobby_messages (lobby_id, kind, body)
    values (p_lobby, 'system',
      (select username from public.profiles where id = v_next) || ' is now the host');
  end if;
end;
$$;

create or replace function public.kick_member(p_lobby uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lobby_host(p_lobby) then
    raise exception 'Only the host can remove members' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'Use leave_lobby to leave' using errcode = '22023';
  end if;

  delete from public.lobby_members where lobby_id = p_lobby and user_id = p_user;

  insert into public.lobby_messages (lobby_id, kind, body)
  values (p_lobby, 'system',
    (select username from public.profiles where id = p_user) || ' was removed by the host');
end;
$$;

create or replace function public.transfer_host(p_lobby uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lobby_host(p_lobby) then
    raise exception 'Only the host can transfer host' using errcode = '42501';
  end if;
  if not exists (select 1 from public.lobby_members where lobby_id = p_lobby and user_id = p_user) then
    raise exception 'That player is not in the lobby' using errcode = '22023';
  end if;

  update public.lobbies set host_id = p_user where id = p_lobby;
end;
$$;

create or replace function public.close_lobby(p_lobby uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lobby_host(p_lobby) then
    raise exception 'Only the host can close the lobby' using errcode = '42501';
  end if;
  update public.lobbies set status = 'closed', closed_at = now() where id = p_lobby;
end;
$$;

create or replace function public.nominate_game(p_lobby uuid, p_game text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lobby_member(p_lobby) then
    raise exception 'Join the lobby first' using errcode = '42501';
  end if;
  if (select status from public.lobbies where id = p_lobby) = 'locked' then
    raise exception 'The game is already locked in' using errcode = '22023';
  end if;
  if not exists (select 1 from public.catalog_games where id = p_game) then
    raise exception 'Unknown game' using errcode = '22023';
  end if;

  insert into public.lobby_nominations (lobby_id, game_id, nominated_by)
  values (p_lobby, p_game, auth.uid())
  on conflict (lobby_id, game_id) do nothing;
end;
$$;

create or replace function public.cast_vote(p_lobby uuid, p_game text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lobby_member(p_lobby) then
    raise exception 'Join the lobby first' using errcode = '42501';
  end if;
  if (select status from public.lobbies where id = p_lobby) = 'locked' then
    raise exception 'Voting is closed' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.lobby_nominations where lobby_id = p_lobby and game_id = p_game
  ) then
    raise exception 'That game is not nominated' using errcode = '22023';
  end if;

  insert into public.lobby_votes (lobby_id, user_id, game_id, voted_at)
  values (p_lobby, auth.uid(), p_game, now())
  on conflict (lobby_id, user_id)
  do update set game_id = excluded.game_id, voted_at = now();
end;
$$;

create or replace function public.finalize_vote(p_lobby uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner text;
begin
  if not public.is_lobby_host(p_lobby) then
    raise exception 'Only the host can lock the vote' using errcode = '42501';
  end if;

  select game_id into v_winner
    from public.lobby_votes
   where lobby_id = p_lobby
   group by game_id
   order by count(*) desc, min(voted_at) asc
   limit 1;

  if v_winner is null then
    raise exception 'Nobody voted yet' using errcode = 'P0002';
  end if;

  update public.lobbies
     set status = 'locked', locked_game_id = v_winner
   where id = p_lobby;

  insert into public.lobby_messages (lobby_id, kind, body)
  values (p_lobby, 'system',
    'Vote locked · ' || (select title from public.catalog_games where id = v_winner));

  return v_winner;
end;
$$;

create or replace function public.send_message(p_lobby uuid, p_body text)
returns public.lobby_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row    public.lobby_messages;
  v_recent int;
begin
  if not public.is_lobby_member(p_lobby) then
    raise exception 'Join the lobby first' using errcode = '42501';
  end if;

  -- simple server-side rate limit: 8 messages per 20 seconds
  select count(*) into v_recent
    from public.lobby_messages
   where lobby_id = p_lobby
     and user_id = auth.uid()
     and created_at > now() - interval '20 seconds';
  if v_recent >= 8 then
    raise exception 'Slow down a little' using errcode = '54001';
  end if;

  if exists (
    select 1 from public.blocked_users b
    join public.lobby_members m on m.user_id = b.user_id
    where b.blocked_id = auth.uid() and m.lobby_id = p_lobby
  ) then
    raise exception 'You cannot post in this lobby' using errcode = '42501';
  end if;

  insert into public.lobby_messages (lobby_id, user_id, body)
  values (p_lobby, auth.uid(), trim(p_body))
  returning * into v_row;

  return v_row;
end;
$$;

-- Server-side reward pipeline: the only writer of xp / stats.
create or replace function public.award_xp(
  p_user uuid,
  p_kind text,
  p_ref text,
  p_amount int
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean := false;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 500 then
    raise exception 'Invalid reward amount' using errcode = '22023';
  end if;

  insert into public.xp_events (user_id, kind, ref, amount)
  values (p_user, p_kind, p_ref, p_amount)
  on conflict (user_id, kind, ref) do nothing;
  v_inserted := found;

  if not v_inserted then
    return 0;  -- already paid out for this activity
  end if;

  perform set_config('lobbylegends.stats_write', 'on', true);

  update public.profiles
     set xp = xp + p_amount,
         weekly_xp = case
           when week_key = to_char(now(), 'IYYY-"W"IW') then weekly_xp + p_amount
           else p_amount
         end,
         week_key = to_char(now(), 'IYYY-"W"IW')
   where id = p_user;

  return p_amount;
end;
$$;

revoke all on function public.award_xp(uuid, text, text, int) from anon, authenticated;

-- Self-reported match logging (the user is the source, which is stated in the UI).
create or replace function public.log_match(
  p_game text,
  p_outcome text,
  p_score text default null,
  p_mode text default null,
  p_opponent text default null
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.matches;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_outcome not in ('win', 'loss') then
    raise exception 'Outcome must be win or loss' using errcode = '22023';
  end if;

  insert into public.matches (user_id, game_id, outcome, score, mode, opponent)
  values (auth.uid(), p_game, p_outcome, left(p_score, 32), left(p_mode, 32), left(p_opponent, 32))
  returning * into v_row;

  perform set_config('lobbylegends.stats_write', 'on', true);
  update public.profiles
     set wins = wins + case when p_outcome = 'win' then 1 else 0 end,
         losses = losses + case when p_outcome = 'loss' then 1 else 0 end,
         games_played = games_played + 1
   where id = auth.uid();

  perform public.award_xp(auth.uid(), 'match', v_row.id::text,
    case when p_outcome = 'win' then 60 else 20 end);

  return v_row;
end;
$$;

create or replace function public.complete_challenge(
  p_challenge text,
  p_difficulty text,
  p_xp int
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cap int := case p_difficulty
                 when 'easy' then 60 when 'medium' then 120
                 when 'hard' then 200 when 'insane' then 300 else 40 end;
  v_xp int := least(greatest(coalesce(p_xp, 40), 1), v_cap);
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into public.challenge_completions (user_id, challenge_id, difficulty, xp)
  values (auth.uid(), left(p_challenge, 80), p_difficulty, v_xp)
  on conflict do nothing;

  if not found then
    return 0;  -- already completed today
  end if;

  return public.award_xp(auth.uid(), 'challenge', p_challenge || ':' || current_date, v_xp);
end;
$$;

-- Tournament match reporting: only seated players may report, and only
-- when the match is actually ready.
create or replace function public.report_tournament_match(
  p_match uuid,
  p_score_a int,
  p_score_b int
)
returns public.tournament_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match   public.tournament_matches;
  v_winner  uuid;
begin
  select * into v_match from public.tournament_matches where id = p_match for update;
  if v_match.id is null then
    raise exception 'Unknown match' using errcode = 'P0002';
  end if;
  if v_match.player_a is null or v_match.player_b is null then
    raise exception 'Players are not decided yet' using errcode = '22023';
  end if;
  if auth.uid() not in (v_match.player_a, v_match.player_b) then
    raise exception 'Only the two players can report this match' using errcode = '42501';
  end if;
  if p_score_a is null or p_score_b is null or p_score_a = p_score_b then
    raise exception 'Scores must differ' using errcode = '22023';
  end if;

  v_winner := case when p_score_a > p_score_b then v_match.player_a else v_match.player_b end;

  if v_match.status = 'reported' and v_match.reported_by = auth.uid() then
    raise exception 'Waiting on your opponent to confirm' using errcode = '22023';
  end if;

  if v_match.status = 'reported' then
    if v_match.reported_by <> auth.uid()
       and (v_match.score_a <> p_score_a or v_match.score_b <> p_score_b) then
      update public.tournament_matches set status = 'disputed' where id = p_match;
      raise exception 'Scores disagree — match marked as disputed' using errcode = 'P0004';
    end if;
    update public.tournament_matches
       set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now(),
           winner_id = v_winner
     where id = p_match
     returning * into v_match;
  else
    update public.tournament_matches
       set score_a = p_score_a, score_b = p_score_b,
           status = 'reported', reported_by = auth.uid(), reported_at = now()
     where id = p_match
     returning * into v_match;
  end if;

  if v_match.status = 'confirmed' then
    perform public.advance_bracket(v_match.tournament_id);
  end if;

  return v_match;
end;
$$;

-- Push a confirmed winner into the next round and settle the final.
create or replace function public.advance_bracket(p_tournament uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next   public.tournament_matches;
  v_final  public.tournament_matches;
  v_champ  uuid;
begin
  for v_next in
    select * from public.tournament_matches
     where tournament_id = p_tournament and status = 'confirmed'
     order by round, slot
  loop
    update public.tournament_matches n
       set player_a = case when v_next.slot % 2 = 0 then v_next.winner_id else n.player_a end,
           player_b = case when v_next.slot % 2 = 1 then v_next.winner_id else n.player_b end
     where n.tournament_id = p_tournament
       and n.round = v_next.round + 1
       and n.slot = floor(v_next.slot / 2)::int;
  end loop;

  select * into v_final from public.tournament_matches
   where tournament_id = p_tournament
   order by round desc, slot
   limit 1;

  if v_final.status = 'confirmed' and v_final.winner_id is not null then
    v_champ := v_final.winner_id;
    update public.tournaments
       set status = 'complete',
           champion_id = v_champ,
           runner_up_id = case when v_final.winner_id = v_final.player_a
                               then v_final.player_b else v_final.player_a end,
           completed_at = now()
     where id = p_tournament and status <> 'complete';

    if found then
      perform public.award_xp(v_champ, 'tournament', p_tournament::text, 500);
    end if;
  end if;
end;
$$;

-- Party games: submit an answer, score it on the server, advance the round.
create or replace function public.submit_party_answer(
  p_session uuid,
  p_answer jsonb
)
returns public.party_answers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session  public.party_sessions;
  v_row      public.party_answers;
  v_expected text;
  v_correct  boolean;
  v_points   integer := 0;
begin
  select * into v_session from public.party_sessions where id = p_session for update;
  if v_session.id is null then
    raise exception 'Unknown session' using errcode = 'P0002';
  end if;
  if v_session.status <> 'active' then
    raise exception 'That round is not open' using errcode = '22023';
  end if;
  if not public.is_lobby_member(v_session.lobby_id) then
    raise exception 'Join the lobby first' using errcode = '42501';
  end if;

  -- The expected answer is read from the locked-down party_secrets table, never
  -- from anything the client is allowed to select.
  select expected into v_expected
    from public.party_secrets
   where session_id = p_session and round = v_session.round;

  v_correct := v_expected is not null and coalesce(p_answer->>'answer', '') = v_expected;

  if v_correct then
    v_points := coalesce((v_session.state->>'points')::int, 100);
  end if;

  insert into public.party_answers (session_id, user_id, round, answer, is_correct, points)
  values (p_session, auth.uid(), v_session.round, p_answer, v_correct, v_points)
  on conflict (session_id, user_id, round) do nothing;

  if not found then
    raise exception 'You already answered this round' using errcode = '22023';
  end if;

  select * into v_row from public.party_answers
   where session_id = p_session and user_id = auth.uid() and round = v_session.round;

  if v_correct then
    perform public.award_xp(auth.uid(), 'party_game',
      p_session::text || ':' || v_session.round::text, greatest(v_points, 1));
  end if;

  return v_row;
end;
$$;

-- Claims / relaxes table privileges for the RPC surface.
grant execute on function public.create_lobby(text, text, int, text[]) to authenticated;
grant execute on function public.join_lobby(text) to authenticated;
grant execute on function public.set_ready(uuid, boolean) to authenticated;
grant execute on function public.leave_lobby(uuid) to authenticated;
grant execute on function public.kick_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_host(uuid, uuid) to authenticated;
grant execute on function public.close_lobby(uuid) to authenticated;
grant execute on function public.nominate_game(uuid, text) to authenticated;
grant execute on function public.cast_vote(uuid, text) to authenticated;
grant execute on function public.finalize_vote(uuid) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.log_match(text, text, text, text, text) to authenticated;
grant execute on function public.complete_challenge(text, text, int) to authenticated;
grant execute on function public.report_tournament_match(uuid, int, int) to authenticated;
grant execute on function public.submit_party_answer(uuid, jsonb) to authenticated;
grant execute on function public.is_lobby_member(uuid) to authenticated;
grant execute on function public.is_lobby_host(uuid) to authenticated;

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table public.lobby_members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.lobbies;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.lobby_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.lobby_votes;
  exception when duplicate_object when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.lobby_nominations;
  exception when duplicate_object when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.party_sessions;
  exception when duplicate_object when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.tournament_matches;
  exception when duplicate_object when others then null;
  end;
end;
$$;
