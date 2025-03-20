import streamlit as st
import requests

# Set up Streamlit UI
st.title("Cyberbullying Detection System")
st.markdown("Enter a text message to check if it contains cyberbullying content.")

# Input text box
user_input = st.text_area("Enter text here:", "")

# API URL
API_URL = "http://127.0.0.1:5000/predict"

if st.button("Analyze Text"):
    if user_input.strip() == "":
        st.warning("Please enter some text.")
    else:
        # Send request to Flask API
        response = requests.post(API_URL, json={"text": user_input})
        result = response.json()

        # Display results
        st.subheader("Analysis Result:")
        if result["prediction"] == "not_cyberbullying":
            st.success("✅ This text is **not** cyberbullying.")
        else:
            st.error("🚨 This text contains cyberbullying content!")
            st.json(result["probabilities"])
