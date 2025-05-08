from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, validator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import joblib, json, os
import pandas as pd
import random

# 1️⃣ Define the API contract

class PredictRequest(BaseModel):
    # Update feature names to match PCA-selected features
    proto: float
    dur: float
    state: float
    smean: float
    sttl: float
    dpkts: float
    ackdat: float
    synack: float
    response_body_len: float
    djit: float
    
    class Config:
        schema_extra = {
            "example": {
                "proto": 6,
                "dur": 0.0,
                "state": 3,
                "smean": 0,
                "sttl": 64,
                "dpkts": 1,
                "ackdat": 0,
                "synack": 0,
                "response_body_len": 0,
                "djit": 0
            }
        }
        
    # Alternative constructor that can accept a list of values
    @classmethod
    def from_list(cls, features: List[float]):
        if len(features) != 10:
            raise ValueError(f"Expected 10 features, got {len(features)}")
        return cls(
            proto=features[0],
            dur=features[1],
            state=features[2],
            smean=features[3],
            sttl=features[4],
            dpkts=features[5],
            ackdat=features[6],
            synack=features[7],
            response_body_len=features[8],
            djit=features[9]
        )


class PredictResponse(BaseModel):
    prediction: int
    probability: float
    status: str = "success"
    message: str = ""


# 2️⃣ FastAPI setup

app = FastAPI(title="IDS PCA-Selected RF API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Validation error in request data",
            "details": exc.errors()
        },
    )

# 3️⃣ Load pipeline + threshold

# Use absolute paths to find the model files in the root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PIPELINE_FILE = os.path.join(BASE_DIR, "ids_pipeline.pkl")
THRESH_FILE = os.path.join(BASE_DIR, "threshold.json")
pipeline        = None
threshold       = 0.5
model_loaded    = False
model_load_error = None



try:
    if os.path.exists(PIPELINE_FILE):
        pipeline = joblib.load(PIPELINE_FILE)
        model_loaded = True
    else:
        model_load_error = f"Pipeline file not found: {PIPELINE_FILE}"
    # Load threshold
    if os.path.exists(THRESH_FILE):
        threshold = json.load(open(THRESH_FILE))["threshold"]
    else:
        model_load_error = (model_load_error or "") + f"; Missing threshold file: {THRESH_FILE}"
except Exception as e:
    model_load_error = str(e)

# 4️⃣ Health check

@app.get("/", tags=["Health"])
def health_check() -> Dict[str, Any]:
    status = "ok" if model_loaded else "error"
    resp = {"status": status, "model_loaded": model_loaded}
    if not model_loaded:
        resp["error"] = model_load_error
    else:
        resp["threshold"] = threshold
        # Get feature names used by the pipeline
        resp["features"] = ['proto','dur','state','smean','sttl',
                           'dpkts','ackdat','synack','response_body_len','djit']
    return resp

# 5️⃣ Test endpoint

@app.get("/test-prediction", response_model=PredictResponse, tags=["Testing"])
def test_prediction():
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Create test data with the expected features
    test_data = pd.DataFrame({
        'proto': [0.0],
        'dur': [0.0],
        'state': [0.0],
        'smean': [0.0],
        'sttl': [0.0],
        'dpkts': [0.0],
        'ackdat': [0.0],
        'synack': [0.0],
        'response_body_len': [0.0],
        'djit': [0.0]
    })
    
    try:
        prob = float(pipeline.predict_proba(test_data)[0][1])
        pred = int(prob >= threshold)
        return PredictResponse(prediction=pred, probability=prob, message="Test OK")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test inference error: {str(e)}")

