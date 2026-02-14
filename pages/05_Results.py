import streamlit as st
import plotly.graph_objects as go
from helpers import init_session_state, require_auth
from constants import APP_NAME, SESSION_DEFAULTS
from scoring import compute_score
from coach import generate_micro_plan

init_session_state()

st.set_page_config(page_title=f"{APP_NAME} — Results", page_icon="🧠", layout="centered")

require_auth()

if not (st.session_state.time_test_done and st.session_state.reaction_test_done):
    st.warning("Please complete both tests before viewing results.")
    if st.button("Go to Test Overview"):
        st.switch_page("pages/02_Test_Overview.py")
    st.stop()

score, label, insights = compute_score(
    st.session_state.time_error_sec,
    st.session_state.avg_reaction_ms,
    st.session_state.misses,
)
st.session_state.score = score
st.session_state.label = label
st.session_state.insights = insights

st.title("Cognitive Snapshot")

col_score, col_label = st.columns([1, 2])
with col_score:
    st.metric("Overall Score", f"{score}/100")
with col_label:
    st.markdown(f"**Profile:** {label}")

st.markdown("---")
st.subheader("Insights")
for insight in insights:
    st.markdown(f"- {insight}")

st.markdown("---")
st.subheader("Signal Breakdown")

time_norm = max(0, min(100, 100 - int(st.session_state.time_error_sec * 8)))
reaction_norm = max(0, min(100, 100 - int((st.session_state.avg_reaction_ms - 200) / 5)))
miss_norm = max(0, 100 - st.session_state.misses * 25)

fig = go.Figure(data=[
    go.Bar(
        x=["Time Perception", "Reaction Speed", "Target Accuracy"],
        y=[time_norm, reaction_norm, miss_norm],
        marker_color=["#636EFA", "#EF553B", "#00CC96"],
        text=[f"{time_norm}%", f"{reaction_norm}%", f"{miss_norm}%"],
        textposition="auto",
    )
])
fig.update_layout(
    yaxis_title="Normalized Score (%)",
    yaxis_range=[0, 105],
    height=350,
    margin=dict(t=20, b=40),
)
st.plotly_chart(fig, use_container_width=True)

st.markdown("---")
st.subheader("Coaching")

if st.button("Generate 10-min Micro-Plan", type="primary", use_container_width=True):
    st.session_state.coach_text = generate_micro_plan(score, label, insights)

if st.session_state.coach_text:
    st.markdown(st.session_state.coach_text)

st.markdown("---")

col_rerun, col_reset = st.columns(2)

with col_rerun:
    if st.button("Re-run Snapshot", use_container_width=True):
        st.session_state.time_test_done = False
        st.session_state.reaction_test_done = False
        st.session_state.time_error_sec = 0.0
        st.session_state.avg_reaction_ms = 0
        st.session_state.misses = 0
        st.session_state.score = 0
        st.session_state.label = ""
        st.session_state.insights = []
        st.session_state.coach_text = ""
        st.switch_page("pages/02_Test_Overview.py")

with col_reset:
    if st.button("Reset Session", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("pages/01_Welcome.py")
