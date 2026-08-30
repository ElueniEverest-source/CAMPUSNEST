document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn() || Auth.getRole() !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  const token = Auth.getToken();
  const headers = { 'Authorization': `Bearer ${token}` };

  document.getElementById('tab-approvals').addEventListener('click', (e) => {
    e.preventDefault();
    showTab('approvals');
  });
  document.getElementById('tab-users').addEventListener('click', (e) => {
    e.preventDefault();
    showTab('users');
  });

  function showTab(tab) {
    document.getElementById('tab-approvals').classList.toggle('active', tab === 'approvals');
    document.getElementById('tab-users').classList.toggle('active', tab === 'users');
    document.getElementById('panel-approvals').style.display = tab === 'approvals' ? 'block' : 'none';
    document.getElementById('panel-users').style.display = tab === 'users' ? 'block' : 'none';
    document.getElementById('page-title').textContent = tab === 'approvals' ? 'Listing approvals' : 'Registered users';
  }

  async function loadStats() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers });
      if (!res.ok) throw new Error('stats failed');
      const s = await res.json();
      document.getElementById('stat-pending').textContent = s.pendingProperties ?? 0;
      document.getElementById('stat-approved').textContent = s.approvedProperties ?? 0;
      document.getElementById('stat-rejected').textContent = s.rejectedProperties ?? 0;
      document.getElementById('stat-agents').textContent = (s.landlords ?? 0) + (s.agents ?? 0);
    } catch (err) {
      console.warn('Could not load admin stats', err);
    }
  }

  async function loadPending() {
    const tbody = document.getElementById('pending-tbody');
    try {
      const res = await fetch(`${API_BASE}/api/admin/properties/pending`, { headers });
      if (!res.ok) throw new Error('pending failed');
      const list = await res.json();

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:30px;">Nothing waiting on review right now.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      list.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.id = p.id;
        const img = (p.images && p.images[0] && p.images[0].public_url) || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&q=80';
        const submitted = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';
        tr.innerHTML = `
          <td><div style="display:flex; align-items:center; gap:10px;"><img class="table-thumb" src="${img}" alt=""><span class="row-title">${escapeHtml(p.title || '')}</span></div></td>
          <td>${escapeHtml(p.owner_name || 'Agent')}</td>
          <td>${escapeHtml(p.university || '')}</td>
          <td style="font-family:var(--font-mono);">${formatNaira(p.price)}</td>
          <td>${submitted}</td>
          <td><div class="table-actions">
            <button class="icon-btn" data-approve="${escapeHtml(p.id)}" title="Approve" style="color:var(--emerald-deep); border-color:var(--emerald-tint);">✓</button>
            <button class="icon-btn" data-reject="${escapeHtml(p.id)}" title="Reject" style="color:var(--danger); border-color:var(--danger-tint);">✕</button>
          </div></td>`;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:30px;">Could not load pending listings.</td></tr>`;
    }
  }

  async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers });
      if (!res.ok) throw new Error('users failed');
      const list = await res.json();

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted); padding:30px;">No users found.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(u => `
        <tr>
          <td class="row-title">${escapeHtml(u.name || '')}</td>
          <td>${escapeHtml(u.email || '')}</td>
          <td style="text-transform:capitalize;">${escapeHtml(u.role || '')}</td>
          <td>${escapeHtml(u.university || '')}</td>
          <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
        </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:30px;">Could not load users.</td></tr>`;
    }
  }

  document.getElementById('pending-tbody').addEventListener('click', async (e) => {
    const approveId = e.target.getAttribute('data-approve');
    const rejectId = e.target.getAttribute('data-reject');
    const id = approveId || rejectId;
    if (!id) return;
    const status = approveId ? 'approved' : 'rejected';

    try {
      const res = await fetch(`${API_BASE}/api/admin/properties/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: status }),
      });
      if (!res.ok) throw new Error('moderation failed');

      const row = e.target.closest('tr');
      row.style.transition = 'opacity .25s';
      row.style.opacity = '0';
      setTimeout(() => { row.remove(); loadStats(); }, 250);
      showToast(approveId ? 'Listing approved and now live' : 'Listing rejected', approveId ? 'success' : 'error');
    } catch (err) {
      showToast('Could not update this listing', 'error');
    }
  });

  loadStats();
  loadPending();
  loadUsers();
});
