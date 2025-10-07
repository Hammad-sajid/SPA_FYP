import logging

logger = logging.getLogger(__name__)

from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from database import get_db

def create_session(user_id: int) -> str:
    """Create a new session in the database"""
    from models import models
    
    db = next(get_db())
    
    session_id = f"session_{user_id}_{int(datetime.now().timestamp())}"
    
    new_session = models.Session(
        id=session_id,
        user_id=user_id,
        created_at=datetime.now(),
        last_activity=datetime.now()
    )
    
    db.add(new_session)
    db.commit()
    
    logger.info(f"Session created for user {user_id}: {session_id}")
    return session_id

def get_user_id(session_id: str) -> int:
    """Get user ID from session in database"""
    from models import models
    
    logger.info(f"Getting user ID for session: {session_id}")
    
    db = next(get_db())
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    
    if not session:
        logger.warning(f"Session not found: {session_id}")
        return None
    
    logger.info(f"Session data: {session.id}, user: {session.user_id}")
    
    # Check if session has expired
    if is_session_expired(session):
        logger.warning(f"Session expired: {session_id}")
        delete_session(session_id)
        return None
    
    # Update last activity
    try:
        session.last_activity = datetime.now()
        db.commit()
        logger.info(f"Session activity updated for: {session_id}")
    except Exception as e:
        logger.error(f"Error updating session activity: {str(e)}")
        # Don't fail the request just because we can't update activity
    
    return session.user_id

def is_session_expired(session) -> bool:
    """Check if session has expired due to inactivity"""
    last_activity = session.last_activity
    created_at = session.created_at
    current_time = datetime.now()
    
    # Ensure session has a minimum lifetime (10 minutes) before checking inactivity
    min_lifetime = created_at + timedelta(minutes=10)
    if current_time < min_lifetime:
        logger.info(f"Session {session.user_id} is within minimum lifetime, not expired")
        return False
    
    # Use a more generous timeout (120 minutes instead of 45)
    timeout_threshold = current_time - timedelta(minutes=120)
    
    # Add debugging
    logger.info(f"Session check - Last activity: {last_activity}")
    logger.info(f"Session check - Created at: {created_at}")
    logger.info(f"Session check - Current time: {current_time}")
    logger.info(f"Session check - Min lifetime threshold: {min_lifetime}")
    logger.info(f"Session check - Timeout threshold: {timeout_threshold}")
    logger.info(f"Session check - Is expired: {last_activity < timeout_threshold}")
    
    return last_activity < timeout_threshold

def delete_session(session_id: str):
    """Delete session from database"""
    from models import models
    
    db = next(get_db())
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
        logger.info(f"Session deleted: {session_id}")

def cleanup_expired_sessions():
    """Remove all expired sessions from database"""
    from models import models
    
    db = next(get_db())
    expired_sessions = []
    
    for session in db.query(models.Session).all():
        if is_session_expired(session):
            expired_sessions.append(session.id)
    
    for session_id in expired_sessions:
        delete_session(session_id)
    
    logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
    return len(expired_sessions)

def get_session_info(session_id: str) -> dict:
    """Get session information including remaining time"""
    from models import models
    
    db = next(get_db())
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    
    if not session:
        return None
    
    last_activity = session.last_activity
    timeout_threshold = last_activity + timedelta(minutes=120)
    remaining_time = (timeout_threshold - datetime.now()).total_seconds()
    
    return {
        "user_id": session.user_id,
        "created_at": session.created_at,
        "last_activity": last_activity,
        "remaining_time_seconds": max(0, remaining_time),
        "is_expired": remaining_time <= 0
    } 