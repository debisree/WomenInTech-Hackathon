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
  req.session.user.timeTestDone = true;
  res.json({ success: true });
});

app.get('/api/test-results/time-perception', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  if (!req.session.user.timePerceptionResult) return res.status(404).json({ message: 'No results' });
  res.json({ result: req.session.user.timePerceptionResult });
});

const N_TRIALS = 16;
const TIMEOUT_MS = 1200;

function generateReactionTrials() {
  const trials = [];
  const goCount = Math.round(N_TRIALS * 0.7);
  const nogoCount = N_TRIALS - goCount;
  for (let i = 0; i < goCount; i++) trials.push('GO');
  for (let i = 0; i < nogoCount; i++) trials.push('NOGO');
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function finalizeReaction(reaction, user) {
  reaction.done = true;
  const avgReactionMs = Math.round(mean(reaction.reactionTimes)) || 0;
  const rtStdMs = Math.round(stdDev(reaction.reactionTimes)) || 0;
  const goCount = reaction.trials.filter(t => t === 'GO').length;
  const nogoCount = reaction.trials.filter(t => t === 'NOGO').length;

  user.reactionTestDone = true;
  user.avgReactionMs = avgReactionMs;
  user.misses = reaction.misses;
  user.falseTaps = reaction.falseTaps;
  user.rtStdMs = rtStdMs;
  user.reactionSummary = `Avg RT: ${avgReactionMs}ms | Misses: ${reaction.misses} | False taps: ${reaction.falseTaps}`;

  return {
    done: true,
    avgReactionMs,
    rtStdMs,
    misses: reaction.misses,
    falseTaps: reaction.falseTaps,
    goCount,
    nogoCount,
    reactionSummary: user.reactionSummary,
    totalTrials: N_TRIALS
  };
}

app.post('/api/reaction/start', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  if (!req.session.user.timeTestDone) {
    return res.status(403).json({ message: 'Please complete the Time Perception Test first.' });
  }

  const trials = generateReactionTrials();
  req.session.reaction = {
    started: true,
    done: false,
    trialIndex: 0,
    trials,
    trialStartTs: null,
    stimulusShown: false,
    locked: false,
    reactionTimes: [],
    misses: 0,
    falseTaps: 0
  };

  res.json({
    stimulus: trials[0],
    trialIndex: 0,
    totalTrials: N_TRIALS,
    timeoutMs: TIMEOUT_MS
  });
});

app.post('/api/reaction/stimulus-shown', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  const reaction = req.session.reaction;
  if (!reaction || !reaction.started || reaction.done) {
    return res.status(400).json({ message: 'No active reaction test' });
  }
  reaction.trialStartTs = Date.now();
  reaction.stimulusShown = true;
  res.json({ success: true });
});

app.get('/api/reaction/state', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  const reaction = req.session.reaction;

  if (!reaction || !reaction.started) {
    return res.json({ started: false, done: false });
  }

  if (reaction.done) {
    return res.json({
      started: true,
      done: true,
      avgReactionMs: req.session.user.avgReactionMs,
      misses: req.session.user.misses,
      falseTaps: req.session.user.falseTaps,
      rtStdMs: req.session.user.rtStdMs,
      reactionSummary: req.session.user.reactionSummary,
      totalTrials: N_TRIALS
    });
  }

  const elapsed = Date.now() - reaction.trialStartTs;
  const timeLeftMs = Math.max(0, TIMEOUT_MS - elapsed);

  res.json({
    started: true,
    done: false,
    stimulus: reaction.trials[reaction.trialIndex],
    trialIndex: reaction.trialIndex,
    totalTrials: N_TRIALS,
    timeLeftMs
  });
});

app.post('/api/reaction/tap', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  const reaction = req.session.reaction;
  if (!reaction || !reaction.started || reaction.done) {
    return res.status(400).json({ message: 'No active reaction test' });
  }
  if (reaction.locked) {
    return res.json({ ignored: true, message: 'Trial already processed' });
  }

  reaction.locked = true;
  const elapsed = Date.now() - reaction.trialStartTs;
  const stimulus = reaction.trials[reaction.trialIndex];

  if (stimulus === 'GO') {
    if (elapsed <= TIMEOUT_MS) {
      reaction.reactionTimes.push(elapsed);
    } else {
      reaction.misses++;
    }
  } else {
    reaction.falseTaps++;
  }

  reaction.trialIndex++;

  if (reaction.trialIndex >= N_TRIALS) {
    const metrics = finalizeReaction(reaction, req.session.user);
    return res.json(metrics);
  }

  reaction.trialStartTs = null;
  reaction.stimulusShown = false;
  reaction.locked = false;

  res.json({
    stimulus: reaction.trials[reaction.trialIndex],
    trialIndex: reaction.trialIndex,
    totalTrials: N_TRIALS,
    timeoutMs: TIMEOUT_MS
  });
});

app.post('/api/reaction/timeout', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  const reaction = req.session.reaction;
  if (!reaction || !reaction.started || reaction.done) {
    return res.status(400).json({ message: 'No active reaction test' });
  }
  if (reaction.locked) {
    return res.json({ ignored: true, message: 'Trial already processed' });
  }

  reaction.locked = true;
  const stimulus = reaction.trials[reaction.trialIndex];

  if (stimulus === 'GO') {
    reaction.misses++;
  }

  reaction.trialIndex++;

  if (reaction.trialIndex >= N_TRIALS) {
    const metrics = finalizeReaction(reaction, req.session.user);
    return res.json(metrics);
  }

  reaction.trialStartTs = null;
  reaction.stimulusShown = false;
  reaction.locked = false;

  res.json({
    stimulus: reaction.trials[reaction.trialIndex],
    trialIndex: reaction.trialIndex,
    totalTrials: N_TRIALS,
    timeoutMs: TIMEOUT_MS
  });
});

app.post('/api/reaction/reset', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  delete req.session.reaction;
  delete req.session.user.reactionTestDone;
  delete req.session.user.avgReactionMs;
  delete req.session.user.misses;
  delete req.session.user.falseTaps;
  delete req.session.user.rtStdMs;
  delete req.session.user.reactionSummary;
  res.json({ success: true });
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
