/* ============================================================
   CINESTAGE – Real-Time API Layer (RESTful Table API)
   ============================================================ */

const API = {

  /* ── GENERIC CRUD ──────────────────────────────── */
  async get(table, params = {}) {
    const q = new URLSearchParams({ limit: 100, ...params }).toString();
    const res = await fetch(`${CONFIG.API_BASE}/${table}?${q}`);
    if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
    return res.json();
  },

  async getOne(table, id) {
    const res = await fetch(`${CONFIG.API_BASE}/${table}/${id}`);
    if (!res.ok) throw new Error(`GET ${table}/${id} failed`);
    return res.json();
  },

  async post(table, data) {
    const res = await fetch(`${CONFIG.API_BASE}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${table} failed: ${res.status}`);
    return res.json();
  },

  async put(table, id, data) {
    const res = await fetch(`${CONFIG.API_BASE}/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PUT ${table}/${id} failed`);
    return res.json();
  },

  async patch(table, id, data) {
    const res = await fetch(`${CONFIG.API_BASE}/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PATCH ${table}/${id} failed`);
    return res.json();
  },

  async delete(table, id) {
    const res = await fetch(`${CONFIG.API_BASE}/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${table}/${id} failed`);
    return true;
  },

  /* ── USERS ─────────────────────────────────────── */
  async findUserByEmail(email) {
    const res = await this.get('users', { search: email, limit: 10 });
    return (res.data || []).find(u => u.email === email) || null;
  },

  async findUserByPhone(phone) {
    const res = await this.get('users', { search: phone, limit: 10 });
    return (res.data || []).find(u => u.phone === phone) || null;
  },

  async createUser(data) {
    return this.post('users', { ...data, followersCount: 0, followingCount: 0, membershipPlan: 'free', profileComplete: false, isVerified: false });
  },

  async updateUser(id, data) {
    return this.patch('users', id, data);
  },

  async getUsers(params = {}) {
    return this.get('users', params);
  },

  /* ── CASTING CALLS ─────────────────────────────── */
  async getCastingCalls(params = {}) {
    return this.get('casting_calls', { ...params, sort: 'created_at' });
  },

  async createCastingCall(data) {
    return this.post('casting_calls', { ...data, applicantsCount: 0, isActive: true });
  },

  async getRecruiterCastings(recruiterId) {
    const res = await this.get('casting_calls', { limit: 100 });
    return (res.data || []).filter(c => c.recruiterId === recruiterId);
  },

  /* ── APPLICATIONS ──────────────────────────────── */
  async submitApplication(data) {
    return this.post('applications', { ...data, status: 'applied' });
  },

  async getApplicationsByUser(userId) {
    const res = await this.get('applications', { limit: 100 });
    return (res.data || []).filter(a => a.applicantId === userId);
  },

  async getApplicationsByCasting(castingId) {
    const res = await this.get('applications', { limit: 100 });
    return (res.data || []).filter(a => a.castingId === castingId);
  },

  async getApplicationsByRecruiter(recruiterId) {
    const res = await this.get('applications', { limit: 100 });
    return (res.data || []).filter(a => a.recruiterId === recruiterId);
  },

  async updateApplicationStatus(id, status) {
    return this.patch('applications', id, { status });
  },

  /* ── MESSAGES ──────────────────────────────────── */
  async getMessages(conversationId) {
    const res = await this.get('messages', { limit: 200 });
    return (res.data || []).filter(m => m.conversationId === conversationId).sort((a,b) => a.created_at - b.created_at);
  },

  async sendMessage(data) {
    return this.post('messages', { ...data, isRead: false });
  },

  async getUserConversations(userId) {
    const res = await this.get('messages', { limit: 500 });
    const msgs = res.data || [];
    const convMap = {};
    msgs.forEach(m => {
      if (m.senderId === userId || m.receiverId === userId) {
        const convId = m.conversationId;
        if (!convMap[convId] || m.created_at > convMap[convId].lastTime) {
          const otherId   = m.senderId === userId ? m.receiverId : m.senderId;
          const otherName = m.senderId === userId ? m.receiverName : m.senderName;
          convMap[convId] = { conversationId: convId, otherId, otherName, lastMessage: m.text, lastTime: m.created_at, unread: !m.isRead && m.receiverId === userId };
        }
      }
    });
    return Object.values(convMap).sort((a,b) => b.lastTime - a.lastTime);
  },

  async markConvRead(conversationId, userId) {
    const res = await this.get('messages', { limit: 200 });
    const unread = (res.data || []).filter(m => m.conversationId === conversationId && m.receiverId === userId && !m.isRead);
    await Promise.all(unread.map(m => this.patch('messages', m.id, { isRead: true })));
  },

  /* ── NOTIFICATIONS ─────────────────────────────── */
  async getUserNotifications(userId) {
    const res = await this.get('notifications', { limit: 50 });
    return (res.data || []).filter(n => n.userId === userId).sort((a,b) => b.created_at - a.created_at);
  },

  async createNotification(data) {
    return this.post('notifications', { ...data, isRead: false });
  },

  async markAllNotifRead(userId) {
    const notifs = await this.getUserNotifications(userId);
    const unread = notifs.filter(n => !n.isRead);
    await Promise.all(unread.map(n => this.patch('notifications', n.id, { isRead: true })));
  },

  /* ── THEATERS ──────────────────────────────────── */
  async getTheaters(city = '') {
    const res = await this.get('theaters', { limit: 100 });
    const all = res.data || [];
    if (!city) return all;
    return all.filter(t => t.city?.toLowerCase().includes(city.toLowerCase()));
  },

  async addTheater(data) {
    return this.post('theaters', { ...data, isVerified: false, rating: 0 });
  },

  /* ── FOLLOWS ────────────────────────────────────── */
  async followUser(followerId, followingId) {
    const existing = await this.get('follows', { limit: 200 });
    const already = (existing.data || []).find(f => f.followerId === followerId && f.followingId === followingId);
    if (already) return already;
    return this.post('follows', { followerId, followingId });
  },

  async unfollowUser(followerId, followingId) {
    const existing = await this.get('follows', { limit: 200 });
    const found = (existing.data || []).find(f => f.followerId === followerId && f.followingId === followingId);
    if (found) await this.delete('follows', found.id);
  },

  async isFollowing(followerId, followingId) {
    const existing = await this.get('follows', { limit: 200 });
    return !!(existing.data || []).find(f => f.followerId === followerId && f.followingId === followingId);
  },

  /* ── MEMBERSHIP ─────────────────────────────────── */
  async createMembershipOrder(data) {
    return this.post('membership_orders', data);
  },

  async getStatsCounts() {
    const [users, castings, apps, theaters] = await Promise.all([
      this.get('users', { limit: 1 }),
      this.get('casting_calls', { limit: 1 }),
      this.get('applications', { limit: 1 }),
      this.get('theaters', { limit: 1 })
    ]);
    return {
      users: users.total || 0,
      castings: castings.total || 0,
      applications: apps.total || 0,
      theaters: theaters.total || 0
    };
  }
};
