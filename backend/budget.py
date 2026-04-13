from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import BudgetItem, Trip, TripMember, User
from dependencies import get_current_user
from pydantic import BaseModel
from socket_manager import sio
import asyncio
router = APIRouter()

class AddBudgetItemRequest(BaseModel):
    name: str
    amount: float
    category: str = ""

@router.post("/{trip_id}/budget")
def add_budget_item(
    trip_id: str,
    data: AddBudgetItemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this trip")

    item = BudgetItem(
        trip_id=trip_id,
        name=data.name,
        amount=data.amount,
        paid_by=user.id,
    )
    db.add(item)
    db.commit()
    
    # Broadcast budget update
    all_items = db.query(BudgetItem).filter(BudgetItem.trip_id == trip_id).all()
    total = sum(i.amount for i in all_items)
    asyncio.run(sio.emit("budget_updated", {
        "item": {
            "id": item.id,
            "name": item.name,
            "amount": item.amount,
            "paid_by": user.name,
        },
        "total": total,
    }, room=trip_id))

    db.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "amount": item.amount,
        "paid_by": user.name,
    }

@router.get("/{trip_id}/budget")
def get_budget(
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

    items = db.query(BudgetItem).filter(BudgetItem.trip_id == trip_id).all()
    total = sum(item.amount for item in items)

    return {
        "total": total,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "amount": item.amount,
                "paid_by": item.paid_by,
            }
            for item in items
        ]
    }