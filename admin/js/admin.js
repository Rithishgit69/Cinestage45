/* ============================================================
   CINESTAGE – Admin Panel JavaScript
   Full CRUD management of all platform data via RESTful Table API
   ============================================================ */

const ADMIN_API = 'tables';
const ADMIN_CREDS = { username: 'admin', password: 'cinestage@admin123' };
const SESSION_KEY = 'cinestage_admin_session_v1';

/* ══ STATE ══════════════════════════════════════════ */
let adminUser = null;
let currentSection = 'dashboard';
let allData = { users: [], castings: [], applications: [], messages: [], theaters: [], memberships: [], notifications: [] };
let pageState = { users: 1, castings: 1, applications: 1, messages: 1, theaters: 1, memberships: 1, notifications: 1 };
const PAGE_SIZE = 15;
let deleteCallback = null;
let toastTimer = null;

/* ══ API HELPERS ════════════════════════════════════ */
async function apiGet(table, params = {}) {
  const q = new URLSearchParams({ limit: 1000, ...params }).toString();
  const res = await fetch(`../${ADMIN_API}/${table}?${q}`);
  if (!res.ok) throw new Error(`GET ${table} failed`);
  return res.json();
}
async function apiPost(table, data) {
  const res = await fetch(`../${ADMIN_API}/${table}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST ${table} failed`);
  return res.json();
}
async function apiPatch(table, id, data) {
  const res = await fetch(`../${ADMIN_API}/${table}/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed`);
  return res.json();
}
async function apiDelete(table, id) {
  const res = await fetch(`../${ADMIN_API}/${table}/${id}`, { method: 'DELETE' });
  return res.ok;
}

/* ══ TOAST ══════════════════════════════════════════ */
function showToast(msg, type = '') {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.className = `admin-toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ══ MODAL UTILS ════════════════════════════════════ */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('.modal-close-btn, .btn-cancel').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.dataset.modal || btn.closest('.modal-overlay')?.id;
    if (modal) closeModal(modal);
  });
});
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
});

/* ══ FORMAT HELPERS ══════════════════════════════════ */
function fDate(ts) {
  if (!ts) return '—';
  const d = new Date(typeof ts === 'string' ? ts : +ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fTime(ts) {
  if (!ts) return '—';
  const d = new Date(typeof ts === 'string' ? ts : +ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function avatarUrl(name, bg='D4AF37', c='000') { return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=${bg}&color=${c}&bold=true&size=80`; }
function truncate(s, n = 40) { return s && s.length > n ? s.slice(0, n) + '…' : (s || '—'); }

/* ══ LOGIN ══════════════════════════════════════════ */
document.getElementById('toggle-admin-pw')?.addEventListener('click', () => {
  const inp = document.getElementById('admin-pass');
  const ico = document.querySelector('#toggle-admin-pw i');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  ico.className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
});

document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (user !== ADMIN_CREDS.username || pass !== ADMIN_CREDS.password) {
    errEl.textContent = '✗ Invalid credentials. Please try again.';
    return;
  }

  const btn = e.target.querySelector('.btn-login');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  btn.disabled = true;

  adminUser = { username: user };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user, loginTime: Date.now() }));
  document.getElementById('admin-display-name').textContent = user;
  document.getElementById('topbar-admin-name').textContent = user;

  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';
  await loadAllData();
  renderSection('dashboard');
  startAutoRefresh();
});

/* ══ SESSION RESTORE ════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  loadAdminTheme();
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      const { username, loginTime } = JSON.parse(saved);
      // Session valid for 8 hours
      if (Date.now() - loginTime < 8 * 3600 * 1000) {
        adminUser = { username };
        document.getElementById('admin-display-name').textContent = username;
        document.getElementById('topbar-admin-name').textContent = username;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-app').style.display = 'flex';
        await loadAllData();
        renderSection('dashboard');
        startAutoRefresh();
        return;
      }
    } catch(e) {}
    localStorage.removeItem(SESSION_KEY);
  }
});

document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  clearInterval(autoRefreshTimer);
  adminUser = null;
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-user').value = '';
  document.getElementById('admin-pass').value = '';
  showToast('Logged out');
});

/* ══ THEME ══════════════════════════════════════════ */
function loadAdminTheme() {
  const t = localStorage.getItem('cs_admin_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const ico = document.querySelector('#admin-theme-btn i');
  if (ico) ico.className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}
document.getElementById('admin-theme-btn')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cs_admin_theme', next);
  const ico = document.querySelector('#admin-theme-btn i');
  if (ico) ico.className = next === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
});

/* ══ MOBILE SIDEBAR ═════════════════════════════════ */
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('open');
});
document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
});

/* ══ NAVIGATION ══════════════════════════════════════ */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const sec = item.dataset.section;
    if (!sec) return;
    switchSection(sec);
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
  });
});

function switchSection(sec) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === sec));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.toggle('active', s.id === `section-${sec}`));
  const titles = { dashboard:'Dashboard', users:'Users', castings:'Casting Calls', applications:'Applications', messages:'Messages', theaters:'Theaters & Studios', memberships:'Membership Orders', notifications:'Notifications', analytics:'Analytics' };
  document.getElementById('section-title').textContent = titles[sec] || sec;
  currentSection = sec;
  renderSection(sec);
}

function renderSection(sec) {
  const renders = {
    dashboard: renderDashboard,
    users: renderUsers,
    castings: renderCastings,
    applications: renderApplications,
    messages: renderMessages,
    theaters: renderTheaters,
    memberships: renderMemberships,
    notifications: renderNotifications,
    analytics: renderAnalytics
  };
  renders[sec]?.();
}

/* ══ LOAD ALL DATA ══════════════════════════════════ */
async function loadAllData() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) { refreshBtn.classList.add('spinning'); }
  try {
    const [usersRes, castingsRes, appsRes, msgsRes, theatersRes, membershipsRes, notifsRes] = await Promise.all([
      apiGet('users'),
      apiGet('casting_calls'),
      apiGet('applications'),
      apiGet('messages'),
      apiGet('theaters'),
      apiGet('membership_orders'),
      apiGet('notifications')
    ]);
    allData.users         = usersRes.data || [];
    allData.castings      = castingsRes.data || [];
    allData.applications  = appsRes.data || [];
    allData.messages      = msgsRes.data || [];
    allData.theaters      = theatersRes.data || [];
    allData.memberships   = membershipsRes.data || [];
    allData.notifications = notifsRes.data || [];

    updateNavBadges();
    document.getElementById('last-refresh').textContent = `Last refresh: ${new Date().toLocaleTimeString('en-IN')}`;
  } catch(e) {
    showToast('Failed to load data. Check connection.', 'error');
  } finally {
    if (refreshBtn) { refreshBtn.classList.remove('spinning'); }
  }
}

