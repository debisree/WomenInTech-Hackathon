import streamlit as st
from constants import SESSION_DEFAULTS


def init_session_state():
    for key, default in SESSION_DEFAULTS.items():
        if key not in st.session_state:
            if isinstance(default, list):
                st.session_state[key] = list(default)
            else:
                st.session_state[key] = default


def is_authenticated() -> bool:
    return st.session_state.get("auth_mode") is not None


def require_auth():
    if not is_authenticated():
        st.warning("Please sign in or continue as guest first.")
        if st.button("Go to Welcome"):
            st.switch_page("pages/01_Welcome.py")
        st.stop()
