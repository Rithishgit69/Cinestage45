/* ============================================================
   CINESTAGE – Membership Plans & Payment (v2.1)
   ============================================================ */

let selectedPlan = null;
let selectedDuration = 'monthly';

/* ══ RENDER MEMBERSHIP PAGE ══════════════════════════ */
function renderMembership() {
  initMainPlanTabs();
  renderCurrentPlanInfo();
}

let mainPlanTabsInit = false;
function initMainPlanTabs() {
  if (!mainPlanTabsInit) {
    document.getElementById('main-plan-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.plan-tab');
      if (!tab) return;
      const dur = tab.dataset.duration;
      document.querySelectorAll('#main-plan-tabs .plan-tab').forEach(t => t.classList.toggle('active', t===tab));
      buildPlanGrid(document.getElementById('main-plans-grid'), dur, false);
      selectedDuration = dur;
    });
    mainPlanTabsInit = true;
  }
  buildPlanGrid(document.getElementById('main-plans-grid'), 'monthly', false);
  // Reset tabs to monthly
  document.querySelectorAll('#main-plan-tabs .plan-tab').forEach(t => t.classList.toggle('active', t.dataset.duration==='monthly'));
}

function renderCurrentPlanInfo() {
  const user = AppState.currentUser;
  if (!user) return;
  const el = document.getElementById('current-plan-info');
  if (!el) return;
  const plan = user.membershipPlan || 'free';
  if (plan === 'free') {
    el.innerHTML = `<div class="current-plan-card free">
      <i class="fas fa-info-circle" style="color:var(--warning);font-size:24px;flex-shrink:0;"></i>
      <div><strong>You're on the Free Plan</strong><p>Upgrade to unlock unlimited applications, messaging, and more.</p></div>
    </div>`;
  } else {
    const expText = user.membershipExpiry ? `Expires: ${formatDate(+new Date(user.membershipExpiry))}` : 'Active';
    el.innerHTML = `<div class="current-plan-card active">
      <i class="fas fa-crown" style="color:var(--gold);font-size:24px;flex-shrink:0;"></i>
      <div><strong>Active: ${plan.charAt(0).toUpperCase()+plan.slice(1)} Plan ✓</strong>
      <p>${expText}. Enjoy full platform access.</p></div>
    </div>`;
  }
}

/* ══ BUILD PLAN GRID ══════════════════════════════════ */
function buildPlanGrid(container, duration, isSetup) {
  if (!container) return;
  selectedDuration = duration;

  const plans = MEMBERSHIP_PLANS[duration] || MEMBERSHIP_PLANS['monthly'];

  container.innerHTML = plans.map(plan => `
    <div class="plan-card ${plan.popular?'popular':''} ${plan.highlight?'highlight':''}">
      ${plan.popular ? '<div class="popular-badge">🔥 Most Popular</div>' : ''}
      ${plan.highlight ? '<div class="popular-badge elite">✨ Best Value</div>' : ''}
      <div class="plan-name">${plan.name}</div>
      <div class="plan-duration-lbl">${duration.replace('-',' ')}</div>
      <div class="plan-price">₹${plan.price}<span class="plan-price-period">/${getDurationLabel(duration)}</span></div>
      <div class="plan-features">
        ${plan.features.map(f => `<div class="plan-feature"><i class="fas fa-check"></i> ${f}</div>`).join('')}
      </div>
      <button class="btn-primary full plan-choose-btn" 
        data-plan-id="${plan.id}"
        data-plan-name="${plan.name}"
        data-plan-price="${plan.price}"
        data-plan-duration="${duration}"
        data-is-setup="${isSetup}">
        Choose ${plan.name}
      </button>
    </div>
  `).join('') + `
    <div class="plan-card free-plan-card">
      <div class="plan-name">Free</div>
      <div class="plan-duration-lbl">Forever</div>
      <div class="plan-price">₹0<span class="plan-price-period">/always</span></div>
      <div class="plan-features">
        <div class="plan-feature"><i class="fas fa-check"></i> Browse Casting Calls</div>
        <div class="plan-feature"><i class="fas fa-check"></i> Basic Profile</div>
        <div class="plan-feature"><i class="fas fa-times" style="color:var(--error)"></i> Apply for Roles</div>
        <div class="plan-feature"><i class="fas fa-times" style="color:var(--error)"></i> Send Messages</div>
        <div class="plan-feature"><i class="fas fa-times" style="color:var(--error)"></i> Post Casting Calls</div>
      </div>
      <button class="btn-outline full" 
        data-plan-id="free"
        data-plan-name="Free"
        data-plan-price="0"
        data-plan-duration="free"
        data-is-setup="${isSetup}">
        Continue Free
      </button>
    </div>
  `;

  // Attach click handlers to all plan buttons
  container.querySelectorAll('[data-plan-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId   = btn.dataset.planId;
      const planName = btn.dataset.planName;
      const price    = +btn.dataset.planPrice;
      const dur      = btn.dataset.planDuration;
      const setup    = btn.dataset.isSetup === 'true';
      handlePlanChoice(planId, planName, price, dur, setup);
    });
  });
}

