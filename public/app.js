let currentUser = null;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

async function checkSession() {
  try {
    const res = await fetch('/api/user');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      document.getElementById('welcome-name').textContent = currentUser.name;
      if (currentUser.demographics) {
        showScreen('screen-tests');
      } else if (currentUser.consentGiven) {
        showScreen('screen-demographics');
      } else {
        showScreen('screen-welcome');
      }
    }
  } catch (err) {}
}

checkSession();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  if (!username || !password) {
    errorEl.textContent = 'Please enter both username and password.';
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      document.getElementById('welcome-name').textContent = currentUser.name;
      showScreen('screen-welcome');
    } else {
      errorEl.textContent = data.message;
    }
  } catch (err) {
    errorEl.textContent = 'Something went wrong. Please try again.';
  }
});

document.getElementById('guest-btn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGuest: true })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      document.getElementById('welcome-name').textContent = currentUser.name;
      showScreen('screen-welcome');
    }
  } catch (err) {
    document.getElementById('login-error').textContent = 'Something went wrong. Please try again.';
  }
});

document.getElementById('welcome-continue').addEventListener('click', () => {
  showScreen('screen-consent');
});

const consentCheckbox = document.getElementById('consent-checkbox');
const consentBtn = document.getElementById('consent-continue');
consentCheckbox.addEventListener('change', () => {
  consentBtn.disabled = !consentCheckbox.checked;
});

consentBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      showScreen('screen-demographics');
    } else {
      showScreen('screen-login');
    }
  } catch (err) {
    console.error(err);
  }
});

const demoForm = document.getElementById('demographics-form');
const demoSubmit = document.getElementById('demo-submit');

demoForm.addEventListener('change', () => {
  const gender = demoForm.querySelector('input[name="gender"]:checked');
  const ageGroup = demoForm.querySelector('input[name="ageGroup"]:checked');
  const ethnicity = demoForm.querySelector('input[name="ethnicity"]:checked');
  demoSubmit.disabled = !(gender && ageGroup && ethnicity);
});

demoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const gender = demoForm.querySelector('input[name="gender"]:checked').value;
  const ageGroup = demoForm.querySelector('input[name="ageGroup"]:checked').value;
  const ethnicity = demoForm.querySelector('input[name="ethnicity"]:checked').value;

  try {
    const res = await fetch('/api/demographics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gender, ageGroup, ethnicity })
    });
    if (res.ok) {
      showScreen('screen-tests');
    } else {
      showScreen('screen-login');
    }
  } catch (err) {
    console.error(err);
  }
});
