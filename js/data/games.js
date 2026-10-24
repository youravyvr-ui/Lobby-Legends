/* ============================================================
   Lobby Legends — game catalogue + filter vocabulary
   ============================================================ */
(function () {
  const LL = (window.LL = window.LL || {});

  LL.platforms = [
    { id: "pc", label: "PC" },
    { id: "playstation", label: "PlayStation" },
    { id: "xbox", label: "Xbox" },
    { id: "switch", label: "Switch" },
    { id: "mobile", label: "Mobile" }
  ];

  LL.platformLabel = function (id) {
    const found = LL.platforms.find(function (p) {
      return p.id === id;
    });
    return found ? found.label : id;
  };

  LL.games = [
    {
      id: "fortnite",
      name: "Fortnite",
      emoji: "🏗️",
      genre: "Battle Royale",
      platforms: ["pc", "playstation", "xbox", "switch", "mobile"],
      min: 1,
      max: 4,
      minutes: 25,
      hue: 265
    },
    {
      id: "minecraft",
      name: "Minecraft",
      emoji: "⛏️",
      genre: "Sandbox",
      platforms: ["pc", "playstation", "xbox", "switch", "mobile"],
      min: 1,
      max: 8,
      minutes: 60,
      hue: 118
    },
    {
      id: "roblox",
      name: "Roblox",
      emoji: "🧱",
      genre: "Sandbox",
      platforms: ["pc", "playstation", "xbox", "mobile"],
      min: 1,
      max: 8,
      minutes: 30,
      hue: 5
    },
    {
      id: "rocket-league",
      name: "Rocket League",
      emoji: "🚀",
      genre: "Sports",
      platforms: ["pc", "playstation", "xbox", "switch"],
      min: 1,
      max: 4,
      minutes: 15,
      hue: 200
    },
    {
      id: "cod",
      name: "Call of Duty",
      emoji: "🎯",
      genre: "Shooter",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 4,
      minutes: 30,
      hue: 40
    },
    {
      id: "gta",
      name: "Grand Theft Auto Online",
      emoji: "🚗",
      genre: "Open World",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 8,
      minutes: 60,
      hue: 152
    },
    {
      id: "valorant",
      name: "Valorant",
      emoji: "🔫",
      genre: "Shooter",
      platforms: ["pc"],
      min: 1,
      max: 5,
      minutes: 40,
      hue: 350
    },
    {
      id: "apex-legends",
      name: "Apex Legends",
      emoji: "🛰️",
      genre: "Battle Royale",
      platforms: ["pc", "playstation", "xbox", "switch"],
      min: 1,
      max: 3,
      minutes: 30,
      hue: 12
    },
    {
      id: "overwatch",
      name: "Overwatch 2",
      emoji: "🛡️",
      genre: "Shooter",
      platforms: ["pc", "playstation", "xbox", "switch"],
      min: 1,
      max: 5,
      minutes: 20,
      hue: 28
    },
    {
      id: "among-us",
      name: "Among Us",
      emoji: "🛸",
      genre: "Social Deduction",
      platforms: ["pc", "mobile", "switch"],
      min: 4,
      max: 10,
      minutes: 20,
      hue: 280
    },
    {
      id: "fall-guys",
      name: "Fall Guys",
      emoji: "🫧",
      genre: "Party",
      platforms: ["pc", "playstation", "xbox", "switch"],
      min: 1,
      max: 4,
      minutes: 20,
      hue: 320
    },
    {
      id: "helldivers",
      name: "Helldivers 2",
      emoji: "🪖",
      genre: "Co-op",
      platforms: ["pc", "playstation"],
      min: 1,
      max: 4,
      minutes: 40,
      hue: 48
    },
    {
      id: "ea-fc",
      name: "EA SPORTS FC",
      emoji: "⚽",
      genre: "Sports",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 4,
      minutes: 20,
      hue: 105
    },
    {
      id: "mario-kart",
      name: "Mario Kart 8 Deluxe",
      emoji: "🏁",
      genre: "Racing",
      platforms: ["switch"],
      min: 1,
      max: 8,
      minutes: 20,
      hue: 210
    },
    {
      id: "smash",
      name: "Super Smash Bros. Ultimate",
      emoji: "🥊",
      genre: "Fighting",
      platforms: ["switch"],
      min: 1,
      max: 8,
      minutes: 20,
      hue: 355
    },
    {
      id: "r6-siege",
      name: "Rainbow Six Siege",
      emoji: "🧰",
      genre: "Shooter",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 5,
      minutes: 30,
      hue: 190
    },
    {
      id: "destiny",
      name: "Destiny 2",
      emoji: "🌌",
      genre: "Shooter",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 6,
      minutes: 60,
      hue: 250
    },
    {
      id: "elden-ring",
      name: "Elden Ring",
      emoji: "⚔️",
      genre: "Action RPG",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 3,
      minutes: 90,
      hue: 42
    },
    {
      id: "balatro",
      name: "Balatro",
      emoji: "🃏",
      genre: "Roguelike",
      platforms: ["pc", "switch", "mobile"],
      min: 1,
      max: 1,
      minutes: 45,
      hue: 340
    },
    {
      id: "stardew",
      name: "Stardew Valley",
      emoji: "🌾",
      genre: "Cozy",
      platforms: ["pc", "playstation", "xbox", "switch", "mobile"],
      min: 1,
      max: 8,
      minutes: 90,
      hue: 85
    },
    {
      id: "deep-rock",
      name: "Deep Rock Galactic",
      emoji: "🪨",
      genre: "Co-op",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 4,
      minutes: 45,
      hue: 30
    },
    {
      id: "jackbox",
      name: "Jackbox Party Pack",
      emoji: "🎤",
      genre: "Party",
      platforms: ["pc", "playstation", "xbox", "switch"],
      min: 4,
      max: 10,
      minutes: 30,
      hue: 285
    },
    {
      id: "terraria",
      name: "Terraria",
      emoji: "🌳",
      genre: "Sandbox",
      platforms: ["pc", "playstation", "xbox", "switch", "mobile"],
      min: 1,
      max: 8,
      minutes: 60,
      hue: 140
    },
    {
      id: "sea-of-thieves",
      name: "Sea of Thieves",
      emoji: "🏴‍☠️",
      genre: "Adventure",
      platforms: ["pc", "playstation", "xbox"],
      min: 1,
      max: 4,
      minutes: 60,
      hue: 195
    }
  ];

  LL.genres = LL.games
    .map(function (g) {
      return g.genre;
    })
    .filter(function (genre, i, all) {
      return all.indexOf(genre) === i;
    })
    .sort();

  LL.playerBuckets = [
    { id: "any", label: "Anyone", min: 1 },
    { id: "2", label: "2+ players", min: 2 },
    { id: "4", label: "4+ players", min: 4 },
    { id: "8", label: "8+ players", min: 8 }
  ];

  LL.timeBuckets = [
    { id: "any", label: "Any length", min: 0, max: 999 },
    { id: "quick", label: "Under 25m", min: 0, max: 25 },
    { id: "standard", label: "25–45m", min: 26, max: 45 },
    { id: "long", label: "45m+", min: 46, max: 999 }
  ];

  /* Default games every new player starts with in their library. */
  LL.starterLibrary = [
    "fortnite",
    "rocket-league",
    "valorant",
    "minecraft",
    "among-us",
    "fall-guys",
    "apex-legends",
    "cod"
  ];
})();
