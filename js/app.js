
function initThemeToggle() {
  const stored = localStorage.getItem('cn_theme');
  if (stored === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  const nav = document.querySelector('.nav-actions');
  if (!nav) return;

  let btn = document.querySelector('.theme-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    nav.insertBefore(btn, nav.firstChild);
  }

  function updateIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '\u2600' : '\u263D';
  }
  updateIcon();

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('cn_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('cn_theme', 'dark');
    }
    updateIcon();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initThemeToggle();
  initFooterYear();
  initScrollReveal();
  initNavAuthState();
  initDashSidebarToggle();
});

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

function initDashSidebarToggle() {
  const toggle = document.querySelector('.dash-mobile-toggle');
  const sidebar = document.querySelector('.dash-sidebar');
  if (!toggle || !sidebar) return;

  let overlay = document.querySelector('.dash-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'dash-overlay';
    document.body.appendChild(overlay);
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  toggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
  });

  overlay.addEventListener('click', closeSidebar);
}

function initFooterYear() {
  document.querySelectorAll('.js-year').forEach(el => el.textContent = new Date().getFullYear());
}

function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('in')); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(i => obs.observe(i));
}

function initNavAuthState() {
  const guestEls = document.querySelectorAll('[data-auth="guest"]');
  const userEls = document.querySelectorAll('[data-auth="user"]');
  const loggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();
  guestEls.forEach(el => el.style.display = loggedIn ? 'none' : '');
  userEls.forEach(el => el.style.display = loggedIn ? '' : 'none');
  if (loggedIn) {
    const nameEls = document.querySelectorAll('[data-user-name]');
    const user = Auth.getUser();
    nameEls.forEach(el => el.textContent = (user && user.full_name) ? user.full_name.split(' ')[0] : 'Account');
  }
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
  });
}

function showToast(message, type = 'default') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

function formatNaira(amount) {
  const n = Number(amount) || 0;
  return '₦' + n.toLocaleString('en-NG');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ---------- PWA setup: inject manifest + register service worker ---------- */
(function initPWA() {
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.head.appendChild(manifestLink);

  const themeColor = document.createElement('meta');
  themeColor.name = 'theme-color';
  themeColor.content = '#1E3A8A';
  document.head.appendChild(themeColor);

  const appleIcon = document.createElement('link');
  appleIcon.rel = 'apple-touch-icon';
  appleIcon.href = '/assets/logo-icon.png';
  document.head.appendChild(appleIcon);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  }
})();
