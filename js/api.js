/* ==========================================================================
   CampusNest — API layer
   Talks to the Express/Supabase backend. If a call fails (backend not
   wired yet, no listings seeded), we fall back to sample data so the UI
   is always presentable — never a blank/broken screen during development.
   ========================================================================== */

const API_BASE = 'https://campusnest-7q59.onrender.com';

const ENDPOINTS = {
  properties: `${API_BASE}/api/properties`,
  property: (id) => `${API_BASE}/api/properties/${id}`,
  favorites: `${API_BASE}/api/favorites`,
  favoriteToggle: (id) => `${API_BASE}/api/favorites/${id}`,
  users: `${API_BASE}/api/users`,
  login: `${API_BASE}/api/users/login`,
  register: `${API_BASE}/api/users/register`,
  me: `${API_BASE}/api/users/profile`,
  updateMe: `${API_BASE}/api/users/profile`,
  admin: `${API_BASE}/api/admin`,
  adminPending: `${API_BASE}/api/admin/properties?status=pending`,
  adminModerate: (id) => `${API_BASE}/api/admin/properties/${id}`,
  myListings: `${API_BASE}/api/properties/mine`,
};

const CampusNestAPI = (() => {

  async function safeFetch(url, options = {}) {
    try {
      const token = Auth.getToken();
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return await res.json();
    } catch (err) {
      console.warn(`[CampusNest] API call failed for ${url}, using fallback where available.`, err.message);
      return null;
    }
  }

  async function getProperties(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await safeFetch(`${ENDPOINTS.properties}${qs}`);
    if (data && Array.isArray(data) && data.length) return { data, isLive: true };
    if (data && Array.isArray(data.properties) && data.properties.length) return { data: data.properties, isLive: true };
    return { data: [], isLive: false };
  }


  async function getProperty(id) {
    const data = await safeFetch(ENDPOINTS.property(id));
    if (data) return { data, isLive: true };
    return { data: null, isLive: false };
  }

  async function getFavorites() {
    const data = await safeFetch(ENDPOINTS.favorites);
    return data || { data: JSON.parse(localStorage.getItem('cn_favorites') || '[]') };
  }

  async function toggleFavorite(propertyId) {
    const result = await safeFetch(ENDPOINTS.favoriteToggle(propertyId), { method: 'POST' });
    if (result) return result;
    const local = JSON.parse(localStorage.getItem('cn_favorites') || '[]');
    const idx = local.indexOf(propertyId);
    if (idx >= 0) local.splice(idx, 1); else local.push(propertyId);
    localStorage.setItem('cn_favorites', JSON.stringify(local));
    return { favorited: idx < 0, local: true };
  }

  function isFavoritedLocal(propertyId) {
    const local = JSON.parse(localStorage.getItem('cn_favorites') || '[]');
    return local.includes(propertyId);
  }


  async function getMe() {
    const data = await safeFetch(ENDPOINTS.me);
    return { data, isLive: !!data };
  }

  async function updateProfile(payload) {
    return safeFetch(ENDPOINTS.updateMe, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  async function login(email, password) {
    return safeFetch(ENDPOINTS.login, { method: 'POST', body: JSON.stringify({ email, password }) });
  }

  async function register(payload) {
    return safeFetch(ENDPOINTS.register, { method: 'POST', body: JSON.stringify(payload) });
  }

  async function getMyListings() {
    const data = await safeFetch(ENDPOINTS.myListings);
    return { data: (data && data.length) ? data : [], isLive: !!data };
  }

  async function getPendingListings() {
    const data = await safeFetch(ENDPOINTS.adminPending);
    return { data: (data && data.length) ? data : [], isLive: !!data };
  }

  async function moderateProperty(id, status) {
    return safeFetch(ENDPOINTS.adminModerate(id), { method: 'PATCH', body: JSON.stringify({ approval_status: status }) });
  }

  return {
    getProperties, getProperty, getFavorites, toggleFavorite, isFavoritedLocal, getMe, updateProfile,
    login, register, getMyListings, getPendingListings, moderateProperty,
    ENDPOINTS,
  };
})();