function getDurationLabel(duration) {
  const map = { weekly:'week', monthly:'month', quarterly:'3 months', 'half-yearly':'6 months', yearly:'year', free:'always' };
  return map[duration] || duration;
}

function handlePlanChoice(planId, planName, price, duration, isSetup) {
  if (price === 0 || planId === 'free') {
    if (isSetup) {
      completeProfileSetup(null, duration, 0, null);
    } else {
      showToast("You're on the Free Plan. Upgrade anytime!");
    }
    return;
  }

  selectedPlan = { id: planId, name: planName, price };
  selectedDuration = duration;

  if (isSetup) {
    // Save profile first, then go to payment
    completeProfileSetup(planId, duration, price, planName);
  } else {
    showPaymentScreen({ id: planId, name: planName, price }, duration);
  }
}

/* ══ PAYMENT SCREEN ═══════════════════════════════════ */
function showPaymentScreen(plan, duration) {
  if (!plan) return;
  selectedPlan = plan;
  selectedDuration = duration;

  const summary = document.getElementById('payment-summary');
  if (summary) {
    summary.innerHTML = `
      <div class="pay-summary-card">
        <div class="pay-summary-row"><span>Plan</span><strong>${plan.name} (${duration.replace('-',' ')})</strong></div>
        <div class="pay-summary-row"><span>Duration</span><strong>${getDurationLabel(duration)}</strong></div>
        <div class="pay-summary-row total-row"><span>Total Amount</span><strong style="color:var(--gold);font-size:24px;">₹${plan.price}</strong></div>
        <div class="pay-summary-row" style="color:var(--text3);font-size:12px;border:none;padding-top:4px;"><span>🔒 Instant activation after payment</span><span>100% Secure</span></div>
      </div>`;
  }

  // Reset payment method
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
  document.querySelector('.pay-method[data-method="upi"]')?.classList.add('active');
  document.querySelectorAll('.pay-form').forEach(f => f.classList.remove('active'));
  document.getElementById('pay-upi')?.classList.add('active');

  showScreen('payment-screen');
}

// Payment method toggle
document.querySelectorAll('.pay-method').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.pay-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`pay-${btn.dataset.method}`)?.classList.add('active');
  });
});

// Card number formatting
document.getElementById('card-num')?.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19);
});
document.getElementById('card-exp')?.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1/$2').slice(0,5);
});

// Pay Now
document.getElementById('pay-now-btn')?.addEventListener('click', async () => {
  if (!selectedPlan) return;
  const activeMethod = document.querySelector('.pay-method.active')?.dataset.method;

  // Validate
  if (activeMethod === 'upi') {
    const upi = document.getElementById('upi-id').value.trim();
    if (!upi || !upi.includes('@')) { showToast('Enter a valid UPI ID (e.g. name@upi)', 'error'); return; }
  } else if (activeMethod === 'card') {
    const num = document.getElementById('card-num').value.replace(/\s/g,'');
    if (num.length < 16) { showToast('Enter a valid 16-digit card number', 'error'); return; }
    if (!document.getElementById('card-exp').value) { showToast('Enter card expiry', 'error'); return; }
    if (!document.getElementById('card-cvv').value) { showToast('Enter CVV', 'error'); return; }
  } else if (activeMethod === 'netbanking') {
    if (!document.getElementById('bank-select').value) { showToast('Please select a bank', 'error'); return; }
  }

  const btn = document.getElementById('pay-now-btn');
  const origText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></span> Processing...';
  btn.disabled = true;

  await new Promise(r => setTimeout(r, 2200));

  try {
    const user = AppState.currentUser;
    const days = PLAN_DURATION_DAYS[selectedDuration] || 30;
    const expiry = new Date(Date.now() + days * 86400000).toISOString();
    const txnId = 'TXN' + Date.now();

    await API.createMembershipOrder({
      userId: user.id, userName: user.fullName,
      plan: selectedDuration, planName: selectedPlan.name,
      category: user.category, role: user.role,
      amount: selectedPlan.price, status: 'active',
      startDate: new Date().toISOString(), expiryDate: expiry,
      transactionId: txnId
    });

    const updated = await API.updateUser(user.id, {
      membershipPlan: selectedDuration,
      membershipExpiry: expiry,
      membershipPlanName: selectedPlan.name,
      profileComplete: true
    });
    AppState.currentUser = { ...user, ...updated };
    saveSession(AppState.currentUser);

    await API.createNotification({
      userId: user.id, type: 'membership',
      title: `👑 ${selectedPlan.name} Plan Activated!`,
      description: `Your ${selectedDuration} ${selectedPlan.name} membership is now active. Enjoy unlimited access!`,
      relatedId: txnId
    });

    showToast(`🎉 Payment successful! ${selectedPlan.name} plan is now active!`, 'success');
    // Reset payment form
    document.getElementById('upi-id').value = '';
    showScreen('app');
    enterApp();

  } catch(e) {
    btn.innerHTML = origText;
    btn.disabled = false;
    showToast('Payment failed. Please try again.', 'error');
    console.error(e);
  }
});
