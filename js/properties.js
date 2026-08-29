document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('results-grid');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const state = {
    q: params.get('q') || '',
    campus: params.get('campus') || '',
    property_type: params.get('property_type') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    verifiedOnly: false,
    sort: 'relevance',
  };

  document.getElementById('f-q').value = state.q;
  if (state.campus) setActiveChip('#f-campus', state.campus);
  if (state.property_type) setActiveChip('#f-type', state.property_type);
  document.getElementById('f-min').value = state.minPrice;
  document.getElementById('f-max').value = state.maxPrice;

  wireChipGroup('#f-campus');
  wireChipGroup('#f-type');

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    readFormIntoState();
    load();
  });

  document.getElementById('f-reset').addEventListener('click', () => {
    document.getElementById('filter-form').reset();
    setActiveChip('#f-campus', '');
    setActiveChip('#f-type', '');
    Object.assign(state, { q: '', campus: '', property_type: '', minPrice: '', maxPrice: '', verifiedOnly: false });
    load();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    load();
  });

  grid.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="reset-filters"]')) {
      document.getElementById('f-reset').click();
    }
  });

  function readFormIntoState() {
    state.q = document.getElementById('f-q').value.trim();
    state.campus = document.querySelector('#f-campus .chip.active').dataset.value;
    state.property_type = document.querySelector('#f-type .chip.active').dataset.value;
    state.minPrice = document.getElementById('f-min').value;
    state.maxPrice = document.getElementById('f-max').value;
    state.verifiedOnly = document.getElementById('f-verified').checked;
  }

  function setActiveChip(groupSel, value) {
    document.querySelectorAll(`${groupSel} .chip`).forEach(c => {
      c.classList.toggle('active', c.dataset.value === value);
    });
  }

  function wireChipGroup(groupSel) {
    document.querySelectorAll(`${groupSel} .chip`).forEach(c => {
      c.addEventListener('click', () => setActiveChip(groupSel, c.dataset.value));
    });
  }

  async function load() {
    grid.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
    const { data } = await CampusNestAPI.getProperties({
      q: state.q, campus: state.campus, property_type: state.property_type,
      minPrice: state.minPrice, maxPrice: state.maxPrice,
    });
    let list = state.verifiedOnly ? data.filter(p => p.verification_status === 'verified') : data;
    if (state.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    document.getElementById('result-count').textContent = list.length;
    renderPropertyGrid(grid, list);
  }

  load();
});
