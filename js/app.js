/* ============================================================
   CINESTAGE – Main App: Navigation, Home, Search, Screens
   ============================================================ */

/* ══ APP NAVIGATION ══════════════════════════════════ */
let currentPage = 'home';
let previousPage = 'home';

function navigateTo(page) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (!target) return;
  target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  previousPage = currentPage;
  currentPage = page;

  // Render per page
  const renders = {
    home:           renderHome,
    search:         renderSearch,
    messages:       renderMessages,
    profile:        renderProfile,
    notifications:  renderNotifications,
    upload:         renderUpload,
    recruiter:      renderRecruiter,
    theaters:       renderTheaters,
    membership:     renderMembership,
    analytics:      renderAnalytics
  };
  if (renders[page]) renders[page]();
}

/* ══ ENTER APP ══════════════════════════════════════ */
let notifPollTimer = null;

function enterApp() {
  showScreen('app');
  updateTopBar();

  const user = AppState.currentUser;
  if (user?.role === 'recruiter') {
    const pNav = document.querySelector('.nav-btn[data-page="profile"] span:last-child');
    if (pNav) pNav.textContent = 'Dashboard';
    navigateTo('recruiter');
  } else {
    navigateTo('home');
  }
  loadNotifBadge();
  // Start notification polling every 30 seconds
  clearInterval(notifPollTimer);
  notifPollTimer = setInterval(loadNotifBadge, 30000);
}

