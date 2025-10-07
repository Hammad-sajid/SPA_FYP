# backend/main.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models.models import Base
from routes import api_router
import asyncio
import logging

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Background task to clean up expired sessions
async def cleanup_expired_sessions():
    """Periodically clean up expired sessions"""
    from routes.auth.session import cleanup_expired_sessions
    while True:
        try:
            cleaned_count = cleanup_expired_sessions()
            if cleaned_count > 0:
                logging.info(f"Cleaned up {cleaned_count} expired sessions")
        except Exception as e:
            logging.error(f"Error cleaning up sessions: {e}")
        
        # Wait 5 minutes before next cleanup
        await asyncio.sleep(300)

@app.on_event("startup")
async def startup_event():
    """Start background tasks on startup"""
    asyncio.create_task(cleanup_expired_sessions())
