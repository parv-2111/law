// ── User email from sessionStorage
const email = sessionStorage.getItem('userEmail') || 'user@email.com';
document.getElementById('userEmail').textContent = email;
document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();

// ── Matter stats storage key per user
const MATTERS_KEY = `dkcorporate_matters_${email}`;

function loadMatters() {
  const stored = localStorage.getItem(MATTERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveMatters(matters) {
  localStorage.setItem(MATTERS_KEY, JSON.stringify(matters));
}

function updateStats() {
  const matters   = loadMatters();
  const total     = matters.length;
  const completed = matters.filter(m => m.status === 'completed').length;
  const running   = total - completed;
  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statRunning').textContent   = running;
  document.getElementById('statCompleted').textContent = completed;
}

// Load stats on page open
updateStats();

// ── Notification toggle
const notifBtn      = document.getElementById('notifBtn');
const notifDropdown = document.getElementById('notifDropdown');
const notifBadge    = document.getElementById('notifBadge');
const notifList     = document.getElementById('notifList');
const NOTIF_KEY     = `dkcorporate_notif_read_${email}`;

// Load saved read IDs from localStorage and apply to DOM
function loadNotifState() {
  const readIds = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
  readIds.forEach(id => {
    const item = notifList.querySelector(`.notif-item[data-id="${id}"]`);
    if (item) { item.classList.remove('unread'); item.classList.add('read'); }
  });
  updateBadge();
}

function saveNotifState() {
  const readIds = [...notifList.querySelectorAll('.notif-item.read')].map(el => el.dataset.id);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(readIds));
}

loadNotifState();

notifBtn.addEventListener('click', e => {
  e.stopPropagation();
  notifDropdown.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!notifDropdown.contains(e.target) && e.target !== notifBtn)
    notifDropdown.classList.remove('open');
});

// Click individual notification → mark as read
notifList.addEventListener('click', e => {
  const item = e.target.closest('.notif-item');
  if (!item) return;
  item.classList.remove('unread');
  item.classList.add('read');
  saveNotifState();
  updateBadge();
});

// Mark all read
document.getElementById('markAllRead').addEventListener('click', () => {
  document.querySelectorAll('.notif-item.unread').forEach(el => {
    el.classList.remove('unread');
    el.classList.add('read');
  });
  saveNotifState();
  updateBadge();
});

function updateBadge() {
  const count = document.querySelectorAll('.notif-item.unread').length;
  notifBadge.textContent = count;
  notifBadge.classList.toggle('hidden', count === 0);
}

// ── File Upload
const fileInput  = document.getElementById('fileInput');
const fileList   = document.getElementById('fileList');
const uploadZone = document.getElementById('uploadZone');
const MAX_SIZE   = 10 * 1024 * 1024; // 10MB
let selectedFiles = [];

const FILE_ICONS = {
  pdf:  'fa-file-pdf',
  doc:  'fa-file-word', docx: 'fa-file-word',
  ppt:  'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
  xls:  'fa-file-excel', xlsx: 'fa-file-excel',
  jpg:  'fa-file-image', jpeg: 'fa-file-image',
  png:  'fa-file-image', gif:  'fa-file-image', webp: 'fa-file-image',
  txt:  'fa-file-lines', csv:  'fa-file-csv',
};

function getIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || 'fa-file';
}
function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? (bytes / 1024).toFixed(1) + ' KB'
    : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderFiles() {
  fileList.innerHTML = '';
  selectedFiles.forEach((f, i) => {
    const oversized = f.size > MAX_SIZE;
    const div = document.createElement('div');
    div.className = 'file-item' + (oversized ? ' error' : '');
    div.innerHTML = `
      <i class="fas ${getIcon(f.name)}"></i>
      <span class="fname">${f.name}${oversized ? ' — exceeds 10MB limit' : ''}</span>
      <span class="fsize">${formatSize(f.size)}</span>
      <button class="fremove" data-i="${i}"><i class="fas fa-xmark"></i></button>
    `;
    fileList.appendChild(div);
  });
  fileList.querySelectorAll('.fremove').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFiles.splice(+btn.dataset.i, 1);
      renderFiles();
    });
  });
}

