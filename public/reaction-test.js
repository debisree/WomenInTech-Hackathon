const RT = {
  TIMEOUT_MS: 1200,
  streak: 0,
  feedbackTimer: null,

  stimulus: null,
  trialIndex: 0,
  trialId: 0,
  totalTrials: 16,
  done: false,
  tapEnabled: false,
  timeoutTimer: null,
  stimulusShownAt: null,
  debugMode: new URLSearchParams(window.location.search).has('debug'),

  clearTimers() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  },

  async startTest() {
    this.clearTimers();
    this.streak = 0;
    this.done = false;
    this.tapEnabled = false;
    this.stimulusShownAt = null;
    this.updateDebug('Starting...');
    try {
      const res = await fetch('/api/reaction/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.status === 403) {
        showScreen('screen-rt-locked');
        return;
      }
      if (!res.ok) {
        console.error('Failed to start reaction test');
        return;
      }
      const data = await res.json();
      this.stimulus = data.stimulus;
      this.trialIndex = data.trialIndex;
      this.trialId = data.trialId || 0;
      this.totalTrials = data.totalTrials;
      showScreen('screen-rt-trial');
      this.presentStimulus();
    } catch (err) {
      console.error('Error starting reaction test:', err);
    }
  },

  presentStimulus() {
    if (this.done) return;

    const area = document.getElementById('rt-stimulus-area');
    const text = document.getElementById('rt-stimulus-text');
    const btn = document.getElementById('rt-tap-btn');
    const fill = document.getElementById('rt-timer-fill');

    this.updateProgress();
    this.updateStreakBadge();

    if (this.stimulus === 'GO') {
      area.className = 'rt-stimulus-area rt-go';
      text.textContent = 'TAP';
    } else {
      area.className = 'rt-stimulus-area rt-nogo';
      text.textContent = 'WAIT';
    }

    area.classList.add('rt-stimulus-enter');
    setTimeout(() => area.classList.remove('rt-stimulus-enter'), 200);

    fill.style.transition = 'none';
    fill.style.width = '100%';
    fill.offsetHeight;
    fill.style.transition = `width ${this.TIMEOUT_MS}ms linear`;
    fill.style.width = '0%';

    this.stimulusShownAt = performance.now();
    this.tapEnabled = true;
    btn.disabled = false;

    this.clearTimers();
    this.timeoutTimer = setTimeout(() => this.handleTimeout(), this.TIMEOUT_MS);

    fetch('/api/reaction/stimulus-shown', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .catch(err => console.error('Error marking stimulus shown:', err));

    this.updateDebug(`Trial ${this.trialIndex + 1}/${this.totalTrials} | ${this.stimulus} | Waiting...`);
  },

  showFeedback(type) {
    const toast = document.getElementById('rt-feedback-toast');
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);

    if (type === 'hit') {
      this.streak++;
      toast.textContent = this.streak > 1 ? `${this.streak}x streak` : 'nice';
      toast.className = 'rt-feedback-toast rt-fb-good rt-fb-show';
    } else if (type === 'correct') {
      this.streak++;
      toast.textContent = this.streak > 1 ? `${this.streak}x streak` : 'correct';
      toast.className = 'rt-feedback-toast rt-fb-good rt-fb-show';
    } else if (type === 'miss') {
      this.streak = 0;
      toast.textContent = 'miss';
      toast.className = 'rt-feedback-toast rt-fb-bad rt-fb-show';
    } else if (type === 'false') {
      this.streak = 0;
      toast.textContent = 'false tap';
      toast.className = 'rt-feedback-toast rt-fb-bad rt-fb-show';
    }

    this.updateStreakBadge();

    this.feedbackTimer = setTimeout(() => {
      toast.classList.remove('rt-fb-show');
    }, 400);
  },

  updateStreakBadge() {
    const badge = document.getElementById('rt-streak-badge');
    if (this.streak >= 2) {
      badge.textContent = `${this.streak}x`;
      badge.classList.add('rt-streak-active');
    } else {
      badge.textContent = '';
      badge.classList.remove('rt-streak-active');
    }
  },

  async handleTap() {
    if (!this.tapEnabled || this.done) return;
    this.tapEnabled = false;
    this.clearTimers();

    const btn = document.getElementById('rt-tap-btn');
    btn.disabled = true;

    const area = document.getElementById('rt-stimulus-area');
    area.classList.add('rt-tap-pulse');
    setTimeout(() => area.classList.remove('rt-tap-pulse'), 150);

    const clientElapsedMs = this.stimulusShownAt ? Math.round(performance.now() - this.stimulusShownAt) : null;

    if (this.stimulus === 'GO') {
      this.showFeedback('hit');
    } else {
      this.showFeedback('false');
    }

    try {
      const res = await fetch('/api/reaction/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientElapsedMs, trialId: this.trialId })
      });
      const data = await res.json();

      this.updateDebug(`Trial ${this.trialIndex + 1} | ${this.stimulus} | clientRT=${clientElapsedMs}ms | serverRT=${data.serverElapsedMs || '?'}ms`);

      if (data.ignored) return;

      if (data.done) {
        this.showResults(data);
        return;
      }

      this.stimulus = data.stimulus;
      this.trialIndex = data.trialIndex;
      this.trialId = data.trialId || 0;
      this.totalTrials = data.totalTrials;

      setTimeout(() => this.presentStimulus(), 400);
    } catch (err) {
      console.error('Error submitting tap:', err);
      this.tapEnabled = true;
      btn.disabled = false;
    }
  },

  async handleTimeout() {
    if (!this.tapEnabled || this.done) return;
    this.tapEnabled = false;
    this.clearTimers();

    const btn = document.getElementById('rt-tap-btn');
    btn.disabled = true;

    if (this.stimulus === 'GO') {
      this.showFeedback('miss');
    } else {
      this.showFeedback('correct');
    }

    this.updateDebug(`Trial ${this.trialIndex + 1} | ${this.stimulus} | TIMEOUT`);

    try {
      const res = await fetch('/api/reaction/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId: this.trialId })
      });
      const data = await res.json();

      if (data.ignored) return;

      if (data.done) {
        this.showResults(data);
        return;
      }

      this.stimulus = data.stimulus;
      this.trialIndex = data.trialIndex;
      this.trialId = data.trialId || 0;
      this.totalTrials = data.totalTrials;

      setTimeout(() => this.presentStimulus(), 400);
    } catch (err) {
      console.error('Error submitting timeout:', err);
    }
  },

  updateProgress() {
    const label = document.getElementById('rt-trial-label');
    const fill = document.getElementById('rt-progress-fill');
    label.textContent = `${this.trialIndex + 1} / ${this.totalTrials}`;
    const pct = (this.trialIndex / this.totalTrials) * 100;
    fill.style.width = pct + '%';
  },

  updateDebug(msg) {
    const el = document.getElementById('rt-debug-line');
    if (el && this.debugMode) {
      el.style.display = 'block';
      el.textContent = msg;
    }
  },

  showResults(metrics) {
    this.done = true;
    this.tapEnabled = false;
    this.clearTimers();

    document.getElementById('rt-avg-rt').textContent = metrics.avgReactionMs + 'ms';
    document.getElementById('rt-misses').textContent = metrics.misses;
    document.getElementById('rt-false-taps').textContent = metrics.falseTaps;
    document.getElementById('rt-std').textContent = metrics.rtStdMs + 'ms';
    document.getElementById('rt-summary-text').textContent = metrics.reactionSummary;

    updateTest2Status(metrics.avgReactionMs, metrics.misses, metrics.falseTaps);

    showScreen('screen-rt-results');
  }
};

