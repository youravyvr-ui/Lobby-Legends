/* ============================================================
   Lobby Legends — challenge generator
   All challenges are in-game only: nothing costs money and
   nothing asks anyone to do anything risky in real life.
   ============================================================ */
(function () {
  const LL = (window.LL = window.LL || {});
  const C = (LL.challenges = {});
  const U = LL.utils;

  C.difficulties = [
    { id: "easy", label: "Easy", xp: 40, tone: "blue", order: 0 },
    { id: "medium", label: "Medium", xp: 90, tone: "neon", order: 1 },
    { id: "hard", label: "Hard", xp: 160, tone: "orange", order: 2 },
    { id: "insane", label: "Insane", xp: 300, tone: "red", order: 3 }
  ];

  C.categories = [
    { id: "skill", label: "Skill", icon: "target" },
    { id: "funny", label: "Funny", icon: "sparkles" },
    { id: "teamwork", label: "Teamwork", icon: "users" },
    { id: "survival", label: "Survival", icon: "shield" },
    { id: "competitive", label: "Competitive", icon: "trophy" }
  ];

  C.difficulty = function (id) {
    return C.difficulties.find(function (d) {
      return d.id === id;
    }) || C.difficulties[0];
  };

  C.category = function (id) {
    return C.categories.find(function (c) {
      return c.id === id;
    }) || C.categories[0];
  };

  const NUMBERS = { easy: 2, medium: 3, hard: 5, insane: 7 };

  const GENERIC = [
    { cat: "skill", min: "easy", title: "Clean Sheet", text: "Finish a {game} match with a positive kill/death spread." },
    { cat: "skill", min: "medium", title: "Precision Run", text: "Land {n} clean eliminations in a single {game} match." },
    { cat: "skill", min: "hard", title: "Consistent Contender", text: "Finish in the top {n} in three straight {game} matches." },
    { cat: "skill", min: "insane", title: "Unstoppable", text: "Win {n} {game} matches in a row without changing your team." },

    { cat: "funny", min: "easy", title: "Weapon of Shame", text: "Play a full {game} match using only your least favourite weapon or character." },
    { cat: "funny", min: "easy", title: "Live Commentary", text: "Narrate everything you do in {game} out loud for one whole match." },
    { cat: "funny", min: "medium", title: "Nickname Protocol", text: "Give every squadmate a dramatic nickname in {game} and use only that name for a match." },
    { cat: "funny", min: "hard", title: "Accent Run", text: "Win a {game} match while speaking in a ridiculous accent the whole time." },

    { cat: "teamwork", min: "easy", title: "Feeding Frenzy", text: "Help a squadmate get at least {n} eliminations in one {game} match." },
    { cat: "teamwork", min: "medium", title: "Glue Squad", text: "Stay within 20 metres of your squad for an entire {game} round." },
    { cat: "teamwork", min: "hard", title: "Everyone Eats", text: "Win a {game} match where every squadmate scores at least once." },
    { cat: "teamwork", min: "insane", title: "No Roster Changes", text: "Win {n} {game} matches in a row with the exact same squad." },

    { cat: "survival", min: "easy", title: "First Ten", text: "Survive the first 10 minutes of {game} without dying." },
    { cat: "survival", min: "medium", title: "No Second Chances", text: "Reach the final {n} players in {game} without using a respawn." },
    { cat: "survival", min: "hard", title: "Untouchable", text: "Win a {game} match with zero respawns or second chances used." },
    { cat: "survival", min: "insane", title: "Perfect Run", text: "Win {n} {game} matches in a row without going down once." },

    { cat: "competitive", min: "easy", title: "Grudge Match", text: "Beat a friend 1v1 in {game}." },
    { cat: "competitive", min: "medium", title: "Streak Starter", text: "Win {n} {game} matches in a row." },
    { cat: "competitive", min: "hard", title: "Comeback Kid", text: "Win a {game} match after being behind at the halfway point." },
    { cat: "competitive", min: "insane", title: "Sweep", text: "Win a best-of-{n} {game} series without dropping a single match." }
  ];

  const FLAVOR = {
    fortnite: [
      { cat: "skill", min: "medium", title: "Build Different", text: "Get {n} eliminations in a Fortnite match after building cover first." },
      { cat: "teamwork", min: "hard", title: "Zero Build Discipline", text: "Win a Fortnite Zero Build match with a squad that never splits up." },
      { cat: "funny", min: "easy", title: "Emote First", text: "Emote before your final elimination in a Fortnite match." },
      { cat: "survival", min: "hard", title: "Storm Chaser", text: "Win a Fortnite match while taking storm damage." }
    ],
    minecraft: [
      { cat: "skill", min: "medium", title: "Diamond Deadline", text: "Reach diamond gear in a fresh Minecraft world within 60 minutes." },
      { cat: "survival", min: "medium", title: "Creeper Tax", text: "Survive an entire Minecraft night without taking a single mob hit." },
      { cat: "teamwork", min: "hard", title: "Base Wars", text: "Build a Minecraft base your squad then defends against a friend's attack." },
      { cat: "funny", min: "easy", title: "Name Your Sword", text: "Name your Minecraft sword something ridiculous and use it all session." }
    ],
    roblox: [
      { cat: "skill", min: "medium", title: "Obby Endurance", text: "Clear three obbies in Roblox without falling out of any of them." },
      { cat: "skill", min: "hard", title: "Tower Defence Genius", text: "Win a round of a Roblox tower defence game without losing a tower." },
      { cat: "funny", min: "easy", title: "Roleplay Legend", text: "Commit to one character on a Roblox roleplay server for a full hour." }
    ],
    "rocket-league": [
      { cat: "skill", min: "hard", title: "Aerial Ace", text: "Score two aerial goals in a single Rocket League match." },
      { cat: "competitive", min: "medium", title: "Clean Sheet", text: "Win a Rocket League match without conceding a goal." },
      { cat: "funny", min: "medium", title: "Own Goal Gambit", text: "Score an own goal in a casual Rocket League match, then still win it." },
      { cat: "survival", min: "hard", title: "Shadow Defence", text: "Win a Rocket League match without ever leaving your own half." }
    ],
    cod: [
      { cat: "funny", min: "easy", title: "Loadout Roulette", text: "Play a Call of Duty match with a loadout chosen by a squadmate." },
      { cat: "skill", min: "medium", title: "Secondary Streak", text: "Get three eliminations in a row in Call of Duty using your secondary weapon." },
      { cat: "teamwork", min: "medium", title: "Zone Holder", text: "Hold the objective in Call of Duty for a combined 60 seconds." }
    ],
    valorant: [
      { cat: "competitive", min: "hard", title: "Clutch Merchant", text: "Win a 1v2 clutch round in Valorant." },
      { cat: "skill", min: "insane", title: "Ace Hunt", text: "Score an ace in a single Valorant round." },
      { cat: "survival", min: "medium", title: "Silent Round", text: "Win a Valorant round where you never fire a shot." }
    ],
    "apex-legends": [
      { cat: "teamwork", min: "medium", title: "Squad Wipe", text: "Win an Apex Legends fight after a squadmate goes down." },
      { cat: "survival", min: "medium", title: "Hot Drop Survivor", text: "Drop hot in Apex Legends and survive the first five minutes." }
    ],
    gta: [
      { cat: "teamwork", min: "hard", title: "Heist Crew", text: "Finish a GTA Online heist with four players and no failed setups." },
      { cat: "funny", min: "easy", title: "Traffic Law", text: "Drive in GTA Online for ten minutes without hitting a single pedestrian." }
    ],
    "among-us": [
      { cat: "survival", min: "easy", title: "Silent Crew", text: "Complete three tasks in Among Us without speaking at all." },
      { cat: "skill", min: "hard", title: "Master Detective", text: "Vote out the impostor in two consecutive Among Us games." }
    ],
    "fall-guys": [
      { cat: "competitive", min: "medium", title: "Crown Club", text: "Win a Fall Guys episode with your squad watching." },
      { cat: "funny", min: "medium", title: "Bean Ballet", text: "Reach a final in Fall Guys without ever jumping." }
    ],
    "mario-kart": [
      { cat: "competitive", min: "medium", title: "Grand Prix Sweep", text: "Win a full Mario Kart 8 Deluxe Grand Prix without finishing below second." },
      { cat: "funny", min: "easy", title: "No Items Run", text: "Finish a Mario Kart race without using a single item." }
    ],
    "ea-fc": [
      { cat: "skill", min: "medium", title: "Clean Football", text: "Win an EA SPORTS FC match without conceding a goal." },
      { cat: "competitive", min: "hard", title: "Derby Day", text: "Beat a friend in EA SPORTS FC by three or more goals." }
    ],
    overwatch: [
      { cat: "teamwork", min: "medium", title: "Ult Economy", text: "Win an Overwatch 2 fight using three ultimates at once." },
      { cat: "survival", min: "hard", title: "No Deaths", text: "Finish an Overwatch 2 match without dying once." }
    ]
  };

  function difficultyAtLeast(templateMin, difficultyId) {
    const minOrder = C.difficulty(templateMin).order;
    const order = C.difficulty(difficultyId).order;
    return minOrder <= order;
  }

  function substitute(text, gameName, difficultyId) {
    const n = NUMBERS[difficultyId] || 3;
    return String(text).replace(/\{game\}/g, gameName).replace(/\{n\}/g, String(n));
  }

  /* Generates one challenge. Falls back gracefully if the game is unknown. */
  C.generate = function (options) {
    const opts = options || {};
    const game = (LL.games || []).find(function (g) {
      return g.id === opts.gameId;
    });
    const gameName = game ? game.name : "your game";
    const gameId = game ? game.id : null;
    const difficultyId = C.difficulty(opts.difficulty).id;
    const categoryId = opts.category ? C.category(opts.category).id : null;

    const flavorPool = (FLAVOR[gameId] || []).filter(function (t) {
      return difficultyAtLeast(t.min, difficultyId) && (!categoryId || t.cat === categoryId);
    });

    const genericPool = GENERIC.filter(function (t) {
      return difficultyAtLeast(t.min, difficultyId) && (!categoryId || t.cat === categoryId);
    });

    let template = null;
    if (flavorPool.length && (!genericPool.length || Math.random() < 0.55)) {
      template = U.pick(flavorPool);
    } else if (genericPool.length) {
      template = U.pick(genericPool);
    } else {
      template = U.pick(GENERIC);
    }

    const difficulty = C.difficulty(difficultyId);
    return {
      id: U.uid("ch"),
      title: template.title,
      text: substitute(template.text, gameName, difficultyId),
      gameId: gameId,
      category: template.cat,
      difficulty: difficultyId,
      xp: difficulty.xp,
      custom: false,
      createdAt: Date.now()
    };
  };

  /* Three featured challenges from the player's library, weighted to hard/insane. */
  C.featured = function (gameIds) {
    const ids = (gameIds && gameIds.length ? gameIds : LL.starterLibrary).slice();
    const picks = U.shuffle(ids).slice(0, 3);
    const order = ["insane", "hard", "medium"];
    return picks.map(function (gameId, i) {
      return C.generate({ gameId: gameId, difficulty: order[i % order.length] });
    });
  };

  /* Mixed bag for a single game: easy -> insane. */
  C.forGame = function (gameId) {
    return ["easy", "medium", "hard", "insane"].map(function (d) {
      return C.generate({ gameId: gameId, difficulty: d });
    });
  };

  /* Safe, player-authored challenge. */
  C.custom = function (input) {
    const title = String(input.title || "").trim().slice(0, 60) || "Custom Challenge";
    const text = String(input.text || "").trim().slice(0, 220) || "Add a description for this challenge.";
    const difficulty = C.difficulty(input.difficulty);
    return {
      id: U.uid("ch"),
      title: title,
      text: text,
      gameId: input.gameId || null,
      category: C.category(input.category).id,
      difficulty: difficulty.id,
      xp: difficulty.xp,
      custom: true,
      createdAt: Date.now()
    };
  };

  /* A safe net for words that would push a challenge somewhere we don't want. */
  C.UNSAFE = [
    /\bdrink\b/i,
    /\balcohol\b/i,
    /\bpurchase\b/i,
    /\bspend money\b/i,
    /\bpay\b/i,
    /\bclimb\b/i,
    /\bjump off\b/i,
    /\bskip meals?\b/i,
    /\bstay awake for\b/i,
    /\bfire\b/i,
    /\bdrive (?:fast|reckless|blind)\b/i
  ];

  C.isSafe = function (text) {
    return !C.UNSAFE.some(function (re) {
      return re.test(text);
    });
  };
})();
