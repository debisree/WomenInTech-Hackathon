# ADHDecode

## Overview
An ADHD likelihood analysis application (ADHDecode) that guides users through a multi-step flow: login, consent, demographics collection, current status assessment, and screening tests including a Time Perception Challenge. Features a Dashboard that aggregates results into a composite "ADHD Likelihood Signal" score.

## Project Architecture
- **Runtime**: Node.js 20
- **Framework**: Express.js 5 with express-session
- **Frontend**: Vanilla HTML/CSS/JS single-page app
- **Entry point**: `index.js` - Express server on port 5000
- **Static files**: `public/` directory

## Project Structure
```
├── index.js              # Express server with API routes
├── public/
│   ├── index.html        # All screens (SPA)
│   ├── style.css         # Styles
│   ├── app.js            # Frontend logic & navigation
│   ├── time-perception.js # Time Perception Challenge test logic
│   ├── reaction-test.js  # Reaction Test (Go/No-Go) test logic
│   └── dashboard.js      # Dashboard aggregation & rendering
├── package.json
└── .gitignore
```

## App Flow
1. **Login** - Sign in with existing account, create a new account, or continue as guest
2. **Welcome** - Greeting screen with user's name and steps overview (shows completion status)
3. **Consent** - One-time agreement (18+, not medical diagnosis). Skipped if already consented.
4. **Demographics** - Gender, age group, ethnicity, ADHD diagnosis history. Editable anytime via nav.
5. **Current Status** - Sleep quality, caffeine intake, focus level (1-5), lose-track-of-time frequency. Editable anytime via nav.
6. **Tests** - Time Perception Challenge (Test 1) + Reaction Test (Test 2, Go/No-Go CPT)
7. **Dashboard** - Composite signal score, test breakdown, recommendations

## Test 1: Time Perception Challenge
- **Flow**: Intro screen with instructions → 2 practice trials (6s, 12s, not scored) → 8 scored trials (randomized from pool [6,8,10,12,15,20s], no back-to-back duplicates) → Results screen
- **Timing**: Uses `performance.now()` for high-precision measurement
- **No per-trial feedback**: Shows "Recorded" between trials with 800ms auto-advance
- **Scoring Algorithm** (MAPE-based, fair across target lengths):
  - relative_abs_error = abs(actual - target) / target per trial
  - MAPE = mean of relative errors (capped at 60%)
  - relative_variability = std dev of relative errors (capped at 60%)
  - Time Control Score = 100 * (1 - 0.60 * normMAPE - 0.40 * normVar), range 0-100
  - Categories: Consistent (80+), Slight (60-79), Moderate (40-59), High (<40) inconsistency
- **Results screen includes**:
  - Score circle with color-coded category
  - "How we got your score" breakdown with Accuracy & Consistency progress bars
  - Metrics display (MAE, variability, bias)
  - Signed error bar chart per trial (over/under visualization)
  - Natural-language summary of bias and variability
  - Per-trial table with Target, Your Time, Off By, Direction columns
  - Disclaimer and retake tips
- **Persistence**: Results saved to session via API, restored on session reload

## Test 2: Reaction Test (Go/No-Go)
- **Flow**: Intro screen → Begin Test → 16 trials (70% GO/TAP, 30% NOGO/WAIT) → Results
- **Timing**: 1200ms timeout per trial, client-side timer with server validation
- **Stimulus**: Large colored circle — green "TAP" (GO) or red "WAIT" (NOGO)
- **UI Features**: Animated countdown bar, streak/combo badge, feedback toasts (hit/miss/correct/false tap), visual pulse on tap
- **Scoring**: Average RT, misses, false taps, RT variability (std dev)
- **Server logging**: `[reaction] start/tap/timeout/done` events logged to console
- **Gating**: Requires Time Perception Test completion first (403 if not done)
- **Persistence**: Results saved to session, restored on reload

## Dashboard
- **Composite Signal Score (0-100)**: Higher = stronger ADHD-like signal
- **Signal direction**: time_signal = 100 - time_control_score (inverted so worse time control = higher signal)
- **Weights**: Reaction Time 50%, Time Perception 50%
- **Missing tests**: Weight redistributed to completed test; confidence lowered
- **Recommendation buckets**: Lower (0-34), Mixed/Inconclusive (35-64), Higher (65-100)
- **Confidence levels**: High (2 tests, no flags), Medium (1 test), Low (0 tests)
- **Test cards**: Show completion status, key metrics, signal contribution, view/retake buttons
- **Context notes**: Flags poor sleep, high caffeine, low focus from status data
- **Safety**: Prominent disclaimers, non-diagnostic language, clinician referral nudges

## Navigation
- Top nav bar (Home, My Info, Status, Tests, Dashboard, Logout) appears after login
- Users can navigate to any section at any time
- My Info page pre-populates with saved data for editing
- Dashboard auto-loads data when navigated to

## API Routes
- `POST /api/register` - Create new account (username + password, min 4 chars, case-insensitive uniqueness)
- `POST /api/login` - Sign in with credentials or continue as guest
- `POST /api/consent` - Record consent (one-time)
- `POST /api/demographics` - Save demographics data (gender, ageGroup, ethnicity, adhdDiagnosed)
- `GET /api/user` - Get current user info (also used for session restoration)
- `POST /api/logout` - End session
- `POST /api/status` - Save current status data (sleepQuality, caffeineIntake, focusLevel, loseTrackOfTime)
- `POST /api/test-results/time-perception` - Save time perception test results
- `GET /api/test-results/time-perception` - Get previous time perception results
- `POST /api/reaction/start` - Start reaction test (requires time test completion)
- `POST /api/reaction/stimulus-shown` - Mark stimulus as shown (sets server timestamp)
- `GET /api/reaction/state` - Get current reaction test state
- `POST /api/reaction/tap` - Record a tap response
- `POST /api/reaction/timeout` - Record a timeout (no response)
- `POST /api/reaction/reset` - Reset reaction test data
- `GET /api/dashboard` - Get aggregated dashboard data with composite score, test breakdown, confidence

## Running
The application starts via `node index.js` and serves on port 5000.
