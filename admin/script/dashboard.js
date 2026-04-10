// ── Hardcoded hearings
const HEARINGS = [
  { id:1,  date:'2026-03-23', time:'10:00 AM – 12:00 PM', user:'Rahul Sharma',  matter:'Property Dispute – Mumbai',   type:'case',      court:'Bombay High Court, Court No. 4', judge:'Hon. Justice A. Sharma',   notes:'Bring all original property documents and sale deed copies.' },
  { id:2,  date:'2026-03-27', time:'9:00 AM – 11:00 AM',  user:'Priya Mehta',   matter:'Contract Review – TechCorp',  type:'agreement', court:'Delhi District Court',           judge:'Hon. Justice R. Mehta',    notes:'Final review of vendor agreement. Confirm clause 7 amendments.' },
  { id:3,  date:'2026-04-05', time:'11:00 AM – 1:00 PM',  user:'Amit Patel',    matter:'Legal Notice – Landlord',     type:'notice',    court:'Pune Civil Court',               judge:'Hon. Justice S. Patil',    notes:'Notice response deadline. Ensure acknowledgment receipt is attached.' },
  { id:4,  date:'2026-04-15', time:'2:00 PM – 4:00 PM',   user:'Sneha Rao',     matter:'GST Compliance Advice',       type:'advise',    court:'ITAT Mumbai Bench',              judge:'Hon. Member P. Gupta',     notes:'Advisory session on GST input credit dispute. Bring last 3 years of returns.' },
  { id:5,  date:'2026-04-22', time:'10:30 AM – 12:30 PM', user:'Rahul Sharma',  matter:'Property Dispute – Mumbai',   type:'case',      court:'Bombay High Court, Court No. 4', judge:'Hon. Justice A. Sharma',   notes:'Second hearing. Witness examination scheduled.' },
  { id:6,  date:'2026-05-08', time:'3:00 PM – 5:00 PM',   user:'Karan Singh',   matter:'Employment Dispute',          type:'case',      court:'Labour Court, Andheri',          judge:'Presiding Officer M. Joshi',notes:'Conciliation meeting. Settlement discussion expected.' },
];

// ── Pull next dates from Cases localStorage
function getCaseHearings() {
  try {
    const cases = JSON.parse(localStorage.getItem('lexfirm_admin_cases') || '[]');
    return cases.filter(c => c.nextDate).map((c, i) => ({
      id: 2000 + i,
      date: c.nextDate,
      time: 'To be confirmed',
      user: c.client,
      matter: c.matterNo + ' — ' + c.caseNo,
      type: 'case',
      court: c.company || 'Court to be assigned',
      judge: 'To be assigned',
      notes: `Applicant: ${c.applicant} | Opposite: ${c.opposite} | Filed: ${c.filingDate || '—'} | Status: ${c.status}`,
      source: 'Cases'
    }));
  } catch(e) { return []; }
}

// ── Pull from admin Matters localStorage
function getMatterHearings() {
  try {
    const matters = JSON.parse(localStorage.getItem('lexfirm_admin_matters') || '[]');
    return matters.filter(m => m.status === 'running' || m.status === 'pending').map((m, i) => ({
      id: 3000 + i,
      date: getOffsetDate(7 + i * 3),
      time: 'To be confirmed',
      user: m.client,
      matter: m.name,
      type: m.type || 'other',
      court: 'To be assigned',
      judge: 'To be assigned',
      notes: `File No: ${m.fileNo || '—'} | Case No: ${m.caseNo || '—'} | Prepared by: ${m.preparedBy}`,
      source: 'Matters'
    }));
  } catch(e) { return []; }
}

// ── Pull from user-submitted matters
function getUserMatters() {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith('lexfirm_matters_')) continue;
    try {
      const matters = JSON.parse(localStorage.getItem(key)) || [];
      const email = key.replace('lexfirm_matters_', '');
      matters.forEach((m, idx) => results.push({
        id: 4000 + results.length,
        date: getOffsetDate(7, m.date),
        time: 'To be confirmed',
        user: email,
        matter: m.name,
        type: m.type || 'other',
        court: 'To be assigned',
        judge: 'To be assigned',
        notes: m.desc || 'No additional details.',
        source: 'Client Submission'
      }));
    } catch(e) {}
  }
  return results;
}

