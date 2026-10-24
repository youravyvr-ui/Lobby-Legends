/*
 * Supabase connection for Lobby Legends.
 *
 * Fill in the two values below from your Supabase project:
 *   Project Settings -> API -> Project URL  and  anon/public key.
 *
 * The "anon" key is designed to be public: it only grants what your Row Level
 * Security policies allow (see supabase/schema.sql). NEVER put the
 * "service_role" key here — that one bypasses RLS and must stay on a server.
 *
 * While these are empty the app runs in Local Demo mode: everything works on
 * this device only, and the UI says so.
 */
window.LL_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  /* How much data to pull for leaderboards. Keep it small on the free tier. */
  leaderboardLimit: 100
};
