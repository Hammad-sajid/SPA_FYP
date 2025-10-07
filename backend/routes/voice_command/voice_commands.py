from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import logging
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import get_db
from models import models
from schemas import schemas
from utils.voice_commands import voice_parser
from routes.auth.session import get_user_id
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-commands")

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

@router.post("/analyze")
async def analyze_voice_command(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Analyze voice command and return extracted fields without executing
    """
    try:
        current_user_id = get_current_user_id(request)
        
        # Get request body
        body = await request.json()
        voice_text = body.get("voice_text", "").strip()
        module = body.get("module", "").strip()
        
        if not voice_text:
            raise HTTPException(status_code=400, detail="Voice text is required")
        
        if not module:
            raise HTTPException(status_code=400, detail="Module is required")
        
        logger.info(f"Analyzing voice command for user {current_user_id}: '{voice_text}' in module '{module}'")
        
        # Parse the voice command to extract fields
        parsed_command = voice_parser.parse_command(voice_text, module)
        
        if not parsed_command.get("success"):
            raise HTTPException(status_code=400, detail=parsed_command.get("error", "Failed to parse command"))
        
        # Return extracted fields for editing
        return {
            "success": True,
            "message": "Voice command analyzed successfully",
            "fields": parsed_command.get("data", {}),
            "action": parsed_command.get("action")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing voice command: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze voice command: {str(e)}")

@router.post("/process")
async def process_voice_command(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Process voice command and execute corresponding action
    Uses existing endpoints: create_task, create_event, create_email
    """
    try:
        current_user_id = get_current_user_id(request)
        
        # Get request body
        body = await request.json()
        voice_text = body.get("voice_text", "").strip()
        module = body.get("module", "").strip()
        edited_fields = body.get("edited_fields", {})
        
        if not voice_text:
            raise HTTPException(status_code=400, detail="Voice text is required")
        
        if not module:
            raise HTTPException(status_code=400, detail="Module is required")
        
        logger.info(f"Processing voice command for user {current_user_id}: '{voice_text}' in module '{module}' with edited fields: {edited_fields}")
        
        # Parse the voice command
        parsed_command = voice_parser.parse_command(voice_text, module)
        
        if not parsed_command.get("success"):
            raise HTTPException(status_code=400, detail=parsed_command.get("error", "Failed to parse command"))
        
        # Override parsed data with edited fields if provided
        if edited_fields:
            parsed_command["data"].update(edited_fields)
        
        # Execute the parsed command using existing endpoints
        result = await execute_voice_command(parsed_command, current_user_id, db)
        
        return {
            "success": True,
            "message": f"Successfully executed voice command: {voice_text}",
            "action": parsed_command.get("action"),
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing voice command: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process voice command: {str(e)}")

async def execute_voice_command(command: dict, user_id: int, db: Session):
    """
    Execute the parsed voice command using existing functionality
    """
    try:
        action = command.get("action")
        data = command.get("data", {})
        
        # Add user_id to data
        data["user_id"] = user_id
        
        if action == "create_task":
            return await create_task_from_voice(data, db)
        elif action == "create_event":
            return await create_event_from_voice(data, db)
        elif action == "create_email":
            return await create_email_from_voice(data, db)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
            
    except Exception as e:
        logger.error(f"Error executing voice command: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to execute command: {str(e)}")

async def create_task_from_voice(data: dict, db: Session):
    """Create task using existing task creation logic with proper defaults"""
    try:
        # Ensure all required fields have proper defaults
        task_data = {
            "title": data.get("title", "Untitled Task"),
            "description": data.get("description", "Task created via voice command"),
            "due_date": data.get("due_date") or (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            "completed": False,  # Default value
            "importance": data.get("importance", 2),  # Default to medium priority (2)
            "user_id": data.get("user_id"),
            "assigned_to": None,  # Default to None
            "category": data.get("category", "general"),
            "tags": data.get("tags", "voice-created"),
            "estimated_minutes": None,  # Default to None
            "urgency_score": None,  # Default to None
            "position": 0,  # Default position
            "archived": False,  # Default to False
            "archived_at": None,  # Default to None
            "auto_archived": False,  # Default to False
            "linked_event_id": None,  # Default to None
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Create task using existing model
        db_task = models.Task(**task_data)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        logger.info(f"Task created via voice command: {db_task.title}")
        return {
            "id": db_task.id,
            "title": db_task.title,
            "message": f"Task '{db_task.title}' created successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating task from voice command: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create task")

async def create_event_from_voice(data: dict, db: Session):
    """Create event using existing event creation logic with proper defaults"""
    try:
        # Ensure all required fields have proper defaults
        start_time = None
        end_time = None
        
        if data.get("event_date") and data.get("event_time"):
            try:
                start_time = datetime.strptime(f"{data.get('event_date')} {data.get('event_time')}", "%Y-%m-%d %H:%M")
                # Calculate end_time based on duration
                duration_minutes = data.get("duration", 60)
                end_time = start_time + timedelta(minutes=duration_minutes)
            except ValueError:
                # If date/time parsing fails, use defaults
                start_time = datetime.now() + timedelta(hours=1)
                end_time = start_time + timedelta(hours=1)
        else:
            # Use defaults if no date/time provided
            start_time = datetime.now() + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
        
        event_data = {
            "title": data.get("title", "Untitled Event"),
            "description": data.get("description", "Event created via voice command"),
            "start_time": start_time,
            "end_time": end_time,
            "user_id": data.get("user_id"),
            "google_event_id": None,  # Default to None
            "google_calendar_id": None,  # Default to None
            "repeat": "none",  # Default repeat
            "category": data.get("category", "general"),
            "linked_task": None,  # Default to None
            "last_synced": None,  # Default to None
            "synced_at": None,  # Default to None
            "archived": False,  # Default to False
            "archived_at": None,  # Default to None
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Create event using existing model
        db_event = models.Event(**event_data)
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        
        logger.info(f"Event created via voice command: {db_event.title}")
        return {
            "id": db_event.id,
            "title": db_event.title,
            "message": f"Event '{db_event.title}' scheduled successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating event from voice command: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create event")

async def create_email_from_voice(data: dict, db: Session):
    """Create email using existing email creation logic with proper defaults"""
    try:
        # Ensure all required fields have proper defaults
        email_data = {
            "gmail_id": None,  # Default to None
            "thread_id": None,  # Default to None
            "sender": f"user_{data.get('user_id')}@example.com",  # Default sender
            "to_recipients": data.get("to_recipients", "recipient@example.com"),
            "subject": data.get("subject", "Email from voice command"),
            "snippet": data.get("body", "")[:100] if data.get("body") else None,  # First 100 chars
            "body": data.get("body", "Email created via voice command"),
            "body_cached": True,  # Default to True since we have the body
            "body_cached_at": datetime.now(),
            "has_attachment": False,  # Default to False
            "received_at": datetime.now(),
            "auto_reply": None,  # Default to None
            "user_id": data.get("user_id"),
            "labels": "draft,voice-created",  # Default labels
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "in_reply_to": None,  # Default to None
            "forwarded_from": None,  # Default to None
            "needs_gmail_sync": False,  # Default to False
            "last_gmail_sync": None  # Default to None
        }
        
        # Create email using existing model
        db_email = models.Email(**email_data)
        db.add(db_email)
        db.commit()
        db.refresh(db_email)
        
        logger.info(f"Email created via voice command: {db_email.subject}")
        return {
            "id": db_email.id,
            "subject": db_email.subject,
            "message": f"Email '{db_email.subject}' created successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating email from voice command: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create email")

@router.get("/test")
async def test_voice_endpoint():
    """Test endpoint to verify voice commands are working"""
    return {
        "message": "Voice commands endpoint is working!",
        "supported_modules": ["tasks", "events", "emails"],
        "example_commands": [
            "Create task review report due tomorrow",
            "Schedule team meeting tomorrow at 2 PM",
            "Send email to john about project update"
        ]
    }
