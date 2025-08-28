from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import razorpay
import os
from datetime import datetime, timedelta
from app.models.user_model import Payments, PaymentStatus, ProPlan, Users

from app.core.config import settings
from app.core.psql_connection import get_db

payment = APIRouter()


client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreatOrder(BaseModel):
    user_id: int
    plan: str


@payment.post("/create-order")
async def create_payment_order(data: CreatOrder):

    amount_plan_map = {
        "monthly": 29*100,
        "6month": 149*100
    }

    if data.plan not in amount_plan_map:
        raise HTTPException(status_code=400, detail="Invalid plan")

    order = client.order.create({
        "amount": amount_plan_map[data.plan],
        "currency": "INR",
        "payment_capture": 1
    })

    return {"order_id": order["id"], "amount": amount_plan_map[data.plan]}


@payment.post("/verify-payment")
async def verify_payment(request: Request, db: Session = Depends(get_db)):
    body = await request.json()

    order_id = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature = body.get("razorpay_signature")
    user_id = body.get("user_id")
    plan = body.get("plan")

    if plan == "monthly":
        expiry_date = datetime.now() + timedelta(days=30)
        subscription_plan = ProPlan.monthly
        amount = 29
    else:
        expiry_date = datetime.now() + timedelta(days=180)
        subscription_plan = ProPlan.month6
        amount = 149

    new_payment = Payments(
        user_id=user_id,
        amount=amount,
        currency="INR",
        status=PaymentStatus.pending,
        plan=subscription_plan,
        expiry_date=expiry_date,
    )
    db.add(new_payment)
    db.flush()

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })
    except:

        new_payment.status = PaymentStatus.failed
        db.commit()
        raise HTTPException(
            status_code=400, detail="Payment verification failed")

    new_payment.status = PaymentStatus.success

    user = db.query(Users).filter(Users.id == user_id).first()
    if user:
        user.is_pro = True
        user.pro_expiry = expiry_date

    db.commit()

    return {
        "status": "success",
        "expiry_date": expiry_date,
        "user_id": user_id
    }
