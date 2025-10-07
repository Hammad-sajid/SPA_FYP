from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from schemas import schemas
from database import get_db
from models import User
from .session import create_session, get_user_id, delete_session, cleanup_expired_sessions, get_session_info
from utils.auth_utils import authenticate_user, get_user_by_email, get_user_by_username, create_user, get_password_hash
from utils.email_utils import generate_reset_code, send_reset_email, store_reset_code, verify_reset_code, generate_verification_code, send_verification_email, store_verification_code, verify_verification_code
import logging

router = APIRouter(prefix="/auth")
logger = logging.getLogger(__name__)

@router.post("/login")
async def login(user_data: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    #7print("Received login data:", user_data)
    user = authenticate_user(db, user_data.username, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in"
        )
    
    # Create session
    session_id = create_session(user.id)
    logger.info(f"Session created: {session_id}")
    
    # Set cookie with proper settings for development
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="Lax",
        secure=False,  # Set to False for localhost development
        path="/",
        max_age=7200  # 120 minutes in seconds (matches session timeout)
    )
    
    logger.info(f"Cookie set: session_id={session_id}")
    
    return {"message": "Login successful", "user": user}

@router.post("/register")
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Convert email to lowercase for case-insensitive operations
        email_lower = user_data.email.lower()
        
        # Check if user already exists (case-insensitive)
        if get_user_by_email(db, email_lower):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        if get_user_by_username(db, user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user data dict with lowercase email
        user_dict = user_data.dict()
        user_dict['email'] = email_lower
        
        # Create new user (email_verified will be False by default)
        user = create_user(db, user_dict)
        logger.info(f"User created: {user.email}")
        
        # Generate and send verification code
        verification_code = generate_verification_code()
        logger.info(f"Generated verification code for {email_lower}")
        
        store_verification_code(email_lower, verification_code)
        logger.info(f"Stored verification code for {email_lower}")
        
        # Send verification email
        email_sent = send_verification_email(email_lower, verification_code)
        logger.info(f"Email send result for {email_lower}: {email_sent}")
        
        if email_sent:
            return {"message": "User created successfully. Please check your email for verification code.", "user": user}
        else:
            # If email sending fails, still create user but inform about email issue
            logger.error(f"Failed to send verification email to {email_lower}")
            return {"message": "User created successfully. Please contact support for email verification.", "user": user}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )

