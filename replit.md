# ADHD Screening Test App

## Overview
An ADHD screening test application that guides users through a multi-step flow: login, consent, demographics collection, and screening tests (tests to be implemented).

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
│   └── app.js            # Frontend logic & navigation
├── package.json
└── .gitignore
```

## App Flow
1. **Login** - Sign in with username/password or continue as guest
2. **Welcome** - Greeting screen with user's name and steps overview (shows completion status)
3. **Consent** - One-time agreement (18+, not medical diagnosis). Skipped if already consented.
4. **Demographics** - Gender, age group, ethnicity, ADHD diagnosis history. Editable anytime via nav.
5. **Tests** - Two test slots (to be implemented)

## Navigation
- Top nav bar (Home, My Info, Tests, Logout) appears after login
- Users can navigate to any section at any time
- My Info page pre-populates with saved data for editing

## API Routes
- `POST /api/login` - Login or guest access
- `POST /api/consent` - Record consent (one-time)
- `POST /api/demographics` - Save demographics data (gender, ageGroup, ethnicity, adhdDiagnosed)
- `GET /api/user` - Get current user info (also used for session restoration)
- `POST /api/logout` - End session

## Running
The application starts via `node index.js` and serves on port 5000.
