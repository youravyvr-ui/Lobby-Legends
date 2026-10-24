/* ============================================================
   Lobby Legends — reusable UI pieces
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;

  const ICONS = {
    home: '<path d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="7.6" r="3.6"/><path d="M2.5 20.5v-1.4a4.4 4.4 0 0 1 4.4-4.4h4.2a4.4 4.4 0 0 1 4.4 4.4v1.4"/><path d="M17.2 4.4a3.6 3.6 0 0 1 0 6.6"/><path d="M21.5 20.5v-1.4a4.4 4.4 0 0 0-3.2-4.24"/>',
    gamepad: '<path d="M7 8h10a4.6 4.6 0 0 1 4.5 5.2l-.5 4a2.6 2.6 0 0 1-4.3 1.7l-1.3-1.2a2.4 2.4 0 0 0-1.6-.6h-3.6a2.4 2.4 0 0 0-1.6.6L7.3 19a2.6 2.6 0 0 1-4.3-1.7l-.5-4A4.6 4.6 0 0 1 7 8z"/><path d="M7.6 10.6v3.2M6 12.2h3.2"/><circle cx="16.4" cy="11.4" r=".9" fill="currentColor" stroke="none"/><circle cx="18.2" cy="13.6" r=".9" fill="currentColor" stroke="none"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4.5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.2v1.8A3.5 3.5 0 0 0 7.6 10.8"/><path d="M17 5.5h2.8v1.8a3.5 3.5 0 0 1-3.4 3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6.5 9.5 17 4 11.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    flame: '<path d="M12 22c3.9 0 6-2.7 6-6 0-4.4-3.4-6.4-3.4-9.4 0-1.5-.9-2.8-2.4-3.6.4 2.6-1 4.1-2.5 5.5C7.7 10.4 6 12.1 6 15c0 3.3 2.1 7 6 7z"/><path d="M12 22c1.7 0 2.8-1.3 2.8-2.9 0-2-1.5-2.9-1.5-4.3 0-.8-.4-1.4-1-1.9-.4 1.6-1.6 2.2-1.6 3.7 0 1-.9 1.4-.9 2.6 0 1.6 1 2.8 2.2 2.8z"/>',
    star: '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.9 1-5.9L3.5 9.8l5.9-.8z"/>',
    crown: '<path d="M4 18h16l-1.5-9-4 3.6L12 6l-2.5 6.6-4-3.6z"/><path d="M4 18v2h16v-2"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h4M12 17h8"/><circle cx="15" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    shield: '<path d="M12 21.5s7.4-3.6 7.4-9.3V5.4L12 2.6 4.6 5.4v6.8c0 5.7 7.4 9.3 7.4 9.3z"/><path d="M9 12l2.2 2.2L15.2 10"/>',
    sparkles: '<path d="M12 3.2l1.7 4.5 4.5 1.7-4.5 1.7L12 15.6l-1.7-4.5L5.8 9.4l4.5-1.7z"/><path d="M18.3 14.6l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.9-6.6"/><path d="M21 4.2v5h-5"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16.7 16.7"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2.4"/><path d="M5.5 15H4.8A1.8 1.8 0 0 1 3 13.2V4.8A1.8 1.8 0 0 1 4.8 3h8.4A1.8 1.8 0 0 1 15 4.8v.7"/>',
    send: '<path d="M21.5 3 10.9 13.6"/><path d="M21.5 3l-6.9 18-3.7-7.4L3.5 9.9z"/>',
    play: '<path d="M7 4.5 19.5 12 7 19.5z"/>',
    bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 9-12h-6.5z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.4"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13.5h9l1-13.5"/>',
    edit: '<path d="M12 20.5h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    alert: '<path d="M12 3 2.5 20.5h19z"/><path d="M12 9.5v4.6M12 17.6h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M11.5 18.5 5 12l6.5-6.5"/>',
    share: '<path d="M12 3v11"/><path d="M8.4 6.4 12 3l3.6 3.4"/><path d="M5 13.5v5.2A2.3 2.3 0 0 0 7.3 21h9.4a2.3 2.3 0 0 0 2.3-2.3v-5.2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M8 3v4M16 3v4M3.5 10.5h17"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.4 6 3h12l-2.5 7.4"/>',
    chart: '<path d="M3 20.5h18"/><path d="M7 20.5v-6M12 20.5V7M17 20.5v-9.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M3.5 5.5h17M6.5 12h11M10 18.5h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.6 5.6 3.6 9s-1 6.4-3.6 9c-2.6-2.6-3.6-5.6-3.6-9S9.4 5.6 12 3z"/>',
    logout: '<path d="M9.5 21H5.4A2.4 2.4 0 0 1 3 18.6V5.4A2.4 2.4 0 0 1 5.4 3h4.1"/><path d="M16 16.5 20.5 12 16 7.5"/><path d="M20.5 12H9.5"/>',
    volume: '<path d="M11 5 6 9.2H3v5.6h3L11 19z"/><path d="M15.6 8.6a4.8 4.8 0 0 1 0 6.8"/><path d="M18.4 6a8.4 8.4 0 0 1 0 12"/>',
    palette: '<path d="M12 21.2a9.2 9.2 0 1 1 0-18.4c5.1 0 9.2 3.7 9.2 8.2 0 2.6-2.1 4.1-4.2 4.1h-1.6a2.1 2.1 0 0 0-1.5 3.5 2.1 2.1 0 0 1-1.9 2.6z"/><circle cx="7.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9.6" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="14.2" cy="6.8" r="1" fill="currentColor" stroke="none"/><circle cx="17.2" cy="9.6" r="1" fill="currentColor" stroke="none"/>',
    database: '<ellipse cx="12" cy="5.2" rx="8" ry="3"/><path d="M4 5.2v13.6c0 1.7 3.6 3 8 3s8-1.3 8-3V5.2"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    list: '<path d="M8.5 6h13M8.5 12h13M8.5 18h13"/><path d="M3.6 6h.01M3.6 12h.01M3.6 18h.01"/>',
    gift: '<rect x="3" y="8" width="18" height="4.4" rx="1.2"/><path d="M5 12.4v8A1.6 1.6 0 0 0 6.6 22h10.8a1.6 1.6 0 0 0 1.6-1.6v-8"/><path d="M12 8v14"/><path d="M12 8S9.6 8 8.4 6.9A2.1 2.1 0 0 1 11.4 4C12.6 5.2 12 8 12 8z"/><path d="M12 8s2.4 0 3.6-1.1A2.1 2.1 0 0 0 12.6 4C11.4 5.2 12 8 12 8z"/>',
    dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>'
  };

  function icon(name, cls) {
    const path = ICONS[name] || ICONS.dot;
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : "") +
      ">" +
      path +
      "</svg>"
    );
  }

  function attrs(opts) {
    const o = opts || {};
    let out = "";
    if (o.act) out += ' data-act="' + U.esc(o.act) + '"';
    if (o.changeAct) out += ' data-change-act="' + U.esc(o.changeAct) + '"';
    if (o.inputAct) out += ' data-input-act="' + U.esc(o.inputAct) + '"';
    Object.keys(o.data || {}).forEach(function (key) {
      out += " data-" + key + '="' + U.esc(o.data[key]) + '"';
    });
    return out;
  }

  function avatar(who, size, cls) {
    const person = who || {};
    const emoji = person.avatar || "👾";
    const hue = U.hueFor(person.name || person.id || "player");
    return (
      '<span class="avatar ' +
      (size || "") +
      " " +
      (cls || "") +
      '" style="--hue:' +
      hue +
      '" title="' +
      U.esc(person.name || "Player") +
      '">' +
      emoji +
      "</span>"
    );
  }

  function avatarStack(people, max) {
    const limit = max || 4;
    const shown = people.slice(0, limit);
    const rest = people.length - shown.length;
    return (
      '<span class="avatar-stack">' +
      shown
        .map(function (p) {
          return avatar(p, "sm");
        })
        .join("") +
      (rest > 0 ? '<span class="avatar sm" style="--hue:0">+' + rest + "</span>" : "") +
      "</span>"
    );
  }

  function badge(text, tone, ico) {
    return '<span class="badge ' + (tone || "") + '">' + (ico ? icon(ico) : "") + U.esc(text) + "</span>";
  }

  function chip(label, opts) {
    const o = opts || {};
    const cls = "chip" + (o.static ? " static" : "") + (o.active ? " on" : "");
    return (
      '<button type="button" class="' +
      cls +
      '"' +
      (o.active ? ' aria-pressed="true"' : ' aria-pressed="false"') +
      attrs({ act: o.act, data: o.data }) +
      ">" +
      (o.icon ? icon(o.icon) : "") +
      (o.emoji ? "<span>" + o.emoji + "</span>" : "") +
      U.esc(label) +
      "</button>"
    );
  }

  function stat(opts) {
    return (
      '<div class="stat ' +
      (opts.tone || "") +
      '"><b>' +
      opts.value +
      "</b><span>" +
      U.esc(opts.label) +
      "</span></div>"
    );
  }

  function sectionHead(title, kicker, right) {
    return (
      '<div class="section-head"><div><h2>' +
      U.esc(title) +
      "</h2>" +
      (kicker ? '<span class="kicker">' + U.esc(kicker) + "</span>" : "") +
      "</div>" +
      (right || "") +
      "</div>"
    );
  }

  function levelRing(level, pct, size) {
    return (
      '<div class="level-ring ' +
      (size || "") +
      '" style="--p:' +
      pct +
      '"><span>' +
      level +
      "<small>LVL</small></span></div>"
    );
  }

  function gameIcon(game, size) {
    const g = game || {};
    return (
      '<span class="game-icon ' +
      (size || "") +
      '" style="--hue:' +
      (g.hue == null ? 200 : g.hue) +
      '">' +
      (g.emoji || "🎮") +
      "</span>"
    );
  }

  function gameTile(game, opts) {
    const o = opts || {};
    return (
      '<button type="button" class="gtile ' +
      (o.on ? "on" : "") +
      '"' +
      attrs({ act: o.act, data: o.data }) +
      ">" +
      gameIcon(game) +
      "<b>" +
      U.esc(game.name) +
      "</b>" +
      "<small>" +
      U.esc(game.genre) +
      " · " +
      (game.max > 1 ? "1–" + game.max : "Solo") +
      "</small></button>"
    );
  }

  function gameOptions(games, selected, act) {
    return (
      '<div class="check-list">' +
      games
        .map(function (g) {
          const on = selected.indexOf(g.id) >= 0;
          return (
            '<button type="button" class="check-item ' +
            (on ? "on" : "") +
            '"' +
            attrs({ act: act, data: { id: g.id } }) +
            '><span class="tick">' +
            icon("check") +
            "</span>" +
            gameIcon(g, "sm") +
            "<b>" +
            U.esc(g.name) +
            "</b></button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function difficultyChip(id) {
    const d = LL.challenges.difficulty(id);
    return '<span class="badge ' + d.tone + '">' + U.esc(d.label) + " · " + d.xp + " XP</span>";
  }

  function categoryChip(id) {
    const c = LL.challenges.category(id);
    return '<span class="badge">' + icon(c.icon) + U.esc(c.label) + "</span>";
  }

  function matchRow(match) {
    const game = LL.store.game(match.gameId);
    const win = match.outcome === "win";
    return (
      '<div class="row-item">' +
      gameIcon(game, "sm") +
      '<div class="row-main"><b>' +
      U.esc(game ? game.name : "Match") +
      (match.score ? " · " + U.esc(match.score) : "") +
      "</b><span>" +
      U.esc(match.mode || "Match") +
      (match.opponent ? " · vs " + U.esc(match.opponent) : "") +
      " · " +
      U.relDay(match.at) +
      '</span></div>' +
      badge(win ? "Win" : "Loss", win ? "neon" : "red") +
      "</div>"
    );
  }

  function codeBox(code) {
    return (
      '<div class="code-box"><code>' +
      U.esc(code) +
      "</code>" +
      '<button class="btn btn-sm btn-line" type="button"' +
      attrs({ act: "ui:copy", data: { text: code, label: "Invite code" } }) +
      ">" +
      icon("copy") +
      "Copy</button></div>"
    );
  }

  function segmented(items, activeId, act) {
    return (
      '<div class="segmented" role="tablist">' +
      items
        .map(function (item) {
          return (
            '<button type="button" role="tab" aria-selected="' +
            (item.id === activeId ? "true" : "false") +
            '"' +
            attrs({ act: act, data: { id: item.id } }) +
            ">" +
            U.esc(item.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function empty(cfg) {
    return (
      '<div class="empty"><span class="empty-ico">' +
      icon(cfg.icon || "gamepad") +
      "</span><b>" +
      U.esc(cfg.title || "Nothing here yet") +
      "</b><p>" +
      (cfg.text || "") +
      "</p>" +
      (cfg.action || "") +
      "</div>"
    );
  }

  function notice(text, tone, ico) {
    return (
      '<div class="notice ' +
      (tone || "") +
      '">' +
      icon(ico || "info") +
      "<span>" +
      text +
      "</span></div>"
    );
  }

  function toggleRow(cfg) {
    return (
      '<div class="toggle-row"><div><b>' +
      U.esc(cfg.label) +
      "</b>" +
      (cfg.desc ? "<small>" + U.esc(cfg.desc) + "</small>" : "") +
      '</div><button type="button" class="switch" role="switch" aria-checked="' +
      (cfg.on ? "true" : "false") +
      '" aria-label="' +
      U.esc(cfg.label) +
      '"' +
      attrs({ act: cfg.act, data: cfg.data }) +
      "></button></div>"
    );
  }

  function bar(pct, cls) {
    return '<div class="bar ' + (cls || "") + '"><i style="width:' + U.clamp(pct, 0, 100) + '%"></i></div>';
  }

  /* ---------------- voting (shared by lobbies + game picker) ---------------- */

  function tally(options, votes) {
    const counts = {};
    const voters = {};
    options.forEach(function (id) {
      counts[id] = 0;
      voters[id] = [];
    });
    Object.keys(votes || {}).forEach(function (memberId) {
      const gameId = votes[memberId];
      if (counts[gameId] === undefined) return;
      counts[gameId] += 1;
      voters[gameId].push(memberId);
    });
    const total = Object.keys(votes || {}).length;
    const rows = options.map(function (id) {
      return {
        gameId: id,
        count: counts[id] || 0,
        pct: U.pct(counts[id] || 0, total),
        voters: voters[id] || []
      };
    });
    rows.sort(function (a, b) {
      return b.count - a.count;
    });
    return { rows: rows, total: total, top: rows.length && rows[0].count > 0 ? rows[0] : null };
  }

  function votePanel(cfg) {
    const options = (cfg.options || []).filter(function (id) {
      return !!id;
    });
    const votes = cfg.votes || {};
    const members = cfg.members || [];
    const result = tally(options, votes);
    const myVote = votes.me || null;
    const lockedGame = cfg.lockedGame || null;

    if (!options.length) {
      return empty({ icon: "dice", title: "No games on the table", text: "Add games to the pool first, then start a vote." });
    }

    const leaderId = result.top ? result.top.gameId : null;

    return (
      (lockedGame
        ? '<div class="wheel-result" style="margin-bottom:10px"><span class="tiny upper muted">Vote locked</span>' +
          '<div class="row"><span class="game-icon sm">' + (S_gameEmoji(lockedGame)) + "</span><b>" + U.esc(S_gameName(lockedGame)) + "</b></div></div>"
        : "") +
      '<div class="stack-sm">' +
      result.rows
        .map(function (row) {
          const game = S_game(row.gameId);
          const isMine = myVote === row.gameId;
          const isLead = row.gameId === leaderId && row.count > 0;
          return (
            '<button type="button" class="vote-opt ' +
            (isMine ? "mine" : "") +
            " " +
            (isLead ? "lead" : "") +
            '" ' +
            attrs({ act: cfg.act || "vote:cast", data: { scope: cfg.scope || "lobby", lobby: cfg.lobbyId || "", game: row.gameId } }) +
            (cfg.disabled ? " disabled" : "") +
            ">" +
            '<div class="between">' +
            '<span class="row" style="min-width:0"><span class="game-icon sm">' + (game ? game.emoji : "🎮") + "</span>" +
            '<b class="sm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + U.esc(game ? game.name : row.gameId) + "</b></span>" +
            '<span class="tiny mono ' + (isLead ? "accent" : "muted") + '">' + row.count + " · " + row.pct + "%</span></div>" +
            '<div class="between" style="margin-top:6px">' +
            '<span class="row" style="gap:4px">' +
            (row.voters.length
              ? row.voters
                  .slice(0, 5)
                  .map(function (memberId) {
                    const person = members.find(function (m) {
                      return m.id === memberId;
                    }) || { id: memberId, name: memberId, avatar: "👾" };
                    return avatar(person, "xs");
                  })
                  .join("")
              : '<span class="tiny muted">No votes yet</span>') +
            "</span>" +
            (isMine ? badge("Your pick", "neon") : "<span></span>") +
            "</div>" +
            '<span class="vbar" style="width:' + row.pct + '%"></span>' +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="tiny muted" style="margin-top:9px">' +
      (myVote ? "You voted for " + U.esc(S_gameName(myVote)) + ". Tap another game to change it." : "Tap a game to cast your vote.") +
      " · " + result.total + " vote" + (result.total === 1 ? "" : "s") + " in" +
      "</p>"
    );
  }

  function S_game(id) {
    return LL.store ? LL.store.game(id) : null;
  }
  function S_gameName(id) {
    const game = S_game(id);
    return game ? game.name : "Unknown game";
  }
  function S_gameEmoji(id) {
    const game = S_game(id);
    return game ? game.emoji : "🎮";
  }

  /* ---------------- modals ---------------- */

  function modalRoot() {
    return document.getElementById("modal-root");
  }

  function openModal(cfg) {
    const root = modalRoot();
    if (!root) return;
    root.innerHTML =
      '<div class="sheet-backdrop"' +
      attrs({ act: "ui:closeModal" }) +
      "></div>" +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="' +
      U.esc(cfg.title || "Dialog") +
      '">' +
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head"><div class="spacer"><h2>' +
      (cfg.title || "") +
      "</h2>" +
      (cfg.subtitle ? "<p>" + cfg.subtitle + "</p>" : "") +
      '</div><button type="button" class="icon-btn sm"' +
      attrs({ act: "ui:closeModal" }) +
      ' aria-label="Close">' +
      icon("x") +
      "</button></div>" +
      '<div class="sheet-body">' +
      (cfg.body || "") +
      "</div>" +
      (cfg.actions ? '<div class="sheet-actions">' + cfg.actions + "</div>" : "") +
      "</div>";
    root.classList.add("open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("noscroll");
    const focusTarget = root.querySelector("input, textarea, select, .sheet-actions .btn-primary");
    if (focusTarget) {
      setTimeout(function () {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (e) {
          focusTarget.focus();
        }
      }, 80);
    }
    if (cfg.onMount) cfg.onMount(root);
  }

  function closeModal() {
    const root = modalRoot();
    if (!root) return;
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = "";
    document.body.classList.remove("noscroll");
  }

  function confirm(cfg) {
    openModal({
      title: cfg.title,
      subtitle: cfg.text || "",
      actions:
        '<button type="button" class="btn btn-line"' +
        attrs({ act: "ui:closeModal" }) +
        ">" +
        U.esc(cfg.cancelLabel || "Cancel") +
        "</button>" +
        '<button type="button" class="btn ' +
        (cfg.danger ? "btn-danger" : "btn-primary") +
        '"' +
        attrs({ act: cfg.act, data: cfg.data }) +
        ">" +
        U.esc(cfg.okLabel || "Confirm") +
        "</button>"
    });
  }

  /* ---------------- toasts ---------------- */

  function toast(message, tone) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    while (root.children.length >= 3) root.removeChild(root.firstChild);
    const el = document.createElement("div");
    const type = tone || "ok";
    el.className = "toast " + type;
    el.innerHTML = icon(type === "err" ? "alert" : type === "warn" ? "info" : "check") + "<span>" + U.esc(message) + "</span>";
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .22s ease, transform .22s ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(function () {
        el.remove();
      }, 240);
    }, 2800);
  }

  function patch(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
    return el;
  }

  LL.ui = {
    icon: icon,
    attrs: attrs,
    avatar: avatar,
    avatarStack: avatarStack,
    badge: badge,
    chip: chip,
    stat: stat,
    sectionHead: sectionHead,
    levelRing: levelRing,
    gameIcon: gameIcon,
    gameTile: gameTile,
    gameOptions: gameOptions,
    difficultyChip: difficultyChip,
    categoryChip: categoryChip,
    matchRow: matchRow,
    codeBox: codeBox,
    segmented: segmented,
    empty: empty,
    notice: notice,
    toggleRow: toggleRow,
    bar: bar,
    tally: tally,
    votePanel: votePanel,
    openModal: openModal,
    closeModal: closeModal,
    confirm: confirm,
    modalOpen: function () {
      const root = modalRoot();
      return !!root && root.classList.contains("open");
    },
    toast: toast,
    patch: patch,
    esc: U.esc
  };
})();
