const TP = {
  PRACTICE_TARGETS: [6000, 12000],
  SCORED_POOL: [6000, 8000, 10000, 12000, 15000, 20000],
  SCORED_COUNT: 8,
  MAE_CAP: 6000,
  STD_CAP: 6000,

  trials: [],
  currentIndex: 0,
  allTrials: [],
  startTime: null,
  startTimestamp: null,
  isRunning: false,

  generateTrials() {
    const practice = this.PRACTICE_TARGETS.map((t, i) => ({
      target_ms: t,
      is_practice: true,
      trial_index: i
    }));

    const scored = [];
    const pool = [...this.SCORED_POOL];
    let lastTarget = null;

    while (scored.length < this.SCORED_COUNT) {
      const available = pool.length > 1
        ? pool.filter(t => t !== lastTarget)
        : [...pool];

      const pick = available[Math.floor(Math.random() * available.length)];
      scored.push({
        target_ms: pick,
        is_practice: false,
        trial_index: scored.length
      });
      lastTarget = pick;

      const idx = pool.indexOf(pick);
      if (idx !== -1) pool.splice(idx, 1);
      if (pool.length === 0) {
        pool.push(...this.SCORED_POOL);
      }
    }

    this.allTrials = [...practice, ...scored];
    this.currentIndex = 0;
    this.trials = [];
  },

  getTotalTrials() {
    return this.allTrials.length;
  },

  getCurrentTrial() {
    return this.allTrials[this.currentIndex];
  },

  updateUI() {
    const trial = this.getCurrentTrial();
    const isPractice = trial.is_practice;
    const practiceCount = this.PRACTICE_TARGETS.length;

    let label;
    if (isPractice) {
      label = `Practice ${this.currentIndex + 1} of ${practiceCount}`;
    } else {
      const scoredIdx = this.currentIndex - practiceCount + 1;
      label = `Trial ${scoredIdx} of ${this.SCORED_COUNT}`;
    }

    document.getElementById('tp-trial-label').textContent = label;
    document.getElementById('tp-target-time').textContent = `${trial.target_ms / 1000} seconds`;
    document.getElementById('tp-status').textContent = 'Press START when ready';
    document.getElementById('tp-status').className = 'tp-status';

    const progress = ((this.currentIndex) / this.getTotalTrials()) * 100;
    document.getElementById('tp-progress-fill').style.width = progress + '%';

    document.getElementById('tp-start-btn').disabled = false;
    document.getElementById('tp-stop-btn').disabled = true;
  },

  startTrial() {
    this.isRunning = true;
    this.startTime = performance.now();
    this.startTimestamp = Date.now();

    document.getElementById('tp-start-btn').disabled = true;
    document.getElementById('tp-stop-btn').disabled = false;
    document.getElementById('tp-status').textContent = 'Timing... press STOP when you think the target time has passed';
    document.getElementById('tp-status').className = 'tp-status tp-timing';
  },

  stopTrial() {
    if (!this.isRunning) return;
    this.isRunning = false;

    const endTime = performance.now();
    const endTimestamp = Date.now();
    const trial = this.getCurrentTrial();
    const actual_ms = Math.round(endTime - this.startTime);
    const error_ms = actual_ms - trial.target_ms;
    const abs_error_ms = Math.abs(error_ms);

    const result = {
      target_ms: trial.target_ms,
      actual_ms,
      error_ms,
      abs_error_ms,
      trial_index: trial.trial_index,
      is_practice: trial.is_practice,
      start_timestamp: this.startTimestamp,
      end_timestamp: endTimestamp
    };

    this.trials.push(result);

    document.getElementById('tp-start-btn').disabled = true;
    document.getElementById('tp-stop-btn').disabled = true;
    document.getElementById('tp-status').textContent = 'Recorded';
    document.getElementById('tp-status').className = 'tp-status tp-recorded';

    this.currentIndex++;

    if (this.currentIndex < this.getTotalTrials()) {
      setTimeout(() => this.updateUI(), 800);
    } else {
      setTimeout(() => this.showResults(), 800);
    }
  },

  computeScoring() {
    const scored = this.trials.filter(t => !t.is_practice);
    const n = scored.length;

    const mae = scored.reduce((s, t) => s + t.abs_error_ms, 0) / n;
    const meanError = scored.reduce((s, t) => s + t.error_ms, 0) / n;
    const variance = scored.reduce((s, t) => s + Math.pow(t.error_ms - meanError, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const normMAE = Math.min(mae / this.MAE_CAP, 1);
    const normSTD = Math.min(stdDev / this.STD_CAP, 1);
    let score = 100 - (0.55 * normMAE + 0.45 * normSTD) * 100;
    score = Math.max(0, Math.min(100, Math.round(score)));

    let category;
    if (score >= 80) category = 'Typical timing consistency';
    else if (score >= 60) category = 'Mild inconsistency';
    else if (score >= 40) category = 'Moderate inconsistency';
    else category = 'High inconsistency';

    return {
      score,
      category,
      mae: Math.round(mae),
      variability: Math.round(stdDev),
      bias: Math.round(meanError),
      scoredTrials: scored
    };
  },

  async showResults() {
    const results = this.computeScoring();

    document.getElementById('tp-score-num').textContent = results.score;
    document.getElementById('tp-category').textContent = results.category;
    document.getElementById('tp-mae').textContent = (results.mae / 1000).toFixed(2) + 's';
    document.getElementById('tp-variability').textContent = (results.variability / 1000).toFixed(2) + 's';

    const biasLabel = results.bias > 0 ? 'overestimate' : results.bias < 0 ? 'underestimate' : 'none';
    document.getElementById('tp-bias').textContent = (Math.abs(results.bias) / 1000).toFixed(2) + 's ' + biasLabel;

    const circle = document.getElementById('tp-score-circle');
    if (results.score >= 80) circle.className = 'tp-score-circle tp-score-good';
    else if (results.score >= 60) circle.className = 'tp-score-circle tp-score-mild';
    else if (results.score >= 40) circle.className = 'tp-score-circle tp-score-moderate';
    else circle.className = 'tp-score-circle tp-score-high';

    const tbody = document.getElementById('tp-results-tbody');
    tbody.innerHTML = '';
    results.scoredTrials.forEach((t, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${(t.target_ms / 1000).toFixed(0)}</td>
        <td>${(t.actual_ms / 1000).toFixed(2)}</td>
        <td>${(t.abs_error_ms / 1000).toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById('tp-progress-fill').style.width = '100%';
    showScreen('screen-tp-results');

    const payload = {
      score: results.score,
      category: results.category,
      mae: results.mae,
      variability: results.variability,
      bias: results.bias,
      trials: this.trials,
      completedAt: new Date().toISOString()
    };

    try {
      await fetch('/api/test-results/time-perception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to save results:', err);
    }

    updateTest1Status(results.score, results.category);
  },

  init() {
    this.generateTrials();
    this.updateUI();
    showScreen('screen-tp-trial');
  }
};

function updateTest1Status(score, category) {
  const el = document.getElementById('test1-status');
  if (score !== undefined) {
    el.textContent = `Score: ${score}/100 - ${category}`;
    el.style.display = 'block';
  }
}

document.getElementById('start-test-1').addEventListener('click', () => {
  showScreen('screen-tp-intro');
});

document.getElementById('tp-begin').addEventListener('click', () => {
  TP.init();
});

document.getElementById('tp-start-btn').addEventListener('click', () => {
  TP.startTrial();
});

document.getElementById('tp-stop-btn').addEventListener('click', () => {
  TP.stopTrial();
});

document.getElementById('tp-retake').addEventListener('click', () => {
  TP.init();
});

document.getElementById('tp-back-tests').addEventListener('click', () => {
  showScreen('screen-tests');
});

async function loadPreviousTPResult() {
  try {
    const res = await fetch('/api/test-results/time-perception');
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        updateTest1Status(data.result.score, data.result.category);
      }
    }
  } catch (err) {}
}

const origCheckSession = checkSession;
checkSession = async function() {
  await origCheckSession();
  await loadPreviousTPResult();
};

loadPreviousTPResult();
