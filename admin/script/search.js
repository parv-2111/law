// Master search index — covers all pages and their keywords
const searchIndex = [
  // Dashboard
  { title: 'Dashboard',        desc: 'Overview of all stats',           icon: 'fa-gauge-high',    page: 'Dashboard',  url: 'index.html' },

  // Cases
  { title: 'Cases',            desc: 'View all legal cases',            icon: 'fa-folder-open',   page: 'Cases',      url: 'cases.html' },
  { title: 'Total Cases',      desc: '55 active cases',                 icon: 'fa-folder-open',   page: 'Cases',      url: 'cases.html' },
  { title: 'Open Cases',       desc: 'Currently open legal cases',      icon: 'fa-folder-open',   page: 'Cases',      url: 'cases.html' },
  { title: 'Case Management',  desc: 'Manage and track cases',          icon: 'fa-folder-open',   page: 'Cases',      url: 'cases.html' },

  // Clients
  { title: 'Clients',          desc: 'View all registered clients',     icon: 'fa-users',         page: 'Clients',    url: 'clients.html' },
  { title: 'Total Clients',    desc: '63 registered clients',           icon: 'fa-users',         page: 'Clients',    url: 'clients.html' },
  { title: 'Client List',      desc: 'Browse client directory',         icon: 'fa-users',         page: 'Clients',    url: 'clients.html' },
  { title: 'Client Profile',   desc: 'Individual client details',       icon: 'fa-user',          page: 'Clients',    url: 'clients.html' },

  // Payments
  { title: 'Payments',         desc: 'View all payment records',        icon: 'fa-credit-card',   page: 'Payments',   url: 'payments.html' },
  { title: 'Total Payments',   desc: '$48k total collected',            icon: 'fa-credit-card',   page: 'Payments',   url: 'payments.html' },
  { title: 'Invoices',         desc: 'Payment invoices and billing',    icon: 'fa-file-invoice',  page: 'Payments',   url: 'payments.html' },
  { title: 'Billing',          desc: 'Billing and payment history',     icon: 'fa-credit-card',   page: 'Payments',   url: 'payments.html' },

  // Matters
  { title: 'Matters',          desc: 'View all legal matters',          icon: 'fa-scale-balanced',page: 'Matters',    url: 'matters.html' },
  { title: 'Total Matters',    desc: '42 active legal matters',         icon: 'fa-scale-balanced',page: 'Matters',    url: 'matters.html' },
  { title: 'Legal Matters',    desc: 'Track and manage legal matters',  icon: 'fa-scale-balanced',page: 'Matters',    url: 'matters.html' },
  { title: 'Matter Management','desc': 'Organize legal matter files',   icon: 'fa-scale-balanced',page: 'Matters',    url: 'matters.html' },
];

const input   = document.getElementById('masterSearch');
const results = document.getElementById('searchResults');

input.addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  results.innerHTML = '';

  if (!q) { results.classList.remove('open'); return; }

  const matched = searchIndex.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q)  ||
    item.page.toLowerCase().includes(q)
  );

  if (matched.length === 0) {
    results.innerHTML = `<div class="search-no-result"><i class="fas fa-magnifying-glass"></i> No results for "<strong>${q}</strong>"</div>`;
  } else {
    matched.forEach(item => {
      const a = document.createElement('a');
      a.className = 'search-result-item';
      a.href = item.url;
      a.innerHTML = `
        <i class="fas ${item.icon}"></i>
        <div>
          <div>${highlight(item.title, q)}</div>
          <div style="font-size:0.75rem;color:var(--muted);margin-top:2px">${highlight(item.desc, q)}</div>
        </div>
        <span class="res-page">${item.page}</span>
      `;
      results.appendChild(a);
    });
  }

  results.classList.add('open');
});

// Close on outside click
document.addEventListener('click', e => {
  if (!input.contains(e.target) && !results.contains(e.target)) {
    results.classList.remove('open');
  }
});

// Highlight matched text
function highlight(text, q) {
  const regex = new RegExp(`(${q})`, 'gi');
  return text.replace(regex, '<mark style="background:rgba(201,162,39,0.3);color:#e8c84a;border-radius:2px">$1</mark>');
}
