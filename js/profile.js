document.addEventListener('DOMContentLoaded', async () => {
  await Auth.whenReady();
  // Redirect if not logged in
  if (!Auth.isLoggedIn()) {
    location.href = 'login.html';
    return;
  }

  const profileDisplay = document.querySelector('#profile-display');
  const profileForm = document.querySelector('#profile-form');
  const loadingMsg = document.querySelector('#loading-msg');
  const editBtn = document.querySelector('#edit-btn');
  const cancelBtn = document.querySelector('#cancel-btn');
  const errorDiv = document.querySelector('#error-msg');

  // Load profile
  async function loadProfile() {
    loadingMsg.style.display = 'block';
    profileDisplay.style.display = 'none';
    profileForm.style.display = 'none';
    errorDiv.style.display = 'none';

    try {
      const profile = await CampusNestAPI.getProfile();
      
      document.querySelector('#display-name').textContent = profile.name;
      document.querySelector('#display-email').textContent = profile.email;
      document.querySelector('#display-role').textContent = profile.role;
      
      if (profile.created_at) {
        const date = new Date(profile.created_at);
        document.querySelector('#display-created').textContent = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      // Populate form
      profileForm.querySelector('input[name="name"]').value = profile.name;
      profileForm.querySelector('input[name="email"]').value = profile.email;

      loadingMsg.style.display = 'none';
      profileDisplay.style.display = 'block';
    } catch (err) {
      console.error('Error loading profile:', err);
      errorDiv.textContent = 'Failed to load profile. Please refresh the page.';
      errorDiv.style.display = 'block';
      loadingMsg.style.display = 'none';
      profileDisplay.style.display = 'block';
    }
  }

  // Edit mode
  editBtn.onclick = () => {
    profileDisplay.style.display = 'none';
    profileForm.style.display = 'block';
    errorDiv.style.display = 'none';
  };

  // Cancel edit
  cancelBtn.onclick = () => {
    profileDisplay.style.display = 'block';
    profileForm.style.display = 'none';
    errorDiv.style.display = 'none';
  };

  // Save changes
  profileForm.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    errorDiv.style.display = 'none';

    try {
      const body = {
        name: profileForm.querySelector('input[name="name"]').value,
        email: profileForm.querySelector('input[name="email"]').value
      };

      await CampusNestAPI.updateProfile(body);
      App.showToast('Profile updated successfully', 'success');
      
      // Reload and return to display
      profileDisplay.style.display = 'block';
      profileForm.style.display = 'none';
      await loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      errorDiv.textContent = err.message || 'Failed to update profile. Try again.';
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  };

  // Initial load
  await loadProfile();
});
