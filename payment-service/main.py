"""
PayStream Payment Service
FastAPI microservice handling payment creation and retrieval.
"""
from fastapi import FastAPI, HTTPException
# BUG-01: CORSMiddleware is imported but never added to the app.
# When the browser calls this API from a different origin (e.g. Vite dev server
# on localhost:5173 calling localhost:8000), all requests will be blocked with:
# "Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173'
#  has been blocked by CORS policy"
# Fix: add app.add_middleware(CORSMiddleware, ...) — see Solutions section.
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel
from typing import Optional, List
import uuid, time, httpx, os
from datetime import datetime


app = FastAPI(title="PayStream Payment Service", version="1.0.0")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"]
# )


# ── Prometheus metrics ────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "paystream_payment_requests_total",
    "Total payment API requests",
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "paystream_payment_duration_seconds",
    "Payment request latency in seconds",
    ["endpoint"]
)
PAYMENT_AMOUNT = Histogram(
    "paystream_payment_amount",
    "Payment amounts",
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000, 500000]
)


# ── In-memory data store (demo) ───────────────────────────────────────
payments: list = []


NOTIFICATION_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:3005")


# ── Models ────────────────────────────────────────────────────────────
class PaymentRequest(BaseModel):
    recipient: str
    amount: float
    currency: str = "NGN"
    description: Optional[str] = None


class PaymentRecord(BaseModel):
    id: str
    recipient: str
    amount: float
    currency: str
    description: Optional[str]
    status: str
    created_at: str


# ── Routes ────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "service": "payment-service", "version": "1.0.0"}


@app.get("/metrics")
def metrics():
    REQUEST_COUNT.labels(method="GET", endpoint="/metrics", status="200").inc()
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/api/v1/payments", response_model=PaymentRecord, status_code=201)
def create_payment(payment: PaymentRequest):
    start = time.time()
    record = {
        "id": str(uuid.uuid4()),
        "recipient": payment.recipient,
        "amount": payment.amount,
        "currency": payment.currency,
        "description": payment.description,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    payments.append(record)
    PAYMENT_AMOUNT.observe(payment.amount)
    REQUEST_COUNT.labels(method="POST", endpoint="/api/v1/payments", status="201").inc()
    REQUEST_LATENCY.labels(endpoint="/api/v1/payments").observe(time.time() - start)


    # Notify the notification service (fire-and-forget)
    try:
        httpx.post(
            f"{NOTIFICATION_URL}/api/v1/notifications",
            json={
                "payment_id": record["id"],
                "recipient":  payment.recipient,
                "amount":     payment.amount,
                "currency":   payment.currency
            },
            timeout=2.0
        )
    except Exception:
        pass  # Never fail a payment because notifications are down


    return record


@app.get("/api/v1/payments", response_model=List[PaymentRecord])
def list_payments():
    REQUEST_COUNT.labels(method="GET", endpoint="/api/v1/payments", status="200").inc()
    return payments


@app.get("/api/v1/payments/{payment_id}", response_model=PaymentRecord)
def get_payment(payment_id: str):
    for p in payments:
        if p["id"] == payment_id:
            return p
    raise HTTPException(status_code=404, detail="Payment not found")
