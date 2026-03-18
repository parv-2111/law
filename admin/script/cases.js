const CASES_KEY = 'lexfirm_admin_cases';

// ── Seed data
const SEED = [
  { id:1, matterNo:'MAT-2026-001', caseNo:'CASE/2026/101', client:'Rahul Sharma',  company:'Sharma Builders Pvt Ltd', applicant:'Rahul Sharma',  opposite:'Mumbai Housing Board',   filingDate:'2025-06-15', nextDate:'2026-03-23', status:'running'   },
  { id:2, matterNo:'MAT-2026-002', caseNo:'CASE/2026/102', client:'Priya Mehta',   company:'TechCorp Solutions',      applicant:'TechCorp Solutions', opposite:'Vendor XYZ Ltd',      filingDate:'2025-08-20', nextDate:'2026-04-10', status:'pending'   },
  { id:3, matterNo:'MAT-2026-003', caseNo:'CASE/2026/103', client:'Amit Patel',    company:'',                        applicant:'Amit Patel',     opposite:'Landlord R. Desai',       filingDate:'2025-09-05', nextDate:'2026-03-27', status:'running'   },
  { id:4, matterNo:'MAT-2026-004', caseNo:'CASE/2026/104', client:'Sneha Rao',     company:'Rao Enterprises',         applicant:'Sneha Rao',      opposite:'GST Department',          filingDate:'2025-11-12', nextDate:'2026-04-15', status:'running'   },
  { id:5, matterNo:'MAT-2026-005', caseNo:'CASE/2026/105', client:'Karan Singh',   company:'Singh & Co.',             applicant:'Karan Singh',    opposite:'Former Employer ABC Ltd', filingDate:'2026-01-08', nextDate:'2026-04-22', status:'running'   },
  { id:6, matterNo:'MAT-2026-006', caseNo:'CASE/2025/088', client:'Neha Gupta',    company:'Gupta Textiles',          applicant:'Gupta Textiles', opposite:'State Tax Authority',     filingDate:'2025-03-18', nextDate:'',           status:'completed' },
];

function loadCases() {
  const raw = localStorage.getItem(CASES_KEY);
  if (!raw) { localStorage.setItem(CASES_KEY, JSON.stringify(SEED)); return SEED; }
  return JSON.parse(raw);
}
function saveCases(list) { localStorage.setItem(CASES_KEY, JSON.stringify(list)); }
function nextId(list)    { return list.length ? Math.max(...list.map(c => c.id)) + 1 : 1; }

// ── Format date for display
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Next date cell with colour coding
function nextDateCell(str) {
  if (!str) return '<span style="color:var(--muted)">—</span>';
  const today = new Date(); today.setHours(0,0,0,0);
  const nd    = new Date(str); nd.setHours(0,0,0,0);
  const diff  = Math.round((nd - today) / 86400000);
  let cls = '';
  if (diff < 0)       cls = 'next-date-past';
  else if (diff === 0) cls = 'next-date-today';
  else if (diff <= 7)  cls = 'next-date-soon';
  return `<span class="${cls}">${fmtDate(str)}</span>`;
}

