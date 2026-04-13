from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Activity, Vote, Trip, TripMember, User
from dependencies import get_current_user
from pydantic import BaseModel
from socket_manager import sio
import asyncio

router = APIRouter()

class AddActivityRequest(BaseModel):
    name: str
    description: str = ""
    location: str = ""
    date: str = ""
    time: str = ""
    category: str = ""

class VoteRequest(BaseModel):
    value: int

# Add an activity to a trip
@router.post("/{trip_id}/activities")
def add_activity(
    trip_id: str,
    data: AddActivityRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this trip")

    activity = Activity(
        trip_id=trip_id,
        name=data.name,
        description=data.description,
        location=data.location,
        date=data.date,
        time=data.time,
        category=data.category,
        added_by=user.id,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    # Broadcast to everyone in the trip room
    asyncio.run(sio.emit("activity_added", {
        "id": activity.id,
        "name": activity.name,
        "description": activity.description,
        "location": activity.location,
        "date": activity.date,
        "category": activity.category,
    }, room=trip_id))

    return {
        "id": activity.id,
        "name": activity.name,
        "description": activity.description,
        "location": activity.location,
        "date": activity.date,
        "category": activity.category,
    }

# Get all activities for a trip
@router.get("/{trip_id}/activities")
def get_activities(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this trip")

    activities = db.query(Activity).filter(Activity.trip_id == trip_id).all()

    return [
        {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "location": a.location,
            "date": a.date,
            "category": a.category,
            "votes": sum(v.value for v in a.votes),
        }
        for a in activities
    ]

# Vote on an activity
@router.post("/{trip_id}/activities/{activity_id}/vote")
def vote_on_activity(
    trip_id: str,
    activity_id: str,
    data: VoteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this trip")

    existing_vote = db.query(Vote).filter(
        Vote.activity_id == activity_id,
        Vote.user_id == user.id
    ).first()
    if existing_vote:
        existing_vote.value = data.value
        db.commit()
        return {"message": "Vote updated"}
    
    # Broadcast vote update
    total_votes = sum(v.value for v in db.query(Vote).filter(Vote.activity_id == activity_id).all())
    asyncio.run(sio.emit("vote_updated", {
        "activity_id": activity_id,
        "total_votes": total_votes,
    }, room=trip_id))

    vote = Vote(
        activity_id=activity_id,
        user_id=user.id,
        value=data.value,
    )
    db.add(vote)
    db.commit()

    return {"message": "Vote recorded"}