function updateTopBar() {
  const user = AppState.currentUser;
  if (!user) return;
  const img = document.getElementById('top-avatar');
  if (img) {
    img.src = user.avatarUrl || getAvatarUrl(user.fullName);
    img.onerror = () => { img.src = getAvatarUrl(user.fullName); };
  }
  document.getElementById('greeting-name').textContent = user.fullName?.split(' ')[0] || 'User';
  document.getElementById('greeting-time').textContent = getGreeting();

  const chip = document.getElementById('membership-chip');
  if (chip) {
    const plan = user.membershipPlan || 'free';
    const isPaid = plan !== 'free';
    chip.textContent = isPaid ? `👑 ${(user.membershipPlanName||plan).charAt(0).toUpperCase()+(user.membershipPlanName||plan).slice(1)}` : '🆓 Free';
    chip.className = `membership-chip ${isPaid?'premium':'free'}`;
    chip.style.cursor = 'pointer';
  }

  // Side menu user info
  const sideInfo = document.getElementById('side-user-info');
  if (sideInfo) {
    sideInfo.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;">
        <img src="${user.avatarUrl||getAvatarUrl(user.fullName)}" style="width:42px;height:42px;border-radius:50%;border:2px solid var(--gold);object-fit:cover;" onerror="this.src='${getAvatarUrl(user.fullName)}'" />
        <div><div style="font-weight:700;color:var(--text);font-size:14px;">${user.fullName}</div>
        <div style="font-size:12px;color:var(--gold);">${getCategoryInfo(user.category)?.label || user.role}</div></div>
      </div>`;
  }
}

/* ══ BOTTOM NAV ═════════════════════════════════════ */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (!page) return;
    const user = AppState.currentUser;
    if (page === 'profile' && user?.role === 'recruiter') {
      navigateTo('recruiter'); return;
    }
    navigateTo(page);
  });
});

document.getElementById('home-search-bar')?.addEventListener('click', () => navigateTo('search'));
document.getElementById('profile-avatar-btn')?.addEventListener('click', () => {
  const user = AppState.currentUser;
  navigateTo(user?.role === 'recruiter' ? 'recruiter' : 'profile');
});

// Back buttons
document.getElementById('casting-back-btn')?.addEventListener('click', () => navigateTo(previousPage));
document.getElementById('artist-back-btn')?.addEventListener('click', () => navigateTo(previousPage));
document.getElementById('payment-back-btn')?.addEventListener('click', () => {
  showScreen('app');
  navigateTo(previousPage);
});

/* ══ THEME ══════════════════════════════════════════ */
function loadTheme() {
  const t = localStorage.getItem('cs_theme') || 'dark';
  applyTheme(t);
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('cs_theme', t);
  const icon = document.querySelector('#theme-toggle i');
  if (icon) icon.className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
  showToast(cur === 'dark' ? '☀️ Light mode' : '🌙 Dark mode');
});

/* ══ SIDE MENU ══════════════════════════════════════ */
document.getElementById('menu-btn')?.addEventListener('click', () => {
  document.getElementById('side-menu')?.classList.add('open');
  document.getElementById('side-menu-overlay')?.classList.add('open');
});
document.getElementById('side-menu-overlay')?.addEventListener('click', closeSideMenu);
function closeSideMenu() {
  document.getElementById('side-menu')?.classList.remove('open');
  document.getElementById('side-menu-overlay')?.classList.remove('open');
}

/* ══ TOAST ══════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ══ MODAL UTILS ════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
});

/* ══ NOTIFICATIONS BELL ══════════════════════════════ */
document.getElementById('notif-btn')?.addEventListener('click', () => navigateTo('notifications'));

let _lastNotifCount = 0;
async function loadNotifBadge() {
  if (!AppState.currentUser) return;
  try {
    const notifs = await API.getUserNotifications(AppState.currentUser.id);
    const count  = notifs.filter(n => !n.isRead).length;
    const badge  = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.toggle('hidden', count === 0);
      // Animate if new notifications arrived
      if (count > _lastNotifCount && _lastNotifCount !== 0) {
        badge.classList.remove('show-anim');
        void badge.offsetWidth; // reflow
        badge.classList.add('show-anim');
      }
      _lastNotifCount = count;
    }
    // Update messages badge
    loadMsgBadge();
  } catch(e) {}
}

async function loadMsgBadge() {
  if (!AppState.currentUser) return;
  try {
    const convs = await API.getUserConversations(AppState.currentUser.id);
    const hasUnread = convs.some(c => c.unread);
    const dot = document.getElementById('msg-badge-dot');
    if (dot) dot.classList.toggle('hidden', !hasUnread);
  } catch(e) {}
}

/* ══════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════ */
async function renderHome() {
  updateTopBar();
  renderHomeQuickActions();
  renderHomeCategories();
  loadHomeCastings();
  loadHomeArtists();
  loadHomeTheaters();
  loadOverviewStats();
}

function renderHomeQuickActions() {
  const user = AppState.currentUser;
  if (!user) return;
  const isRecruiter = user.role === 'recruiter';
  // Insert quick actions bar after greeting if not already there
  let qaBar = document.getElementById('home-quick-actions');
  if (!qaBar) {
    const greetBar = document.querySelector('.greeting-bar');
    if (greetBar) {
      qaBar = document.createElement('div');
      qaBar.id = 'home-quick-actions';
      qaBar.className = 'quick-actions';
      greetBar.insertAdjacentElement('afterend', qaBar);
    }
  }
  if (!qaBar) return;
  const actions = isRecruiter ? [
    { icon:'fas fa-plus-circle', label:'Post Casting', fn:"navigateTo('upload')" },
    { icon:'fas fa-users', label:'Applicants', fn:"navigateTo('recruiter')" },
    { icon:'fas fa-search', label:'Find Talent', fn:"navigateTo('search')" },
    { icon:'fas fa-comment-dots', label:'Messages', fn:"navigateTo('messages')" },
    { icon:'fas fa-chart-bar', label:'Analytics', fn:"navigateTo('analytics')" }
  ] : [
    { icon:'fas fa-film', label:'Browse Roles', fn:"navigateTo('search')" },
    { icon:'fas fa-paper-plane', label:'Apply Now', fn:"navigateTo('search')" },
    { icon:'fas fa-comment-dots', label:'Messages', fn:"navigateTo('messages')" },
    { icon:'fas fa-crown', label:'Upgrade', fn:"navigateTo('membership')" },
    { icon:'fas fa-map-marker-alt', label:'Theaters', fn:"navigateTo('theaters')" }
  ];
  qaBar.innerHTML = actions.map(a => `
    <div class="quick-action-btn" onclick="${a.fn}">
      <i class="${a.icon}"></i>
      <span>${a.label}</span>
    </div>
  `).join('');
}

function renderHomeCategories() {
  const container = document.getElementById('home-categories');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(cat => `
    <div class="cat-pill" onclick="filterByCategory('${cat.id}')">
      <span>${cat.icon}</span><span>${cat.label}</span>
    </div>
  `).join('');
}

function filterByCategory(catId) {
  navigateTo('search');
  setTimeout(() => {
    const f = document.getElementById('f-category');
    if (f) { f.value = catId; applySearchFilters(); }
  }, 100);
}

async function loadHomeCastings() {
  const container = document.getElementById('home-castings');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:160px;border-radius:14px;"></div>';
  try {
    const res = await API.getCastingCalls({ limit: 6 });
    const calls = (res.data || []).filter(c => c.isActive);
    if (!calls.length) {
      container.innerHTML = emptyState('fas fa-film', 'No casting calls yet', 'Be the first recruiter to post one!');
      return;
    }
    container.innerHTML = `<div class="h-scroll">${calls.map(c => castingCardHTML(c)).join('')}</div>`;
    container.querySelectorAll('.casting-card').forEach(card => {
      card.addEventListener('click', e => {
        if (!e.target.closest('.btn-apply')) showCastingDetail(card.dataset.id);
      });
    });
    container.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openApplyModal(btn.dataset.id, btn.dataset.title); });
    });
  } catch(err) {
    container.innerHTML = emptyState('fas fa-exclamation-circle', 'Could not load castings');
  }
}

async function loadHomeArtists() {
  const container = document.getElementById('home-artists');
  if (!container) return;
  const user = AppState.currentUser;
  try {
    const res = await API.getUsers({ limit: 20 });
    const artists = (res.data || []).filter(u => u.role === 'artist' && u.profileComplete && u.id !== user?.id);
    if (!artists.length) {
      container.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:1rem;">No artists registered yet.</p>';
      return;
    }
    container.innerHTML = artists.slice(0,10).map(a => `
      <div class="artist-card" data-id="${a.id}" onclick="showArtistDetail('${a.id}')">
        <img src="${a.avatarUrl||getAvatarUrl(a.fullName)}" alt="${a.fullName}" class="av" loading="lazy" onerror="this.src='${getAvatarUrl(a.fullName)}'"/>
        <div class="name">${a.fullName}${a.isVerified?'<span class="v-tick">✓</span>':''}</div>
        <div class="skill-badge">${getCategoryInfo(a.category)?.icon || '🎬'} ${getCategoryInfo(a.category)?.label || ''}</div>
        <div class="loc-text"><i class="fas fa-map-marker-alt"></i> ${a.location||''}</div>
      </div>
    `).join('');
  } catch(e) {}
}

async function loadHomeTheaters() {
  const container = document.getElementById('home-theaters');
  if (!container) return;
  try {
    const user = AppState.currentUser;
    const city = user?.location?.split(',')[0]?.trim() || '';
    const theaters = await API.getTheaters(city);
    if (!theaters.length) {
      container.innerHTML = `<div class="theater-empty-card" onclick="navigateTo('theaters')" style="cursor:pointer;">
        <i class="fas fa-film"></i> <span>Add theaters & studios near you</span>
        <i class="fas fa-arrow-right"></i>
      </div>`;
      return;
    }
    container.innerHTML = theaters.slice(0,3).map(t => theaterCardHTML(t)).join('');
  } catch(e) {}
}

async function loadOverviewStats() {
  const container = document.getElementById('overview-stats');
  if (!container) return;
  try {
    const stats = await API.getStatsCounts();
    container.innerHTML = `
      <div class="stat-overview-card"><i class="fas fa-users"></i><div class="ov-num">${stats.users}</div><div class="ov-lbl">Registered Users</div></div>
      <div class="stat-overview-card"><i class="fas fa-film"></i><div class="ov-num">${stats.castings}</div><div class="ov-lbl">Live Casting Calls</div></div>
      <div class="stat-overview-card"><i class="fas fa-paper-plane"></i><div class="ov-num">${stats.applications}</div><div class="ov-lbl">Applications Sent</div></div>
      <div class="stat-overview-card"><i class="fas fa-map-marker-alt"></i><div class="ov-num">${stats.theaters}</div><div class="ov-lbl">Theaters Listed</div></div>
    `;
  } catch(e) {}
}

/* ══════════════════════════════════════════════════════
   SEARCH PAGE
══════════════════════════════════════════════════════ */
let searchMode = 'artists';

function renderSearch() {
  // Build category filter
  const fCat = document.getElementById('f-category');
  if (fCat && fCat.options.length <= 1) {
    CATEGORIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.label;
      fCat.appendChild(opt);
    });
  }
  doSearch();
}

document.getElementById('search-input')?.addEventListener('input', debounce(doSearch, 400));
document.getElementById('clear-search')?.addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  doSearch();
});
document.getElementById('filter-toggle-btn')?.addEventListener('click', () => {
  document.getElementById('filters-panel')?.classList.toggle('open');
});
document.getElementById('apply-filters')?.addEventListener('click', () => {
  applySearchFilters();
  document.getElementById('filters-panel')?.classList.remove('open');
});
document.querySelectorAll('.s-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.s-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    searchMode = tab.dataset.stab;
    doSearch();
  });
});

function applySearchFilters() { doSearch(); }

async function doSearch() {
  const q        = document.getElementById('search-input')?.value.trim().toLowerCase() || '';
  const catFilter = document.getElementById('f-category')?.value || '';
  const gender   = document.getElementById('f-gender')?.value || '';
  const exp      = document.getElementById('f-exp')?.value || '';
  const loc      = document.getElementById('f-location')?.value.trim().toLowerCase() || '';
  const container = document.getElementById('search-results');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';
  try {
    if (searchMode === 'artists') {
      const res = await API.getUsers({ limit: 100 });
      let users = (res.data || []).filter(u => u.role === 'artist' && u.profileComplete);

      if (q) users = users.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.category?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q) ||
        u.skills?.some(s => s.toLowerCase().includes(q))
      );
      if (catFilter) users = users.filter(u => u.category === catFilter);
      if (gender) users = users.filter(u => u.gender === gender);
      if (exp) users = users.filter(u => u.experience === exp);
      if (loc) users = users.filter(u => u.location?.toLowerCase().includes(loc));

      if (!users.length) { container.innerHTML = emptyState('fas fa-user-slash','No artists found','Try different filters or clear your search'); return; }
      container.innerHTML = `<div class="search-results-count">${users.length} artist${users.length!==1?'s':''} found</div><div class="results-grid">${users.map(a => artistResultCardHTML(a)).join('')}</div>`;
      container.querySelectorAll('.artist-result-card').forEach(c => {
        c.addEventListener('click', () => showArtistDetail(c.dataset.id));
      });

    } else {
      const res = await API.getCastingCalls({ limit: 100 });
      let calls = (res.data || []).filter(c => c.isActive);
      if (q) calls = calls.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
      if (catFilter) calls = calls.filter(c => c.category === catFilter);
      if (gender) calls = calls.filter(c => !c.gender || c.gender === 'Any' || c.gender === gender);
      if (loc) calls = calls.filter(c => c.location?.toLowerCase().includes(loc));

      if (!calls.length) { container.innerHTML = emptyState('fas fa-film','No casting calls found','Try different keywords or check back later'); return; }
      container.innerHTML = `<div class="search-results-count">${calls.length} casting call${calls.length!==1?'s':''} found</div>` + calls.map(c => `
        <div class="casting-list-item" data-id="${c.id}" onclick="showCastingDetail('${c.id}')">
          <div class="cli-icon">${getCategoryInfo(c.category)?.icon||'🎬'}</div>
          <div class="cli-info">
            <div class="cli-title">${c.title}</div>
            <div class="cli-meta"><span><i class="fas fa-building"></i> ${c.company||''}</span><span><i class="fas fa-map-marker-alt"></i> ${c.location||''}</span></div>
          </div>
          <span class="deadline-pill ${isUrgent(c.deadline)?'urgent':''}">${daysUntil(c.deadline)}</span>
        </div>
      `).join('');
    }
  } catch(e) {
    container.innerHTML = emptyState('fas fa-exclamation-circle', 'Error loading results');
  }
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ══════════════════════════════════════════════════════
   CASTING DETAIL
══════════════════════════════════════════════════════ */
async function showCastingDetail(castingId) {
  previousPage = currentPage;
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  document.getElementById('page-casting-detail').classList.add('active');
  currentPage = 'casting-detail';
  document.getElementById('casting-detail-content').innerHTML = '<div class="spinner" style="margin:3rem auto;"></div>';

  try {
    const c = await API.getOne('casting_calls', castingId);
    const user = AppState.currentUser;

    // Check if already applied
    let applied = false;
    if (user?.role === 'artist') {
      const myApps = await API.getApplicationsByUser(user.id);
      applied = myApps.some(a => a.castingId === castingId);
    }

    const catInfo = getCategoryInfo(c.category);
    const urgent  = isUrgent(c.deadline);
    const reqList = Array.isArray(c.requirements) ? c.requirements : (c.requirements||'').split('\n').filter(Boolean);

    document.getElementById('casting-detail-content').innerHTML = `
      <div class="detail-hero-banner" style="font-size:80px;text-align:center;padding:2rem;background:linear-gradient(135deg,var(--bg3),var(--card2));border-radius:var(--radius);margin-bottom:1.2rem;">${catInfo.icon}</div>
      <div class="detail-content">
        <div class="card-badge">${catInfo.icon} ${catInfo.label}</div>
        <h2 class="detail-title">${c.title}</h2>
        <p class="detail-company"><i class="fas fa-building"></i> ${c.company||'Production Company'}</p>
        <p class="detail-recruiter" style="font-size:12px;color:var(--text3);margin-bottom:1rem;">Posted by ${c.recruiterName||'Recruiter'}</p>

        <div class="detail-meta-grid">
          <div class="detail-meta-item"><label>📍 Location</label><span>${c.location||'N/A'}</span></div>
          <div class="detail-meta-item"><label>💰 Budget</label><span>${c.budget||'Negotiable'}</span></div>
          <div class="detail-meta-item"><label>👥 Gender</label><span>${c.gender||'Any'}</span></div>
          <div class="detail-meta-item"><label>🎂 Age Range</label><span>${c.ageMin||'Any'}${c.ageMax?' – '+c.ageMax:''}</span></div>
          <div class="detail-meta-item"><label>⏰ Deadline</label><span style="color:${urgent?'var(--error)':'inherit'}">${daysUntil(c.deadline)}</span></div>
          <div class="detail-meta-item"><label>👁️ Applicants</label><span>${c.applicantsCount||0}</span></div>
        </div>

        <div class="detail-section"><h5>About the Role</h5><p>${c.description||'No description provided.'}</p></div>

        ${reqList.length ? `<div class="detail-section"><h5>Requirements</h5><ul class="req-list">${reqList.map(r=>`<li>${r}</li>`).join('')}</ul></div>` : ''}

        ${Array.isArray(c.languages)&&c.languages.length ? `<div class="detail-section"><h5>Languages Required</h5><div class="skill-tags">${c.languages.map(l=>`<span class="skill-tag">${l}</span>`).join('')}</div></div>` : ''}

        <div class="detail-actions" style="margin-top:1.5rem;">
          ${user?.role === 'recruiter'
            ? `<div style="color:var(--text3);font-size:13px;text-align:center;width:100%;padding:1rem;">You posted this casting call.</div>`
            : applied
              ? `<button class="btn-applied full" style="width:100%;justify-content:center;"><i class="fas fa-check-circle"></i> Already Applied</button>`
              : `<button class="btn-primary" style="flex:1;justify-content:center;" onclick="openApplyModal('${castingId}','${c.title.replace(/'/g,"\\'")}')"><i class="fas fa-paper-plane"></i> Apply Now</button>`
          }
        </div>
      </div>
    `;
  } catch(err) {
    document.getElementById('casting-detail-content').innerHTML = emptyState('fas fa-exclamation-circle','Could not load casting details');
  }
}

/* ══════════════════════════════════════════════════════
   ARTIST DETAIL
══════════════════════════════════════════════════════ */
async function showArtistDetail(artistId) {
  previousPage = currentPage;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-artist-detail').classList.add('active');
  currentPage = 'artist-detail';
  document.getElementById('artist-detail-content').innerHTML = '<div class="spinner" style="margin:3rem auto;"></div>';

  try {
    const artist = await API.getOne('users', artistId);
    const me = AppState.currentUser;
    const catInfo = getCategoryInfo(artist.category);
    const isMe = me?.id === artistId;
    let isFollowing = false;
    if (!isMe && me) isFollowing = await API.isFollowing(me.id, artistId);

    const isRecruiterProfile = artist.role === 'recruiter';
    document.getElementById('artist-detail-content').innerHTML = `
      <div class="profile-hero-card">
        <div class="profile-cover-grad"></div>
        <div class="artist-detail-top">
          <img src="${artist.avatarUrl||getAvatarUrl(artist.fullName)}" alt="${artist.fullName}" class="artist-detail-avatar" onerror="this.src='${getAvatarUrl(artist.fullName)}'"/>
          <div class="artist-detail-actions">
            ${isMe
              ? `<button class="btn-outline sm" onclick="navigateTo('profile')"><i class="fas fa-user"></i> My Profile</button>`
              : `<button class="btn-follow ${isFollowing?'following':''}" id="follow-btn-${artistId}" onclick="toggleFollow('${artistId}', this)">${isFollowing?'✓ Following':'+ Follow'}</button>
                 <button class="btn-outline sm" onclick="startChatWith('${artistId}','${artist.fullName.replace(/'/g,"\\'")}')"><i class="fas fa-comment"></i></button>`
            }
          </div>
        </div>
        <div class="artist-detail-info">
          <div class="profile-name-wrap">
            <h3>${artist.fullName}</h3>
            ${artist.isVerified?'<span class="verified-badge"><i class="fas fa-check-circle"></i></span>':''}
            <span class="role-badge ${isRecruiterProfile?'recruiter':''}">${isRecruiterProfile?'🎬 Recruiter':'🎭 Artist'}</span>
          </div>
          <p class="profile-role-text">${catInfo.icon} ${catInfo.label}${artist.company?' • '+artist.company:''}${artist.location?' • '+artist.location:''}</p>
          ${artist.designation ? `<p style="font-size:12px;color:var(--text3);margin-bottom:6px;">💼 ${artist.designation}</p>` : ''}
          <p class="profile-bio">${artist.bio||'No bio yet.'}</p>
        </div>
        <div class="profile-stats">
          <div class="stat"><span class="stat-num">${artist.followersCount||0}</span><span class="stat-lbl">Followers</span></div>
          <div class="stat"><span class="stat-num">${artist.followingCount||0}</span><span class="stat-lbl">Following</span></div>
          <div class="stat"><span class="stat-num">${artist.experience||'N/A'}</span><span class="stat-lbl">Experience</span></div>
          <div class="stat"><span class="stat-num">${(artist.languages||[]).length}</span><span class="stat-lbl">Languages</span></div>
        </div>
      </div>

      ${!isRecruiterProfile ? `
      <!-- Physical Details -->
      <div class="profile-section">
        <h4>Physical Details</h4>
        <div class="physical-grid">
          ${artist.height?`<div class="phys-item"><label>Height</label><span>${artist.height}</span></div>`:''}
          ${artist.weight?`<div class="phys-item"><label>Weight</label><span>${artist.weight}</span></div>`:''}
          ${artist.hairColor?`<div class="phys-item"><label>Hair</label><span>${artist.hairColor}</span></div>`:''}
          ${artist.eyeColor?`<div class="phys-item"><label>Eyes</label><span>${artist.eyeColor}</span></div>`:''}
          ${artist.complexion?`<div class="phys-item"><label>Complexion</label><span>${artist.complexion}</span></div>`:''}
          ${artist.bodyType?`<div class="phys-item"><label>Body Type</label><span>${artist.bodyType}</span></div>`:''}
          ${artist.gender?`<div class="phys-item"><label>Gender</label><span>${artist.gender}</span></div>`:''}
          ${artist.age?`<div class="phys-item"><label>Age</label><span>${artist.age} yrs</span></div>`:''}
        </div>
        ${artist.distinctiveFeatures?`<div style="margin-top:8px;font-size:13px;color:var(--text2);"><b>Distinctive Features:</b> ${artist.distinctiveFeatures}</div>`:''}
      </div>` : ''}

      <!-- Skills -->
      ${Array.isArray(artist.skills)&&artist.skills.length ? `
      <div class="profile-section">
        <h4>Skills</h4>
        <div class="skill-tags">${artist.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>
      </div>` : ''}

      <!-- Languages -->
      ${Array.isArray(artist.languages)&&artist.languages.length ? `
      <div class="profile-section">
        <h4>Languages</h4>
        <div class="skill-tags">${artist.languages.map(l=>`<span class="skill-tag" style="background:rgba(33,150,243,0.15);border-color:var(--info);color:var(--info);">${l}</span>`).join('')}</div>
      </div>` : ''}

      <!-- Portfolio -->
      ${Array.isArray(artist.portfolioLinks)&&artist.portfolioLinks.filter(Boolean).length ? `
      <div class="profile-section">
        <h4>Portfolio / Reel</h4>
        ${artist.portfolioLinks.filter(Boolean).map(link=>`<a href="${link}" target="_blank" class="portfolio-link-item"><i class="fas fa-external-link-alt"></i> ${link}</a>`).join('')}
      </div>` : ''}
    `;
  } catch(err) {
    document.getElementById('artist-detail-content').innerHTML = emptyState('fas fa-exclamation-circle','Could not load profile');
  }
}

async function toggleFollow(artistId, btn) {
  const me = AppState.currentUser;
  if (!me) return;
  const isFollowing = btn.classList.contains('following');
  try {
    if (isFollowing) {
      await API.unfollowUser(me.id, artistId);
      btn.textContent = '+ Follow';
      btn.classList.remove('following');
      showToast('Unfollowed');
    } else {
      await API.followUser(me.id, artistId);
      btn.textContent = '✓ Following';
      btn.classList.add('following');
      showToast('Following! 🌟');
      await API.createNotification({ userId: artistId, type: 'follow', title: 'New Follower', description: `${me.fullName} started following you`, relatedId: me.id });
    }
  } catch(e) { showToast('Action failed', 'error'); }
}

async function startChatWith(userId, name) {
  const me = AppState.currentUser;
  if (!me) return;
  const convId = [me.id, userId].sort().join('_');
  navigateTo('messages');
  setTimeout(() => openChat(convId, userId, name), 200);
}

/* ══════════════════════════════════════════════════════
   APPLY MODAL
══════════════════════════════════════════════════════ */
let applyingCastingId = null;

function openApplyModal(castingId, title) {
  const user = AppState.currentUser;
  if (!user || user.role !== 'artist') { showToast('Only artists can apply for roles', 'error'); return; }
  if (!user.membershipPlan || user.membershipPlan === 'free') {
    // Show inline upgrade prompt
    showToast('👑 Upgrade to a paid plan to apply for casting calls!', 'info');
    setTimeout(() => navigateTo('membership'), 1200);
    return;
  }
  applyingCastingId = castingId;
  document.getElementById('apply-modal-title').textContent = `Apply: ${title}`;
  document.getElementById('quick-cover').value = '';
  document.getElementById('quick-exp').value = user.experience || '';
  document.getElementById('quick-portfolio').value = (user.portfolioLinks||[])[0] || '';
  openModal('apply-modal');
}

document.getElementById('quick-apply-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cover = document.getElementById('quick-cover').value.trim();
  const exp   = document.getElementById('quick-exp').value.trim();
  const port  = document.getElementById('quick-portfolio').value.trim();
  const user  = AppState.currentUser;
  if (!cover) { showToast('Please write a cover message', 'error'); return; }

  showToast('Submitting application...', 'info');
  try {
    const casting = await API.getOne('casting_calls', applyingCastingId);
    await API.submitApplication({
      castingId:          applyingCastingId,
      castingTitle:       casting.title,
      applicantId:        user.id,
      applicantName:      user.fullName,
      applicantAvatar:    user.avatarUrl || getAvatarUrl(user.fullName),
      applicantCategory:  user.category,
      coverMessage:       cover,
      experienceSummary:  exp,
      portfolioLink:      port,
      recruiterId:        casting.recruiterId
    });
    // Increment applicant count
    await API.patch('casting_calls', applyingCastingId, { applicantsCount: (casting.applicantsCount||0) + 1 });
    // Notify recruiter
    await API.createNotification({ userId: casting.recruiterId, type: 'casting', title: 'New Application Received', description: `${user.fullName} applied for "${casting.title}"`, relatedId: applyingCastingId });

    closeModal('apply-modal');
    showToast('Application submitted! 🎉 Good luck!', 'success');
  } catch(err) {
    showToast('Failed to submit. Please try again.', 'error');
    console.error(err);
  }
});

/* ══════════════════════════════════════════════════════
   UPLOAD PAGE (Audition / Post Casting)
══════════════════════════════════════════════════════ */
function renderUpload() {
  const user = AppState.currentUser;
  const isRecruiter = user?.role === 'recruiter';
  document.getElementById('upload-page-title').textContent = isRecruiter ? 'Post Casting Call' : 'Submit Audition';
  document.getElementById('artist-upload-section').style.display = isRecruiter ? 'none' : 'block';
  document.getElementById('recruiter-post-section').style.display = isRecruiter ? 'block' : 'none';

  if (!isRecruiter) {
    // Load casting calls for dropdown
    API.getCastingCalls({ limit: 100 }).then(res => {
      const sel = document.getElementById('casting-select');
      if (!sel) return;
      const calls = (res.data||[]).filter(c => c.isActive);
      sel.innerHTML = '<option value="">Select a casting call...</option>' +
        calls.map(c => `<option value="${c.id}">${c.title} – ${c.company||''}</option>`).join('');
    });
  } else {
    // Build category dropdown
    const sel = document.getElementById('pc-category');
    if (sel && sel.options.length <= 1) {
      CATEGORIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.textContent = `${c.icon} ${c.label}`;
        sel.appendChild(opt);
      });
    }
  }
}

// Upload zone
document.getElementById('upload-zone')?.addEventListener('click', () => document.getElementById('video-upload').click());
document.getElementById('video-upload')?.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    document.getElementById('upload-zone').style.display = 'none';
    document.getElementById('upload-preview').style.display = 'block';
    document.getElementById('preview-filename').textContent = file.name;
  }
});
document.getElementById('remove-video')?.addEventListener('click', () => {
  document.getElementById('video-upload').value = '';
  document.getElementById('upload-zone').style.display = 'block';
  document.getElementById('upload-preview').style.display = 'none';
});

// Submit Audition
document.getElementById('audition-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const castingId = document.getElementById('casting-select').value;
  const role  = document.getElementById('role-desc').value.trim();
  const cover = document.getElementById('cover-note').value.trim();
  if (!castingId) { showToast('Please select a casting call', 'error'); return; }
  if (!cover) { showToast('Please write a cover note', 'error'); return; }

  const user = AppState.currentUser;
  if (user?.membershipPlan === 'free') {
    showToast('Upgrade your plan to submit auditions 👑', 'info');
    setTimeout(() => navigateTo('membership'), 1000);
    return;
  }

  showToast('Submitting audition...', 'info');
  try {
    const casting = await API.getOne('casting_calls', castingId);
    await API.submitApplication({
      castingId, castingTitle: casting.title,
      applicantId: user.id, applicantName: user.fullName,
      applicantAvatar: user.avatarUrl||getAvatarUrl(user.fullName),
      applicantCategory: user.category,
      coverMessage: cover, experienceSummary: role,
      portfolioLink: document.getElementById('aud-portfolio').value.trim(),
      recruiterId: casting.recruiterId
    });
    await API.patch('casting_calls', castingId, { applicantsCount: (casting.applicantsCount||0) + 1 });
    await API.createNotification({ userId: casting.recruiterId, type: 'casting', title: 'New Audition Received', description: `${user.fullName} submitted an audition for "${casting.title}"`, relatedId: castingId });

    showToast('Audition submitted successfully! 🎬', 'success');
    e.target.reset();
    document.getElementById('upload-zone').style.display = 'block';
    document.getElementById('upload-preview').style.display = 'none';
  } catch(err) {
    showToast('Submission failed. Please try again.', 'error');
    console.error(err);
  }
});

// Post Casting Call
document.getElementById('post-casting-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = AppState.currentUser;
  if (user?.membershipPlan === 'free') {
    showToast('Upgrade your plan to post casting calls 👑', 'info');
    setTimeout(() => navigateTo('membership'), 1000);
    return;
  }

  const data = {
    recruiterId:    user.id,
    recruiterName:  user.fullName,
    title:          document.getElementById('pc-title').value.trim(),
    company:        document.getElementById('pc-company').value.trim(),
    category:       document.getElementById('pc-category').value,
    description:    document.getElementById('pc-desc').value.trim(),
    ageMin:         +document.getElementById('pc-age-min').value || null,
    ageMax:         +document.getElementById('pc-age-max').value || null,
    gender:         document.getElementById('pc-gender').value,
    location:       document.getElementById('pc-location').value.trim(),
    budget:         document.getElementById('pc-budget').value.trim(),
    deadline:       document.getElementById('pc-deadline').value,
    requirements:   document.getElementById('pc-requirements').value.split('\n').filter(Boolean),
    isActive: true
  };

  if (!data.title||!data.category) { showToast('Please fill required fields', 'error'); return; }

  showToast('Posting casting call...', 'info');
  try {
    await API.createCastingCall(data);
    showToast('Casting call posted! 🎬', 'success');
    e.target.reset();
    navigateTo('recruiter');
  } catch(err) {
    showToast('Failed to post. Please try again.', 'error');
  }
});

/* ══════════════════════════════════════════════════════
   PROFILE PAGE (Own Profile)
══════════════════════════════════════════════════════ */
async function renderProfile() {
  const user = AppState.currentUser;
  if (!user) return;
  const container = document.getElementById('profile-content');
  if (!container) return;

  const isRecruiter = user.role === 'recruiter';
  const catInfo = getCategoryInfo(user.category);
  let myApps = [];
  let myCastings = [];
  try {
    if (isRecruiter) {
      myCastings = await API.getRecruiterCastings(user.id);
    } else {
      myApps = await API.getApplicationsByUser(user.id);
    }
  } catch(e){}

  const planLabel = user.membershipPlan && user.membershipPlan !== 'free'
    ? `${(user.membershipPlanName||user.membershipPlan).charAt(0).toUpperCase()+(user.membershipPlanName||user.membershipPlan).slice(1)} Plan`
    : 'Free Plan';
  const planIsActive = user.membershipPlan && user.membershipPlan !== 'free';

  container.innerHTML = `
    <div class="profile-hero-card" style="margin-bottom:1.2rem;">
      <div class="profile-cover-grad"></div>
      <div class="artist-detail-top">
        <div style="position:relative;">
          <img src="${user.avatarUrl||getAvatarUrl(user.fullName)}" alt="${user.fullName}" class="artist-detail-avatar" id="profile-main-img" onerror="this.src='${getAvatarUrl(user.fullName)}'"/>
          <button class="edit-avatar-btn" onclick="document.getElementById('profile-photo-input').click()"><i class="fas fa-camera"></i></button>
          <input type="file" id="profile-photo-input" accept="image/*" hidden/>
        </div>
        <div class="artist-detail-actions">
          <button class="btn-outline sm" onclick="openModal('edit-profile-modal');fillEditModal()"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-outline sm" onclick="handleLogout()" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      </div>
      <div class="artist-detail-info">
        <div class="profile-name-wrap">
          <h3>${user.fullName}</h3>
          ${user.isVerified?'<span class="verified-badge"><i class="fas fa-check-circle"></i></span>':''}
          <span class="role-badge ${isRecruiter?'recruiter':''}">${isRecruiter?'🎬 Recruiter':'🎭 Artist'}</span>
        </div>
        <p class="profile-role-text">${catInfo.icon} ${catInfo.label}${user.company?' • '+user.company:''}${user.location?' • '+user.location:''}</p>
        ${user.designation ? `<p style="font-size:12px;color:var(--text3);margin-bottom:6px;">💼 ${user.designation}</p>` : ''}
        <p class="profile-bio">${user.bio||'No bio added yet.'}</p>
      </div>
      <div class="profile-stats">
        <div class="stat"><span class="stat-num">${user.followersCount||0}</span><span class="stat-lbl">Followers</span></div>
        <div class="stat"><span class="stat-num">${user.followingCount||0}</span><span class="stat-lbl">Following</span></div>
        ${isRecruiter
          ? `<div class="stat"><span class="stat-num">${myCastings.length}</span><span class="stat-lbl">Castings</span></div>
             <div class="stat"><span class="stat-num">${myCastings.filter(c=>c.isActive).length}</span><span class="stat-lbl">Active</span></div>`
          : `<div class="stat"><span class="stat-num">${myApps.length}</span><span class="stat-lbl">Applications</span></div>
             <div class="stat"><span class="stat-num">${myApps.filter(a=>a.status==='shortlisted').length}</span><span class="stat-lbl">Shortlisted</span></div>`
        }
      </div>
    </div>

    <!-- Membership -->
    <div class="profile-section membership-section" onclick="navigateTo('membership')" style="cursor:pointer;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <h4>👑 Membership</h4>
          <p style="font-size:14px;margin-top:3px;">
            ${planIsActive
              ? `<span style="color:var(--success);font-weight:600;">✓ ${planLabel} – Active</span>`
              : `<span style="color:var(--warning);">Free Plan – Limited Access</span>`}
          </p>
        </div>
        <button class="btn-primary sm">${planIsActive?'Manage':'Upgrade 👑'}</button>
      </div>
    </div>

    ${!isRecruiter ? `
    <!-- Physical Details -->
    <div class="profile-section">
      <h4>Physical Details</h4>
      <div class="physical-grid">
        ${[['Age', user.age?user.age+' yrs':''],['Height',user.height],['Weight',user.weight],['Hair',user.hairColor],['Eyes',user.eyeColor],['Complexion',user.complexion],['Body Type',user.bodyType],['Gender',user.gender],['Experience',user.experience]].filter(i=>i[1]).map(i=>`<div class="phys-item"><label>${i[0]}</label><span>${i[1]}</span></div>`).join('')}
      </div>
      ${user.distinctiveFeatures ? `<div style="margin-top:10px;font-size:13px;color:var(--text2)"><b>Features:</b> ${user.distinctiveFeatures}</div>` : ''}
    </div>` : ''}

    <!-- Skills -->
    ${Array.isArray(user.skills)&&user.skills.length ? `<div class="profile-section"><h4>Skills</h4><div class="skill-tags">${user.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}

    <!-- Languages -->
    ${Array.isArray(user.languages)&&user.languages.length ? `<div class="profile-section"><h4>Languages</h4><div class="skill-tags">${user.languages.map(l=>`<span class="skill-tag" style="background:rgba(33,150,243,0.15);border-color:var(--info);color:var(--info);">${l}</span>`).join('')}</div></div>` : ''}

    <!-- Portfolio -->
    ${Array.isArray(user.portfolioLinks)&&user.portfolioLinks.filter(Boolean).length ? `
    <div class="profile-section"><h4>Portfolio / Reel</h4>
      ${user.portfolioLinks.filter(Boolean).map(link=>`<a href="${link}" target="_blank" class="portfolio-link-item"><i class="fas fa-external-link-alt"></i> ${link}</a>`).join('')}
    </div>` : ''}

    ${isRecruiter
      ? `<!-- Recruiter: My Casting Calls -->
         <div class="profile-section">
           <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
             <h4>My Casting Calls</h4>
             <button class="btn-primary sm" onclick="navigateTo('upload')"><i class="fas fa-plus"></i> Post</button>
           </div>
           ${myCastings.length ? myCastings.slice(0,5).map(c=>`
             <div class="app-status-item" onclick="showCastingDetail('${c.id}')" style="cursor:pointer;">
               <span class="app-status-title">${c.title}</span>
               <span class="status-pill ${c.isActive?'shortlisted':'rejected'}">${c.isActive?'Active':'Closed'}</span>
             </div>`).join('') : emptyState('fas fa-film','No casting calls posted yet','Post your first casting call')}
         </div>`
      : `<!-- Artist: My Applications -->
         <div class="profile-section">
           <h4>My Applications</h4>
           ${myApps.length ? myApps.map(app=>`
             <div class="app-status-item" onclick="showCastingDetail('${app.castingId}')" style="cursor:pointer;">
               <span class="app-status-title">${app.castingTitle||'Casting Call'}</span>
               <span class="status-pill ${app.status}">${app.status.charAt(0).toUpperCase()+app.status.slice(1)}</span>
             </div>`).join('')
             : emptyState('fas fa-paper-plane','No applications yet','Start applying for casting calls!')}
         </div>`
    }
  `;

  // Profile photo change
  document.getElementById('profile-photo-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = document.getElementById('profile-main-img');
      if (img) img.src = ev.target.result;
      AppState.currentUser.avatarUrl = ev.target.result;
      await API.updateUser(user.id, { avatarUrl: ev.target.result });
      document.getElementById('top-avatar').src = ev.target.result;
      showToast('Profile photo updated ✅', 'success');
    };
    reader.readAsDataURL(file);
  });
}

