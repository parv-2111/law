// ── Hardcoded hearings (admin-defined, user-wise)
const HEARINGS = [
  {
    id: 1,
    date: '2026-03-23',
    time: '10:00 AM – 12:00 PM',
    user: 'rahul@example.com',
    matter: 'Property Dispute – Mumbai',
    type: 'case',
    court: 'Bombay High Court, Court No. 4',
    judge: 'Hon. Justice A. Sharma',
    notes: 'Bring all original property documents and sale deed copies. Advocate will meet 30 mins before hearing.'
  },
  {
    id: 2,
    date: '2026-03-27',
    time: '9:00 AM – 11:00 AM',
    user: 'priya@example.com',
    matter: 'Contract Review – TechCorp',
    type: 'agreement',
    court: 'Delhi District Court',
    judge: 'Hon. Justice R. Mehta',
    notes: 'Final review of vendor agreement. Client to confirm clause 7 amendments before date.'
  },
  {
    id: 3,
    date: '2026-04-05',
    time: '11:00 AM – 1:00 PM',
    user: 'amit@example.com',
    matter: 'Legal Notice – Landlord',
    type: 'notice',
    court: 'Pune Civil Court',
    judge: 'Hon. Justice S. Patil',
    notes: 'Notice response deadline. Ensure acknowledgment receipt is attached.'
  },
  {
    id: 4,
    date: '2026-04-15',
    time: '2:00 PM – 4:00 PM',
    user: 'sneha@example.com',
    matter: 'GST Compliance Advice',
    type: 'advise',
    court: 'ITAT Mumbai Bench',
    judge: 'Hon. Member P. Gupta',
    notes: 'Advisory session on GST input credit dispute. Bring last 3 years of returns.'
  },
  {
    id: 5,
    date: '2026-04-22',
    time: '10:30 AM – 12:30 PM',
    user: 'rahul@example.com',
    matter: 'Property Dispute – Mumbai',
    type: 'case',
    court: 'Bombay High Court, Court No. 4',
    judge: 'Hon. Justice A. Sharma',
    notes: 'Second hearing. Witness examination scheduled. Ensure witnesses are present.'
  },
  {
    id: 6,
    date: '2026-05-08',
    time: '3:00 PM – 5:00 PM',
    user: 'karan@example.com',
    matter: 'Employment Dispute',
    type: 'case',
    court: 'Labour Court, Andheri',
    judge: 'Presiding Officer M. Joshi',
    notes: 'Conciliation meeting between employer and employee. Settlement discussion expected.'
  }
];

// ── Pull next dates from cases.html localStorage
function getCaseHearings() {
  const raw = localStorage.getItem('lexfirm_admin_cases');
  if (!raw) return [];
  try {
    const cases = JSON.parse(raw);
    return cases
      .filter(c => c.nextDate)
      .map((c, idx) => ({
        id: 2000 + idx,
        date: c.nextDate,
        time: 'To be confirmed',
        user: c.client,
        matter: c.caseNo + (c.matterNo ? ' / ' + c.matterNo : ''),
        type: 'case',
        court: c.company || 'To be assigned',
        judge: 'To be assigned',
        notes: `Applicant: ${c.applicant} | Opposite Party: ${c.opposite} | Filed: ${c.filingDate || '—'}`,
        fromCase: true
      }));
  } catch(e) { return []; }
}

// ── Also pull matters submitted by users from localStorage
function getUserMatters() {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith('lexfirm_matters_')) continue;
    const userEmail = key.replace('lexfirm_matters_', '');
    try {
      const matters = JSON.parse(localStorage.getItem(key)) || [];
      matters.forEach(m => results.push({ ...m, user: userEmail, fromUser: true }));
    } catch(e) {}
  }
  return results;
}

// ── Build combined hearing list: hardcoded + cases nextDate + user-submitted matters
function getAllHearings() {
  const userMatters = getUserMatters();
  const extra = userMatters.map((m, idx) => ({
    id: 1000 + idx,
    date: getNextWeekday(m.date || new Date().toISOString()),
    time: 'To be confirmed',
    user: m.user,
    matter: m.name,
    type: m.type || 'other',
    court: 'To be assigned',
    judge: 'To be assigned',
    notes: m.desc || 'No additional details provided.',
    fromUser: true
  }));
  return [...HEARINGS, ...getCaseHearings(), ...extra];
}

// Give user-submitted matters a hearing date = 7 days from submission
function getNextWeekday(isoDate) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

// ── State
let currentDate = new Date();
let activeFilter = 'all';
let selectedDateStr = null;

