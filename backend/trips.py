from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Trip, TripMember, User
from dependencies import get_current_user
from pydantic import BaseModel
from models import Trip, TripMember, User, Activity, Vote, BudgetItem

router = APIRouter()

class CreateTripRequest(BaseModel):
    name: str
    destination: str
    start_date: str
    end_date: str

# Create a trip
@router.post("/")
def create_trip(
    data: CreateTripRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = Trip(
        name=data.name,
        destination=data.destination,
        start_date=data.start_date,
        end_date=data.end_date,
        created_by=user.id,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    member = TripMember(
        user_id=user.id,
        trip_id=trip.id,
        role="creator",
    )
    db.add(member)
    db.commit()

    return {
        "id": trip.id,
        "name": trip.name,
        "destination": trip.destination,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "invite_code": trip.invite_code,
    }

# Join a trip via invite code
@router.post("/join/{invite_code}")
def join_trip(
    invite_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.invite_code == invite_code).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    existing = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this trip")

    member = TripMember(
        user_id=user.id,
        trip_id=trip.id,
        role="member",
    )
    db.add(member)
    db.commit()

    return {
        "message": "Joined trip successfully",
        "trip": {
            "id": trip.id,
            "name": trip.name,
            "destination": trip.destination,
        }
    }

# Get trip details
@router.get("/{trip_id}")
def get_trip(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    membership = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this trip")

    members = db.query(TripMember).filter(TripMember.trip_id == trip.id).all()
    member_list = []
    for m in members:
        member_user = db.query(User).filter(User.id == m.user_id).first()
        member_list.append({
            "id": member_user.id,
            "name": member_user.name,
            "role": m.role,
        })

    return {
        "id": trip.id,
        "name": trip.name,
        "destination": trip.destination,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "invite_code": trip.invite_code,
        "members": member_list,
    }

@router.get("/")
def get_my_trips(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(TripMember).filter(TripMember.user_id == user.id).all()
    trips = []
    for m in memberships:
        trip = db.query(Trip).filter(Trip.id == m.trip_id).first()
        if trip:
            trips.append({
                "id": trip.id,
                "name": trip.name,
                "destination": trip.destination,
                "start_date": trip.start_date,
                "end_date": trip.end_date,
                "role": m.role,
            })
    return trips

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.created_by != user.id:
        raise HTTPException(status_code=403, detail="Only the trip creator can delete this trip")

    activities = db.query(Activity).filter(Activity.trip_id == trip_id).all()
    for activity in activities:
        db.query(Vote).filter(Vote.activity_id == activity.id).delete()
    db.query(Activity).filter(Activity.trip_id == trip_id).delete()
    db.query(BudgetItem).filter(BudgetItem.trip_id == trip_id).delete()
    db.query(TripMember).filter(TripMember.trip_id == trip_id).delete()
    db.delete(trip)
    db.commit()

    return {"message": "Trip deleted"}
    
    return trips