function fillEditModal() {
  const u = AppState.currentUser;
  document.getElementById('ep-name').value = u.fullName || '';
  document.getElementById('ep-bio').value  = u.bio || '';
  document.getElementById('ep-location').value = u.location || '';
  document.getElementById('ep-portfolio').value = (u.portfolioLinks||[]).filter(Boolean)[0] || '';
}

document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('ep-name').value.trim();
  const bio  = document.getElementById('ep-bio').value.trim();
  const loc  = document.getElementById('ep-location').value.trim();
  const port = document.getElementById('ep-portfolio').value.trim();
  if (!name) { showToast('Name is required', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Saving...'; btn.disabled = true;
  try {
    const updated = await API.updateUser(AppState.currentUser.id, {
      fullName: name, bio, location: loc,
      portfolioLinks: port ? [port] : []
    });
    AppState.currentUser = { ...AppState.currentUser, ...updated };
    closeModal('edit-profile-modal');
    renderProfile();
    updateTopBar();
    showToast('Profile updated ✅', 'success');
  } catch(err) { showToast('Update failed', 'error'); }
  finally { btn.innerHTML='Save Changes <i class="fas fa-save"></i>'; btn.disabled=false; }
});

/* ══════════════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════════════ */
async function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  list.innerHTML = '<div class="spinner"></div>';
  try {
    const notifs = await API.getUserNotifications(AppState.currentUser.id);
    if (!notifs.length) { list.innerHTML = emptyState('fas fa-bell-slash','No notifications yet'); return; }
    const iconMap = { casting:'fas fa-film', message:'fas fa-comment', status:'fas fa-check-circle', follow:'fas fa-user-plus', membership:'fas fa-crown', system:'fas fa-info-circle' };
    const classMap = { casting:'casting', message:'message', status:'status', follow:'view', membership:'casting', system:'message' };
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${!n.isRead?'unread':''}" data-id="${n.id}">
        <div class="notif-icon ${classMap[n.type]||'casting'}"><i class="${iconMap[n.type]||'fas fa-bell'}"></i></div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-desc">${n.description}</div>
          <div class="notif-time">${formatDate(n.created_at)}</div>
        </div>
        ${!n.isRead?'<div class="unread-dot"></div>':''}
      </div>`).join('');

    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const n = notifs.find(x => x.id === item.dataset.id);
        if (n && !n.isRead) {
          await API.patch('notifications', n.id, { isRead: true });
          item.classList.remove('unread');
          item.querySelector('.unread-dot')?.remove();
          loadNotifBadge();
        }
      });
    });
    loadNotifBadge();
  } catch(e) { list.innerHTML = emptyState('fas fa-exclamation-circle','Could not load notifications'); }
}

document.getElementById('mark-all-read')?.addEventListener('click', async () => {
  if (!AppState.currentUser) return;
  await API.markAllNotifRead(AppState.currentUser.id);
  renderNotifications();
  showToast('All marked as read');
});

/* ══════════════════════════════════════════════════════
   RECRUITER DASHBOARD
══════════════════════════════════════════════════════ */
async function renderRecruiter() {
  const user = AppState.currentUser;
  if (!user) return;

  // Stats
  const statsEl = document.getElementById('recruiter-stats');
  if (statsEl) statsEl.innerHTML = '<div class="spinner"></div>';

  try {
    const [castings, applicants] = await Promise.all([
      API.getRecruiterCastings(user.id),
      API.getApplicationsByRecruiter(user.id)
    ]);
    const active = castings.filter(c => c.isActive).length;
    const shortlisted = applicants.filter(a => a.status === 'shortlisted').length;

    if (statsEl) statsEl.innerHTML = `
      <div class="recruiter-stat-card"><div class="rec-stat-icon">🎬</div><div class="rec-stat-num">${castings.length}</div><div class="rec-stat-label">Total Castings</div></div>
      <div class="recruiter-stat-card"><div class="rec-stat-icon">✅</div><div class="rec-stat-num">${active}</div><div class="rec-stat-label">Active Calls</div></div>
      <div class="recruiter-stat-card"><div class="rec-stat-icon">👥</div><div class="rec-stat-num">${applicants.length}</div><div class="rec-stat-label">Total Applicants</div></div>
      <div class="recruiter-stat-card"><div class="rec-stat-icon">⭐</div><div class="rec-stat-num">${shortlisted}</div><div class="rec-stat-label">Shortlisted</div></div>
    `;

    // Castings
    const castingEl = document.getElementById('recruiter-castings');
    if (castingEl) {
      castingEl.innerHTML = castings.length ? castings.map(c => `
        <div class="recruiter-casting-item" onclick="showCastingDetail('${c.id}')" style="cursor:pointer;">
          <div class="rci-header">
            <span class="rci-title">${c.title}</span>
            <span class="rci-status ${c.isActive?'active':'closed'}">${c.isActive?'ACTIVE':'CLOSED'}</span>
          </div>
          <div class="rci-meta"><span><i class="fas fa-map-marker-alt"></i> ${c.location||'N/A'}</span><span><i class="fas fa-calendar"></i> ${daysUntil(c.deadline)}</span></div>
          <div class="rci-applicants">👥 ${c.applicantsCount||0} applicants</div>
        </div>`).join('') : emptyState('fas fa-film','No casting calls posted','Click Post New to add one');
    }

    // Applicants
    const appEl = document.getElementById('recruiter-applicants');
    if (appEl) {
      appEl.innerHTML = applicants.length ? applicants.slice(0,10).map(app => `
        <div class="applicant-card">
          <img src="${app.applicantAvatar||getAvatarUrl(app.applicantName)}" alt="${app.applicantName}" class="av" onclick="showArtistDetail('${app.applicantId}')" style="cursor:pointer;" onerror="this.src='${getAvatarUrl(app.applicantName)}'"/>
          <div class="applicant-info">
            <div class="applicant-name">${app.applicantName}</div>
            <div class="applicant-role" style="font-size:11px;color:var(--text3);">${app.castingTitle||''}</div>
          </div>
          <div class="applicant-actions" id="app-actions-${app.id}">
            ${app.status === 'applied' ? `
              <button class="btn-outline sm" onclick="showArtistDetail('${app.applicantId}')"><i class="fas fa-user"></i></button>
              <button class="btn-accept" onclick="updateAppStatus('${app.id}','shortlisted',this,'${app.applicantId}','${app.applicantName}')">✓ Shortlist</button>
              <button class="btn-reject" onclick="updateAppStatus('${app.id}','rejected',this,'${app.applicantId}','${app.applicantName}')">✗ Reject</button>
            ` : `<span class="status-pill ${app.status}">${app.status.charAt(0).toUpperCase()+app.status.slice(1)}</span>`}
          </div>
        </div>`).join('')
        : emptyState('fas fa-users','No applicants yet','Post a casting call to receive applications');
    }
  } catch(err) {
    console.error(err);
  }
}

async function updateAppStatus(appId, status, btn, artistId, artistName) {
  try {
    await API.updateApplicationStatus(appId, status);
    const actions = btn.parentElement;
    actions.innerHTML = `<span class="status-pill ${status}">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
    const user = AppState.currentUser;
    await API.createNotification({
      userId: artistId, type: 'status',
      title: status === 'shortlisted' ? '🎉 You\'ve been Shortlisted!' : 'Application Update',
      description: status === 'shortlisted' ? `${user.fullName} shortlisted your application!` : `Your application was not selected this time.`,
      relatedId: appId
    });
    showToast(`${artistName} ${status === 'shortlisted' ? 'shortlisted' : 'rejected'} ✓`, status === 'shortlisted' ? 'success' : '');
  } catch(e) { showToast('Update failed', 'error'); }
}

