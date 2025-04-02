from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
from typing import Optional

app = FastAPI()

# Load Classifier
try:
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    classifier = None

# Petition Categories (aligned with your schema)
CATEGORIES = [
    "Environment", "Justice", "Health", "Education", "Housing",
    "Transportation", "Labor", "Energy", "Agriculture", "Finance",
    "Public Safety", "Social Welfare", "Water Resources", "Communications", 
    "Consumer Affairs"
]

# Input Models
class PetitionBase(BaseModel):
    title: str
    description: str
    priority: Optional[str] = "medium"
    status: Optional[str] = "new"
    # Other fields can be added as needed

class ClassificationResult(BaseModel):
    petition: PetitionBase
    predicted_category: str
    confidence: float
    all_scores: dict

# Health Check Endpoint
@app.get("/health")
async def health_check():
    if classifier is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    return {
        "status": "ok",
        "model": "facebook/bart-large-mnli",
        "categories": CATEGORIES
    }

# Classification Endpoint
@app.post("/classify", response_model=ClassificationResult)
async def classify_petition(petition: PetitionBase):
    if classifier is None:
        raise HTTPException(status_code=500, detail="Model is not available.")
    
    try:
        # Combine title and description for better classification
        text_to_classify = f"{petition.title}. {petition.description}"
        
        # Get classification results
        result = classifier(text_to_classify, CATEGORIES)
        
        # Prepare the response
        best_category = result['labels'][0]
        confidence = result['scores'][0]
        all_scores = dict(zip(result['labels'], result['scores']))
        
        return {
            "petition": petition,
            "predicted_category": best_category,
            "confidence": confidence,
            "all_scores": all_scores
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run using: uvicorn main:app --reload