fileInput.addEventListener('change', () => {
  selectedFiles = [...selectedFiles, ...Array.from(fileInput.files)];
  fileInput.value = '';
  renderFiles();
});

// Drag & drop
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  selectedFiles = [...selectedFiles, ...Array.from(e.dataTransfer.files)];
  renderFiles();
});

// ── Form Validation & Submit
document.getElementById('matterForm').addEventListener('submit', function (e) {
  e.preventDefault();
  let valid = true;

  const name = document.getElementById('matterName');
  const desc = document.getElementById('matterDesc');
  const type = document.getElementById('matterType');

  const setErr = (id, msg) => { document.getElementById(id).textContent = msg; };
  const clrErr = (id)      => { document.getElementById(id).textContent = ''; };

  if (!name.value.trim()) { setErr('err-matterName', 'Matter name is required.'); valid = false; }
  else clrErr('err-matterName');

  if (desc.value.trim().length < 10) { setErr('err-matterDesc', 'Please describe your matter (min 10 chars).'); valid = false; }
  else clrErr('err-matterDesc');

  if (!type.value) { setErr('err-matterType', 'Please select a matter type.'); valid = false; }
  else clrErr('err-matterType');

  const oversized = selectedFiles.some(f => f.size > MAX_SIZE);
  if (oversized) { setErr('err-file', 'Remove files exceeding 10MB before submitting.'); valid = false; }
  else clrErr('err-file');

  if (!valid) return;

  const btn = this.querySelector('.btn-submit');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
  btn.disabled = true;

  setTimeout(() => {
    // Save matter to localStorage for this user
    const matters = loadMatters();
    matters.push({
      id:     Date.now(),
      name:   name.value.trim(),
      desc:   desc.value.trim(),
      type:   type.value,
      status: 'running',
      date:   new Date().toISOString()
    });
    saveMatters(matters);
    updateStats();

    btn.innerHTML = '<span>Submit Matter</span><i class="fas fa-paper-plane"></i>';
    btn.disabled = false;
    this.reset();
    selectedFiles = [];
    fileList.innerHTML = '';
    showToast();
  }, 1500);
});

function showToast() {
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Calendar — no hardcoded events, calendar shows current month only
const events = [];

let currentDate = new Date();

function buildCalendar() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('calTitle').textContent =
    new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Blank cells before first day
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasEvent = events.some(ev => ev.date === dateStr);
    const isToday  = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

    const cell = document.createElement('div');
    cell.className = 'cal-day cur-month';
    if (isToday)   cell.classList.add('today');
    if (hasEvent)  { cell.classList.add('has-event'); cell.innerHTML = `${d}<span class="event-dot"></span>`; }
    else           cell.textContent = d;

    if (hasEvent) {
      cell.addEventListener('click', () => scrollToEvent(dateStr));
    }
    grid.appendChild(cell);
  }

  renderEvents(month, year);
}

function renderEvents(month, year) {
  const list = document.getElementById('eventsList');
  list.innerHTML = '<p class="events-title">Scheduled Events</p>';

  const monthEvents = events.filter(ev => {
    const d = new Date(ev.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  if (monthEvents.length === 0) {
    list.innerHTML += '<p style="font-size:0.82rem;color:var(--muted);text-align:center;padding:16px 0">No events this month.</p>';
    return;
  }

  monthEvents.forEach(ev => {
    const d = new Date(ev.date);
    const div = document.createElement('div');
    div.className = 'event-item';
    div.dataset.date = ev.date;
    div.innerHTML = `
      <div class="ev-date">${d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</div>
      <div class="ev-title">${ev.title}</div>
      <div class="ev-time"><i class="fas fa-clock"></i>${ev.time}</div>
    `;
    list.appendChild(div);
  });
}

function scrollToEvent(dateStr) {
  const el = document.querySelector(`.event-item[data-date="${dateStr}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  buildCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  buildCalendar();
});

buildCalendar();