function updateNavBadges() {
  document.getElementById('nb-users').textContent = allData.users.length;
  document.getElementById('nb-castings').textContent = allData.castings.filter(c=>c.isActive).length;
  document.getElementById('nb-apps').textContent = allData.applications.filter(a=>a.status==='applied').length;
}

document.getElementById('refresh-btn')?.addEventListener('click', async () => {
  await loadAllData();
  renderSection(currentSection);
  showToast('Data refreshed ✓', 'success');
});

/* ══ AUTO REFRESH (60s) ══════════════════════════════ */
let autoRefreshTimer;
function startAutoRefresh() {
  clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(async () => {
    await loadAllData();
    renderSection(currentSection);
  }, 60000);
}

/* ══ DASHBOARD ══════════════════════════════════════ */
function renderDashboard() {
  const u = allData.users, c = allData.castings, a = allData.applications, m = allData.memberships;
  const artists = u.filter(x => x.role === 'artist').length;
  const recruiters = u.filter(x => x.role === 'recruiter').length;
  const premium = u.filter(x => x.membershipPlan && x.membershipPlan !== 'free').length;
  const totalRevenue = m.reduce((sum, o) => sum + (+o.amount||0), 0);
  const activeCastings = c.filter(x => x.isActive).length;

  document.getElementById('kpi-grid').innerHTML = [
    { icon:'users', label:'Total Users', num: u.length, sub:`${artists} Artists · ${recruiters} Recruiters`, section:'users' },
    { icon:'castings', label:'Casting Calls', num: c.length, sub:`${activeCastings} Active`, section:'castings' },
    { icon:'apps', label:'Applications', num: a.length, sub:`${a.filter(x=>x.status==='shortlisted').length} Shortlisted`, section:'applications' },
    { icon:'premium', label:'Premium Members', num: premium, sub:`${u.length>0?Math.round((premium/u.length)*100):0}% of users`, section:'memberships' },
    { icon:'revenue', label:'Total Revenue', num:`₹${totalRevenue.toLocaleString('en-IN')}`, sub:`${m.length} orders`, section:'memberships', noClick:true },
    { icon:'theaters', label:'Theaters Listed', num: allData.theaters.length, sub:`User-submitted`, section:'theaters' },
    { icon:'messages', label:'Messages Sent', num: allData.messages.length, sub:`Total messages`, section:'messages' },
    { icon:'artists', label:'Notifications', num: allData.notifications.filter(n=>!n.isRead).length, sub:`Unread`, section:'notifications' },
  ].map(k => `
    <div class="kpi-card${k.icon==='castings'||k.icon==='revenue'||k.icon==='premium'?' gold':''}" ${!k.noClick?`onclick="switchSection('${k.section}')" title="View ${k.label}"`:'style="cursor:default"'}>
      <div class="kpi-icon ${k.icon}"><i class="fas ${iconMap(k.icon)}"></i></div>
      <div class="kpi-num">${k.num}</div>
      <div class="kpi-lbl">${k.label}</div>
      ${k.sub ? `<div class="kpi-trend"><i class="fas fa-info-circle"></i> ${k.sub}</div>` : ''}
    </div>
  `).join('');

  // Recent Users
  const recentUsers = [...u].sort((a,b)=>(b.created_at||0)-(a.created_at||0)).slice(0,6);
  document.getElementById('recent-users-table').innerHTML = recentUsers.length ? `
    <table class="mini-table">
      <thead><tr><th>Name</th><th>Role</th><th>Plan</th><th>Joined</th></tr></thead>
      <tbody>${recentUsers.map(user=>`
        <tr>
          <td><a onclick="viewUser('${user.id}')">${escHtml(user.fullName||'—')}</a></td>
          <td><span class="pill ${user.role}">${user.role||'—'}</span></td>
          <td><span class="pill ${user.membershipPlan==='free'||!user.membershipPlan?'free':'premium'}">${user.membershipPlan||'free'}</span></td>
          <td>${fDate(user.created_at)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><i class="fas fa-users"></i><p>No users yet</p></div>';

  // Recent Castings
  const recentCastings = [...c].sort((a,b)=>(b.created_at||0)-(a.created_at||0)).slice(0,6);
  document.getElementById('recent-castings-table').innerHTML = recentCastings.length ? `
    <table class="mini-table">
      <thead><tr><th>Title</th><th>Company</th><th>Status</th><th>Apps</th></tr></thead>
      <tbody>${recentCastings.map(cc=>`
        <tr>
          <td>${escHtml(truncate(cc.title,30))}</td>
          <td>${escHtml(cc.company||'—')}</td>
          <td><span class="pill ${cc.isActive?'active':'closed'}">${cc.isActive?'Active':'Closed'}</span></td>
          <td>${cc.applicantsCount||0}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><i class="fas fa-film"></i><p>No casting calls yet</p></div>';

  // Category chart
  const catCounts = {};
  u.filter(x=>x.role==='artist').forEach(x=>{ catCounts[x.category]=(catCounts[x.category]||0)+1; });
  const topCats = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCat = topCats[0]?.[1] || 1;
  document.getElementById('category-chart').innerHTML = topCats.length ? topCats.map(([cat,cnt])=>`
    <div class="bar-item">
      <div class="bar-label">${escHtml(getCatLabel(cat))}</div>
      <div class="bar-track"><div class="bar-fill gold" style="width:${Math.round((cnt/maxCat)*100)}%"></div></div>
      <div class="bar-count">${cnt}</div>
    </div>`).join('')
    : '<p style="color:var(--text3);font-size:13px;">No artist data yet</p>';

  // Revenue chart
  const revByPlan = {};
  m.forEach(o => { revByPlan[o.plan]=(revByPlan[o.plan]||0)+(+o.amount||0); });
  const revEntries = Object.entries(revByPlan).sort((a,b)=>b[1]-a[1]);
  const maxRev = revEntries[0]?.[1] || 1;
  const colors = ['gold','info','success','purple','warning','error'];
  document.getElementById('revenue-chart').innerHTML = revEntries.length ? revEntries.map(([plan,amt],i)=>`
    <div class="bar-item">
      <div class="bar-label">${plan}</div>
      <div class="bar-track"><div class="bar-fill ${colors[i%colors.length]}" style="width:${Math.round((amt/maxRev)*100)}%"></div></div>
      <div class="bar-count" style="font-size:11px;">₹${amt.toLocaleString('en-IN')}</div>
    </div>`).join('')
    : '<p style="color:var(--text3);font-size:13px;">No revenue yet</p>';
}

function iconMap(k) {
  const m = { users:'fa-users', castings:'fa-film', apps:'fa-paper-plane', revenue:'fa-rupee-sign', premium:'fa-crown', theaters:'fa-map-marker-alt', messages:'fa-comment-dots', artists:'fa-bell' };
  return m[k] || 'fa-circle';
}
function getCatLabel(id) {
  const cats = {actor:'Actor',actress:'Actress',choreographer:'Choreographer',dancer:'Dancer',musician:'Musician',singer:'Singer',director:'Director',asst_director:'Asst. Director',screenwriter:'Screenwriter',dialogue:'Dialogue Writer',content:'Content Writer',model:'Model',stunt:'Stunt Artist',voice:'Voice Artist',dop:'Cinematographer',editor:'Video Editor',producer:'Producer',casting:'Casting Director',makeup:'Makeup Artist',costume:'Costume Designer',art_director:'Art Director',background:'Background Artist',child_artist:'Child Artist',comedian:'Comedian',anchor:'Anchor'};
  return cats[id] || id || 'Unknown';
}

/* ══ USERS SECTION ══════════════════════════════════ */
function renderUsers() {
  const q = document.getElementById('user-search')?.value.trim().toLowerCase() || '';
  const roleF = document.getElementById('user-role-filter')?.value || '';
  const planF = document.getElementById('user-plan-filter')?.value || '';

  let filtered = allData.users;
  if (q) filtered = filtered.filter(u =>
    u.fullName?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.location?.toLowerCase().includes(q) ||
    u.phone?.includes(q)
  );
  if (roleF) filtered = filtered.filter(u => u.role === roleF);
  if (planF) filtered = filtered.filter(u => (u.membershipPlan||'free') === planF);

  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));
  const paged = paginate(filtered, pageState.users);
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(u => `
    <tr>
      <td><img src="${u.avatarUrl||avatarUrl(u.fullName)}" class="table-avatar" alt="" onerror="this.src='${avatarUrl(u.fullName)}'"/></td>
      <td>
        <div class="table-name">${escHtml(u.fullName||'—')}</div>
        <div class="table-sub">${escHtml(u.email||'')}</div>
      </td>
      <td>${escHtml(u.email||'—')}</td>
      <td><span class="pill ${u.role}">${u.role||'—'}</span></td>
      <td>${escHtml(getCatLabel(u.category))}</td>
      <td>${escHtml(u.location||'—')}</td>
      <td><span class="pill ${u.membershipPlan==='free'||!u.membershipPlan?'free':'premium'}">${u.membershipPlan||'free'}</span></td>
      <td>${fDate(u.created_at)}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn" onclick="viewUser('${u.id}')"><i class="fas fa-eye"></i> View</button>
          <button class="action-btn" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i> Edit</button>
          ${u.isVerified
            ? `<button class="action-btn danger" onclick="toggleVerify('${u.id}',false)"><i class="fas fa-times"></i> Unverify</button>`
            : `<button class="action-btn success-btn" onclick="toggleVerify('${u.id}',true)"><i class="fas fa-check"></i> Verify</button>`
          }
          <button class="action-btn danger" onclick="confirmDelete('users','${u.id}','Delete user ${escHtml(u.fullName||'?')}? This cannot be undone.')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="9"><div class="empty-state"><i class="fas fa-user-slash"></i><p>No users found</p></div></td></tr>`;

  renderPagination('users-pagination', paged, 'users');
}

