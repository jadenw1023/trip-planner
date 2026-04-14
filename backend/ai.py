from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Trip, TripMember, Activity, BudgetItem, User
from dependencies import get_current_user
from pydantic import BaseModel
from openai import OpenAI
import os

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SuggestRequest(BaseModel):
    category: str = ""

@router.post("/{trip_id}/suggest")
def suggest_activities(
    trip_id: str,
    data: SuggestRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    membership = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this trip")

    activities = db.query(Activity).filter(Activity.trip_id == trip_id).all()
    existing = ", ".join([a.name for a in activities]) if activities else "none yet"

    category_text = f" focusing on {data.category}" if data.category else ""

    prompt = (
        f"Suggest 5 activities for a trip to {trip.destination}"
        f" from {trip.start_date} to {trip.end_date}."
        f"{category_text}."
        f" The group already has these activities planned: {existing}."
        f" Return each suggestion as a JSON array with objects containing"
        f" 'name', 'description', 'location', and 'category' fields."
        f" Return ONLY the JSON array, no other text."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a travel planning assistant. Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
        )
        suggestions = response.choices[0].message.content
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{trip_id}/summary")
def get_trip_summary(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    membership = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this trip")

    activities = db.query(Activity).filter(Activity.trip_id == trip_id).all()
    budget_items = db.query(BudgetItem).filter(BudgetItem.trip_id == trip_id).all()

    activity_list = "\n".join([f"- {a.name}: {a.description} (Category: {a.category})" for a in activities]) or "No activities planned yet."
    budget_list = "\n".join([f"- {b.name}: ${b.amount:.2f}" for b in budget_items]) or "No budget items added yet."
    prompt = (
        f"Summarize the following trip details:\n"
        f"Destination: {trip.destination}\n"
        f"Dates: {trip.start_date} to {trip.end_date}\n\n"
        f"Activities:\n{activity_list}\n\n"
        f"Budget:\n{budget_list}\n\n"
        f"Provide a concise summary highlighting the key points of the trip."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a travel planning assistant. Provide a concise summary of the trip details."},
                {"role": "user", "content": prompt},
            ],
        )
        summary = response.choices[0].message.content
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))