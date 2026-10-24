/* ============================================================
   Lobby Legends — profile, achievements, trophies
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  let tab = "matches";
  let edit = { avatar: "🦈", accent: "neon", favorites: [] };

  function profileTabBar() {
    return UI.segmented(
      [
        { id: "matches", label: "Matches" },
        { id: "challenges", label: "Challenges" },
        { id: "trophies", label: "Trophies" }
      ],
      tab,
      "profile:tab"
    );
  }

  function matchesPanel() {
    if (S.get().settings.privacy.showHistory === false) {
      return (
        '<section class="card">' +
        UI.empty({
          icon: "eye",
          title: "Match history is hidden",
          text: "Your privacy settings are hiding match results. Turn \u201cShow my match history\u201d back on to see them again.",
          action: '<button type="button" class="btn btn-line btn-sm" data-act="nav" data-to="#/settings">Open settings</button>'
        }) +
        "</section>"
      );
    }
    const matches = S.get().matches;
    return (
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Match history</h2>' +
      '<p class="tiny muted">Every result here was logged by you</p></div>' +
      '<button type="button" class="btn btn-sm btn-line" data-act="profile:logMatch">' + UI.icon("plus") + "Log</button></div>" +
      (matches.length
        ? '<div class="stack-sm" style="margin-top:12px">' + matches.slice(0, 12).map(UI.matchRow).join("") + "</div>"
        : UI.empty({
            icon: "gamepad",
            title: "No matches logged",
            text: "Log your first result to start building a real record.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="profile:logMatch">Log a match</button>'
          })) +
      "</section>"
    );
  }

  function challengesPanel() {
    const log = S.get().challengeLog;
    return (
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Challenge history</h2>' +
      '<p class="tiny muted">' + log.length + " completed · " + U.sum(log, function (c) { return c.xp; }) + " XP earned</p></div>" +
      '<button type="button" class="btn btn-sm btn-line" data-act="nav" data-to="#/challenges">Browse</button></div>' +
      (log.length
        ? '<div class="stack-sm" style="margin-top:12px">' +
          log
            .map(function (entry) {
              const game = S.game(entry.gameId);
              return (
                '<div class="row-item">' +
                (game ? UI.gameIcon(game, "sm") : '<span class="game-icon sm">' + UI.icon("target") + "</span>") +
                '<div class="row-main"><b>' + UI.esc(entry.title) + "</b><span>" + U.relDay(entry.completedAt) + " · " + UI.esc(game ? game.name : "Custom") + "</span></div>" +
                UI.difficultyChip(entry.difficulty) +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : UI.empty({ icon: "target", title: "No challenges completed", text: "Your daily challenge is waiting on the home screen." })) +
      "</section>"
    );
  }

  function trophiesPanel() {
    const tours = S.get().tournaments.filter(function (t) {
      return t.status === "complete";
    });
    const won = tours.filter(function (t) {
      return t.champion === "me";
    });
    return (
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Trophy case</h2>' +
      '<p class="tiny muted">' + won.length + " cup" + (won.length === 1 ? "" : "s") + " won</p></div>" +
      '<button type="button" class="btn btn-sm btn-line" data-act="nav" data-to="#/tournaments">Brackets</button></div>' +
      (won.length
        ? '<div class="grid grid-2" style="margin-top:12px">' +
          won
            .map(function (t) {
              const game = S.game(t.gameId);
              return (
                '<button type="button" class="trophy" style="text-align:left;color:inherit;font:inherit;cursor:pointer" data-act="nav" data-to="#/tournament/' + t.id + '">' +
                UI.icon("trophy") +
                '<b class="sm" style="margin-top:4px">' + UI.esc(t.name) + "</b>" +
                '<span class="tiny muted">' + UI.esc(game ? game.name : "Game") + " · " + U.relDay(t.completedAt || t.createdAt) + "</span>" +
                "</button>"
              );
            })
            .join("") +
          "</div>"
        : UI.empty({ icon: "trophy", title: "No trophies yet", text: "Win a bracket with your squad and it lands here." })) +
      "</section>" +
      (tours.length
        ? '<section class="card"><h2 style="font-size:1rem">All finished cups</h2><div class="stack-sm" style="margin-top:10px">' +
          tours
            .map(function (t) {
              return (
                '<div class="row-item">' +
                UI.gameIcon(S.game(t.gameId), "sm") +
                '<div class="row-main"><b>' + UI.esc(t.name) + "</b><span>" + UI.esc(S.personName(t.champion)) + " won · " + U.relDay(t.completedAt || t.createdAt) + "</span></div>" +
                (t.champion === "me" ? UI.badge("Yours", "neon", "crown") : UI.badge("Champion", "orange")) +
                "</div>"
              );
            })
            .join("") +
          "</div></section>"
        : "")
    );
  }

  function achievementsSection() {
    const list = S.achievements();
    const unlocked = list.filter(function (a) { return a.unlocked; }).length;
    return (
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Achievements</h2>' +
      '<p class="tiny muted">' + unlocked + " of " + list.length + " unlocked</p></div>" + UI.badge("+" + unlocked * 50 + " XP", "neon") + "</div>" +
      '<div style="margin-top:10px">' + UI.bar(U.pct(unlocked, list.length)) + "</div>" +
      '<div class="stack-sm" style="margin-top:12px">' +
      list
        .slice()
        .sort(function (a, b) {
          return Number(b.unlocked) - Number(a.unlocked);
        })
        .map(function (a) {
          return (
            '<div class="ach ' + (a.unlocked ? "" : "locked") + '">' +
            '<span class="ach-ico">' + UI.icon(a.icon) + "</span>" +
            "<div><b>" + UI.esc(a.name) + "</b><span>" + UI.esc(a.desc) + "</span></div>" +
            '<span class="spacer"></span>' +
            (a.unlocked ? UI.badge("Unlocked", "neon", "check") : UI.badge("Locked", "", "lock")) +
            "</div>"
          );
        })
        .join("") +
      "</div></section>"
    );
  }

  function render() {
    const state = S.get();
    const me = S.person("me");
    const level = S.level();
    const played = state.stats.wins + state.stats.losses;
    const winRate = played ? Math.round((state.stats.wins / played) * 100) : 0;
    const favorites = (state.profile.favoriteGames || []).map(function (id) {
      return S.game(id);
    }).filter(Boolean);

    return (
      '<div class="stack">' +
      '<section class="profile-banner">' +
      '<div class="row" style="gap:14px;align-items:flex-start">' +
      UI.avatar(me, "xl me") +
      '<div class="row-main">' +
      '<div class="row wrap" style="gap:6px">' +
      UI.badge("Level " + level.level, "neon", "star") +
      UI.badge(state.streak + " day streak", "orange", "flame") +
      (state.premium.demo ? UI.badge("Premium demo", "purple", "crown") : "") +
      "</div>" +
      "<h1 style=\"font-size:1.5rem;margin-top:6px\">" + UI.esc(me.name) + "</h1>" +
      '<p class="sm dim" style="margin-top:3px">' + UI.esc(state.profile.region || "No region set") + "</p>" +
      "</div>" +
      '<button type="button" class="icon-btn" data-act="profile:edit" aria-label="Edit profile">' + UI.icon("edit") + "</button>" +
      "</div>" +
      '<p class="sm" style="margin-top:12px;line-height:1.5;color:var(--text-2)">' + UI.esc(state.profile.bio) + "</p>" +
      '<div style="margin-top:14px">' +
      '<div class="between"><span class="upper muted">Level ' + level.level + "</span>" +
      '<span class="tiny mono muted">' + level.into + " / " + level.need + " XP</span></div>" +
      '<div style="margin-top:6px">' + UI.bar(level.pct) + "</div></div>" +
      '<div class="row wrap" style="gap:5px;margin-top:12px">' +
      (favorites.length
        ? favorites.map(function (g) {
            return '<span class="chip static">' + g.emoji + " " + UI.esc(g.name) + "</span>";
          }).join("")
        : '<span class="tiny muted">Add favourite games to show them off.</span>') +
      "</div>" +
      "</section>" +

      '<div class="grid grid-4">' +
      UI.stat({ label: "XP", value: state.xp.toLocaleString(), tone: "neon" }) +
      UI.stat({ label: "Wins", value: state.stats.wins }) +
      UI.stat({ label: "Win rate", value: winRate + "%", tone: "blue" }) +
      UI.stat({ label: "Cups", value: state.stats.tournaments, tone: "orange" }) +
      "</div>" +

      (state.premium.demo
        ? UI.notice("<b>Premium demo is on.</b> Nothing was charged and no subscription is active — this only unlocks the demo cosmetics.", "info", "crown")
        : '<section class="card" style="display:flex;gap:12px;align-items:center">' +
          '<span class="game-icon" style="--hue:48">' + UI.icon("crown") + "</span>" +
          '<div class="row-main"><b class="sm">Preview Premium</b><span class="tiny muted">Extra stats, customisation and challenge packs — demo only.</span></div>' +
          '<button type="button" class="btn btn-sm btn-soft" data-act="nav" data-to="#/premium">Look</button></section>') +

      profileTabBar() +
      (tab === "challenges" ? challengesPanel() : tab === "trophies" ? trophiesPanel() : matchesPanel()) +
      achievementsSection() +

      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Squad rank</h2>' +
      '<p class="tiny muted">Where you sit in the group right now</p></div>' +
      '<button type="button" class="link-btn" data-act="nav" data-to="#/leaderboards">Board' + UI.icon("chevronRight") + "</button></div>" +
      '<div class="stack-sm" style="margin-top:10px">' +
      S.leaderboard("all", "xp")
        .slice(0, 4)
        .map(function (row) {
          return (
            '<div class="rank-row ' + (row.person.isYou ? "you" : "") + '">' +
            '<span class="pos ' + (row.rank <= 3 ? "top" : "") + '">' + row.rank + "</span>" +
            UI.avatar(row.person, "sm") +
            '<span class="row-main"><b class="sm">' + UI.esc(row.person.name) + (row.person.isYou ? " (you)" : "") + "</b>" +
            '<span class="tiny muted">Level ' + U.levelFor(row.person.xp).level + "</span></span>" +
            '<span class="sm strong mono">' + row.value.toLocaleString() + " XP</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div></section>" +

      '<div class="row" style="gap:8px">' +
      '<button type="button" class="btn btn-ghost" style="flex:1" data-act="nav" data-to="#/settings">' + UI.icon("sliders") + "Settings</button>" +
      '<button type="button" class="btn btn-line" style="flex:1" data-act="nav" data-to="#/leaderboards">' + UI.icon("chart") + "Leaderboards</button>" +
      "</div>" +
      "</div>"
    );
  }

  /* ---------------- edit modal ---------------- */

  function openEdit() {
    const state = S.get();
    edit = {
      avatar: state.profile.avatar,
      accent: state.profile.accent,
      favorites: (state.profile.favoriteGames || []).slice()
    };
    UI.openModal({
      title: "Customise your profile",
      subtitle: "Everything here is local to this device.",
      body:
        '<form data-act="profile:save" class="stack-sm">' +
        '<div class="row" style="gap:12px;align-items:center">' +
        '<span id="edit-avatar">' + UI.avatar({ name: state.profile.name, avatar: edit.avatar }, "lg me") + "</span>" +
        '<label class="field" style="flex:1"><span class="label">Username</span>' +
        '<input class="input" name="name" value="' + UI.esc(state.profile.name) + '" maxlength="20" /></label></div>' +
        '<div><span class="label">Avatar</span><div class="emoji-pick" id="edit-emojis" style="margin-top:6px">' +
        LL.seed.EMOJIS.map(function (emoji) {
          return '<button type="button" aria-pressed="' + (edit.avatar === emoji ? "true" : "false") + '" data-act="profile:pickAvatar" data-emoji="' + emoji + '">' + emoji + "</button>";
        }).join("") +
        "</div></div>" +
        '<label class="field"><span class="label">Gamer bio</span>' +
        '<textarea class="input" name="bio" maxlength="160">' + UI.esc(state.profile.bio) + "</textarea></label>" +
        '<label class="field"><span class="label">Region / timezone</span>' +
        '<input class="input" name="region" value="' + UI.esc(state.profile.region || "") + '" maxlength="20" placeholder="EU-West" /></label>' +
        '<div><span class="label">Accent colour</span><div class="row" style="gap:6px;margin-top:6px" id="edit-accents">' +
        ["neon", "orange", "blue", "red"]
          .map(function (accent) {
            return UI.chip(accent.charAt(0).toUpperCase() + accent.slice(1), {
              active: edit.accent === accent,
              act: "profile:pickAccent",
              data: { id: accent }
            });
          })
          .join("") +
        "</div></div>" +
        '<div><span class="label">Favourite games</span>' +
        '<div id="edit-favs" style="margin-top:6px">' + UI.gameOptions(S.libraryGames().length ? S.libraryGames() : S.games().slice(0, 8), edit.favorites, "profile:pickFav") + "</div></div>" +
        '<button type="submit" class="btn btn-primary btn-block">' + UI.icon("check") + "Save profile</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  }

  LL.actions["profile:edit"] = openEdit;

  LL.actions["profile:pickAvatar"] = function (el) {
    edit.avatar = el.dataset.emoji;
    const nameInput = document.querySelector('[name="name"]');
    UI.patch("#edit-avatar", UI.avatar({ name: nameInput ? nameInput.value : "you", avatar: edit.avatar }, "lg me"));
    UI.patch(
      "#edit-emojis",
      LL.seed.EMOJIS.map(function (emoji) {
        return (
          '<button type="button" aria-pressed="' +
          (edit.avatar === emoji ? "true" : "false") +
          '" data-act="profile:pickAvatar" data-emoji="' +
          emoji +
          '">' +
          emoji +
          "</button>"
        );
      }).join("")
    );
  };

  LL.actions["profile:pickAccent"] = function (el) {
    edit.accent = el.dataset.id;
    UI.patch(
      "#edit-accents",
      ["neon", "orange", "blue", "red"]
        .map(function (accent) {
          return UI.chip(accent.charAt(0).toUpperCase() + accent.slice(1), {
            active: edit.accent === accent,
            act: "profile:pickAccent",
            data: { id: accent }
          });
        })
        .join("")
    );
  };

  LL.actions["profile:pickFav"] = function (el) {
    const id = el.dataset.id;
    const index = edit.favorites.indexOf(id);
    if (index >= 0) edit.favorites.splice(index, 1);
    else if (edit.favorites.length >= 5) {
      UI.toast("Five favourite games is plenty.", "warn");
      return;
    } else edit.favorites.push(id);
    UI.patch(
      "#edit-favs",
      UI.gameOptions(S.libraryGames().length ? S.libraryGames() : S.games().slice(0, 8), edit.favorites, "profile:pickFav")
    );
  };

  LL.actions["profile:save"] = function (form) {
    const name = form.querySelector('[name="name"]').value.trim().slice(0, 20) || "Player";
    const bio = form.querySelector('[name="bio"]').value.trim().slice(0, 160);
    const region = form.querySelector('[name="region"]').value.trim().slice(0, 20);
    S.update(function (state) {
      state.profile.name = name;
      state.profile.avatar = edit.avatar;
      state.profile.bio = bio || "No bio yet — but definitely here to win.";
      state.profile.region = region;
      state.profile.accent = edit.accent;
      state.profile.favoriteGames = edit.favorites.slice();
    });
    S.applySettings();
    UI.closeModal();
    UI.toast("Profile updated", "ok");
  };

  LL.actions["profile:tab"] = function (el) {
    tab = el.dataset.id;
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["profile:logMatch"] = function () {
    LL.actions["home:logModal"]();
  };

  LL.screens.profile = { render: render };
})();
