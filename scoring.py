def compute_score(
    time_error_sec: float, avg_reaction_ms: int, misses: int
) -> tuple[int, str, list[str]]:
    time_score = max(0, 100 - int(time_error_sec * 8))
    reaction_score = max(0, 100 - int((avg_reaction_ms - 200) / 5))
    miss_penalty = misses * 5
    score = max(0, min(100, (time_score + reaction_score) // 2 - miss_penalty))

    if score >= 80:
        label = "Minimal Indicators"
    elif score >= 50:
        label = "Moderate Time Blindness + Mild Distractibility"
    else:
        label = "Significant Attention Challenges"

    insights = [
        f"Your time perception error was {time_error_sec:.1f}s — "
        + ("within a typical range." if time_error_sec < 2 else "above the typical range, suggesting possible time blindness."),
        f"Average reaction time of {avg_reaction_ms}ms — "
        + ("well within normal limits." if avg_reaction_ms < 400 else "slightly elevated, which may indicate distractibility."),
        f"You missed {misses} target(s) during the attention task"
        + (" — great focus!" if misses == 0 else "."),
    ]

    return score, label, insights
