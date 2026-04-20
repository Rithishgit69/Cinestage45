/* ============================================================
   CINESTAGE – Theaters & Studios (Real-Time)
   ============================================================ */

let theaterTypeFilter = 'All';

/* ══ RENDER THEATERS PAGE ════════════════════════════ */
async function renderTheaters() {
  buildTheaterTypeChips();
  loadTheatersList();
}

function buildTheaterTypeChips() {
  const c = document.getElementById('theater-type-chips');
  if (!c || c.innerHTML) return;
  c.innerHTML = THEATER_TYPES.map(t => `
    <span class="chip ${t==='All'?'active':''}" data-type="${t}">${t}</span>
  `).join('');
  c.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      c.querySelectorAll('.chip').forEach(ch => ch.classList.remove('active'));
      chip.classList.add('active');
      theaterTypeFilter = chip.dataset.type;
      loadTheatersList();
    });
  });
}

async function loadTheatersList() {
  const container = document.getElementById('theaters-list');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';

  const searchVal = document.getElementById('theater-search')?.value.trim().toLowerCase() || '';

  try {
    let theaters = await API.getTheaters();

    if (theaterTypeFilter !== 'All') {
      theaters = theaters.filter(t => t.type === theaterTypeFilter);
    }
    if (searchVal) {
      theaters = theaters.filter(t =>
        t.name?.toLowerCase().includes(searchVal) ||
        t.city?.toLowerCase().includes(searchVal) ||
        t.address?.toLowerCase().includes(searchVal)
      );
    }

    if (!theaters.length) {
      container.innerHTML = emptyState(
        'fas fa-film',
        'No theaters found',
        'Be the first to add a theater or studio in your area!',
        '+ Add Theater / Studio',
        "openModal('add-theater-modal')"
      );
      return;
    }

    container.innerHTML = theaters.map(t => `
      <div class="theater-full-card">
        <div class="theater-full-header">
          <div class="theater-full-icon"><i class="fas fa-film"></i></div>
          <div class="theater-full-info">
            <div class="theater-full-name">${t.name}${t.isVerified?'<span class="verified-badge" style="font-size:13px;margin-left:4px;"><i class="fas fa-check-circle"></i></span>':''}</div>
            <div class="theater-type-tag">${t.type}</div>
          </div>
        </div>
        <div class="theater-details">
          ${t.address ? `<div class="theater-detail-row"><i class="fas fa-map-marker-alt"></i> ${t.address}${t.city?', '+t.city:''}${t.state?', '+t.state:''}</div>` : ''}
          ${t.phone ? `<div class="theater-detail-row"><i class="fas fa-phone"></i> <a href="tel:${t.phone}" style="color:var(--gold)">${t.phone}</a></div>` : ''}
          ${Array.isArray(t.facilities)&&t.facilities.length ? `<div class="theater-detail-row"><i class="fas fa-star"></i> ${t.facilities.join(' • ')}</div>` : ''}
          <div class="theater-detail-row" style="color:var(--text3);font-size:11px;"><i class="fas fa-clock"></i> Added ${formatDate(t.created_at)}</div>
        </div>
      </div>
    `).join('');
  } catch(e) {
    container.innerHTML = emptyState('fas fa-exclamation-circle', 'Could not load theaters');
  }
}

// Search
document.getElementById('theater-search')?.addEventListener('input', debounce(loadTheatersList, 400));

// Add theater button
document.getElementById('add-theater-btn')?.addEventListener('click', () => openModal('add-theater-modal'));

// Add theater form
document.getElementById('add-theater-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = AppState.currentUser;
  if (!user) { showToast('Please login first', 'error'); return; }

  const name    = document.getElementById('th-name').value.trim();
  const type    = document.getElementById('th-type').value;
  const address = document.getElementById('th-address').value.trim();
  const city    = document.getElementById('th-city').value.trim();
  const state   = document.getElementById('th-state').value.trim();
  const phone   = document.getElementById('th-phone').value.trim();

  if (!name||!type||!address||!city) { showToast('Please fill all required fields', 'error'); return; }

  showToast('Adding theater...', 'info');
  try {
    await API.addTheater({
      name, type, address, city, state, phone,
      facilities: [],
      addedById: user.id
    });
    closeModal('add-theater-modal');
    e.target.reset();
    await loadTheatersList();
    showToast(`${name} added successfully! 🎬`, 'success');
  } catch(err) {
    showToast('Failed to add theater. Please try again.', 'error');
    console.error(err);
  }
});
