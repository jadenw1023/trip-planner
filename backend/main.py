from fastapi import FastAPI
from models import Base
from database import engine
from auth import router as auth_router
from trips import router as trips_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router, prefix="/auth")
app.include_router(trips_router, prefix="/trips")

@app.get("/")
def root():
    return {"message": "TripSync API"}