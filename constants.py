APP_NAME = "Focus Forge"
APP_TAGLINE = "ADHD Self-Reflection Tool"
DISCLAIMER = "Not a medical diagnosis. For self-reflection only."

TEST_NAMES = {
    "time": "Time Perception Test",
    "reaction": "Reaction (Attention) Test",
}

LABELS = {
    "low": "Minimal Indicators",
    "moderate": "Moderate Time Blindness + Mild Distractibility",
    "high": "Significant Attention Challenges",
}

SESSION_DEFAULTS = {
    "auth_mode": None,
    "display_name": None,
    "email": None,
    "user_id": None,
    "time_test_done": False,
    "reaction_test_done": False,
    "time_error_sec": 0.0,
    "avg_reaction_ms": 0,
    "misses": 0,
    "score": 0,
    "label": "",
    "insights": [],
    "coach_text": "",
}
