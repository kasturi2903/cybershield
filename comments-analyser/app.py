# from flask import Flask, request, jsonify
# import joblib
# import re

# # Load saved model and vectorizer
# model = joblib.load("cyberbullying_model.pkl")
# vectorizer = joblib.load("tfidf_vectorizer.pkl")

# # Initialize Flask app
# app = Flask(__name__)

# # Define text cleaning function
# def clean_text(text):
#     text = text.lower()  # Convert to lowercase
#     text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
#     text = re.sub(r'\d+', '', text)  # Remove numbers
#     return text.strip()

# # Define prediction function
# def predict_text(text):
#     cleaned_text = clean_text(text)

#     # Whitelist for clearly positive/non-cyberbullying phrases
#     whitelist = [
#         "i like you", "i am grateful", "you are amazing", "thank you", "you are kind",
#         "you are smart", "have a nice day", "you're wonderful", "i appreciate you"
#     ]

#     # If input text exactly matches a safe phrase, return early
#     if cleaned_text in whitelist:
#         return {"prediction": "not_cyberbullying", "probabilities": {}}

#     # Vectorize and predict
#     vectorized_text = vectorizer.transform([cleaned_text])
#     probabilities = model.predict_proba(vectorized_text)[0]

#     labels = ['toxic', 'obscene', 'insult', 'threat', 'identity_hate']
#     predicted_labels = {labels[i]: probabilities[i] for i in range(len(labels)) if probabilities[i] > 0.9}

#     if not predicted_labels:
#         return {"prediction": "not_cyberbullying", "probabilities": {}}

#     return {"prediction": "cyberbullying", "probabilities": predicted_labels}


# # Define API endpoint
# @app.route("/predict", methods=["POST"])
# def predict():
#     data = request.json
#     text = data.get("text", "")

#     if not text:
#         return jsonify({"error": "No text provided"}), 400

#     result = predict_text(text)
#     return jsonify(result)

# # Run Flask app
# if __name__ == "__main__":
#     app.run(debug=True)
from flask import Flask, request, jsonify
import joblib
import re

# Load saved model and vectorizer
model = joblib.load("cyberbullying_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

# Initialize Flask app
app = Flask(__name__)

# Define text cleaning function
def clean_text(text):
    text = text.lower()  # Convert to lowercase
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = re.sub(r'\d+', '', text)  # Remove numbers
    return text.strip()

# Define prediction function
def predict_text(text):
    cleaned_text = clean_text(text)

    # Whitelist for clearly positive/non-cyberbullying phrases
    whitelist = [
        "i like you", "i am grateful", "you are amazing", "thank you", "you are kind",
        "you are smart", "have a nice day", "you're wonderful", "i appreciate you"
    ]

    # If input text exactly matches a safe phrase, return early
    if cleaned_text in whitelist:
        return {"prediction": "not_cyberbullying", "probabilities": {}}

    # Vectorize and predict
    vectorized_text = vectorizer.transform([cleaned_text])
    probabilities = model.predict_proba(vectorized_text)[0]

    labels = ['toxic', 'obscene', 'insult', 'threat', 'identity_hate']
    predicted_labels = {labels[i]: probabilities[i] for i in range(len(labels)) if probabilities[i] > 0.9}

    if not predicted_labels:
        return {"prediction": "not_cyberbullying", "probabilities": {}}

    return {"prediction": "cyberbullying", "probabilities": predicted_labels}


# Define API endpoint
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    result = predict_text(text)
    return jsonify(result)

# Run Flask app
if __name__ == "__main__":
    app.run(debug=True)



