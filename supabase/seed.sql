-- ============================================================
-- Lobby Legends 2.0 — starter game catalog
-- ============================================================
-- Curated, factual rows only:
--   * platforms, player counts and session lengths are the commonly
--     documented ones for each title;
--   * official_url points at the publisher's own page;
--   * price_note is set only where the title is free to play. Every
--     other price is deliberately NULL rather than guessed.
--
-- Run after supabase/schema.sql. Safe to re-run.
-- ============================================================

insert into public.catalog_games
  (id, title, description, category, platforms, min_players, max_players, minutes, tags, official_url, price_note)
values
  ('fortnite', 'Fortnite', 'Last-player-standing battle royale with building and a rotating item pool.', 'Battle Royale',
   array['pc','playstation','xbox','switch','mobile'], 1, 4, 25, array['competitive','squad','free'], 'https://www.fortnite.com/', 'Free to play'),

  ('minecraft', 'Minecraft', 'Block sandbox with survival, creative and multiplayer servers.', 'Sandbox',
   array['pc','playstation','xbox','switch','mobile'], 1, 8, 60, array['co-op','creative','long-session'], 'https://www.minecraft.net/', null),

  ('roblox', 'Roblox', 'Platform of thousands of player-made games across every genre.', 'Sandbox',
   array['pc','playstation','xbox','mobile'], 1, 8, 30, array['free','party','variety'], 'https://www.roblox.com/', 'Free to play'),

  ('rocket-league', 'Rocket League', 'Car football: five minutes, two goals, endless grudges.', 'Sports',
   array['pc','playstation','xbox','switch'], 1, 4, 15, array['competitive','short','team'], 'https://www.rocketleague.com/', 'Free to play'),

  ('cod', 'Call of Duty', 'Arena shooters and battle royale in one launcher.', 'Shooter',
   array['pc','playstation','xbox'], 1, 4, 30, array['competitive','squad'], 'https://www.callofduty.com/', null),

  ('gta', 'Grand Theft Auto Online', 'Open-world crime sandbox with heists and races.', 'Open World',
   array['pc','playstation','xbox'], 1, 8, 60, array['co-op','long-session','chaos'], 'https://www.rockstargames.com/gta-online', null),

  ('valorant', 'Valorant', 'Tactical five-versus-five round-based shooter.', 'Shooter',
   array['pc'], 1, 5, 40, array['competitive','team','tactical'], 'https://playvalorant.com/', 'Free to play'),

  ('apex-legends', 'Apex Legends', 'Squad battle royale built around movement and abilities.', 'Battle Royale',
   array['pc','playstation','xbox','switch'], 1, 3, 30, array['competitive','squad','free'], 'https://www.ea.com/games/apex-legends', 'Free to play'),

  ('overwatch', 'Overwatch 2', 'Role-based five-versus-five hero shooter.', 'Shooter',
   array['pc','playstation','xbox','switch'], 1, 5, 20, array['competitive','team','free'], 'https://overwatch.blizzard.com/', 'Free to play'),

  ('among-us', 'Among Us', 'Social deduction: find the impostor or get away with it.', 'Social Deduction',
   array['pc','mobile','switch'], 4, 10, 20, array['party','social','short'], 'https://www.innersloth.com/games/among-us/', null),

  ('fall-guys', 'Fall Guys', 'Crowded obstacle-course knockout party game.', 'Party',
   array['pc','playstation','xbox','switch'], 1, 4, 20, array['party','casual','free'], 'https://www.fallguys.com/', 'Free to play'),

  ('helldivers', 'Helldivers 2', 'Four-player co-op against overwhelming odds and your own airstrikes.', 'Co-op',
   array['pc','playstation'], 1, 4, 40, array['co-op','chaos'], 'https://www.playstation.com/games/helldivers-2/', null),

  ('ea-fc', 'EA SPORTS FC', 'Football with clubs, ultimate team and couch matches.', 'Sports',
   array['pc','playstation','xbox'], 1, 4, 20, array['competitive','sports','short'], 'https://www.ea.com/games/ea-sports-fc', null),

  ('mario-kart', 'Mario Kart 8 Deluxe', 'Kart racing with items, shortcuts and blue-shell grudges.', 'Racing',
   array['switch'], 1, 8, 20, array['party','competitive','local'], 'https://www.nintendo.com/us/store/products/mario-kart-8-deluxe-switch/', null),

  ('smash', 'Super Smash Bros. Ultimate', 'Platform fighter with the whole guest list.', 'Fighting',
   array['switch'], 1, 8, 20, array['competitive','party','local'], 'https://www.smashbros.com/', null),

  ('r6-siege', 'Rainbow Six Siege', 'Destructible, round-based tactical shooter.', 'Shooter',
   array['pc','playstation','xbox'], 1, 5, 30, array['competitive','tactical','team'], 'https://www.ubisoft.com/en-us/game/rainbow-six/siege', null),

  ('destiny', 'Destiny 2', 'Shared-world shooter with raids, dungeons and loot.', 'Shooter',
   array['pc','playstation','xbox'], 1, 6, 60, array['co-op','long-session','free'], 'https://www.bungie.net/7/en/Destiny', 'Free to play'),

  ('elden-ring', 'Elden Ring', 'Open-world action RPG with co-op summoning.', 'Action RPG',
   array['pc','playstation','xbox'], 1, 3, 90, array['co-op','long-session','hard'], 'https://en.bandainamcoent.eu/elden-ring/elden-ring', null),

  ('balatro', 'Balatro', 'Poker roguelike about breaking the score, not the bank.', 'Roguelike',
   array['pc','switch','mobile'], 1, 1, 45, array['solo','short'], 'https://www.playbalatro.com/', null),

  ('stardew', 'Stardew Valley', 'Farm, fish and co-op your way through the seasons.', 'Cozy',
   array['pc','playstation','xbox','switch','mobile'], 1, 8, 90, array['co-op','cozy','long-session'], 'https://www.stardewvalley.net/', null),

  ('deep-rock', 'Deep Rock Galactic', 'Four space dwarves, one cave, lots of bugs.', 'Co-op',
   array['pc','playstation','xbox'], 1, 4, 45, array['co-op','chaos'], 'https://www.deeprockgalactic.com/', null),

  ('jackbox', 'Jackbox Party Pack', 'Trivia and drawing party games where phones are the controllers.', 'Party',
   array['pc','playstation','xbox','switch'], 4, 10, 30, array['party','social','local'], 'https://www.jackboxgames.com/', null),

  ('terraria', 'Terraria', 'Two-dimensional sandbox of building, bosses and digging too deep.', 'Sandbox',
   array['pc','playstation','xbox','switch','mobile'], 1, 8, 60, array['co-op','creative','long-session'], 'https://terraria.org/', null),

  ('sea-of-thieves', 'Sea of Thieves', 'Shared-world piracy: sail, dig, betray, repeat.', 'Adventure',
   array['pc','playstation','xbox'], 1, 4, 60, array['co-op','pvp','long-session'], 'https://www.seaofthieves.com/', null)
on conflict (id) do nothing;

-- The catalogue rows above are public reference data: no owner.
update public.catalog_games set added_by = null where id in (
  'fortnite','minecraft','roblox','rocket-league','cod','gta','valorant','apex-legends',
  'overwatch','among-us','fall-guys','helldivers','ea-fc','mario-kart','smash','r6-siege',
  'destiny','elden-ring','balatro','stardew','deep-rock','jackbox','terraria','sea-of-thieves'
);