document.getElementById('user-search')?.addEventListener('input', debounce(() => { pageState.users=1; renderUsers(); }, 300));
document.getElementById('user-role-filter')?.addEventListener('change', () => { pageState.users=1; renderUsers(); });
document.getElementById('user-plan-filter')?.addEventListener('change', () => { pageState.users=1; renderUsers(); });

async function viewUser(id) {
  const u = allData.users.find(x=>x.id===id);
  if (!u) return;
  document.getElementById('view-user-title').textContent = u.fullName || 'User Profile';
  document.getElementById('view-user-content').innerHTML = `
    <div class="user-detail-header">
      <img src="${u.avatarUrl||avatarUrl(u.fullName)}" class="user-detail-avatar" alt="" onerror="this.src='${avatarUrl(u.fullName)}'"/>
      <div>
        <h3 style="font-size:18px;font-weight:700;">${escHtml(u.fullName||'—')} ${u.isVerified?'<span class="pill verified">✓ Verified</span>':''}</h3>
        <p style="color:var(--text3);font-size:13px;">${escHtml(u.email||'')} · ${escHtml(u.phone||'')}</p>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
          <span class="pill ${u.role}">${u.role||'—'}</span>
          <span class="pill ${u.membershipPlan==='free'||!u.membershipPlan?'free':'premium'}">${u.membershipPlan||'free'}</span>
        </div>
      </div>
    </div>
    <div class="user-detail-grid">
      <div class="detail-field"><label>Category</label><span>${getCatLabel(u.category)}</span></div>
      <div class="detail-field"><label>Location</label><span>${escHtml(u.location||'—')}</span></div>
      <div class="detail-field"><label>Age</label><span>${u.age ? u.age+' yrs' : '—'}</span></div>
      <div class="detail-field"><label>Gender</label><span>${escHtml(u.gender||'—')}</span></div>
      <div class="detail-field"><label>Experience</label><span>${escHtml(u.experience||'—')}</span></div>
      <div class="detail-field"><label>Height / Weight</label><span>${escHtml((u.height||'—')+' / '+(u.weight||'—'))}</span></div>
      <div class="detail-field"><label>Hair Color</label><span>${escHtml(u.hairColor||'—')}</span></div>
      <div class="detail-field"><label>Eye Color</label><span>${escHtml(u.eyeColor||'—')}</span></div>
      <div class="detail-field"><label>Complexion</label><span>${escHtml(u.complexion||'—')}</span></div>
      <div class="detail-field"><label>Body Type</label><span>${escHtml(u.bodyType||'—')}</span></div>
      <div class="detail-field"><label>Company</label><span>${escHtml(u.company||'—')}</span></div>
      <div class="detail-field"><label>Designation</label><span>${escHtml(u.designation||'—')}</span></div>
      <div class="detail-field"><label>Profile Complete</label><span>${u.profileComplete?'✓ Yes':'✗ No'}</span></div>
      <div class="detail-field"><label>Joined</label><span>${fDate(u.created_at)}</span></div>
      <div class="detail-field"><label>Membership Expiry</label><span>${fDate(u.membershipExpiry)}</span></div>
      <div class="detail-field"><label>Followers / Following</label><span>${u.followersCount||0} / ${u.followingCount||0}</span></div>
    </div>
    ${u.bio ? `<div class="detail-field" style="margin-top:10px;"><label>Bio</label><span style="white-space:pre-wrap;font-size:13px;">${escHtml(u.bio)}</span></div>` : ''}
    ${Array.isArray(u.skills)&&u.skills.length ? `<div style="margin-top:10px;"><label style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Skills</label><div class="skills-wrap">${u.skills.map(s=>`<span class="skill-chip">${escHtml(s)}</span>`).join('')}</div></div>` : ''}
    ${Array.isArray(u.languages)&&u.languages.length ? `<div style="margin-top:10px;"><label style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Languages</label><div class="skills-wrap">${u.languages.map(l=>`<span class="lang-chip">${escHtml(l)}</span>`).join('')}</div></div>` : ''}
    ${Array.isArray(u.portfolioLinks)&&u.portfolioLinks.filter(Boolean).length ? `<div style="margin-top:10px;"><label style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Portfolio Links</label>${u.portfolioLinks.filter(Boolean).map(l=>`<div style="margin-top:6px;"><a href="${escHtml(l)}" target="_blank" style="color:var(--gold);font-size:13px;"><i class="fas fa-external-link-alt"></i> ${escHtml(l)}</a></div>`).join('')}</div>` : ''}
    <div style="display:flex;gap:10px;margin-top:1.2rem;flex-wrap:wrap;">
      <button class="btn-save" onclick="editUser('${u.id}');closeModal('view-user-modal');"><i class="fas fa-edit"></i> Edit</button>
      <button class="btn-delete" onclick="confirmDelete('users','${u.id}','Delete ${escHtml(u.fullName||'')}?');closeModal('view-user-modal');"><i class="fas fa-trash"></i> Delete</button>
    </div>
  `;
  openModal('view-user-modal');
}

