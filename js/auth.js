const Auth = (() => {
  const KEY = 'cn_session';
  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  }
  function setSession(session) { localStorage.setItem(KEY, JSON.stringify(session)); }
  function clearSession() { localStorage.removeItem(KEY); }
  function isLoggedIn() { return !!getSession(); }
  function getToken() { const s = getSession(); return s ? s.token : null; }
  function getRole() { const s = getSession(); return s ? s.role : null; }
  function getUser() { const s = getSession(); return s ? s.user : null; }
  function login(sessionData) { setSession(sessionData); }
  function logout() { clearSession(); window.location.href = 'index.html'; }
  return { getSession, isLoggedIn, getToken, getRole, getUser, login, logout };
})();
