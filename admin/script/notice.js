const NOTICE_KEY = 'dkcorporate_admin_notices';

// ── One-time cleanup: wipe any previously seeded fake data
(function() {
  const raw = localStorage.getItem(NOTICE_KEY);
  if (raw) {
    try {
      const list = JSON.parse(raw);
      // Seed data had ids 1-5 with known fake track IDs
      const allSeed = list.length <= 5 && list.every(n => n.trackId && n.trackId.startsWith('TRACK-2026'));
      if (allSeed) localStorage.removeItem(NOTICE_KEY);
    } catch(e) { localStorage.removeItem(NOTICE_KEY); }
  }
})();

function loadNotices() {
  const raw = localStorage.getItem(NOTICE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveNotices(list) { localStorage.setItem(NOTICE_KEY, JSON.stringify(list)); }
function nextId(list) { return list.length ? Math.max(...list.map(n => n.id)) + 1 : 1; }

function fmtDate(str) {
  if (!str) return '<span style="color:var(--muted)">—</span>';
  return new Date(str).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

const STATUS_STYLES = {
  sent:     'background:rgba(74,144,217,0.15);color:#4a90d9;',
  received: 'background:rgba(62,207,142,0.15);color:#3ecf8e;',
  returned: 'background:rgba(224,85,85,0.15);color:#e05555;',
  pending:  'background:rgba(201,162,39,0.15);color:#c9a227;',
};

function renderTable(list) {
  const tbody = document.getElementById('noticeBody');
  const empty = document.getElementById('noticeEmpty');
  document.getElementById('noticeCount').textContent = list.length;

  if (!list.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map((n, i) => `
    <tr data-id="${n.id}" onclick="openView(${n.id})">
      <td class="td-mno">${String(i + 1).padStart(2, '0')}</td>
      <td title="${n.client}">${n.client}</td>
      <td style="color:var(--muted);" title="${n.address}">${n.address}</td>
      <td class="td-mono">${n.trackId}</td>
      <td style="white-space:nowrap;">${fmtDate(n.sendDate)}</td>
      <td style="white-space:nowrap;">${fmtDate(n.receivedDate)}</td>
      <td style="white-space:nowrap;">${fmtDate(n.returnedDate)}</td>
      <td title="${n.returnReason}">${n.returnReason || '<span style="color:var(--muted)">—</span>'}</td>
      <td><span class="status-badge" style="${STATUS_STYLES[n.status] || ''}">${n.status}</span></td>
      <td onclick="event.stopPropagation()">
        <div class="td-actions">
          <button class="btn-edit"   onclick="openEdit(${n.id})"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn-delete" onclick="openDelete(${n.id})"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFiltered() {
  let list = loadNotices();
  const q  = document.getElementById('noticeSearch').value.trim().toLowerCase();
  const st = document.getElementById('filterNoticeStatus').value;
  if (q)  list = list.filter(n =>
    n.client.toLowerCase().includes(q)  ||
    n.address.toLowerCase().includes(q) ||
    n.trackId.toLowerCase().includes(q)
  );
  if (st) list = list.filter(n => n.status === st);
  return list;
}

document.getElementById('noticeSearch').addEventListener('input',        () => renderTable(getFiltered()));
document.getElementById('filterNoticeStatus').addEventListener('change', () => renderTable(getFiltered()));

// ── Add / Edit Modal
let editingId = null;

function openNoticeModal(n = null) {
  editingId = n ? n.id : null;
  document.getElementById('noticeModalTitle').textContent = n ? 'Edit Notice' : 'Add Notice';

  document.getElementById('nm-client').value       = n?.client       || '';
  document.getElementById('nm-trackid').value      = n?.trackId      || '';
  document.getElementById('nm-address').value      = n?.address      || '';
  document.getElementById('nm-senddate').value     = n?.sendDate     || '';
  document.getElementById('nm-receiveddate').value = n?.receivedDate || '';
  document.getElementById('nm-returneddate').value = n?.returnedDate || '';
  document.getElementById('nm-returnreason').value = n?.returnReason || '';
  document.getElementById('nm-status').value       = n?.status       || '';

  ['client','trackid','address','senddate','status'].forEach(f =>
    document.getElementById(`nm-err-${f}`).textContent = ''
  );
  document.getElementById('noticeModalOverlay').classList.add('open');
}

function closeNoticeModal() {
  document.getElementById('noticeModalOverlay').classList.remove('open');
  editingId = null;
}

window.openEdit = function(id) {
  location.href = 'notices_edit.html?id=' + id;
};

document.getElementById('btnAddNotice').addEventListener('click',     () => openNoticeModal());
document.getElementById('noticeModalClose').addEventListener('click',  closeNoticeModal);
document.getElementById('noticeModalCancel').addEventListener('click', closeNoticeModal);
document.getElementById('noticeModalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('noticeModalOverlay')) closeNoticeModal();
});

// ── Form submit
document.getElementById('noticeModalForm').addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  const req = (id, errId, msg) => {
    const val = document.getElementById(id).value.trim();
    if (!val) { document.getElementById(errId).textContent = msg; valid = false; return ''; }
    document.getElementById(errId).textContent = '';
    return val;
  };

  const client   = req('nm-client',   'nm-err-client',   'Client name is required.');
  const trackId  = req('nm-trackid',  'nm-err-trackid',  'Track ID is required.');
  const address  = req('nm-address',  'nm-err-address',  'Address is required.');
  const sendDate = req('nm-senddate', 'nm-err-senddate', 'Send date is required.');
  const status   = req('nm-status',   'nm-err-status',   'Please select a status.');
  if (!valid) return;

  const list  = loadNotices();
  const entry = {
    client, trackId, address, sendDate, status,
    receivedDate: document.getElementById('nm-receiveddate').value,
    returnedDate: document.getElementById('nm-returneddate').value,
    returnReason: document.getElementById('nm-returnreason').value.trim(),
  };

  if (editingId) {
    const idx = list.findIndex(n => n.id === editingId);
    if (idx > -1) list[idx] = { ...list[idx], ...entry };
  } else {
    list.push({ id: nextId(list), ...entry });
  }

  saveNotices(list);
  renderTable(getFiltered());
  closeNoticeModal();
});

// ── Delete Modal
let deletingId = null;

window.openDelete = function(id) {
  const n = loadNotices().find(x => x.id === id);
  if (!n) return;
  deletingId = id;
  document.getElementById('deleteNoticeName').textContent = n.client;
  document.getElementById('noticeDeleteOverlay').classList.add('open');
};

function closeDelete() {
  document.getElementById('noticeDeleteOverlay').classList.remove('open');
  deletingId = null;
}

document.getElementById('noticeDeleteClose').addEventListener('click',   closeDelete);
document.getElementById('noticeDeleteCancel').addEventListener('click',  closeDelete);
document.getElementById('noticeDeleteOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('noticeDeleteOverlay')) closeDelete();
});

document.getElementById('noticeDeleteConfirm').addEventListener('click', () => {
  if (!deletingId) return;
  saveNotices(loadNotices().filter(n => n.id !== deletingId));
  renderTable(getFiltered());
  closeDelete();
});

// ── View Detail Modal
function openView(id) {
  const n = loadNotices().find(x => x.id === id);
  if (!n) return;
  const row = (label, value, full = false) => `
    <div class="vd-item${full ? ' vd-full' : ''}">
      <span class="vd-label">${label}</span>
      <span class="vd-value${value ? '' : ' empty'}">${value || '—'}</span>
    </div>`;

  document.getElementById('noticeViewBody').innerHTML =
    row('Client Name',       n.client)                  +
    row('Track ID',          n.trackId)                 +
    row('Address',           n.address,        true)    +
    row('Send Date',         fmtDate(n.sendDate))       +
    row('Received Date',     fmtDate(n.receivedDate))   +
    row('Returned Date',     fmtDate(n.returnedDate))   +
    row('Status',            n.status)                  +
    row('Reason for Return', n.returnReason,   true);

  document.getElementById('noticeViewOverlay').classList.add('open');
}

document.getElementById('noticeViewClose').addEventListener('click', () =>
  document.getElementById('noticeViewOverlay').classList.remove('open')
);
document.getElementById('noticeViewOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('noticeViewOverlay'))
    document.getElementById('noticeViewOverlay').classList.remove('open');
});

// ── Init
renderTable(getFiltered());
