from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time
import logging
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from database import get_db
from models import models
from schemas import schemas
from utils.ai_utils import get_health_recommendations
from routes.auth.session import get_user_id

router = APIRouter(prefix="/health")

# Dependency to get current user ID from session
def get_current_user_id(request: Request) -> int:
    """Extract user ID from session cookie"""
    session_id = request.cookies.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Use the proper session validation function
    user_id = get_user_id(session_id)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return user_id

# Health Records Endpoints
@router.post("/records", response_model=schemas.HealthRecordResponse)
async def create_health_record(
    record: schemas.HealthRecordCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new health record for the current user"""
    try:
        # Check if record already exists for today
        existing_record = db.query(models.HealthRecord).filter(
            models.HealthRecord.user_id == current_user_id,
            models.HealthRecord.record_date == record.record_date
        ).first()
        
        if existing_record:
            # Update existing record
            for field, value in record.dict(exclude_unset=True).items():
                setattr(existing_record, field, value)
            existing_record.updated_at = datetime.now()
            db.commit()
            db.refresh(existing_record)
            return existing_record
        else:
            # Create new record
            db_record = models.HealthRecord(**record.dict())
            db.add(db_record)
            db.commit()
            db.refresh(db_record)
            return db_record
            
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating health record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create health record"
        )

@router.get("/records/{user_id}", response_model=List[schemas.HealthRecordResponse])
async def get_health_records(
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get health records for a user with optional date filtering"""
    try:
        query = db.query(models.HealthRecord).filter(
            models.HealthRecord.user_id == user_id
        )
        
        if start_date:
            query = query.filter(models.HealthRecord.record_date >= start_date)
        if end_date:
            query = query.filter(models.HealthRecord.record_date <= end_date)
            
        records = query.order_by(models.HealthRecord.record_date.desc()).all()
        return records
        
    except Exception as e:
        logging.error(f"Error fetching health records: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch health records"
        )

@router.get("/records/{user_id}/latest", response_model=schemas.HealthRecordResponse)
async def get_latest_health_record(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get the most recent health record for a user"""
    try:
        record = db.query(models.HealthRecord).filter(
            models.HealthRecord.user_id == user_id
        ).order_by(models.HealthRecord.record_date.desc()).first()
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No health records found for this user"
            )
            
        return record
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching latest health record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch latest health record"
        )

@router.put("/records/{record_id}", response_model=schemas.HealthRecordResponse)
async def update_health_record(
    record_id: int,
    record_update: schemas.HealthRecordUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update an existing health record"""
    try:
        db_record = db.query(models.HealthRecord).filter(
            models.HealthRecord.id == record_id,
            models.HealthRecord.user_id == current_user_id
        ).first()
        
        if not db_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health record not found"
            )
            
        for field, value in record_update.dict(exclude_unset=True).items():
            setattr(db_record, field, value)
            
        db_record.updated_at = datetime.now()
        db.commit()
        db.refresh(db_record)
        return db_record
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating health record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update health record"
        )

