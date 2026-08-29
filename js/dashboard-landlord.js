document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('listings-tbody');
  const addPanel = document.getElementById('add-form-panel');

  [document.getElementById('open-add-form'), document.getElementById('nav-add-listing')].forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); addPanel.style.display = 'block'; addPanel.scrollIntoView({ behavior: 'smooth' }); });
  });
  document.getElementById('close-add-form').addEventListener('click', () => addPanel.style.display = 'none');
  document.getElementById('cancel-add-form').addEventListener('click', () => addPanel.style.display = 'none');

  document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newListing = {
      id: 'local-' + Date.now(),
      title: document.getElementById('p-title').value,
      campus: document.getElementById('p-campus').value,
      property_type: document.getElementById('p-type').value,
      price: Number(document.getElementById('p-price').value),
      bedrooms: Number(document.getElementById('p-bedrooms').value),
      area: document.getElementById('p-area').value,
      amenities: document.getElementById('p-amenities').value.split(',').map(s => s.trim()).filter(Boolean),
      verification_status: 'pending',
      images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'],
    };
    prependRow(newListing);
    updateStats();
    showToast('Property submitted for review', 'success');
    e.target.reset();
    addPanel.style.display = 'none';
  });

  const { data: listings } = await CampusNestAPI.getMyListings();
  renderTable(listings);
  updateStats();

  function renderTable(list) {
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:30px;">You haven't listed any properties yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = '';
    list.forEach(p => addRow(p));
  }

  function addRow(p) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    const img = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&q=80';
    const statusClass = p.verification_status === 'verified' ? 'badge-verified' : p.verification_status === 'rejected' ? 'badge-verified badge-rejected' : 'badge-verified badge-pending';
    const statusLabel = p.verification_status === 'verified' ? '✓ Verified' : p.verification_status === 'rejected' ? 'Rejected' : 'Pending review';
    tr.innerHTML = `
      <td><div style="display:flex; align-items:center; gap:10px;"><img class="table-thumb" src="${img}" alt=""><span class="row-title">${escapeHtml(p.title)}</span></div></td>
      <td>${escapeHtml(p.property_type || '')}</td>
      <td style="font-family:var(--font-mono);">${formatNaira(p.price)}</td>
      <td><span class="${statusClass}">${statusLabel}</span></td>
      <td>${Math.floor(Math.random() * 90) + 10}</td>
      <td><div class="table-actions">
        <a class="icon-btn" href="property.html?id=${encodeURIComponent(p.id)}" title="View">👁</a>
        <button class="icon-btn" data-remove="${escapeHtml(p.id)}" title="Remove">✕</button>
      </div></td>`;
    tbody.prepend(tr);
    tr.querySelector('[data-remove]').addEventListener('click', () => {
      tr.remove();
      updateStats();
      showToast('Listing removed', 'default');
    });
  }

  function prependRow(p) { addRow(p); }

  function updateStats() {
    const rows = tbody.querySelectorAll('tr[data-id]');
    document.getElementById('stat-total').textContent = rows.length;
    document.getElementById('stat-verified').textContent = [...rows].filter(r => r.querySelector('.badge-verified:not(.badge-pending):not(.badge-rejected)')).length;
    document.getElementById('stat-pending').textContent = [...rows].filter(r => r.querySelector('.badge-pending')).length;
  }
});
