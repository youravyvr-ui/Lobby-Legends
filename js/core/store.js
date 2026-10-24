/* ============================================================
   Lobby Legends — local state store
   Persistence: localStorage only. No server, no auth, no sync.
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const S = (LL.store = {});
  const KEY = "lobby-legends:v1";
  const VERSION = 1;

  let state = null;
  let audioCtx = null;
  const subscribers = [];

  /* ---------------- achievements ---------------- */

  const ACHIEVEMENTS = [
    { id: "first-blood", name: "First Blood", desc: "Win your first reported match", icon: "bolt", check: function (s) { return s.stats.wins >= 1; } },
    { id: "challenger", name: "Challenger", desc: "Complete your first challenge", icon: "target", check: function (s) { return s.stats.challenges >= 1; } },
    { id: "grinder", name: "Grinder", desc: "Complete 10 challenges", icon: "refresh", check: function (s) { return s.stats.challenges >= 10; } },
    { id: "champion", name: "Champion", desc: "Win a tournament with your squad", icon: "trophy", check: function (s) { return s.stats.tournaments >= 1; } },
    { id: "host", name: "Lobby Host", desc: "Create your first lobby", icon: "users", check: function (s) { return s.stats.lobbies >= 1; } },
    {
      id: "socialite",
      name: "Full Squad",
      desc: "Fill a lobby with 4 or more members",
      icon: "sparkles",
      check: function (s) {
        return s.lobbies.some(function (l) {
          return l.members.length >= 4;
        });
      }
    },
    { id: "streak7", name: "On Fire", desc: "Reach a 7 day streak", icon: "flame", check: function (s) { return s.streak >= 7; } },
    { id: "level10", name: "Veteran", desc: "Reach level 10", icon: "star", check: function (s) { return U.levelFor(s.xp).level >= 10; } },
    { id: "wheel", name: "Wheel Whisperer", desc: "Spin the game picker 5 times", icon: "dice", check: function (s) { return s.stats.spins >= 5; } },
    { id: "collector", name: "Collector", desc: "Own 8 games in your library", icon: "gamepad", check: function (s) { return s.library.length >= 8; } },
    { id: "rival", name: "Rivalry", desc: "Start a rivalry with a friend", icon: "bolt", check: function (s) { return s.rivalries.length >= 1; } },
    { id: "legend", name: "Legend Status", desc: "Reach 10,000 XP", icon: "chart", check: function (s) { return s.xp >= 10000; } },
    { id: "patron", name: "Premium Preview", desc: "Try the premium demo mode", icon: "crown", check: function (s) { return !!(s.premium && s.premium.demo); } }
  ];

  /* ---------------- persistence ---------------- */

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* storage full or blocked — keep running in memory */
    }
  }

  S.emit = function () {
    subscribers.forEach(function (fn) {
      try {
        fn(state);
      } catch (err) {
        console.error("[LobbyLegends] subscriber failed", err);
      }
    });
  };

  S.subscribe = function (fn) {
    subscribers.push(fn);
    return function () {
      const i = subscribers.indexOf(fn);
      if (i >= 0) subscribers.splice(i, 1);
    };
  };

  S.get = function () {
    return state;
  };

  S.save = function () {
    persist();
  };

  S.update = function (mutator, opts) {
    if (typeof mutator === "function") mutator(state);
    persist();
    if (!opts || !opts.silent) S.emit();
  };

  function migrate() {
    const defaults = {
      customGames: [],
      challengeLog: [],
      customChallenges: [],
      rivalries: [],
      matches: [],
      tournaments: [],
      lobbies: [],
      achievements: [],
      squadVote: null,
      premium: { demo: false, plan: null, since: null }
    };
    Object.keys(defaults).forEach(function (key) {
      if (state[key] === undefined) state[key] = defaults[key];
    });
    if (!state.premium) state.premium = { demo: false, plan: null, since: null };
    if (!state.stats) state.stats = { wins: 0, losses: 0, challenges: 0, tournaments: 0, spins: 0, lobbies: 0, rivalries: 0 };
    if (!state.settings.privacy) {
      state.settings.privacy = { showStats: true, allowInvites: true, showHistory: true, appearInLeaderboard: true };
    }
    if (!state.settings.notifications) {
      state.settings.notifications = { lobbyInvites: true, tournamentUpdates: true, dailyChallenge: true };
    }
    if (!state.stats.rivalries) state.stats.rivalries = state.rivalries.length;
    if (!state.weekKey) state.weekKey = U.weekKey();
    if (typeof state.weeklyXp !== "number") state.weeklyXp = 0;
    state.version = VERSION;
  }

  S.load = function () {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (err) {
      raw = null;
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profile && parsed.settings) state = parsed;
      } catch (err) {
        state = null;
      }
    }
    if (!state) state = LL.seed.build();
    migrate();
    S.touchDay();
    S.applySettings();
    S.checkAchievements({ silent: true, save: false });
    S.save();
    return state;
  };

  S.reset = function () {
    state = LL.seed.build();
    S.touchDay();
    S.applySettings();
    S.save();
    S.emit();
    S.notifySimple("Local demo data reset", "warn");
    return state;
  };

  S.notifySimple = function (msg, tone) {
    if (LL.ui && LL.ui.toast) LL.ui.toast(msg, tone);
  };

  S.exportData = function () {
    return JSON.stringify(state, null, 2);
  };

  /* ---------------- day / streak bookkeeping ---------------- */

  S.touchDay = function () {
    if (!state) return;
    const today = U.dayKey();
    if (state.lastActive !== today) {
      const yesterday = U.dayKey(Date.now() - 86400000);
      state.streak = state.lastActive === yesterday ? (state.streak || 0) + 1 : 1;
      state.lastActive = U.dayKey();
    }
    const week = U.weekKey();
    if (state.weekKey !== week) {
      state.weekKey = week;
      state.weeklyXp = 0;
    }
  };

  /* ---------------- games ---------------- */

  S.games = function () {
    const custom = state ? state.customGames || [] : [];
    return LL.games.concat(custom);
  };

  S.game = function (id) {
    const custom = state ? state.customGames || [] : [];
    return S.games().find(function (g) {
      return g.id === id;
    }) || (LL.games || []).find(function (g) {
      return g.id === id;
    }) || custom.find(function (g) {
      return g.id === id;
    }) || null;
  };

  S.gameName = function (id) {
    const game = S.game(id);
    return game ? game.name : "Unknown game";
  };

  S.libraryGames = function () {
    return state.library
      .map(function (id) {
        return S.game(id);
      })
      .filter(Boolean);
  };

  /* ---------------- people ---------------- */

  S.person = function (id) {
    if (id === "me") {
      return {
        id: "me",
        name: state.profile.name,
        avatar: state.profile.avatar,
        xp: state.xp,
        weeklyXp: state.weeklyXp,
        wins: state.stats.wins,
        losses: state.stats.losses,
        challenges: state.stats.challenges,
        tournaments: state.stats.tournaments,
        tagline: state.profile.bio,
        isYou: true
      };
    }
    const friend = (LL.seed.FRIENDS || []).find(function (f) {
      return f.id === id;
    });
    if (friend) {
      return Object.assign({}, friend, { isYou: false });
    }
    return {
      id: id,
      name: "Unknown Player",
      avatar: "👾",
      xp: 0,
      weeklyXp: 0,
      wins: 0,
      losses: 0,
      challenges: 0,
      tournaments: 0,
      tagline: "",
      isYou: false
    };
  };

  S.personName = function (id) {
    return S.person(id).name;
  };

  S.friends = function () {
    return (LL.seed.FRIENDS || []).map(function (f) {
      return S.person(f.id);
    });
  };

  S.people = function () {
    return [S.person("me")].concat(S.friends());
  };

  S.level = function () {
    return U.levelFor(state.xp);
  };

  S.achievements = function () {
    return ACHIEVEMENTS.map(function (a) {
      return Object.assign({}, a, { unlocked: state.achievements.indexOf(a.id) >= 0 });
    });
  };

  S.leaderboard = function (scope, metric) {
    const weekly = scope === "week";
    const key = weekly ? "xp" : metric || "xp";
    const showMe = state.settings.privacy.appearInLeaderboard !== false;
    const rows = S.people()
      .filter(function (person) {
        return !person.isYou || showMe;
      })
      .map(function (person) {
      let value = 0;
      if (key === "xp") value = weekly ? person.weeklyXp : person.xp;
      else if (key === "wins") value = person.wins;
      else if (key === "challenges") value = person.challenges;
      else if (key === "tournaments") value = person.tournaments;
      else if (key === "winrate") value = person.wins + person.losses ? Math.round((person.wins / (person.wins + person.losses)) * 100) : 0;
      return { person: person, value: value };
    });
    rows.sort(function (a, b) {
      return b.value - a.value || a.person.name.localeCompare(b.person.name);
    });
    rows.forEach(function (row, i) {
      row.rank = i + 1;
    });
    return rows;
  };

  /* ---------------- XP, achievements, sound ---------------- */

  S.addXp = function (amount, opts) {
    const o = opts || {};
    if (!amount) return;
    const before = U.levelFor(state.xp).level;
    state.xp = Math.max(0, state.xp + amount);
    state.weeklyXp = Math.max(0, state.weeklyXp + amount);
    const after = U.levelFor(state.xp).level;

    if (!o.silent) {
      if (after > before) {
        S.blip(880, 0.16);
        S.notifySimple("Level up · you are now level " + after, "ok");
      } else if (!o.quiet && amount > 0) {
        S.notifySimple("+" + amount + " XP", "ok");
      }
    }
    S.checkAchievements({ silent: o.silent, save: false });
    persist();
    if (!o.silent) S.emit();
  };

  S.checkAchievements = function (opts) {
    const o = opts || {};
    const newly = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (state.achievements.indexOf(a.id) === -1 && a.check(state)) {
        state.achievements.push(a.id);
        newly.push(a);
      }
    });
    if (newly.length) {
      state.xp += newly.length * 50;
      state.weeklyXp += newly.length * 50;
    }
    if (newly.length && !o.silent) {
      S.blip(1040, 0.18);
      S.notifySimple(
        newly.length === 1
          ? "Achievement unlocked · " + newly[0].name + " (+50 XP)"
          : newly.length + " achievements unlocked (+" + newly.length * 50 + " XP)",
        "ok"
      );
    }
    if (o.save !== false) persist();
    if (o.emit) S.emit();
    return newly;
  };

  S.blip = function (freq, duration) {
    if (!state || !state.settings.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime;
      osc.type = "triangle";
      osc.frequency.value = freq || 640;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (duration || 0.1));
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + (duration || 0.12) + 0.02);
    } catch (err) {
      /* audio is a nicety, never a blocker */
    }
  };

  /* ---------------- settings ---------------- */

  S.applySettings = function () {
    if (!state) return;
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme || "midnight";
    root.dataset.accent = state.profile.accent || "neon";
    root.classList.toggle("reduce-motion", !!state.settings.reduceMotion);
    root.classList.toggle("big-text", !!state.settings.largeText);
    root.classList.toggle("contrast", !!state.settings.highContrast);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.settings.theme === "vapor" ? "#08060d" : "#07080a");
  };

  S.setSetting = function (path, value) {
    const parts = path.split(".");
    let target = state.settings;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
    S.applySettings();
    persist();
    S.emit();
  };

  /* ---------------- challenges ---------------- */

  S.completeChallenge = function (challenge) {
    state.challengeLog.unshift(Object.assign({}, challenge, { completedAt: Date.now() }));
    state.challengeLog = state.challengeLog.slice(0, 60);
    state.stats.challenges += 1;
    state.activeChallenge = LL.challenges.generate({
      gameId: challenge.gameId || U.pick(state.library),
      difficulty: U.pick(["easy", "medium", "hard"])
    });
    S.addXp(challenge.xp, { quiet: true });
    S.notifySimple("Challenge complete · +" + challenge.xp + " XP", "ok");
    persist();
    S.emit();
  };

  S.newDailyChallenge = function (difficulty) {
    state.activeChallenge = LL.challenges.generate({
      gameId: U.pick(state.library.length ? state.library : LL.starterLibrary),
      difficulty: difficulty || U.pick(["easy", "medium", "hard"])
    });
    persist();
    S.emit();
    S.notifySimple("New daily challenge rolled", "warn");
  };

  S.addCustomChallenge = function (challenge) {
    state.customChallenges.unshift(challenge);
    persist();
    S.emit();
    S.notifySimple("Custom challenge saved", "ok");
  };

  /* ---------------- matches ---------------- */

  S.logMatch = function (input) {
    const xp = input.outcome === "win" ? 60 : 20;
    const match = {
      id: U.uid("mt"),
      gameId: input.gameId,
      outcome: input.outcome,
      score: input.score || "",
      mode: input.mode || "",
      opponent: input.opponent || "",
      at: Date.now(),
      xp: xp
    };
    state.matches.unshift(match);
    state.matches = state.matches.slice(0, 40);
    if (input.outcome === "win") state.stats.wins += 1;
    else state.stats.losses += 1;
    S.addXp(xp, { silent: true });
    S.notifySimple("Match logged · +" + xp + " XP", "ok");
    persist();
    S.emit();
    return match;
  };

  /* ---------------- lobbies ---------------- */

  S.newCode = function () {
    const taken = state.lobbies.map(function (l) {
      return l.code;
    }).concat((LL.seed.JOINABLE || []).map(function (l) {
      return l.code;
    }));
    let code = U.code();
    let guard = 0;
    while (taken.indexOf(code) >= 0 && guard < 40) {
      code = U.code();
      guard += 1;
    }
    return code;
  };

  S.sysMsg = function (text) {
    return { id: U.uid("msg"), system: true, text: text, at: Date.now() };
  };

  S.chatMsg = function (whoId, text) {
    return { id: U.uid("msg"), who: whoId, text: text, at: Date.now() };
  };

  S.createLobby = function (input) {
    const pool = (input.pool || []).slice(0, 10);
    const code = S.newCode();
    const lobby = {
      id: U.uid("lb"),
      code: code,
      name: (input.name || "New Lobby").trim().slice(0, 36) || "New Lobby",
      ownerId: "me",
      pool: pool,
      status: "open",
      votes: {},
      voteStarted: null,
      lockedGame: null,
      members: [{ id: "me", ready: true, joinedAt: Date.now() }],
      messages: [S.sysMsg("Lobby created · invite code " + code)],
      createdAt: Date.now()
    };
    state.lobbies.unshift(lobby);
    state.stats.lobbies += 1;
    S.checkAchievements({ save: false, silent: true });
    persist();
    S.emit();
    return lobby;
  };

  S.lobby = function (id) {
    return state.lobbies.find(function (l) {
      return l.id === id;
    }) || null;
  };

  S.lobbyByCode = function (code) {
    const normalized = String(code || "").trim().toUpperCase();
    return state.lobbies.find(function (l) {
      return l.code === normalized;
    }) || (LL.seed.JOINABLE || []).find(function (l) {
      return l.code === normalized;
    }) || null;
  };

  S.joined = function (lobby) {
    return !!lobby && lobby.members.some(function (m) {
      return m.id === "me";
    });
  };

  S.joinLobby = function (lobby) {
    if (!lobby || S.joined(lobby)) return lobby;
    lobby.members.push({ id: "me", ready: false, joinedAt: Date.now() });
    lobby.messages.push(S.sysMsg(S.person("me").name + " joined the lobby"));
    persist();
    S.emit();
    return lobby;
  };

  S.joinByCode = function (code) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return { ok: false, error: "Enter an invite code first." };
    const existing = state.lobbies.find(function (l) {
      return l.code === normalized;
    });
    if (existing) {
      if (S.joined(existing)) return { ok: true, lobby: existing, already: true };
      S.joinLobby(existing);
      return { ok: true, lobby: existing, joined: true };
    }
    const template = (LL.seed.JOINABLE || []).find(function (l) {
      return l.code === normalized;
    });
    if (!template) return { ok: false, error: "No lobby with that code. Check the invite and try again." };
    const copy = JSON.parse(JSON.stringify(template));
    copy.members.push({ id: "me", ready: false, joinedAt: Date.now() });
    copy.messages.push(S.sysMsg(S.person("me").name + " joined the lobby"));
    state.lobbies.unshift(copy);
    persist();
    S.emit();
    return { ok: true, lobby: copy, joined: true };
  };

  S.leaveLobby = function (lobbyId) {
    const lobby = S.lobby(lobbyId);
    if (!lobby) return;
    lobby.members = lobby.members.filter(function (m) {
      return m.id !== "me";
    });
    if (!lobby.members.length) {
      state.lobbies = state.lobbies.filter(function (l) {
        return l.id !== lobbyId;
      });
    } else if (lobby.ownerId === "me") {
      lobby.ownerId = lobby.members[0].id;
      lobby.messages.push(S.sysMsg(S.person(lobby.ownerId).name + " is now the lobby owner"));
    }
    persist();
    S.emit();
    S.notifySimple("You left the lobby", "warn");
  };

  S.addGameToPool = function (lobby, gameId) {
    if (!lobby || lobby.pool.indexOf(gameId) >= 0) return;
    lobby.pool.push(gameId);
    persist();
    S.emit();
  };

  /* ---------------- tournaments ---------------- */

  S.createTournament = function (input) {
    const participants = (input.participants || []).slice(0, 8);
    const tour = {
      id: U.uid("t"),
      name: (input.name || "New Tournament").trim().slice(0, 40) || "New Tournament",
      gameId: input.gameId,
      size: participants.length,
      participants: participants,
      rounds: U.buildRounds(participants, U.uid("br")),
      status: "active",
      champion: null,
      runnerUp: null,
      createdAt: Date.now(),
      completedAt: null
    };
    state.tournaments.unshift(tour);
    persist();
    S.emit();
    return tour;
  };

  S.tournament = function (id) {
    return state.tournaments.find(function (t) {
      return t.id === id;
    }) || null;
  };

  S.resolveTournament = function (tour) {
    if (!tour || !tour.rounds || !tour.rounds.length) return tour;
    const last = tour.rounds[tour.rounds.length - 1].matches[0];
    if (last && last.winner) {
      tour.status = "complete";
      tour.champion = last.winner;
      tour.runnerUp = last.winner === last.a ? last.b : last.a;
      if (!tour.completedAt) tour.completedAt = Date.now();
    } else {
      tour.status = "active";
      tour.champion = null;
      tour.runnerUp = null;
      tour.completedAt = null;
    }
    return tour;
  };

  S.setMatchResult = function (tour, roundIndex, matchIndex, sa, sb) {
    const match = U.setResult(tour.rounds, roundIndex, matchIndex, sa, sb);
    S.resolveTournament(tour);
    persist();
    return match;
  };

  S.nextPlayableMatches = function (tour) {
    const out = [];
    tour.rounds.forEach(function (round, r) {
      round.matches.forEach(function (match, m) {
        if (match.a && match.b && !match.winner) out.push({ round: r, match: m, data: match });
      });
    });
    return out;
  };

  S.awardTournamentWin = function (tour) {
    if (tour.champion !== "me") return;
    state.stats.tournaments += 1;
    const before = state.achievements.slice();
    S.addXp(500, { quiet: true });
    S.notifySimple("Tournament won · +500 XP and a new trophy", "ok");
    persist();
    S.emit();
    if (before.length === state.achievements.length) S.checkAchievements({ silent: true });
  };

  /* ---------------- rivalries ---------------- */

  S.addRivalry = function (friendId) {
    if (friendId === "me") return null;
    const existing = state.rivalries.find(function (r) {
      return r.friendId === friendId;
    });
    if (existing) {
      S.notifySimple("You already have a rivalry with " + S.personName(friendId), "warn");
      return existing;
    }
    const rivalry = { friendId: friendId, wins: 0, losses: 0, since: Date.now() };
    state.rivalries.push(rivalry);
    state.stats.rivalries = state.rivalries.length;
    S.checkAchievements({ save: false, silent: true });
    persist();
    S.emit();
    S.notifySimple("Rivalry started with " + S.personName(friendId), "ok");
    return rivalry;
  };

  S.rivalry = function (friendId) {
    return state.rivalries.find(function (r) {
      return r.friendId === friendId;
    }) || null;
  };

  S.removeRivalry = function (friendId) {
    state.rivalries = state.rivalries.filter(function (r) {
      return r.friendId !== friendId;
    });
    persist();
    S.emit();
  };

  /* ---------------- squad vote (games screen) ---------------- */

  S.squadVote = function () {
    if (!state.squadVote) {
      state.squadVote = { options: [], votes: {}, round: 1, startedAt: Date.now() };
    }
    return state.squadVote;
  };

  S.startSquadVote = function (gameIds) {
    const options = (gameIds && gameIds.length ? gameIds : state.library).slice(0, 5);
    state.squadVote = {
      options: options,
      votes: {},
      round: (state.squadVote ? state.squadVote.round || 1 : 0) + 1,
      startedAt: Date.now()
    };
    persist();
    S.emit();
    return state.squadVote;
  };
})();
