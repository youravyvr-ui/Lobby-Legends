/* ============================================================
   Lobby Legends — home dashboard
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  let featuredCache = null;
  let featuredIndex = 0;

  function featured() {
    if (!featuredCache) featuredCache = LL.challenges.featured(S.get().library);
    return featuredCache;
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function heroCard() {
    const me = S.person("me");
    const level = S.level();
    const streak = S.get().streak;
    return (
      '<section class="hero card-glow">' +
      '<div class="row" style="gap:12px;align-items:flex-start">' +
      UI.levelRing(level.level, level.pct) +
      '<div class="row-main">' +
      '<p class="tiny upper muted">' + greeting() + "</p>" +
      '<h1 class="display" style="margin-top:2px">' + UI.esc(me.name) + "</h1>" +
      '<div class="row wrap" style="gap:6px;margin-top:6px">' +
      '<span class="badge neon">' + UI.icon("star") + "Level " + level.level + "</span>" +
      '<span class="badge orange">' + UI.icon("flame") + streak + " day streak</span>" +
      "</div></div></div>" +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:6px">' +
      '<div class="between"><span class="upper muted">Progress to level ' + (level.level + 1) + "</span>" +
      '<span class="tiny mono muted">' + level.into + " / " + level.need + " XP</span></div>" +
      UI.bar(level.pct) +
      "</div>" +
      '<div class="row" style="margin-top:14px;gap:8px">' +
      '<button type="button" class="btn btn-primary btn-lg" style="flex:1" data-act="lobby:create">' +
      UI.icon("plus") + "Create Lobby</button>" +
      '<button type="button" class="btn btn-ghost btn-lg" data-act="lobby:joinModal" aria-label="Join a lobby by code">' +
      UI.icon("users") + '<span class="hide-mobile">Join</span></button>' +
      "</div>" +
      '<div class="row" style="margin-top:10px;gap:8px">' +
      '<button type="button" class="btn btn-line btn-sm" style="flex:1" data-act="nav" data-to="#/games">' +
      UI.icon("dice") + "Pick a game</button>" +
      '<button type="button" class="btn btn-line btn-sm" style="flex:1" data-act="nav" data-to="#/tournaments">' +
      UI.icon("trophy") + "Tournaments</button>" +
      "</div>" +
      "</section>"
    );
  }

  function statsRow() {
    const stats = S.get().stats;
    const played = stats.wins + stats.losses;
    const winRate = played ? Math.round((stats.wins / played) * 100) + "%" : "—";
    return (
      '<div class="grid grid-4">' +
      UI.stat({ label: "Wins", value: stats.wins, tone: "neon" }) +
      UI.stat({ label: "Win rate", value: winRate }) +
      UI.stat({ label: "Trophies", value: stats.tournaments, tone: "orange" }) +
      UI.stat({ label: "Challenges", value: stats.challenges, tone: "blue" }) +
      "</div>"
    );
  }

  function challengeCard() {
    const ch = S.get().activeChallenge;
    const game = S.game(ch.gameId);
    return (
      '<section class="card card-glow">' +
      '<div class="between"><span class="badge neon">' + UI.icon("target") + "Daily challenge</span>" +
      '<span class="badge orange">+' + ch.xp + " XP</span></div>" +
      '<h3 style="margin-top:10px;font-size:1.05rem">' + UI.esc(ch.title) + "</h3>" +
      '<p class="sm dim" style="margin-top:5px;line-height:1.45">' + UI.esc(ch.text) + "</p>" +
      '<div class="row wrap" style="gap:6px;margin-top:10px">' +
      (game ? '<span class="chip static">' + UI.gameIcon(game, "sm") + UI.esc(game.name) + "</span>" : "") +
      UI.categoryChip(ch.category) +
      UI.difficultyChip(ch.difficulty) +
      "</div>" +
      '<div class="row" style="gap:8px;margin-top:14px">' +
      '<button type="button" class="btn btn-primary" style="flex:1" data-act="home:completeChallenge">' +
      UI.icon("check") + "Mark complete</button>" +
      '<button type="button" class="btn btn-ghost" data-act="home:swapChallenge">' +
      UI.icon("refresh") + "Swap</button>" +
      "</div>" +
      '<button type="button" class="link-btn" style="margin-top:8px" data-act="nav" data-to="#/challenges">' +
      UI.icon("list") + "Browse all challenges" + UI.icon("chevronRight") + "</button>" +
      '<p class="tiny muted" style="margin-top:6px">Challenges are in-game only. Nothing here costs money or asks you to do anything risky.</p>' +
      "</section>"
    );
  }

  function featuredCard() {
    const list = featured();
    if (!list.length) {
      return UI.empty({ icon: "sparkles", title: "No featured challenge yet", text: "Add a few games to your library and one will show up here." });
    }
    const idx = featuredIndex % list.length;
    const ch = list[idx];
    const game = S.game(ch.gameId);
    return (
      '<div>' +
      '<div class="between"><span class="badge purple">' + UI.icon("sparkles") + "Featured · rotates</span>" +
      '<span class="badge orange">+' + ch.xp + " XP</span></div>" +
      '<h3 style="margin-top:10px;font-size:1.02rem">' + UI.esc(ch.title) + "</h3>" +
      '<p class="sm dim" style="margin-top:5px;line-height:1.45">' + UI.esc(ch.text) + "</p>" +
      '<div class="row wrap" style="gap:6px;margin-top:10px">' +
      (game ? '<span class="chip static">' + UI.gameIcon(game, "sm") + UI.esc(game.name) + "</span>" : "") +
      UI.categoryChip(ch.category) +
      UI.difficultyChip(ch.difficulty) +
      "</div>" +
      '<div class="between" style="margin-top:12px">' +
      '<button type="button" class="btn btn-sm btn-soft" data-act="home:takeFeatured" data-i="' + idx + '">' +
      UI.icon("bolt") + "Take this challenge</button>" +
      '<div class="row" style="gap:5px">' +
      list.map(function (_, i) {
        return (
          '<button type="button" aria-label="Featured challenge ' + (i + 1) + '" data-act="home:featured" data-i="' + i + '" style="width:8px;height:8px;border-radius:50%;border:0;cursor:pointer;padding:0;background:' +
          (i === idx ? "var(--accent)" : "var(--surface-3)") +
          '"></button>'
        );
      }).join("") +
      "</div></div></div>"
    );
  }

  function lobbiesCard() {
    const lobbies = S.get().lobbies.slice(0, 3);
    return (
      UI.sectionHead("Active lobbies", "Squad rooms", '<button type="button" class="link-btn" data-act="nav" data-to="#/lobbies">See all' + UI.icon("chevronRight") + "</button>") +
      (lobbies.length
        ? '<div class="stack-sm">' +
          lobbies
            .map(function (lobby) {
              const owner = S.person(lobby.ownerId);
              const readyCount = lobby.members.filter(function (m) { return m.ready; }).length;
              return (
                '<button type="button" class="row-item tap" data-act="nav" data-to="#/lobby/' + lobby.id + '">' +
                '<span class="game-icon sm" style="--hue:' + ((262 + lobby.id.length * 7) % 360) + '">' + UI.icon("users") + "</span>" +
                '<div class="row-main"><b>' + UI.esc(lobby.name) + "</b>" +
                "<span>" + (owner.isYou ? "You host" : UI.esc(owner.name) + " hosts") + " · " +
                lobby.members.length + " in lobby · " + lobby.pool.length + " games</span></div>" +
                '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
        UI.avatarStack(lobby.members.map(function (m) { return S.person(m.id); }), 3) +
                UI.badge(readyLabel(lobby, readyCount), lobby.status === "voting" ? "orange" : "neon") +
                "</div></div>"
              );
            })
            .join("") +
        "</div>"
      : UI.empty({
          icon: "users",
          title: "No active lobbies",
          text: "Create one and share the invite code with your squad.",
          action: '<button type="button" class="btn btn-primary btn-sm" data-act="lobby:create">' + UI.icon("plus") + "Create lobby</button>"
        })));
  }

  function readyLabel(lobby, readyCount) {
    if (lobby.status === "voting") return "Voting";
    return "Ready " + readyCount + "/" + lobby.members.length;
  }

  function tournamentsCard() {
    const list = S.get().tournaments.slice(0, 3);
    return (
      '<section class="stack-sm">' +
      UI.sectionHead("Tournaments", "Squad brackets", '<button class="link-btn" type="button" data-act="nav" data-to="#/tournaments">All cups' + UI.icon("chevronRight") + "</button>") +
      (list.length
        ? list.map(function (t) {
            const game = S.game(t.gameId);
            const live = t.status === "active";
            return (
              '<button type="button" class="row-item tap" data-act="nav" data-to="#/tournament/' + t.id + '">' +
              UI.gameIcon(game, "sm") +
              '<div class="row-main"><b>' + UI.esc(t.name) + "</b><span>" +
              U.esc(t.size + " players · " + (game ? game.name : "Game")) +
              "</span></div>" +
              (t.champion
                ? '<span class="badge orange">' + UI.icon("crown") + UI.esc(S.personName(t.champion)) + "</span>"
                : UI.badge("In progress", "neon")) +
              "</div>"
            );
          }).join("")
        : UI.empty({
            icon: "trophy",
            title: "No tournaments yet",
            text: "Set up a bracket and crown a champion in your group.",
            action: '<button class="btn btn-primary btn-sm" type="button" data-act="nav" data-to="#/tournaments">Open tournaments</button>'
          })) +
      "</section>"
    );
  }

  function resultsCard() {
    const matches = S.get().matches.slice(0, 3);
    return (
      '<section class="stack-sm">' +
      UI.sectionHead("Recent results", "Your matches", '<button class="link-btn" type="button" data-act="home:logMatch">+ Log result</button>') +
      (matches.length
        ? '<div class="stack-sm">' + matches.map(UI.matchRow).join("") + "</div>"
        : UI.empty({
            icon: "gamepad",
            title: "No results logged",
            text: "Log a win or a loss to start tracking your own stats — we never invent game stats for you.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="home:logMatch">Log a match</button>'
          })) +
      "</section>"
    );
  }

  function squadStrip() {
    const mates = S.friends();
    return (
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Your squad</h2><p class="tiny muted">Sample group data stored on this device</p></div>' +
      '<button type="button" class="link-btn" data-act="nav" data-to="#/leaderboards">Ranking' + UI.icon("chevronRight") + "</button></div>" +
      '<div class="hscroll" style="margin-top:12px">' +
      S.people()
        .map(function (person) {
          const lvl = U.levelFor(person.xp || 0).level;
          return (
            '<div class="panel" style="min-width:112px;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center">' +
            UI.avatar(person, "md") +
            '<b class="sm" style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + UI.esc(person.name) + (person.isYou ? " (you)" : "") + "</b>" +
            '<span class="tiny muted">Level ' + lvl + "</span>" +
            (person.isYou ? '<span class="badge neon">You</span>' : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      "</section>"
    );
  }

  /* ---------------- actions ---------------- */

  LL.actions["home:completeChallenge"] = function () {
    const ch = S.get().activeChallenge;
    if (!ch) return;
    S.completeChallenge(ch);
  };

  LL.actions["home:swapChallenge"] = function () {
    S.newDailyChallenge(U.pick(["easy", "medium", "hard"]));
  };

  LL.actions["home:takeFeatured"] = function (el) {
    const list = featured();
    const ch = list[Number(el.dataset.i) || 0];
    if (!ch) return;
    S.update(function (state) {
      state.activeChallenge = Object.assign({}, ch, { id: U.uid("ch") });
    });
    UI.toast("Added to your daily challenge slot", "ok");
  };

  LL.actions["home:featured"] = function (el) {
    featuredIndex = Number(el.dataset.i) || 0;
    UI.patch("#featured-card", featuredCard());
  };

  LL.actions["home:logMatch"] = function () {
    const games = S.libraryGames();
    if (!games.length) {
      UI.toast("Add a game to your library first.", "warn");
      return;
    }
    LL.actions["home:logModal"]();
  };

  LL.actions["home:logModal"] = function () {
    const games = S.libraryGames();
    if (!games.length) {
      UI.toast("Add a game to your library first.", "warn");
      LL.app.nav("#/games");
      return;
    }
    UI.openModal({
      title: "Log a match",
      subtitle: "Only what you enter here is recorded. Nothing is pulled from a game account.",
      body:
        '<form data-act="home:logSubmit" class="stack-sm">' +
        '<label class="field"><span class="label">Game</span>' +
        '<select class="select" name="game" required>' +
        games.map(function (g) {
          return '<option value="' + g.id + '">' + U.esc(g.name) + "</option>";
        }).join("") +
        "</select></label>" +
        '<div class="row" style="gap:8px;align-items:flex-end">' +
        '<label class="field" style="flex:1"><span class="label">Result</span>' +
        '<select class="select" name="outcome"><option value="win">Win</option><option value="loss">Loss</option></select></label>' +
        '<label class="field" style="flex:1"><span class="label">Score / place</span>' +
        '<input class="input" name="score" placeholder="13–9" maxlength="24" /></div>' +
        '<div class="field"><span class="label">Mode</span><input class="input" name="mode" placeholder="Competitive" maxlength="32" /></div>' +
        '<div class="field"><span class="label">Opponent</span><input class="input" name="opponent" placeholder="Who did you beat?" maxlength="32" /></div>' +
        '<button type="submit" class="btn btn-primary btn-block" style="margin-top:6px">' + UI.icon("check") + "Save result</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  };

  LL.actions["home:logSubmit"] = function (form) {
    const gameId = form.querySelector('[name="game"]').value;
    const outcome = form.querySelector('[name="outcome"]').value;
    const score = form.querySelector('[name="score"]').value.trim();
    const mode = form.querySelector('[name="mode"]').value.trim();
    const opponent = form.querySelector('[name="opponent"]').value.trim();
    if (!gameId) {
      UI.toast("Pick a game first.", "err");
      return;
    }
    UI.closeModal();
    S.logMatch({ gameId: gameId, outcome: outcome, score: score, mode: mode, opponent: opponent });
  };

  /* ---------------- screen ---------------- */

  function render() {
    return (
      '<div class="stack">' +
      heroCard() +
      statsRow() +
      challengeCard() +
      '<div id="featured-card">' + featuredCard() + "</div>" +
      '<div class="two-col">' + lobbiesCard() + tournamentsCard() + "</div>" +
      resultsCard() +
      squadStrip() +
      '<p class="tiny muted center" style="padding:6px 0 4px">Lobby Legends runs as a local demo. Friend activity and group stats live only in this browser.</p>' +
      "</div>"
    );
  }

  LL.screens = LL.screens || {};
  LL.screens.home = {
    render: render,
    mount: function () {
      LL.app.every(function () {
        if (UI.modalOpen() || document.hidden) return;
        const list = featured();
        featuredIndex = (featuredIndex + 1) % Math.max(1, list.length);
        UI.patch("#featured-card", featuredCard());
      }, 9000);
    }
  };
})();
