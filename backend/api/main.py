"""
Pi Shield API - Production FastAPI Backend
Handles authentication, file uploads, job orchestration, and analysis results
"""

import os
import uuid
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

import redis.asyncio as redis
import structlog
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from google.cloud import storage
from passlib.context import CryptContext
from jose import JWTError, jwt
import asyncpg
from prometheus_client import Counter, Histogram, generate_latest
import time

# Configure structured logging
logger = structlog.get_logger()

# Metrics
REQUEST_COUNT = Counter('pishield_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('pishield_request_duration_seconds', 'Request duration')

# Configuration
class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/pishield")
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Google Cloud
    GCS_BUCKET = os.getenv("GCS_BUCKET", "pi-shield-uploads")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # File limits
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "50")) * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {
        'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'video': ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        'text': ['txt', 'md', 'json']
    }

config = Config()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    created_at: datetime
    credibility_score: Optional[float] = None
    explanation: Optional[dict] = None
    artifacts: Optional[dict] = None

class User(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"

# Global connections
redis_client: Optional[redis.Redis] = None
db_pool: Optional[asyncpg.Pool] = None
storage_client: Optional[storage.Client] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global redis_client, db_pool, storage_client
    
    # Initialize Redis
    redis_client = redis.from_url(config.REDIS_URL)
    
    # Initialize Database Pool
    db_pool = await asyncpg.create_pool(config.DATABASE_URL, min_size=5, max_size=20)
    
    # Initialize Google Cloud Storage
    storage_client = storage.Client()
    
    logger.info("Pi Shield API started successfully")
    
    yield
    
    # Cleanup
    if redis_client:
        await redis_client.close()
    if db_pool:
        await db_pool.close()
    
    logger.info("Pi Shield API shutdown complete")

# FastAPI app
app = FastAPI(
    title="Pi Shield API",
    description="AI-Powered Misinformation Detection Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for metrics and logging
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info("Request started", 
                method=request.method, 
                url=str(request.url),
                user_agent=request.headers.get("user-agent"))
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_DURATION.observe(duration)
    
    # Log response
    logger.info("Request completed",
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                duration=duration)
    
    return response

# Utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    async with db_pool.acquire() as conn:
        user_record = await conn.fetchrow(
            "SELECT id, email, full_name, role FROM users WHERE id = $1", 
            uuid.UUID(user_id)
        )
    
    if user_record is None:
        raise credentials_exception
    
    return User(
        id=str(user_record['id']),
        email=user_record['email'],
        full_name=user_record['full_name'],
        role=user_record['role']
    )

def validate_file(file: UploadFile) -> str:
    """Validate uploaded file and return media type"""
    if file.size and file.size > config.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    extension = file.filename.lower().split('.')[-1]
    
    for media_type, extensions in config.ALLOWED_EXTENSIONS.items():
        if extension in extensions:
            return media_type
    
    raise HTTPException(status_code=400, detail="Unsupported file type")

async def upload_to_gcs(file: UploadFile, dest_path: str) -> str:
    """Upload file to Google Cloud Storage"""
    try:
        bucket = storage_client.bucket(config.GCS_BUCKET)
        blob = bucket.blob(dest_path)
        
        # Upload file content
        file.file.seek(0)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        return f"gs://{config.GCS_BUCKET}/{dest_path}"
    except Exception as e:
        logger.error("GCS upload failed", error=str(e), dest_path=dest_path)
        raise HTTPException(status_code=500, detail="File upload failed")

# API Routes

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.post("/api/v1/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    """Create new user account"""
    hashed_password = get_password_hash(user.password)
    user_id = uuid.uuid4()
    
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO users (id, email, password_hash, full_name, created_at) 
                   VALUES ($1, $2, $3, $4, $5)""",
                user_id, user.email, hashed_password, user.full_name, datetime.utcnow()
            )
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_id)}, expires_delta=access_token_expires
    )
    
    logger.info("User created", user_id=str(user_id), email=user.email)
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/auth/login", response_model=Token)
async def login(user: UserLogin):
    """Authenticate user and return token"""
    async with db_pool.acquire() as conn:
        user_record = await conn.fetchrow(
            "SELECT id, password_hash FROM users WHERE email = $1", 
            user.email
        )
    
    if not user_record or not verify_password(user.password, user_record['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_record['id'])}, expires_delta=access_token_expires
    )
    
    logger.info("User logged in", user_id=str(user_record['id']), email=user.email)
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload file for analysis"""
    media_type = validate_file(file)
    analysis_id = str(uuid.uuid4())
    
    # Create destination path
    dest_path = f"{current_user.id}/{analysis_id}/{file.filename}"
    
    # Upload to GCS
    gcs_uri = await upload_to_gcs(file, dest_path)
    
    # Create analysis record
    async with db_pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO analyses (id, user_id, input_type, input_uri, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            uuid.UUID(analysis_id), uuid.UUID(current_user.id), media_type, 
            gcs_uri, "queued", datetime.utcnow()
        )
    
    # Enqueue job
    job = {
        "analysis_id": analysis_id,
        "user_id": current_user.id,
        "input_uri": gcs_uri,
        "input_type": media_type,
        "filename": file.filename,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await redis_client.rpush("pi_jobs", json.dumps(job))
    
    logger.info("Analysis queued", 
                analysis_id=analysis_id, 
                user_id=current_user.id,
                media_type=media_type)
    
    return {
        "analysis_id": analysis_id,
        "status": "queued",
        "message": "File uploaded successfully and queued for analysis"
    }

@app.get("/api/v1/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get analysis status and results"""
    try:
        analysis_uuid = uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID")
    
    async with db_pool.acquire() as conn:
        # Get analysis
        analysis = await conn.fetchrow(
            """SELECT a.*, ar.credibility_score, ar.explanation, ar.artifacts
               FROM analyses a
               LEFT JOIN analysis_reports ar ON a.id = ar.analysis_id
               WHERE a.id = $1 AND a.user_id = $2""",
            analysis_uuid, uuid.UUID(current_user.id)
        )
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return AnalysisResponse(
        analysis_id=str(analysis['id']),
        status=analysis['status'],
        created_at=analysis['created_at'],
        credibility_score=analysis['credibility_score'],
        explanation=analysis['explanation'],
        artifacts=analysis['artifacts']
    )

@app.get("/api/v1/history")
async def get_analysis_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get user's analysis history"""
    async with db_pool.acquire() as conn:
        analyses = await conn.fetch(
            """SELECT a.id, a.input_type, a.status, a.created_at, a.finished_at,
                      ar.credibility_score
               FROM analyses a
               LEFT JOIN analysis_reports ar ON a.id = ar.analysis_id
               WHERE a.user_id = $1
               ORDER BY a.created_at DESC
               LIMIT $2 OFFSET $3""",
            uuid.UUID(current_user.id), limit, offset
        )
    
    return {
        "analyses": [
            {
                "analysis_id": str(analysis['id']),
                "input_type": analysis['input_type'],
                "status": analysis['status'],
                "created_at": analysis['created_at'],
                "finished_at": analysis['finished_at'],
                "credibility_score": analysis['credibility_score']
            }
            for analysis in analyses
        ],
        "total": len(analyses),
        "limit": limit,
        "offset": offset
    }

@app.get("/api/v1/user/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)