function editUser(id) {
  const u = allData.users.find(x=>x.id===id);
  if (!u) return;
  document.getElementById('eu-id').value = u.id;
  document.getElementById('eu-name').value = u.fullName || '';
  document.getElementById('eu-email').value = u.email || '';
  document.getElementById('eu-phone').value = u.phone || '';
  document.getElementById('eu-location').value = u.location || '';
  document.getElementById('eu-role').value = u.role || 'artist';
  document.getElementById('eu-plan').value = u.membershipPlan || 'free';
  document.getElementById('eu-verified').value = String(!!u.isVerified);
  document.getElementById('eu-complete').value = String(!!u.profileComplete);
  document.getElementById('eu-bio').value = u.bio || '';
  openModal('edit-user-modal');
}

document.getElementById('edit-user-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('eu-id').value;
  const btn = e.target.querySelector('.btn-save');
  btn.textContent = 'Saving...'; btn.disabled = true;
  try {
    const updated = await apiPatch('users', id, {
      fullName: document.getElementById('eu-name').value.trim(),
      email: document.getElementById('eu-email').value.trim(),
      phone: document.getElementById('eu-phone').value.trim(),
      location: document.getElementById('eu-location').value.trim(),
      role: document.getElementById('eu-role').value,
      membershipPlan: document.getElementById('eu-plan').value,
      isVerified: document.getElementById('eu-verified').value === 'true',
      profileComplete: document.getElementById('eu-complete').value === 'true',
      bio: document.getElementById('eu-bio').value.trim()
    });
    const idx = allData.users.findIndex(u=>u.id===id);
    if (idx>=0) allData.users[idx] = { ...allData.users[idx], ...updated };
    closeModal('edit-user-modal');
    renderUsers();
    updateNavBadges();
    showToast('User updated successfully ✓', 'success');
  } catch(err) { showToast('Update failed', 'error'); }
  finally { btn.innerHTML='<i class="fas fa-save"></i> Save Changes'; btn.disabled=false; }
});

async function toggleVerify(id, verified) {
  try {
    await apiPatch('users', id, { isVerified: verified });
    const u = allData.users.find(x=>x.id===id);
    if (u) u.isVerified = verified;
    renderUsers();
    showToast(verified ? '✓ User verified' : 'Verification removed', 'success');
  } catch(e) { showToast('Failed', 'error'); }
}

document.getElementById('export-users-btn')?.addEventListener('click', () => {
  const rows = allData.users.map(u => `"${u.fullName||''}","${u.email||''}","${u.phone||''}","${u.role||''}","${getCatLabel(u.category)}","${u.location||''}","${u.membershipPlan||'free'}","${u.isVerified?'Yes':'No'}","${fDate(u.created_at)}"`);
  downloadCSV(['Name','Email','Phone','Role','Category','Location','Plan','Verified','Joined'], rows, 'cinestage_users');
});

