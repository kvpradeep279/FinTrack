import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.middleware.correlation_id import CorrelationIdMiddleware
from app.routes.expenses import router as expenses_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified — environment=%s", settings.ENVIRONMENT)
    yield
    logger.info("Application shutdown complete")


app = FastAPI(
    title="Expense Tracker API",
    description=(
        "Production-grade personal expense tracking API. "
        "Supports idempotent writes, category filtering, date sorting, and CSV export."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware — CorrelationId must be outermost so all downstream logs include request_id
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

app.include_router(expenses_router)


@app.get("/health", tags=["ops"], summary="Health check")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception("Unhandled error request_id=%s", request_id)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": request_id},
    )
