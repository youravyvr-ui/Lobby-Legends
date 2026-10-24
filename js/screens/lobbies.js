/* ============================================================
   Lobby Legends — lobbies list, lobby room, invite links
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  let listFilter = "all";
  let draft = { name: "", pool: [] };
  let openPoolLobbyId = null;

  /* ---------------- shared bits ---------------- */

  function statusBadge(lobby) {
    if (lobby.lockedGame) return UI.badge("Locked in", "neon", "lock");
    if (lobby.status === "voting") return UI.badge("Voting", "orange", "dice");
    const ready = lobby.members.filter(function (m) {
      return m.ready;
    }).length;
    return UI.badge("Ready " + ready + "/" + lobby.members.length, "blue", "users");
  }

  function inviteUrl(lobby) {
    return location.origin + location.pathname + "#/join/" + lobby.code;
  }

  function chatFeed(lobby) {
    return lobby.messages
      .slice(-30)
      .map(function (m) {
        if (m.system) {
          return '<div class="msg system"><div class="bubble">' + UI.esc(m.text) + "</div></div>";
        }
        const mine = m.who === "me";
        const person = S.person(m.who);
        return (
          '<div class="msg ' +
          (mine ? "mine" : "") +
          '">' +
          UI.avatar(person, "xs") +
          '<div class="bubble"><b>' +
          UI.esc(person.name) +
          "</b>" +
          UI.esc(m.text) +
          "</div></div>"
        );
      })
      .join("");
  }

  function poolChips(lobby) {
    if (!lobby.pool.length) {
      return '<p class="tiny muted">No games in the pool yet. Add a few so the squad has something to vote on.</p>';
    }
    return (
      '<div class="row wrap" style="gap:6px">' +
      lobby.pool
        .map(function (id) {
          const game = S.game(id);
          if (!game) return "";
          const isHost = lobby.ownerId === "me" && lobby.status !== "voting" && !lobby.lockedGame;
          return (
            '<span class="chip static">' +
            UI.gameIcon(game, "sm") +
            UI.esc(game.name) +
            (isHost
              ? '<button type="button" aria-label="Remove ' + UI.esc(game.name) + '" data-act="lobby:removeGame" data-id="' + lobby.id + '" data-game="' + game.id + '" style="background:none;border:0;color:var(--muted);cursor:pointer;padding:0 0 0 2px;display:inline-grid;place-items:center">' +
                UI.icon("x") +
                "</button>"
              : "") +
            "</span>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function memberRows(lobby) {
    return (
      '<div class="stack-sm">' +
      lobby.members
        .map(function (member) {
          const person = S.person(member.id);
          const isOwner = lobby.ownerId === member.id;
          const mine = member.id === "me";
          return (
            '<div class="row-item">' +
            UI.avatar(person, "sm") +
            '<div class="row-main"><b>' +
            UI.esc(person.name) +
            (mine ? " (you)" : "") +
            "</b><span>" +
            (isOwner ? "Lobby owner · " : "") +
            "Level " +
            U.levelFor(person.xp || 0).level +
            " · joined " +
            U.timeAgo(member.joinedAt) +
            "</span></div>" +
            (isOwner ? UI.badge("Host", "purple", "crown") : "") +
            (mine
              ? '<button type="button" class="btn btn-sm ' +
                (member.ready ? "btn-soft" : "btn-primary") +
                '" data-act="lobby:toggleReady" data-id="' +
                lobby.id +
                '">' +
                (member.ready ? UI.icon("check") + "Ready" : "I'm ready") +
                "</button>"
              : member.ready
              ? UI.badge("Ready", "neon", "check")
              : UI.badge("Waiting", "")) +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  /* ---------------- simulated friend activity ---------------- */

  function simulateFriendReady(lobbyId) {
    setTimeout(function () {
      const lobby = S.lobby(lobbyId);
      if (!lobby || !S.joined(lobby)) return;
      const waiting = lobby.members.filter(function (m) {
        return m.id !== "me" && !m.ready;
      });
      if (!waiting.length) return;
      const target = U.pick(waiting);
      target.ready = true;
      lobby.messages.push(S.sysMsg(S.personName(target.id) + " is ready"));
      S.save();
      S.emit();
    }, U.randInt(1200, 2600));
  }

  function simulateVotes(lobbyId) {
    const lobby = S.lobby(lobbyId);
    if (!lobby) return;
    const friends = lobby.members.filter(function (m) {
      return m.id !== "me" && !lobby.votes[m.id];
    });
    friends.forEach(function (member, i) {
      const delay = 1400 + i * U.randInt(700, 1400);
      setTimeout(function () {
        const fresh = S.lobby(lobbyId);
        if (!fresh || !S.joined(fresh) || !fresh.pool.length) return;
        if (fresh.votes[member.id]) return;
        fresh.votes[member.id] = U.pick(fresh.pool);
        S.save();
        S.emit();
      }, delay);
    });
  }

  function scheduleReply(lobbyId) {
    setTimeout(function () {
      const lobby = S.lobby(lobbyId);
      if (!lobby || !S.joined(lobby)) return;
      const others = lobby.members.filter(function (m) {
        return m.id !== "me";
      });
      if (!others.length) return;
      const who = U.pick(others).id;
      lobby.messages.push(S.chatMsg(who, U.pick(LL.seed.REPLIES)));
      lobby.messages = lobby.messages.slice(-40);
      S.save();
      S.emit();
    }, U.randInt(1100, 2800));
  }

  function simulateFriendJoin(lobbyId) {
    setTimeout(function () {
      const lobby = S.lobby(lobbyId);
      if (!lobby || !S.joined(lobby)) return;
      if (lobby.members.length >= 5) return;
      const inLobby = lobby.members.map(function (m) {
        return m.id;
      });
      const candidates = S.friends().filter(function (f) {
        return inLobby.indexOf(f.id) === -1;
      });
      if (!candidates.length) return;
      const friend = U.pick(candidates);
      lobby.members.push({ id: friend.id, ready: false, joinedAt: Date.now() });
      lobby.messages.push(S.sysMsg(friend.name + " joined the lobby"));
      S.save();
      S.emit();
    }, U.randInt(2200, 4200));
  }

  /* ---------------- create + join modals ---------------- */

  function openCreateLobby() {
    const suggestions = ["Friday Night Squad", "Sunday Scrims", "Late Night Queue", "Weekend Warm-up"];
    draft = {
      name: U.pick(suggestions),
      pool: S.get().library.slice(0, 3)
    };
    UI.openModal({
      title: "Create a lobby",
      subtitle: "Pick a pool of games now — you can change it any time.",
      body:
        '<form data-act="lobby:createSubmit" class="stack-sm">' +
        '<label class="field"><span class="label">Lobby name</span>' +
        '<input class="input" name="name" value="' + UI.esc(draft.name) + '" maxlength="36" placeholder="Friday Night Squad" /></label>' +
        '<div class="between" style="margin-top:4px"><span class="label">Game pool</span>' +
        '<span class="tiny muted" id="pool-count">' + draft.pool.length + " selected</span></div>" +
        '<div id="pool-picker">' + UI.gameOptions(S.games(), draft.pool, "lobby:createPool") + "</div>" +
        '<p class="tiny muted">Pick 2–10 games. Each member can vote for one.</p>' +
        '<button type="submit" class="btn btn-primary btn-block">' + UI.icon("plus") + "Create lobby</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  }

  function openJoinModal() {
    UI.openModal({
      title: "Join a lobby",
      subtitle: "Enter the 6-character invite code your friend sent you.",
      body:
        '<form data-act="lobby:joinSubmit" class="stack-sm">' +
        '<label class="field"><span class="label">Invite code</span>' +
        '<input class="input" name="code" placeholder="ABC123" maxlength="8" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:.24em;font-weight:800" /></label>' +
        '<p class="tiny muted">Demo code to try: <b class="accent">SQUAD1</b> (Bubblez Party Bus)</p>' +
        '<button type="submit" class="btn btn-primary btn-block">' + UI.icon("users") + "Join lobby</button>" +
        "</form>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Cancel</button>'
    });
  }

  LL.actions["lobby:create"] = openCreateLobby;
  LL.actions["lobby:joinModal"] = openJoinModal;

  LL.actions["lobby:createPool"] = function (el) {
    const id = el.dataset.id;
    const index = draft.pool.indexOf(id);
    if (index >= 0) draft.pool.splice(index, 1);
    else if (draft.pool.length < 10) draft.pool.push(id);
    else {
      UI.toast("Ten games is the maximum for one pool.", "warn");
      return;
    }
    UI.patch("#pool-picker", UI.gameOptions(S.games(), draft.pool, "lobby:createPool"));
    const count = document.getElementById("pool-count");
    if (count) count.textContent = draft.pool.length + " selected";
  };

  LL.actions["lobby:createSubmit"] = function (form) {
    const nameInput = form.querySelector('[name="name"]');
    const name = nameInput ? nameInput.value.trim() : "";
    if (!draft.pool.length) {
      UI.toast("Pick at least one game for the pool.", "err");
      return;
    }
    const lobby = S.createLobby({ name: name || "New Lobby", pool: draft.pool });
    UI.closeModal();
    UI.toast("Lobby created · invite code " + lobby.code, "ok");
    simulateFriendJoin(lobby.id);
    LL.app.nav("#/lobby/" + lobby.id);
  };

  function completeJoin(code) {
    const result = S.joinByCode(code);
    if (!result.ok) {
      UI.toast(result.error, "err");
      return;
    }
    UI.closeModal();
    if (result.already) UI.toast("You're already in that lobby.", "warn");
    else {
      UI.toast("Joined " + result.lobby.name, "ok");
      simulateFriendJoin(result.lobby.id);
      scheduleReply(result.lobby.id);
    }
    LL.app.nav("#/lobby/" + result.lobby.id);
  }

  LL.actions["lobby:joinSubmit"] = function (form) {
    const input = form.querySelector('[name="code"]');
    completeJoin(input ? input.value : "");
  };

  LL.actions["lobby:joinInline"] = function (form) {
    const input = form.querySelector('[name="code"]');
    completeJoin(input ? input.value : "");
  };

  LL.actions["lobby:joinLink"] = function (el) {
    completeJoin(el.dataset.code || "");
  };

  /* ---------------- lobby room actions ---------------- */

  LL.actions["lobby:toggleReady"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    const me = lobby.members.find(function (m) {
      return m.id === "me";
    });
    if (!me) return;
    me.ready = !me.ready;
    lobby.messages.push(S.sysMsg(S.personName("me") + (me.ready ? " is ready" : " is not ready yet")));
    S.blip(me.ready ? 760 : 420, 0.09);
    S.save();
    S.emit();
    if (me.ready) simulateFriendReady(lobby.id);
  };

  LL.actions["lobby:startVote"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    if (lobby.pool.length < 2) {
      UI.toast("Add at least two games before starting a vote.", "warn");
      return;
    }
    lobby.status = "voting";
    lobby.votes = {};
    lobby.voteStarted = Date.now();
    lobby.lockedGame = null;
    lobby.messages.push(S.sysMsg("Game vote started · " + lobby.pool.length + " options on the table"));
    S.save();
    S.emit();
    simulateVotes(lobby.id);
  };

  LL.actions["lobby:lockVote"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    const result = UI.tally(lobby.pool, lobby.votes);
    if (!result.top) {
      UI.toast("Nobody has voted yet.", "warn");
      return;
    }
    lobby.lockedGame = result.top.gameId;
    lobby.status = "locked";
    lobby.messages.push(S.sysMsg("Vote locked · " + S.gameName(result.top.gameId) + " it is"));
    S.save();
    S.emit();
    UI.toast("Locked in: " + S.gameName(result.top.gameId), "ok");
  };

  LL.actions["lobby:challengeGame"] = function (el) {
    const gameId = el.dataset.game;
    const challenge = LL.challenges.generate({ gameId: gameId, difficulty: "medium" });
    S.update(function (state) {
      state.activeChallenge = challenge;
    });
    UI.toast("Daily challenge set · " + challenge.title, "ok");
  };

  LL.actions["lobby:addGames"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    openPoolLobbyId = lobby.id;
    UI.openModal({
      title: "Lobby game pool",
      subtitle: "Tap games to add or remove them from this lobby.",
      body: '<div id="pool-edit">' + UI.gameOptions(S.games(), lobby.pool, "lobby:poolToggle") + "</div>",
      actions: '<button type="button" class="btn btn-primary" data-act="ui:closeModal">Done</button>'
    });
  };

  LL.actions["lobby:poolToggle"] = function (el) {
    const lobby = S.lobby(openPoolLobbyId);
    if (!lobby) return;
    const id = el.dataset.id;
    const index = lobby.pool.indexOf(id);
    if (index >= 0) lobby.pool.splice(index, 1);
    else if (lobby.pool.length >= 10) {
      UI.toast("Ten games is the maximum for one pool.", "warn");
      return;
    } else lobby.pool.push(id);
    S.save();
    S.emit();
    UI.patch("#pool-edit", UI.gameOptions(S.games(), lobby.pool, "lobby:poolToggle"));
  };

  LL.actions["lobby:removeGame"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    if (lobby.ownerId !== "me") {
      UI.toast("Only the lobby owner can change the pool.", "warn");
      return;
    }
    lobby.pool = lobby.pool.filter(function (id) {
      return id !== el.dataset.game;
    });
    S.save();
    S.emit();
  };

  LL.actions["lobby:share"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    const url = inviteUrl(lobby);
    if (navigator.share) {
      navigator
        .share({ title: "Lobby Legends · " + lobby.name, text: "Join my lobby with code " + lobby.code, url: url })
        .catch(function () {
          U.copyText(url).then(function () {
            UI.toast("Invite link copied", "ok");
          });
        });
      return;
    }
    U.copyText(url)
      .then(function () {
        UI.toast("Invite link copied", "ok");
      })
      .catch(function () {
        UI.toast("Couldn't copy the link. Code is " + lobby.code, "warn");
      });
  };

  LL.actions["lobby:send"] = function (form) {
    const lobby = S.lobby(form.dataset.id);
    if (!lobby) return;
    const input = form.querySelector('[name="text"]');
    const text = (input ? input.value : "").trim().slice(0, 140);
    if (!text) return;
    lobby.messages.push(S.chatMsg("me", text));
    lobby.messages = lobby.messages.slice(-40);
    if (input) input.value = "";
    S.save();
    S.emit();
    scheduleReply(lobby.id);
  };

  LL.actions["lobby:quick"] = function (el) {
    const lobby = S.lobby(el.dataset.id);
    if (!lobby) return;
    const text = el.dataset.text || "GG";
    lobby.messages.push(S.chatMsg("me", text));
    lobby.messages = lobby.messages.slice(-40);
    S.blip(640, 0.07);
    S.save();
    S.emit();
    scheduleReply(lobby.id);
  };

  LL.actions["lobby:leave"] = function (el) {
    UI.confirm({
      title: "Leave this lobby?",
      text: "The lobby keeps going for everyone else on this device. You can rejoin with the invite code.",
      okLabel: "Leave lobby",
      danger: true,
      act: "lobby:leaveConfirmed",
      data: { id: el.dataset.id }
    });
  };

  LL.actions["lobby:leaveConfirmed"] = function (el) {
    UI.closeModal();
    S.leaveLobby(el.dataset.id);
    LL.app.nav("#/lobbies");
  };

  LL.actions["lobby:close"] = function (el) {
    UI.confirm({
      title: "Close this lobby?",
      text: "The invite code stops working and the room is removed from this device.",
      okLabel: "Close lobby",
      danger: true,
      act: "lobby:closeConfirmed",
      data: { id: el.dataset.id }
    });
  };

  LL.actions["lobby:closeConfirmed"] = function (el) {
    UI.closeModal();
    S.update(function (state) {
      state.lobbies = state.lobbies.filter(function (l) {
        return l.id !== el.dataset.id;
      });
    });
    UI.toast("Lobby closed", "warn");
    LL.app.nav("#/lobbies");
  };

  LL.actions["lobbies:filter"] = function (el) {
    listFilter = el.dataset.id;
    LL.app.refresh();
  };

  /* ---------------- lobbies list screen ---------------- */

  function renderList() {
    const all = S.get().lobbies;
    const mine = all.filter(function (l) {
      return l.ownerId === "me";
    });
    const visible = listFilter === "mine" ? mine : listFilter === "voting" ? all.filter(function (l) {
      return l.status === "voting";
    }) : all;

    return (
      '<div class="stack">' +
      '<div class="between"><div><p class="tiny upper muted">Play together</p><h1 class="display">Lobbies</h1>' +
      '<p class="sm muted" style="margin-top:4px">Private rooms for your squad — invite only, with codes.</p></div>' +
      '<button type="button" class="icon-btn" data-act="lobby:joinModal" aria-label="Join lobby by code">' + UI.icon("users") + "</button></div>" +
      '<div class="row" style="gap:8px">' +
      '<button type="button" class="btn btn-primary" style="flex:1" data-act="lobby:create">' + UI.icon("plus") + "Create lobby</button>" +
      '<button type="button" class="btn btn-ghost" style="flex:1" data-act="lobby:joinModal">' + UI.icon("lock") + "Join with code</button>" +
      "</div>" +
      '<form class="card" data-act="lobby:joinInline" style="display:flex;gap:8px;align-items:center;padding:12px">' +
      '<span class="game-icon sm" style="--hue:120">' + UI.icon("lock") + "</span>" +
      '<input class="input" name="code" placeholder="ENTER CODE" maxlength="8" aria-label="Invite code" style="text-transform:uppercase;letter-spacing:.18em;font-weight:800;letter-spacing:.18em;flex:1" />' +
      '<button type="submit" class="btn btn-soft btn-sm">Join</button>' +
      "</form>" +
      UI.segmented(
        [
          { id: "all", label: "All lobbies" },
          { id: "mine", label: "Hosting" },
          { id: "voting", label: "Voting" }
        ],
        listFilter,
        "lobbies:filter"
      ) +
      (visible.length
        ? '<div class="stack-sm">' + visible.map(lobbyCard).join("") + "</div>"
        : UI.empty({
            icon: "users",
            title: listFilter === "mine" ? "You're not hosting anything" : "No lobbies here",
            text:
              listFilter === "mine"
                ? "Create a lobby and share the invite code with your squad."
                : "Create a private room, pick a pool of games and let everyone vote.",
            action: '<button type="button" class="btn btn-primary btn-sm" data-act="lobby:create">' + UI.icon("plus") + "Create lobby</button>"
          })) +
      UI.notice(
        "<b>Local demo.</b> Lobbies, messages and friend activity are simulated and stored in this browser only. Real-time multiplayer lobbies need a backend (see the README).",
        "info",
        "info"
      ) +
      "</div>"
    );
  }

  function lobbyCard(lobby) {
    const owner = S.person(lobby.ownerId);
    const ready = lobby.members.filter(function (m) {
      return m.ready;
    }).length;
    return (
      '<button type="button" class="card card-tap" style="text-align:left;color:inherit;font:inherit" data-act="nav" data-to="#/lobby/' + lobby.id + '">' +
      '<div class="between">' +
      '<div class="row" style="min-width:0"><span class="game-icon sm" style="--hue:262">' + UI.icon("users") + "</span>" +
      '<div style="min-width:0"><b style="display:block;font-size:.94rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + UI.esc(lobby.name) + "</b>" +
      '<span class="tiny muted">' + (owner.isYou ? "You host" : UI.esc(owner.name) + " hosts") + " · code " + UI.esc(lobby.code) + "</span></div></div>" +
      statusBadge(lobby) +
      "</div>" +
      '<div class="between" style="margin-top:10px">' +
      UI.avatarStack(lobby.members.map(function (m) { return S.person(m.id); }), 4) +
      '<span class="tiny muted">' + ready + "/" + lobby.members.length + " ready · " + lobby.pool.length + " games</span>" +
      "</div>" +
      '<div class="row wrap" style="gap:5px;margin-top:9px">' +
      lobby.pool.slice(0, 4).map(function (id) {
        const game = S.game(id);
        return game ? '<span class="badge">' + game.emoji + " " + UI.esc(game.name) + "</span>" : "";
      }).join("") +
      (lobby.pool.length > 4 ? '<span class="badge">+' + (lobby.pool.length - 4) + "</span>" : "") +
      "</div></button>"
    );
  }

  /* ---------------- lobby room screen ---------------- */

  function renderLobby(params) {
    const lobby = S.lobby(params.id);
    if (!lobby) {
      return (
        '<div class="stack">' +
        UI.sectionHead("Lobby", "Not found") +
        UI.empty({
          icon: "alert",
          title: "That lobby is gone",
          text: "It may have been closed, or the invite code expired.",
          action: '<button type="button" class="btn btn-primary btn-sm" data-act="nav" data-to="#/lobbies">Back to lobbies</button>'
        }) +
        "</div>"
      );
    }
    const isHost = lobby.ownerId === "me";
    const me = lobby.members.find(function (m) {
      return m.id === "me";
    });
    const voteActive = lobby.status === "voting" || !!lobby.lockedGame;
    const owner = S.person(lobby.ownerId);
    const members = lobby.members.map(function (m) {
      return S.person(m.id);
    });

    return (
      '<div class="stack">' +
      '<div class="row" style="gap:8px">' +
      '<button type="button" class="icon-btn" data-act="nav" data-to="#/lobbies" aria-label="Back to lobbies">' + UI.icon("arrowLeft") + "</button>" +
      '<div class="row-main"><p class="tiny upper muted">Private lobby</p><h1 style="font-size:1.3rem">' + UI.esc(lobby.name) + "</h1></div>" +
      (isHost
        ? '<button type="button" class="icon-btn" data-act="lobby:close" data-id="' + lobby.id + '" aria-label="Close lobby">' + UI.icon("trash") + "</button>"
        : '<button type="button" class="icon-btn" data-act="lobby:leave" data-id="' + lobby.id + '" aria-label="Leave lobby">' + UI.icon("logout") + "</button>") +
      "</div>" +
      '<section class="card card-glow">' +
      '<div class="between"><div class="row wrap" style="gap:6px">' + statusBadge(lobby) +
      UI.badge(lobby.members.length + " members", "", "users") + "</div>" +
      '<span class="tiny muted">' + UI.esc(owner.name) + " is host</span></div>" +
      '<div style="margin-top:12px">' + UI.codeBox(lobby.code) + "</div>" +
      '<div class="row" style="gap:8px;margin-top:9px">' +
      '<button type="button" class="btn btn-sm btn-line" style="flex:1" data-act="ui:copy" data-text="' + UI.esc(inviteUrl(lobby)) + '" data-label="Invite link">' + UI.icon("copy") + "Copy invite link</button>" +
      '<button type="button" class="btn btn-sm btn-line" style="flex:1" data-act="lobby:share" data-id="' + lobby.id + '">' + UI.icon("share") + "Share</button>" +
      "</div>" +
      '<p class="tiny muted" style="margin-top:8px">Anyone with the link ' + UI.esc(inviteUrl(lobby)) + " can join in this demo.</p>" +
      "</section>" +

      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Squad</h2><p class="tiny muted">Ready status is a nudge, not a lock</p></div>' +
      '<button type="button" class="btn btn-sm ' + (me && me.ready ? "btn-soft" : "btn-primary") + '" data-act="lobby:toggleReady" data-id="' + lobby.id + '">' +
      (me && me.ready ? UI.icon("check") + "I'm ready" : "Mark ready") + "</button></div>" +
      '<div style="margin-top:12px">' + memberRows(lobby) + "</div>" +
      "</section>" +

      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Game pool</h2><p class="tiny muted">' + lobby.pool.length + " games in rotation</p></div>" +
      '<button type="button" class="btn btn-sm btn-line" data-act="lobby:addGames" data-id="' + lobby.id + '">' + UI.icon("plus") + "Games</button></div>" +
      '<div style="margin-top:12px">' + poolChips(lobby) + "</div>" +
      (lobby.pool.length
        ? '<button type="button" class="btn btn-primary btn-block" style="margin-top:12px" data-act="lobby:startVote" data-id="' + lobby.id + '">' +
          UI.icon("dice") + (voteActive ? "Restart vote" : "Start game vote") + "</button>"
        : "") +
      "</section>" +

      (voteActive
        ? '<section class="card"><div class="between" style="margin-bottom:10px"><div><h2 style="font-size:1rem">Group vote</h2>' +
          '<p class="tiny muted">One game, decided together</p></div>' +
          (isHost && !lobby.lockedGame
            ? '<button type="button" class="btn btn-sm btn-soft" data-act="lobby:lockVote" data-id="' + lobby.id + '">' + UI.icon("lock") + "Lock result</button>"
            : "") +
          "</div>" +
          UI.votePanel({
            options: lobby.pool,
            votes: lobby.votes,
            members: members,
            scope: "lobby",
            lobbyId: lobby.id,
            lockedGame: lobby.lockedGame
          }) +
          (lobby.lockedGame
            ? '<button type="button" class="btn btn-primary btn-block" style="margin-top:12px" data-act="lobby:challengeGame" data-game="' + lobby.lockedGame + '">' +
              UI.icon("target") + "Get a challenge for " + UI.esc(S.gameName(lobby.lockedGame)) + "</button>"
            : "") +
          "</section>"
        : "") +

      '<section class="card">' +
      '<div class="between"><div><h2 style="font-size:1rem">Lobby chat</h2><p class="tiny muted">Ready announcements and banter</p></div>' +
      UI.badge("Local demo", "purple") + "</div>" +
      '<div class="chat" id="lobby-chat" style="margin-top:10px">' + chatFeed(lobby) + "</div>" +
      '<div class="row wrap" style="gap:6px;margin-top:10px">' +
      ["I'm ready", "Need one more", "GG", "Queue up"].map(function (label) {
        return UI.chip(label, { act: "lobby:quick", data: { id: lobby.id, text: label } });
      }).join("") +
      "</div>" +
      '<form data-act="lobby:send" data-id="' + lobby.id + '" style="display:flex;gap:8px;margin-top:10px">' +
      '<input class="input" name="text" placeholder="Message the lobby" maxlength="140" aria-label="Message the lobby" />' +
      '<button type="submit" class="icon-btn" aria-label="Send message">' + UI.icon("send") + "</button>" +
      "</form>" +
      '<p class="tiny muted" style="margin-top:8px">Friend replies are simulated on this device. A real lobby would use WebSockets or a hosted realtime service.</p>' +
      "</section>" +

      (isHost
        ? '<button type="button" class="btn btn-danger btn-sm" data-act="lobby:close" data-id="' + lobby.id + '">' + UI.icon("trash") + "Close lobby</button>"
        : '<button type="button" class="btn btn-line btn-sm" data-act="lobby:leave" data-id="' + lobby.id + '">' + UI.icon("logout") + "Leave lobby</button>") +
      "</div>"
    );
  }

  /* ---------------- join screen ---------------- */

  function renderJoin(params) {
    const code = String(params.code || "").toUpperCase();
    const lobby = S.lobbyByCode(code);
    if (!lobby) {
      return (
        '<div class="stack">' +
        '<div class="row"><button type="button" class="icon-btn" data-act="nav" data-to="#/lobbies" aria-label="Back">' + UI.icon("arrowLeft") + "</button>" +
        '<h1 style="font-size:1.25rem">Join a lobby</h1></div>' +
        UI.empty({
          icon: "alert",
          title: "No lobby for code " + UI.esc(code || "—"),
          text: "Double-check the invite, or paste the code again below.",
          action:
            '<form data-act="lobby:joinInline" class="row" style="gap:8px;width:100%;margin-top:10px">' +
            '<input class="input" name="code" placeholder="ENTER CODE" maxlength="8" aria-label="Invite code" style="text-transform:uppercase;letter-spacing:.18em;font-weight:800" />' +
            '<button type="submit" class="btn btn-primary btn-sm">Join</button></form>'
        }) +
        "</div>"
      );
    }
    const owner = S.person(lobby.ownerId);
    const already = S.joined(lobby);
    return (
      '<div class="stack">' +
      '<div class="row"><button type="button" class="icon-btn" data-act="nav" data-to="#/lobbies" aria-label="Back">' + UI.icon("arrowLeft") + "</button>" +
      '<h1 style="font-size:1.25rem">Lobby invite</h1></div>' +
      '<section class="card card-glow">' +
      '<p class="tiny upper muted">You were invited to</p>' +
      '<h2 style="margin-top:4px">' + UI.esc(lobby.name) + "</h2>" +
      '<p class="sm muted" style="margin-top:4px">' + UI.esc(owner.name) + " is hosting · code " + UI.esc(lobby.code) + "</p>" +
      '<div class="row" style="margin-top:14px">' + UI.avatarStack(lobby.members.map(function (m) { return S.person(m.id); }), 6) + "</div>" +
      '<div class="row wrap" style="gap:5px;margin-top:12px">' +
      lobby.pool.map(function (id) {
        const game = S.game(id);
        return game ? '<span class="badge">' + game.emoji + " " + UI.esc(game.name) + "</span>" : "";
      }).join("") +
      "</div>" +
      '<div class="row" style="gap:8px;margin-top:16px">' +
      (already
        ? '<button type="button" class="btn btn-primary" style="flex:1" data-act="nav" data-to="#/lobby/' + lobby.id + '">Open lobby</button>'
        : '<button type="button" class="btn btn-primary" style="flex:1" data-act="lobby:joinLink" data-code="' + UI.esc(lobby.code) + '">' + UI.icon("plus") + "Join lobby</button>") +
      '<button type="button" class="btn btn-line" data-act="nav" data-to="#/lobbies">Later</button>' +
      "</div>" +
      "</section>" +
      UI.notice("This invite works on this device only in the local demo. There is no real-time sync yet.", "info", "info") +
      "</div>"
    );
  }

  /* ---------------- register screens ---------------- */

  LL.screens.lobbies = {
    render: renderList
  };

  LL.screens.lobby = {
    render: renderLobby,
    mount: function () {
      const chat = document.getElementById("lobby-chat");
      if (chat) chat.scrollTop = chat.scrollHeight;
    }
  };

  LL.screens.join = {
    render: renderJoin
  };
})();
