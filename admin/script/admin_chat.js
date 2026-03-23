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

// ── Load all client chat keys from localStorage
function getAllClientEmails() {
  const emails = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('lexfirm_chat_')) {
      emails.push(key.replace('lexfirm_chat_', ''));
    }
  }
  return emails;
}

function loadChat(email) {
  const raw = localStorage.getItem(`lexfirm_chat_${email}`);
  return raw ? JSON.parse(raw) : [];
}

function saveChat(email, msgs) {
  localStorage.setItem(`lexfirm_chat_${email}`, JSON.stringify(msgs));
}

// ── State
let activeEmail = null;

// ── Render client list
function renderClientList(filter = '') {
  const emails = getAllClientEmails();
  const list   = document.getElementById('acClientList');
  document.getElementById('clientCount').textContent = emails.length;

  const filtered = emails.filter(e => e.toLowerCase().includes(filter.toLowerCase()));

  if (!filtered.length) {
    list.innerHTML = `<div class="ac-empty"><i class="fas fa-inbox"></i><p>No client chats yet.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(email => {
    const msgs     = loadChat(email);
    const last     = msgs[msgs.length - 1];
    const unread   = msgs.filter(m => m.type === 'sent' && !m.adminRead).length;
    const preview  = last ? (last.fileData ? `📎 ${last.fileData.name}` : last.text) : 'No messages';
    const timeStr  = last ? getTime(last.ts) : '';
    const initial  = email.charAt(0).toUpperCase();
    const isActive = email === activeEmail ? 'active' : '';

    return `
      <div class="ac-client-item ${isActive}" onclick="selectClient('${email}')">
        <div class="ac-client-avatar">${initial}</div>
        <div class="ac-client-info">
          <div class="ac-client-name">${email}</div>
          <div class="ac-client-preview">${preview}</div>
        </div>
        <div class="ac-client-meta">
          <span class="ac-client-time">${timeStr}</span>
          ${unread ? `<span class="ac-unread-badge">${unread}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Select a client and load their chat
window.selectClient = function(email) {
  activeEmail = email;

  // Mark all sent messages as read
  const msgs = loadChat(email).map(m => ({ ...m, adminRead: true }));
  saveChat(email, msgs);

  // Update header
  document.getElementById('acHeaderAvatar').textContent = email.charAt(0).toUpperCase();
  document.getElementById('acHeaderName').textContent   = email;
  document.getElementById('acHeaderSub').textContent    = `${msgs.length} messages`;

  // Show chat panel
  document.getElementById('acNoChat').style.display    = 'none';
  document.getElementById('acActiveChat').style.display = 'flex';

  renderMessages(msgs);
  renderClientList(document.getElementById('acSearch').value);
};

// ── Render messages
function renderMessages(msgs) {
  const container = document.getElementById('acMessages');
  container.innerHTML = '';
  let lastLabel = '';

  msgs.forEach(msg => {
    const label = getDateLabel(msg.ts);
    if (label !== lastLabel) {
      lastLabel = label;
      container.innerHTML += `<div class="ac-date-divider"><span>${label}</span></div>`;
    }

    // client sent = 'sent', admin reply = 'received'
    const isAdmin  = msg.type === 'received';
    const rowClass = isAdmin ? 'admin' : 'client';
    const avText   = isAdmin ? '<i class="fas fa-balance-scale"></i>' : (activeEmail || '?').charAt(0).toUpperCase();

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
  if (!activeEmail) return;
  const input = document.getElementById('acInput');
  const text  = input.innerText.trim();
  if (!text) return;

  const msgs = loadChat(activeEmail);
  const msg  = { text, type: 'received', ts: Date.now(), adminRead: true };
  msgs.push(msg);
  saveChat(activeEmail, msgs);

  input.innerText = '';
  renderMessages(msgs);
  renderClientList(document.getElementById('acSearch').value);

  // Update header sub
  document.getElementById('acHeaderSub').textContent = `${msgs.length} messages`;
}

document.getElementById('acSendBtn').addEventListener('click', sendReply);
document.getElementById('acInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
});

// ── Clear chat
document.getElementById('acClearBtn').addEventListener('click', () => {
  if (!activeEmail) return;
  if (!confirm(`Clear all chat history for ${activeEmail}?`)) return;
  localStorage.removeItem(`lexfirm_chat_${activeEmail}`);
  activeEmail = null;
  document.getElementById('acNoChat').style.display    = 'flex';
  document.getElementById('acActiveChat').style.display = 'none';
  renderClientList();
});

// ── Search clients
document.getElementById('acSearch').addEventListener('input', e => {
  renderClientList(e.target.value);
});

// ── Auto-refresh client list every 3s to pick up new client messages
setInterval(() => {
  renderClientList(document.getElementById('acSearch').value);
  if (activeEmail) {
    const msgs = loadChat(activeEmail);
    renderMessages(msgs);
  }
}, 3000);

// ── Init
renderClientList();
