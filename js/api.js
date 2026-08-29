const ENDPOINTS = { properties: '/api/properties', property: (id) => `/api/properties/${id}`, mine: '/api/my/properties', images: (id) => `/api/properties/${id}/images`, image: (propertyId, imageId) => `/api/properties/${propertyId}/images/${imageId}`, favorites: '/api/favorites', favorite: (id) => `/api/favorites/${id}`, messages: '/api/messages', message: (id) => `/api/messages/${id}`, adminStats: '/api/admin/stats', adminUsers: '/api/admin/users', adminProperties: '/api/admin/properties', pending: '/api/admin/properties/pending', moderate: (id, action) => `/api/admin/properties/${id}/${action}`, adminReports: '/api/admin/reports', pendingLegacy: '/api/admin/properties?status=pending' };
const CampusNestAPI = (() => {
  const favoriteIds = new Set();
  const request = async (url, options = {}) => { const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }; if (Auth.getToken()) headers.Authorization = `Bearer ${Auth.getToken()}`; const response = await fetch(url, { ...options, headers }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Request failed'); return data; };
  const listData = (data) => { const list = Array.isArray(data) ? data : data.properties || data.data || []; if (data.pagination) list.pagination = data.pagination; return list; };
  return {
    ENDPOINTS,
    getProperties: (filters = {}) => request(`${ENDPOINTS.properties}?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value))}`).then(listData),
    getProperty: (id) => request(ENDPOINTS.property(id)),
    getMyListings: () => request(ENDPOINTS.mine).then(listData),
    createProperty: (body) => request(ENDPOINTS.properties, { method: 'POST', body: JSON.stringify(body) }),
    updateProperty: (id, body) => request(ENDPOINTS.property(id), { method: 'PUT', body: JSON.stringify(body) }),
    deleteProperty: (id) => request(ENDPOINTS.property(id), { method: 'DELETE' }),
    getPropertyImages: (id) => request(ENDPOINTS.images(id)),
    savePropertyImage: (id, body) => request(ENDPOINTS.images(id), { method: 'POST', body: JSON.stringify(body) }),
    deletePropertyImage: (propertyId, imageId) => request(ENDPOINTS.image(propertyId, imageId), { method: 'DELETE' }),
    uploadPropertyImage: async (propertyId, file, sortOrder) => { const supabase = await Auth.whenReady(); const path = `${Auth.getUser().id}/${propertyId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const { error } = await supabase.storage.from('property-images').upload(path, file, { contentType: file.type, upsert: false }); if (error) throw new Error('Image upload failed'); const { data } = supabase.storage.from('property-images').getPublicUrl(path); return CampusNestAPI.savePropertyImage(propertyId, { storage_path: path, public_url: data.publicUrl, sort_order: sortOrder }); },
    isFavoritedLocal: (id) => favoriteIds.has(id),
    getFavorites: () => request(ENDPOINTS.favorites).then((data) => { const list = listData(data); favoriteIds.clear(); list.forEach((property) => favoriteIds.add(property.id)); return list; }),
    saveFavorite: (id) => request(ENDPOINTS.favorite(id), { method: 'POST' }).then((result) => { favoriteIds.add(id); return result; }),
    removeFavorite: (id) => request(ENDPOINTS.favorite(id), { method: 'DELETE' }).then((result) => { favoriteIds.delete(id); return result; }),
    toggleFavorite: (id) => favoriteIds.has(id) ? CampusNestAPI.removeFavorite(id) : CampusNestAPI.saveFavorite(id),
    getMessages: () => request(ENDPOINTS.messages),
    sendMessage: (propertyId, message) => request(ENDPOINTS.messages, { method: 'POST', body: JSON.stringify({ propertyId, message }) }),
    markMessageRead: (id) => request(`${ENDPOINTS.message(id)}/read`, { method: 'PATCH' }),
    getAdminStats: () => request(ENDPOINTS.adminStats),
    getAdminUsers: () => request(ENDPOINTS.adminUsers),
    getPendingListings: () => request(ENDPOINTS.pending).then(listData),
    moderateProperty: (id, status, reason) => request(ENDPOINTS.moderate(id, status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'remove'), { method: 'PATCH', body: JSON.stringify(reason ? { reason } : {}) }),
    getAdminReports: (status = 'pending') => request(`${ENDPOINTS.adminReports}?status=${encodeURIComponent(status)}`),
    updateReport: (id, action) => request(`/api/admin/reports/${id}/${action}`, { method: 'PATCH' }),
    getProfile: () => request('/api/users/profile'),
    updateProfile: (body) => request('/api/users/profile', { method: 'PATCH', body: JSON.stringify(body) })
  };
})();