/* ══ CASTINGS SECTION ═══════════════════════════════ */
function renderCastings() {
  const q = document.getElementById('casting-search')?.value.trim().toLowerCase() || '';
  const statusF = document.getElementById('casting-status-filter')?.value || '';

  let filtered = allData.castings;
  if (q) filtered = filtered.filter(c =>
    c.title?.toLowerCase().includes(q) ||
    c.company?.toLowerCase().includes(q) ||
    c.location?.toLowerCase().includes(q) ||
    c.recruiterName?.toLowerCase().includes(q)
  );
  if (statusF === 'active') filtered = filtered.filter(c => c.isActive);
  if (statusF === 'closed') filtered = filtered.filter(c => !c.isActive);
  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));

  const paged = paginate(filtered, pageState.castings);
  const tbody = document.getElementById('castings-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(c => `
    <tr>
      <td>
        <div class="table-name">${escHtml(truncate(c.title,35))}</div>
        <div class="table-sub">by ${escHtml(c.recruiterName||'—')}</div>
      </td>
      <td>${escHtml(c.company||'—')}</td>
      <td>${getCatLabel(c.category)}</td>
      <td>${escHtml(c.location||'—')}</td>
      <td>${fDate(c.deadline)}</td>
      <td><strong style="color:var(--gold)">${c.applicantsCount||0}</strong></td>
      <td><span class="pill ${c.isActive?'active':'closed'}">${c.isActive?'Active':'Closed'}</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn" onclick="editCasting('${c.id}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="action-btn ${c.isActive?'danger':'success-btn'}" onclick="toggleCastingStatus('${c.id}',${!c.isActive})">${c.isActive?'<i class="fas fa-times"></i> Close':'<i class="fas fa-check"></i> Activate'}</button>
          <button class="action-btn danger" onclick="confirmDelete('casting_calls','${c.id}','Delete casting: ${escHtml(c.title||'')}?')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-film"></i><p>No casting calls found</p></div></td></tr>`;

  renderPagination('castings-pagination', paged, 'castings');
}

document.getElementById('casting-search')?.addEventListener('input', debounce(() => { pageState.castings=1; renderCastings(); }, 300));
document.getElementById('casting-status-filter')?.addEventListener('change', () => { pageState.castings=1; renderCastings(); });

function editCasting(id) {
  const c = allData.castings.find(x=>x.id===id);
  if (!c) return;
  document.getElementById('ec-id').value = c.id;
  document.getElementById('ec-title').value = c.title || '';
  document.getElementById('ec-company').value = c.company || '';
  document.getElementById('ec-location').value = c.location || '';
  document.getElementById('ec-deadline').value = c.deadline || '';
  document.getElementById('ec-budget').value = c.budget || '';
  document.getElementById('ec-status').value = String(!!c.isActive);
  document.getElementById('ec-desc').value = c.description || '';
  openModal('edit-casting-modal');
}

document.getElementById('edit-casting-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('ec-id').value;
  const btn = e.target.querySelector('.btn-save');
  btn.textContent = 'Saving...'; btn.disabled = true;
  try {
    const updated = await apiPatch('casting_calls', id, {
      title: document.getElementById('ec-title').value.trim(),
      company: document.getElementById('ec-company').value.trim(),
      location: document.getElementById('ec-location').value.trim(),
      deadline: document.getElementById('ec-deadline').value,
      budget: document.getElementById('ec-budget').value.trim(),
      isActive: document.getElementById('ec-status').value === 'true',
      description: document.getElementById('ec-desc').value.trim()
    });
    const idx = allData.castings.findIndex(c=>c.id===id);
    if (idx>=0) allData.castings[idx] = { ...allData.castings[idx], ...updated };
    closeModal('edit-casting-modal');
    renderCastings();
    updateNavBadges();
    showToast('Casting call updated ✓', 'success');
  } catch(err) { showToast('Update failed', 'error'); }
  finally { btn.innerHTML='<i class="fas fa-save"></i> Save Changes'; btn.disabled=false; }
});

async function toggleCastingStatus(id, active) {
  try {
    await apiPatch('casting_calls', id, { isActive: active });
    const c = allData.castings.find(x=>x.id===id);
    if (c) c.isActive = active;
    renderCastings(); updateNavBadges();
    showToast(active ? 'Casting activated ✓' : 'Casting closed ✓', 'success');
  } catch(e) { showToast('Failed', 'error'); }
}

document.getElementById('export-castings-btn')?.addEventListener('click', () => {
  const rows = allData.castings.map(c=>`"${c.title||''}","${c.company||''}","${getCatLabel(c.category)}","${c.location||''}","${c.deadline||''}","${c.applicantsCount||0}","${c.isActive?'Active':'Closed'}","${fDate(c.created_at)}"`);
  downloadCSV(['Title','Company','Category','Location','Deadline','Applicants','Status','Posted On'], rows, 'cinestage_castings');
});

/* ══ APPLICATIONS SECTION ════════════════════════════ */
function renderApplications() {
  const q = document.getElementById('app-search')?.value.trim().toLowerCase() || '';
  const statusF = document.getElementById('app-status-filter')?.value || '';

  let filtered = allData.applications;
  if (q) filtered = filtered.filter(a =>
    a.applicantName?.toLowerCase().includes(q) ||
    a.castingTitle?.toLowerCase().includes(q)
  );
  if (statusF) filtered = filtered.filter(a => a.status === statusF);
  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));

  const paged = paginate(filtered, pageState.applications);
  const tbody = document.getElementById('apps-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(a => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="${a.applicantAvatar||avatarUrl(a.applicantName)}" class="table-avatar" alt="" onerror="this.src='${avatarUrl(a.applicantName)}'"/>
          <div>
            <div class="table-name">${escHtml(a.applicantName||'—')}</div>
            <div class="table-sub">${getCatLabel(a.applicantCategory)}</div>
          </div>
        </div>
      </td>
      <td>${escHtml(truncate(a.castingTitle,30))}</td>
      <td>${getCatLabel(a.applicantCategory)}</td>
      <td>
        <select onchange="updateAppStatus('${a.id}',this.value)" style="background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;">
          <option value="applied" ${a.status==='applied'?'selected':''}>Applied</option>
          <option value="shortlisted" ${a.status==='shortlisted'?'selected':''}>Shortlisted</option>
          <option value="rejected" ${a.status==='rejected'?'selected':''}>Rejected</option>
          <option value="hired" ${a.status==='hired'?'selected':''}>Hired</option>
        </select>
      </td>
      <td>${fDate(a.created_at)}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn" onclick="viewApplication('${a.id}')"><i class="fas fa-eye"></i> View</button>
          <button class="action-btn danger" onclick="confirmDelete('applications','${a.id}','Delete this application?')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-paper-plane"></i><p>No applications found</p></div></td></tr>`;

  renderPagination('apps-pagination', paged, 'applications');
}

document.getElementById('app-search')?.addEventListener('input', debounce(() => { pageState.applications=1; renderApplications(); }, 300));
document.getElementById('app-status-filter')?.addEventListener('change', () => { pageState.applications=1; renderApplications(); });

async function updateAppStatus(id, status) {
  try {
    await apiPatch('applications', id, { status });
    const a = allData.applications.find(x=>x.id===id);
    if (a) a.status = status;
    showToast(`Status updated to ${status} ✓`, 'success');
  } catch(e) { showToast('Failed', 'error'); }
}

function viewApplication(id) {
  const a = allData.applications.find(x=>x.id===id);
  if (!a) return;
  openModal('view-user-modal');
  document.getElementById('view-user-title').textContent = 'Application Detail';
  document.getElementById('view-user-content').innerHTML = `
    <div class="user-detail-grid" style="margin-bottom:1rem;">
      <div class="detail-field"><label>Applicant</label><span>${escHtml(a.applicantName||'—')}</span></div>
      <div class="detail-field"><label>Casting Call</label><span>${escHtml(a.castingTitle||'—')}</span></div>
      <div class="detail-field"><label>Status</label><span><span class="pill ${a.status}">${a.status}</span></span></div>
      <div class="detail-field"><label>Applied On</label><span>${fDate(a.created_at)}</span></div>
    </div>
    <div class="detail-field" style="margin-bottom:10px;"><label>Cover Message</label><span style="white-space:pre-wrap;">${escHtml(a.coverMessage||'—')}</span></div>
    <div class="detail-field" style="margin-bottom:10px;"><label>Experience Summary</label><span>${escHtml(a.experienceSummary||'—')}</span></div>
    ${a.portfolioLink ? `<div class="detail-field"><label>Portfolio Link</label><a href="${escHtml(a.portfolioLink)}" target="_blank" style="color:var(--gold);">${escHtml(a.portfolioLink)}</a></div>` : ''}
  `;
}

document.getElementById('export-apps-btn')?.addEventListener('click', () => {
  const rows = allData.applications.map(a=>`"${a.applicantName||''}","${a.castingTitle||''}","${getCatLabel(a.applicantCategory)}","${a.status||''}","${fDate(a.created_at)}"`);
  downloadCSV(['Applicant','Casting','Category','Status','Applied On'], rows, 'cinestage_applications');
});

/* ══ MESSAGES SECTION ════════════════════════════════ */
function renderMessages() {
  const q = document.getElementById('msg-search')?.value.trim().toLowerCase() || '';
  let filtered = allData.messages;
  if (q) filtered = filtered.filter(m => m.text?.toLowerCase().includes(q) || m.senderName?.toLowerCase().includes(q) || m.receiverName?.toLowerCase().includes(q));
  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));

  const paged = paginate(filtered, pageState.messages);
  const tbody = document.getElementById('msgs-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(m => `
    <tr>
      <td>${escHtml(m.senderName||'—')}</td>
      <td>${escHtml(m.receiverName||'—')}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(truncate(m.text,50))}</td>
      <td style="font-size:11px;color:var(--text3);">${escHtml((m.conversationId||'').slice(0,20))}…</td>
      <td>${fDate(m.created_at)} ${fTime(m.created_at)}</td>
      <td><span class="pill ${m.isRead?'read':'unread'}">${m.isRead?'Read':'Unread'}</span></td>
      <td>
        <button class="action-btn danger" onclick="confirmDelete('messages','${m.id}','Delete this message?')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-comment-slash"></i><p>No messages found</p></div></td></tr>`;

  renderPagination('msgs-pagination', paged, 'messages');
}

document.getElementById('msg-search')?.addEventListener('input', debounce(() => { pageState.messages=1; renderMessages(); }, 300));

/* ══ THEATERS SECTION ════════════════════════════════ */
function renderTheaters() {
  const q = document.getElementById('theater-search')?.value.trim().toLowerCase() || '';
  const typeF = document.getElementById('theater-type-filter')?.value || '';

  let filtered = allData.theaters;
  if (q) filtered = filtered.filter(t => t.name?.toLowerCase().includes(q) || t.city?.toLowerCase().includes(q) || t.address?.toLowerCase().includes(q));
  if (typeF) filtered = filtered.filter(t => t.type === typeF);
  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));

  const paged = paginate(filtered, pageState.theaters);
  const tbody = document.getElementById('theaters-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(t => `
    <tr>
      <td><div class="table-name">${escHtml(t.name||'—')}</div></td>
      <td>${escHtml(t.type||'—')}</td>
      <td>${escHtml(t.address||'—')}</td>
      <td>${escHtml(t.city||'—')}${t.state?', '+escHtml(t.state):''}</td>
      <td>${t.phone?`<a href="tel:${escHtml(t.phone)}" style="color:var(--gold)">${escHtml(t.phone)}</a>`:'—'}</td>
      <td><span class="pill ${t.isVerified?'verified':'unread'}">${t.isVerified?'✓ Verified':'Pending'}</span></td>
      <td>${fDate(t.created_at)}</td>
      <td>
        <div class="table-actions">
          ${!t.isVerified ? `<button class="action-btn success-btn" onclick="verifyTheater('${t.id}')"><i class="fas fa-check"></i> Verify</button>` : `<button class="action-btn danger" onclick="unverifyTheater('${t.id}')"><i class="fas fa-times"></i> Unverify</button>`}
          <button class="action-btn danger" onclick="confirmDelete('theaters','${t.id}','Delete theater: ${escHtml(t.name||'')}?')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-map-marker-alt"></i><p>No theaters found</p></div></td></tr>`;

  renderPagination('theaters-pagination', paged, 'theaters');
}

document.getElementById('theater-search')?.addEventListener('input', debounce(() => { pageState.theaters=1; renderTheaters(); }, 300));
document.getElementById('theater-type-filter')?.addEventListener('change', () => { pageState.theaters=1; renderTheaters(); });

async function verifyTheater(id) {
  try {
    await apiPatch('theaters', id, { isVerified: true });
    const t = allData.theaters.find(x=>x.id===id);
    if (t) t.isVerified = true;
    renderTheaters();
    showToast('Theater verified ✓', 'success');
  } catch(e) { showToast('Failed', 'error'); }
}
async function unverifyTheater(id) {
  try {
    await apiPatch('theaters', id, { isVerified: false });
    const t = allData.theaters.find(x=>x.id===id);
    if (t) t.isVerified = false;
    renderTheaters();
    showToast('Verification removed', 'success');
  } catch(e) { showToast('Failed', 'error'); }
}

document.getElementById('add-theater-admin-btn')?.addEventListener('click', () => openModal('admin-add-theater-modal'));

document.getElementById('admin-theater-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-save');
  btn.textContent = 'Adding...'; btn.disabled = true;
  try {
    const theater = await apiPost('theaters', {
      name: document.getElementById('at-name').value.trim(),
      type: document.getElementById('at-type').value,
      address: document.getElementById('at-address').value.trim(),
      city: document.getElementById('at-city').value.trim(),
      state: document.getElementById('at-state').value.trim(),
      phone: document.getElementById('at-phone').value.trim(),
      isVerified: document.getElementById('at-verified').value === 'true',
      facilities: [], rating: 0, addedById: 'admin'
    });
    allData.theaters.push(theater);
    closeModal('admin-add-theater-modal');
    e.target.reset();
    renderTheaters();
    showToast('Theater added ✓', 'success');
  } catch(err) { showToast('Failed to add theater', 'error'); }
  finally { btn.innerHTML='<i class="fas fa-map-marker-alt"></i> Add Theater'; btn.disabled=false; }
});

/* ══ MEMBERSHIPS SECTION ══════════════════════════════ */
function renderMemberships() {
  const q = document.getElementById('membership-search')?.value.trim().toLowerCase() || '';
  const planF = document.getElementById('membership-plan-filter')?.value || '';
  const statusF = document.getElementById('membership-status-filter')?.value || '';

  let filtered = allData.memberships;
  if (q) filtered = filtered.filter(m => m.userName?.toLowerCase().includes(q));
  if (planF) filtered = filtered.filter(m => m.plan === planF);
  if (statusF) filtered = filtered.filter(m => m.status === statusF);
  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));

  // Revenue summary
  const totalRev = filtered.reduce((s,m)=>s+(+m.amount||0), 0);
  const active = filtered.filter(m=>m.status==='active').length;
  const planBreak = {};
  filtered.forEach(m=>{ planBreak[m.plan]=(planBreak[m.plan]||0)+(+m.amount||0); });
  document.getElementById('revenue-summary').innerHTML = `
    <div class="rev-card"><div class="rev-card-label">Total Revenue</div><div class="rev-card-num">₹${totalRev.toLocaleString('en-IN')}</div></div>
    <div class="rev-card"><div class="rev-card-label">Total Orders</div><div class="rev-card-num">${filtered.length}</div></div>
    <div class="rev-card"><div class="rev-card-label">Active Subs</div><div class="rev-card-num">${active}</div></div>
    <div class="rev-card"><div class="rev-card-label">Avg. Order</div><div class="rev-card-num">₹${filtered.length>0?Math.round(totalRev/filtered.length).toLocaleString('en-IN'):0}</div></div>
  `;

  const paged = paginate(filtered, pageState.memberships);
  const tbody = document.getElementById('memberships-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(m => `
    <tr>
      <td>${escHtml(m.userName||'—')}</td>
      <td>${escHtml(m.plan||'—')}</td>
      <td>${escHtml(m.planName||'—')}</td>
      <td><strong style="color:var(--gold)">₹${(+m.amount||0).toLocaleString('en-IN')}</strong></td>
      <td>${fDate(m.startDate)}</td>
      <td>${fDate(m.expiryDate)}</td>
      <td style="font-size:11px;color:var(--text3);">${escHtml(m.transactionId||'—')}</td>
      <td><span class="pill ${m.status==='active'?'active':'expired'}">${m.status||'active'}</span></td>
      <td>
        <button class="action-btn danger" onclick="confirmDelete('membership_orders','${m.id}','Delete this membership order?')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="9"><div class="empty-state"><i class="fas fa-crown"></i><p>No membership orders found</p></div></td></tr>`;

  renderPagination('memberships-pagination', paged, 'memberships');
}

