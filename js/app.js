/* ============================================================
   Lobby Legends — app shell, hash router, global actions
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  const app = (LL.app = {});
  LL.actions = LL.actions || {};

  const TABS = [
    { id: "home", label: "Home", icon: "home", hash: "#/home" },
    { id: "lobbies", label: "Lobbies", icon: "users", hash: "#/lobbies" },
    { id: "games", label: "Games", icon: "gamepad", hash: "#/games" },
    { id: "tournaments", label: "Tournaments", icon: "trophy", hash: "#/tournaments" },
    { id: "profile", label: "Profile", icon: "user", hash: "#/profile" }
  ];

  const SIDE_LINKS = TABS.concat([
    { id: "leaderboards", label: "Leaderboards", icon: "chart", hash: "#/leaderboards" },
    { id: "premium", label: "Premium", icon: "crown", hash: "#/premium" },
    { id: "settings", label: "Settings", icon: "sliders", hash: "#/settings" }
  ]);

  let timers = [];
  let current = { screen: "home", params: {}, tab: "home" };
  let view = null;

  /* ---------------- timers that die with the screen ---------------- */

  app.later = function (fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push({ id: id, type: "timeout" });
    return id;
  };

  app.every = function (fn, ms) {
    const id = setInterval(fn, ms);
    timers.push({ id: id, type: "interval" });
    return id;
  };

  function clearTimers() {
    timers.forEach(function (t) {
      if (t.type === "interval") clearInterval(t.id);
      else clearTimeout(t.id);
    });
    timers = [];
  }

  /* ---------------- routing ---------------- */

  function parseRoute() {
    const raw = (location.hash || "#/home").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const head = parts[0] || "home";
    switch (head) {
      case "lobby":
        return { screen: "lobby", params: { id: parts[1] }, tab: "lobbies", hash: location.hash };
      case "tournament":
        return { screen: "tournament", params: { id: parts[1] }, tab: "tournaments", hash: location.hash };
      case "join":
        return { screen: "join", params: { code: parts[1] }, tab: "lobbies", hash: location.hash };
      case "games":
        return { screen: "games", params: {}, tab: "games", hash: location.hash };
      case "challenges":
        return { screen: "games", params: { tab: "challenges" }, tab: "games", hash: location.hash };
      case "library":
        return { screen: "games", params: { tab: "library" }, tab: "games", hash: location.hash };
      case "lobbies":
        return { screen: "lobbies", params: {}, tab: "lobbies", hash: location.hash };
      case "tournaments":
        return { screen: "tournaments", params: {}, tab: "tournaments", hash: location.hash };
      case "leaderboards":
        return { screen: "leaderboards", params: {}, tab: "leaderboards", hash: location.hash };
      case "profile":
        return { screen: "profile", params: {}, tab: "profile", hash: location.hash };
      case "premium":
        return { screen: "premium", params: {}, tab: "premium", hash: location.hash };
      case "settings":
        return { screen: "settings", params: {}, tab: "settings", hash: location.hash };
      default:
        return { screen: "home", params: {}, tab: "home", hash: "#/home" };
    }
  }

  app.nav = function (hash) {
    if (!hash) return;
    if (location.hash === hash) {
      render();
      return;
    }
    location.hash = hash;
  };

  app.refresh = function (opts) {
    render(opts);
  };

  app.route = function () {
    return current;
  };

  function render(opts) {
    const keepScroll = !!(opts && opts.keepScroll);
    const y = window.scrollY;
    clearTimers();
    current = parseRoute();
    const screen = LL.screens[current.screen] || LL.screens.home;

    let html = "";
    try {
      html = screen.render(current.params || {}) || "";
    } catch (err) {
      console.error("[LobbyLegends] screen failed", err);
      html = errorState(err);
    }
    view.innerHTML = html;
    view.scrollTop = 0;
    renderChrome();
    if (screen.mount) {
      try {
        screen.mount(view, current.params || {});
      } catch (err) {
        console.error("[LobbyLegends] mount failed", err);
      }
    }
    if (keepScroll) {
      window.scrollTo(0, y);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function errorState(err) {
    return (
      '<div class="stack">' +
      UI.sectionHead("Something broke", "Error state") +
      UI.empty({
        icon: "alert",
        title: "That screen didn't load",
        text: "Your progress is safe on this device. Try reloading the screen.",
        action:
          '<button class="btn btn-primary" type="button" data-act="nav" data-to="' +
          (location.hash || "#/home") +
          '">Reload screen</button>'
      }) +
      '<p class="tiny muted center">' + U.esc(err && err.message ? err.message : "Unknown error") + "</p>" +
      "</div>"
    );
  }

  /* ---------------- chrome ---------------- */

  function renderChrome() {
    const me = S.person("me");
    const level = S.level();
    const topbar = document.getElementById("topbar");
    const sidebar = document.getElementById("sidebar");
    const tabbar = document.getElementById("tabbar");

    if (topbar) {
      topbar.innerHTML =
        '<a class="brand" href="#/home" data-act="nav" data-to="#/home">' +
        '<span class="brand-mark">' +
        UI.icon("bolt") +
        "</span><span>Lobby Legends<small>SQUAD HQ</small></span></a>" +
        '<span class="spacer"></span>' +
        '<a class="pill-streak" href="#/profile" data-act="nav" data-to="#/profile" aria-label="Current streak: ' +
        S.get().streak +
        ' days">' +
        UI.icon("flame") +
        S.get().streak +
        "d</a>" +
        '<button type="button" class="avatar-btn" data-act="nav" data-to="#/profile" aria-label="Open your profile" style="background:none;border:0;padding:0">' +
        UI.avatar(me, "sm me") +
        "</button>";
    }

    if (sidebar) {
      sidebar.innerHTML =
        '<a class="brand" href="#/home" data-act="nav" data-to="#/home">' +
        '<span class="brand-mark">' +
        UI.icon("bolt") +
        "</span><span>Lobby Legends<small>SQUAD HQ</small></span></a>" +
        '<div class="panel" style="display:flex;gap:10px;align-items:center">' +
        UI.avatar(me, "md me") +
        '<div class="row-main"><b>' +
        UI.esc(me.name) +
        "</b><span>Level " +
        level.level +
        " · " +
        U.esc(S.get().streak + " day streak") +
        "</span></div>" +
        "</div>" +
        '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="between"><span class="upper muted">Level ' +
        level.level +
        '</span><span class="tiny mono muted">' +
        level.into +
        " / " +
        level.need +
        " XP</span></div>" +
        UI.bar(level.pct) +
        "</div>" +
        '<nav class="side-nav" aria-label="Sections">' +
        SIDE_LINKS.map(function (item) {
          const active = item.id === current.tab;
          return (
            '<a class="side-link" href="' +
            item.hash +
            '" data-act="nav" data-to="' +
            item.hash +
            '"' +
            (active ? ' aria-current="page"' : "") +
            ">" +
            UI.icon(item.icon) +
            "<span>" +
            item.label +
            "</span></a>"
          );
        }).join("") +
        "</nav>" +
        '<div class="side-foot stack-sm">' +
        '<button type="button" class="btn btn-soft btn-block" data-act="lobby:create">' +
        UI.icon("plus") +
        "Create Lobby</button>" +
        '<p class="tiny muted">Local demo · progress is stored in this browser only.</p>' +
        "</div>";
    }

    if (tabbar) {
      tabbar.innerHTML = TABS.map(function (item) {
        const active = item.id === current.tab;
        return (
          '<button type="button" class="tab" data-act="nav" data-to="' +
          item.hash +
          '"' +
          (active ? ' aria-current="page"' : "") +
          ">" +
          UI.icon(item.icon) +
          "<span>" +
          item.label +
          "</span></button>"
        );
      }).join("");
    }
  }

  /* ---------------- global actions ---------------- */

  LL.actions["nav"] = function (el) {
    if (UI.modalOpen()) UI.closeModal();
    app.nav(el.dataset.to);
  };

  LL.actions["ui:closeModal"] = function () {
    UI.closeModal();
  };

  LL.actions["ui:copy"] = function (el) {
    const text = el.dataset.text || "";
    U.copyText(text)
      .then(function () {
        UI.toast((el.dataset.label || "Copied") + " copied to clipboard", "ok");
      })
      .catch(function () {
        UI.toast("Couldn't copy automatically. Select the text instead.", "err");
      });
  };

  LL.actions["ui:demo"] = function (el) {
    UI.toast(el.dataset.msg || "That part is a demo in this build.", "warn");
  };

  LL.actions["ui:back"] = function () {
    if (history.length > 1) history.back();
    else app.nav("#/home");
  };

  function bindEvents() {
    document.addEventListener("click", function (e) {
      const el = e.target.closest("[data-act]");
      /* Forms are handled by the submit listener below, so clicks inside a
         form (including its fields) never fire the form's action early. */
      if (!el || el.tagName === "FORM") return;
      const fn = LL.actions[el.dataset.act];
      if (!fn) {
        console.warn("[LobbyLegends] no action registered:", el.dataset.act);
        return;
      }
      e.preventDefault();
      try {
        fn(el, e);
      } catch (err) {
        console.error("[LobbyLegends] action failed:", el.dataset.act, err);
        UI.toast("Something went wrong there. Try again.", "err");
      }
    });

    document.addEventListener("submit", function (e) {
      const form = e.target.closest("form[data-act]");
      if (!form) return;
      e.preventDefault();
      const fn = LL.actions[form.dataset.act];
      if (fn) {
        try {
          fn(form, e);
        } catch (err) {
          console.error("[LobbyLegends] submit failed:", form.dataset.act, err);
          UI.toast("Something went wrong there. Try again.", "err");
        }
      }
    });

    document.addEventListener("change", function (e) {
      const el = e.target.closest("[data-change-act]");
      if (!el) return;
      const fn = LL.actions[el.dataset.changeAct];
      if (fn) {
        try {
          fn(el, e);
        } catch (err) {
          console.error("[LobbyLegends] change failed:", el.dataset.changeAct, err);
        }
      }
    });

    document.addEventListener("input", function (e) {
      const el = e.target.closest("[data-input-act]");
      if (!el) return;
      const fn = LL.actions[el.dataset.inputAct];
      if (fn) {
        try {
          fn(el, e);
        } catch (err) {
          console.error("[LobbyLegends] input failed:", el.dataset.inputAct, err);
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && UI.modalOpen()) UI.closeModal();
    });

    window.addEventListener("hashchange", function () {
      UI.closeModal();
      render();
    });
  }

  /* ---------------- boot ---------------- */

  function boot() {
    view = document.getElementById("view");
    try {
      S.load();
    } catch (err) {
      console.error("[LobbyLegends] load failed", err);
      view.innerHTML = errorState(err);
      return;
    }
    bindEvents();
    S.subscribe(function () {
      render({ keepScroll: true });
    });
    current = parseRoute();
    /* brief skeleton so the first paint shows a real loading state */
    setTimeout(function () {
      render();
    }, 380);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
