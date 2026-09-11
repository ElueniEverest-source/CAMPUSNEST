document.addEventListener('DOMContentLoaded', async () => {
  try {
  const displayEl = document.getElementById('profile-display');
  const formEl = document.getElementById('profile-form');
  const loadingEl = document.getElementById('loading-msg');
  const errorEl = document.getElementById('error-msg');
  const editBtn = document.getElementById('edit-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  let currentProfile = null;

  function showLoading() {
    loadingEl.style.display = 'block';
    displayEl.style.display = 'none';
    formEl.style.display = 'none';
    errorEl.style.display = 'none';
  }

  function showDisplay() {
    loadingEl.style.display = 'none';
    displayEl.style.display = 'block';
    formEl.style.display = 'none';
    errorEl.style.display = 'none';
  }

  function showForm() {
    loadingEl.style.display = 'none';
    displayEl.style.display = 'none';
    formEl.style.display = 'block';
    errorEl.style.display = 'none';
  }

  function showError(msg) {
    loadingEl.style.display = 'none';
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function renderDisplay(profile) {
    document.getElementById('display-name').textContent = profile.name || '—';
    document.getElementById('display-email').textContent = profile.email || '—';
    document.getElementById('display-role').textContent = profile.role || '—';
    document.getElementById('display-created').textContent = profile.created_at
      ? new Date(profile.created_at).toLocaleDateString()
      : '—';
  }

  function fillForm(profile) {
    formEl.querySelector('[name="name"]').value = profile.name || '';
    formEl.querySelector('[name="email"]').value = profile.email || '';
    if (formEl.querySelector('[name="phone"]')) {
      formEl.querySelector('[name="phone"]').value = profile.phone || '';
    }
    if (formEl.querySelector('[name="university"]')) {
      formEl.querySelector('[name="university"]').value = profile.university || '';
    }
  }

  async function loadProfile() {
    showLoading();
    try {
      const result = await CampusNestAPI.getMe();
      if (!result || !result.data) {
        showError('Could not load your profile. Please try again.');
        return;
      }
      currentProfile = result.data;
      renderDisplay(currentProfile);
      fillForm(currentProfile);
      showDisplay();
    } catch (err) {
      showError('Something went wrong loading your profile: ' + err.message);
      console.error(err);
    }
  }

  editBtn.addEventListener('click', () => {
    showForm();
  });

  cancelBtn.addEventListener('click', () => {
    fillForm(currentProfile);
    showDisplay();
  });

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: formEl.querySelector('[name="name"]').value.trim(),
      email: formEl.querySelector('[name="email"]').value.trim(),
    };
    if (formEl.querySelector('[name="phone"]')) {
      payload.phone = formEl.querySelector('[name="phone"]').value.trim();
    }
    if (formEl.querySelector('[name="university"]')) {
      payload.university = formEl.querySelector('[name="university"]').value;
    }

    try {
      const result = await CampusNestAPI.updateProfile(payload);
      if (!result) {
        showError('Could not save changes. Please try again.');
        return;
      }
      currentProfile = { ...currentProfile, ...payload };
      renderDisplay(currentProfile);
      showDisplay();
    } catch (err) {
      showError('Something went wrong saving your profile.');
    }
  });

  loadProfile();
  } catch (topErr) {
    document.body.insertAdjacentHTML('afterbegin', '<div style="background:red;color:white;padding:1rem;">SCRIPT ERROR: ' + topErr.message + '</div>');
    console.error(topErr);
  }
});
