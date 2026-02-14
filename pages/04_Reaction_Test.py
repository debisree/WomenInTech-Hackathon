import streamlit as st
from helpers import init_session_state, require_auth
from constants import APP_NAME, TEST_NAMES

init_session_state()

st.set_page_config(page_title=f"{APP_NAME} — {TEST_NAMES['reaction']}", page_icon="🧠", layout="centered")

require_auth()

if not st.session_state.time_test_done:
    st.warning("Please complete the Time Perception Test first.")
    if st.button("Go to Test Overview"):
        st.switch_page("pages/02_Test_Overview.py")
    st.stop()

st.title(TEST_NAMES["reaction"])

if st.session_state.reaction_test_done:
    st.success("You have already completed this test.")
    if st.button("View Results", type="primary"):
        st.switch_page("pages/05_Results.py")
    st.stop()

st.markdown("""
**Instructions (placeholder):**

You will be shown a series of visual targets. Click as quickly as possible when a target appears.
This measures your reaction time and sustained attention.

*The actual test will be implemented later. For now, click the button below to mark it as complete with dummy data.*
""")

st.markdown("---")

if st.button("Mark Reaction Test Complete (stub)", type="primary", use_container_width=True):
    st.session_state.reaction_test_done = True
    st.session_state.avg_reaction_ms = 610
    st.session_state.misses = 2
    st.switch_page("pages/05_Results.py")
