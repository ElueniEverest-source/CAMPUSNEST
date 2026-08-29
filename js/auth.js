if (!window.campusNestSupabaseReady) {
  const configScript = document.createElement('script');
  configScript.src = 'js/supabase-config.js';
  document.head.appendChild(configScript);
}
const Auth = (() => {
  let client = null;
  let session = null;
  let profile = null;
  let ready = false;
  const roleDashboard = (role) => `dashboard-${role === 'admin' ? 'admin' : role === 'landlord' ? 'landlord' : role === 'agent' ? 'agent' : 'student'}.html`;
  const sync = async (nextSession) => { session = nextSession; profile = null; ready = true; if (session && window.CampusNestAPI) { try { profile = await CampusNestAPI.getProfile(); } catch { session = null; } } document.dispatchEvent(new CustomEvent('campusnest-auth-change', { detail: { session, profile } })); return { session, profile }; };
  const clientReady = new Promise((resolve) => { const waitForConfig = () => window.campusNestSupabaseReady ? window.campusNestSupabaseReady.then(resolve) : setTimeout(waitForConfig, 0); waitForConfig(); }).then((value) => { client = value; if (client) { client.auth.getSession().then(({ data }) => sync(data.session)); client.auth.onAuthStateChange((_event, nextSession) => sync(nextSession)); } else ready = true; return client; });
  return {
    ready: () => ready, whenReady: () => clientReady, getSupabase: () => client, isLoggedIn: () => Boolean(session), getToken: () => session?.access_token || '', getRole: () => profile?.role || '', getUser: () => session?.user || null, getProfile: () => profile, dashboard: roleDashboard,
    login: async ({ email, password }) => { const auth = await clientReady; if (!auth) throw new Error('Authentication service is not configured'); const { data, error } = await auth.auth.signInWithPassword({ email, password }); if (error) throw new Error('Invalid email or password'); return sync(data.session); },
    register: async (details) => { const auth = await clientReady; if (!auth) throw new Error('Authentication service is not configured'); const { name, email, password, phone, university, role } = details; const { data, error } = await auth.auth.signUp({ email, password, options: { data: { name, phone, university, role } } }); if (error) throw new Error(error.message.includes('already') ? 'An account with this email already exists' : 'Unable to create account'); if (!data.user || !data.session) throw new Error('Check your email to confirm your account, then log in'); const response = await fetch('/api/users/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ name, email, phone, university, role }) }); if (!response.ok) throw new Error('Account created, but the profile could not be saved'); return sync(data.session); },
    logout: async () => { const auth = await clientReady; if (auth) await auth.auth.signOut(); session = null; profile = null; location.href = 'index.html'; },
    isStudent: () => profile?.role === 'student', isLandlord: () => profile?.role === 'landlord', isAgent: () => profile?.role === 'agent', isAdmin: () => profile?.role === 'admin',
    requestPasswordReset: async (email) => { const auth = await clientReady; if (!auth) throw new Error('Authentication service is not configured'); const { error } = await auth.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/password-reset.html` }); if (error) throw new Error('Unable to send the reset email'); },
    updatePassword: async (password) => { const auth = await clientReady; if (!auth) throw new Error('Authentication service is not configured'); const { error } = await auth.auth.updateUser({ password }); if (error) throw new Error('Unable to update password'); }
  };
})();