from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from database import get_db
from models import User
from utils.auth_utils import get_password_hash, create_user, get_user_by_email
from config.google import google_config
from .session import create_session
import logging
from typing import Dict, Any

router = APIRouter(prefix="/auth")
logger = logging.getLogger(__name__)

@router.get("/google/config")
def get_google_auth_config():
    """Get Google OAuth configuration for frontend authentication (without sensitive data)"""
    if not google_config.is_auth_configured():
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    return {
        "client_id": google_config.GOOGLE_AUTH_CLIENT_ID,
        "auth_redirect_uri": google_config.GOOGLE_AUTH_REDIRECT_URI,
        "auth_scopes": google_config.GOOGLE_AUTH_SCOPES
    }

@router.post("/google")
async def google_auth(request: Request, user_data: Dict[str, Any], response: Response, db: Session = Depends(get_db)):
    try:
        # Log the raw request body
        body = await request.body()
        logger.info(f"Raw request body: {body.decode()}")
        
        # Log the parsed user data
        logger.info(f"Parsed user data: {user_data}")
        logger.info(f"User data type: {type(user_data)}")
        logger.info(f"User data keys: {user_data.keys()}")
        
        # Validate required fields
        required_fields = ['email', 'name', 'googleId']
        missing_fields = [field for field in required_fields if field not in user_data]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            logger.error(f"Available fields: {list(user_data.keys())}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Extract profile photo if available
        profile_photo = user_data.get('picture') or user_data.get('profile_photo')
        
        # Convert email to lowercase for case-insensitive operations
        email_lower = user_data['email'].lower()
        
        # Check if user exists with this email (case-insensitive)
        user = get_user_by_email(db, email_lower)
        
        if user:
            logger.info(f"Existing user found: {user.email}")
            # Update google_id if not set and mark email as verified for Google users
            if not user.google_id:
                user.google_id = user_data['googleId']
            # Mark email as verified for Google users (Google already verified the email)
            if not user.email_verified:
                user.email_verified = True
            # Update profile photo if available and not already set
            if profile_photo and not user.profile_photo:
                user.profile_photo = profile_photo
            db.commit()
            
            # Create session using the proper function
            session_id = create_session(user.id)
            response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                samesite="Lax",
                secure=False,  # Set to False for localhost development
                path="/",
                max_age=7200  # 120 minutes in seconds (matches session timeout)
            )
            logger.info(f"Google auth cookie set: session_id={session_id}")
            return {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_active": True,
                "profile_photo": user.profile_photo
            }
        else:
            logger.info(f"Creating new user for email: {email_lower}")
            # User doesn't exist, create new user with lowercase email
            random_password = get_password_hash(user_data['googleId'])
            
            new_user = User(
                email=email_lower,  # Store email in lowercase
                username=user_data['name'],
                password=random_password,
                google_id=user_data['googleId'],
                email_verified=True,  # Google users are pre-verified
                profile_photo=profile_photo  # Store Google profile photo
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            # Create session for new user
            session_id = f"session_{new_user.id}"
            response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                samesite="Lax",
                secure=False,  # Changed to False for localhost development
                path="/"  # Added path to ensure cookie is accessible everywhere
            )
            
            return {
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.username,
                "is_active": True,
                "profile_photo": new_user.profile_photo
            }
            
    except Exception as e:
        logger.error(f"Error in Google auth: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error args: {e.args}")
        raise HTTPException(status_code=400, detail=str(e)) 