/* ============================================================
   CINESTAGE – Authentication & Profile Setup (v2.1)
   ============================================================ */

/* ── STATE ─────────────────────────────────────────── */
const AppState = {
  currentUser: null,
  sessionKey: 'cinestage_session_v2',
  setupData: {}       // Temp store for multi-step setup
};

/* ══ SESSION ════════════════════════════════════════ */
function saveSession(user) {
  AppState.currentUser = user;
  localStorage.setItem(AppState.sessionKey, JSON.stringify({ userId: user.id, email: user.email }));
}

function clearSession() {
  AppState.currentUser = null;
  localStorage.removeItem(AppState.sessionKey);
}

async function restoreSession() {
  try {
    const saved = localStorage.getItem(AppState.sessionKey);
    if (!saved) return false;
    const { userId } = JSON.parse(saved);
    const user = await API.getOne('users', userId);
    if (!user || user.deleted) { clearSession(); return false; }
    AppState.currentUser = user;
    return true;
  } catch(e) { clearSession(); return false; }
}

/* ══ INIT ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  loadTheme();

  // After splash
  setTimeout(async () => {
    hideSplash(async () => {
      const restored = await restoreSession();
      if (restored) {
        const user = AppState.currentUser;
        if (!user.profileComplete) {
          AppState.setupData = { userId: user.id, role: user.role };
          showScreen('setup-screen');
          initSetupWizard();
        } else {
          enterApp();
        }
      } else {
        const seenOnboarding = localStorage.getItem('cs_onboarded');
        showScreen(seenOnboarding ? 'auth-screen' : 'onboarding-screen');
      }
    });
  }, 2800);
});

/* ══ SPLASH ═════════════════════════════════════════ */
function hideSplash(cb) {
  const splash = document.getElementById('splash-screen');
  splash.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  splash.style.opacity = '0';
  splash.style.transform = 'scale(1.05)';
  setTimeout(() => { splash.classList.remove('active'); cb && cb(); }, 500);
}

function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;bottom:${Math.random()*50}%;animation-delay:${Math.random()*3}s;animation-duration:${2+Math.random()*2}s;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;`;
    c.appendChild(p);
  }
}

/* ══ SCREEN SWITCH ══════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

/* ══ ONBOARDING ═════════════════════════════════════ */
let slide = 0;
document.getElementById('next-btn')?.addEventListener('click', () => {
  if (slide < 2) { goSlide(slide + 1); }
  else { localStorage.setItem('cs_onboarded','1'); showScreen('auth-screen'); }
});
document.getElementById('skip-btn')?.addEventListener('click', () => {
  localStorage.setItem('cs_onboarded','1'); showScreen('auth-screen');
});
document.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => goSlide(+d.dataset.dot)));
function goSlide(n) {
  document.querySelectorAll('.slide')[slide]?.classList.remove('active');
  document.querySelectorAll('.dot')[slide]?.classList.remove('active');
  slide = n;
  document.querySelectorAll('.slide')[slide]?.classList.add('active');
  document.querySelectorAll('.dot')[slide]?.classList.add('active');
  const nb = document.getElementById('next-btn');
  if (nb) nb.innerHTML = slide === 2 ? 'Get Started <i class="fas fa-arrow-right"></i>' : 'Next <i class="fas fa-arrow-right"></i>';
}

/* ══ AUTH TABS ══════════════════════════════════════ */
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Show/hide recruiter-only registration fields
    const isRecruiter = btn.dataset.role === 'recruiter';
    const recruiterFields = document.getElementById('recruiter-reg-fields');
    if (recruiterFields) recruiterFields.style.display = isRecruiter ? 'block' : 'none';
  });
});
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab === 'login' ? 'login-form' : 'register-form')?.classList.add('active');
  });
});
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = btn.previousElementSibling;
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.querySelector('i').className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });
});

/* ══ LOGIN ══════════════════════════════════════════ */
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailOrPhone = document.getElementById('login-email').value.trim();
  const password     = document.getElementById('login-password').value;
  if (!emailOrPhone || !password) { showToast('Please fill in all fields', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Logging in...'; btn.disabled = true;
  try {
    let user = await API.findUserByEmail(emailOrPhone);
    if (!user) user = await API.findUserByPhone(emailOrPhone);
    if (!user) { showToast('Account not found. Please register.', 'error'); btn.innerHTML='Login <i class="fas fa-sign-in-alt"></i>'; btn.disabled=false; return; }

    if (user.passwordHash !== btoa(password)) { showToast('Incorrect password', 'error'); btn.innerHTML='Login <i class="fas fa-sign-in-alt"></i>'; btn.disabled=false; return; }

    saveSession(user);
    showToast(`Welcome back, ${user.fullName.split(' ')[0]}! 🎬`, 'success');

    if (!user.profileComplete) {
      AppState.setupData = { userId: user.id, role: user.role };
      showScreen('setup-screen');
      initSetupWizard();
    } else {
      enterApp();
    }
  } catch(err) {
    showToast('Login failed. Please try again.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML='Login <i class="fas fa-sign-in-alt"></i>'; btn.disabled=false;
  }
});

/* ══ REGISTER ═══════════════════════════════════════ */
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass  = document.getElementById('reg-password').value;
  const role  = document.querySelector('.role-btn.active')?.dataset.role || 'artist';
  const company     = document.getElementById('reg-company')?.value.trim() || '';
  const designation = document.getElementById('reg-designation')?.value.trim() || '';

  if (!name||!email||!phone||!pass) { showToast('All fields are required', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
  if (!email.includes('@')) { showToast('Enter a valid email address', 'error'); return; }
  if (role === 'recruiter' && !company) { showToast('Company name is required for recruiters', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  try {
    const existing = await API.findUserByEmail(email);
    if (existing) { showToast('An account with this email already exists', 'error'); return; }

    const user = await API.createUser({
      fullName: name,
      email: email.toLowerCase(),
      phone,
      passwordHash: btoa(pass),
      role,
      company: company || '',
      designation: designation || '',
      avatarUrl: getAvatarUrl(name),
      profileComplete: false
    });

    saveSession(user);
    showToast(`Account created! Let's set up your profile 🎬`, 'success');
    AppState.setupData = { userId: user.id, role, company, designation };
    showScreen('setup-screen');
    initSetupWizard();
  } catch(err) {
    showToast('Registration failed. Please try again.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML='Create Account <i class="fas fa-arrow-right"></i>'; btn.disabled=false;
  }
});