document.getElementById('membership-search')?.addEventListener('input', debounce(() => { pageState.memberships=1; renderMemberships(); }, 300));
document.getElementById('membership-plan-filter')?.addEventListener('change', () => { pageState.memberships=1; renderMemberships(); });
document.getElementById('membership-status-filter')?.addEventListener('change', () => { pageState.memberships=1; renderMemberships(); });

document.getElementById('export-memberships-btn')?.addEventListener('click', () => {
  const rows = allData.memberships.map(m=>`"${m.userName||''}","${m.plan||''}","${m.planName||''}","${m.amount||0}","${fDate(m.startDate)}","${fDate(m.expiryDate)}","${m.transactionId||''}","${m.status||''}"`);
  downloadCSV(['User','Plan','Tier','Amount','Start','Expiry','Transaction ID','Status'], rows, 'cinestage_memberships');
});

/* ══ NOTIFICATIONS SECTION ═══════════════════════════ */
function renderNotifications() {
  const q = document.getElementById('notif-search-admin')?.value.trim().toLowerCase() || '';
  let filtered = allData.notifications;
  if (q) filtered = filtered.filter(n => n.title?.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q));
  filtered.sort((a,b)=>(b.created_at||0)-(a.created_at||0));

  const paged = paginate(filtered, pageState.notifications);
  const tbody = document.getElementById('notifs-tbody');
  if (!tbody) return;

  tbody.innerHTML = paged.items.length ? paged.items.map(n => `
    <tr>
      <td style="font-size:11px;color:var(--text3);">${escHtml((n.userId||'').slice(0,12))}…</td>
      <td><span class="pill applied">${escHtml(n.type||'—')}</span></td>
      <td><strong>${escHtml(n.title||'—')}</strong></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(truncate(n.description,50))}</td>
      <td><span class="pill ${n.isRead?'read':'unread'}">${n.isRead?'Read':'Unread'}</span></td>
      <td>${fDate(n.created_at)}</td>
      <td>
        <button class="action-btn danger" onclick="confirmDelete('notifications','${n.id}','Delete this notification?')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications found</p></div></td></tr>`;

  renderPagination('notifs-pagination', paged, 'notifications');
}