// ── Render
function renderTable(list) {
  const tbody = document.getElementById('casesBody');
  const empty = document.getElementById('casesEmpty');
  document.getElementById('caseCount').textContent = list.length;

  if (!list.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(c => `
    <tr data-id="${c.id}" onclick="openView(${c.id})">
      <td class="td-mno">${c.matterNo}</td>
      <td class="td-client" title="${c.caseNo}">${c.caseNo}</td>
      <td class="td-client" title="${c.client}">${c.client}</td>
      <td style="color:var(--muted);font-size:0.82rem;" title="${c.company}">${c.company || '—'}</td>
      <td title="${c.applicant}">${c.applicant}</td>
      <td title="${c.opposite}">${c.opposite}</td>
      <td style="color:var(--muted);white-space:nowrap;">${fmtDate(c.filingDate)}</td>
      <td style="white-space:nowrap;">${nextDateCell(c.nextDate)}</td>
      <td><span class="status-badge ${c.status}">${c.status}</span></td>
      <td onclick="event.stopPropagation()">
        <div class="td-actions">
          <button class="btn-edit"   onclick="openEdit(${c.id})"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn-delete" onclick="openDelete(${c.id})"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Filter + Search
function getFiltered() {
  let list   = loadCases();
  const q    = document.getElementById('caseSearch').value.trim().toLowerCase();
  const st   = document.getElementById('filterCaseStatus').value;
  const nd   = document.getElementById('filterNextDate').value;

  if (q)  list = list.filter(c =>
    c.caseNo.toLowerCase().includes(q)   ||
    c.matterNo.toLowerCase().includes(q) ||
    c.client.toLowerCase().includes(q)   ||
    c.company.toLowerCase().includes(q)  ||
    c.applicant.toLowerCase().includes(q)||
    c.opposite.toLowerCase().includes(q)
  );
  if (st) list = list.filter(c => c.status === st);
  if (nd) list = list.filter(c => c.nextDate === nd);
  return list;
}

['caseSearch','filterCaseStatus','filterNextDate'].forEach(id =>
  document.getElementById(id).addEventListener('input',  () => renderTable(getFiltered()))
);
document.getElementById('filterCaseStatus').addEventListener('change', () => renderTable(getFiltered()));

// ── Add / Edit Modal
let editingId = null;

function openModal(c = null) {
  editingId = c ? c.id : null;
  document.getElementById('caseModalTitle').textContent = c ? 'Edit Case' : 'Add Case';

  document.getElementById('cm-matterno').value   = c?.matterNo   || '';
  document.getElementById('cm-caseno').value     = c?.caseNo     || '';
  document.getElementById('cm-client').value     = c?.client     || '';
  document.getElementById('cm-company').value    = c?.company    || '';
  document.getElementById('cm-applicant').value  = c?.applicant  || '';
  document.getElementById('cm-opposite').value   = c?.opposite   || '';
  document.getElementById('cm-filingdate').value = c?.filingDate || '';
  document.getElementById('cm-nextdate').value   = c?.nextDate   || '';
  document.getElementById('cm-status').value     = c?.status     || '';

  ['matterno','caseno','client','applicant','opposite','filingdate','status'].forEach(f =>
    document.getElementById(`cm-err-${f}`).textContent = ''
  );
  document.getElementById('caseModalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('caseModalOverlay').classList.remove('open');
  editingId = null;
}

window.openEdit = function(id) {
  const c = loadCases().find(x => x.id === id);
  if (c) openModal(c);
};

document.getElementById('btnAddCase').addEventListener('click',    () => openModal());
document.getElementById('caseModalClose').addEventListener('click',  closeModal);
document.getElementById('caseModalCancel').addEventListener('click', closeModal);
document.getElementById('caseModalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('caseModalOverlay')) closeModal();
});

// ── Form submit
document.getElementById('caseModalForm').addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  const req = (id, errId, msg) => {
    const val = document.getElementById(id).value.trim();
    if (!val) { document.getElementById(errId).textContent = msg; valid = false; return ''; }
    document.getElementById(errId).textContent = '';
    return val;
  };

  const matterNo   = req('cm-matterno',   'cm-err-matterno',   'Matter No. is required.');
  const caseNo     = req('cm-caseno',     'cm-err-caseno',     'Case No. is required.');
  const client     = req('cm-client',     'cm-err-client',     'Client name is required.');
  const applicant  = req('cm-applicant',  'cm-err-applicant',  'Applicant name is required.');
  const opposite   = req('cm-opposite',   'cm-err-opposite',   'Opposite party is required.');
  const filingDate = req('cm-filingdate', 'cm-err-filingdate', 'Date of filing is required.');
  const status     = req('cm-status',     'cm-err-status',     'Please select a status.');
  if (!valid) return;

  const list = loadCases();
  const entry = {
    matterNo, caseNo, client, applicant, opposite, filingDate, status,
    company:  document.getElementById('cm-company').value.trim(),
    nextDate: document.getElementById('cm-nextdate').value,
  };

  if (editingId) {
    const idx = list.findIndex(c => c.id === editingId);
    if (idx > -1) list[idx] = { ...list[idx], ...entry };
  } else {
    list.push({ id: nextId(list), ...entry });
  }

  saveCases(list);
  renderTable(getFiltered());
  closeModal();
});

// ── Delete Modal
let deletingId = null;

window.openDelete = function(id) {
  const c = loadCases().find(x => x.id === id);
  if (!c) return;
  deletingId = id;
  document.getElementById('deleteCaseName').textContent = `${c.caseNo} — ${c.client}`;
  document.getElementById('caseDeleteOverlay').classList.add('open');
};

function closeDelete() {
  document.getElementById('caseDeleteOverlay').classList.remove('open');
  deletingId = null;
}

document.getElementById('caseDeleteClose').addEventListener('click',   closeDelete);
document.getElementById('caseDeleteCancel').addEventListener('click',  closeDelete);
document.getElementById('caseDeleteOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('caseDeleteOverlay')) closeDelete();
});

document.getElementById('caseDeleteConfirm').addEventListener('click', () => {
  if (!deletingId) return;
  saveCases(loadCases().filter(c => c.id !== deletingId));
  renderTable(getFiltered());
  closeDelete();
});

// ── View Detail Modal
function openView(id) {
  const c = loadCases().find(x => x.id === id);
  if (!c) return;
  const row = (label, value, full = false) => `
    <div class="vd-item${full ? ' vd-full' : ''}">
      <span class="vd-label">${label}</span>
      <span class="vd-value${value ? '' : ' empty'}">${value || '—'}</span>
    </div>`;

  document.getElementById('caseViewBody').innerHTML =
    row('Matter No.',       c.matterNo)  +
    row('Case No.',         c.caseNo)    +
    row('Client Name',      c.client)    +
    row('Company Name',     c.company)   +
    row('Applicant',        c.applicant) +
    row('Opposite Party',   c.opposite)  +
    row('Date of Filing',   fmtDate(c.filingDate)) +
    row('Next Date',        fmtDate(c.nextDate))   +
    row('Status',           c.status);

  document.getElementById('caseViewOverlay').classList.add('open');
}

document.getElementById('caseViewClose').addEventListener('click', () =>
  document.getElementById('caseViewOverlay').classList.remove('open')
);
document.getElementById('caseViewOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('caseViewOverlay'))
    document.getElementById('caseViewOverlay').classList.remove('open');
});

// ── Init
renderTable(getFiltered());
