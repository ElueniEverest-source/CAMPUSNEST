document.addEventListener('DOMContentLoaded', () => {
  const requestForm = document.querySelector('#request-form');
  const resetForm = document.querySelector('#reset-form');
  const successMsg = document.querySelector('#success-msg');
  const backBtn = document.querySelector('#back-btn');
  const requestError = document.querySelector('#request-error');
  const resetError = document.querySelector('#reset-error');

  // Request form submission
  requestForm.onsubmit = async (e) => {
    e.preventDefault();
    requestError.style.display = 'none';
    const submitBtn = requestForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const email = requestForm.querySelector('input[name="email"]').value;
      await Auth.requestPasswordReset(email);
      App.showToast('Reset email sent. Check your inbox.', 'success');

      // Switch to reset form
      requestForm.style.display = 'none';
      resetForm.style.display = 'block';
    } catch (err) {
      console.error('Error requesting password reset:', err);
      requestError.textContent = err.message || 'Failed to send reset email. Check your email address.';
      requestError.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  };

  // Reset password form submission
  resetForm.onsubmit = async (e) => {
    e.preventDefault();
    resetError.style.display = 'none';

    const password = resetForm.querySelector('input[name="password"]').value;
    const passwordConfirm = resetForm.querySelector('input[name="password-confirm"]').value;

    if (password !== passwordConfirm) {
      resetError.textContent = 'Passwords do not match';
      resetError.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      resetError.textContent = 'Password must be at least 6 characters';
      resetError.style.display = 'block';
      return;
    }

    const submitBtn = resetForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';

    try {
      await Auth.updatePassword(password);

      // Show success message
      resetForm.style.display = 'none';
      successMsg.style.display = 'block';
    } catch (err) {
      console.error('Error resetting password:', err);
      resetError.textContent = err.message || 'Failed to reset password. Check your token and try again.';
      resetError.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  };

  // Back button - return to request form
  backBtn.onclick = () => {
    resetForm.style.display = 'none';
    requestForm.style.display = 'block';
    resetError.style.display = 'none';
    requestForm.reset();
  };
});
