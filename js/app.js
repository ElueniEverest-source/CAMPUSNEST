const App = (() => { 
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); 
  const toast=(msg,type='')=>{const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),2800);}; 
  const money=n=>`₦${Number(n||0).toLocaleString('en-NG')}`; 
  
  function nav(){
    const area=document.querySelector('[data-auth-nav]');
    if(!area)return;
    if(Auth.isLoggedIn()){
      const role=Auth.getRole();
        area.innerHTML=`<a href="${Auth.dashboard(role)}">Dashboard</a><a href="profile.html">Profile</a><a href="#" data-logout>Log out</a>`;
      area.querySelector('[data-logout]').onclick=e=>{e.preventDefault();Auth.logout();};
    }else area.innerHTML='<a href="login.html">Log in</a><a class="nav-cta" href="register.html">List a home</a>';
  }
  
  function protectPage(requiredRole) {
    if (!Auth.isLoggedIn()) {
      location.href = 'login.html';
      return false;
    }
    if (requiredRole && !Auth.hasRole(requiredRole)) {
      App.showToast('You do not have permission to access this page', 'error');
      const userRole = Auth.getRole();
      location.href = Auth.dashboard(userRole);
      return false;
    }
    return true;
  }
  
  document.addEventListener('DOMContentLoaded',()=>Auth.whenReady().then(nav));
  document.addEventListener('campusnest-auth-change', nav);
  return {escapeHtml:esc,showToast:toast,formatNaira:money,protectPage:protectPage};
})();