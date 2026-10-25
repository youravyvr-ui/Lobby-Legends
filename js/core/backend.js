/* ============================================================
   Lobby Legends — backend connection state
   Reads window.LL_CONFIG (js/config.js). When no project is configured
   the whole app stays in local demo mode and says so.
   ============================================================ */
(function () {
  const LL = (window.LL = window.LL || {});
  const B = (LL.backend = {});

  function cfg() {
    return window.LL_CONFIG || {};
  }

  B.url = function () {
    return String(cfg().supabaseUrl || "")
      .trim()
      .replace(/\/+$/, "");
  };

  B.key = function () {
    return String(cfg().supabaseAnonKey || "").trim();
  };

  B.configured = function () {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(B.url()) && B.key().length > 20;
  };

  /* Real network probe against the project's auth health endpoint.
     Resolves with a state the UI can print — never throws. */
  B.check = function () {
    if (!B.configured()) {
      return Promise.resolve({ ok: false, state: "unconfigured", detail: "No project URL and anon key in js/config.js" });
    }
    const started = Date.now();
    return fetch(B.url() + "/auth/v1/health", {
      headers: { apikey: B.key() },
      cache: "no-store"
    })
      .then(function (res) {
        if (!res.ok) {
          return { ok: false, state: "error", detail: "The project answered with HTTP " + res.status };
        }
        return res.json().then(function (body) {
          return {
            ok: true,
            state: "connected",
            detail: (body && body.name ? body.name : "API") + " answered in " + (Date.now() - started) + "ms"
          };
        });
      })
      .catch(function (err) {
        return { ok: false, state: "unreachable", detail: err && err.message ? err.message : "Network error" };
      });
  };
})();
