const Store = {
  set: (k,v) => sessionStorage.setItem('ll_'+k, JSON.stringify(v)),
  get: (k) => { try { return JSON.parse(sessionStorage.getItem('ll_'+k)); } catch { return null; } },
  clear: (k) => sessionStorage.removeItem('ll_'+k)
};

function showToast(msg, type='info', ms=3500) {
  let box = document.getElementById('toast');
  if (!box) { box = document.createElement('div'); box.id='toast'; document.body.appendChild(box); }
  const icons = { success:'✓', error:'✕', info:'ℹ' };
  const el = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ'}</span> ${msg}`;
  box.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function showLoader(msg='Processing...', sub='') {
  let ov = document.getElementById('loaderOv');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'loaderOv';
    ov.className = 'loader-overlay';
    ov.innerHTML = `<div class="spinner"></div><div class="loader-text" id="loaderMsg"></div><div class="loader-sub" id="loaderSub"></div>`;
    document.body.appendChild(ov);
  }
  document.getElementById('loaderMsg').textContent = msg;
  document.getElementById('loaderSub').textContent = sub;
  ov.classList.remove('hidden');
}

function hideLoader() {
  const ov = document.getElementById('loaderOv');
  if (ov) ov.classList.add('hidden');
}

async function apiPost(path, data) {
  const r = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Request failed');
  return j;
}

async function apiUpload(path, formData) {
  const r = await fetch(path, { method:'POST', body:formData });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Upload failed');
  return j;
}

function formatSize(b) {
  if (b < 1024) return b+' B';
  if (b < 1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(1)+' MB';
}

// Highlight active nav
document.addEventListener('DOMContentLoaded', () => {
  const p = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === p) a.classList.add('active');
  });
});
