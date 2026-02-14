const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 5000;

const users = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'adhd-screening-app-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both username and password.' });
  }
  const key = username.toLowerCase();
  if (users[key]) {
    return res.status(409).json({ success: false, message: 'That username is already taken. Please choose another.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
  }
  users[key] = { name: username, password };
  req.session.user = { name: username, isGuest: false };
  return res.json({ success: true, user: req.session.user });
});

app.post('/api/login', (req, res) => {
  const { username, password, isGuest } = req.body;
  if (isGuest) {
    req.session.user = { name: 'Guest', isGuest: true };
    return res.json({ success: true, user: req.session.user });
  }
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both username and password.' });
  }
  const key = username.toLowerCase();
  const stored = users[key];
  if (!stored) {
    return res.status(401).json({ success: false, message: 'Account not found. Please create an account first.' });
  }
  if (stored.password !== password) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
  }
  req.session.user = { name: stored.name, isGuest: false };
  return res.json({ success: true, user: req.session.user });
});

app.post('/api/consent', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  req.session.user.consentGiven = true;
  res.json({ success: true });
});

app.post('/api/demographics', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  const { gender, ageGroup, ethnicity, adhdDiagnosed } = req.body;
  req.session.user.demographics = { gender, ageGroup, ethnicity, adhdDiagnosed };
  res.json({ success: true });
});

app.get('/api/user', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  res.json({ user: req.session.user });
});

app.post('/api/status', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  const { sleepQuality, caffeineIntake, focusLevel, loseTrackOfTime } = req.body;
  req.session.user.status = { sleepQuality, caffeineIntake, focusLevel, loseTrackOfTime };
  res.json({ success: true });
});

app.post('/api/test-results/time-perception', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  req.session.user.timePerceptionResult = req.body;

  if (!req.session.user.dashboardHistory) req.session.user.dashboardHistory = [];
  req.session.user.dashboardHistory.push({
    test_type: 'time_perception',
    timestamp: req.body.completedAt || new Date().toISOString(),
    score: req.body.score,
    signal: Math.max(0, Math.min(100, 100 - req.body.score))
  });

  res.json({ success: true });
});

app.get('/api/test-results/time-perception', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  if (!req.session.user.timePerceptionResult) return res.status(404).json({ message: 'No results' });
  res.json({ result: req.session.user.timePerceptionResult });
});

app.get('/api/dashboard', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

  const user = req.session.user;
  const tests = {};
  const qualityFlags = [];

  if (user.timePerceptionResult) {
    const tp = user.timePerceptionResult;
    const timeSignal = Math.max(0, Math.min(100, 100 - tp.score));
    const flags = [];
    const scoredTrials = (tp.trials || []).filter(t => !t.is_practice);
    if (scoredTrials.length < 6) flags.push('few_trials');
    tests.time_perception = {
      completed: true,
      timestamp: tp.completedAt,
      raw_metrics: { score: tp.score, category: tp.category, mae: tp.mae, variability: tp.variability, bias: tp.bias, mape: tp.mape, relVar: tp.relVar },
      normalized_signal: Math.round(timeSignal),
      quality_flags: flags
    };
    if (flags.length) qualityFlags.push(...flags);
  } else {
    tests.time_perception = { completed: false };
  }

  tests.screener = { completed: false };
  tests.reaction_time = { completed: false };

  const weights = { screener: 0.50, reaction_time: 0.30, time_perception: 0.20 };
  let totalWeight = 0;
  let weightedSum = 0;
  let completedCount = 0;

  for (const [key, w] of Object.entries(weights)) {
    if (tests[key].completed) {
      weightedSum += tests[key].normalized_signal * w;
      totalWeight += w;
      completedCount++;
    }
  }

  let compositeScore = null;
  let bucket = 'inconclusive';
  let confidence = 'low';

  if (totalWeight > 0) {
    compositeScore = Math.round(weightedSum / totalWeight);
    compositeScore = Math.max(0, Math.min(100, compositeScore));

    if (compositeScore <= 34) bucket = 'lower';
    else if (compositeScore <= 64) bucket = 'mixed';
    else bucket = 'higher';
  }

  if (completedCount >= 3 && qualityFlags.length === 0) confidence = 'high';
  else if (completedCount >= 2) confidence = 'medium';
  else confidence = 'low';

  const history = user.dashboardHistory || [];

  res.json({
    compositeScore,
    bucket,
    confidence,
    completedCount,
    totalTests: 3,
    tests,
    weights,
    qualityFlags,
    history,
    status: user.status || null
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
