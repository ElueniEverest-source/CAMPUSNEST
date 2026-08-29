document.addEventListener('DOMContentLoaded',()=>{const form=document.querySelector('#auth-form');if(!form)return;
let role='student';
document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('active',x===b));});
form.onsubmit=async e=>{
  e.preventDefault();
  const submitBtn=form.querySelector('button[type=submit]');
  const originalText=submitBtn.textContent;
  submitBtn.disabled=true;
  submitBtn.textContent='Loading...';
  
  try{
    const body=Object.fromEntries(new FormData(form));
    body.role=role;
    const data=form.dataset.mode==='register'?await Auth.register(body):await Auth.login(body);
    if(!data.session||!data.profile){throw new Error('Your account profile is unavailable');}
    App.showToast('Welcome!','success');
    location.href=Auth.dashboard(data.profile.role);
  }catch(err){
    console.error('Auth error:',err);
    const errorMsg=err.message||'Unable to complete that request. Check your details.';
    App.showToast(errorMsg,'error');
    submitBtn.disabled=false;
    submitBtn.textContent=originalText;
  }
};});