# 🎬 CineStage – India's Premier Film Industry Platform

A fully interactive, production-style web application for the Indian film industry connecting artists, crew members, and recruiters in real time.

---

## 🔗 Application Links

| Link | URL | Description |
|------|-----|-------------|
| **Dashboard (Main App)** | `index.html` | The main CineStage app for artists, crew & recruiters |
| **Admin Panel** | `admin/index.html` | Separate admin panel — manage all users, castings, data |

### How to Access Admin Panel
1. **From the main app:** Open the side menu (☰) → scroll to bottom → click **"Admin Panel"** link  
2. **Direct URL:** Navigate to `admin/index.html` (opens in a new tab)
3. **Floating Button:** A gold 🛡 **Admin** button is pinned at bottom-right of the main app screen

### Admin Panel Login
- **Username:** `admin`
- **Password:** `cinestage@admin123`

---

## ✅ Completed Features

### 🔐 Authentication
- User Registration (Artist / Crew + Recruiter roles)
- Email/Phone Login with password hashing (btoa)
- Role-based toggle at registration (Artist vs Recruiter)
- Recruiter-specific registration fields (Company, Designation)
- Session persistence via localStorage
- Logout with session cleanup

### 📋 Profile Setup Wizard (6 Steps)
| Step | Artist Path | Recruiter Path |
|------|-------------|----------------|
| 1 | Select film industry category | Select casting category |
| 2 | Age, gender, location, experience, languages | Age, gender, location, company, languages |
| 3 | Height, weight, hair, eye color, complexion, body type | Optional physical details / skip |
| 4 | Skills (category-specific) + bio (50+ chars) | Skills + bio |
| 5 | Profile photo upload | Profile photo upload |
| 6 | Membership plan selection (all durations) | Membership plan selection |

### 👥 Mandatory Profile Fields (Artists)
- Full name, age, gender
- City / location
- Experience level (Fresher → 10+ years)
- Languages (18 Indian languages available)
- **Height, weight, hair color, eye color** ✅
- **Complexion, body type** ✅
- **Distinctive features / looks** ✅
- Skills (25 categories × category-specific skill sets)
- Bio (minimum 30 characters)

### 🎭 Film Industry Role Categories (25 Roles)
Actor, Actress, Choreographer, Dancer, Musician, Singer, Director, Assistant Director, Screenwriter, Dialogue Writer, Content Writer, Model, Stunt Artist, Voice Artist, Cinematographer/DOP, Video Editor, Producer, Casting Director, Makeup Artist, Costume Designer, Art Director, Background Artist, Child Artist, Comedian, Anchor/Host

### 👑 Membership Plans
5 Duration Tiers × 3 Plan Levels = **15 Plans Total**

| Duration | Starter | Pro | Elite |
|----------|---------|-----|-------|
| Weekly | ₹49 | ₹99 | ₹199 |
| Monthly | ₹149 | ₹349 | ₹699 |
| Quarterly | ₹399 | ₹899 | ₹1,799 |
| Half-Yearly | ₹699 | ₹1,699 | ₹3,299 |
| Yearly | ₹1,199 | ₹2,999 | ₹5,999 |
| Free | ₹0 forever (browse only) | | |

Payment Methods: UPI/GPay, Credit/Debit Card, Net Banking (10 banks)

