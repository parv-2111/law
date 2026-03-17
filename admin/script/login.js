document.addEventListener('DOMContentLoaded', () => {
  const box = document.querySelector('.login-box');
  requestAnimationFrame(() => box.classList.add('visible'));

  document.querySelectorAll('.field').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.5s ease ${0.3 + i * 0.1}s, transform 0.5s ease ${0.3 + i * 0.1}s`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
  });
});

// Password toggle
document.getElementById('togglePw').addEventListener('click', function () {
  const pw = document.getElementById('password');
  const isText = pw.type === 'text';
  pw.type = isText ? 'password' : 'text';
  this.classList.toggle('fa-eye', isText);
  this.classList.toggle('fa-eye-slash', !isText);
});

// Credentials
const ADMIN_EMAIL = 'admin123@gmail.com';
const ADMIN_PASS  = 'admin@123';

document.getElementById('adminLoginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errEmail = document.getElementById('err-email');
  const errPass  = document.getElementById('err-password');
  const errGlobal = document.getElementById('err-global');

  let valid = true;

  // Reset
  errEmail.textContent = '';
  errPass.textContent  = '';
  errGlobal.textContent = '';
  email.classList.remove('valid','invalid');
  password.classList.remove('valid','invalid');

  if (!email.value.trim()) {
    errEmail.textContent = 'Email is required.';
    email.classList.add('invalid');
    valid = false;
  }
  if (!password.value.trim()) {
    errPass.textContent = 'Password is required.';
    password.classList.add('invalid');
    valid = false;
  }
  if (!valid) return;

  if (email.value.trim() !== ADMIN_EMAIL || password.value !== ADMIN_PASS) {
    errGlobal.textContent = 'Invalid email or password.';
    email.classList.add('invalid');
    password.classList.add('invalid');
    return;
  }

  const btn = document.querySelector('.btn-login');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying…';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> Access Granted!';
    btn.style.background = 'linear-gradient(135deg,#3ecf8e,#0f6647)';
    btn.style.color = '#fff';
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  }, 1600);
});
