document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('pending-tbody');
  const { data: pending } = await CampusNestAPI.getPendingListings();

  document.getElementById('stat-pending').textContent = pending.length;

  if (!pending.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:30px;">Nothing waiting on review right now.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  pending.forEach(p => {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    const img = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&q=80';
    tr.innerHTML = `
      <td><div style="display:flex; align-items:center; gap:10px;"><img class="table-thumb" src="${img}" alt=""><span class="row-title">${escapeHtml(p.title)}</span></div></td>
      <td>${escapeHtml(p.owner_name || 'Agent')}</td>
      <td>${escapeHtml(p.campus || '')}</td>
      <td style="font-family:var(--font-mono);">${formatNaira(p.price)}</td>
      <td>Today</td>
      <td><div class="table-actions">
        <button class="icon-btn" data-approve="${escapeHtml(p.id)}" title="Approve" style="color:var(--emerald-deep); border-color:var(--emerald-tint);">✓</button>
        <button class="icon-btn" data-reject="${escapeHtml(p.id)}" title="Reject" style="color:var(--danger); border-color:var(--danger-tint);">✕</button>
      </div></td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async (e) => {
    const approveId = e.target.getAttribute('data-approve');
    const rejectId = e.target.getAttribute('data-reject');
    const id = approveId || rejectId;
    if (!id) return;
    const status = approveId ? 'verified' : 'rejected';
    await CampusNestAPI.moderateProperty(id, status);
    const row = e.target.closest('tr');
    row.style.opacity = '0';
    row.style.transition = 'opacity .25s';
    setTimeout(() => {
      row.remove();
      const remaining = tbody.querySelectorAll('tr').length;
      document.getElementById('stat-pending').textContent = remaining;
      if (!remaining) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:30px;">Nothing waiting on review right now.</td></tr>`;
    }, 250);
    showToast(approveId ? 'Listing approved and now live' : 'Listing rejected', approveId ? 'success' : 'error');
  });
});
