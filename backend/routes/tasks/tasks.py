from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from models import models
from schemas import schemas
from database import get_db
import os
from utils.ai_utils import get_task_importance
import logging
# logging.basicConfig(level=logging.INFO)

# Configure logging
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/tasks")

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

# Helper function to convert username to user ID
def get_user_id_from_username_or_id(db: Session, assigned_to: str | int | None) -> int | None:
    """Convert username to user ID, or return ID if already an integer"""
    if assigned_to is None:
        return None
    
    if isinstance(assigned_to, int):
        # Already a user ID, verify it exists
        user = db.query(models.User).filter(models.User.id == assigned_to).first()
        return assigned_to if user else None
    
    if isinstance(assigned_to, str):
        # Username provided, convert to user ID
        user = db.query(models.User).filter(models.User.username == assigned_to).first()
        return user.id if user else None
    
    return None




# ✅ Debug endpoint to test session
@router.get("/debug-session")
def debug_session(request: Request):
    session_id = request.cookies.get("session_id")
    all_cookies = request.cookies
    return {
        "session_id": session_id,
        "all_cookies": dict(all_cookies),
        "headers": dict(request.headers)
    }

# ✅ Get All Tasks for Current User (REST style)
@router.get("/get-tasks", response_model=list[schemas.TaskOut])
def read_tasks(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id),
    show_archived: bool = False
):
    # Show tasks that are either created by the user OR assigned to the user
    query = db.query(models.Task).filter(
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    )
    
    # Filter by archive status
    if not show_archived:
        query = query.filter(models.Task.archived == False)

    # Active tasks: Only show non-expired, non-archived tasks (regardless of completion)
    # This means expired tasks (past due date) are completely excluded from active view
    from datetime import datetime
    
    # Use local system time instead of UTC to match frontend
    now = datetime.now()  # This uses the system's local timezone
    
    print(f"DEBUG: Filtering active tasks, current local time: {now}")  # Debug log
    
    query = query.filter(
        (models.Task.due_date >= now)  # Not expired yet (regardless of completion)
    )
    
    rows = query.order_by(models.Task.position.asc(), models.Task.due_date.asc()).all()
    
    print(f"DEBUG: Found {len(rows)} active tasks")  # Debug log
    for task in rows:
        print(f"DEBUG: Task '{task.title}' - Due: {task.due_date}, Completed: {task.completed}")  # Debug log
    
    # Normalize nullable string fields to empty strings to satisfy strict clients
    for r in rows:
        if getattr(r, "category", None) is None:
            r.category = ""
        if getattr(r, "tags", None) is None:
            r.tags = ""
        
        # Add creator's username
        creator = db.query(models.User).filter(models.User.id == r.user_id).first()
        r.user_username = creator.username if creator else None
        
        # Add assigned_to_username for display
        if r.assigned_to:
            user = db.query(models.User).filter(models.User.id == r.assigned_to).first()
            r.assigned_to_username = user.username if user else None
        else:
            r.assigned_to_username = None
    
    return rows

# ✅ Get All Tasks (including expired) for Current User
@router.get("/all", response_model=list[schemas.TaskOut])
def read_all_tasks(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id),
    show_archived: bool = False
):
    """Get all tasks including expired ones (but not archived)"""
    # Show tasks that are either created by the user OR assigned to the user
    query = db.query(models.Task).filter(
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    )
    
    # Filter by archive status
    if not show_archived:
        query = query.filter(models.Task.archived == False)
    
    rows = query.order_by(models.Task.position.asc(), models.Task.due_date.asc()).all()
    
    # Normalize nullable string fields to empty strings to satisfy strict clients
    for r in rows:
        if getattr(r, "category", None) is None:
            r.category = ""
        if getattr(r, "tags", None) is None:
            r.tags = ""
        
        # Add creator's username
        creator = db.query(models.User).filter(models.User.id == r.user_id).first()
        r.user_username = creator.username if creator else None
        
        # Add assigned_to_username for display
        if r.assigned_to:
            user = db.query(models.User).filter(models.User.id == r.assigned_to).first()
            r.assigned_to_username = user.username if user else None
        else:
            r.assigned_to_username = None
    
    return rows

