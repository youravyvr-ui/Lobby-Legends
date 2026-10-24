/* ============================================================
   Lobby Legends — tournaments + single-elimination brackets
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  let draft = { name: "", gameId: null, size: 4, participants: [] };

  function openScores(tourId, roundIndex, matchIndex) {
    const t = S.tournament(tourId);
    if (!t) return;
    const match = t.rounds[roundIndex].matches[matchIndex];
    if (!match.a || !match.b) {
      UI.toast("Both players aren't decided for this match yet.", "warn");
      return;
    }
    const a = S.person(match.a);
    const b = S.person(match.b);
    UI.openModal({
      title: t.rounds[roundIndex].name,
      subtitle: UI.esc(a.name) + " vs " + UI.esc(b.name) + " · enter the final score",
      body:
        '<form data-act="tour:submitScore" class="stack-sm">' +
        '<input type="hidden" name="tour" value="' + t.id + '" />' +
        '<input type="hidden" name="round" value="' + roundIndex + '" />' +
        '<input type="hidden" name="match" value="' + matchIndex + '" />' +
        '<div class="row" style="gap:10px;align-items:flex-end">' +
        '<label class="field" style="flex:1"><span class="label">' + UI.esc(a.name) + "</span>" +
        '<input class="input" name="sa" type="number" min="0" max="99" inputmode="numeric" value="' + (match.sa == null ? "" : match.sa) + '" placeholder="0" required /></label>' +
        '<span class="muted" style="padding-bottom:12px">—</span>' +
        '<label class="field" style="flex:1"><span class="label">' + UI.esc(b.name) + "</span>" +
        '<input class="input" name="sb" type="number" min="0" max="99" inputmode="numeric" value="' + (match.sb == null ? "" : match.sb) + '" placeholder="0" required /></label></div>' +
        '<p class="tiny muted">Scores can\'t be tied — a bracket needs a winner.</p>' +
        '<button type="submit" class="btn btn-primary btn-block">' + UI.icon("check") + "Confirm result</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  }

  function bracketMatch(t, roundIndex, matchIndex, match) {
    const a = match.a ? S.person(match.a) : null;
    const b = match.b ? S.person(match.b) : null;
    const done = !!match.winner;
    const ready = !!(a && b && !done);
    return (
      '<button type="button" class="bmatch ' + (done ? "done" : ready ? "ready" : "") + '" data-act="tour:match" data-id="' + t.id + '" data-r="' + roundIndex + '" data-m="' + matchIndex + '">' +
      '<span class="side ' + (done && match.winner === match.a ? "win" : done ? "lose" : "") + '">' +
      '<span class="nm">' + (a ? UI.avatar(a, "xs") + UI.esc(a.name) : '<span class="tbd">TBD</span>') + "</span>" +
      '<span class="sc">' + (match.sa == null ? "–" : match.sa) + "</span></span>" +
      '<span class="vs-line"></span>' +
      '<span class="side ' + (done && match.winner === match.b ? "win" : done ? "lose" : "") + '">' +
      '<span class="nm">' + (b ? UI.avatar(b, "xs") + UI.esc(b.name) : '<span class="tbd">TBD</span>') + "</span>" +
      '<span class="sc">' + (match.sb == null ? "–" : match.sb) + "</span></span>" +
      "</button>"
    );
  }

  function bracketHtml(t) {
    return (
      '<div class="bracket">' +
      t.rounds
        .map(function (round, r) {
          return (
            '<div class="round">' +
            '<div class="round-title">' + UI.esc(round.name) + "</div>" +
            '<div class="round-matches">' +
            round.matches
              .map(function (match, m) {
                return bracketMatch(t, r, m, match);
              })
              .join("") +
            "</div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function championCard(t, compact) {
    if (!t.champion) return "";
    const champion = S.person(t.champion);
    const runner = t.runnerUp ? S.person(t.runnerUp) : null;
    return (
      '<div class="hero" style="padding:16px">' +
      '<div class="row" style="gap:12px">' +
      UI.avatar(champion, compact ? "md" : "lg") +
      '<div class="row-main"><span class="tiny upper muted">' + (compact ? "Champion" : "Tournament champion") + "</span>" +
      '<h2 style="font-size:1.15rem">' + UI.esc(champion.name) + (champion.isYou ? " (you)" : "") + "</h2>" +
      (runner ? '<p class="tiny muted">' + UI.esc(runner.name) + " finished runner-up</p>" : "") +
      "</div>" +
      '<span class="crown" style="font-size:1.6rem">' + UI.icon("trophy") + "</span>" +
      "</div>" +
      (compact
        ? ""
        : '<div class="row wrap" style="gap:6px;margin-top:12px">' +
          UI.badge("Champion", "neon", "crown") +
          (t.completedAt ? '<span class="badge">' + U.relDay(t.completedAt) + "</span>" : "") +
          '<span class="badge">' + UI.esc(t.size + "-player bracket") + "</span>" +
          "</div>") +
      "</div>"
    );
  }

  function progress(t) {
    let total = 0;
    let done = 0;
    t.rounds.forEach(function (round) {
      total += round.matches.length;
      done += round.matches.filter(function (m) {
        return !!m.winner;
      }).length;
    });
    return { total: total, done: done, pct: U.pct(done, total) };
  }

  /* ---------------- list ---------------- */

  function tourCard(t) {
    const game = S.game(t.gameId);
    const prog = progress(t);
    return (
      '<button type="button" class="card card-tap" style="text-align:left;color:inherit;font:inherit" data-act="nav" data-to="#/tournament/' + t.id + '">' +
      '<div class="between">' +
      '<div class="row" style="min-width:0">' + UI.gameIcon(game) +
      '<div style="min-width:0"><b style="display:block;font-size:.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + UI.esc(t.name) + "</b>" +
      '<span class="tiny muted">' + UI.esc(game ? game.name : "Game") + " · " + t.size + " players</span></div></div>" +
      (t.status === "complete" ? UI.badge("Complete", "blue", "check") : UI.badge("Live", "neon", "bolt")) +
      "</div>" +
      (t.champion
        ? '<div class="row" style="margin-top:10px">' + UI.avatar(S.person(t.champion), "sm") +
          '<span class="sm"><b>' + UI.esc(S.personName(t.champion)) + "</b> took the cup</span>" +
          '<span class="spacer"></span><span class="crown">' + UI.icon("trophy") + "</span></div>"
        : '<div style="margin-top:10px">' + UI.bar(prog.pct) +
          '<p class="tiny muted" style="margin-top:5px">' + prog.done + " of " + prog.total + " matches confirmed</p></div>") +
      "</button>"
    );
  }

  function renderList() {
    const all = S.get().tournaments;
    const live = all.filter(function (t) {
      return t.status !== "complete";
    });
    const done = all.filter(function (t) {
      return t.status === "complete";
    });
    return (
      '<div class="stack">' +
      '<div class="between"><div><p class="tiny upper muted">Crown a champion</p><h1 class="display">Tournaments</h1>' +
      '<p class="sm muted" style="margin-top:4px">Single elimination · scores you confirm yourself</p></div>' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="tour:create">' + UI.icon("plus") + "New</button></div>" +
      (live.length
        ? '<section class="stack-sm">' + UI.sectionHead("Running now", live.length + " bracket" + (live.length === 1 ? "" : "s")) +
          live.map(tourCard).join("") + "</section>"
        : UI.empty({
            icon: "trophy",
            title: "No live tournaments",
            text: "Create a bracket for 4 or 8 players and let the squad fight it out.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="tour:create">' + UI.icon("plus") + "Create tournament</button>"
          })) +
      (done.length
        ? '<section class="stack-sm">' + UI.sectionHead("History", "Champions of past cups") +
          done
            .map(function (t) {
              return tourCard(t);
            })
            .join("") + "</section>"
        : "") +
      UI.notice("Bracket results are only what you enter. Nothing is pulled from a game account, so treat scores as your group's own record keeping.", "info", "info") +
      "</div>"
    );
  }

  /* ---------------- detail ---------------- */

  function renderDetail(params) {
    const t = S.tournament(params.id);
    if (!t) {
      return (
        '<div class="stack">' +
        UI.sectionHead("Tournament", "Not found") +
        UI.empty({
          icon: "alert",
          title: "That bracket is gone",
          text: "It may have been deleted from this device.",
          action: '<button type="button" class="btn btn-primary btn-sm" data-act="nav" data-to="#/tournaments">All tournaments</button>'
        }) +
        "</div>"
      );
    }
    const game = S.game(t.gameId);
    const prog = progress(t);
    const playable = S.nextPlayableMatches(t);
    const initial = t.rounds[0].matches.filter(function (m) {
      return m.a && m.b;
    });

    return (
      '<div class="stack">' +
      '<div class="row" style="gap:8px">' +
      '<button type="button" class="icon-btn" data-act="nav" data-to="#/tournaments" aria-label="Back to tournaments">' + UI.icon("arrowLeft") + "</button>" +
      '<div class="row-main"><p class="tiny upper muted">' + UI.esc(t.status === "complete" ? "Completed bracket" : "In progress") + "</p>" +
      '<h1 style="font-size:1.3rem">' + UI.esc(t.name) + "</h1></div>" +
      '<button type="button" class="icon-btn" data-act="tour:delete" data-id="' + t.id + '" aria-label="Delete tournament">' + UI.icon("trash") + "</button>" +
      "</div>" +

      '<section class="card">' +
      '<div class="between"><div class="row" style="gap:8px">' + UI.gameIcon(game, "sm") +
      "<div><b class=\"sm\">" + UI.esc(game ? game.name : "Game") + "</b>" +
      '<p class="tiny muted">' + t.size + " players · created " + U.relDay(t.createdAt) + "</p></div></div>" +
      (t.status === "complete" ? UI.badge("Complete", "blue", "check") : UI.badge("Live", "neon", "bolt")) + "</div>" +
      '<div style="margin-top:12px">' + UI.bar(prog.pct) +
      '<div class="between" style="margin-top:5px"><span class="tiny muted">' + prog.done + " / " + prog.total + " matches confirmed</span>" +
      '<span class="tiny muted">' + prog.pct + "%</span></div></div>" +
      '<div class="row wrap" style="gap:6px;margin-top:12px">' +
      t.participants
        .slice(0, 8)
        .map(function (id) {
          const person = S.person(id);
          return '<span class="chip static"' + (t.champion === id ? ' style="border-color:var(--accent);color:var(--accent)"' : "") + ">" + UI.avatar(person, "xs") + UI.esc(person.name) + (t.champion === id ? " 🏆" : "") + "</span>";
        })
        .join("") +
      "</div>" +
      (playable.length
        ? '<button type="button" class="btn btn-primary btn-block" style="margin-top:12px" data-act="tour:match" data-id="' + t.id + '" data-r="' + playable[0].round + '" data-m="' + playable[0].match + '">' +
          UI.icon("play") + "Enter next score</button>"
        : "") +
      '<button type="button" class="btn btn-line btn-block btn-sm" style="margin-top:8px" data-act="tour:simulate" data-id="' + t.id + '">' +
      UI.icon("dice") + "Simulate remaining matches (demo)</button>" +
      "</section>" +

      (t.champion ? championCard(t, false) : "") +

      '<section class="card">' +
      '<div class="between"><h2 style="font-size:1rem">Bracket</h2>' +
      '<button type="button" class="link-btn" data-act="ui:demo" data-msg="Drag-to-zoom brackets are a demo nicety — scroll sideways for now.">' + UI.icon("search") + "Zoom (demo)</button></div>" +
      '<p class="tiny muted" style="margin-top:4px">Tap a match to enter and confirm its score. Winners move on automatically.</p>' +
      '<div style="margin-top:12px">' + bracketHtml(t) + "</div>" +
      "</section>" +

      (initial.length < 2
        ? UI.notice("A bracket needs at least two seeded players.", "info", "info")
        : "") +

      '<section class="card"><h2 style="font-size:1rem">Match log</h2>' +
      '<div class="stack-sm" style="margin-top:10px">' +
      (prog.done
        ? t.rounds
            .map(function (round, r) {
              return round.matches
                .filter(function (m) {
                  return !!m.winner;
                })
                .map(function (m) {
                  return (
                    '<div class="row-item">' + UI.icon("check", "accent") +
                    '<div class="row-main"><b>' + UI.esc(S.personName(m.a)) + " " + m.sa + "–" + m.sb + " " + UI.esc(S.personName(m.b)) + "</b>" +
                    "<span>" + UI.esc(round.name) + " · winner: " + UI.esc(S.personName(m.winner)) + "</span></div>" +
                    UI.badge("Confirmed", "neon") + "</div>"
                  );
                })
                .join("");
            })
            .join("")
        : '<p class="tiny muted">No results confirmed yet.</p>') +
      "</div></section>" +
      "</div>"
    );
  }

  /* ---------------- create flow ---------------- */

  LL.actions["tour:create"] = function () {
    const games = S.games();
    draft = {
      name: U.pick(["Friday Night Cup", "Squad Showdown", "Grudge Gauntlet", "Weekend Bracket"]),
      gameId: S.get().library[0] || (LL.games[0] && LL.games[0].id),
      size: 4,
      participants: ["me"].concat(S.get().rivalries.map(function (r) { return r.friendId; })).slice(0, 4)
    };
    draft.participants = Array.from(new Set(draft.participants));
    while (draft.participants.length < 4) {
      const next = S.friends().find(function (f) {
        return draft.participants.indexOf(f.id) === -1;
      });
      if (!next) break;
      draft.participants.push(next.id);
    }
    UI.openModal({
      title: "Create a tournament",
      subtitle: "Seeds are drawn at random when the bracket is created.",
      body: createFormHtml(games),
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  };

  function createFormHtml(games) {
    const people = S.people();
    return (
      '<form data-act="tour:createSubmit" class="stack-sm">' +
      '<label class="field"><span class="label">Tournament name</span>' +
      '<input class="input" name="name" value="' + UI.esc(draft.name) + '" maxlength="40" /></label>' +
      '<label class="field"><span class="label">Game</span><select class="select" name="game" data-change-act="tour:draftGame">' +
      games
        .map(function (g) {
          return '<option value="' + g.id + '"' + (g.id === draft.gameId ? " selected" : "") + ">" + UI.esc(g.name) + "</option>";
        })
        .join("") +
      "</select></label>" +
      '<div><span class="label">Bracket size</span><div class="row" style="gap:6px;margin-top:6px" id="draft-sizes">' +
      [4, 8]
        .map(function (size) {
          return UI.chip(size + " players", { active: draft.size === size, act: "tour:draftSize", data: { size: size } });
        })
        .join("") +
      "</div></div>" +
      '<div class="between"><span class="label">Participants</span>' +
      '<span class="tiny ' + (draft.participants.length === draft.size ? "accent" : "orange") + '" id="draft-count">' + draft.participants.length + " / " + draft.size + " picked</span></div>" +
      '<div id="draft-people">' + peopleHtml(people) + "</div>" +
      '<button type="submit" class="btn btn-primary btn-block" style="margin-top:10px">' + UI.icon("trophy") + "Create bracket</button>" +
      "</form>"
    );
  }

  function peopleHtml(people) {
    return (
      '<div class="check-list">' +
      people
        .map(function (person) {
          const on = draft.participants.indexOf(person.id) >= 0;
          const locked = person.id === "me";
          return (
            '<button type="button" class="check-item ' +
            (on ? "on" : "") +
            '" data-act="tour:draftPerson" data-id="' +
            person.id +
            '"' +
            (locked ? " disabled" : "") +
            '><span class="tick">' +
            UI.icon("check") +
            "</span>" +
            UI.avatar(person, "xs") +
            "<b>" +
            UI.esc(person.name) +
            (person.isYou ? " (you)" : "") +
            "</b>" +
            '<span class="spacer"></span>' +
            '<span class="tiny muted">Lv ' +
            U.levelFor(person.xp).level +
            "</span></button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function syncCount() {
    const count = document.getElementById("draft-count");
    if (count) {
      count.textContent = draft.participants.length + " / " + draft.size + " picked";
      count.className = "tiny " + (draft.participants.length === draft.size ? "accent" : "orange");
    }
  }

  LL.actions["tour:draftGame"] = function (el) {
    draft.gameId = el.value;
  };

  LL.actions["tour:draftSize"] = function (el) {
    draft.size = Number(el.dataset.size);
    if (draft.participants.length > draft.size) draft.participants = draft.participants.slice(0, draft.size);
    if (draft.participants.indexOf("me") < 0) draft.participants.unshift("me");
    while (draft.participants.length < draft.size) {
      const next = S.friends().find(function (f) {
        return draft.participants.indexOf(f.id) === -1;
      });
      if (!next) break;
      draft.participants.push(next.id);
    }
    UI.patch("#draft-people", peopleHtml(S.people()));
    UI.patch(
      "#draft-sizes",
      [4, 8]
        .map(function (size) {
          return UI.chip(size + " players", { active: draft.size === size, act: "tour:draftSize", data: { size: size } });
        })
        .join("")
    );
    syncCount();
  };

  LL.actions["tour:draftPerson"] = function (el) {
    const id = el.dataset.id;
    if (id === "me") return;
    const index = draft.participants.indexOf(id);
    if (index >= 0) draft.participants.splice(index, 1);
    else if (draft.participants.length >= draft.size) {
      UI.toast("Bracket is full — unpick someone first.", "warn");
      return;
    } else draft.participants.push(id);
    UI.patch("#draft-people", peopleHtml(S.people()));
    syncCount();
  };

  LL.actions["tour:createSubmit"] = function (form) {
    const name = nameFrom(form) || "New Tournament";
    const gameId = form.querySelector('[name="game"]').value;
    if (draft.participants.length !== draft.size) {
      UI.toast("Pick exactly " + draft.size + " players for this bracket.", "err");
      return;
    }
    const tour = S.createTournament({
      name: name,
      gameId: gameId,
      participants: U.shuffle(draft.participants)
    });
    UI.closeModal();
    UI.toast("Bracket created · " + tour.size + " players", "ok");
    LL.app.nav("#/tournament/" + tour.id);
  };

  /* ---------------- scores ---------------- */

  LL.actions["tour:match"] = function (el) {
    const t = S.tournament(el.dataset.id);
    if (!t) return;
    openScores(t.id, Number(el.dataset.r), Number(el.dataset.m));
  };

  LL.actions["tour:submitScore"] = function (form) {
    const id = form.querySelector('[name="tour"]').value;
    const r = parseInt(form.querySelector('[name="round"]').value, 10);
    const m = parseInt(form.querySelector('[name="match"]').value, 10);
    const sa = parseInt(form.querySelector('[name="sa"]').value, 10);
    const sb = parseInt(form.querySelector('[name="sb"]').value, 10);
    const tour = S.tournament(id);
    if (!tour) return;
    if (isNaN(sa) || isNaN(sb) || sa < 0 || sb < 0) {
      UI.toast("Enter both scores as positive numbers.", "err");
      return;
    }
    if (sa === sb) {
      UI.toast("A bracket match can't end in a tie.", "err");
      return;
    }
    UI.closeModal();
    const wasComplete = tour.status === "complete";
    S.setMatchResult(tour, r, m, sa, sb);
    UI.toast("Score confirmed · " + S.personName(sa > sb ? tour.rounds[r].matches[m].a : tour.rounds[r].matches[m].b) + " advances", "ok");
    if (!wasComplete && tour.status === "complete" && tour.champion === "me" && !tour.awarded) {
      tour.awarded = true;
      S.awardTournamentWin(tour);
    } else {
      S.save();
      S.emit();
    }
  };

  LL.actions["tour:simulate"] = function (el) {
    const tour = S.tournament(el.dataset.id);
    if (!tour) return;
    UI.confirm({
      title: "Simulate remaining matches?",
      text: "Random scores are filled in for every unplayed match. This is a demo shortcut — real results should be entered manually.",
      okLabel: "Simulate (demo)",
      act: "tour:simulateRun",
      data: { id: tour.id }
    });
  };

  LL.actions["tour:simulateRun"] = function (el) {
    UI.closeModal();
    const tour = S.tournament(el.dataset.id);
    if (!tour) return;
    const wasComplete = tour.status === "complete";
    tour.rounds.forEach(function (round, r) {
      round.matches.forEach(function (match, m) {
        if (match.a && match.b && !match.winner) {
          const sa = U.randInt(2, 13);
          let sb = U.randInt(1, 12);
          if (sb === sa) sb = sa > 1 ? sa - 1 : sa + 1;
          S.setMatchResult(tour, r, m, sa, sb);
        }
      });
    });
    if (!wasComplete && tour.champion === "me" && !tour.awarded) {
      tour.awarded = true;
      S.awardTournamentWin(tour);
    } else {
      S.save();
      S.emit();
    }
    UI.toast(tour.champion ? S.personName(tour.champion) + " wins " + tour.name : "Matches simulated", "ok");
  };

  LL.actions["tour:delete"] = function (el) {
    UI.confirm({
      title: "Delete this tournament?",
      text: "The bracket and its results are removed from this device.",
      okLabel: "Delete",
      danger: true,
      act: "tour:deleteConfirmed",
      data: { id: el.dataset.id }
    });
  };

  LL.actions["tour:deleteConfirmed"] = function (el) {
    UI.closeModal();
    S.update(function (state) {
      state.tournaments = state.tournaments.filter(function (t) {
        return t.id !== el.dataset.id;
      });
    });
    UI.toast("Tournament deleted", "warn");
    LL.app.nav("#/tournaments");
  };

  function nameFrom(form) {
    const input = form.querySelector('[name="name"]');
    return input ? input.value.trim().slice(0, 40) : "";
  }

  LL.screens.tournaments = { render: renderList };
  LL.screens.tournament = { render: renderDetail };
})();
