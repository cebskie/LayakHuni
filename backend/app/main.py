from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    print("✅ LayakHuni API started")
    yield
    print("LayakHuni API shutting down")


app = FastAPI(
    title="LayakHuni API",
    description="Real Estate E-Commerce Platform with AI Document Processing & Intelligent Geotagging",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={"tryItOutEnabled": True},
)

# CORS — allow all origins in dev; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers — import here to avoid circular import issues at module load
from app.routers import auth, properties, admin  # noqa: E402

app.include_router(auth.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Static files for uploads (mounted after dir is guaranteed to exist)
uploads_dir = os.path.abspath("uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "LayakHuni API is running 🚀",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
