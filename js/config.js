/* ============================================================
   CINESTAGE – Configuration & Constants
   ============================================================ */

const CONFIG = {
  API_BASE: 'tables',
  APP_NAME: 'CineStage',
  VERSION: '2.0.0'
};

/* ── FILM INDUSTRY CATEGORIES ─────────────────────── */
const CATEGORIES = [
  { id: 'actor',        label: 'Actor',               icon: '🎭', desc: 'Male actors for any film/OTT project' },
  { id: 'actress',      label: 'Actress',             icon: '👸', desc: 'Female actors for any film/OTT project' },
  { id: 'choreographer',label: 'Choreographer',       icon: '💃', desc: 'Dance choreographers for films & events' },
  { id: 'dancer',       label: 'Dancer',              icon: '🩰', desc: 'Classical, Western, Bollywood dancers' },
  { id: 'musician',     label: 'Musician',            icon: '🎸', desc: 'Instrumentalists & music composers' },
  { id: 'singer',       label: 'Singer',              icon: '🎤', desc: 'Playback, classical & live singers' },
  { id: 'director',     label: 'Director',            icon: '🎬', desc: 'Film, short film & ad directors' },
  { id: 'asst_director',label: 'Asst. Director',      icon: '📋', desc: 'Assistant directors & ADs' },
  { id: 'screenwriter', label: 'Screenwriter',        icon: '✍️', desc: 'Script & screenplay writers' },
  { id: 'dialogue',     label: 'Dialogue Writer',     icon: '💬', desc: 'Dialogue and story writers' },
  { id: 'content',      label: 'Content Writer',      icon: '📝', desc: 'Film content, synopsis & promo writers' },
  { id: 'model',        label: 'Model',               icon: '👔', desc: 'Fashion, print & commercial models' },
  { id: 'stunt',        label: 'Stunt Artist',        icon: '💥', desc: 'Action & stunt performers' },
  { id: 'voice',        label: 'Voice Artist',        icon: '🎙️', desc: 'Dubbing & voice over artists' },
  { id: 'dop',          label: 'Cinematographer/DOP', icon: '📷', desc: 'Directors of photography & camera ops' },
  { id: 'editor',       label: 'Video Editor',        icon: '🎞️', desc: 'Film & video editors' },
  { id: 'producer',     label: 'Producer',            icon: '💼', desc: 'Film & web series producers' },
  { id: 'casting',      label: 'Casting Director',    icon: '🔍', desc: 'Talent scouts & casting directors' },
  { id: 'makeup',       label: 'Makeup Artist',       icon: '💄', desc: 'Film & prosthetic makeup artists' },
  { id: 'costume',      label: 'Costume Designer',    icon: '👗', desc: 'Wardrobe & costume designers' },
  { id: 'art_director', label: 'Art Director',        icon: '🎨', desc: 'Production & art designers' },
  { id: 'background',   label: 'Background Artist',   icon: '👥', desc: 'Junior artists & extras' },
  { id: 'child_artist', label: 'Child Artist',        icon: '⭐', desc: 'Child actors (5-17 years)' },
  { id: 'comedian',     label: 'Comedian',            icon: '😄', desc: 'Stand-up & comedy actors' },
  { id: 'anchor',       label: 'Anchor / Host',       icon: '🎙', desc: 'TV anchors, event & film hosts' }
];

/* ── LANGUAGES ───────────────────────────────────── */
const LANGUAGES = [
  'Hindi','English','Tamil','Telugu','Malayalam','Kannada',
  'Bengali','Marathi','Gujarati','Punjabi','Odia','Assamese',
  'Urdu','Sanskrit','Bhojpuri','Rajasthani','Haryanvi','Maithili'
];

/* ── SKILLS BY CATEGORY ─────────────────────────── */
const SKILLS_BY_CATEGORY = {
  actor:        ['Method Acting','Commercial Acting','Theater','Action Sequences','Crying on Cue','Lip Sync','Dance','Horse Riding','Martial Arts'],
  actress:      ['Method Acting','Commercial Acting','Theater','Dance','Action','Lip Sync','Emotional Range','Period Drama','Comedy'],
  choreographer:['Bollywood','Classical','Western','Hip-Hop','Contemporary','Kathak','Bharatanatyam','Salsa','Jazz','Stage Choreography'],
  dancer:       ['Bollywood','Bharatanatyam','Kathak','Kuchipudi','Hip-Hop','Contemporary','Ballet','Folk Dance','Western','Salsa'],
  musician:     ['Guitar','Piano','Violin','Tabla','Flute','Drums','Keyboards','Sitar','Bass Guitar','Music Composition'],
  singer:       ['Playback','Classical Hindustani','Carnatic','Western Pop','Ghazal','Folk','RnB','Jazz','Rap','Jingles'],
  director:     ['Feature Film','Short Film','Ad Film','Documentary','Music Video','Web Series','OTT Content','Theater Direction'],
  asst_director:['Script Breakdown','Scheduling','Location Scouting','Coordination','Script Supervision'],
  screenwriter: ['Feature Screenplay','Short Film Script','Web Series','Adaptation','Original Story','Biopic','Thriller','Romance'],
  dialogue:     ['Hindi Dialogue','Urdu Dialogue','Screenplay','Story','Character Development','Comic Timing'],
  content:      ['Film Synopsis','Press Kit','Social Media','Marketing Copy','Subtitles','Dubbing Scripts'],
  model:        ['Ramp Walk','Print','Commercial','Brand Ambassador','Fitness','Glamour','Ethnic Wear','Wedding'],
  stunt:        ['Action Sequences','Martial Arts','Wire Work','Car Stunts','Fire Stunts','Horse Riding','Gymnastics'],
  voice:        ['Dubbing','Voice Over','Animation','Narration','Character Voices','Radio Jockey','Audio Drama'],
  dop:          ['Cinematography','Lighting','Drone Operations','Color Grading','ARRI','RED Camera','Steadicam'],
  editor:       ['Film Editing','Color Grading','VFX','Motion Graphics','Premiere Pro','Final Cut Pro','DaVinci Resolve'],
  producer:     ['Film Financing','Production Management','Co-production','Line Producing','OTT Pitching'],
  casting:      ['Talent Scouting','Audition Management','Database Management','Negotiation','Shortlisting'],
  makeup:       ['Period Makeup','Prosthetics','Body Painting','Bridal','FX Makeup','Hair Styling'],
  costume:      ['Period Costumes','Contemporary','Character Design','Wardrobe Management','Saree Draping'],
  art_director: ['Set Design','Props Management','Visual Concept','Color Palette','Architecture','Production Design'],
  background:   ['Crowd Scenes','Dialogue Delivery','Continuity','Following Direction'],
  child_artist: ['Acting','Dance','Singing','Emotional Expression','School Drama'],
  comedian:     ['Stand-up','Sketch Comedy','Improv','Mimicry','Comic Timing','Roast'],
  anchor:       ['Live Events','TV Hosting','Interview Conduct','Teleprompter','Bilingual Hosting']
};

