import streamlit as st
from helpers import init_session_state
from constants import APP_NAME, APP_TAGLINE, DISCLAIMER

st.set_page_config(page_title=APP_NAME, page_icon="🧠", layout="centered")
init_session_state()

st.title(f"🧠 {APP_NAME}")
st.subheader(APP_TAGLINE)
st.info(DISCLAIMER)

st.markdown("---")
st.markdown("Use the sidebar to navigate, or click below to get started.")

if st.button("Get Started", type="primary", use_container_width=True):
    st.switch_page("pages/01_Welcome.py")
