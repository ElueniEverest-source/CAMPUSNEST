function propertyCardHTML(p) {
  const img = (p.images && p.images[0]) || (p.property_images && p.property_images[0] && p.property_images[0].url)
    || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80';
  const verified = p.verification_status === 'verified';
  const favorited = (typeof CampusNestAPI !== 'undefined') && CampusNestAPI.isFavoritedLocal(p.id);
  const beds = p.bedrooms ? `${p.bedrooms} bed${p.bedrooms > 1 ? 's' : ''}` : '';

  return `
  <article class="property-card" data-id="${escapeHtml(p.id)}">
    <div class="property-media">
      <img src="${img}" alt="${escapeHtml(p.title)}" loading="lazy">
      ${verified ? `<span class="badge-verified">✓ Verified</span>` : `<span class="badge-verified badge-pending">Pending review</span>`}
      <button class="fav-btn ${favorited ? 'active' : ''}" data-fav-toggle="${escapeHtml(p.id)}" aria-label="Save to favorites">${favorited ? '♥' : '♡'}</button>
      <span class="property-price-tag">${formatNaira(p.price)}<span style="opacity:.65;font-weight:400"> /yr</span></span>
    </div>
    <div class="property-body">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="property-loc">📍 ${escapeHtml(p.area || p.campus || '')}</div>
      <div class="property-meta">
        ${beds ? `<span>🛏️ ${beds}</span>` : ''}
        <span>🏷️ ${escapeHtml(p.property_type || '')}</span>
      </div>
      <div class="property-foot">
        <a class="btn btn-ghost btn-block btn-sm" href="property.html?id=${encodeURIComponent(p.id)}">View details</a>
      </div>
    </div>
  </article>`;
}

function renderPropertyGrid(container, list) {
  if (!list || !list.length) {
    container.innerHTML = emptyStateHTML();
    return;
  }
  container.innerHTML = list.map(propertyCardHTML).join('');
  wireFavoriteButtons(container);
}

function emptyStateHTML(opts = {}) {
  const title = opts.title || 'No homes match those filters';
  const body = opts.body || 'Try a different campus, price range or room type — new verified listings are added every week.';
  const showReset = opts.showReset !== false;
  return `
  <div class="empty-state" style="grid-column: 1/-1;">
    <div class="stamp"><span class="stamp-text"><span class="stamp-check">🏠</span>Nothing<br>here yet</span></div>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(body)}</p>
    ${showReset ? `<button class="btn btn-ghost" data-action="reset-filters">Clear filters</button>` : ''}
  </div>`;
}

function wireFavoriteButtons(scope) {
  scope.querySelectorAll('[data-fav-toggle]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-fav-toggle');
      const wasActive = btn.classList.contains('active');
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
      const result = await CampusNestAPI.toggleFavorite(id);
      showToast(wasActive ? 'Removed from favorites' : 'Saved to favorites', 'success');
    });
  });
}
