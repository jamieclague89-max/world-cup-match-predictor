/**
 * Server-side Supabase admin client (uses service role key — bypasses RLS).
 * Never expose this key to the browser.
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.\n' +
    '           Add them to server/.env — database features will not work until then.'
  );
}

const supabase = (url && key)
  ? createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    })
  : null;

module.exports = supabase;
