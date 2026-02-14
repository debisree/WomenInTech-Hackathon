const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'adhd-screening-app-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { username, password, isGuest } = req.body;
  if (isGuest) {
    req.session.user = { name: 'Guest', isGuest: true };
    return res.json({ success: true, user: req.session.user });
  }
  if (username && password) {
    req.session.user = { name: username, isGuest: false };
    return res.json({ success: true, user: req.session.user });
  }
  res.status(400).json({ success: false, message: 'Please provide credentials' });
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
  res.json({ success: true });
});

app.get('/api/test-results/time-perception', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  if (!req.session.user.timePerceptionResult) return res.status(404).json({ message: 'No results' });
  res.json({ result: req.session.user.timePerceptionResult });
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