/* ══════════════════════════════════════════════════════
   ANALYTICS / SCALE OVERVIEW
══════════════════════════════════════════════════════ */
async function renderAnalytics() {
  const container = document.getElementById('analytics-content');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const [usersRes, castingsRes, appsRes, theatersRes] = await Promise.all([
      API.get('users', { limit: 1000 }),
      API.get('casting_calls', { limit: 1000 }),
      API.get('applications', { limit: 1000 }),
      API.get('theaters', { limit: 1000 })
    ]);
    const users = usersRes.data || [];
    const castings = castingsRes.data || [];
    const apps = appsRes.data || [];
    const theaters = theatersRes.data || [];

    // Category breakdown
    const catCounts = {};
    users.filter(u=>u.role==='artist').forEach(u => { catCounts[u.category] = (catCounts[u.category]||0)+1; });
    const topCats = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);

    const artists = users.filter(u=>u.role==='artist').length;
    const recruiters = users.filter(u=>u.role==='recruiter').length;
    const premium = users.filter(u=>u.membershipPlan&&u.membershipPlan!=='free').length;
    const activeCastings = castings.filter(c=>c.isActive).length;

    container.innerHTML = `
      <div class="analytics-kpi-grid">
        <div class="kpi-card gold"><i class="fas fa-users"></i><div class="kpi-num">${usersRes.total||users.length}</div><div class="kpi-lbl">Total Users</div></div>
        <div class="kpi-card"><i class="fas fa-theater-masks"></i><div class="kpi-num">${artists}</div><div class="kpi-lbl">Artists</div></div>
        <div class="kpi-card"><i class="fas fa-user-tie"></i><div class="kpi-num">${recruiters}</div><div class="kpi-lbl">Recruiters</div></div>
        <div class="kpi-card gold"><i class="fas fa-crown"></i><div class="kpi-num">${premium}</div><div class="kpi-lbl">Premium Members</div></div>
        <div class="kpi-card"><i class="fas fa-film"></i><div class="kpi-num">${castingsRes.total||castings.length}</div><div class="kpi-lbl">Casting Calls</div></div>
        <div class="kpi-card"><i class="fas fa-check-circle"></i><div class="kpi-num">${activeCastings}</div><div class="kpi-lbl">Active Calls</div></div>
        <div class="kpi-card gold"><i class="fas fa-paper-plane"></i><div class="kpi-num">${appsRes.total||apps.length}</div><div class="kpi-lbl">Applications</div></div>
        <div class="kpi-card"><i class="fas fa-map-marker-alt"></i><div class="kpi-num">${theatersRes.total||theaters.length}</div><div class="kpi-lbl">Theaters Listed</div></div>
      </div>

      <div class="analytics-section">
        <h4>Top Categories on Platform</h4>
        ${topCats.length ? topCats.map(([cat, count]) => {
          const info = getCategoryInfo(cat);
          const pct = artists > 0 ? Math.round((count/artists)*100) : 0;
          return `<div class="cat-bar-item">
            <div class="cat-bar-label">${info.icon} ${info.label}</div>
            <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%"></div></div>
            <div class="cat-bar-count">${count}</div>
          </div>`;
        }).join('') : '<p style="color:var(--text3)">No artist data yet.</p>'}
      </div>

      <div class="analytics-section">
        <h4>Application Status Breakdown</h4>
        ${['applied','shortlisted','rejected','hired'].map(s => {
          const c = apps.filter(a=>a.status===s).length;
          const pct = apps.length > 0 ? Math.round((c/apps.length)*100) : 0;
          return `<div class="cat-bar-item">
            <div class="cat-bar-label" style="text-transform:capitalize;">${s}</div>
            <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%;background:${s==='shortlisted'?'var(--success)':s==='rejected'?'var(--error)':s==='hired'?'var(--gold)':'var(--info)'}"></div></div>
            <div class="cat-bar-count">${c}</div>
          </div>`;
        }).join('')}
      </div>

      <div class="analytics-section">
        <h4>Platform Growth</h4>
        <div class="growth-note"><i class="fas fa-chart-line"></i> Real-time data — updates as users register, post, and apply on the platform.</div>
      </div>
    `;
  } catch(e) {
    container.innerHTML = emptyState('fas fa-exclamation-circle', 'Could not load analytics');
  }
}