# ✅ Get Archived Tasks
@router.get("/archived", response_model=list[schemas.TaskOut])
def get_archived_tasks(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get archived tasks for the current user"""
    rows = db.query(models.Task).filter(
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id),
        models.Task.archived == True
    ).order_by(models.Task.archived_at.desc()).all()
    
    # Normalize fields and add usernames
    for r in rows:
        if getattr(r, "category", None) is None:
            r.category = ""
        if getattr(r, "tags", None) is None:
            r.tags = ""
        
        creator = db.query(models.User).filter(models.User.id == r.user_id).first()
        r.user_username = creator.username if creator else None
        
        if r.assigned_to:
            user = db.query(models.User).filter(models.User.id == r.assigned_to).first()
            r.assigned_to_username = user.username if user else None
        else:
            r.assigned_to_username = None
    
    return rows

# ✅ Get Expired Tasks
@router.get("/expired", response_model=list[schemas.TaskOut])
def get_expired_tasks(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get tasks that are past their due date (both completed and incomplete)"""
    from datetime import datetime
    
    # Use local system time instead of UTC to match frontend
    now = datetime.now()  # This uses the system's local timezone
    
    print(f"DEBUG: Getting expired tasks, current local time: {now}")  # Debug log
    
    rows = db.query(models.Task).filter(
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id),
        models.Task.due_date < now,        # Past due date
        models.Task.archived == False      # Not archived
    ).order_by(models.Task.due_date.asc()).all()
    
    print(f"DEBUG: Found {len(rows)} expired tasks")  # Debug log
    
    # Normalize fields and add usernames
    for r in rows:
        if getattr(r, "category", None) is None:
            r.category = ""
        if getattr(r, "tags", None) is None:
            r.tags = ""
        
        creator = db.query(models.User).filter(models.User.id == r.user_id).first()
        r.user_username = creator.username if creator else None
        
        if r.assigned_to:
            user = db.query(models.User).filter(models.User.id == r.assigned_to).first()
            r.assigned_to_username = user.username if user else None
        else:
            r.assigned_to_username = None
    
    return rows

