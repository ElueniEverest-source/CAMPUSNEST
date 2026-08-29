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
  me: `${API_BASE}/api/users/me`,
  admin: `${API_BASE}/api/admin`,
  adminPending: `${API_BASE}/api/admin/properties?status=pending`,
  adminModerate: (id) => `${API_BASE}/api/admin/properties/${id}`,
  myListings: `${API_BASE}/api/properties/mine`,
};

const SAMPLE_PROPERTIES = [
  {
    id: 'sample-1', title: 'Self-contain near DELSU back gate', price: 180000,
    property_type: 'Self-contain', bedrooms: 1, campus: 'DELSU Abraka', area: 'Abraka, behind Faculty of Science',
    amenities: ['Prepaid meter', 'Water', 'Tiled floor', 'Security'], verification_status: 'verified',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
  },
  {
    id: 'sample-2', title: '2-bedroom flat, shared compound', price: 320000,
    property_type: 'Flat', bedrooms: 2, campus: 'DELSU Abraka', area: 'Abraka, Ekruku road',
    amenities: ['Kitchen', 'POP ceiling', 'Fenced compound', 'Borehole'], verification_status: 'verified',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
  },
  {
    id: 'sample-3', title: 'Room and parlour, FUPRE axis', price: 220000,
    property_type: 'Room & Parlour', bedrooms: 1, campus: 'FUPRE', area: 'Effurun, close to Ugbomro road',
    amenities: ['Prepaid meter', 'Wardrobe', 'Water'], verification_status: 'pending',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'],
  },
  {
    id: 'sample-4', title: 'Mini flat with private toilet', price: 260000,
    property_type: 'Mini Flat', bedrooms: 1, campus: 'FUPRE', area: 'Effurun, near main gate',
    amenities: ['Private toilet', 'Kitchenette', 'Security', 'Parking'], verification_status: 'verified',
    images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'],
  },
  {
    id: 'sample-5', title: 'Shared apartment, 4 in a compound', price: 140000,
    property_type: 'Shared', bedrooms: 1, campus: 'DELSU Abraka', area: 'Abraka, Airport road',
    amenities: ['Water', 'Generator light', 'Reading table'], verification_status: 'verified',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'],
  },
  {
    id: 'sample-6', title: 'Self-contain, newly built', price: 200000,
    property_type: 'Self-contain', bedrooms: 1, campus: 'FUPRE', area: 'Effurun, Enerhen road',
    amenities: ['Prepaid meter', 'Tiled floor', 'Water', 'Wardrobe'], verification_status: 'verified',
    images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80'],
  },
];

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
    return { data: filterSample(filters), isLive: false };
  }

  function filterSample(filters) {
    return SAMPLE_PROPERTIES.filter(p => {
      if (filters.campus && filters.campus !== 'All campuses' && p.campus !== filters.campus) return false;
      if (filters.property_type && p.property_type !== filters.property_type) return false;
      if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.area.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  async function getProperty(id) {
    const data = await safeFetch(ENDPOINTS.property(id));
    if (data) return { data, isLive: true };
    const sample = SAMPLE_PROPERTIES.find(p => p.id === id) || SAMPLE_PROPERTIES[0];
    return { data: sample, isLive: false };
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

  async function login(email, password) {
    return safeFetch(ENDPOINTS.login, { method: 'POST', body: JSON.stringify({ email, password }) });
  }

  async function register(payload) {
    return safeFetch(ENDPOINTS.register, { method: 'POST', body: JSON.stringify(payload) });
  }

  async function getMyListings() {
    const data = await safeFetch(ENDPOINTS.myListings);
    return { data: (data && data.length) ? data : SAMPLE_PROPERTIES.slice(0, 3), isLive: !!data };
  }

  async function getPendingListings() {
    const data = await safeFetch(ENDPOINTS.adminPending);
    return { data: (data && data.length) ? data : [SAMPLE_PROPERTIES[2]], isLive: !!data };
  }

  async function moderateProperty(id, status) {
    return safeFetch(ENDPOINTS.adminModerate(id), { method: 'PATCH', body: JSON.stringify({ approval_status: status }) });
  }

  return {
    getProperties, getProperty, getFavorites, toggleFavorite, isFavoritedLocal,
    login, register, getMyListings, getPendingListings, moderateProperty,
    ENDPOINTS, SAMPLE_PROPERTIES,
  };
})();
