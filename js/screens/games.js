/* ============================================================
   Lobby Legends — game picker, library, challenges, squad vote
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  const TABS = [
    { id: "pick", label: "Spin" },
    { id: "library", label: "Library" },
    { id: "challenges", label: "Challenges" },
    { id: "vote", label: "Squad vote" }
  ];

  let tab = "pick";
  let filters = { platform: "all", genre: "all", players: "all", time: "all" };
  let pick = { pool: [], sig: "", spinning: false, result: null, angle: 0 };
  let spinToken = 0;
  let gen = { gameId: null, difficulty: "medium", category: null, challenge: null };
  let voteDraft = [];

  /* ---------------- filtering ---------------- */

  function filterGames(list) {
    return list.filter(function (game) {
      if (filters.platform !== "all" && game.platforms.indexOf(filters.platform) < 0) return false;
      if (filters.genre !== "all" && game.genre !== filters.genre) return false;
      if (filters.players !== "all" && game.max < Number(filters.players)) return false;
      if (filters.time !== "all") {
        const bucket = LL.timeBuckets.find(function (b) {
          return b.id === filters.time;
        });
        if (bucket && (game.minutes < bucket.min || game.minutes > bucket.max)) return false;
      }
      return true;
    });
  }

  function filteredLibrary() {
    return filterGames(S.libraryGames());
  }

  function activeFilterCount() {
    return Object.keys(filters).filter(function (k) {
      return filters[k] !== "all";
    }).length;
  }

  /* ---------------- wheel pool ---------------- */

  function ensurePool() {
    const sig = JSON.stringify(filters) + "|" + S.get().library.join(",");
    if (sig !== pick.sig) {
      pick.sig = sig;
      pick.result = null;
      pick.angle = 0;
      const list = filteredLibrary();
      pick.pool = list.length > 8 ? U.shuffle(list).slice(0, 8) : list.slice();
    }
    return pick.pool;
  }

  function wheelGradient(pool) {
    if (!pool.length) return "var(--surface-3)";
    const colors = [
      "rgba(184,255,51,0.22)",
      "rgba(57,182,255,0.2)",
      "rgba(255,148,48,0.2)",
      "rgba(169,123,255,0.2)",
      "rgba(255,77,106,0.18)",
      "rgba(120,255,214,0.18)"
    ];
    const seg = 360 / pool.length;
    const stops = pool.map(function (_, i) {
      const start = i * seg;
      const end = (i + 1) * seg;
      return colors[i % colors.length] + " " + start + "deg " + end + "deg";
    });
    return "conic-gradient(from 0deg, " + stops.join(", ") + ")";
  }

  function shortName(name) {
    return name.length > 11 ? name.slice(0, 10).trim() + "…" : name;
  }

  function wheelHtml() {
    const pool = ensurePool();
    if (!pool.length) {
      return UI.empty({
        icon: "filter",
        title: "No games match those filters",
        text: "Loosen the filters or add more games to your library.",
        action: activeFilterCount() ? '<button type="button" class="btn btn-ghost btn-sm" data-act="games:clearFilters">Clear filters</button>' : '<button type="button" class="btn btn-primary btn-sm" data-act="games:tab" data-id="library">Open library</button>'
      });
    }
    const seg = 360 / pool.length;
    return (
      '<div class="wheel-stage">' +
      '<div class="wheel-pointer"></div>' +
      '<div class="wheel" id="wheel" style="transform:rotate(' + pick.angle + 'deg)">' +
      '<div class="wheel-face" style="background:' + wheelGradient(pool) + '"></div>' +
      pool
        .map(function (game, i) {
          return (
            '<div class="wheel-label" style="transform:rotate(' + (i * seg + seg / 2) + 'deg)">' +
            "<span>" + UI.esc(shortName(game.name)) + "</span></div>"
          );
        })
        .join("") +
      "</div>" +
      '<button type="button" class="wheel-hub" id="wheel-hub" data-act="games:spin"' +
      (pick.spinning ? " disabled" : "") +
      ' aria-label="Spin the wheel">' +
      (pick.spinning ? "SPINNING" : UI.icon("dice") + "SPIN") +
      "</button>" +
      "</div>"
    );
  }

  function resultCard() {
    if (!pick.result) {
      return (
        '<p class="tiny muted center" style="margin-top:6px">' +
        (pick.spinning ? "Drumroll…" : "Filters apply to the wheel — " + ensurePool().length + " game" + (ensurePool().length === 1 ? "" : "s") + " in play") +
        "</p>"
      );
    }
    const game = pick.result;
    return (
      '<div class="wheel-result" style="margin-top:6px">' +
      '<span class="tiny upper muted">The wheel has spoken</span>' +
      '<div class="row" style="gap:8px">' + UI.gameIcon(game) + "<b style=\"font-size:1.1rem\">" + UI.esc(game.name) + "</b></div>" +
      '<p class="tiny muted" style="text-align:center">' + UI.esc(game.genre) + " · " + (game.max > 1 ? "1–" + game.max + " players" : "Solo") + " · " + U.minutes(game.minutes) + "</p>" +
      '<div class="row wrap" style="gap:6px;justify-content:center;margin-top:4px">' +
      game.platforms
        .map(function (p) {
          return '<span class="badge">' + U.esc(LL.platformLabel(p)) + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="row" style="gap:8px;margin-top:10px;width:100%">' +
      '<button type="button" class="btn btn-primary btn-sm" style="flex:1" data-act="games:resultLobby" data-game="' + game.id + '">' + UI.icon("users") + "Open lobby</button>" +
      '<button type="button" class="btn btn-line btn-sm" data-act="games:resultChallenge" data-game="' + game.id + '">' + UI.icon("target") + "Challenge</button>" +
      "</div>" +
      '<button type="button" class="btn btn-line btn-sm btn-block" style="margin-top:6px" data-act="games:spin">' + UI.icon("refresh") + "Reroll" + "</button>" +
      "</div>"
    );
  }

  /* ---------------- filters UI ---------------- */

  function filterBar() {
    const platformChips = [{ id: "all", label: "All platforms" }]
      .concat(LL.platforms)
      .map(function (p) {
        return UI.chip(p.label, { active: filters.platform === p.id, act: "games:filter", data: { kind: "platform", id: p.id } });
      })
      .join("");

    const genreChips = [{ id: "all", label: "All genres" }]
      .concat(
        LL.genres.map(function (g) {
          return { id: g, label: g };
        })
      )
      .map(function (g) {
        return UI.chip(g.label, { active: filters.genre === g.id, act: "games:filter", data: { kind: "genre", id: g.id } });
      })
      .join("");

    const playerChips = LL.playerBuckets
      .map(function (b) {
        return UI.chip(b.label, { active: filters.players === b.id, act: "games:filter", data: { kind: "players", id: b.id } });
      })
      .join("");

    const timeChips = LL.timeBuckets
      .map(function (b) {
        return UI.chip(b.label, { active: filters.time === b.id, act: "games:filter", data: { kind: "time", id: b.id } });
      })
      .join("");

    return (
      '<div class="stack-sm">' +
      '<div class="between"><span class="label">Filters</span>' +
      (activeFilterCount() ? '<button type="button" class="link-btn" data-act="games:clearFilters">Clear (' + activeFilterCount() + ")</button>" : '<span class="tiny muted">' + filteredLibrary().length + " of " + S.get().library.length + " games</span>") +
      "</div>" +
      '<div class="hscroll" style="margin-top:2px">' + platformChips + "</div>" +
      '<div class="hscroll">' + genreChips + "</div>" +
      '<div class="row wrap" style="gap:6px">' + playerChips + "</div>" +
      '<div class="row wrap" style="gap:6px">' + timeChips + "</div>" +
      "</div>"
    );
  }

  /* ---------------- pick tab ---------------- */

  function renderPick() {
    return (
      '<div class="stack">' +
      '<section class="card card-glow">' +
      '<div class="between"><div><h2 style="font-size:1.05rem">Spin the picker</h2>' +
      '<p class="tiny muted">Nobody can agree? Let the wheel decide.</p></div>' +
      UI.badge("Rerollable", "neon", "dice") +
      "</div>" +
      wheelHtml() +
      resultCard() +
      '<div class="row" style="gap:8px;margin-top:12px">' +
      '<button type="button" class="btn btn-ghost btn-sm" style="flex:1" data-act="games:skip"' + (pick.spinning || !ensurePool().length ? " disabled" : "") + ">" + UI.icon("play") + "Skip animation</button>" +
      '<button type="button" class="btn btn-line btn-sm" style="flex:1" data-act="games:spin"' + (pick.spinning ? " disabled" : "") + ">" + UI.icon("refresh") + "Spin again</button>" +
      "</div>" +
      "</section>" +
      '<section class="card">' + filterBar() + "</section>" +
      '<section class="card">' +
      '<div class="between"><h2 style="font-size:1rem">Your library</h2>' +
      '<button type="button" class="link-btn" data-act="games:tab" data-id="library">Edit' + UI.icon("chevronRight") + "</button></div>" +
      '<div class="row wrap" style="gap:5px;margin-top:10px">' +
      (S.get().library.length
        ? S.get()
            .library.slice(0, 12)
            .map(function (id) {
              const game = S.game(id);
              return game ? '<span class="chip static">' + game.emoji + " " + UI.esc(game.name) + "</span>" : "";
            })
            .join("") + (S.get().library.length > 12 ? '<span class="chip static">+' + (S.get().library.length - 12) + "</span>" : "")
        : '<span class="tiny muted">Library is empty — add some games below.</span>') +
      "</div></section>" +
      "</div>"
    );
  }

  /* ---------------- library tab ---------------- */

  function renderLibrary() {
    const games = filterGames(S.games());
    const lib = S.get().library;
    const custom = S.get().customGames || [];
    return (
      '<div class="stack">' +
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Add to your library</h2>' +
      '<p class="tiny muted">Your library powers the wheel, challenges and lobby pools.</p></div>' +
      UI.badge(lib.length + " owned", "neon") +
      "</div>" +
      '<div style="margin-top:12px">' + filterBar() + "</div>" +
      '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));margin-top:12px">' +
      games
        .map(function (game) {
          return UI.gameTile(game, { on: lib.indexOf(game.id) >= 0, act: "games:toggleLib", data: { id: game.id } });
        })
        .join("") +
      '<button type="button" class="gtile" style="align-items:center;justify-content:center;text-align:center" data-act="games:customOpen">' +
      '<span class="game-icon" style="--hue:200">' + UI.icon("plus") + "</span>" +
      '<b>Add a custom game</b><small>Anything you play</small></button>' +
      "</div>" +
      (games.length ? "" : '<p class="tiny muted" style="margin-top:10px">No catalogue games match these filters.</p>') +
      "</section>" +
      (custom.length
        ? '<section class="card"><h2 style="font-size:1rem">Your custom games</h2><div class="stack-sm" style="margin-top:10px">' +
          custom
            .map(function (game) {
              return (
                '<div class="row-item">' +
                UI.gameIcon(game, "sm") +
                '<div class="row-main"><b>' + UI.esc(game.name) + "</b><span>" + UI.esc(game.genre) + " · up to " + game.max + " players</span></div>" +
                (lib.indexOf(game.id) >= 0 ? UI.badge("In library", "neon", "check") : "") +
                '<button type="button" class="icon-btn sm" data-act="games:deleteCustom" data-id="' + game.id + '" aria-label="Delete ' + UI.esc(game.name) + '">' + UI.icon("trash") + "</button>" +
                "</div>"
              );
            })
            .join("") +
          "</div></section>"
        : "") +
      "</div>"
    );
  }

  /* ---------------- challenges tab ---------------- */

  function ensureGen() {
    const lib = S.get().library;
    if (!lib.length) {
      gen.challenge = null;
      return null;
    }
    if (!gen.gameId || lib.indexOf(gen.gameId) < 0) gen.gameId = lib[0];
    const current = gen.challenge;
    if (
      !current ||
      current.gameId !== gen.gameId ||
      current.difficulty !== gen.difficulty ||
      (gen.category && current.category !== gen.category)
    ) {
      gen.challenge = LL.challenges.generate({
        gameId: gen.gameId,
        difficulty: gen.difficulty,
        category: gen.category || undefined
      });
    }
    return gen.challenge;
  }

  function challengePreview(challenge) {
    if (!challenge) {
      return UI.empty({
        icon: "target",
        title: "No games in your library",
        text: "Add a game first and we'll generate challenges for it.",
        action: '<button type="button" class="btn btn-primary btn-sm" data-act="games:tab" data-id="library">Open library</button>'
      });
    }
    const game = S.game(challenge.gameId);
    return (
      '<div class="stack-sm">' +
      '<div class="between"><div class="row wrap" style="gap:6px">' +
      (game ? '<span class="chip static">' + game.emoji + " " + UI.esc(game.name) + "</span>" : "") +
      UI.categoryChip(challenge.category) +
      "</div>" + UI.badge("+" + challenge.xp + " XP", "orange") + "</div>" +
      "<h3 style=\"font-size:1rem\">" + UI.esc(challenge.title) + "</h3>" +
      '<p class="sm dim" style="line-height:1.45">' + UI.esc(challenge.text) + "</p>" +
      '<div class="row" style="gap:8px;margin-top:4px">' +
      '<button type="button" class="btn btn-primary btn-sm" style="flex:1" data-act="games:genAssign">' + UI.icon("bolt") + "Set as daily challenge</button>" +
      '<button type="button" class="btn btn-line btn-sm" data-act="games:genReroll" aria-label="Generate another">' + UI.icon("refresh") + "</button>" +
      "</div></div>"
    );
  }

  function renderChallenges() {
    const challenge = ensureGen();
    const games = S.libraryGames();
    const log = S.get().challengeLog.slice(0, 8);
    const custom = S.get().customChallenges || [];
    const active = S.get().activeChallenge;

    return (
      '<div class="stack">' +
      '<section class="card card-glow">' +
      '<div class="between"><span class="badge neon">' + UI.icon("target") + "Today's challenge</span>" +
      UI.badge("+" + active.xp + " XP", "orange") + "</div>" +
      '<h3 style="margin-top:10px;font-size:1.05rem">' + UI.esc(active.title) + "</h3>" +
      '<p class="sm dim" style="margin-top:5px;line-height:1.45">' + UI.esc(active.text) + "</p>" +
      '<div class="row wrap" style="gap:6px;margin-top:10px">' +
      (S.game(active.gameId) ? '<span class="chip static">' + S.game(active.gameId).emoji + " " + UI.esc(S.gameName(active.gameId)) + "</span>" : "") +
      UI.categoryChip(active.category) + UI.difficultyChip(active.difficulty) +
      "</div>" +
      '<div class="row" style="gap:8px;margin-top:12px">' +
      '<button type="button" class="btn btn-primary" style="flex:1" data-act="games:completeActive">' + UI.icon("check") + "Mark complete</button>" +
      '<button type="button" class="btn btn-ghost" data-act="games:swapActive">' + UI.icon("refresh") + "Swap</button>" +
      "</div></section>" +

      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Challenge generator</h2>' +
      '<p class="tiny muted">Pick a game, difficulty and category</p></div>' +
      '<button type="button" class="link-btn" data-act="games:customChallengeOpen">+ Create your own</button></div>' +
      (games.length
        ? '<div class="stack-sm" style="margin-top:12px">' +
          '<label class="field"><span class="label">Game</span><select class="select" data-change-act="games:genGame">' +
          games.map(function (g) {
            return '<option value="' + g.id + '"' + (gen.gameId === g.id ? " selected" : "") + ">" + UI.esc(g.name) + "</option>";
          }).join("") +
          "</select></label>" +
          '<div><span class="label">Difficulty</span><div class="row wrap" style="gap:6px;margin-top:6px">' +
          LL.challenges.difficulties
            .map(function (d) {
              return UI.chip(d.label + " · " + d.xp, { active: gen.difficulty === d.id, act: "games:genDifficulty", data: { id: d.id } });
            })
            .join("") +
          "</div></div>" +
          '<div><span class="label">Any category</span><div class="row wrap" style="gap:6px;margin-top:6px">' +
          UI.chip("Any", { active: !gen.category, act: "games:genCategory", data: { id: "all" } }) +
          LL.challenges.categories
            .map(function (c) {
              return UI.chip(c.label, { icon: c.icon, active: gen.category === c.id, act: "games:genCategory", data: { id: c.id } });
            })
            .join("") +
          "</div></div>" +
          '<div class="panel" id="gen-preview" style="margin-top:4px">' + challengePreview(challenge) + "</div>" +
          "</div>"
        : UI.empty({
            icon: "gamepad",
            title: "Add a game first",
            text: "Challenges are generated per game, so your library needs at least one.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="games:tab" data-id="library">Open library</button>'
          })) +
      UI.notice("Challenge rules are in-game only. No spending money, no dangerous real-world dares — just fun ways to play.", "info", "shield") +
      "</section>" +

      '<section class="card">' +
      '<div class="between"><h2 style="font-size:1rem">Completed challenges</h2>' + UI.badge(log.length ? S.get().challengeLog.length + " total" : "None yet", "") + "</div>" +
      (log.length
        ? '<div class="stack-sm" style="margin-top:10px">' +
          log
            .map(function (entry) {
              const game = S.game(entry.gameId);
              return (
                '<div class="row-item">' +
                (game ? UI.gameIcon(game, "sm") : '<span class="game-icon sm" style="--hue:200">' + UI.icon("target") + "</span>") +
                '<div class="row-main"><b>' + UI.esc(entry.title) + "</b><span>" + UI.esc(game ? game.name : "Custom") + " · " + U.relDay(entry.completedAt) + "</span></div>" +
                UI.badge("+" + entry.xp + " XP", "neon") +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : UI.empty({ icon: "target", title: "No challenges completed yet", text: "Complete your daily challenge to start your streak of XP." })) +
      "</section>" +

      (custom.length
        ? '<section class="card"><h2 style="font-size:1rem">Your custom challenges</h2><div class="stack-sm" style="margin-top:10px">' +
          custom
            .map(function (ch) {
              return (
                '<div class="row-item">' +
                '<div class="row-main"><b>' + UI.esc(ch.title) + "</b><span>" + UI.esc(ch.text) + "</span></div>" +
                '<button type="button" class="btn btn-sm btn-line" data-act="games:assignCustom" data-id="' + ch.id + '">Assign</button>' +
                '<button type="button" class="icon-btn sm" data-act="games:deleteCustomChallenge" data-id="' + ch.id + '" aria-label="Delete challenge">' + UI.icon("trash") + "</button>" +
                "</div>"
              );
            })
            .join("") +
          "</div></section>"
        : "") +
      "</div>"
    );
  }

  /* ---------------- squad vote tab ---------------- */

  function simulateSquadVotes(round) {
    const friends = S.friends();
    friends.forEach(function (friend, i) {
      setTimeout(function () {
        const sv = S.squadVote();
        if (!sv.options.length || sv.round !== round) return;
        if (sv.votes[friend.id]) return;
        sv.votes[friend.id] = U.pick(sv.options);
        S.save();
        S.emit();
      }, 1200 + i * U.randInt(500, 1100));
    });
  }

  function renderVote() {
    const sv = S.squadVote();
    const members = S.people();
    const result = UI.tally(sv.options, sv.votes);
    return (
      '<div class="stack">' +
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Squad vote</h2>' +
      '<p class="tiny muted">Round ' + sv.round + " · " + sv.options.length + " games on the table</p></div>" +
      '<button type="button" class="btn btn-sm btn-primary" data-act="games:newVote">' + UI.icon("plus") + "New vote</button></div>" +
      (sv.options.length
        ? '<div style="margin-top:12px">' +
          UI.votePanel({ options: sv.options, votes: sv.votes, members: members, scope: "squad" }) +
          "</div>" +
          (result.top
            ? '<div class="panel" style="margin-top:12px"><div class="between"><div>' +
              '<span class="tiny upper muted">Leading</span>' +
              '<div class="row" style="margin-top:3px">' + UI.gameIcon(S.game(result.top.gameId), "sm") +
              "<b>" + UI.esc(S.gameName(result.top.gameId)) + "</b></div></div>" +
              '<button type="button" class="btn btn-sm btn-soft" data-act="games:voteLobby" data-game="' + result.top.gameId + '">' + UI.icon("users") + "Lobby it</button></div></div>"
            : "")
        : UI.empty({
            icon: "dice",
            title: "No vote running",
            text: "Start a vote with 2–5 games from your library and let the squad pick.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="games:newVote">' + UI.icon("plus") + "Start a vote</button>"
          })) +
      '<p class="tiny muted" style="margin-top:10px">Friends vote automatically in this local demo so the vote feels alive. Real group voting needs a shared backend.</p>' +
      "</section>" +
      "</div>"
    );
  }

  /* ---------------- actions: tabs + filters ---------------- */

  LL.actions["games:tab"] = function (el) {
    spinToken += 1;
    pick.spinning = false;
    tab = el.dataset.id;
    const route = LL.app.route();
    /* Deep links (#/challenges, #/library) pin a tab; stepping away from them
       should not snap back on the next re-render. */
    if (route.params && route.params.tab) {
      try {
        history.replaceState(null, "", "#/games");
      } catch (err) {
        /* ignore */
      }
    }
    LL.app.refresh();
  };

  LL.actions["games:filter"] = function (el) {
    filters[el.dataset.kind] = el.dataset.id;
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["games:clearFilters"] = function () {
    filters = { platform: "all", genre: "all", players: "all", time: "all" };
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["games:toggleLib"] = function (el) {
    const id = el.dataset.id;
    const lib = S.get().library;
    const index = lib.indexOf(id);
    S.update(function (state) {
      if (index >= 0) state.library.splice(index, 1);
      else state.library.push(id);
    });
    const game = S.game(id);
    UI.toast(index >= 0 ? "Removed " + (game ? game.name : "game") + " from library" : "Added " + (game ? game.name : "game") + " to library", index >= 0 ? "warn" : "ok");
  };

  /* ---------------- actions: spinning ---------------- */

  function finishSpin(game) {
    pick.spinning = false;
    pick.result = game;
    S.update(function (state) {
      state.stats.spins += 1;
    }, { silent: true });
    S.checkAchievements({ silent: false, save: true });
    S.blip(820, 0.14);
    S.emit();
    if (game) UI.toast("The wheel picked " + game.name, "ok");
  }

  LL.actions["games:spin"] = function () {
    const pool = ensurePool();
    if (!pool.length || pick.spinning) return;
    const wheelEl = document.getElementById("wheel");
    const idx = Math.floor(Math.random() * pool.length);
    const seg = 360 / pool.length;
    const base = pick.angle;
    let target = base - (base % 360) + ((360 - (idx * seg + seg / 2)) % 360);
    while (target < base + 1440) target += 360;

    pick.spinning = true;
    pick.result = null;
    pick.angle = target;
    const token = ++spinToken;

    if (wheelEl) {
      wheelEl.style.transform = "rotate(" + target + "deg)";
      const hub = document.getElementById("wheel-hub");
      if (hub) {
        hub.disabled = true;
        hub.textContent = "SPINNING";
      }
      const minusMotion = document.documentElement.classList.contains("reduce-motion");
      setTimeout(function () {
        if (token !== spinToken) return;
        finishSpin(pool[idx]);
      }, minusMotion ? 450 : 4200);
    } else {
      finishSpin(pool[idx]);
    }
  };

  LL.actions["games:skip"] = function () {
    const pool = ensurePool();
    if (!pool.length) return;
    pick.spinning = false;
    pick.angle = 0;
    finishSpin(U.pick(pool));
  };

  LL.actions["games:resultLobby"] = function (el) {
    const gameId = el.dataset.game;
    const pool = [gameId].concat(
      U.shuffle(
        S.get().library.filter(function (id) {
          return id !== gameId;
        })
      ).slice(0, 2)
    );
    const game = S.game(gameId);
    const lobby = S.createLobby({ name: (game ? game.name : "Game") + " Night", pool: pool });
    UI.toast("Lobby created · code " + lobby.code, "ok");
    LL.app.nav("#/lobby/" + lobby.id);
  };

  LL.actions["games:resultChallenge"] = function (el) {
    const challenge = LL.challenges.generate({ gameId: el.dataset.game, difficulty: "hard" });
    S.update(function (state) {
      state.activeChallenge = challenge;
    });
    UI.toast("Challenge set · " + challenge.title, "ok");
  };

  /* ---------------- actions: custom games ---------------- */

  LL.actions["games:customOpen"] = function () {
    const genres = LL.genres
      .map(function (g) {
        return '<option value="' + UI.esc(g) + '">' + UI.esc(g) + "</option>";
      })
      .join("");
    UI.openModal({
      title: "Add a custom game",
      subtitle: "Anything your group plays — it works everywhere in the app.",
      body:
        '<form data-act="games:customSubmit" class="stack-sm">' +
        '<div class="row" style="gap:8px;align-items:flex-end">' +
        '<label class="field" style="width:78px"><span class="label">Icon</span>' +
        '<input class="input" name="emoji" maxlength="2" value="🎮" style="text-align:center;font-size:1.1rem" /></label>' +
        '<label class="field" style="flex:1"><span class="label">Name</span>' +
        '<input class="input" name="name" placeholder="Game name" maxlength="40" required /></label></div>' +
        '<label class="field"><span class="label">Genre</span><select class="select" name="genre">' + genres + '<option value="Custom">Custom</option></select></label>' +
        '<label class="field"><span class="label">Main platform</span><select class="select" name="platform">' +
        LL.platforms.map(function (p) { return '<option value="' + p.id + '">' + p.label + "</option>"; }).join("") +
        "</select></label>" +
        '<div class="row" style="gap:8px">' +
        '<label class="field" style="flex:1"><span class="label">Max players</span><input class="input" name="max" type="number" min="1" max="32" value="4" /></label>' +
        '<label class="field" style="flex:1"><span class="label">Minutes</span><input class="input" name="minutes" type="number" min="5" max="300" value="30" /></label></div>' +
        '<button type="submit" class="btn btn-primary btn-block">' + UI.icon("plus") + "Add to library</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  };

  LL.actions["games:customSubmit"] = function (form) {
    const name = form.querySelector('[name="name"]').value.trim();
    if (!name) {
      UI.toast("Give your game a name.", "err");
      return;
    }
    const max = U.clamp(parseInt(form.querySelector('[name="max"]').value, 10) || 4, 1, 32);
    const minutes = U.clamp(parseInt(form.querySelector('[name="minutes"]').value, 10) || 30, 5, 300);
    const game = {
      id: "custom-" + U.uid("g").slice(2),
      name: name.slice(0, 40),
      emoji: (form.querySelector('[name="emoji"]').value || "🎮").slice(0, 2),
      genre: form.querySelector('[name="genre"]').value,
      platforms: [form.querySelector('[name="platform"]').value],
      min: 1,
      max: max,
      minutes: minutes,
      hue: U.randInt(0, 359),
      custom: true
    };
    S.update(function (state) {
      state.customGames.unshift(game);
      if (state.library.indexOf(game.id) < 0) state.library.push(game.id);
    });
    UI.closeModal();
    UI.toast(name + " added to your library", "ok");
  };

  LL.actions["games:deleteCustom"] = function (el) {
    const id = el.dataset.id;
    const game = S.game(id);
    UI.confirm({
      title: "Delete " + (game ? game.name : "this game") + "?",
      text: "It is removed from your library and your custom games.",
      okLabel: "Delete",
      danger: true,
      act: "games:deleteCustomConfirmed",
      data: { id: id }
    });
  };

  LL.actions["games:deleteCustomConfirmed"] = function (el) {
    const id = el.dataset.id;
    UI.closeModal();
    S.update(function (state) {
      state.customGames = state.customGames.filter(function (g) {
        return g.id !== id;
      });
      state.library = state.library.filter(function (gid) {
        return gid !== id;
      });
    });
    UI.toast("Custom game deleted", "warn");
  };

  /* ---------------- actions: challenges ---------------- */

  LL.actions["games:completeActive"] = function () {
    S.completeChallenge(S.get().activeChallenge);
  };

  LL.actions["games:swapActive"] = function () {
    S.newDailyChallenge(U.pick(["easy", "medium", "hard"]));
  };

  LL.actions["games:genGame"] = function (el) {
    gen.gameId = el.value;
    gen.challenge = null;
    const challenge = ensureGen();
    UI.patch("#gen-preview", challengePreview(challenge));
  };

  LL.actions["games:genDifficulty"] = function (el) {
    gen.difficulty = el.dataset.id;
    gen.challenge = null;
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["games:genCategory"] = function (el) {
    gen.category = el.dataset.id === "all" ? null : el.dataset.id;
    gen.challenge = null;
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["games:genReroll"] = function () {
    gen.challenge = null;
    ensureGen();
    UI.patch("#gen-preview", challengePreview(gen.challenge));
  };

  LL.actions["games:genAssign"] = function () {
    const challenge = ensureGen();
    if (!challenge) return;
    S.update(function (state) {
      state.activeChallenge = Object.assign({}, challenge, { id: U.uid("ch") });
    });
    UI.toast("Daily challenge set · " + challenge.title, "ok");
  };

  LL.actions["games:customChallengeOpen"] = function () {
    const games = S.libraryGames();
    UI.openModal({
      title: "Create a challenge",
      subtitle: "Keep it in-game and safe: nothing that costs money or needs risky real-world dares.",
      body:
        '<form data-act="games:customChallengeSubmit" class="stack-sm">' +
        '<label class="field"><span class="label">Title</span>' +
        '<input class="input" name="title" placeholder="The Floor Is Lava" maxlength="60" required /></label>' +
        '<label class="field"><span class="label">Rule</span>' +
        '<textarea class="input" name="text" placeholder="What exactly does the squad have to do?" maxlength="220" required></textarea></label>' +
        '<label class="field"><span class="label">Game</span><select class="select" name="game">' +
        (games.length
          ? games.map(function (g) { return '<option value="' + g.id + '">' + UI.esc(g.name) + "</option>"; }).join("")
          : '<option value="">No games in library</option>') +
        "</select></label>" +
        '<div class="row" style="gap:8px">' +
        '<label class="field" style="flex:1"><span class="label">Difficulty</span><select class="select" name="difficulty">' +
        LL.challenges.difficulties.map(function (d) { return '<option value="' + d.id + '"' + (d.id === "medium" ? " selected" : "") + ">" + d.label + " · " + d.xp + " XP</option>"; }).join("") +
        "</select></label>" +
        '<label class="field" style="flex:1"><span class="label">Category</span><select class="select" name="category">' +
        LL.challenges.categories.map(function (c) { return '<option value="' + c.id + '">' + c.label + "</option>"; }).join("") +
        "</select></label></div>" +
        '<button type="submit" class="btn btn-primary btn-block">' + UI.icon("check") + "Save challenge</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  };

  LL.actions["games:customChallengeSubmit"] = function (form) {
    const title = form.querySelector('[name="title"]').value.trim();
    const text = form.querySelector('[name="text"]').value.trim();
    if (!title || !text) {
      UI.toast("Add a title and a rule.", "err");
      return;
    }
    if (!LL.challenges.isSafe(text)) {
      UI.toast("That one crosses the line — keep challenges in-game and safe.", "err");
      return;
    }
    const challenge = LL.challenges.custom({
      title: title,
      text: text,
      gameId: form.querySelector('[name="game"]').value || null,
      difficulty: form.querySelector('[name="difficulty"]').value,
      category: form.querySelector('[name="category"]').value
    });
    UI.closeModal();
    S.addCustomChallenge(challenge);
  };

  LL.actions["games:assignCustom"] = function (el) {
    const id = el.dataset.id;
    const challenge = (S.get().customChallenges || []).find(function (c) {
      return c.id === id;
    });
    if (!challenge) return;
    S.update(function (state) {
      state.activeChallenge = Object.assign({}, challenge, { id: U.uid("ch") });
    });
    UI.toast("Daily challenge set · " + challenge.title, "ok");
  };

  LL.actions["games:deleteCustomChallenge"] = function (el) {
    const id = el.dataset.id;
    S.update(function (state) {
      state.customChallenges = state.customChallenges.filter(function (c) {
        return c.id !== id;
      });
    });
    UI.toast("Custom challenge removed", "warn");
  };

  /* ---------------- actions: squad vote ---------------- */

  LL.actions["vote:cast"] = function (el) {
    const scope = el.dataset.scope;
    const gameId = el.dataset.game;
    if (scope === "squad") {
      const sv = S.squadVote();
      if (sv.options.indexOf(gameId) < 0) return;
      sv.votes.me = gameId;
      S.save();
      S.emit();
      simulateSquadVotes(sv.round);
      return;
    }
    const lobby = S.lobby(el.dataset.lobby);
    if (!lobby) return;
    if (lobby.lockedGame) {
      UI.toast("That vote is locked in already.", "warn");
      return;
    }
    lobby.votes.me = gameId;
    S.save();
    S.emit();
  };

  LL.actions["games:newVote"] = function () {
    const games = S.libraryGames();
    if (games.length < 2) {
      UI.toast("Add at least two games to your library first.", "warn");
      return;
    }
    const sv = S.squadVote();
    voteDraft = sv.options.length ? sv.options.slice(0, 5) : games.slice(0, 3).map(function (g) { return g.id; });
    UI.openModal({
      title: "Start a squad vote",
      subtitle: "Pick 2–5 games. Every friend gets one vote (simulated locally).",
      body:
        '<div id="vote-picker">' + UI.gameOptions(games, voteDraft, "games:voteDraft") + "</div>" +
        '<p class="tiny muted" id="vote-count">' + voteDraft.length + " selected</p>",
      actions:
        '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="games:newVoteStart">Start vote</button>'
    });
  };

  LL.actions["games:voteDraft"] = function (el) {
    const id = el.dataset.id;
    const index = voteDraft.indexOf(id);
    if (index >= 0) voteDraft.splice(index, 1);
    else if (voteDraft.length >= 5) {
      UI.toast("Five options is the maximum.", "warn");
      return;
    } else voteDraft.push(id);
    UI.patch("#vote-picker", UI.gameOptions(S.libraryGames(), voteDraft, "games:voteDraft"));
    const count = document.getElementById("vote-count");
    if (count) count.textContent = voteDraft.length + " selected";
  };

  LL.actions["games:newVoteStart"] = function () {
    if (voteDraft.length < 2) {
      UI.toast("Pick at least two games.", "err");
      return;
    }
    const sv = S.startSquadVote(voteDraft);
    UI.closeModal();
    tab = "vote";
    simulateSquadVotes(sv.round);
    LL.app.refresh();
  };

  LL.actions["games:voteLobby"] = function (el) {
    const gameId = el.dataset.game;
    const sv = S.squadVote();
    const lobby = S.createLobby({ name: S.gameName(gameId) + " Night", pool: sv.options.slice(0, 5) });
    UI.toast("Lobby created · code " + lobby.code, "ok");
    LL.app.nav("#/lobby/" + lobby.id);
  };

  /* ---------------- render ---------------- */

  function render(params) {
    if (params && params.tab && params.tab !== tab) tab = params.tab;
    const body =
      tab === "library" ? renderLibrary() : tab === "challenges" ? renderChallenges() : tab === "vote" ? renderVote() : renderPick();
    return (
      '<div class="stack">' +
      '<div><p class="tiny upper muted">Decide what to play</p><h1 class="display">Game picker</h1>' +
      '<p class="sm muted" style="margin-top:4px">' + S.get().library.length + " games in your library · " + S.games().length + " in the catalogue</p></div>" +
      UI.segmented(TABS, tab, "games:tab") +
      body +
      "</div>"
    );
  }

  LL.screens.games = {
    render: render
  };
})();