document.getElementById('notif-search-admin')?.addEventListener('input', debounce(() => { pageState.notifications=1; renderNotifications(); }, 300));

document.getElementById('send-notif-btn')?.addEventListener('click', () => openModal('broadcast-modal'));

document.getElementById('broadcast-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const target = document.getElementById('bc-target').value;
  const type   = document.getElementById('bc-type').value;
  const title  = document.getElementById('bc-title').value.trim();
  const msg    = document.getElementById('bc-message').value.trim();
  const btn    = e.target.querySelector('.btn-save');
  btn.textContent = 'Sending...'; btn.disabled = true;

  try {
    let targets = allData.users;
    if (target === 'artist') targets = targets.filter(u => u.role === 'artist');
    if (target === 'recruiter') targets = targets.filter(u => u.role === 'recruiter');
    if (target === 'premium') targets = targets.filter(u => u.membershipPlan && u.membershipPlan !== 'free');

    await Promise.all(targets.map(u => apiPost('notifications', {
      userId: u.id, type, title, description: msg, isRead: false, relatedId: 'admin-broadcast'
    })));

    closeModal('broadcast-modal');
    e.target.reset();
    await loadAllData();
    renderNotifications();
    showToast(`Broadcast sent to ${targets.length} user${targets.length!==1?'s':''}! ✓`, 'success');
  } catch(err) {
    showToast('Broadcast failed', 'error');
  } finally {
    btn.innerHTML='<i class="fas fa-paper-plane"></i> Send Broadcast'; btn.disabled=false;
  }
});