/* ── MEMBERSHIP PLANS ───────────────────────────── */
const MEMBERSHIP_PLANS = {
  weekly: [
    { id: 'w-basic',    name: 'Starter',   price: 49,   features: ['5 Applications/week','Basic Profile','Search Access'], popular: false, highlight: false },
    { id: 'w-pro',      name: 'Pro',       price: 99,   features: ['Unlimited Applications','Priority Listing','Direct Messages','Portfolio Upload'], popular: true,  highlight: false },
    { id: 'w-elite',    name: 'Elite',     price: 199,  features: ['All Pro Features','Verified Badge','Analytics','Featured Profile','Recruiter Direct'], popular: false, highlight: true }
  ],
  monthly: [
    { id: 'm-basic',    name: 'Starter',   price: 149,  features: ['20 Applications/month','Basic Profile','Search Access'], popular: false, highlight: false },
    { id: 'm-pro',      name: 'Pro',       price: 349,  features: ['Unlimited Applications','Priority Listing','Direct Messages','Portfolio Upload'], popular: true,  highlight: false },
    { id: 'm-elite',    name: 'Elite',     price: 699,  features: ['All Pro Features','Verified Badge','Analytics','Featured Profile','Recruiter Direct'], popular: false, highlight: true }
  ],
  quarterly: [
    { id: 'q-basic',    name: 'Starter',   price: 399,  features: ['20 Applications/month','Basic Profile','Search Access','Save ₹48'], popular: false, highlight: false },
    { id: 'q-pro',      name: 'Pro',       price: 899,  features: ['Unlimited Applications','Priority Listing','Direct Messages','Save ₹148'], popular: true,  highlight: false },
    { id: 'q-elite',    name: 'Elite',     price: 1799, features: ['All Pro Features','Verified Badge','Analytics','Featured','Save ₹298'], popular: false, highlight: true }
  ],
  'half-yearly': [
    { id: 'h-basic',    name: 'Starter',   price: 699,  features: ['20 Applications/month','Basic Profile','Save ₹195'], popular: false, highlight: false },
    { id: 'h-pro',      name: 'Pro',       price: 1699, features: ['Unlimited Applications','Priority','Direct Messages','Save ₹395'], popular: true,  highlight: false },
    { id: 'h-elite',    name: 'Elite',     price: 3299, features: ['All Pro Features','Verified Badge','Analytics','Save ₹895'], popular: false, highlight: true }
  ],
  yearly: [
    { id: 'y-basic',    name: 'Starter',   price: 1199, features: ['20 Applications/month','Basic Profile','Save ₹589'], popular: false, highlight: false },
    { id: 'y-pro',      name: 'Pro',       price: 2999, features: ['Unlimited Applications','Priority','Direct Messages','Save ₹1189'], popular: true,  highlight: false },
    { id: 'y-elite',    name: 'Elite',     price: 5999, features: ['All Pro Features','Verified Badge','Analytics','Featured','Save ₹2389'], popular: false, highlight: true }
  ]
};

const PLAN_DURATION_DAYS = {
  weekly: 7, monthly: 30, quarterly: 90, 'half-yearly': 180, yearly: 365
};

/* ── THEATER TYPES ─────────────────────────────── */
const THEATER_TYPES = ['All','Cinema Hall','Multiplex','Studio','Auditorium','Open Air Theatre','Drive-in','Preview Theatre'];

/* ── UTILITY FUNCTIONS ─────────────────────────── */
function formatTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return 'N/A';
  const diff = new Date(dateStr) - new Date();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow!';
  if (days <= 3) return `${days} days left`;
  return `${days} days left`;
}

function isUrgent(dateStr) {
  if (!dateStr) return false;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000) <= 3;
}

function getAvatarUrl(name, bg='D4AF37', color='000') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=${bg}&color=${color}&bold=true&size=200`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 🌅';
  if (h < 17) return 'Good Afternoon ☀️';
  if (h < 21) return 'Good Evening 🎬';
  return 'Good Night 🌙';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getCategoryInfo(catId) {
  return CATEGORIES.find(c => c.id === catId) || { label: catId, icon: '🎬' };
}

function emptyState(icon, title, desc='', btnLabel='', btnFn='') {
  return `<div class="empty-state">
    <i class="${icon}"></i>
    <h4>${title}</h4>
    ${desc ? `<p>${desc}</p>` : ''}
    ${btnLabel ? `<button class="btn-primary mt-2" onclick="${btnFn}">${btnLabel}</button>` : ''}
  </div>`;
}
