def generate_micro_plan(
    score: int, label: str, insights: list[str], context: str = "Work"
) -> str:
    plan = f"""**Your 10-Minute Micro-Plan ({context} Context)**

Based on your score of {score} ({label}), here is a quick plan to boost your focus:

**Steps:**
1. **Set a visible timer for 10 minutes.** Place your phone or a timer where you can see it. This builds time awareness and counters time blindness.
2. **Write down your single most important task.** Keep it on a sticky note in front of you — one task only.
3. **Work in a 5-2-3 burst:** 5 minutes of deep focus, 2 minutes of stretching/breathing, then 3 minutes to finish or review.

**Coping Technique:**
If you feel your attention drifting, try the "5-4-3-2-1" grounding method: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, and 1 you taste.

**Affirmation:**
"My brain works differently, not deficiently. Small steps still move me forward."

---
*Safety note: This is not medical advice. If you are struggling, please reach out to a qualified healthcare professional.*
"""
    return plan
