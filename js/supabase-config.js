window.CAMPUSNEST_SUPABASE_URL = window.CAMPUSNEST_SUPABASE_URL || '';
window.CAMPUSNEST_SUPABASE_ANON_KEY = window.CAMPUSNEST_SUPABASE_ANON_KEY || '';
window.campusNestSupabaseReady = new Promise((resolve) => {
  const finish = () => resolve(window.CAMPUSNEST_SUPABASE_URL && window.CAMPUSNEST_SUPABASE_ANON_KEY
    ? window.supabase.createClient(window.CAMPUSNEST_SUPABASE_URL, window.CAMPUSNEST_SUPABASE_ANON_KEY) : null);
  if (window.supabase) return finish();
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  script.onload = finish;
  script.onerror = () => resolve(null);
  document.head.appendChild(script);
});