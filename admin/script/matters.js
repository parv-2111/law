const MATTERS_ADMIN_KEY = 'dkcorporate_admin_matters';

// ── One-time cleanup: wipe any previously seeded fake data
(function() {
  const raw = localStorage.getItem(MATTERS_ADMIN_KEY);
  if (raw) {
    try {
      const list = JSON.parse(raw);
      // Seed data had ids 1-5 with known fake clients
      const fakeClients = ['Rahul Sharma','Priya Mehta','Amit Patel','Sneha Rao','Karan Singh'];
      const allSeed = list.length <= 5 && list.every(m => fakeClients.includes(m.client));
      if (allSeed) localStorage.removeItem(MATTERS_ADMIN_KEY);
    } catch(e) { localStorage.removeItem(MATTERS_ADMIN_KEY); }
  }
})();

function loadMatters() {
  const raw = localStorage.getItem(MATTERS_ADMIN_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveMatters(list) { localStorage.setItem(MATTERS_ADMIN_KEY, JSON.stringify(list)); }
function nextId(list) { return list.length ? Math.max(...list.map(m => m.id)) + 1 : 1; }
function nextMatterNo(list) {
  const year = new Date().getFullYear();
  const num  = String(list.length + 1).padStart(3, '0');
  return `MAT-${year}-${num}`;
}

// ── Render table
function renderTable(list) {
  const tbody = document.getElementById('mattersBody');
  const empty = document.getElementById('mattersEmpty');
  document.getElementById('matterCount').textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(m => `
    <tr data-id="${m.id}" onclick="openView(${m.id})">
      <td class="td-mno">${m.matterNo}</td>
      <td title="${m.name}">${m.name}</td>
      <td title="${m.client}">${m.client}</td>
      <td class="td-mono">${m.fileNo || '—'}</td>
      <td class="td-mono">${m.caseNo || '—'}</td>
      <td><span class="type-badge ${m.type}">${m.type}</span></td>
      <td><span class="status-badge ${m.status}">${m.status}</span></td>
      <td style="color:var(--muted);">${m.preparedBy}</td>
      <td onclick="event.stopPropagation()">
        <a href="admin_chat.html" class="td-icon-btn" title="Open Chat for ${m.client}">
          <i class="fas fa-comments"></i>
        </a>
      </td>
      <td onclick="event.stopPropagation()">
        <button class="td-icon-btn ${m.docs ? 'has-docs' : ''}" title="${m.docs || 'No documents'}" onclick="showDocs(${m.id})">
          <i class="fas fa-paperclip"></i>
        </button>
      </td>
      <td onclick="event.stopPropagation()">
        <div class="td-actions">
          <button class="btn-edit"   onclick="openEdit(${m.id})"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn-delete" onclick="openDelete(${m.id})"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Filter + Search
function getFiltered() {
  let list = loadMatters();
  const q      = document.getElementById('matterSearch').value.trim().toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const type   = document.getElementById('filterType').value;

  if (q)      list = list.filter(m => m.name.toLowerCase().includes(q) || m.client.toLowerCase().includes(q) || m.fileNo.toLowerCase().includes(q) || m.matterNo.toLowerCase().includes(q));
  if (status) list = list.filter(m => m.status === status);
  if (type)   list = list.filter(m => m.type === type);
  return list;
}

document.getElementById('matterSearch').addEventListener('input',  () => renderTable(getFiltered()));
document.getElementById('filterStatus').addEventListener('change', () => renderTable(getFiltered()));
document.getElementById('filterType').addEventListener('change',   () => renderTable(getFiltered()));

// ── Docs tooltip
window.showDocs = function(id) {
  const m = loadMatters().find(x => x.id === id);
  if (!m) return;
  alert(m.docs ? `Documents for "${m.name}":\n\n${m.docs}` : 'No documents attached to this matter.');
};

// ── Add / Edit Modal
let editingId = null;

function openMatterModal(matter = null) {
  editingId = matter ? matter.id : null;
  document.getElementById('matterModalTitle').textContent = matter ? 'Edit Matter' : 'Add Matter';

  document.getElementById('mm-name').value       = matter?.name       || '';
  document.getElementById('mm-client').value     = matter?.client     || '';
  document.getElementById('mm-email').value      = matter?.email      || '';
  document.getElementById('mm-fileno').value     = matter?.fileNo     || '';
  document.getElementById('mm-caseno').value     = matter?.caseNo     || '';
  document.getElementById('mm-preparedby').value = matter?.preparedBy || '';
  document.getElementById('mm-type').value       = matter?.type       || '';
  document.getElementById('mm-status').value     = matter?.status     || '';
  document.getElementById('mm-docs').value       = matter?.docs       || '';

  // Clear errors
  ['name','client','preparedby','type','status'].forEach(f => {
    document.getElementById(`mm-err-${f}`).textContent = '';
  });

  document.getElementById('matterModalOverlay').classList.add('open');
}

function closeMatterModal() {
  document.getElementById('matterModalOverlay').classList.remove('open');
  editingId = null;
}

window.openEdit = function(id) {
  location.href = 'matters_edit.html?id=' + id;
};

document.getElementById('btnAddMatter').addEventListener('click',    () => openMatterModal());
document.getElementById('matterModalClose').addEventListener('click', closeMatterModal);
document.getElementById('matterModalCancel').addEventListener('click', closeMatterModal);
document.getElementById('matterModalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('matterModalOverlay')) closeMatterModal();
});

// ── Form submit (Add / Edit)
document.getElementById('matterModalForm').addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  const req = (id, errId, msg) => {
    const val = document.getElementById(id).value.trim();
    if (!val) { document.getElementById(errId).textContent = msg; valid = false; return ''; }
    document.getElementById(errId).textContent = '';
    return val;
  };

  const name       = req('mm-name',       'mm-err-name',       'Matter name is required.');
  const client     = req('mm-client',     'mm-err-client',     'Client name is required.');
  const preparedBy = req('mm-preparedby', 'mm-err-preparedby', 'Prepared by is required.');
  const type       = req('mm-type',       'mm-err-type',       'Please select a type.');
  const status     = req('mm-status',     'mm-err-status',     'Please select a status.');
  if (!valid) return;

  const list = loadMatters();

  if (editingId) {
    const idx = list.findIndex(m => m.id === editingId);
    if (idx > -1) {
      list[idx] = {
        ...list[idx], name, client, preparedBy, type, status,
        email:  document.getElementById('mm-email').value.trim(),
        fileNo: document.getElementById('mm-fileno').value.trim(),
        caseNo: document.getElementById('mm-caseno').value.trim(),
        docs:   document.getElementById('mm-docs').value.trim(),
      };
    }
  } else {
    list.push({
      id: nextId(list),
      matterNo: nextMatterNo(list),
      name, client, preparedBy, type, status,
      email:  document.getElementById('mm-email').value.trim(),
      fileNo: document.getElementById('mm-fileno').value.trim(),
      caseNo: document.getElementById('mm-caseno').value.trim(),
      docs:   document.getElementById('mm-docs').value.trim(),
    });
  }

  saveMatters(list);
  renderTable(getFiltered());
  closeMatterModal();
});

// ── Delete Modal
let deletingId = null;

window.openDelete = function(id) {
  const m = loadMatters().find(x => x.id === id);
  if (!m) return;
  deletingId = id;
  document.getElementById('deleteMatName').textContent = m.name;
  document.getElementById('deleteOverlay').classList.add('open');
};

function closeDelete() {
  document.getElementById('deleteOverlay').classList.remove('open');
  deletingId = null;
}

document.getElementById('deleteClose').addEventListener('click',     closeDelete);
document.getElementById('deleteCancelBtn').addEventListener('click', closeDelete);
document.getElementById('deleteOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('deleteOverlay')) closeDelete();
});

document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
  if (!deletingId) return;
  const list = loadMatters().filter(m => m.id !== deletingId);
  saveMatters(list);
  renderTable(getFiltered());
  closeDelete();
});

// ── View Detail Modal
function openView(id) {
  const m = loadMatters().find(x => x.id === id);
  if (!m) return;
  const row = (label, value, full = false) => `
    <div class="vd-item${full ? ' vd-full' : ''}">
      <span class="vd-label">${label}</span>
      <span class="vd-value${value ? '' : ' empty'}">${value || '—'}</span>
    </div>`;

  document.getElementById('matterViewBody').innerHTML =
    row('Matter No.',          m.matterNo)           +
    row('Matter Name',         m.name,      true)    +
    row('Client Name',         m.client)             +
    row('Client Email',        m.email)              +
    row('File No.',            m.fileNo)             +
    row('Case No.',            m.caseNo)             +
    row('Type',                m.type)               +
    row('Status',              m.status)             +
    row('Prepared By',         m.preparedBy)         +
    row('Attached Documents',  m.docs,      true);

  document.getElementById('matterViewOverlay').classList.add('open');
}

document.getElementById('matterViewClose').addEventListener('click', () =>
  document.getElementById('matterViewOverlay').classList.remove('open')
);
document.getElementById('matterViewOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('matterViewOverlay'))
    document.getElementById('matterViewOverlay').classList.remove('open');
});

// ── Init
renderTable(getFiltered());