function getOffsetDate(days, fromIso) {
  const d = fromIso ? new Date(fromIso) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getAllHearings() {
  return [...HEARINGS, ...getCaseHearings(), ...getMatterHearings(), ...getUserMatters()];
}

// ── Update stat cards from localStorage
function updateStatCards() {
  const cases   = JSON.parse(localStorage.getItem('lexfirm_admin_cases')   || '[]');
  const matters = JSON.parse(localStorage.getItem('lexfirm_admin_matters') || '[]');
  const scCases   = document.getElementById('sc-cases');
  const scMatters = document.getElementById('sc-matters');
  if (scCases)   scCases.textContent   = cases.length   || 55;
  if (scMatters) scMatters.textContent = matters.length || 42;
}

// ── State
let currentDate    = new Date();
let activeFilter   = 'all';
let selectedDate   = null;

// ── Build big calendar
function buildCalendar() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  document.getElementById('calTitle').textContent =
    new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  const grid      = document.getElementById('calGrid');
  const firstDay  = new Date(year, month, 1).getDay();
  const lastDay   = new Date(year, month + 1, 0).getDate();
  const prevLast  = new Date(year, month, 0).getDate();

  // Group hearings by date
  const byDate = {};
  getAllHearings().forEach(h => {
    if (!byDate[h.date]) byDate[h.date] = [];
    byDate[h.date].push(h);
  });

  let html = '';

  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLast - i;
    const prevMonth = month === 0 ? 12 : month;
    const prevYear  = month === 0 ? year - 1 : year;
    const ds = `${prevYear}-${String(prevMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    html += buildDayCell(d, ds, byDate[ds] || [], true, false, false);
  }

  // Current month days
  for (let d = 1; d <= lastDay; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday   = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
    const isSelected = selectedDate === ds;
    html += buildDayCell(d, ds, byDate[ds] || [], false, isToday, isSelected);
  }

  // Next month leading days
  const totalCells = Math.ceil((firstDay + lastDay) / 7) * 7;
  const remaining  = totalCells - firstDay - lastDay;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 1 : month + 2;
    const nextYear  = month === 11 ? year + 1 : year;
    const ds = `${nextYear}-${String(nextMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    html += buildDayCell(d, ds, byDate[ds] || [], true, false, false);
  }

  grid.innerHTML = html;

  // Attach click events
  grid.querySelectorAll('.bc-day').forEach(cell => {
    cell.addEventListener('click', function() {
      const ds = this.dataset.date;
      if (!ds) return;
      selectedDate = selectedDate === ds ? null : ds;
      buildCalendar();
      filterAndRender();
    });
  });
  grid.querySelectorAll('.bc-event').forEach(chip => {
    chip.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = parseInt(this.dataset.id);
      const h  = getAllHearings().find(x => x.id === id);
      if (h) openModal(h);
    });
  });
}

function buildDayCell(d, ds, events, otherMonth, isToday, isSelected) {
  let cls = 'bc-day';
  if (otherMonth) cls += ' other-month';
  if (isToday)    cls += ' today';
  if (isSelected) cls += ' selected';
  if (events.length) cls += ' has-event';

  const numHtml = `<div class="bc-day-num">${d}</div>`;

  const MAX_SHOW = 3;
  const shown    = events.slice(0, MAX_SHOW);
  const extra    = events.length - MAX_SHOW;

  const chipsHtml = shown.map(h => {
    const label = h.matter.length > 22 ? h.matter.slice(0, 22) + '…' : h.matter;
    const cls2  = h.source === 'Cases' ? 'from-case' : h.source === 'Matters' ? 'from-matter' : 'type-' + (h.type || 'other');
    return `<div class="bc-event ${cls2}" data-id="${h.id}" title="${h.matter} — ${h.user}">${label}</div>`;
  }).join('');

  const moreHtml = extra > 0 ? `<div class="bc-more">+${extra} more</div>` : '';

  return `<div class="${cls}" data-date="${ds}">
    ${numHtml}
    <div class="bc-events">${chipsHtml}${moreHtml}</div>
  </div>`;
}

