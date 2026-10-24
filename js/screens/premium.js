/* ============================================================
   Lobby Legends — Premium preview (demo only, no billing)
   ============================================================ */
(function () {
  const LL = window.LL;
  const U = LL.utils;
  const UI = LL.ui;
  const S = LL.store;

  LL.screens = LL.screens || {};

  let pack = [];

  const FEATURES = [
    { icon: "chart", title: "Advanced stats", text: "Deeper per-game breakdowns, streaks and head-to-head trends.", demo: true },
    { icon: "palette", title: "Extra customisation", text: "Avatar frames, profile banners and accent themes beyond the defaults.", demo: true },
    { icon: "trophy", title: "Bigger tournament options", text: "16-player brackets, seeding controls and shared bracket links.", demo: true },
    { icon: "sparkles", title: "Exclusive challenge packs", text: "Themed packs for your squad, refreshed every week.", demo: true }
  ];

  function planCard(cfg) {
    return (
      '<div class="price-card ' + (cfg.best ? "best" : "") + '">' +
      (cfg.best ? '<span class="ribbon">Best value</span>' : "") +
      '<div class="between"><b class="sm">' + UI.esc(cfg.name) + "</b>" + UI.badge("Demo", "orange") + "</div>" +
      '<div class="amount">' + UI.esc(cfg.price) + " <small>" + UI.esc(cfg.per) + "</small></div>" +
      '<p class="tiny muted">' + UI.esc(cfg.note) + "</p>" +
      '<ul>' +
      cfg.features
        .map(function (f) {
          return "<li>" + UI.icon("check") + "<span>" + UI.esc(f) + "</span></li>";
        })
        .join("") +
      "</ul>" +
      '<button type="button" class="btn ' + (cfg.best ? "btn-primary" : "btn-ghost") + ' btn-block" style="margin-top:auto" data-act="premium:choose" data-plan="' +
      cfg.id +
      '">Demo: preview ' +
      UI.esc(cfg.name) +
      "</button>" +
      "</div>"
    );
  }

  function render() {
    const active = S.get().premium.demo;
    return (
      '<div class="stack">' +
      '<section class="hero card-glow" style="text-align:center;padding:22px 18px">' +
      '<div class="row" style="justify-content:center"><span class="game-icon" style="--hue:48;width:52px;height:52px;font-size:1.5rem">' + UI.icon("crown") + "</span></div>" +
      '<p class="tiny upper muted" style="margin-top:10px">Lobby Legends</p>' +
      '<h1 class="display" style="margin-top:4px">Premium</h1>' +
      '<p class="sm dim" style="margin-top:8px;max-width:40ch;margin-left:auto;margin-right:auto">More stats, more flair, bigger brackets. Built for the friend group that never stops competing.</p>' +
      (active ? '<div style="margin-top:12px">' + UI.badge("Demo mode active", "purple", "crown") + "</div>" : "") +
      "</section>" +

      UI.notice(
        "<b>This is a demo upgrade page.</b> No payments, no payment details and no real subscription. Nothing will ever be charged from this build.",
        "info",
        "alert"
      ) +

      '<div class="grid grid-2">' +
      planCard({
        id: "monthly",
        name: "Monthly",
        price: "€3.99",
        per: "/ month",
        note: "Cancel any time — in a real build.",
        features: ["Everything unlocked", "Advanced stats", "Premium challenge packs", "16-player brackets"],
        best: false
      }) +
      planCard({
        id: "yearly",
        name: "Yearly",
        price: "€29.99",
        per: "/ year",
        note: "About €2.50/month · save 37%",
        best: true,
        features: ["Everything in Monthly", "Early access to new packs", "Premium avatar frames", "Priority bracket hosting"]
      }) +
      "</div>" +

      '<section class="card">' +
      '<h2 style="font-size:1rem">What Premium would add</h2>' +
      '<div class="stack-sm" style="margin-top:10px">' +
      FEATURES.map(function (f) {
        return (
          '<div class="row-item">' +
          '<span class="game-icon sm" style="--hue:48">' + UI.icon(f.icon) + "</span>" +
          '<div class="row-main"><b>' + UI.esc(f.title) + "</b><span>" + UI.esc(f.text) + "</span></div>" +
          UI.badge("Demo", "orange") +
          "</div>"
        );
      }).join("") +
      "</div></section>" +

      (active
        ? '<section class="card card-glow">' +
          '<div class="between"><div><h2 style="font-size:1rem">Demo premium is on</h2>' +
          '<p class="tiny muted">Activated ' + U.relDay(S.get().premium.since) + " · " + UI.esc(S.get().premium.plan || "monthly") + " preview</p></div>" +
          UI.badge("Local only", "purple") + "</div>" +
          '<div class="row" style="gap:8px;margin-top:12px">' +
          '<button type="button" class="btn btn-soft btn-sm" style="flex:1" data-act="premium:pack">' + UI.icon("sparkles") + "Open challenge pack (demo)</button>" +
          '<button type="button" class="btn btn-line btn-sm" data-act="premium:disable">Turn off demo</button>' +
          "</div>" +
          '<p class="tiny muted" style="margin-top:9px">This changes a local flag only. No plan, payment method or receipt exists.</p>' +
          "</section>"
        : "") +

      '<section class="card">' +
      '<h2 style="font-size:1rem">What you actually get today</h2>' +
      '<div class="stack-sm" style="margin-top:10px">' +
      [
        ["Everything in the free app", "Game picker, lobbies, challenges, brackets, leaderboards and profiles."],
        ["No account needed", "Progress is saved in this browser, not on a server."],
        ["No payment details, ever", "This build has no checkout, no card fields and no subscriptions."]
      ]
        .map(function (row) {
          return (
            '<div class="row-item">' + UI.icon("check", "accent") +
            '<div class="row-main"><b>' + UI.esc(row[0]) + "</b><span>" + UI.esc(row[1]) + "</span></div></div>"
          );
        })
        .join("") +
      "</div></section>" +

      '<button type="button" class="btn btn-ghost btn-block" data-act="premium:tournamentsDemo">' + UI.icon("trophy") + "Try the extended bracket demo</button>" +
      '<p class="tiny muted center">Real billing, accounts and shared brackets need a backend and a payment provider. The README sketches how to add them safely.</p>' +
      "</div>"
    );
  }

  function setDemo(plan) {
    S.update(function (state) {
      state.premium = { demo: true, plan: plan, since: Date.now() };
      state.settings.supporterPreview = true;
    });
    S.checkAchievements({ silent: false, save: true, emit: true });
    UI.toast("Premium demo unlocked · nothing was charged", "ok");
  }

  LL.actions["premium:choose"] = function (el) {
    const plan = el.dataset.plan || "monthly";
    UI.confirm({
      title: "Preview the " + plan + " plan",
      text: "This is a demo. No card details are collected, nothing is charged and no subscription becomes active. It only unlocks the demo panels on this device.",
      okLabel: "Turn on demo preview",
      act: "premium:enableDemo",
      data: { plan: plan }
    });
  };

  LL.actions["premium:enableDemo"] = function (el) {
    UI.closeModal();
    setDemo(el.dataset.plan || "monthly");
  };

  LL.actions["premium:disable"] = function () {
    S.update(function (state) {
      state.premium = { demo: false, plan: null, since: null };
      state.settings.supporterPreview = false;
    });
    UI.toast("Demo premium turned off — nothing was ever charged", "warn");
  };

  LL.actions["premium:pack"] = function () {
    pack = LL.challenges.featured(S.get().library).concat(LL.challenges.featured(S.get().library)).slice(0, 4);
    UI.openModal({
      title: "Demo challenge pack",
      subtitle: "Three themed challenges for the squad. Demo content — no purchase involved.",
      body:
        '<div class="stack-sm">' +
        pack
          .map(function (ch, i) {
            const game = S.game(ch.gameId);
            return (
              '<div class="panel">' +
              '<div class="between"><span class="badge purple">' + UI.icon("sparkles") + "Pack pick " + (i + 1) + "</span>" +
              UI.badge("+" + ch.xp + " XP", "orange") + "</div>" +
              '<b class="sm" style="display:block;margin-top:6px">' + UI.esc(ch.title) + "</b>" +
              '<p class="tiny dim" style="margin-top:3px;line-height:1.4">' + UI.esc(ch.text) + "</p>" +
              '<div class="row wrap" style="gap:5px;margin-top:6px">' +
              (game ? '<span class="badge">' + game.emoji + " " + UI.esc(game.name) + "</span>" : "") +
              UI.difficultyChip(ch.difficulty) +
              "</div>" +
              '<button type="button" class="btn btn-sm btn-soft btn-block" style="margin-top:8px" data-act="premium:assignPack" data-i="' + i + '">Set as daily challenge</button>' +
              "</div>"
            );
          })
          .join("") +
      "</div>",
      actions: '<button type="button" class="btn btn-line" data-act="ui:closeModal">Close</button>'
    });
  };

  LL.actions["premium:assignPack"] = function (el) {
    const ch = pack[Number(el.dataset.i)];
    if (!ch) return;
    S.update(function (state) {
      state.activeChallenge = Object.assign({}, ch, { id: U.uid("ch") });
    });
    UI.closeModal();
    UI.toast("Challenge set · " + ch.title, "ok");
  };

  LL.actions["premium:tournamentsDemo"] = function () {
    UI.toast("Extended brackets are a demo idea — the free bracket builder is fully working.", "warn");
    LL.app.nav("#/tournaments");
  };

  LL.screens.premium = { render: render };
})();
