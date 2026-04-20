/* ============================================================
   CINESTAGE – Real-Time Chat (API-backed)
   ============================================================ */

let activeConvId  = null;
let activeOtherId = null;
let activeName    = null;
let chatPollTimer = null;

/* ══ RENDER MESSAGES PAGE ════════════════════════════ */
async function renderMessages() {
  const user = AppState.currentUser;
  if (!user) return;
  loadConversations();
}

async function loadConversations() {
  const listEl = document.getElementById('chat-list-items');
  if (!listEl) return;
  listEl.innerHTML = '<div class="spinner" style="margin:2rem auto;"></div>';
  try {
    const convs = await API.getUserConversations(AppState.currentUser.id);
    if (!convs.length) {
      listEl.innerHTML = emptyState('fas fa-comment-slash','No conversations yet','Find an artist and start chatting!');
      return;
    }
    listEl.innerHTML = convs.map(conv => `
      <div class="chat-list-item ${conv.unread?'unread':''}" data-conv="${conv.conversationId}" data-other="${conv.otherId}" data-name="${conv.otherName}">
        <img src="${getAvatarUrl(conv.otherName)}" alt="${conv.otherName}" class="chat-list-avatar" onerror="this.src='${getAvatarUrl(conv.otherName)}'"/>
        <div class="chat-list-info">
          <div class="chat-list-name">${conv.otherName}${conv.unread?'<span class="unread-dot" style="display:inline-block;margin-left:4px;"></span>':''}</div>
          <div class="chat-list-preview">${conv.lastMessage||''}</div>
        </div>
        <div class="chat-list-time">${formatDate(conv.lastTime)}</div>
      </div>
    `).join('');

    listEl.querySelectorAll('.chat-list-item').forEach(item => {
      item.addEventListener('click', () => {
        listEl.querySelectorAll('.chat-list-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        openChat(item.dataset.conv, item.dataset.other, item.dataset.name);
        // Mobile: hide list
        document.getElementById('chat-list')?.classList.add('hidden');
      });
    });
  } catch(e) {
    listEl.innerHTML = emptyState('fas fa-exclamation-circle','Could not load conversations');
  }
}

/* ══ OPEN CHAT ════════════════════════════════════════ */
async function openChat(convId, otherId, otherName) {
  activeConvId  = convId;
  activeOtherId = otherId;
  activeName    = otherName;

  // Get avatar for the other user
  let otherAvatar = getAvatarUrl(otherName);
  try {
    const other = await API.getOne('users', otherId);
    otherAvatar = other.avatarUrl || getAvatarUrl(otherName);
    otherName   = other.fullName || otherName;
  } catch(e) {}

  document.getElementById('chat-empty').style.display  = 'none';
  document.getElementById('chat-active').style.display = 'flex';
  document.getElementById('chat-avatar').src = otherAvatar;
  document.getElementById('chat-avatar').onerror = () => { document.getElementById('chat-avatar').src = getAvatarUrl(otherName); };
  document.getElementById('chat-name').textContent = otherName;

  await API.markConvRead(convId, AppState.currentUser.id);
  await loadChatMessages();
  startChatPolling();
  loadConversations();
}

async function loadChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container || !activeConvId) return;
  try {
    const msgs = await API.getMessages(activeConvId);
    const me   = AppState.currentUser.id;
    container.innerHTML = msgs.length ? msgs.map(m => `
      <div class="chat-msg ${m.senderId === me ? 'sent' : 'recv'}">
        ${escapeHtml(m.text)}
        <span class="msg-time">${formatDate(m.created_at)}</span>
      </div>
    `).join('') : '<div style="text-align:center;color:var(--text3);padding:2rem;font-size:13px;">Start the conversation!</div>';
    container.scrollTop = container.scrollHeight;
  } catch(e) {}
}

function startChatPolling() {
  clearInterval(chatPollTimer);
  chatPollTimer = setInterval(async () => {
    if (activeConvId) await loadChatMessages();
  }, 5000); // Poll every 5 seconds for new messages
}

/* ══ SEND MESSAGE ════════════════════════════════════ */
document.getElementById('send-btn')?.addEventListener('click', doSendMessage);
document.getElementById('message-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSendMessage(); }
});

async function doSendMessage() {
  const input = document.getElementById('message-input');
  const text  = input?.value.trim();
  if (!text || !activeConvId || !activeOtherId) return;
  input.value = '';

  const me = AppState.currentUser;
  try {
    await API.sendMessage({
      conversationId: activeConvId,
      senderId:   me.id,
      senderName: me.fullName,
      receiverId: activeOtherId,
      receiverName: activeName,
      text
    });
    await loadChatMessages();
    // Notify receiver
    await API.createNotification({
      userId: activeOtherId, type: 'message',
      title: `New message from ${me.fullName}`,
      description: text.slice(0, 80),
      relatedId: activeConvId
    });
    loadConversations();
  } catch(e) {
    input.value = text; // Restore on failure
    showToast('Failed to send message', 'error');
  }
}

/* ══ BACK BUTTON (Mobile) ════════════════════════════ */
document.getElementById('back-chat-btn')?.addEventListener('click', () => {
  clearInterval(chatPollTimer);
  document.getElementById('chat-list')?.classList.remove('hidden');
  document.getElementById('chat-active').style.display = 'none';
  document.getElementById('chat-empty').style.display  = 'flex';
  activeConvId = null;
});

/* ══ CALL SIMULATION ════════════════════════════════ */
document.getElementById('call-btn')?.addEventListener('click', () => showCallOverlay(activeName, 'audio'));
document.getElementById('video-btn')?.addEventListener('click', () => showCallOverlay(activeName, 'video'));

function showCallOverlay(name, type) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;animation:fade-in 0.3s;';
  overlay.innerHTML = `
    <div style="font-size:70px;border-radius:50%;width:120px;height:120px;background:var(--gold-dim);display:flex;align-items:center;justify-content:center;">👤</div>
    <h2 style="color:#fff;font-size:22px;">${name||'Contact'}</h2>
    <p id="call-status-text" style="color:rgba(255,255,255,0.5);font-size:14px;">${type==='video'?'📹 Calling...':'📞 Calling...'}</p>
    <button onclick="this.closest('div[style]').remove();showToast('Call ended');" style="margin-top:20px;width:60px;height:60px;border-radius:50%;background:#f44336;border:none;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">📵</button>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    const st = overlay.querySelector('#call-status-text');
    if (st) { st.textContent = type==='video'?'📹 Connected':'📞 Connected'; st.style.color = 'var(--success, #4caf50)'; }
  }, 2000);
}

/* ── HELPERS ────────────────────────────────────────── */
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
