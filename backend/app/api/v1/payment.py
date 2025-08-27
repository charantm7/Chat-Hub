from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import razorpay
import os
from datetime import datetime, timedelta

from app.core.config import settings

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
async def verify_payment(request: Request):
    body = await request.json()

    order_id = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature = body.get("razorpay_signature")
    user_id = body.get("user_id")
    plan = body.get("plan")

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })
    except:
        raise HTTPException(
            status_code=400, detail="Payment verification failed")

    if plan == "monthly":
        expiry_date = datetime.now() + timedelta(days=30)
    else:
        expiry_date = datetime.now() + timedelta(days=180)

    return {"status": "success", "expiry_date": expiry_date}