function allHearings() { return getAllHearings(); }

// ── Calendar
function buildCalendar() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('calTitle').textContent =
    new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();

  // Event dates this month
  const eventDates = new Set(
    allHearings()
      .filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(h => h.date)
  );

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'dc-day';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const hasEv   = eventDates.has(dateStr);

    const cell = document.createElement('div');
    cell.className = 'dc-day cur-month';
    if (isToday) cell.classList.add('today');
    if (hasEv)   { cell.classList.add('has-event'); cell.innerHTML = `${d}<span class="ev-dot"></span>`; }
    else         cell.textContent = d;
    if (selectedDateStr === dateStr) cell.classList.add('selected');

    if (hasEv) {
      cell.addEventListener('click', () => {
        selectedDateStr = dateStr;
        buildCalendar();
        filterAndRender('date');
      });
    }

    grid.appendChild(cell);
  }
}

// ── Hearings list
function filterAndRender(source) {
  const today = new Date(); today.setHours(0,0,0,0);
  let list = [...allHearings()];

  // If a date was clicked on calendar, show only that date
  if (source === 'date' && selectedDateStr) {
    list = list.filter(h => h.date === selectedDateStr);
  } else {
    if (activeFilter === 'upcoming') list = list.filter(h => new Date(h.date) > today);
    else if (activeFilter === 'today') list = list.filter(h => {
      const d = new Date(h.date); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    });
    else if (activeFilter === 'past') list = list.filter(h => new Date(h.date) < today);
  }

  // Sort by date ascending
  list.sort((a, b) => new Date(a.date) - new Date(b.date));

  document.getElementById('hearingCount').textContent = list.length;
  renderHearings(list);
}

function renderHearings(list) {
  const container = document.getElementById('hearingsList');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `
      <div class="hearings-empty">
        <i class="fas fa-calendar-xmark"></i>
        No hearings found.
      </div>`;
    return;
  }

  const today = new Date(); today.setHours(0,0,0,0);

  list.forEach(h => {
    const hDate = new Date(h.date); hDate.setHours(0,0,0,0);
    const isPast    = hDate < today;
    const isToday   = hDate.getTime() === today.getTime();

    const card = document.createElement('div');
    card.className = 'hearing-card' + (isPast ? ' past' : '') + (isToday ? ' today-card' : '');

    const dateLabel = hDate.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });

    card.innerHTML = `
      <div class="hc-top">
        <div class="hc-date"><i class="fas fa-calendar"></i>${dateLabel}</div>
        <span class="hc-type ${h.type}">${h.type}</span>
      </div>
      <div class="hc-matter">${h.matter}</div>
      <div class="hc-bottom">
        <div class="hc-user"><i class="fas fa-user"></i>${h.user}</div>
        <div class="hc-time"><i class="fas fa-clock"></i>${h.time}</div>
      </div>
    `;

    card.addEventListener('click', () => openModal(h));
    container.appendChild(card);
  });
}

// ── Modal
function openModal(h) {
  const typeColors = {
    notice: '#4a90d9', agreement: '#c9a227', case: '#e05555',
    advise: '#3ecf8e', other: '#9b6dff'
  };
  const color = typeColors[h.type] || '#9b6dff';
  const hDate = new Date(h.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  document.getElementById('modalBadge').textContent = h.type.toUpperCase();
  document.getElementById('modalBadge').style.cssText = `background:${color}22;color:${color};`;
  document.getElementById('modalTitle').textContent = h.matter;
  document.getElementById('modalMeta').innerHTML = `
    <div class="modal-meta-row"><i class="fas fa-user"></i><span>Client:</span><strong>${h.user}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-calendar-days"></i><span>Date:</span><strong>${hDate}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-clock"></i><span>Time:</span><strong>${h.time}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-landmark"></i><span>Court:</span><strong>${h.court}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-gavel"></i><span>Judge / Officer:</span><strong>${h.judge}</strong></div>
  `;
  document.getElementById('modalDetails').innerHTML = `
    <div class="modal-details-label">Notes & Instructions</div>
    ${h.notes}
  `;

  document.getElementById('hearingModalOverlay').classList.add('open');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('hearingModalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('hearingModalOverlay')) closeModal();
});
function closeModal() {
  document.getElementById('hearingModalOverlay').classList.remove('open');
}

// ── Filter buttons
document.querySelectorAll('.hf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.hf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    selectedDateStr = null;
    buildCalendar();
    filterAndRender('filter');
  });
});

// ── Month nav
document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  buildCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  buildCalendar();
});

// ── Init
buildCalendar();
filterAndRender('filter');
