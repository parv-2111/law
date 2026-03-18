// ── Load user email
const email = sessionStorage.getItem('userEmail') || 'user@email.com';
document.getElementById('sideAvatar').textContent = email.charAt(0).toUpperCase();
document.getElementById('sideEmail').textContent  = email;

const messagesEl  = document.getElementById('chatMessages');
const msgInput    = document.getElementById('msgInput');
const sendBtn     = document.getElementById('sendBtn');
const typingEl    = document.getElementById('typingIndicator');
const lastPreview = document.getElementById('lastPreview');
const lastTime    = document.getElementById('lastTime');

// ── Storage key per user so different logins have separate chats
const STORAGE_KEY = `lexfirm_chat_${email}`;

// ── Auto replies
const autoReplies = [
  "Thank you for reaching out! Our legal team will review your query shortly. ⚖️",
  "Could you please provide more details about your matter so we can assist you better?",
  "We understand your concern. One of our attorneys will get back to you within 24 hours.",
  "For urgent matters, please call us at +91 98765 43210.",
  "Your matter has been noted. We'll prepare a detailed response for you soon.",
  "Thank you for trusting LexFirm. We're here to help you every step of the way. 🏛️",
];

const FILE_ICONS = {
  pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
  ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
};

// ── Load messages from localStorage
function loadMessages() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

// ── Save messages to localStorage
function saveMessage(msg) {
  const stored = localStorage.getItem(STORAGE_KEY);
  const msgs = stored ? JSON.parse(stored) : [];
  msgs.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
}

function getTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getDateLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Render a single message bubble (from data object)
function renderBubble(msg) {
  const row = document.createElement('div');
  row.className = `msg-row ${msg.type}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = msg.type === 'sent'
    ? email.charAt(0).toUpperCase()
    : '<i class="fas fa-balance-scale"></i>';

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${msg.type}`;

  if (msg.fileData) {
    if (msg.fileData.isImage && msg.fileData.url) {
      bubble.innerHTML = `<img src="${msg.fileData.url}" class="msg-img" alt="${msg.fileData.name}"/>`;
    } else {
      bubble.innerHTML = `
        <div class="msg-file">
          <i class="fas ${msg.fileData.icon || 'fa-file'}"></i>
          <span>${msg.fileData.name}</span>
        </div>`;
    }
  }

  if (msg.text) {
    const p = document.createElement('p');
    p.textContent = msg.text;
    bubble.appendChild(p);
  }

  const timeEl = document.createElement('span');
  timeEl.className = 'msg-time';
  timeEl.innerHTML = `${getTime(msg.ts)} <i class="fas fa-check-double"></i>`;
  bubble.appendChild(timeEl);

  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
}

// ── Insert date divider if needed
let lastDateLabel = '';
function maybeInsertDateDivider(ts) {
  const label = getDateLabel(ts);
  if (label !== lastDateLabel) {
    lastDateLabel = label;
    const div = document.createElement('div');
    div.className = 'date-divider';
    div.innerHTML = `<span>${label}</span>`;
    messagesEl.appendChild(div);
  }
}

// ── Append + save a new message
function appendMessage(text, type, fileData = null, save = true) {
  const msg = { text, type, fileData, ts: Date.now() };
  maybeInsertDateDivider(msg.ts);
  renderBubble(msg);
  scrollBottom();

  // Update sidebar preview
  lastPreview.textContent = fileData ? `📎 ${fileData.name}` : text;
  lastTime.textContent    = getTime(msg.ts);

  if (save) saveMessage(msg);
}

// ── Restore all previous messages on load
function restoreChat() {
  const msgs = loadMessages();

  if (!msgs || msgs.length === 0) {
    // First time — show default welcome messages
    const welcome = [
      { text: "👋 Hello! Welcome to LexFirm Legal Associates.\nHow can we assist you today? Feel free to describe your legal matter.", type: 'received', ts: Date.now() },
      { text: "Our team is available Mon–Sat, 9AM–7PM. We'll respond as quickly as possible. ⚖️", type: 'received', ts: Date.now() + 500 },
    ];
    welcome.forEach(m => {
      maybeInsertDateDivider(m.ts);
      renderBubble(m);
      saveMessage(m);
    });
    lastPreview.textContent = "Hello! How can we help you today?";
    lastTime.textContent    = getTime();
  } else {
    // Restore saved messages
    msgs.forEach(msg => {
      maybeInsertDateDivider(msg.ts);
      renderBubble(msg);
    });
    const last = msgs[msgs.length - 1];
    lastPreview.textContent = last.fileData ? `📎 ${last.fileData.name}` : last.text;
    lastTime.textContent    = getTime(last.ts);
  }

  scrollBottom();
}

// ── Show typing then auto reply
function showTypingAndReply() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const msgs   = stored ? JSON.parse(stored) : [];
  const sentCount = msgs.filter(m => m.type === 'sent').length;
  const reply  = autoReplies[(sentCount - 1) % autoReplies.length];

  typingEl.classList.add('show');
  scrollBottom();

  setTimeout(() => {
    typingEl.classList.remove('show');
    appendMessage(reply, 'received');
  }, 1200 + Math.random() * 800);
}

// ── Send message
function sendMessage() {
  const text = msgInput.innerText.trim();
  if (!text) return;
  appendMessage(text, 'sent');
  msgInput.innerText = '';
  showTypingAndReply();
}

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── File attachment
const fileAttach = document.getElementById('fileAttach');
document.getElementById('attachBtn').addEventListener('click', () => fileAttach.click());

fileAttach.addEventListener('change', () => {
  Array.from(fileAttach.files).forEach(file => {
    const ext     = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext);
    const icon    = FILE_ICONS[ext] || 'fa-file';

    if (isImage) {
      // Convert image to base64 so it persists in localStorage
      const reader = new FileReader();
      reader.onload = () => {
        appendMessage('', 'sent', { name: file.name, isImage: true, url: reader.result, icon });
        showTypingAndReply();
      };
      reader.readAsDataURL(file);
    } else {
      appendMessage('', 'sent', { name: file.name, isImage: false, url: null, icon });
      showTypingAndReply();
    }
  });
  fileAttach.value = '';
});

// ── Emoji picker
const emojis = ['😊','👍','🙏','⚖️','🏛️','📄','✅','❓','📞','💼','🔒','📝','🤝','👋','😔','💪','🎯','📅'];
const picker  = document.createElement('div');
picker.className = 'emoji-picker';
emojis.forEach(em => {
  const span = document.createElement('span');
  span.textContent = em;
  span.addEventListener('click', () => {
    msgInput.innerText += em;
    picker.classList.remove('open');
    msgInput.focus();
  });
  picker.appendChild(span);
});
document.querySelector('.chat-window').appendChild(picker);

document.getElementById('emojiBtn').addEventListener('click', e => {
  e.stopPropagation();
  picker.classList.toggle('open');
});
document.addEventListener('click', () => picker.classList.remove('open'));

// ── Init
restoreChat();
