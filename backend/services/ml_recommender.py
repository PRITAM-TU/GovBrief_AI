"""
GovBrief AI — ML Recommender Service
Loads the trained XGBoost model to provide fast, probability-based scheme recommendations.
"""
import os
import joblib
import pandas as pd
from config import settings

_model_data = None
_MODEL_PATH = os.path.join(settings.GENERATED_DIR, "scheme_recommender.joblib")

def _load_model():
    global _model_data
    if _model_data is None:
        if os.path.exists(_MODEL_PATH):
            _model_data = joblib.load(_MODEL_PATH)
        else:
            print(f"[ML Recommender] Model not found at {_MODEL_PATH}. Returning fallback.")
    return _model_data


def recommend_schemes(farmer_profile: dict) -> list[dict]:
    """
    Given a farmer's profile, generate probability scores for all schemes
    and return the Top 5 formatted exactly like the AI matcher.
    """
    model_data = _load_model()
    
    # Fallback to a dummy response if model hasn't been trained yet
    if not model_data:
        return [{"scheme_id": 1, "scheme_name": "Please run ML Trainer first", "eligibility_score": 0,
                 "reasons_eligible": ["Model missing"], "documents_needed": "", "estimated_benefit": "", "application_tip": ""}]

    model = model_data["model"]
    encoders = model_data["encoders"]
    schemes_map = model_data["schemes_map"]

    # Extract user profile defaults
    f_state = farmer_profile.get("state") or "Maharashtra"
    f_land = float(farmer_profile.get("land_size") or 2.0)
    f_income = float(farmer_profile.get("income") or 50000)
    f_crop = farmer_profile.get("crop_types") or "Multiple"
    f_category = farmer_profile.get("farmer_category") or "Any"

    # Safely encode categorical features (handle unseen labels gracefully)
    def _encode(encoder, value, default=0):
        try:
            return encoder.transform([value])[0]
        except ValueError:
            return default  # fallback if user enters a state/crop not seen in training

    state_enc = _encode(encoders["farmer_state"], f_state)
    crop_enc = _encode(encoders["crop_type"], f_crop)
    cat_enc = _encode(encoders["farmer_category"], f_category)

    # Build feature dataframe for ALL schemes
    scheme_ids = list(schemes_map.keys())
    
    df = pd.DataFrame({
        "farmer_state": [state_enc] * len(scheme_ids),
        "land_size": [f_land] * len(scheme_ids),
        "income": [f_income] * len(scheme_ids),
        "crop_type": [crop_enc] * len(scheme_ids),
        "farmer_category": [cat_enc] * len(scheme_ids),
        "scheme_id": scheme_ids
    })

    # Predict approval probabilities
    # model.predict_proba returns array of [prob_rejected, prob_approved]
    probabilities = model.predict_proba(df)[:, 1]

    # Combine with schemes and sort
    results = []
    for idx, sid in enumerate(scheme_ids):
        prob = round(probabilities[idx] * 100)
        
        # Determine strict eligibility rejection reason if probability is very low
        reasons = ["Matches your profile"]
        if prob < 20:
            reasons = ["Does not match profile criteria"]
        elif prob > 80:
            reasons = ["High likelihood of approval", "Matches land/income criteria"]
            
        scheme_info = schemes_map[sid]
        
        results.append({
            "scheme_id": sid,
            "scheme_name": scheme_info["name"],
            "eligibility_score": prob,
            "reasons_eligible": reasons,
            "documents_needed": scheme_info["documents_needed"],
            "estimated_benefit": scheme_info["subsidy_amount"],
            "application_tip": scheme_info["apply_url"]
        })

    # Sort by highest probability and return top 5
    results.sort(key=lambda x: x["eligibility_score"], reverse=True)
    return results[:5]