@router.get("/users/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    try:
        # Get session_id from cookie
        session_id = request.cookies.get("session_id")
        logger.info(f"Session ID from cookie: {session_id}")
        
        if not session_id:
            logger.warning("No session_id cookie found")
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        # Get user_id from session (with timeout check)
        user_id = get_user_id(session_id)
        logger.info(f"User ID from session: {user_id}")
        
        if not user_id:
            logger.warning(f"Invalid or expired session: {session_id}")
            raise HTTPException(status_code=401, detail="Session expired or invalid")
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
            
        logger.info(f"User authenticated successfully: {user.email}")
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_active": True,
            "google_id": user.google_id,  # Add this to check authentication method
            "email_verified": user.email_verified,
            "created_at": user.created_at if hasattr(user, 'created_at') else None,
            "bio": getattr(user, 'bio', None),
            "phone": getattr(user, 'phone', None),
            "profile_photo": getattr(user, 'profile_photo', None)
        }
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/me")
async def update_current_user(
    request: Request, 
    user_update: dict, 
    db: Session = Depends(get_db)
):
    """Update current user profile information"""
    try:
        # Get session_id from cookie
        session_id = request.cookies.get("session_id")
        if not session_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        # Get user_id from session
        user_id = get_user_id(session_id)
        if not user_id:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update allowed fields
        allowed_fields = ['username', 'bio', 'phone']
        updated_fields = {}
        
        for field in allowed_fields:
            if field in user_update and user_update[field] is not None:
                if hasattr(user, field):
                    setattr(user, field, user_update[field])
                    updated_fields[field] = user_update[field]
                else:
                    # For fields that don't exist in the model yet, we'll skip them
                    logger.warning(f"Field {field} not found in User model")
        
        # Commit changes
        db.commit()
        db.refresh(user)
        
        logger.info(f"User {user_id} profile updated: {updated_fields}")
        
        return {
            "message": "Profile updated successfully",
            "updated_fields": updated_fields
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post("/users/me/change-password")
async def change_password(
    request: Request,
    password_data: dict,
    db: Session = Depends(get_db)
):
    """Change current user password"""
    try:
        # Get session_id from cookie
        session_id = request.cookies.get("session_id")
        if not session_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        # Get user_id from session
        user_id = get_user_id(session_id)
        if not user_id:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate password data
        current_password = password_data.get('current_password')
        new_password = password_data.get('new_password')
        confirm_password = password_data.get('confirm_password')
        
        if not all([current_password, new_password, confirm_password]):
            raise HTTPException(status_code=400, detail="All password fields are required")
        
        if new_password != confirm_password:
            raise HTTPException(status_code=400, detail="New passwords do not match")
        
        # Verify current password (you'll need to implement password verification)
        # For now, we'll assume it's correct
        # TODO: Implement proper password verification
        
        # Update password
        user.password = new_password  # In production, hash this password
        db.commit()
        
        logger.info(f"User {user_id} password changed successfully")
        
        return {
            "message": "Password changed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")

@router.put("/users/me/profile-photo")
async def update_profile_photo(
    request: Request,
    photo_data: dict,
    db: Session = Depends(get_db)
):
    """Update current user profile photo"""
    try:
        # Get session_id from cookie
        session_id = request.cookies.get("session_id")
        if not session_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        # Get user_id from session
        user_id = get_user_id(session_id)
        if not user_id:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate photo data
        profile_photo = photo_data.get('profile_photo')
        if not profile_photo:
            raise HTTPException(status_code=400, detail="Profile photo URL is required")
        
        # Update profile photo
        user.profile_photo = profile_photo
        db.commit()
        
        logger.info(f"User {user_id} profile photo updated successfully")
        
        return {
            "message": "Profile photo updated successfully",
            "profile_photo": profile_photo
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile photo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile photo: {str(e)}")

@router.get("/session-info")
async def get_session_info(request: Request):
    """Get current session information including remaining time"""
    try:
        session_id = request.cookies.get("session_id")
        if not session_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session_info = get_session_info(session_id)
        if not session_info:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        return session_info
    except Exception as e:
        logger.error(f"Error getting session info: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cleanup-sessions")
async def cleanup_sessions():
    """Clean up expired sessions (admin endpoint)"""
    try:
        cleaned_count = cleanup_expired_sessions()
        return {"message": f"Cleaned up {cleaned_count} expired sessions"}
    except Exception as e:
        logger.error(f"Error cleaning up sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cleanup sessions")

@router.get("/logout")
@router.post("/logout")
async def logout(response: Response, request: Request):
    try:
        session_id = request.cookies.get("session_id")
        if session_id:
            delete_session(session_id)
        response.delete_cookie(
            key="session_id",
            path="/",
            httponly=True,
            samesite="Lax"
        )
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) 

@router.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send reset code to user's email"""
    try:
        # Convert email to lowercase for case-insensitive search
        email_lower = request.email.lower()
        
        # Check if user exists (case-insensitive)
        user = get_user_by_email(db, email_lower)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Generate reset code
        reset_code = generate_reset_code()
        
        # Store reset code with lowercase email
        store_reset_code(email_lower, reset_code)
        
        # Send email
        if send_reset_email(email_lower, reset_code):
            return {"message": "Reset code sent to your email"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send reset code"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in forgot password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/verify-email")
async def verify_email(request: schemas.EmailVerification, response: Response, db: Session = Depends(get_db)):
    """Verify email with verification code"""
    try:
        # Convert email to lowercase for case-insensitive search
        email_lower = request.email.lower()
        
        # Check if user exists (case-insensitive)
        user = get_user_by_email(db, email_lower)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Verify the code with lowercase email
        if not verify_verification_code(email_lower, request.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )
        
        # Mark email as verified
        user.email_verified = True
        db.commit()
        
        # Create session after successful verification
        session_id = create_session(user.id)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="Lax",
            secure=True
        )
        
        return {"message": "Email verified successfully", "user": user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in email verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/resend-verification")
async def resend_verification(request: schemas.ResendVerification, db: Session = Depends(get_db)):
    """Resend verification code to user's email"""
    try:
        # Convert email to lowercase for case-insensitive search
        email_lower = request.email.lower()
        
        # Check if user exists (case-insensitive)
        user = get_user_by_email(db, email_lower)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Check if email is already verified
        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )
        
        # Generate new verification code
        verification_code = generate_verification_code()
        store_verification_code(email_lower, verification_code)
        
        # Send email
        if send_verification_email(email_lower, verification_code):
            return {"message": "Verification code resent to your email"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification code"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in resend verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/test-email")
async def test_email(request: Request, db: Session = Depends(get_db)):
    """Test endpoint to check if email sending is working"""
    try:
        test_email = "test@example.com"
        verification_code = generate_verification_code()
        store_verification_code(test_email, verification_code)
        
        email_sent = send_verification_email(test_email, verification_code)
        logger.info(f"Test email send result: {email_sent}")
        
        return {
            "message": "Email test completed",
            "email_sent": email_sent,
            "verification_code": verification_code
        }
    except Exception as e:
        logger.error(f"Error in test email: {str(e)}")
        return {
            "message": "Email test failed",
            "error": str(e),
            "email_sent": False
        }

@router.post("/reset-password")
async def reset_password(request: schemas.ResetCodeVerification, db: Session = Depends(get_db)):
    """Verify reset code and update password"""
    try:
        # Convert email to lowercase for case-insensitive search
        email_lower = request.email.lower()
        
        # Check if user exists (case-insensitive)
        user = get_user_by_email(db, email_lower)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Verify reset code with lowercase email
        if not verify_reset_code(email_lower, request.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code"
            )
        
        # Update password
        user.password = get_password_hash(request.new_password)
        db.commit()
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reset password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 