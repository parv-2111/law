// ── Card entrance animation
document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.querySelector('.form-card').classList.add('visible');
  });

  document.querySelectorAll('.input-group, .forgot-row, .btn-submit').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.5s ease ${0.3 + i * 0.1}s, transform 0.5s ease ${0.3 + i * 0.1}s`;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 50);
  });
});

// ── Password toggle
document.getElementById('togglePw').addEventListener('click', function () {
  const pw = document.getElementById('password');
  const isText = pw.type === 'text';
  pw.type = isText ? 'password' : 'text';
  this.classList.toggle('fa-eye', isText);
  this.classList.toggle('fa-eye-slash', !isText);
});

// ── Validation
const rules = {
  email:    { el: 'email',    err: 'err-email',    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Enter a valid email address.' },
  password: { el: 'password', err: 'err-password', test: v => v.length >= 8,                                msg: 'Password must be at least 8 characters.' },
};

function validate(key) {
  const r = rules[key];
  const el = document.getElementById(r.el);
  const errEl = document.getElementById(r.err);
  const ok = r.test(el.value);
  el.classList.toggle('valid', ok);
  el.classList.toggle('invalid', !ok);
  errEl.textContent = ok ? '' : r.msg;
  return ok;
}

Object.keys(rules).forEach(key => {
  document.getElementById(rules[key].el).addEventListener('blur', () => validate(key));
  document.getElementById(rules[key].el).addEventListener('input', () => {
    if (document.getElementById(rules[key].el).classList.contains('invalid')) validate(key);
  });
});

// ── Form submit
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const allValid = Object.keys(rules).map(validate).every(Boolean);
  if (!allValid) return;

  const btn = document.querySelector('.btn-submit');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> Welcome Back!';
    btn.style.background = 'linear-gradient(135deg,#4caf82,#2e7d5e)';
    btn.style.color = '#fff';
    // Save email to sessionStorage for matter.html
    sessionStorage.setItem('userEmail', document.getElementById('email').value.trim());
    setTimeout(() => { window.location.href = 'matter.html'; }, 800);
  }, 500);
});
  