/* ══ ANALYTICS SECTION ════════════════════════════════ */
function renderAnalytics() {
  const u = allData.users, c = allData.castings, a = allData.applications, m = allData.memberships, t = allData.theaters;
  const artists = u.filter(x=>x.role==='artist').length;
  const recruiters = u.filter(x=>x.role==='recruiter').length;
  const premium = u.filter(x=>x.membershipPlan&&x.membershipPlan!=='free').length;
  const totalRev = m.reduce((s,o)=>s+(+o.amount||0),0);
  const active = c.filter(x=>x.isActive).length;
  const shortlisted = a.filter(x=>x.status==='shortlisted').length;
  const hired = a.filter(x=>x.status==='hired').length;

  document.getElementById('analytics-grid').innerHTML = [
    { icon:'fa-users', label:'Total Users', num: u.length },
    { icon:'fa-theater-masks', label:'Artists', num: artists },
    { icon:'fa-user-tie', label:'Recruiters', num: recruiters },
    { icon:'fa-crown', label:'Premium Members', num: premium },
    { icon:'fa-film', label:'Casting Calls', num: c.length },
    { icon:'fa-check-circle', label:'Active Calls', num: active },
    { icon:'fa-paper-plane', label:'Applications', num: a.length },
    { icon:'fa-rupee-sign', label:'Total Revenue', num:'₹'+totalRev.toLocaleString('en-IN') },
    { icon:'fa-handshake', label:'Shortlisted', num: shortlisted },
    { icon:'fa-award', label:'Hired', num: hired },
    { icon:'fa-map-marker-alt', label:'Theaters', num: t.length },
    { icon:'fa-comment-dots', label:'Messages', num: allData.messages.length }
  ].map(k=>`
    <div class="kpi-card" style="cursor:default;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:36px;height:36px;background:var(--gold-dim);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:16px;">
          <i class="fas ${k.icon}"></i>
        </div>
      </div>
      <div class="kpi-num">${k.num}</div>
      <div class="kpi-lbl">${k.label}</div>
    </div>`).join('');

  // Category breakdown
  const catCounts = {};
  u.filter(x=>x.role==='artist').forEach(x=>{ catCounts[x.category]=(catCounts[x.category]||0)+1; });
  const topCats = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxCat = topCats[0]?.[1]||1;
  document.getElementById('admin-category-chart').innerHTML = topCats.length ? topCats.map(([cat,cnt],i)=>`
    <div class="bar-item">
      <div class="bar-label">${getCatLabel(cat)}</div>
      <div class="bar-track"><div class="bar-fill ${ ['gold','info','success','error','purple','warning','gold','info'][i%8] }" style="width:${Math.round((cnt/maxCat)*100)}%"></div></div>
      <div class="bar-count">${cnt}</div>
    </div>`).join('') : '<p style="color:var(--text3);">No data</p>';

  // App status breakdown
  const statuses = [{k:'applied',c:'info'},{k:'shortlisted',c:'success'},{k:'rejected',c:'error'},{k:'hired',c:'gold'}];
  const maxApp = Math.max(...statuses.map(s=>a.filter(x=>x.status===s.k).length),1);
  document.getElementById('admin-app-status-chart').innerHTML = statuses.map(s=>{
    const cnt = a.filter(x=>x.status===s.k).length;
    return `<div class="bar-item">
      <div class="bar-label" style="text-transform:capitalize;">${s.k}</div>
      <div class="bar-track"><div class="bar-fill ${s.c}" style="width:${Math.round((cnt/maxApp)*100)}%"></div></div>
      <div class="bar-count">${cnt}</div>
    </div>`;
  }).join('');

  // Revenue by plan
  const planNames = ['weekly','monthly','quarterly','half-yearly','yearly'];
  const revByPlan = {};
  m.forEach(o=>{ revByPlan[o.plan]=(revByPlan[o.plan]||0)+(+o.amount||0); });
  const maxRev = Math.max(...planNames.map(p=>revByPlan[p]||0),1);
  const rColors = ['gold','info','success','purple','warning'];
  document.getElementById('admin-revenue-chart').innerHTML = planNames.map((p,i)=>{
    const amt = revByPlan[p]||0;
    return `<div class="bar-item">
      <div class="bar-label">${p}</div>
      <div class="bar-track"><div class="bar-fill ${rColors[i]}" style="width:${Math.round((amt/maxRev)*100)}%"></div></div>
      <div class="bar-count" style="font-size:10px;">₹${amt.toLocaleString('en-IN')}</div>
    </div>`;
  }).join('');

  // Top locations
  const locCounts = {};
  u.forEach(x=>{ const loc=(x.location||'').split(',')[0].trim(); if(loc) locCounts[loc]=(locCounts[loc]||0)+1; });
  const topLocs = Object.entries(locCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxLoc = topLocs[0]?.[1]||1;
  document.getElementById('admin-location-chart').innerHTML = topLocs.length ? topLocs.map(([loc,cnt],i)=>`
    <div class="bar-item">
      <div class="bar-label">${escHtml(loc)}</div>
      <div class="bar-track"><div class="bar-fill ${rColors[i%5]}" style="width:${Math.round((cnt/maxLoc)*100)}%"></div></div>
      <div class="bar-count">${cnt}</div>
    </div>`).join('') : '<p style="color:var(--text3);">No data</p>';
}

/* ══ DELETE CONFIRM ══════════════════════════════════ */
function confirmDelete(table, id, msg) {
  document.getElementById('confirm-delete-msg').textContent = msg;
  deleteCallback = { table, id };
  openModal('confirm-delete-modal');
}

document.getElementById('confirm-delete-action')?.addEventListener('click', async () => {
  if (!deleteCallback) return;
  const btn = document.getElementById('confirm-delete-action');
  btn.textContent = 'Deleting...'; btn.disabled = true;
  try {
    await apiDelete(deleteCallback.table, deleteCallback.id);
    // Remove from local cache
    const tableKey = { casting_calls:'castings', membership_orders:'memberships' }[deleteCallback.table] || deleteCallback.table;
    if (allData[tableKey]) {
      allData[tableKey] = allData[tableKey].filter(x=>x.id!==deleteCallback.id);
    }
    closeModal('confirm-delete-modal');
    renderSection(currentSection);
    updateNavBadges();
    showToast('Deleted successfully ✓', 'success');
  } catch(e) { showToast('Delete failed', 'error'); }
  finally { btn.innerHTML='<i class="fas fa-trash"></i> Delete'; btn.disabled=false; deleteCallback=null; }
});

/* ══ PAGINATION ══════════════════════════════════════ */
function paginate(items, page) {
  const total = items.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { items: items.slice(start, start + PAGE_SIZE), page: safePage, totalPages, total };
}

function renderPagination(containerId, paged, stateKey) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (paged.totalPages <= 1) { el.innerHTML = `<div class="page-info">${paged.total} record${paged.total!==1?'s':''}</div>`; return; }
  let html = `<button class="page-btn" ${paged.page<=1?'disabled':''} onclick="goPage('${stateKey}',${paged.page-1})"><i class="fas fa-chevron-left"></i></button>`;
  const start = Math.max(1, paged.page-2), end = Math.min(paged.totalPages, paged.page+2);
  if (start > 1) html += `<button class="page-btn" onclick="goPage('${stateKey}',1)">1</button>${start>2?'<span class="page-info">…</span>':''}`;
  for (let i=start;i<=end;i++) html += `<button class="page-btn ${i===paged.page?'active':''}" onclick="goPage('${stateKey}',${i})">${i}</button>`;
  if (end < paged.totalPages) html += `${end<paged.totalPages-1?'<span class="page-info">…</span>':''}<button class="page-btn" onclick="goPage('${stateKey}',${paged.totalPages})">${paged.totalPages}</button>`;
  html += `<button class="page-btn" ${paged.page>=paged.totalPages?'disabled':''} onclick="goPage('${stateKey}',${paged.page+1})"><i class="fas fa-chevron-right"></i></button>`;
  html += `<span class="page-info">${paged.total} records</span>`;
  el.innerHTML = html;
}

function goPage(stateKey, page) {
  pageState[stateKey] = page;
  renderSection(currentSection);
}

/* ══ CSV EXPORT ══════════════════════════════════════ */
function downloadCSV(headers, rows, filename) {
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('CSV exported ✓', 'success');
}

/* ══ DEBOUNCE ════════════════════════════════════════ */
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
