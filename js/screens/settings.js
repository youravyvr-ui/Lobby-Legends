/* ============================================================
   Lobby Legends — settings: account, privacy, accessibility
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  const THEMES = [
    { id: "midnight", label: "Midnight", note: "Charcoal with a cool edge" },
    { id: "carbon", label: "Carbon", note: "Neutral blacks, no tint" },
    { id: "vapor", label: "Vapor", note: "Deep purple night" }
  ];

  const ACCENTS = [
    { id: "neon", label: "Neon green", color: "#b8ff33" },
    { id: "orange", label: "Orange", color: "#ff9430" },
    { id: "blue", label: "Electric blue", color: "#39b6ff" },
    { id: "red", label: "Red", color: "#ff4d6a" }
  ];

  function render() {
    const state = S.get();
    const settings = state.settings;
    const me = S.person("me");
    const bytes = (S.exportData().length / 1024).toFixed(1);

    return (
      '<div class="stack">' +
      '<div><p class="tiny upper muted">Make it yours</p><h1 class="display">Settings</h1>' +
      '<p class="sm muted" style="margin-top:4px">Everything is stored on this device</p></div>' +

      '<section class="card">' +
      '<div class="between"><div class="row" style="gap:12px">' + UI.avatar(me, "md me") +
      '<div><b>' + UI.esc(me.name) + "</b>" +
      '<p class="tiny muted">Level ' + S.level().level + " · local profile</p></div></div>" +
      '<button type="button" class="btn btn-sm btn-line" data-act="profile:edit">Edit</button></div>' +
      '<div class="row" style="gap:8px;margin-top:12px">' +
      '<button type="button" class="btn btn-sm btn-ghost" style="flex:1" data-act="ui:demo" data-msg="Authentication is not wired up in this local build.">' + UI.icon("lock") + "Connect account (demo)</button>" +
      '<button type="button" class="btn btn-sm btn-line" style="flex:1" data-act="settings:export">' + UI.icon("database") + "Export data</button>" +
      "</div>" +
      '<button type="button" class="btn btn-sm btn-soft btn-block" style="margin-top:8px" data-act="settings:share">' + UI.icon("share") + "Send this app to a friend</button>" +
      '<p class="tiny muted" style="margin-top:9px">There are no accounts, passwords or email logins in this demo — only a local profile.</p>' +
      "</section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">Appearance</h2>' +
      '<p class="tiny muted" style="margin-top:3px">Dark themes only, by design.</p>' +
      '<div class="stack-sm" style="margin-top:12px">' +
      THEMES.map(function (theme) {
        const active = settings.theme === theme.id;
        return (
          '<button type="button" class="row-item tap" data-act="settings:theme" data-id="' + theme.id + '"' + (active ? ' style="border-color:var(--accent-line)"' : "") + ">" +
          '<span class="game-icon sm" style="--hue:' + (theme.id === "vapor" ? 275 : theme.id === "carbon" ? 0 : 200) + '">' + UI.icon("palette") + "</span>" +
          '<span class="row-main"><b>' + UI.esc(theme.label) + "</b><span>" + UI.esc(theme.note) + "</span></span>" +
          (active ? UI.badge("Active", "neon", "check") : "") +
          "</button>"
        );
      }).join("") +
      "</div>" +
      '<div style="margin-top:14px"><span class="label">Accent colour</span><div class="row wrap" style="gap:6px;margin-top:6px">' +
      ACCENTS.map(function (accent) {
        const active = state.profile.accent === accent.id;
        return (
          '<button type="button" class="chip ' + (active ? "on" : "") + '" data-act="settings:accent" data-id="' + accent.id + '" aria-pressed="' + (active ? "true" : "false") + '">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:' + accent.color + ';display:inline-block"></span>' +
          UI.esc(accent.label) +
          "</button>"
        );
      }).join("") +
      "</div></div></section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">Accessibility</h2>' +
      '<div style="margin-top:6px">' +
      UI.toggleRow({ label: "Reduce motion", desc: "Minimise animations and the wheel spin", on: settings.reduceMotion, act: "settings:toggle", data: { path: "reduceMotion" } }) +
      UI.toggleRow({ label: "Larger text", desc: "Bump the base font size for readability", on: settings.largeText, act: "settings:toggle", data: { path: "largeText" } }) +
      UI.toggleRow({ label: "High contrast", desc: "Stronger borders and brighter secondary text", on: settings.highContrast, act: "settings:toggle", data: { path: "highContrast" } }) +
      UI.toggleRow({ label: "Interface sounds", desc: "Short blips on rewards and ready-up", on: settings.sound, act: "settings:sound" }) +
      "</div></section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">Privacy</h2>' +
      '<p class="tiny muted" style="margin-top:3px">These toggles control what the demo shows — nothing leaves this device.</p>' +
      '<div style="margin-top:6px">' +
      UI.toggleRow({ label: "Show my stats to the group", desc: "Display your wins, XP and level on shared screens", on: settings.privacy.showStats, act: "settings:toggle", data: { path: "privacy.showStats" } }) +
      UI.toggleRow({ label: "Allow lobby invites", desc: "Let friends add you to a lobby", on: settings.privacy.allowInvites, act: "settings:toggle", data: { path: "privacy.allowInvites" } }) +
      UI.toggleRow({ label: "Show my match history", desc: "Include results in your profile view", on: settings.privacy.showHistory, act: "settings:toggle", data: { path: "privacy.showHistory" } }) +
      UI.toggleRow({ label: "Appear on leaderboards", desc: "Hide yourself from the group ranking", on: settings.privacy.appearInLeaderboard, act: "settings:toggle", data: { path: "privacy.appearInLeaderboard" } }) +
      "</div></section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">Notifications</h2>' +
      '<div style="margin-top:6px">' +
      UI.toggleRow({ label: "Lobby invites", desc: "Ping me when a lobby opens", on: settings.notifications.lobbyInvites, act: "settings:toggle", data: { path: "notifications.lobbyInvites" } }) +
      UI.toggleRow({ label: "Tournament updates", desc: "Tell me when a bracket advances", on: settings.notifications.tournamentUpdates, act: "settings:toggle", data: { path: "notifications.tournamentUpdates" } }) +
      UI.toggleRow({ label: "Daily challenge", desc: "Remind me to keep the streak alive", on: settings.notifications.dailyChallenge, act: "settings:toggle", data: { path: "notifications.dailyChallenge" } }) +
      "</div>" +
      '<p class="tiny muted" style="margin-top:9px">Push notifications need a backend and a service worker — these preferences are saved but no notifications are sent in this build.</p>' +
      "</section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">Your data</h2>' +
      '<div class="row-item" style="margin-top:10px">' + UI.icon("database", "accent") +
      '<div class="row-main"><b>' + bytes + " KB stored locally</b><span>In this browser only · no server copy</span></div></div>" +
      '<div class="row" style="gap:8px;margin-top:12px">' +
      '<button type="button" class="btn btn-sm btn-ghost" style="flex:1" data-act="settings:export">' + UI.icon("share") + "Export JSON</button>" +
      '<button type="button" class="btn btn-sm btn-danger" style="flex:1" data-act="settings:reset">' + UI.icon("trash") + "Reset demo</button>" +
      "</div>" +
      '<p class="tiny muted" style="margin-top:9px">Resetting puts the sample squad and your starting progress back. It cannot be undone.</p>' +
      "</section>" +

      '<section class="card">' +
      '<div class="between"><h2 style="font-size:1rem">Backend</h2>' +
      (LL.backend.configured() ? UI.badge("Configured", "neon", "check") : UI.badge("Not configured", "orange", "database")) + "</div>" +
      '<div class="row-item" style="margin-top:10px">' + UI.icon("database", "accent") +
      '<div class="row-main"><b id="backend-state">' +
      (LL.backend.configured() ? "Supabase project set" : "Running on this device only") + "</b>" +
      '<span id="backend-detail">' +
      (LL.backend.configured()
        ? "Tap Check connection to verify it answers."
        : "Accounts and shared lobbies need a project — see SUPABASE_SETUP.md.") +
      "</span></div></div>" +
      (LL.backend.configured()
        ? '<button type="button" class="btn btn-sm btn-line btn-block" style="margin-top:10px" data-act="settings:checkBackend">' + UI.icon("refresh") + "Check connection</button>"
        : "") +
      "</section>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">About this build</h2>' +
      '<div class="stack-sm" style="margin-top:10px">' +
      [
        ["Version", "0.1 · local demo"],
        ["Backend", "None attached — localStorage only"],
        ["Realtime lobbies", "Simulated locally"],
        ["Billing", "Not implemented — premium is a preview"],
        ["Secrets", "No API keys are stored in this app"]
      ]
        .map(function (row) {
          return '<div class="between" style="border-bottom:1px solid var(--line);padding:8px 0"><span class="tiny upper muted">' + UI.esc(row[0]) + "</span><span class=\"sm\">" + UI.esc(row[1]) + "</span></div>";
        })
        .join("") +
      "</div>" +
      UI.notice("Scores, group stats and friend activity are local sample data. Lobby Legends never claims official game statistics or verified competitive results.", "info", "shield") +
      "</section>" +

      '<p class="tiny muted center" style="padding:4px 0 8px">Built for the friend group that never stops arguing about what to play.</p>' +
      "</div>"
    );
  }

  /* ---------------- actions ---------------- */

  LL.actions["settings:toggle"] = function (el) {
    const path = el.dataset.path;
    const current = el.getAttribute("aria-checked") === "true";
    S.setSetting(path, !current);
  };

  LL.actions["settings:sound"] = function (el) {
    const current = el.getAttribute("aria-checked") === "true";
    S.setSetting("sound", !current);
    if (!current) S.blip(760, 0.1);
  };

  LL.actions["settings:theme"] = function (el) {
    S.setSetting("theme", el.dataset.id);
    UI.toast("Theme updated", "ok");
  };

  LL.actions["settings:accent"] = function (el) {
    S.update(function (state) {
      state.profile.accent = el.dataset.id;
    });
    S.applySettings();
    S.emit();
    UI.toast("Accent updated", "ok");
  };

  LL.actions["settings:export"] = function () {
    const ok = U.download("lobby-legends-backup.json", S.exportData(), "application/json");
    UI.toast(ok ? "Backup downloaded" : "Couldn't create the file here", ok ? "ok" : "err");
  };

  /* Shares the hosted demo link. Everything stays client side: this only hands
     the current address to the system share sheet (or the clipboard). */
  LL.actions["settings:share"] = function () {
    const url = location.href.split("#")[0];
    const text = "Lobby Legends — spin the picker, run a lobby, take on challenges and crown the champion of your squad.";
    if (navigator.share) {
      navigator
        .share({ title: "Lobby Legends", text: text, url: url })
        .catch(function () {
          /* dismissed or unavailable — nothing else to do */
        });
      return;
    }
    U.copyText(url)
      .then(function () {
        UI.toast("Link copied — send it to your squad", "ok");
      })
      .catch(function () {
        UI.toast("Couldn't copy the link. It's in the address bar.", "warn");
      });
  };

  LL.actions["settings:reset"] = function () {
    UI.confirm({
      title: "Reset all local data?",
      text: "Your XP, lobbies, brackets and challenges on this device are replaced with the original sample data. This cannot be undone.",
      okLabel: "Reset everything",
      danger: true,
      act: "settings:resetConfirmed"
    });
  };

  LL.actions["settings:resetConfirmed"] = function () {
    UI.closeModal();
    S.reset();
    LL.app.nav("#/home");
  };

  LL.actions["settings:checkBackend"] = function () {
    const state = document.getElementById("backend-state");
    const detail = document.getElementById("backend-detail");
    if (state) state.textContent = "Checking…";
    if (detail) detail.textContent = "Contacting " + LL.backend.url();
    LL.backend.check().then(function (res) {
      if (state) state.textContent = res.ok ? "Connected" : "Could not connect";
      if (detail) detail.textContent = res.detail || "";
      UI.toast(res.ok ? "Supabase answered" : "Supabase did not answer", res.ok ? "ok" : "err");
    });
  };

  LL.screens.settings = { render: render };
})();
