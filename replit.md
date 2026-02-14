# ADHDecode

## Overview
An ADHD likelihood analysis application (ADHDecode) that guides users through a multi-step flow: login, consent, demographics collection, current status assessment, and screening tests including a Time Perception Challenge.

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
│   └── time-perception.js # Time Perception Challenge test logic
├── package.json
└── .gitignore
```

## App Flow
1. **Login** - Sign in with username/password or continue as guest
2. **Welcome** - Greeting screen with user's name and steps overview (shows completion status)
3. **Consent** - One-time agreement (18+, not medical diagnosis). Skipped if already consented.
4. **Demographics** - Gender, age group, ethnicity, ADHD diagnosis history. Editable anytime via nav.
5. **Current Status** - Sleep quality, caffeine intake, focus level (1-5), lose-track-of-time frequency. Editable anytime via nav.
6. **Tests** - Time Perception Challenge (Test 1) + Test 2 (TBD)

## Test 1: Time Perception Challenge
- **Flow**: Intro screen with instructions → 2 practice trials (6s, 12s, not scored) → 8 scored trials (randomized from pool [6,8,10,12,15,20s], no back-to-back duplicates) → Results screen
- **Timing**: Uses `performance.now()` for high-precision measurement
- **No per-trial feedback**: Shows "Recorded" between trials with 800ms auto-advance
- **Scoring Algorithm**:
  - MAE = mean absolute error (capped at 6000ms)
  - Variability = std dev of errors (capped at 6000ms)
  - Bias = mean signed error (over/underestimate)
  - Time Control Score = 100 - (0.55 * normMAE + 0.45 * normSTD) * 100 (range 0-100)
  - Categories: Typical (80+), Mild (60-79), Moderate (40-59), High (<40) inconsistency
- **Results**: Score circle, metrics display, per-trial table, retake/back buttons, disclaimer
- **Persistence**: Results saved to session via API, restored on session reload

## Navigation
- Top nav bar (Home, My Info, Status, Tests, Logout) appears after login
- Users can navigate to any section at any time
- My Info page pre-populates with saved data for editing

## API Routes
- `POST /api/login` - Login or guest access
- `POST /api/consent` - Record consent (one-time)
- `POST /api/demographics` - Save demographics data (gender, ageGroup, ethnicity, adhdDiagnosed)
- `GET /api/user` - Get current user info (also used for session restoration)
- `POST /api/logout` - End session
- `POST /api/status` - Save current status data (sleepQuality, caffeineIntake, focusLevel, loseTrackOfTime)
- `POST /api/test-results/time-perception` - Save time perception test results
- `GET /api/test-results/time-perception` - Get previous time perception results

## Running
The application starts via `node index.js` and serves on port 5000.
