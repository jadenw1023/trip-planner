from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

def generate_invite_code():
    return str(uuid.uuid4())[:8]

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("TripMember", back_populates="user")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    start_date = Column(String)
    end_date = Column(String)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    invite_code = Column(String, unique=True, default=generate_invite_code)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("TripMember", back_populates="trip")
    activities = relationship("Activity", back_populates="trip")
    budget_items = relationship("BudgetItem", back_populates="trip")

class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False)
    role = Column(String, default="member")
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="trips")
    trip = relationship("Trip", back_populates="members")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=generate_uuid)
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    location = Column(String)
    date = Column(String)
    time = Column(String)
    category = Column(String)
    added_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="activities")
    votes = relationship("Vote", back_populates="activity")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(String, primary_key=True, default=generate_uuid)
    activity_id = Column(String, ForeignKey("activities.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    value = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    activity = relationship("Activity", back_populates="votes")

class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="budget_items")