/* ── CARD HTML BUILDERS ──────────────────────────── */
function castingCardHTML(c) {
  const catInfo = getCategoryInfo(c.category);
  const urgent  = isUrgent(c.deadline);
  return `
    <div class="casting-card" data-id="${c.id}">
      <div class="card-img-placeholder">${catInfo.icon||'🎬'}</div>
      <div class="card-body">
        <div class="card-badge">${catInfo.label}</div>
        <div class="card-title">${c.title}</div>
        <div class="card-meta"><i class="fas fa-building"></i> ${c.company||''} &nbsp; <i class="fas fa-map-marker-alt"></i> ${c.location||''}</div>
      </div>
      <div class="card-footer">
        <span class="deadline-pill ${urgent?'urgent':''}">${daysUntil(c.deadline)}</span>
        <button class="btn-apply" data-id="${c.id}" data-title="${(c.title||'').replace(/"/g,'')}">Apply</button>
      </div>
    </div>`;
}

function artistResultCardHTML(a) {
  const catInfo = getCategoryInfo(a.category);
  return `
    <div class="artist-result-card" data-id="${a.id}">
      <img src="${a.avatarUrl||getAvatarUrl(a.fullName)}" alt="${a.fullName}" class="arc-img" loading="lazy" onerror="this.src='${getAvatarUrl(a.fullName)}'"/>
      <div class="arc-body">
        <div class="arc-name">${a.fullName}${a.isVerified?'<span class="v-tick"> ✓</span>':''}</div>
        <div class="arc-skill">${catInfo.icon} ${catInfo.label}</div>
        <div class="arc-loc"><i class="fas fa-map-marker-alt"></i> ${a.location||''}</div>
        ${Array.isArray(a.skills)&&a.skills.length ? `<div class="arc-skills">${a.skills.slice(0,2).map(s=>`<span class="mini-tag">${s}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
}

function theaterCardHTML(t) {
  return `
    <div class="theater-card" onclick="navigateTo('theaters')">
      <div class="theater-icon"><i class="fas fa-film"></i></div>
      <div class="theater-info">
        <div class="theater-name">${t.name}</div>
        <div class="theater-type">${t.type}</div>
        <div class="theater-loc"><i class="fas fa-map-marker-alt"></i> ${t.address||''}, ${t.city||''}</div>
      </div>
      ${t.isVerified?'<span class="verified-badge" style="font-size:14px;"><i class="fas fa-check-circle"></i></span>':''}
    </div>`;
}