# ✅ Create Task for Current User (REST style)
@router.post("/create", response_model=schemas.TaskOut)
async def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    # Get AI priority analysis
    try:
        # Pass additional context to AI for better importance analysis
        ai_suggested_importance = await get_task_importance(
            title=task.title, 
            description=task.description,
            priority=task.importance,  # Pass user's priority if specified
            category=task.category
        )
        
        # Use AI suggestion if user didn't specify, otherwise AI can override if needed
        if task.importance is None:
            importance = ai_suggested_importance
            print(f"AI suggested importance: {importance}")
        else:
            # User specified importance, but AI can suggest changes
            importance = ai_suggested_importance
            print(f"User specified: {task.importance}, AI suggested: {importance}")
            
    except Exception as e:
        print(f"AI priority fallback: {e}")
        # Fallback to user's choice or default
        importance = task.importance if task.importance is not None else 2
    
    # Convert assigned_to username to user ID if provided
    assigned_to_id = None
    if task.assigned_to:
        assigned_to_id = get_user_id_from_username_or_id(db, task.assigned_to)
        if assigned_to_id is None:
            raise HTTPException(status_code=400, detail=f"User '{task.assigned_to}' not found")
    
    db_task = models.Task(
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        importance=importance,
        completed=False,
        user_id=current_user_id,  # Use current user's ID instead of task.user_id
        assigned_to=assigned_to_id,  # Store the user ID, not username
        category=task.category,
        tags=task.tags,
        estimated_minutes=task.estimated_minutes,
        urgency_score=task.urgency_score,
        position=task.position or 0,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


# ✅ Get Task by ID for Current User (REST style)
@router.get("/get/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

# ✅ Update Task for Current User (REST style)
@router.put("/update/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    print(f"DEBUG: Updating task {task_id} with data: {task.dict()}")  # Debug log
    print(f"DEBUG: Current user ID: {current_user_id}")  # Debug log
    
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user_id).first()
    if not db_task:
        print(f"DEBUG: Task {task_id} not found for user {current_user_id}")  # Debug log
        raise HTTPException(status_code=404, detail="Task not found")

    print(f"DEBUG: Found task: {db_task.title}")  # Debug log

    # Convert assigned_to username to user ID if provided
    if task.assigned_to is not None:
        print(f"DEBUG: Converting assigned_to: {task.assigned_to}")  # Debug log
        assigned_to_id = get_user_id_from_username_or_id(db, task.assigned_to)
        if assigned_to_id is None:
            print(f"DEBUG: User '{task.assigned_to}' not found")  # Debug log
            raise HTTPException(status_code=400, detail=f"User '{task.assigned_to}' not found")
        task.assigned_to = assigned_to_id
        print(f"DEBUG: Converted to user ID: {assigned_to_id}")  # Debug log

    # Update only the fields that were provided
    update_data = task.dict(exclude_unset=True)
    print(f"DEBUG: Fields to update: {update_data}")  # Debug log

    for field, value in update_data.items():
        print(f"DEBUG: Setting {field} = {value}")  # Debug log
        setattr(db_task, field, value)

    try:
        db.commit()
        db.refresh(db_task)
        print(f"DEBUG: Task updated successfully")  # Debug log
        return db_task
    except Exception as e:
        print(f"DEBUG: Error updating task: {e}")  # Debug log
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Get AI-Suggested Importance for Task
@router.post("/suggest-importance")
async def suggest_task_importance(
    title: str,
    description: str,
    priority: str = None,
    category: str = None,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get AI-suggested importance for a task
    """
    try:
        # Get AI-suggested importance
        suggested_importance = await get_task_importance(
            title=title,
            description=description,
            priority=priority,
            category=category
        )
        
        return {
            "suggested_importance": suggested_importance,
            "importance_label": {1: "Low", 2: "Medium", 3: "High"}[suggested_importance],
            "analysis": f"AI analyzed the task and suggested {suggested_importance} importance level"
        }
        
    except Exception as e:
        print(f"Error getting AI importance suggestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI importance suggestion: {str(e)}")

# ✅ Delete Task for Current User (REST style)
@router.delete("/delete/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

# ✅ Archive Task
@router.post("/{task_id}/archive")
def archive_task(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Archive a task (soft delete)"""
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Log activity
    from datetime import datetime
    
    # Use local system time for consistency
    now = datetime.now()
    
    db_task.archived_at = now
    db_task.archived = True
    db_task.auto_archived = False
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user_id,
        activity_type="archived",
        new_value="archived"
    )
    db.add(activity)
    
    db.commit()
    return {"message": "Task archived successfully"}

# ✅ Unarchive Task
@router.post("/{task_id}/unarchive")
def unarchive_task(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Unarchive a task"""
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.archived = False
    db_task.archived_at = None
    db_task.auto_archived = False
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user_id,
        activity_type="unarchived",
        new_value="active"
    )
    db.add(activity)
    
    db.commit()
    return {"message": "Task unarchived successfully"}

# ✅ Convert Task to Calendar Event
@router.post("/{task_id}/convert-to-event")
def convert_task_to_event(
    task_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Convert a task to a calendar event"""
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if db_task.linked_event_id:
        raise HTTPException(status_code=400, detail="Task already has a linked event")
    
    # Create calendar event from task
    from datetime import datetime, timedelta
    
    # Use local system time for consistency
    start_time = db_task.due_date
    end_time = start_time + timedelta(hours=1)  # Default 1 hour duration
    
    # If task has estimated time, use it
    if db_task.estimated_minutes:
        end_time = start_time + timedelta(minutes=db_task.estimated_minutes)
    
    db_event = models.Event(
        title=db_task.title,
        description=db_task.description,
        start_time=start_time,
        end_time=end_time,
        user_id=current_user_id,
        category=db_task.category or "task",
        linked_task=str(task_id)
    )
    
    db.add(db_event)
    db.flush()  # Get the event ID
    
    # Link task to event
    db_task.linked_event_id = db_event.id
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user_id,
        activity_type="converted_to_event",
        new_value=f"event_{db_event.id}"
    )
    db.add(activity)
    
    db.commit()
    
    return {
        "message": "Task converted to calendar event successfully",
        "event_id": db_event.id,
        "event_title": db_event.title
    }

# ✅ Get All Users for Task Assignment
@router.get("/users", response_model=list[dict])
def get_users_for_assignment(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get all users for task assignment dropdown"""
    users = db.query(models.User).filter(models.User.id != current_user_id).all()
    return [{"id": user.id, "username": user.username, "email": user.email} for user in users]

# ✅ High Priority Tasks for Current User (Optional)
@router.get("/high-priority", response_model=list[schemas.TaskOut])
def get_high_priority_tasks(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return db.query(models.Task).filter(models.Task.importance == 3, models.Task.user_id == current_user_id).all()

# ✅ Task Comments
@router.get("/{task_id}/comments", response_model=list[schemas.TaskCommentOut])
def get_task_comments(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get all comments for a specific task"""
    # Verify user has access to the task
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comments = db.query(models.TaskComment).filter(models.TaskComment.task_id == task_id).order_by(models.TaskComment.created_at.asc()).all()
    
    # Add usernames to comments
    for comment in comments:
        user = db.query(models.User).filter(models.User.id == comment.user_id).first()
        comment.user_username = user.username if user else "Unknown User"
    
    return comments

@router.post("/{task_id}/comments", response_model=schemas.TaskCommentOut)
def add_task_comment(
    task_id: int, 
    comment_data: schemas.TaskCommentCreate, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Add a comment to a task"""
    # Verify user has access to the task
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_comment = models.TaskComment(
        task_id=task_id,
        user_id=current_user_id,
        comment=comment_data.comment
    )
    
    db.add(db_comment)
    db.flush()
    
    # Add username to comment
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    db_comment.user_username = user.username if user else "Unknown User"
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user_id,
        activity_type="comment_added",
        new_value=f"Comment: {comment_data.comment[:50]}..."
    )
    db.add(activity)
    
    db.commit()
    return db_comment

# ✅ Task Activity Timeline
@router.get("/{task_id}/activities", response_model=list[schemas.TaskActivityOut])
def get_task_activities(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Get activity timeline for a specific task"""
    # Verify user has access to the task
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id)
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    activities = db.query(models.TaskActivity).filter(models.TaskActivity.task_id == task_id).order_by(models.TaskActivity.created_at.desc()).all()
    
    # Add usernames to activities
    for activity in activities:
        user = db.query(models.User).filter(models.User.id == activity.user_id).first()
        activity.user_username = user.username if user else "Unknown User"
    
    return activities

# ✅ Auto-archive completed tasks (background task)
@router.post("/auto-archive")
def auto_archive_completed_tasks(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Auto-archive completed tasks older than X days"""
    from datetime import datetime, timedelta
    
    # Archive tasks completed more than 30 days ago
    archive_threshold = datetime.now() - timedelta(days=30)
    
    tasks_to_archive = db.query(models.Task).filter(
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id),
        models.Task.completed == True,
        models.Task.archived == False,
        models.Task.updated_at < archive_threshold
    ).all()
    
    archived_count = 0
    for task in tasks_to_archive:
        task.archived = True
        task.archived_at = datetime.now()
        task.auto_archived = True
        
        # Log activity
        activity = models.TaskActivity(
            task_id=task.id,
            user_id=current_user_id,
            activity_type="auto_archived",
            new_value="auto_archived"
        )
        db.add(activity)
        archived_count += 1
    
    db.commit()
    return {"message": f"Auto-archived {archived_count} completed tasks"}

# ✅ Auto-expiry: Move expired tasks to expired view
@router.post("/auto-expire")
def auto_expire_tasks(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Automatically identify and mark tasks as expired"""
    from datetime import datetime
    now = datetime.now()
    
    # Find tasks that have expired but are still in active view
    expired_tasks = db.query(models.Task).filter(
        (models.Task.user_id == current_user_id) | (models.Task.assigned_to == current_user_id),
        models.Task.due_date < now,
        models.Task.archived == False
    ).all()
    
    expired_count = 0
    for task in expired_tasks:
        # Log activity for expired tasks
        activity = models.TaskActivity(
            task_id=task.id,
            user_id=current_user_id,
            activity_type="expired",
            new_value=f"Expired on {task.due_date.strftime('%Y-%m-%d %H:%M')}"
        )
        db.add(activity)
        expired_count += 1
    
    db.commit()
    return {"message": f"Identified {expired_count} expired tasks"}

task_router = router