/* ══ GOOGLE SIGN-IN (SIMULATED UI) ══════════════════ */
document.getElementById('google-btn')?.addEventListener('click', () => {
  showToast('Google Sign-In: Please register manually for full profile setup.', 'info');
});

/* ══ FORGOT PASSWORD ════════════════════════════════ */
document.getElementById('forgot-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Password reset link sent to your registered email 📧', 'info');
});

/* ══ LOGOUT ═════════════════════════════════════════ */
function handleLogout() {
  clearSession();
  showScreen('auth-screen');
  showToast('Logged out successfully');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

/* ══════════════════════════════════════════════════════
   PROFILE SETUP WIZARD (6 Steps)
══════════════════════════════════════════════════════ */
let currentSetupStep = 1;
const TOTAL_STEPS = 6;

function initSetupWizard() {
  currentSetupStep = 1;
  goSetupStep(1);
  buildCategoryGrid();
  buildLangCheckboxes();
  buildSkillsCheckboxes('');
  buildSetupPlans('monthly');
  updateSetupProgress();
  adaptWizardForRole();
}

function adaptWizardForRole() {
  const role = AppState.setupData.role || 'artist';
  const isRecruiter = role === 'recruiter';

  // Step 1 text
  const s1h = document.querySelector('#setup-step-1 h2');
  const s1p = document.querySelector('#setup-step-1 p');
  if (isRecruiter) {
    if (s1h) s1h.textContent = 'Your Industry Role';
    if (s1p) s1p.textContent = 'Select the category you recruit for. This helps artists find your casting calls.';
  } else {
    if (s1h) s1h.textContent = "What's Your Role?";
    if (s1p) s1p.textContent = "Select your primary role in the film industry. You can add more later.";
  }

  // Step 2 adjustments
  const step2title = document.getElementById('step2-title');
  const step2sub = document.getElementById('step2-subtitle');
  const artistFields = document.querySelectorAll('.artist-only-field');
  const recruiterFields = document.querySelectorAll('.recruiter-only-field');

  if (isRecruiter) {
    if (step2title) step2title.textContent = 'Company Details';
    if (step2sub) step2sub.textContent = 'Tell artists about yourself and your company.';
    artistFields.forEach(f => { f.style.display = 'none'; f.querySelector('select,input')?.removeAttribute('required'); });
    recruiterFields.forEach(f => { f.style.display = 'block'; });
    const companyInput = document.getElementById('s-company');
    if (companyInput && AppState.setupData.company) companyInput.value = AppState.setupData.company;
    const desigInput = document.getElementById('s-designation');
    if (desigInput && AppState.setupData.designation) desigInput.value = AppState.setupData.designation;
  } else {
    if (step2title) step2title.textContent = 'Personal Details';
    if (step2sub) step2sub.textContent = 'This information helps recruiters find the right talent.';
    artistFields.forEach(f => { f.style.display = 'block'; });
    recruiterFields.forEach(f => { f.style.display = 'none'; });
  }

  // For recruiters, physical step label changes
  const s3h = document.querySelector('#setup-step-3 h2');
  const s3p = document.querySelector('#setup-step-3 p');
  if (isRecruiter) {
    if (s3h) s3h.textContent = 'Profile Details';
    if (s3p) s3p.textContent = 'Optional physical details — skip if not applicable for your role.';
  } else {
    if (s3h) s3h.textContent = 'Physical Details';
    if (s3p) s3p.textContent = 'Physical details help casting directors shortlist the right profile.';
  }
}

function goSetupStep(n) {
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`setup-step-${n}`)?.classList.add('active');
  currentSetupStep = n;
  updateSetupProgress();
  window.scrollTo(0,0);
}

