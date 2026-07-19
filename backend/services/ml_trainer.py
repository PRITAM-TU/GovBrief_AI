"""
GovBrief AI — ML Trainer
Generates synthetic farmer data and trains an XGBoost model for scheme recommendations.
"""
import os
import sys
import random
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.scheme import Scheme
from models.alert import Alert, PayoutVerification
from models.user import User
from models.document import Document
from config import settings

# States list for synthetic data
INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "All"
]

CROP_TYPES = ["Wheat", "Rice", "Cotton", "Sugarcane", "Maize", "Pulses", "Oilseeds", "Millets", "Horticulture", "Multiple"]
CATEGORIES = ["General", "OBC", "SC", "ST", "Small/Marginal", "Any"]


def generate_synthetic_data(num_samples=15000):
    """Generate fake farmer profiles and label eligibility against actual DB schemes."""
    print("Fetching active schemes from DB...")
    db = SessionLocal()
    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
    db.close()

    if not schemes:
        print("No active schemes found. Please seed the DB first.")
        return None, None

    print(f"Generating {num_samples} synthetic farmer profiles...")
    data = []

    for _ in range(num_samples):
        # Generate a random farmer profile
        farmer_state = random.choice(INDIAN_STATES[:-1]) # exclude 'All'
        land_size = round(random.uniform(0.1, 25.0), 2)  # Acres
        income = random.randint(20000, 1500000)          # Annual income INR
        crop = random.choice(CROP_TYPES)
        category = random.choice(CATEGORIES)

        # Evaluate against ALL schemes
        for scheme in schemes:
            approved = 1

            # Rule 1: State eligibility
            if scheme.applicable_states and scheme.applicable_states != "All":
                states = [s.strip() for s in scheme.applicable_states.split(",")]
                if farmer_state not in states:
                    approved = 0

            # Rule 2: Land size limits
            if scheme.min_land and land_size < scheme.min_land:
                approved = 0
            if scheme.max_land and land_size > scheme.max_land:
                approved = 0

            # Rule 3: Income limits
            if scheme.max_income and income > scheme.max_income:
                approved = 0

            # Rule 4: Farmer Category (simplified)
            if scheme.farmer_category and scheme.farmer_category not in ["All", "Any"]:
                # If scheme requires Small/Marginal, farmer must be that OR land size must be <= 5 acres
                if "Small" in scheme.farmer_category or "Marginal" in scheme.farmer_category:
                    if land_size > 5.0 and category != "Small/Marginal":
                        approved = 0

            # Add some randomness to simulate real-world rejections (missing docs, failed verification)
            if approved == 1 and random.random() < 0.15: # 15% random rejection rate
                approved = 0

            data.append({
                "farmer_state": farmer_state,
                "land_size": land_size,
                "income": income,
                "crop_type": crop,
                "farmer_category": category,
                "scheme_id": scheme.id,
                "approved": approved
            })

    df = pd.DataFrame(data)
    print(f"Total labeled records generated: {len(df)}")
    return df, schemes


def train_model():
    """Train XGBoost and save the model pipeline."""
    df, schemes = generate_synthetic_data()
    if df is None:
        return

    print("Encoding categorical features...")
    encoders = {}
    cat_columns = ["farmer_state", "crop_type", "farmer_category"]

    for col in cat_columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    # Features and Target
    X = df[["farmer_state", "land_size", "income", "crop_type", "farmer_category", "scheme_id"]]
    y = df["approved"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training XGBoost Classifier...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Model Training Complete! Accuracy: {acc * 100:.2f}%")

    # Save model and encoders
    os.makedirs(settings.GENERATED_DIR, exist_ok=True)
    model_path = os.path.join(settings.GENERATED_DIR, "scheme_recommender.joblib")

    # Also save a quick map of scheme ID to Scheme dict for fast retrieval
    schemes_map = {
        s.id: {
            "id": s.id,
            "name": s.name,
            "documents_needed": s.documents_needed,
            "subsidy_amount": s.benefits or s.subsidy_amount or "",
            "apply_url": s.apply_url or "Visit local office",
        } for s in schemes
    }

    joblib.dump({
        "model": model,
        "encoders": encoders,
        "schemes_map": schemes_map
    }, model_path)
    
    print(f"Model saved successfully to {model_path}")


if __name__ == "__main__":
    train_model()