# Alternative endpoint for list-based features (for backward compatibility)
@app.post("/predict-legacy", response_model=PredictResponse, tags=["Prediction"]) 
async def predict_legacy(request: Request):
    if not model_loaded:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": "Model not loaded"}
        )
        
    try:
        # Parse the request body manually
        body = await request.json()
        print("Request body:", body)  # Debugging line
        
        # Handle both "features" array or direct object format
        if "features" in body:
            features = body["features"]
            # Check if it's a list with 10 elements
            if isinstance(features, list) and len(features) == 10:
                # Create a PredictRequest from the list
                req = PredictRequest(
                    proto=int(features[0]),  # Ensure correct type conversion
                    dur=float(features[1]),
                    state=int(features[2]),
                    smean=float(features[3]),
                    sttl=int(features[4]),
                    dpkts=int(features[5]),
                    ackdat=int(features[6]),
                    synack=int(features[7]),
                    response_body_len=int(features[8]),
                    djit=float(features[9])
                )
            else:
                return JSONResponse(
                    status_code=422,
                    content={"status": "error", "message": "Expected 10 features in array"}
                )
        else:
            # Try to create PredictRequest directly from body
            try:
                req = PredictRequest(**body)
            except Exception as e:
                return JSONResponse(
                    status_code=422,
                    content={"status": "error", "message": f"Invalid request format: {str(e)}"}
                )
                
        # Create DataFrame from the request
        input_data = pd.DataFrame({
            'proto': [req.proto],
            'dur': [req.dur],
            'state': [req.state],
            'smean': [req.smean],
            'sttl': [req.sttl],
            'dpkts': [req.dpkts],
            'ackdat': [req.ackdat],
            'synack': [req.synack],
            'response_body_len': [req.response_body_len],
            'djit': [req.djit]
        })
        
        # Add additional error handling for model prediction
        try:
            # Make prediction using the pipeline
            prob = float(pipeline.predict_proba(input_data)[0][1])
            pred = int(prob >= threshold)
        except Exception as model_error:
            print(f"Model prediction error: {str(model_error)}")
            print(f"Input data: {input_data}")
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Model prediction error: {str(model_error)}"}
            )
            
        return PredictResponse(
            prediction=pred,
            probability=prob,
            message="Prediction successful"
        )
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Inference error: {str(e)}")
        print(f"Traceback: {error_traceback}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Inference error: {str(e)}"}
        )
        
# 6️⃣ Main prediction

@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(req: PredictRequest):
    if not model_loaded:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": "Model not loaded"}
        )

    try:
        # Convert request to DataFrame with expected column names 
        # (needed for the pipeline's ColumnTransformer)
        input_data = pd.DataFrame({
            'proto': [req.proto],
            'dur': [req.dur],
            'state': [req.state],
            'smean': [req.smean],
            'sttl': [req.sttl],
            'dpkts': [req.dpkts],
            'ackdat': [req.ackdat],
            'synack': [req.synack],
            'response_body_len': [req.response_body_len],
            'djit': [req.djit]
        })
        
        # Use the pipeline for prediction
        prob = float(pipeline.predict_proba(input_data)[0][1])
        pred = int(prob >= threshold)
        
        return PredictResponse(
            prediction=pred,
            probability=prob,
            message="Prediction successful"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


TEST_CSV  = os.path.join(BASE_DIR, "UNSW_NB15_testing_cleaned.csv")

if not os.path.exists(TEST_CSV):
    raise RuntimeError(f"Test CSV not found at {TEST_CSV}")

_df_test = pd.read_csv(TEST_CSV)
_attack_rows = _df_test[_df_test['label']==1]

if _attack_rows.empty:
    raise RuntimeError("No attack rows found in test CSV")


TOP_FEATS = [
    'proto','dur','state','smean','sttl',
    'dpkts','ackdat','synack','response_body_len','djit'
]


@app.get("/sample-attack", tags=["Testing"])
def sample_attack():
    """
    Returns a single random attack sample's feature vector.
    """
    try:
        # Pick one row from the pre-filtered attacks
        row = _attack_rows.sample(n=1).iloc[0]
        # Extract only the PCA-selected features in the exact same order
        feats = [float(row[f]) for f in TOP_FEATS]
        return {"features": feats}
    except Exception as e:
        # Log to console so you can see the real error
        print("❌ /sample-attack error:", e)
        # Return a 500 with the error message
        raise HTTPException(status_code=500, detail=str(e))