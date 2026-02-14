# Focus Forge — ADHD Self-Reflection Tool

## Overview
A Streamlit multi-page app for ADHD self-reflection. Users complete two cognitive tests (Time Perception and Reaction/Attention) and receive a "Cognitive Snapshot" with scoring, insights, and a coaching micro-plan. Currently uses stub/placeholder tests with dummy data.

## Project Architecture
- **Language:** Python 3.11
- **Framework:** Streamlit (multipage app via `/pages` folder)
- **Libraries:** streamlit, pandas, plotly
- **No database** — all data is session-only via `st.session_state`
- **No auth** — guest or simple signup (name/email, no validation)

### File Structure
```
app.py                    # Landing page, redirects to Welcome
pages/
  01_Welcome.py           # Sign-in / Guest entry
  02_Test_Overview.py     # Shows test progress, routes to next step
  03_Time_Test.py         # Placeholder time perception test
  04_Reaction_Test.py     # Placeholder reaction/attention test
  05_Results.py           # Gated results dashboard with charts + coaching
constants.py              # App-wide constants and session defaults
scoring.py                # Scoring logic (stub/deterministic)
coach.py                  # Micro-plan generator (stub)
helpers.py                # Session init, auth checks
.streamlit/config.toml    # Streamlit server config (port 5000, all hosts)
```

### Page Flow & Gating
1. Welcome → authenticate (guest or signup)
2. Test Overview → shows progress
3. Time Test → must be authenticated
4. Reaction Test → must complete Time Test first
5. Results → must complete both tests

## Recent Changes
- 2026-02-14: Initial scaffold built with all pages, shared modules, and stub tests
