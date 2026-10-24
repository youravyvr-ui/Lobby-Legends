/* ============================================================
   Lobby Legends — sample squad + first-run state
   Everything here lives on this device only. Nothing is fetched.
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const SEED = (LL.seed = {});
  const DAY = 86400000;
  const now = Date.now();

  /* ---------- the friend group (clearly local sample data) ---------- */

  SEED.FRIENDS = [
    {
      id: "nova",
      name: "Nova",
      avatar: "🦊",
      xp: 11200,
      weeklyXp: 890,
      wins: 61,
      losses: 38,
      challenges: 19,
      tournaments: 2,
      tagline: "Support main. Shot caller. Will remind you about it."
    },
    {
      id: "kryptic",
      name: "Kryptic",
      avatar: "👾",
      xp: 9400,
      weeklyXp: 520,
      wins: 48,
      losses: 34,
      challenges: 15,
      tournaments: 1,
      tagline: "Clutch or kick."
    },
    {
      id: "bubblez",
      name: "Bubblez",
      emoji: "🫧",
      avatar: "🫧",
      xp: 8100,
      weeklyXp: 1240,
      wins: 44,
      losses: 41,
      challenges: 22,
      tournaments: 0,
      tagline: "Chaos specialist. Has never rotated once."
    },
    {
      id: "fenn",
      name: "Fenn",
      avatar: "🐺",
      xp: 5600,
      weeklyXp: 300,
      wins: 33,
      losses: 30,
      challenges: 12,
      tournaments: 1,
      tagline: "Undefeated in 1v1s that nobody watched."
    },
    {
      id: "rage",
      name: "Rage",
      avatar: "🔥",
      xp: 4300,
      weeklyXp: 760,
      wins: 29,
      losses: 44,
      challenges: 9,
      tournaments: 0,
      tagline: "All aim, no plan."
    },
    {
      id: "miko",
      name: "Miko",
      emoji: "🌊",
      avatar: "🌊",
      xp: 2900,
      weeklyXp: 410,
      wins: 21,
      losses: 25,
      challenges: 14,
      tournaments: 0,
      tagline: "Healer by trade. Still dies first."
    },
    {
      id: "zed",
      name: "Zed",
      avatar: "🛸",
      xp: 1500,
      weeklyXp: 180,
      wins: 12,
      losses: 30,
      challenges: 6,
      tournaments: 0,
      tagline: "New here. Already farming XP."
    }
  ];

  SEED.EMOJIS = ["🦈", "🦊", "🐺", "👾", "🎮", "🧠", "⚡", "🔥", "🛸", "🦅", "🐙", "🎯", "💀", "🌊", "🍕", "🚀", "🕹️", "🥊", "🫧", "👑", "🐉", "🌙"];

  /* ---------------- joinable demo lobbies ---------------- */

  SEED.JOINABLE = [
    {
      id: "lb_party",
      code: "SQUAD1",
      name: "Bubblez Party Bus",
      ownerId: "bubblez",
      pool: ["among-us", "jackbox", "fall-guys"],
      status: "open",
      votes: { miko: "jackbox" },
      voteStarted: null,
      members: [
        { id: "bubblez", ready: true, joinedAt: Date.now() - 1800000 },
        { id: "miko", ready: true, joinedAt: Date.now() - 1500000 },
        { id: "zed", ready: false, joinedAt: Date.now() - 900000 }
      ],
      messages: [
        { id: "m1", system: true, text: "Lobby created by Bubblez", at: Date.now() - 1800000 },
        { id: "m2", who: "bubblez", text: "Party bus leaves in 10. Bring snacks (in your own house).", at: Date.now() - 1200000 }
      ],
      createdAt: Date.now() - 1800000
    }
  ];

  /* ---------------- tournaments ---------------- */

  function makeTournament(id, name, gameId, participants, createdAt) {
    return {
      id: id,
      name: name,
      gameId: gameId,
      size: participants.length,
      participants: participants.slice(),
      rounds: U.buildRounds(participants, id),
      status: "active",
      champion: null,
      runnerUp: null,
      createdAt: createdAt,
      completedAt: null
    };
  }

  function finalMatch(t) {
    return t.rounds[t.rounds.length - 1].matches[0];
  }

  function finishTournament(t) {
    const last = finalMatch(t);
    if (!last || !last.winner) return t;
    t.status = "complete";
    t.champion = last.winner;
    t.runnerUp = last.winner === last.a ? last.b : last.a;
    return t;
  }

  function buildTournaments() {
    const cup = makeTournament("t_cup", "Friday Night Cup", "rocket-league", ["me", "nova", "kryptic", "bubblez"], now - 6 * DAY);
    U.setResult(cup.rounds, 0, 0, 3, 1);
    U.setResult(cup.rounds, 0, 1, 0, 2);
    U.setResult(cup.rounds, 1, 0, 4, 2);
    finishTournament(cup);
    cup.completedAt = now - 6 * DAY + 5400000;
    cup.awarded = true;

    const gauntlet = makeTournament(
      "t_gauntlet",
      "Valorant Gauntlet",
      "valorant",
      ["me", "zed", "nova", "miko", "kryptic", "fenn", "bubblez", "rage"],
      now - 2 * DAY
    );
    U.setResult(gauntlet.rounds, 0, 0, 13, 5);
    U.setResult(gauntlet.rounds, 0, 1, 13, 9);
    U.setResult(gauntlet.rounds, 0, 2, 11, 13);
    U.setResult(gauntlet.rounds, 0, 3, 13, 7);
    U.setResult(gauntlet.rounds, 1, 0, 13, 11);
    return [gauntlet, cup];
  }

  /* ---------------- lobbies ---------------- */

  function buildLobbies() {
    return [
      {
        id: "lb_chaos",
        code: "CHAOS7",
        name: "Friday Night Chaos",
        ownerId: "me",
        pool: ["fortnite", "fall-guys", "among-us", "rocket-league"],
        status: "voting",
        votes: { nova: "among-us", kryptic: "fall-guys", bubblez: "among-us" },
        voteStarted: now - 9 * 60000,
        lockedGame: null,
        members: [
          { id: "me", ready: true, joinedAt: now - 3 * 3600000 },
          { id: "nova", ready: true, joinedAt: now - 2.9 * 3600000 },
          { id: "kryptic", ready: false, joinedAt: now - 2.4 * 3600000 },
          { id: "bubblez", ready: true, joinedAt: now - 1.2 * 3600000 }
        ],
        messages: [
          { id: "c1", system: true, text: "Lobby created · invite code CHAOS7", at: now - 3 * 3600000 },
          { id: "c2", who: "nova", text: "I'm in. Who's actually awake tonight?", at: now - 2.8 * 3600000 },
          { id: "c3", who: "bubblez", text: "I never sleep, I just respawn", at: now - 1.1 * 3600000 },
          { id: "c4", system: true, text: "Game vote started · 4 options on the table", at: now - 600000 }
        ],
        createdAt: now - 3 * 3600000
      },
      {
        id: "lb_ranked",
        code: "RANK99",
        name: "Late Night Ranked",
        ownerId: "kryptic",
        pool: ["valorant", "apex-legends", "cod"],
        status: "open",
        votes: {},
        voteStarted: null,
        lockedGame: null,
        members: [
          { id: "kryptic", ready: true, joinedAt: now - 26 * 3600000 },
          { id: "me", ready: false, joinedAt: now - 25 * 3600000 },
          { id: "fenn", ready: false, joinedAt: now - 4 * 3600000 }
        ],
        messages: [
          { id: "r1", system: true, text: "Lobby created · invite code RANK99", at: now - 26 * 3600000 },
          { id: "r2", who: "kryptic", text: "Two more for ranked, no ego allowed (looking at you)", at: now - 3 * 3600000 }
        ],
        createdAt: now - 26 * 3600000
      }
    ];
  }

  /* ---------------- matches + challenge log ---------------- */

  function buildMatches() {
    return [
      { id: "mt1", gameId: "valorant", outcome: "win", score: "13–9", mode: "Competitive", opponent: "Kryptic", at: now - 2 * 3600000, xp: 60 },
      { id: "mt2", gameId: "rocket-league", outcome: "win", score: "4–2", mode: "Doubles", opponent: "Nova & Fenn", at: now - 26 * 3600000, xp: 60 },
      { id: "mt3", gameId: "fortnite", outcome: "loss", score: "12th of 25", mode: "Squads", opponent: "Lobby Legends", at: now - 2 * DAY, xp: 20 },
      { id: "mt4", gameId: "among-us", outcome: "loss", score: "Impostor won", mode: "Skeld · 8 players", opponent: "Bubblez", at: now - 3 * DAY, xp: 20 },
      { id: "mt5", gameId: "fall-guys", outcome: "win", score: "1st", mode: "Squads", opponent: "Random lobby", at: now - 4 * DAY, xp: 60 },
      { id: "mt6", gameId: "cod", outcome: "win", score: "38–31", mode: "Team Deathmatch", opponent: "Rage", at: now - 5 * DAY, xp: 60 }
    ];
  }

  function buildChallengeLog() {
    return [
      {
        id: "cl1",
        title: "Clutch Merchant",
        text: "Win a 1v2 clutch round in Valorant.",
        gameId: "valorant",
        category: "competitive",
        difficulty: "hard",
        xp: 160,
        custom: false,
        completedAt: now - DAY
      },
      {
        id: "cl2",
        gameId: "minecraft",
        title: "Creeper Tax",
        text: "Survive an entire Minecraft night without taking a single mob hit.",
        category: "survival",
        difficulty: "medium",
        xp: 90,
        custom: false,
        completedAt: now - 3 * DAY
      },
      {
        id: "cl3",
        gameId: "among-us",
        title: "Silent Crew",
        text: "Complete three tasks in Among Us without speaking at all.",
        category: "survival",
        difficulty: "easy",
        xp: 40,
        custom: false,
        completedAt: now - 5 * DAY
      }
    ];
  }

  /* ---------------- full first-run state ---------------- */

  SEED.build = function () {
    const lobbies = buildLobbies();
    const tournaments = buildTournaments();
    const yesterday = new Date(Date.now() - DAY);

    const activeChallenge = LL.challenges.generate({
      gameId: "fortnite",
      difficulty: "medium",
      category: "teamwork"
    });

    return {
      version: 1,
      createdAt: Date.now(),
      profile: {
        name: "PixelPilot",
        avatar: "🦈",
        accent: "neon",
        bio: "Entry fragger. Lobby wizard. Will absolutely lose to you in Rocket League and talk about it for a week.",
        region: "EU-West",
        favoriteGames: ["fortnite", "rocket-league", "valorant"],
        frame: "neon"
      },
      xp: 7480,
      weeklyXp: 640,
      weekKey: U.weekKey(),
      streak: 6,
      lastActive: U.dayKey(yesterday),
      stats: {
        wins: 34,
        losses: 21,
        challenges: 12,
        tournaments: 1,
        spins: 3,
        lobbies: 2,
        rivalries: 2
      },
      achievements: [],
      settings: {
        theme: "midnight",
        reduceMotion: false,
        highContrast: false,
        largeText: false,
        sound: true,
        privacy: {
          showStats: true,
          allowInvites: true,
          showHistory: true,
          appearInLeaderboard: true
        },
        notifications: {
          lobbyInvites: true,
          tournamentUpdates: true,
          dailyChallenge: true
        }
      },
      library: LL.starterLibrary.slice(),
      customGames: [],
      lobbies: lobbies,
      activeChallenge: activeChallenge,
      challengeLog: buildChallengeLog(),
      customChallenges: [],
      tournaments: tournaments,
      matches: buildMatches(),
      rivalries: [
        { friendId: "nova", wins: 3, losses: 5, since: now - 40 * DAY },
        { friendId: "kryptic", wins: 6, losses: 2, since: now - 20 * DAY }
      ],
      squadVote: {
        options: ["rocket-league", "fall-guys", "among-us"],
        votes: { nova: "fall-guys", bubblez: "among-us" },
        round: 1,
        startedAt: now - 600000
      },
      premium: { demo: false, plan: null, since: null }
    };
  };

  /* Canned lines the demo "friends" use when they reply locally. */
  SEED.REPLIES = [
    "gg, that was clean",
    "I'm ready, who's hosting?",
    "give me 2 minutes, loading in",
    "that was NOT my fault",
    "one more round, I swear",
    "I'm calling it after this one",
    "clip it, send it, no context",
    "who picked this game again",
    "I have the strat, trust me",
    "my ping is doing gymnastics"
  ];

  SEED.READY_LINES = ["I'm in, ready when you are", "ready", "loading in, 30s", "let's gooo"];
})();