### 🏠 Home Dashboard
- Personalized greeting with time-of-day message
- Quick action buttons (Browse Roles, Apply Now, Messages, Upgrade, Theaters)
- Category pills for quick filtering (all 25 categories)
- Live Casting Calls (horizontal scroll cards)
- Artists in Your City (real-time, filtered by user location)
- Nearby Theaters & Studios (user's city)
- Platform Overview Statistics (real user/casting/app counts)

### 🔍 Search
- Full-text search across name, category, location, skills
- Tab switching: Artists & Crew | Casting Calls
- Advanced filters: Category, Gender, Experience, Location
- Result count display
- Click-through to detailed profiles

### 🎬 Casting Calls
- Live casting call cards with deadlines
- Casting detail pages with full metadata
- Apply modal with cover message, experience, portfolio
- Recruiter can post casting calls (premium required)
- Application status tracking (applied → shortlisted → rejected/hired)
- Applicant count per casting

### 💬 Messaging (Real-Time Polling)
- Conversation list with unread indicators
- Full chat window with sent/received bubbles
- Message auto-polling every 5 seconds
- Audio/video call simulation overlay
- Unread dot in bottom nav
- Mobile: swipe between list and chat

### 🔔 Notifications
- Bell icon with unread count badge
- Auto-polling every 30 seconds
- Notification types: casting, message, follow, status, membership, system
- Mark all as read functionality
- Individual click-to-read

### 🎭 Artist Profiles
- Full profile view (photo, bio, physical details, skills, languages, portfolio)
- Follow/Unfollow with real-time follower count
- Direct message button
- Role badge (Artist / Recruiter distinction)
- Company/Designation for recruiters

### 🎥 Theaters & Studios
- Add movie theaters, multiplexes, studios, auditoriums
- Filter by type: Cinema Hall, Multiplex, Studio, Auditorium, Open Air, Drive-in, Preview
- Search by name or city
- Phone click-to-call links
- User-submitted theater data stored in real-time

### 🎬 Recruiter Dashboard
- Stats: Total Castings, Active Calls, Total Applicants, Shortlisted
- My Casting Calls list with status
- Recent Applicants with Shortlist/Reject actions
- Notifications sent to artists on status updates

### 📊 Analytics / App Overview
- Total Users, Artists, Recruiters, Premium Members
- Total Casting Calls, Active Calls, Applications, Theaters
- Top categories bar chart
- Application status breakdown

### 🎨 Design System
- Dark mode (default) + Light mode toggle
- Cinematic gold accent color (#D4AF37)
- Glassmorphism cards
- Cinzel serif font for branding
- Smooth transitions & animations
- Responsive (mobile-first)
- Side navigation menu
- Toast notifications

---

## 🗂️ Functional Entry URIs

| Page | URL Hash / Nav | Description |
|------|---------------|-------------|
| Splash | Auto | App loading screen |
| Onboarding | Auto (first visit) | 3-slide intro |
| Auth | Auth screen | Login / Register |
| Setup Wizard | Setup screen | 6-step profile completion |
| Payment | Payment screen | Membership purchase |
| Home | `/app#home` | Main dashboard |
| Search | `/app#search` | Search artists/castings |
| Post/Upload | `/app#upload` | Submit audition / Post casting |
| Messages | `/app#messages` | Chat interface |
| Profile | `/app#profile` | Own profile |
| Notifications | Bell button | Notification center |
| Theaters | Side menu / home | Theater/studio directory |
| Membership | Side menu / home chip | Plan selection |
| Recruiter Dashboard | `/app#recruiter` | Recruiter-only view |
| Analytics | Side menu | Platform statistics |

---

## 📦 Data Models (RESTful Table API)

### `users`
`id, fullName, email, phone, passwordHash, role, category, age, gender, location, experience, languages[], height, weight, hairColor, eyeColor, complexion, bodyType, distinctiveFeatures, skills[], bio, portfolioLinks[], avatarUrl, company, designation, membershipPlan, membershipPlanName, membershipExpiry, followersCount, followingCount, profileComplete, isVerified`

### `casting_calls`
`id, recruiterId, recruiterName, title, company, category, description, ageMin, ageMax, gender, location, budget, deadline, requirements[], languages[], isActive, applicantsCount`

### `applications`
`id, castingId, castingTitle, applicantId, applicantName, applicantAvatar, applicantCategory, coverMessage, experienceSummary, portfolioLink, recruiterId, status`

### `messages`
`id, conversationId, senderId, senderName, receiverId, receiverName, text, isRead`

### `theaters`
`id, name, type, address, city, state, phone, facilities[], isVerified, addedById`

### `follows`
`id, followerId, followingId`

### `membership_orders`
`id, userId, userName, plan, planName, category, role, amount, status, startDate, expiryDate, transactionId`

### `notifications`
`id, userId, type, title, description, relatedId, isRead`

---

## 🔧 Technology Stack

- **HTML5** – Semantic markup, multi-screen SPA
- **CSS3** – CSS Variables, Grid, Flexbox, Glassmorphism, Dark/Light themes
- **JavaScript (ES2020+)** – Async/await, fetch API, localStorage
- **Font Awesome 6.4** – Icons
- **Google Fonts** – Cinzel (branding) + Inter (body)
- **RESTful Table API** – Real-time data storage (no backend code)

---

## 🚫 No Demo/Mock Data

All application data is real-time only:
- `js/data.js` is an empty stub (no mock data)
- All users, castings, applications, messages, theaters, and notifications are stored in the live database
- Data persists across sessions for all users of the platform

---

## 🛡️ Admin Panel

The Admin Panel is a completely separate standalone page (`admin/index.html`) with its own login system.

### Admin Panel Features
| Section | Capabilities |
|---------|-------------|
| **Dashboard** | KPI cards, recent users/castings, category & revenue charts |
| **Users** | View, edit, verify/unverify, delete, export CSV |
| **Casting Calls** | View, edit (title/company/budget/status), delete, export CSV |
| **Applications** | View all applications, update status, delete, export CSV |
| **Messages** | View all messages, delete |
| **Theaters** | View, add new theater, delete |
| **Memberships** | View all orders, revenue summary, export CSV |
| **Notifications** | View, delete, send broadcast to all/artists/recruiters/premium |
| **Analytics** | Users by category, application status, revenue by plan, top locations |

### Admin Panel Access Points
1. **From Main App Side Menu** → "Admin Panel" link (opens new tab)
2. **Floating Gold Button** → Bottom-right corner of main app → "Admin" shield button  
3. **Direct URL** → `admin/index.html`

### Admin Credentials
```
Username: admin
Password: cinestage@admin123
```

### Session Management
- Admin sessions persist for **8 hours** via localStorage
- Auto-refresh every **60 seconds** from live database
- All edits immediately sync back to the main dashboard

---

## 🏗️ File Structure

```
index.html              ← Main App shell (all screens, modals)
admin/
  index.html            ← Admin Panel (separate standalone page)
  css/
    admin.css           ← Admin panel design system (dark/light)
  js/
    admin.js            ← Full CRUD admin logic (all sections)
css/
  main.css              ← Complete design system + admin FAB styles
  animations.css        ← Keyframe animations
js/
  config.js             ← Constants, categories, membership plans, utilities
  api.js                ← RESTful Table API wrapper (all CRUD operations)
  auth.js               ← Authentication, registration, setup wizard
  app.js                ← Navigation, home, search, profile, notifications, detail pages
  membership.js         ← Membership plans, payment flow
  theaters.js           ← Theater/studio directory
  chat.js               ← Real-time messaging with polling
  screens.js            ← Compatibility stub
  data.js               ← Empty stub (no demo data)
```

---

## 🚀 Next Steps / Roadmap

- [ ] Real Google/Social login integration
- [ ] Push notifications (Web Push API)
- [ ] Video audition upload to cloud storage
- [ ] Advanced search with map-based location
- [ ] AI-based talent matching for recruiters
- [ ] Portfolio gallery (multiple images/videos)
- [ ] Rating & review system for artists
- [ ] Casting call sharing to social media
- [ ] Multi-language UI (Hindi, Tamil, Telugu)
- [ ] Admin panel for platform management
- [ ] Email verification and OTP login
