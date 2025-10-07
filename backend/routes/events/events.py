from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
import sys
import os
import logging

# Add the parent directory to the path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from models import models
from schemas import schemas
from database import get_db
from datetime import datetime, timedelta
from typing import List, Optional

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events")

# Dependency to get current user ID from session
def get_current_user_id(request: Request) -> int:
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Extract user_id from session_id (format: session_{user_id})
        user_id = int(session_id.split("_")[1])
        return user_id
    except (ValueError, IndexError):
        raise HTTPException(status_code=401, detail="Invalid session")

@router.get("/list", response_model=List[schemas.EventOut])
def list_events(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get all events for the current user (legacy endpoint - use specific tab endpoints instead)"""
    return db.query(models.Event).filter(models.Event.user_id == current_user_id).all()

@router.get("/active", response_model=List[schemas.EventOut])
def get_active_events(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get active events (not expired, not archived)"""
    from datetime import datetime
    
    # Use local system time for consistency
    now = datetime.now()
    
    events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        (models.Event.archived.is_(None) | (models.Event.archived == False)),  # Not archived (NULL or False)
        models.Event.end_time >= now  # Not expired (end time is in the future)
    ).order_by(models.Event.start_time.asc()).all()
    
    return events

@router.get("/expired", response_model=List[schemas.EventOut])
def get_expired_events(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get expired events (past end time, not archived)"""
    from datetime import datetime
    
    # Use local system time for consistency
    now = datetime.now()
    
    events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        (models.Event.archived.is_(None) | (models.Event.archived == False)),  # Not archived (NULL or False)
        models.Event.end_time < now  # Expired (end time is in the past)
    ).order_by(models.Event.start_time.desc()).all()
    
    return events

@router.get("/archived", response_model=List[schemas.EventOut])
def get_archived_events(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get archived events"""
    events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        models.Event.archived == True  # Archived events only
    ).order_by(models.Event.archived_at.desc()).all()
    
    return events

@router.get("/all", response_model=List[schemas.EventOut])
def get_all_events(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get all events regardless of status"""
    events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id
    ).order_by(models.Event.start_time.desc()).all()
    
    return events

@router.post("/{event_id}/archive")
def archive_event(event_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Archive an event"""
    from datetime import datetime
    
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.archived = True
    event.archived_at = datetime.now()
    
    db.commit()
    db.refresh(event)
    
    return {"message": "Event archived successfully"}

@router.post("/{event_id}/unarchive")
def unarchive_event(event_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Unarchive an event"""
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.archived = False
    event.archived_at = None
    
    db.commit()
    db.refresh(event)
    
    return {"message": "Event unarchived successfully"}

@router.get("/stats")
def get_event_stats(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get event statistics for the current user"""
    from datetime import datetime
    
    now = datetime.now()
    
    # Total events
    total_events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id
    ).count()
    
    # Active events (not expired, not archived)
    active_events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        (models.Event.archived.is_(None) | (models.Event.archived == False)),  # Not archived (NULL or False)
        models.Event.end_time >= now
    ).count()
    
    # Expired events (past end time, not archived)
    expired_events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        (models.Event.archived.is_(None) | (models.Event.archived == False)),  # Not archived (NULL or False)
        models.Event.end_time < now
    ).count()
    
    # Archived events
    archived_events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        models.Event.archived == True
    ).count()
    
    # Upcoming events (next 7 days)
    from datetime import timedelta
    week_from_now = now + timedelta(days=7)
    upcoming_events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id,
        (models.Event.archived.is_(None) | (models.Event.archived == False)),  # Not archived (NULL or False)
        models.Event.start_time >= now,
        models.Event.start_time <= week_from_now
    ).count()
    
    return {
        "total": total_events,
        "active": active_events,
        "expired": expired_events,
        "archived": archived_events,
        "upcoming": upcoming_events
    }


@router.post("/create", response_model=schemas.EventOut)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    from datetime import datetime, timezone
    
    # Convert UTC times to local time for consistency with other modules
    def convert_to_local(utc_time):
        if utc_time.tzinfo is None:
            # If no timezone info, assume it's already local
            return utc_time
        elif utc_time.tzinfo == timezone.utc:
            # Convert UTC to local
            return utc_time.astimezone().replace(tzinfo=None)
        else:
            # Already local time
            return utc_time.replace(tzinfo=None)
    
    event = models.Event(
        title=payload.title,
        description=payload.description,
        start_time=convert_to_local(payload.start_time),
        end_time=convert_to_local(payload.end_time),
        user_id=current_user_id,  # Use current user's ID instead of payload.user_id
        repeat=payload.repeat,
        category=payload.category,
        linked_task=payload.linked_task,
        archived=False,  # Default to not archived
        created_at=datetime.now(),  # Set creation time
        updated_at=datetime.now(),  # Set update time
        needs_google_sync=True,  # Mark for Google Calendar sync
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/get/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/update/{event_id}", response_model=schemas.EventOut)
def update_event(event_id: int, payload: schemas.EventUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    from datetime import datetime, timezone
    
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Convert UTC times to local time for consistency
    def convert_to_local(utc_time):
        if utc_time is None:
            return None
        if utc_time.tzinfo is None:
            # If no timezone info, assume it's already local
            return utc_time
        elif utc_time.tzinfo == timezone.utc:
            # Convert UTC to local
            return utc_time.astimezone().replace(tzinfo=None)
        else:
            # Already local time
            return utc_time.replace(tzinfo=None)

    update_data = payload.dict(exclude_unset=True)
    
    # Convert time fields to local time if they exist
    if 'start_time' in update_data:
        update_data['start_time'] = convert_to_local(update_data['start_time'])
    if 'end_time' in update_data:
        update_data['end_time'] = convert_to_local(update_data['end_time'])
    
    for key, value in update_data.items():
        setattr(event, key, value)
    
    # Update the updated_at timestamp
    event.updated_at = datetime.now()
    
    # Mark for Google Calendar sync if event was previously synced
    if event.google_event_id:
        event.needs_google_sync = True

    db.commit()
    db.refresh(event)
    return event


@router.delete("/delete/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Delete an event - marks for Google sync if it was synced"""
    from datetime import datetime
    
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # If event was synced to Google Calendar, mark for deletion sync instead of immediate deletion
    if event.google_event_id:
        logger.info(f"Event '{event.title}' was synced to Google Calendar, marking for deletion sync")
        event.is_deleted = True
        event.deleted_at = datetime.now()
        event.needs_google_sync = True
        db.commit()
        return {"message": "Event marked for deletion and will be removed from Google Calendar"}
    else:
        # Event was never synced, delete immediately
        db.delete(event)
        db.commit()
        return {"message": "Event deleted successfully"}



