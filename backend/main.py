from fastapi import FastAPI
from models import Base
from database import engine
from auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router, prefix="/auth")

@app.get("/")
def root():
    return {"message": "TripSync API"}