function updateTest2Status(avgRt, misses, falseTaps) {
  const el = document.getElementById('test2-status');
  if (avgRt !== undefined) {
    el.textContent = `Avg RT: ${avgRt}ms | Misses: ${misses} | False taps: ${falseTaps}`;
    el.style.display = 'block';
  }
}

document.getElementById('start-test-2').addEventListener('click', () => {
  showScreen('screen-rt-intro');
});

document.getElementById('rt-begin').addEventListener('click', () => {
  RT.startTest();
});

document.getElementById('rt-tap-btn').addEventListener('click', () => {
  RT.handleTap();
});

document.getElementById('rt-tap-btn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  RT.handleTap();
}, { passive: false });

document.getElementById('rt-retake').addEventListener('click', () => {
  RT.startTest();
});

document.getElementById('rt-back-tests').addEventListener('click', () => {
  RT.clearTimers();
  showScreen('screen-tests');
});

document.getElementById('rt-go-tests').addEventListener('click', () => {
  showScreen('screen-tests');
});

async function loadPreviousRTResult() {
  try {
    const res = await fetch('/api/reaction/state');
    if (res.ok) {
      const data = await res.json();
      if (data.done && data.avgReactionMs !== undefined) {
        updateTest2Status(data.avgReactionMs, data.misses, data.falseTaps);
      }
    }
  } catch (err) {}
}

const origCheckSession2 = checkSession;
checkSession = async function() {
  await origCheckSession2();
  await loadPreviousRTResult();
};

loadPreviousRTResult();
