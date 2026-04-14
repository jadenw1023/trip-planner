from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Base
from database import engine
from auth import router as auth_router
from trips import router as trips_router
from activities import router as activities_router
from budget import router as budget_router
from socket_manager import sio
import socketio
from ai import router as ai_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(trips_router, prefix="/trips")
app.include_router(activities_router, prefix="/trips")
app.include_router(budget_router, prefix="/trips")
app.include_router(ai_router, prefix="/trips")

@app.get("/")
def root():
    return {"message": "TripSync API"}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_trip(sid, data):
    trip_id = data.get("trip_id")
    sio.enter_room(sid, trip_id)
    print(f"Client {sid} joined trip room: {trip_id}")

@sio.event
async def leave_trip(sid, data):
    trip_id = data.get("trip_id")
    sio.leave_room(sid, trip_id)
    print(f"Client {sid} left trip room: {trip_id}")

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)