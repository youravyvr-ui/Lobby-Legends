/* ============================================================
   Lobby Legends — group leaderboards + rivalries
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  let scope = "all";
  let metric = "xp";

  const METRICS = [
    { id: "xp", label: "XP", icon: "bolt" },
    { id: "wins", label: "Wins", icon: "trophy" },
    { id: "challenges", label: "Challenges", icon: "target" },
    { id: "tournaments", label: "Cups", icon: "crown" },
    { id: "winrate", label: "Win rate", icon: "chart" }
  ];

  function formatValue(value, key) {
    if (key === "winrate") return value + "%";
    if (key === "xp") return value.toLocaleString() + " XP";
    return String(value);
  }

  function podium(rows) {
    if (rows.length < 3) return "";
    const order = [rows[1], rows[0], rows[2]];
    const places = ["p2", "p1", "p3"];
    return (
      '<div class="podium">' +
      order
        .map(function (row, i) {
          const place = places[i];
          const person = row.person;
          return (
            '<div class="spot ' + place + '">' +
            (place === "p1" ? '<span class="crown">' + UI.icon("crown") + "</span>" : "") +
            UI.avatar(person, place === "p1" ? "md" : "sm") +
            '<span class="nm">' + UI.esc(person.name) + (person.isYou ? " (you)" : "") + "</span>" +
            '<div class="plinth">' + row.rank + "</div>" +
            '<span class="tiny muted mono">' + formatValue(row.value, scope === "week" ? "xp" : metric) + "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function rivalriesSection() {
    const rivalries = S.get().rivalries;
    return (
      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Your rivalries</h2>' +
      '<p class="tiny muted">Head-to-head records you keep yourself</p></div>' +
      '<button type="button" class="link-btn" data-act="lb:pickRival">' + UI.icon("plus") + "New rival</button></div>" +
      (rivalries.length
        ? '<div class="stack-sm" style="margin-top:12px">' +
          rivalries
            .map(function (rivalry) {
              const person = S.person(rivalry.friendId);
              const total = rivalry.wins + rivalry.losses;
              const share = total ? Math.round((rivalry.wins / total) * 100) : 50;
              const leading = rivalry.wins > rivalry.losses;
              return (
                '<div class="panel">' +
                '<div class="between"><div class="row">' + UI.avatar(person, "sm") +
                '<div><b class="sm">' + UI.esc(person.name) + "</b>" +
                '<p class="tiny muted">Since ' + U.relDay(rivalry.since) + " · " + total + " matches</p></div></div>" +
                '<span class="badge ' + (leading ? "neon" : rivalry.wins === rivalry.losses ? "orange" : "red") + '">' +
                rivalry.wins + " – " + rivalry.losses + "</span></div>" +
                '<div class="bar thin" style="margin-top:10px"><i style="width:' + share + '%"></i></div>' +
                '<div class="between" style="margin-top:5px"><span class="tiny muted">You</span><span class="tiny muted">' + UI.esc(person.name) + "</span></div>" +
                '<div class="row" style="gap:6px;margin-top:10px">' +
                '<button type="button" class="btn btn-sm btn-line" style="flex:1" data-act="lb:logRivalWin" data-id="' + person.id + '">I won a match</button>' +
                '<button type="button" class="btn btn-sm btn-line" style="flex:1" data-act="lb:logRivalLoss" data-id="' + person.id + '">They won</button>' +
                '<button type="button" class="icon-btn sm" data-act="lb:removeRival" data-id="' + person.id + '" aria-label="Remove rivalry">' + UI.icon("trash") + "</button>" +
                "</div>" +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : UI.empty({
            icon: "bolt",
            title: "No rivalries yet",
            text: "Pick someone from the board and start a friendly rivalry. Records are whatever you both agree on — not pulled from a game account.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="lb:pickRival">Start a rivalry</button>'
          })) +
      "</section>"
    );
  }

  function render() {
    const rows = S.leaderboard(scope, metric);
    const key = scope === "week" ? "xp" : metric;
    const mine = rows.find(function (r) {
      return r.person.isYou;
    });
    const topValue = rows.length ? rows[0].value : 0;

    return (
      '<div class="stack">' +
      '<div><p class="tiny upper muted">Who runs the group</p><h1 class="display">Leaderboards</h1>' +
      '<p class="sm muted" style="margin-top:4px">Live from your saved progress and the sample squad</p></div>' +

      UI.segmented(
        [
          { id: "all", label: "All-time" },
          { id: "week", label: "This week" }
        ],
        scope,
        "lb:scope"
      ) +

      (scope === "week"
        ? UI.notice("The weekly board ranks by XP earned this week. Other metrics are all-time.", "info", "calendar")
        : '<div class="row wrap" style="gap:6px">' +
          METRICS.map(function (m) {
            return UI.chip(m.label, { icon: m.icon, active: metric === m.id, act: "lb:metric", data: { id: m.id } });
          }).join("") +
          "</div>") +

      '<section class="card card-glow">' +
      '<div class="between" style="margin-bottom:2px"><div><h2 style="font-size:1rem">' + (scope === "week" ? "This week's podium" : "All-time podium") + "</h2>" +
      '<p class="tiny muted">' + METRICS.filter(function (m) { return m.id === key; })[0].label + " · " + rows.length + " players</p></div>" +
      (mine ? '<span class="badge neon">You are #' + mine.rank + "</span>" : "") + "</div>" +
      podium(rows) +
      "</section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">Full ranking</h2>' +
      '<div class="stack-sm" style="margin-top:10px">' +
      rows
        .map(function (row) {
          const person = row.person;
          const rivalry = S.rivalry(person.id);
          const width = topValue ? Math.round((row.value / topValue) * 100) : 0;
          return (
            '<div class="rank-row ' + (person.isYou ? "you" : "") + '">' +
            '<span class="pos ' + (row.rank <= 3 ? "top" : "") + '">' + row.rank + "</span>" +
            UI.avatar(person, "sm") +
            '<button type="button" style="background:none;border:0;padding:0;text-align:left;color:inherit;font:inherit;flex:1;min-width:0;cursor:pointer" data-act="lb:player" data-id="' + person.id + '">' +
            '<b class="sm" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + UI.esc(person.name) + (person.isYou ? " (you)" : "") + "</b>" +
            '<span class="tiny muted">Lv ' + U.levelFor(person.xp).level + " · " + person.wins + "W " + person.losses + "L" +
            (rivalry ? " · H2H " + rivalry.wins + "–" + rivalry.losses : "") + "</span>" +
            '<span class="bar thin" style="margin-top:5px"><i style="width:' + width + '%"></i></span>' +
            "</button>" +
            '<span class="spacer"></span>' +
            '<span class="sm strong mono" style="flex:none">' + formatValue(row.value, key) + "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div></section>" +

      rivalriesSection() +

      UI.notice("Group stats on this board are local sample data plus your own logged results. Lobby Legends never claims these are official game statistics.", "info", "shield") +
      "</div>"
    );
  }

  /* ---------------- actions ---------------- */

  LL.actions["lb:scope"] = function (el) {
    scope = el.dataset.id;
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["lb:metric"] = function (el) {
    metric = el.dataset.id;
    LL.app.refresh({ keepScroll: true });
  };

  LL.actions["lb:player"] = function (el) {
    const person = S.person(el.dataset.id);
    const rivalry = S.rivalry(person.id);
    const played = person.wins + person.losses;
    const winRate = played ? Math.round((person.wins / played) * 100) : 0;
    UI.openModal({
      title: person.isYou ? "Your profile" : UI.esc(person.name),
      subtitle: "Local group stats — entered by you, not pulled from a game account.",
      body:
        '<div class="row" style="gap:12px">' +
        UI.avatar(person, "lg") +
        "<div>" +
        '<div class="row wrap" style="gap:6px">' +
        UI.badge("Level " + U.levelFor(person.xp).level, "neon", "star") +
        (rivalry ? UI.badge("Rival", "orange", "bolt") : "") +
        "</div>" +
        '<p class="tiny muted" style="margin-top:6px">' + UI.esc(person.tagline || "") + "</p>" +
        "</div></div>" +
        '<div class="grid grid-2" style="margin-top:14px">' +
        UI.stat({ label: "XP", value: person.xp.toLocaleString(), tone: "neon" }) +
        UI.stat({ label: "Weekly XP", value: person.weeklyXp.toLocaleString(), tone: "blue" }) +
        UI.stat({ label: "Wins", value: person.wins }) +
        UI.stat({ label: "Win rate", value: winRate + "%" }) +
        UI.stat({ label: "Challenges", value: person.challenges }) +
        UI.stat({ label: "Cups", value: person.tournaments, tone: "orange" }) +
        "</div>" +
        (rivalry
          ? '<div class="panel" style="margin-top:12px"><div class="between"><b class="sm">Head to head</b>' +
            '<span class="badge ' + (rivalry.wins > rivalry.losses ? "neon" : "red") + '">' + rivalry.wins + " – " + rivalry.losses + "</span></div></div>"
          : "") +
        (person.isYou
          ? ""
          : '<div class="row" style="gap:8px;margin-top:14px">' +
            (rivalry
              ? '<button type="button" class="btn btn-line" style="flex:1" data-act="ui:closeModal">Close</button>'
              : '<button type="button" class="btn btn-primary" style="flex:1" data-act="lb:makeRival" data-id="' + person.id + '">' + UI.icon("bolt") + "Start a rivalry</button>") +
            "</div>")
    });
  };

  LL.actions["lb:makeRival"] = function (el) {
    UI.closeModal();
    S.addRivalry(el.dataset.id);
  };

  LL.actions["lb:pickRival"] = function () {
    const taken = S.get().rivalries.map(function (r) {
      return r.friendId;
    });
    const options = S.friends().filter(function (f) {
      return taken.indexOf(f.id) === -1;
    });
    if (!options.length) {
      UI.toast("You already have a rivalry with everyone in the squad.", "warn");
      return;
    }
    UI.openModal({
      title: "Start a rivalry",
      subtitle: "Pick a friend. Records start at 0–0 and you log results yourselves.",
      body:
        '<div class="check-list">' +
        options
          .map(function (person) {
            return (
              '<button type="button" class="check-item" data-act="lb:makeRival" data-id="' + person.id + '">' +
              UI.avatar(person, "xs") +
              "<b>" + UI.esc(person.name) + "</b>" +
              '<span class="spacer"></span>' +
              '<span class="tiny muted">Lv ' + U.levelFor(person.xp).level + "</span>" +
              "</button>"
            );
          })
          .join("") +
        "</div>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  };

  LL.actions["lb:logRivalWin"] = function (el) {
    const rivalry = S.rivalry(el.dataset.id);
    if (!rivalry) return;
    rivalry.wins += 1;
    S.save();
    S.emit();
    UI.toast("Head-to-head updated · " + rivalry.wins + "–" + rivalry.losses, "ok");
  };

  LL.actions["lb:logRivalLoss"] = function (el) {
    const rivalry = S.rivalry(el.dataset.id);
    if (!rivalry) return;
    rivalry.losses += 1;
    S.save();
    S.emit();
    UI.toast("Head-to-head updated · " + rivalry.wins + "–" + rivalry.losses, "warn");
  };

  LL.actions["lb:removeRival"] = function (el) {
    const person = S.person(el.dataset.id);
    UI.confirm({
      title: "End rivalry with " + person.name + "?",
      text: "The head-to-head record is deleted from this device.",
      okLabel: "End rivalry",
      danger: true,
      act: "lb:removeRivalConfirmed",
      data: { id: person.id }
    });
  };

  LL.actions["lb:removeRivalConfirmed"] = function (el) {
    UI.closeModal();
    S.removeRivalry(el.dataset.id);
    UI.toast("Rivalry removed", "warn");
  };

  LL.screens.leaderboards = { render: render };
})();