function updateSetupProgress() {
  const pct = ((currentSetupStep-1) / (TOTAL_STEPS-1)) * 100;
  const fill = document.getElementById('setup-progress-fill');
  if (fill) fill.style.width = pct + '%';
  const label = document.getElementById('setup-step-label');
  if (label) label.textContent = `Step ${currentSetupStep} of ${TOTAL_STEPS}`;
}

/* ── STEP 1: Category ──────────────────────────── */
function buildCategoryGrid() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="cat-card" data-cat="${cat.id}" title="${cat.desc}">
      <span class="cat-icon">${cat.icon}</span>
      <span class="cat-label">${cat.label}</span>
    </div>
  `).join('');
  grid.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.cat-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.setupData.category = card.dataset.cat;
      buildSkillsCheckboxes(card.dataset.cat);
    });
  });
  // Pre-select if exists
  if (AppState.setupData.category) {
    grid.querySelector(`[data-cat="${AppState.setupData.category}"]`)?.classList.add('selected');
  }
}

document.getElementById('step1-next')?.addEventListener('click', () => {
  if (!AppState.setupData.category) { showToast('Please select your category', 'error'); return; }
  goSetupStep(2);
});

/* ── STEP 2: Personal Info ──────────────────────── */
function buildLangCheckboxes() {
  const c = document.getElementById('lang-checkboxes');
  if (!c) return;
  c.innerHTML = LANGUAGES.map(l => `
    <label class="checkbox-label"><input type="checkbox" value="${l}"/>${l}</label>
  `).join('');
}

document.getElementById('personal-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const role = AppState.setupData.role || 'artist';
  const isRecruiter = role === 'recruiter';

  const age      = +document.getElementById('s-age').value;
  const gender   = document.getElementById('s-gender').value;
  const location = document.getElementById('s-location').value.trim();
  const langs    = [...document.querySelectorAll('#lang-checkboxes input:checked')].map(c => c.value);

  if (!age||age<5||age>99) { showToast('Enter a valid age (5–99)', 'error'); return; }
  if (!gender)   { showToast('Please select gender', 'error'); return; }
  if (!location) { showToast('Please enter your location', 'error'); return; }
  if (langs.length===0) { showToast('Please select at least one language', 'error'); return; }

  if (isRecruiter) {
    const company = document.getElementById('s-company')?.value.trim();
    if (!company) { showToast('Please enter your company name', 'error'); return; }
    Object.assign(AppState.setupData, { age, gender, location, languages: langs, company, designation: document.getElementById('s-designation')?.value.trim() || '' });
  } else {
    const exp = document.getElementById('s-experience').value;
    if (!exp) { showToast('Please select experience level', 'error'); return; }
    Object.assign(AppState.setupData, { age, gender, location, experience: exp, languages: langs });
  }
  goSetupStep(3);
});

/* ── STEP 3: Physical Details ─────────────────── */
document.getElementById('physical-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  Object.assign(AppState.setupData, {
    height: document.getElementById('s-height').value.trim(),
    weight: document.getElementById('s-weight').value.trim(),
    hairColor: document.getElementById('s-hair').value,
    eyeColor: document.getElementById('s-eye').value,
    complexion: document.getElementById('s-complexion').value,
    bodyType: document.getElementById('s-body').value,
    distinctiveFeatures: document.getElementById('s-features').value.trim()
  });
  goSetupStep(4);
});

/* ── STEP 4: Skills & Bio ─────────────────────── */
function buildSkillsCheckboxes(catId) {
  const c = document.getElementById('skills-checkboxes');
  if (!c) return;
  const skills = SKILLS_BY_CATEGORY[catId] || SKILLS_BY_CATEGORY['actor'];
  c.innerHTML = skills.map(s => `
    <label class="checkbox-label"><input type="checkbox" value="${s}"/>${s}</label>
  `).join('');
}

const bioInput = document.getElementById('s-bio');
if (bioInput) {
  bioInput.addEventListener('input', () => {
    const len = bioInput.value.length;
    const cc = document.getElementById('bio-char');
    if (cc) cc.textContent = `${len} / 500`;
    bioInput.style.borderColor = len >= 50 ? 'var(--success)' : '';
  });
}

document.getElementById('skills-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const skills = [...document.querySelectorAll('#skills-checkboxes input:checked')].map(c => c.value);
  const bio    = document.getElementById('s-bio').value.trim();
  const portfolio = document.getElementById('s-portfolio').value.trim();

  if (skills.length === 0) { showToast('Please select at least one skill', 'error'); return; }
  if (bio.length < 30) { showToast('Please write a bio of at least 30 characters', 'error'); return; }

  Object.assign(AppState.setupData, { skills, bio, portfolioLinks: portfolio ? [portfolio] : [] });
  goSetupStep(5);
});

/* ── STEP 5: Photo ────────────────────────────── */
let uploadedPhotoBase64 = null;

document.getElementById('photo-upload-btn')?.addEventListener('click', () => {
  document.getElementById('photo-file-input').click();
});

document.getElementById('photo-file-input')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedPhotoBase64 = ev.target.result;
    const img = document.getElementById('photo-preview-img');
    const placeholder = document.getElementById('photo-placeholder');
    img.src = uploadedPhotoBase64;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    showToast('Photo uploaded ✅', 'success');
  };
  reader.readAsDataURL(file);
});

document.getElementById('skip-photo-btn')?.addEventListener('click', () => {
  uploadedPhotoBase64 = null;
  goSetupStep(6);
  buildSetupPlans('monthly');
});

document.getElementById('step5-next')?.addEventListener('click', () => {
  if (uploadedPhotoBase64) {
    AppState.setupData.avatarUrl = uploadedPhotoBase64;
  }
  goSetupStep(6);
  buildSetupPlans('monthly');
});

/* ── STEP 6: Membership ────────────────────────── */
function buildSetupPlans(duration) {
  const grid = document.getElementById('setup-plans-grid');
  if (!grid) return;
  buildPlanGrid(grid, duration, true);
  // Set active tab
  document.querySelectorAll('#setup-plan-tabs .plan-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.duration === duration);
  });
}

document.getElementById('setup-plan-tabs')?.addEventListener('click', (e) => {
  const tab = e.target.closest('.plan-tab');
  if (tab) buildSetupPlans(tab.dataset.duration);
});

/* ── SAVE PROFILE & CONTINUE ─────────────────── */
async function completeProfileSetup(planId, planDuration, planPrice, planName) {
  showToast('Saving your profile...', 'info');
  try {
    const userId = AppState.setupData.userId;
    const role = AppState.setupData.role || 'artist';
    const cat = getCategoryInfo(AppState.setupData.category);

    const updateData = {
      category:             AppState.setupData.category,
      age:                  AppState.setupData.age,
      gender:               AppState.setupData.gender,
      location:             AppState.setupData.location,
      experience:           AppState.setupData.experience || '',
      languages:            AppState.setupData.languages || [],
      height:               AppState.setupData.height || '',
      weight:               AppState.setupData.weight || '',
      hairColor:            AppState.setupData.hairColor || '',
      eyeColor:             AppState.setupData.eyeColor || '',
      complexion:           AppState.setupData.complexion || '',
      bodyType:             AppState.setupData.bodyType || '',
      distinctiveFeatures:  AppState.setupData.distinctiveFeatures || '',
      skills:               AppState.setupData.skills || [],
      bio:                  AppState.setupData.bio || '',
      portfolioLinks:       AppState.setupData.portfolioLinks || [],
      avatarUrl:            AppState.setupData.avatarUrl || getAvatarUrl(AppState.currentUser?.fullName || 'User'),
      company:              AppState.setupData.company || '',
      designation:          AppState.setupData.designation || '',
      membershipPlan:       'free',
      profileComplete:      true
    };

    const updated = await API.updateUser(userId, updateData);
    AppState.currentUser = { ...AppState.currentUser, ...updated };
    saveSession(AppState.currentUser);

    // If paid plan, go to payment
    if (planPrice && planPrice > 0) {
      const plan = { id: planId, name: planName, price: planPrice };
      showPaymentScreen(plan, planDuration);
      return;
    }

    await API.createNotification({
      userId,
      type: 'system',
      title: 'Welcome to CineStage! 🎬',
      description: role === 'recruiter'
        ? `Your recruiter profile is live. Start posting casting calls!`
        : `Your ${cat.label} profile is live. Start exploring casting calls!`,
      relatedId: userId
    });

    showToast(`Profile complete! Welcome to CineStage 🎉`, 'success');
    enterApp();
  } catch(err) {
    showToast('Error saving profile. Please try again.', 'error');
    console.error(err);
  }
}
