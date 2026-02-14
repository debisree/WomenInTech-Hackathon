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

  user.reactionTestDone = true;
  user.avgReactionMs = avgReactionMs;
  user.misses = reaction.misses;
  user.falseTaps = reaction.falseTaps;
  user.rtStdMs = rtStdMs;
  user.reactionCompletedAt = new Date().toISOString();
  user.reactionSummary = `Avg RT: ${avgReactionMs}ms | Misses: ${reaction.misses} | False taps: ${reaction.falseTaps}`;

  if (!user.dashboardHistory) user.dashboardHistory = [];
  user.dashboardHistory.push({
    test_type: 'reaction_time',
    timestamp: new Date().toISOString(),
    avgReactionMs,
    misses: reaction.misses,
    falseTaps: reaction.falseTaps
  });

  console.log(`[reaction] done | avg=${avgReactionMs}ms std=${rtStdMs}ms misses=${reaction.misses} falseTaps=${reaction.falseTaps}`);

  return {
    done: true,
    avgReactionMs,
    rtStdMs,
    misses: reaction.misses,
    falseTaps: reaction.falseTaps,
    reactionSummary: user.reactionSummary,
    totalTrials: N_TRIALS
  };
}

app.post('/api/reaction/start', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  if (!req.session.user.timePerceptionResult) {
    console.log('[reaction] start blocked — time test not done');
    return res.status(403).json({ message: 'Please complete the Time Perception Test first.' });
  }

  const trials = generateReactionTrials();
  req.session.reaction = {
    started: true,
    done: false,
    trialIndex: 0,
    trials,
    trialStartTs: Date.now(),
    trialId: 0,
    stimulusShown: false,
    locked: false,
    reactionTimes: [],
    misses: 0,
    falseTaps: 0
  };

  console.log(`[reaction] start | trials=${trials.join(',')}`);

  res.json({
    stimulus: trials[0],
    trialIndex: 0,
    trialId: 0,
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

  res.json({
    started: true,
    done: false,
    stimulus: reaction.trials[reaction.trialIndex],
    trialIndex: reaction.trialIndex,
    totalTrials: N_TRIALS
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

  const { clientElapsedMs, trialId } = req.body;
  if (typeof trialId === 'number' && trialId !== reaction.trialId) {
    return res.json({ ignored: true, message: 'Stale trial' });
  }

  reaction.locked = true;
  const stimulus = reaction.trials[reaction.trialIndex];
  let feedback = '';
  let serverElapsed = null;
  if (reaction.trialStartTs) {
    serverElapsed = Date.now() - reaction.trialStartTs;
  }
  const hasClientMs = typeof clientElapsedMs === 'number' && clientElapsedMs >= 0;
  const hasServerMs = serverElapsed !== null && serverElapsed >= 0;
  const elapsed = hasClientMs ? clientElapsedMs : (hasServerMs ? serverElapsed : -1);

  if (stimulus === 'GO') {
    if (elapsed >= 0 && elapsed <= TIMEOUT_MS + 50) {
      reaction.reactionTimes.push(elapsed);
      feedback = 'hit';
    } else {
      reaction.misses++;
      feedback = 'miss';
    }
  } else {
    reaction.falseTaps++;
    feedback = 'false_tap';
  }

  console.log(`[reaction] tap | trial=${reaction.trialIndex} stimulus=${stimulus} clientMs=${clientElapsedMs} serverMs=${serverElapsed} used=${elapsed}ms feedback=${feedback}`);

  reaction.trialIndex++;

  if (reaction.trialIndex >= N_TRIALS) {
    const metrics = finalizeReaction(reaction, req.session.user);
    return res.json(metrics);
  }

  reaction.trialStartTs = Date.now();
  reaction.trialId = reaction.trialIndex;
  reaction.stimulusShown = false;
  reaction.locked = false;

  res.json({
    stimulus: reaction.trials[reaction.trialIndex],
    trialIndex: reaction.trialIndex,
    trialId: reaction.trialId,
    totalTrials: N_TRIALS,
    timeoutMs: TIMEOUT_MS,
    serverElapsedMs: serverElapsed,
    clientElapsedMs: clientElapsedMs
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

  const { trialId } = req.body || {};
  if (typeof trialId === 'number' && trialId !== reaction.trialId) {
    return res.json({ ignored: true, message: 'Stale trial' });
  }

  reaction.locked = true;
  const stimulus = reaction.trials[reaction.trialIndex];
  let feedback = '';

  if (stimulus === 'GO') {
    reaction.misses++;
    feedback = 'miss';
  } else {
    feedback = 'correct';
  }

  console.log(`[reaction] timeout | trial=${reaction.trialIndex} stimulus=${stimulus} feedback=${feedback}`);

  reaction.trialIndex++;

  if (reaction.trialIndex >= N_TRIALS) {
    const metrics = finalizeReaction(reaction, req.session.user);
    return res.json(metrics);
  }

  reaction.trialStartTs = Date.now();
  reaction.trialId = reaction.trialIndex;
  reaction.stimulusShown = false;
  reaction.locked = false;

  res.json({
    stimulus: reaction.trials[reaction.trialIndex],
    trialIndex: reaction.trialIndex,
    trialId: reaction.trialId,
    totalTrials: N_TRIALS,
    timeoutMs: TIMEOUT_MS
  });
});

app.post('/api/reaction/reset', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  console.log('[reaction] reset');
  delete req.session.reaction;
  delete req.session.user.reactionTestDone;
  delete req.session.user.avgReactionMs;
  delete req.session.user.misses;
  delete req.session.user.falseTaps;
  delete req.session.user.rtStdMs;
  delete req.session.user.reactionSummary;
  delete req.session.user.reactionCompletedAt;
  res.json({ success: true });
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

  if (user.reactionTestDone) {
    const rtSignal = Math.min(100, Math.round(
      (Math.min(user.avgReactionMs || 0, 1000) / 1000) * 40 +
      (Math.min(user.misses || 0, 10) / 10) * 30 +
      (Math.min(user.falseTaps || 0, 5) / 5) * 30
    ));
    const rtFlags = [];
    if ((user.misses || 0) >= 5) rtFlags.push('high_misses');
    if ((user.falseTaps || 0) >= 3) rtFlags.push('high_false_taps');
    if ((user.rtStdMs || 0) > 200) rtFlags.push('high_variability');
    tests.reaction_time = {
      completed: true,
      timestamp: user.reactionCompletedAt || null,
      raw_metrics: { avgReactionMs: user.avgReactionMs, misses: user.misses, falseTaps: user.falseTaps, rtStdMs: user.rtStdMs, totalTrials: N_TRIALS },
      normalized_signal: rtSignal,
      quality_flags: rtFlags
    };
    if (rtFlags.length) qualityFlags.push(...rtFlags);
  } else {
    tests.reaction_time = { completed: false };
  }

  const weights = { reaction_time: 0.50, time_perception: 0.50 };
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

  if (completedCount >= 2 && qualityFlags.length === 0) confidence = 'high';
  else if (completedCount >= 1) confidence = 'medium';
  else confidence = 'low';

  const history = user.dashboardHistory || [];

  res.json({
    compositeScore,
    bucket,
    confidence,
    completedCount,
    totalTests: 2,
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
