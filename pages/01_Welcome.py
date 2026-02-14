import uuid
import streamlit as st
from helpers import init_session_state
from constants import APP_NAME, DISCLAIMER

init_session_state()

st.set_page_config(page_title=f"{APP_NAME} — Welcome", page_icon="🧠", layout="centered")

st.title(f"Welcome to {APP_NAME}")
st.caption(DISCLAIMER)

st.markdown("---")

tab_guest, tab_signup = st.tabs(["Continue as Guest", "Sign Up"])

with tab_guest:
    st.markdown("Jump right in — no account needed.")
    if st.button("Continue as Guest", type="primary", use_container_width=True):
        st.session_state.auth_mode = "guest"
        st.session_state.display_name = "Guest"
        st.session_state.user_id = str(uuid.uuid4())
        st.switch_page("pages/02_Test_Overview.py")

with tab_signup:
    st.markdown("Create a profile to personalise your experience.")
    with st.form("signup_form"):
        display_name = st.text_input("Display Name *", placeholder="Your name")
        email = st.text_input("Email (optional)", placeholder="you@example.com")
        submitted = st.form_submit_button("Sign Up", type="primary", use_container_width=True)

    if submitted:
        if not display_name.strip():
            st.error("Display name is required.")
        elif email and "@" not in email:
            st.error("Please enter a valid email address.")
        else:
            st.session_state.auth_mode = "signup"
            st.session_state.display_name = display_name.strip()
            st.session_state.email = email.strip() if email else None
            st.session_state.user_id = str(uuid.uuid4())
            st.switch_page("pages/02_Test_Overview.py")
