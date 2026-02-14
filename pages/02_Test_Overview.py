import streamlit as st
from helpers import init_session_state, require_auth
from constants import APP_NAME, TEST_NAMES

init_session_state()

st.set_page_config(page_title=f"{APP_NAME} — Test Overview", page_icon="🧠", layout="centered")

require_auth()

st.title("Test Overview")
st.markdown(f"Hi **{st.session_state.display_name}**! Complete both tests to unlock your results.")

st.markdown("---")

time_done = st.session_state.time_test_done
reaction_done = st.session_state.reaction_test_done

col1, col2 = st.columns(2)

with col1:
    status = "Complete" if time_done else "Not started"
    icon = "✅" if time_done else "⬜"
    st.markdown(f"### Step 1 of 2")
    st.markdown(f"{icon} **{TEST_NAMES['time']}**")
    st.caption(status)

with col2:
    status = "Complete" if reaction_done else "Not started"
    icon = "✅" if reaction_done else "⬜"
    st.markdown(f"### Step 2 of 2")
    st.markdown(f"{icon} **{TEST_NAMES['reaction']}**")
    st.caption(status)

st.markdown("---")

if time_done and reaction_done:
    label = "View Results"
    target = "pages/05_Results.py"
elif time_done:
    label = "Continue to Reaction Test"
    target = "pages/04_Reaction_Test.py"
else:
    label = "Start Time Perception Test"
    target = "pages/03_Time_Test.py"

if st.button(label, type="primary", use_container_width=True):
    st.switch_page(target)
