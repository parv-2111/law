// ── Helpers
function getTime(ts) {
  return new Date(ts || Date.now()).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
}
function getDateLabel(ts) {
  const d = new Date(ts), today = new Date(), yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())    return 'Today';
  if (d.toDateString() === yest.toDateString())     return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// ── Load all per-matter chat keys from localStorage
// Key format: dkcorporate_chat_{email}_{matterId}
function getAllChatEntries() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith('dkcorporate_chat_')) continue;

    // Strip prefix
    const rest = key.replace('dkcorporate_chat_', '');

    // Split on last underscore to separate email from matterId
    // email can contain underscores so we split from the right
    // matterId is numeric (Date.now()) or 'general'
    const lastUnderscore = rest.lastIndexOf('_');
    if (lastUnderscore === -1) {
      // Old format: dkcorporate_chat_{email} — treat as general
      entries.push({ key, email: rest, matterId: 'general', matterName: 'General Chat' });
    } else {
      const email    = rest.slice(0, lastUnderscore);
      const matterId = rest.slice(lastUnderscore + 1);
      // Resolve matter name from user's matters in localStorage
      const matterName = getMatterName(email, matterId);
      entries.push({ key, email, matterId, matterName });
    }
  }
  return entries;
}

function getMatterName(email, matterId) {
  if (matterId === 'general') return 'General Chat';
  try {
    const matters = JSON.parse(localStorage.getItem(`dkcorporate_matters_${email}`) || '[]');
    const m = matters.find(x => String(x.id) === String(matterId));
    return m ? m.name : `Matter #${String(matterId).slice(-6)}`;
  } catch(e) { return `Matter #${String(matterId).slice(-6)}`; }
}

function loadChat(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveChat(key, msgs) {
  localStorage.setItem(key, JSON.stringify(msgs));
}

// ── State
let activeKey = null;

// ── Render client list
function renderClientList(filter = '') {
  const entries = getAllChatEntries();
  const list    = document.getElementById('acClientList');
  document.getElementById('clientCount').textContent = entries.length;

  const q = filter.toLowerCase();
  const filtered = entries.filter(e =>
    e.email.toLowerCase().includes(q) ||
    e.matterName.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    list.innerHTML = `<div class="ac-empty"><i class="fas fa-inbox"></i><p>No client chats yet.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(entry => {
    const msgs    = loadChat(entry.key);
    const last    = msgs[msgs.length - 1];
    const unread  = msgs.filter(m => m.type === 'sent' && !m.adminRead).length;
    const preview = last ? (last.fileData ? `📎 ${last.fileData.name}` : last.text) : 'No messages yet';
    const timeStr = last ? getTime(last.ts) : '';
    const initial = entry.email.charAt(0).toUpperCase();
    const isActive = entry.key === activeKey ? 'active' : '';

    return `
      <div class="ac-client-item ${isActive}" onclick="selectChat('${entry.key}')">
        <div class="ac-client-avatar">${initial}</div>
        <div class="ac-client-info">
          <div class="ac-client-name">${entry.matterName}</div>
          <div class="ac-client-preview" style="font-size:0.7rem;color:var(--muted);margin-bottom:2px;">${entry.email}</div>
          <div class="ac-client-preview">${preview}</div>
        </div>
        <div class="ac-client-meta">
          <span class="ac-client-time">${timeStr}</span>
          ${unread ? `<span class="ac-unread-badge">${unread}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Select a chat
window.selectChat = function(key) {
  activeKey = key;

  // Mark all sent messages as admin-read
  const msgs = loadChat(key).map(m => ({ ...m, adminRead: true }));
  saveChat(key, msgs);

  // Find entry info
  const entries = getAllChatEntries();
  const entry   = entries.find(e => e.key === key) || { email: key, matterName: 'Chat' };

  // Update header
  document.getElementById('acHeaderAvatar').textContent = entry.email.charAt(0).toUpperCase();
  document.getElementById('acHeaderName').textContent   = entry.matterName;
  document.getElementById('acHeaderSub').textContent    = entry.email + ' · ' + msgs.length + ' messages';

  // Show chat panel
  document.getElementById('acNoChat').style.display     = 'none';
  document.getElementById('acActiveChat').style.display = 'flex';

  renderMessages(msgs, entry.email);
  renderClientList(document.getElementById('acSearch').value);
};

// ── Render messages
function renderMessages(msgs, clientEmail) {
  const container = document.getElementById('acMessages');
  container.innerHTML = '';
  let lastLabel = '';

  msgs.forEach(msg => {
    const label = getDateLabel(msg.ts);
    if (label !== lastLabel) {
      lastLabel = label;
      container.innerHTML += `<div class="ac-date-divider"><span>${label}</span></div>`;
    }

    const isAdmin  = msg.type === 'received';
    const rowClass = isAdmin ? 'admin' : 'client';
    const avText   = isAdmin ? '<i class="fas fa-balance-scale"></i>' : (clientEmail || '?').charAt(0).toUpperCase();

    let content = '';
    if (msg.fileData) {
      if (msg.fileData.isImage && msg.fileData.url) {
        content = `<img src="${msg.fileData.url}" class="ac-msg-img" alt="${msg.fileData.name}"/>`;
      } else {
        content = `<div style="display:flex;align-items:center;gap:8px;"><i class="fas fa-file" style="color:var(--gold)"></i><span>${msg.fileData.name}</span></div>`;
      }
    }
    if (msg.text) content += `<span>${msg.text}</span>`;

    container.innerHTML += `
      <div class="ac-msg-row ${rowClass}">
        <div class="ac-msg-av">${avText}</div>
        <div class="ac-bubble">
          ${content}
          <span class="ac-msg-time">${getTime(msg.ts)}</span>
        </div>
      </div>`;
  });

  container.scrollTop = container.scrollHeight;
}

// ── Send admin reply
function sendReply() {
  if (!activeKey) return;
  const input = document.getElementById('acInput');
  const text  = input.innerText.trim();
  if (!text) return;

  const msgs = loadChat(activeKey);
  const msg  = { text, type: 'received', ts: Date.now(), adminRead: true };
  msgs.push(msg);
  saveChat(activeKey, msgs);

  input.innerText = '';

  const entries = getAllChatEntries();
  const entry   = entries.find(e => e.key === activeKey) || {};
  renderMessages(msgs, entry.email);
  renderClientList(document.getElementById('acSearch').value);
  document.getElementById('acHeaderSub').textContent = (entry.email || '') + ' · ' + msgs.length + ' messages';
}

document.getElementById('acSendBtn').addEventListener('click', sendReply);
document.getElementById('acInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
});

// ── Clear chat
document.getElementById('acClearBtn').addEventListener('click', () => {
  if (!activeKey) return;
  const entries = getAllChatEntries();
  const entry   = entries.find(e => e.key === activeKey) || {};
  if (!confirm(`Clear all chat history for "${entry.matterName || activeKey}"?`)) return;
  localStorage.removeItem(activeKey);
  activeKey = null;
  document.getElementById('acNoChat').style.display     = 'flex';
  document.getElementById('acActiveChat').style.display = 'none';
  renderClientList();
});

// ── Search
document.getElementById('acSearch').addEventListener('input', e => {
  renderClientList(e.target.value);
});

// ── Auto-refresh every 3s
setInterval(() => {
  renderClientList(document.getElementById('acSearch').value);
  if (activeKey) {
    const msgs    = loadChat(activeKey);
    const entries = getAllChatEntries();
    const entry   = entries.find(e => e.key === activeKey) || {};
    renderMessages(msgs, entry.email);
  }
}, 3000);

// ── Init
renderClientList();
