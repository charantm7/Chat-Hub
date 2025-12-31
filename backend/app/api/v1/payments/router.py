from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import razorpay

from app.core.config import settings

payment = APIRouter()


client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
