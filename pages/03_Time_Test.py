import streamlit as st
from helpers import init_session_state, require_auth
from constants import APP_NAME, TEST_NAMES

init_session_state()

st.set_page_config(page_title=f"{APP_NAME} — {TEST_NAMES['time']}", page_icon="🧠", layout="centered")

require_auth()

st.title(TEST_NAMES["time"])

if st.session_state.time_test_done:
    st.success("You have already completed this test.")
    if st.button("Continue to Reaction Test", type="primary"):
        st.switch_page("pages/04_Reaction_Test.py")
    st.stop()

st.markdown("""
**Instructions (placeholder):**

You will be asked to estimate when a set amount of time has passed — without looking at any clock.
This measures your internal sense of time.

*The actual test will be implemented later. For now, click the button below to mark it as complete with dummy data.*
""")

st.markdown("---")

if st.button("Mark Time Test Complete (stub)", type="primary", use_container_width=True):
    st.session_state.time_test_done = True
    st.session_state.time_error_sec = 3.2
    st.switch_page("pages/04_Reaction_Test.py")
