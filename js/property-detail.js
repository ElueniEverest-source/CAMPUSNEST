document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'sample-1';

  const { data: p } = await CampusNestAPI.getProperty(id);
  document.title = `${p.title} — CampusNest`;

  renderGallery(p);
  renderMain(p);
  renderContact(p);
});

function renderGallery(p) {
  const imgs = (p.images && p.images.length ? p.images : [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  ]);
  const el = document.getElementById('gallery');
  el.innerHTML = `
    <div class="detail-gallery-main">
      <img src="${imgs[0]}" alt="${escapeHtml(p.title)}">
    </div>
    <div class="detail-gallery-side">
      <img src="${imgs[1] || imgs[0]}" alt="${escapeHtml(p.title)} interior">
      <img src="${imgs[2] || imgs[0]}" alt="${escapeHtml(p.title)} additional view">
    </div>`;
}

function renderMain(p) {
  const verified = p.verification_status === 'verified';
  const amenities = p.amenities && p.amenities.length ? p.amenities : ['Prepaid meter', 'Water supply', 'Fenced compound'];
  const favorited = CampusNestAPI.isFavoritedLocal(p.id);

  document.getElementById('detail-main').innerHTML = `
    <div class="detail-title-row">
      <div>
        ${verified ? `<span class="badge-verified">✓ Verified by CampusNest</span>` : `<span class="badge-verified badge-pending">Pending review</span>`}
        <h1 style="font-size:clamp(24px,3.6vw,32px); margin-top:10px;">${escapeHtml(p.title)}</h1>
        <div class="property-loc" style="font-size:14px; margin-top:6px;">📍 ${escapeHtml(p.area || p.campus || '')}</div>
      </div>
      <div class="stamp stamp-sm" title="Verified listing" style="${verified ? '' : 'display:none'}">
        <span class="stamp-text"><span class="stamp-check">✓</span>Verified</span>
      </div>
    </div>

    <div class="divider"></div>
    <div class="detail-price">${formatNaira(p.price)}<span> / year</span></div>

    <div class="divider"></div>
    <h3 style="font-family:var(--font-body); font-size:15.5px; font-weight:700;">About this place</h3>
    <p style="color:var(--muted); font-size:14.5px; margin-top:8px; line-height:1.7;">
      A ${escapeHtml((p.property_type || 'room').toLowerCase())} near ${escapeHtml(p.campus || 'campus')}, listed with
      ${p.bedrooms || 1} bedroom${(p.bedrooms || 1) > 1 ? 's' : ''}. ${verified ? 'This listing has been checked by the CampusNest team for accuracy before publishing.' : 'This listing is awaiting verification — details are provided by the agent.'}
    </p>

    <div class="divider"></div>
    <h3 style="font-family:var(--font-body); font-size:15.5px; font-weight:700;">Amenities</h3>
    <div class="amenity-grid mt-6">
      ${amenities.map(a => `<div class="amenity-item"><span class="amenity-dot"></span>${escapeHtml(a)}</div>`).join('')}
    </div>
  `;
}

function renderContact(p) {
  const favorited = CampusNestAPI.isFavoritedLocal(p.id);
  document.getElementById('contact-card').innerHTML = `
    <div class="agent-row">
      <div class="agent-avatar">${escapeHtml((p.owner_name || 'A').charAt(0).toUpperCase())}</div>
      <div>
        <div style="font-weight:700; font-size:14.5px;">${escapeHtml(p.owner_name || 'Verified agent')}</div>
        <div style="font-size:12.5px; color:var(--muted);">Listing agent</div>
      </div>
    </div>
    <div class="divider"></div>
    <form id="contact-form">
      <div class="form-group" style="margin-top:0;">
        <label for="msg">Message the agent</label>
        <textarea id="msg" rows="4" placeholder="Hi, is this place still available? I'd like to schedule a viewing."></textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:14px;">Send message</button>
    </form>
    <button class="btn btn-ghost btn-block" id="detail-fav" style="margin-top:10px;">
      ${favorited ? '♥ Saved to favorites' : '♡ Save to favorites'}
    </button>
    <p class="form-hint text-center" style="margin-top:12px;">Replies typically arrive within a day. Never send money before viewing in person.</p>
  `;

  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Message sent to the agent', 'success');
    document.getElementById('msg').value = '';
  });

  document.getElementById('detail-fav').addEventListener('click', async (e) => {
    await CampusNestAPI.toggleFavorite(p.id);
    const nowFav = CampusNestAPI.isFavoritedLocal(p.id);
    e.target.textContent = nowFav ? '♥ Saved to favorites' : '♡ Save to favorites';
    showToast(nowFav ? 'Saved to favorites' : 'Removed from favorites', 'success');
  });
}