# Health Reminders Endpoints
@router.post("/reminders", response_model=schemas.HealthReminderResponse)
async def create_health_reminder(
    reminder: schemas.HealthReminderCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new health reminder"""
    try:
        # Convert time string to time object
        reminder_data = reminder.dict()
        if isinstance(reminder_data['time'], str):
            reminder_data['time'] = datetime.strptime(reminder_data['time'], '%H:%M').time()
            
        db_reminder = models.HealthReminder(**reminder_data)
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
        
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating health reminder: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create health reminder"
        )

@router.get("/reminders/{user_id}", response_model=List[schemas.HealthReminderResponse])
async def get_health_reminders(
    user_id: int,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get health reminders for a user"""
    try:
        query = db.query(models.HealthReminder).filter(
            models.HealthReminder.user_id == user_id
        )
        
        if active_only:
            query = query.filter(models.HealthReminder.active == True)
            
        reminders = query.order_by(models.HealthReminder.reminder_date, models.HealthReminder.time).all()
        return reminders
        
    except Exception as e:
        logging.error(f"Error fetching health reminders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch health reminders"
        )

@router.put("/reminders/{reminder_id}", response_model=schemas.HealthReminderResponse)
async def update_health_reminder(
    reminder_id: int,
    reminder_update: schemas.HealthReminderUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update an existing health reminder"""
    try:
        db_reminder = db.query(models.HealthReminder).filter(
            models.HealthReminder.id == reminder_id,
            models.HealthReminder.user_id == current_user_id
        ).first()
        
        if not db_reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health reminder not found"
            )
            
        update_data = reminder_update.dict(exclude_unset=True)
        
        # Handle time conversion if updating time
        if 'time' in update_data and isinstance(update_data['time'], str):
            update_data['time'] = datetime.strptime(update_data['time'], '%H:%M').time()
        
        # Handle date field mapping
        if 'reminder_date' in update_data:
            update_data['date'] = update_data.pop('reminder_date')
            
        for field, value in update_data.items():
            setattr(db_reminder, field, value)
            
        db_reminder.updated_at = datetime.now()
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating health reminder: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update health reminder"
        )

@router.delete("/reminders/{reminder_id}")
async def delete_health_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a health reminder"""
    try:
        db_reminder = db.query(models.HealthReminder).filter(
            models.HealthReminder.id == reminder_id,
            models.HealthReminder.user_id == current_user_id
        ).first()
        
        if not db_reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health reminder not found"
            )
            
        db.delete(db_reminder)
        db.commit()
        
        return {"message": "Health reminder deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting health reminder: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete health reminder"
        )

@router.post("/reminders/{reminder_id}/mark-taken")
async def mark_reminder_taken(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Mark a reminder as taken (for medication reminders)"""
    try:
        db_reminder = db.query(models.HealthReminder).filter(
            models.HealthReminder.id == reminder_id,
            models.HealthReminder.user_id == current_user_id
        ).first()
        
        if not db_reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health reminder not found"
            )
            
        db_reminder.last_taken = datetime.now()
        db_reminder.updated_at = datetime.now()
        db.commit()
        db.refresh(db_reminder)
        
        return {"message": "Reminder marked as taken", "last_taken": db_reminder.last_taken}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Error marking reminder as taken: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark reminder as taken"
        )

# AI Health Recommendations Endpoint
@router.post("/ai-recommendations")
async def get_ai_health_recommendations(
    health_data: schemas.HealthDataForAI,
    current_user_id: int = Depends(get_current_user_id)
):
    """Get AI-powered health recommendations based on user's health data"""
    try:
        # Convert Pydantic model to dict
        health_dict = health_data.dict()
        
        # Get AI recommendations
        ai_response = get_health_recommendations(health_dict)
        
        if not ai_response.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ai_response.get("error", "Failed to generate recommendations")
            )
            
        return ai_response
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting AI health recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get AI health recommendations"
        )

# Health Analytics Endpoints
@router.get("/analytics/{user_id}/wellness-trend")
async def get_wellness_trend(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
):
    """Get wellness score trend over specified days"""
    try:
        from datetime import timedelta
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        records = db.query(models.HealthRecord).filter(
            models.HealthRecord.user_id == user_id,
            models.HealthRecord.record_date >= start_date,
            models.HealthRecord.record_date <= end_date
        ).order_by(models.HealthRecord.record_date).all()
        
        trend_data = []
        for record in records:
            trend_data.append({
                "date": record.record_date.isoformat(),
                "wellness_score": record.wellness_score,
                "bmi": record.bmi,
                "water_intake": record.water_intake,
                "sleep_hours": record.sleep_hours,
                "steps": record.steps,
                "mood_score": record.mood_score
            })
            
        return {
            "user_id": user_id,
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "trend_data": trend_data,
            "total_records": len(trend_data)
        }
        
    except Exception as e:
        logging.error(f"Error fetching wellness trend: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch wellness trend data"
        )
