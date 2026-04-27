// Copy this file to `runefort-config.js` (gitignored) and fill in your values.
// Loads before the runefort runtime so cloud sync is wired up at boot time.
//
// Local development:
//   url:     http://127.0.0.1:54321
//   anonKey: read from `supabase status` after `supabase start`
//
// Production:
//   url:     https://<your-project-ref>.supabase.co
//   anonKey: read from supabase dashboard → Settings → API → anon public

window.RUNEFORT_SUPABASE = {
  url: "http://127.0.0.1:54321",
  anonKey: "<paste-your-anon-key-here>",
};
