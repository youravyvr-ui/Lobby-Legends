/* ============================================================
   Lobby Legends — small shared helpers
   ============================================================ */
(function () {
  const LL = (window.LL = window.LL || {});
  const U = (LL.utils = {});

  /* Registries that screen modules and the shell fill in. Declared here
     because utils.js is the first script loaded, so screens can register
     their actions and renderers before app.js boots. */
  LL.actions = LL.actions || {};
  LL.screens = LL.screens || {};

  U.uid = function (prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
  };

  U.esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  U.clamp = function (n, min, max) {
    return Math.min(max, Math.max(min, n));
  };

  U.randInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  U.pick = function (list) {
    return list[Math.floor(Math.random() * list.length)];
  };

  U.shuffle = function (list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  };

  U.sum = function (list, fn) {
    return list.reduce(function (acc, item) {
      return acc + (fn ? fn(item) : item);
    }, 0);
  };

  U.pct = function (part, total) {
    if (!total) return 0;
    return U.clamp(Math.round((part / total) * 100), 0, 100);
  };

  U.hash = function (str) {
    let h = 0;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) % 100000;
    }
    return h;
  };

  U.hueFor = function (str) {
    return U.hash(str) % 360;
  };

  U.ordinal = function (n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  U.plural = function (n, word, pluralWord) {
    return n === 1 ? n + " " + word : n + " " + (pluralWord || word + "s");
  };

  /* XP curve: level 1 starts at 0, each level needs 150 + (level-1)*100 */
  U.levelFor = function (xp) {
    let level = 1;
    let need = 150;
    let remaining = Math.max(0, xp || 0);
    while (remaining >= need && level < 200) {
      remaining -= need;
      level += 1;
      need = 150 + (level - 1) * 100;
    }
    return { level: level, into: remaining, need: need, pct: U.pct(remaining, need) };
  };

  U.dayKey = function (date) {
    const d = date ? new Date(date) : new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  };

  U.weekKey = function (date) {
    const d = date ? new Date(date) : new Date();
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayNum = (target.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNum + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target - firstThursday;
    const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
    return target.getFullYear() + "-W" + String(week).padStart(2, "0");
  };

  U.relDay = function (ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startToday - startThat) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days > 1 && days < 7) return days + " days ago";
    const sameYear = d.getFullYear() === today.getFullYear();
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: sameYear ? undefined : "numeric"
    });
  };

  U.timeAgo = function (ts) {
    const diff = Math.max(0, Date.now() - (ts || 0));
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    if (days < 7) return days + "d ago";
    return U.relDay(ts);
  };

  U.clock = function (ts) {
    return new Date(ts || Date.now()).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  U.minutes = function (m) {
    if (!m) return "";
    return m >= 60 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + (m % 60) + "m" : "") : m + " min";
  };

  U.debounce = function (fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  };

  U.code = function () {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  };

  U.copyText = function (text) {
    return new Promise(function (resolve, reject) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(resolve).catch(function () {
          fallback();
        });
        return;
      }
      fallback();
      function fallback() {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(ta);
          ok ? resolve() : reject(new Error("copy failed"));
        } catch (err) {
          reject(err);
        }
      }
    });
  };

  U.download = function (filename, text, type) {
    try {
      const blob = new Blob([text], { type: type || "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1500);
      return true;
    } catch (err) {
      return false;
    }
  };

  /* ---------- single-elimination bracket helpers ---------- */

  U.roundName = function (playerCount) {
    const names = { 2: "Final", 4: "Semi-finals", 8: "Quarter-finals", 16: "Round of 16", 32: "Round of 32" };
    return names[playerCount] || "Round of " + playerCount;
  };

  /* Builds every round up front and seeds the first round from participants. */
  U.buildRounds = function (participants, prefix) {
    const rounds = [];
    let matchCount = Math.floor(participants.length / 2);
    let r = 0;
    const idPrefix = prefix || "m";
    while (matchCount >= 1) {
      const matches = [];
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          id: idPrefix + "-r" + r + "-m" + i,
          a: null,
          b: null,
          sa: null,
          sb: null,
          winner: null
        });
      }
      rounds.push({ name: U.roundName(matchCount * 2), matches: matches });
      matchCount = Math.floor(matchCount / 2);
      r += 1;
    }
    participants.forEach(function (id, i) {
      const match = rounds[0].matches[Math.floor(i / 2)];
      if (!match) return;
      if (i % 2 === 0) match.a = id;
      else match.b = id;
    });
    return rounds;
  };

  /* Push confirmed winners forward into the next round. */
  U.propagate = function (rounds) {
    for (let r = 0; r < rounds.length - 1; r++) {
      rounds[r].matches.forEach(function (match, i) {
        const next = rounds[r + 1].matches[Math.floor(i / 2)];
        if (!next) return;
        const slot = i % 2 === 0 ? "a" : "b";
        next[slot] = match.winner || null;
      });
    }
  };

  /* Records a score, clears everything downstream and re-propagates. */
  U.setResult = function (rounds, r, m, sa, sb) {
    const match = rounds[r] && rounds[r].matches[m];
    if (!match) return null;
    for (let k = r + 1; k < rounds.length; k++) {
      rounds[k].matches.forEach(function (mm) {
        mm.a = null;
        mm.b = null;
        mm.sa = null;
        mm.sb = null;
        mm.winner = null;
      });
    }
    match.sa = sa;
    match.sb = sb;
    if (sa == null || sb == null || sa === sb || !match.a || !match.b) {
      match.winner = null;
    } else {
      match.winner = sa > sb ? match.a : match.b;
    }
    U.propagate(rounds);
    return match;
  };
})();
