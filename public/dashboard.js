const DASH = {
  testLabels: {
    reaction_time: { name: 'Reaction Time Test', desc: 'Measures response speed, variability, and attention lapses.', badge: 'Attention' },
    time_perception: { name: 'Time Perception Challenge', desc: 'Estimate time intervals to measure internal clock consistency.', badge: 'Time Sense' }
  },

  bucketLabels: {
    lower: 'Lower likelihood signal',
    mixed: 'Mixed / Inconclusive signal',
    higher: 'Higher likelihood signal',
    inconclusive: 'Incomplete — more tests needed'
  },

  bucketColors: {
    lower: '#38a169',
    mixed: '#d69e2e',
    higher: '#e53e3e',
    inconclusive: '#888'
  },

  confidenceLabels: {
    high: 'High confidence — both tests completed, no quality issues',
    medium: 'Medium confidence — one test completed',
    low: 'Low confidence — no tests completed yet'
  },

  async load() {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) return;
      const data = await res.json();
      this.render(data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  },

  render(data) {
    const scoreNum = document.getElementById('dash-score-num');
    const scoreCircle = document.getElementById('dash-score-circle');
    const bucketEl = document.getElementById('dash-bucket');
    const confEl = document.getElementById('dash-confidence');

    if (data.compositeScore !== null) {
      scoreNum.textContent = data.compositeScore;
      const color = this.bucketColors[data.bucket] || '#888';
      scoreCircle.style.borderColor = color;
    } else {
      scoreNum.textContent = '--';
      scoreCircle.style.borderColor = '#e2e8f0';
    }

    bucketEl.textContent = this.bucketLabels[data.bucket] || 'Unknown';
    bucketEl.style.color = this.bucketColors[data.bucket] || '#888';

    confEl.textContent = this.confidenceLabels[data.confidence] || '';

    this.renderBreakdown(data);
    this.renderTestCards(data);
    this.renderStatusNote(data);
  },

  renderBreakdown(data) {
    const container = document.getElementById('dash-breakdown-bars');
    const intro = document.getElementById('dash-breakdown-intro');
    const section = document.getElementById('dash-breakdown');

    if (data.completedCount === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    const testOrder = ['reaction_time', 'time_perception'];
    const weightLabels = { reaction_time: 'Reaction (50%)', time_perception: 'Time (50%)' };

    let completed = [];
    let missing = [];
    testOrder.forEach(key => {
      if (data.tests[key].completed) completed.push(key);
      else missing.push(key);
    });

    let introText = `Your signal score is based on ${completed.length} of ${data.totalTests} tests. `;
    if (missing.length > 0) {
      introText += `Missing tests (${missing.map(k => this.testLabels[k].name).join(', ')}) are excluded — their weight is redistributed proportionally. `;
    }
    introText += 'Higher signal = more ADHD-like patterns detected in these tasks.';
    intro.textContent = introText;

    let totalWeight = 0;
    completed.forEach(k => totalWeight += data.weights[k]);

    let html = '';
    testOrder.forEach(key => {
      const test = data.tests[key];
      const label = weightLabels[key];
      if (!test.completed) {
        html += `
          <div class="dash-bar-row dash-bar-disabled">
            <div class="dash-bar-label">${label}</div>
            <div class="dash-bar-wrap"><div class="dash-bar-fill" style="width:0%"></div></div>
            <span class="dash-bar-val">N/A</span>
          </div>`;
        return;
      }
      const effectiveWeight = Math.round((data.weights[key] / totalWeight) * 100);
      const signal = test.normalized_signal;
      const barColor = signal <= 34 ? '#38a169' : signal <= 64 ? '#d69e2e' : '#e53e3e';
      html += `
        <div class="dash-bar-row">
          <div class="dash-bar-label">${label} <span class="dash-bar-eff">(eff. ${effectiveWeight}%)</span></div>
          <div class="dash-bar-wrap"><div class="dash-bar-fill" style="width:${signal}%;background:${barColor}"></div></div>
          <span class="dash-bar-val">${signal}</span>
        </div>`;
    });

    container.innerHTML = html;
  },

  renderTestCards(data) {
    const container = document.getElementById('dash-test-cards');
    const testOrder = ['time_perception', 'reaction_time'];

    let html = '';
    testOrder.forEach(key => {
      const test = data.tests[key];
      const meta = this.testLabels[key];
      const completed = test.completed;

      html += `<div class="dash-test-card ${completed ? '' : 'dash-test-incomplete'}">`;
      html += `<div class="dash-test-header">`;
      html += `<span class="dash-test-badge">${meta.badge}</span>`;
      html += `<span class="dash-test-status ${completed ? 'dash-done' : 'dash-pending'}">${completed ? 'Completed' : 'Not completed'}</span>`;
      html += `</div>`;
      html += `<h4>${meta.name}</h4>`;

      if (completed) {
        if (key === 'time_perception') {
          const m = test.raw_metrics;
          const ts = test.timestamp ? new Date(test.timestamp).toLocaleString() : '';
          html += `<p class="dash-test-date">Last taken: ${ts}</p>`;
          html += `<div class="dash-test-metrics">`;
          html += `<span>Time Control: <strong>${m.score}/100</strong></span>`;
          html += `<span>MAE: <strong>${(m.mae / 1000).toFixed(2)}s</strong></span>`;
          html += `<span>Variability: <strong>${(m.variability / 1000).toFixed(2)}s</strong></span>`;
          html += `</div>`;
          html += `<p class="dash-test-signal">Signal contribution: <strong>${test.normalized_signal}/100</strong></p>`;
          if (test.quality_flags && test.quality_flags.length) {
            html += `<p class="dash-quality-flag">Quality note: ${test.quality_flags.join(', ')}</p>`;
          }
        }
        html += `<div class="dash-test-actions">`;
        if (key === 'time_perception') {
          html += `<button class="btn btn-outline btn-sm" onclick="showScreen('screen-tp-results')">View Details</button>`;
          html += `<button class="btn btn-outline btn-sm" onclick="TP.init()">Retake</button>`;
        }
        html += `</div>`;
      } else {
        html += `<p class="dash-test-desc">${meta.desc}</p>`;
        html += `<div class="dash-test-actions">`;
        if (key === 'time_perception') {
          html += `<button class="btn btn-primary btn-sm" onclick="showScreen('screen-tp-intro')">Start Test</button>`;
        } else {
          html += `<button class="btn btn-outline btn-sm" disabled>Coming Soon</button>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
    });

    container.innerHTML = html;
  },

  renderStatusNote(data) {
    const el = document.getElementById('dash-status-note');
    if (!data.status) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    const s = data.status;
    let notes = [];
    if (s.sleepQuality === 'Very Poor' || s.sleepQuality === 'Poor') notes.push('poor sleep may affect results');
    if (s.caffeineIntake === 'High (4+ cups)') notes.push('high caffeine intake noted');
    if (s.focusLevel === '1' || s.focusLevel === '2') notes.push('low focus level reported');
    if (notes.length) {
      el.innerHTML = `<strong>Context note:</strong> ${notes.join('; ')}. Consider retaking tests under better conditions for more reliable results.`;
    } else {
      el.style.display = 'none';
    }
  }
};

document.getElementById('dash-go-tests').addEventListener('click', () => {
  showScreen('screen-tests');
});
