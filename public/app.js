let currentUser = null;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');

  const nav = document.getElementById('top-nav');
  if (screenId === 'screen-login') {
    nav.classList.add('hidden');
    document.getElementById('app').classList.remove('has-nav');
  } else {
    nav.classList.remove('hidden');
    document.getElementById('app').classList.add('has-nav');
  }

  document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === screenId);
  });
}

function updateWelcomeSteps() {
  const consentStatus = document.getElementById('step-consent-status');
  const infoStatus = document.getElementById('step-info-status');

  if (currentUser && currentUser.consentGiven) {
    consentStatus.textContent = 'Done';
    consentStatus.classList.add('done');
  } else {
    consentStatus.textContent = '';
    consentStatus.classList.remove('done');
  }

  if (currentUser && currentUser.demographics) {
    infoStatus.textContent = 'Done';
    infoStatus.classList.add('done');
  } else {
    infoStatus.textContent = '';
    infoStatus.classList.remove('done');
  }
}

function populateDemographicsForm() {
  if (!currentUser || !currentUser.demographics) return;
  const d = currentUser.demographics;
  const form = document.getElementById('demographics-form');

  ['gender', 'ageGroup', 'ethnicity', 'adhdDiagnosed'].forEach(field => {
    if (d[field]) {
      const radio = form.querySelector(`input[name="${field}"][value="${d[field]}"]`);
      if (radio) radio.checked = true;
    }
  });

  checkDemoFormComplete();
}

function checkDemoFormComplete() {
  const form = document.getElementById('demographics-form');
  const gender = form.querySelector('input[name="gender"]:checked');
  const ageGroup = form.querySelector('input[name="ageGroup"]:checked');
  const ethnicity = form.querySelector('input[name="ethnicity"]:checked');
  const adhdDiagnosed = form.querySelector('input[name="adhdDiagnosed"]:checked');
  document.getElementById('demo-submit').disabled = !(gender && ageGroup && ethnicity && adhdDiagnosed);
}

async function checkSession() {
  try {
    const res = await fetch('/api/user');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      document.getElementById('welcome-name').textContent = currentUser.name;
      updateWelcomeSteps();
      populateDemographicsForm();
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
      updateWelcomeSteps();
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
      updateWelcomeSteps();
      showScreen('screen-welcome');
    }
  } catch (err) {
    document.getElementById('login-error').textContent = 'Something went wrong. Please try again.';
  }
});

document.getElementById('welcome-continue').addEventListener('click', () => {
  if (currentUser && currentUser.consentGiven) {
    if (currentUser.demographics) {
      showScreen('screen-tests');
    } else {
      showScreen('screen-demographics');
    }
  } else {
    showScreen('screen-consent');
  }
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
      currentUser.consentGiven = true;
      updateWelcomeSteps();
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
  checkDemoFormComplete();
  document.getElementById('demo-saved-msg').textContent = '';
});

demoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const gender = demoForm.querySelector('input[name="gender"]:checked').value;
  const ageGroup = demoForm.querySelector('input[name="ageGroup"]:checked').value;
  const ethnicity = demoForm.querySelector('input[name="ethnicity"]:checked').value;
  const adhdDiagnosed = demoForm.querySelector('input[name="adhdDiagnosed"]:checked').value;

  try {
    const res = await fetch('/api/demographics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gender, ageGroup, ethnicity, adhdDiagnosed })
    });
    if (res.ok) {
      currentUser.demographics = { gender, ageGroup, ethnicity, adhdDiagnosed };
      updateWelcomeSteps();
      const msg = document.getElementById('demo-saved-msg');
      msg.textContent = 'Information saved successfully!';
      setTimeout(() => {
        showScreen('screen-tests');
        msg.textContent = '';
      }, 800);
    } else {
      showScreen('screen-login');
    }
  } catch (err) {
    console.error(err);
  }
});

document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target === 'screen-demographics') {
      populateDemographicsForm();
    }
    if (target === 'screen-welcome') {
      updateWelcomeSteps();
    }
    showScreen(target);
  });
});

document.getElementById('nav-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    document.getElementById('login-form').reset();
    document.getElementById('demographics-form').reset();
    document.getElementById('consent-checkbox').checked = false;
    consentBtn.disabled = true;
    demoSubmit.disabled = true;
    document.getElementById('login-error').textContent = '';
    document.getElementById('demo-saved-msg').textContent = '';
    showScreen('screen-login');
  } catch (err) {
    console.error(err);
  }
});