// ── Hearings grid
function filterAndRender() {
  const today = new Date(); today.setHours(0,0,0,0);
  let list = getAllHearings();

  if (selectedDate) {
    list = list.filter(h => h.date === selectedDate);
  } else {
    if (activeFilter === 'upcoming') list = list.filter(h => { const d=new Date(h.date); d.setHours(0,0,0,0); return d > today; });
    else if (activeFilter === 'today') list = list.filter(h => { const d=new Date(h.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
    else if (activeFilter === 'past')  list = list.filter(h => { const d=new Date(h.date); d.setHours(0,0,0,0); return d < today; });
  }

  list.sort((a, b) => new Date(a.date) - new Date(b.date));
  document.getElementById('hearingCount').textContent = list.length;
  renderHearingsGrid(list);
}

function renderHearingsGrid(list) {
  const container = document.getElementById('hearingsList');
  if (!list.length) {
    container.innerHTML = `<div class="hearings-empty"><i class="fas fa-calendar-xmark"></i><p>No hearings found for this filter.</p></div>`;
    return;
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const TYPE_COLORS = { case:'#e05555', notice:'#4a90d9', agreement:'#c9a227', advise:'#3ecf8e', other:'#9b6dff' };

  container.innerHTML = list.map(h => {
    const hd = new Date(h.date); hd.setHours(0,0,0,0);
    const isPast  = hd < today;
    const isToday = hd.getTime() === today.getTime();
    const dateLabel = hd.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    const color = TYPE_COLORS[h.type] || '#9b6dff';
    const cardCls = 'hg-card' + (isPast?' past':'') + (isToday?' today-card':'');
    const srcBadge = h.source ? `<span style="font-size:0.65rem;padding:2px 8px;border-radius:10px;background:rgba(255,255,255,0.07);color:var(--muted);margin-left:auto;">${h.source}</span>` : '';

    return `<div class="${cardCls}" onclick="openModal(${JSON.stringify(h).replace(/"/g,'&quot;')})">
      <div class="hg-top">
        <div class="hg-date"><i class="fas fa-calendar"></i>${dateLabel}</div>
        <span class="hc-type ${h.type}" style="background:${color}22;color:${color};">${h.type}</span>
        ${srcBadge}
      </div>
      <div class="hg-matter">${h.matter}</div>
      <div class="hg-meta">
        <div class="hg-meta-row"><i class="fas fa-user"></i>${h.user}</div>
        <div class="hg-meta-row"><i class="fas fa-clock"></i>${h.time}</div>
        <div class="hg-meta-row"><i class="fas fa-landmark"></i>${h.court}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Modal
window.openModal = function(h) {
  if (typeof h === 'string') h = JSON.parse(h);
  const TYPE_COLORS = { case:'#e05555', notice:'#4a90d9', agreement:'#c9a227', advise:'#3ecf8e', other:'#9b6dff' };
  const color = TYPE_COLORS[h.type] || '#9b6dff';
  const hDate = new Date(h.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  document.getElementById('modalBadge').textContent  = h.type.toUpperCase();
  document.getElementById('modalBadge').style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;
  document.getElementById('modalTitle').textContent  = h.matter;
  document.getElementById('modalMeta').innerHTML = `
    <div class="modal-meta-row"><i class="fas fa-user"></i><span>Client / User:</span><strong>${h.user}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-calendar-days"></i><span>Date:</span><strong>${hDate}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-clock"></i><span>Time:</span><strong>${h.time}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-landmark"></i><span>Court:</span><strong>${h.court}</strong></div>
    <div class="modal-meta-row"><i class="fas fa-gavel"></i><span>Judge / Officer:</span><strong>${h.judge}</strong></div>
    ${h.source ? `<div class="modal-meta-row"><i class="fas fa-database"></i><span>Source:</span><strong>${h.source}</strong></div>` : ''}
  `;
  document.getElementById('modalDetails').innerHTML = `
    <div class="modal-details-label">Notes &amp; Instructions</div>${h.notes}
  `;
  document.getElementById('hearingModalOverlay').classList.add('open');
};

document.getElementById('modalClose').addEventListener('click', () =>
  document.getElementById('hearingModalOverlay').classList.remove('open')
);
document.getElementById('hearingModalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('hearingModalOverlay'))
    document.getElementById('hearingModalOverlay').classList.remove('open');
});

// ── Filter buttons
document.querySelectorAll('.hf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.hf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter  = btn.dataset.filter;
    selectedDate  = null;
    buildCalendar();
    filterAndRender();
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
document.getElementById('todayBtn').addEventListener('click', () => {
  currentDate = new Date();
  selectedDate = null;
  buildCalendar();
  filterAndRender();
});

// ── Init
updateStatCards();
buildCalendar();
filterAndRender();
