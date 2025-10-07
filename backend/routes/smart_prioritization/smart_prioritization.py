import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import httpx

from database import get_db
from models import models
from schemas import schemas
from routes.auth.session import get_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/smart-prioritization", tags=["Smart Prioritization"])

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

@router.get("/schedule-suggestions")
async def get_schedule_suggestions(
    event_duration: int = Query(..., description="Duration in minutes"),
    preferred_date: Optional[str] = Query(None, description="Preferred date (YYYY-MM-DD)"),
    preferred_time_start: Optional[str] = Query(None, description="Preferred start time (HH:MM)"),
    preferred_time_end: Optional[str] = Query(None, description="Preferred end time (HH:MM)"),
    priority: str = Query("medium", description="Priority level (low/medium/high)"),
    category: Optional[str] = Query(None, description="Event category"),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get smart scheduling suggestions for a new event
    """
    try:
        logger.info(f"Smart Prioritization - Generating suggestions for user {current_user_id}")
        
        # Get user preferences
        user_prefs = await get_user_preferences(current_user_id, db)
        logger.info(f"Smart Prioritization - User preferences: {user_prefs}")
        
        # Get all events for the specified date range
        start_date = datetime.now()
        if preferred_date:
            start_date = datetime.strptime(preferred_date, "%Y-%m-%d")
        
        end_date = start_date + timedelta(days=7)  # Look ahead 7 days
        
        # Get local events
        local_events = get_local_events(current_user_id, start_date, end_date, db)
        logger.info(f"Smart Prioritization - Local events found: {len(local_events)}")
        
        # Get Google Calendar events if connected
        google_events = await get_google_calendar_events(current_user_id, start_date, end_date)
        logger.info(f"Smart Prioritization - Google events found: {len(google_events)}")
        
        # Combine and analyze events
        all_events = local_events + google_events
        busy_slots = analyze_busy_slots(all_events)
        logger.info(f"Smart Prioritization - Busy slots: {busy_slots}")
        
        # Calculate free slots
        free_slots = calculate_free_slots(
            busy_slots, 
            event_duration, 
            user_prefs,
            start_date,
            preferred_time_start,
            preferred_time_end
        )
        
        # Rank suggestions
        ranked_suggestions = rank_suggestions(
            free_slots, 
            user_prefs, 
            priority, 
            category
        )
        
        return {
            "suggestions": ranked_suggestions[:6],  # Top 6 suggestions
            "total_slots_found": len(free_slots),
            "analysis": {
                "busy_hours": len(busy_slots),
                "free_hours": 24 - len(busy_slots),
                "conflicts_detected": len([s for s in free_slots if s.get("conflicts", 0) > 0])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")

@router.get("/user-preferences")
async def get_user_preferences_endpoint(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get user scheduling preferences
    """
    try:
        prefs = await get_user_preferences(current_user_id, db)
        return prefs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching preferences: {str(e)}")

@router.post("/user-preferences")
async def update_user_preferences(
    preferences: schemas.UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Update user scheduling preferences
    """
    try:
        # Update or create user preferences
        user_pref = db.query(models.UserPreferences).filter(
            models.UserPreferences.user_id == current_user_id
        ).first()
        
        if user_pref:
            for field, value in preferences.dict(exclude_unset=True).items():
                setattr(user_pref, field, value)
        else:
            user_pref = models.UserPreferences(
                user_id=current_user_id,
                **preferences.dict()
            )
            db.add(user_pref)
        
        db.commit()
        return {"message": "Preferences updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")

@router.get("/conflict-analysis")
async def analyze_conflicts(
    event_id: str = Query(..., description="Event ID to analyze or slot identifier"),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Analyze potential conflicts for a specific event or suggested slot
    """
    try:
        # Check if this is a suggested slot (starts with 'slot_' or 'task_slot_')
        if event_id.startswith('slot_') or event_id.startswith('task_slot_'):
            # This is a suggested slot, not an existing event
            # Return analysis based on the suggested time
            return {
                "type": "suggested_slot",
                "slot_id": event_id,
                "message": "This is a suggested time slot. No existing conflicts to analyze.",
                "suggestions": [
                    "This time slot has been analyzed for conflicts during suggestion generation",
                    "The score shown represents conflict-free scheduling",
                    "You can proceed with confidence to schedule your event/task"
                ]
            }
        
        # Try to parse as integer for existing event
        try:
            event_id_int = int(event_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid event ID format")
        
        # Get the event
        event = db.query(models.Event).filter(
            models.Event.id == event_id_int,
            models.Event.user_id == current_user_id
        ).first()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Find overlapping events
        overlapping_events = find_overlapping_events(event, current_user_id, db)

        # Get Google Calendar conflicts if applicable
        google_conflicts = await get_google_calendar_conflicts(event, current_user_id)

        return {
            "type": "existing_event",
            "event": {
                "id": event.id,
                "title": event.title,
                "start_time": event.start_time,
                "end_time": event.end_time
            },
            "conflicts": {
                "local": overlapping_events,
                "google_calendar": google_conflicts,
                "total_conflicts": len(overlapping_events) + len(google_conflicts)
            },
            "suggestions": generate_conflict_resolutions(event, overlapping_events + google_conflicts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Smart Prioritization - Error in conflict analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing conflicts: {str(e)}")

# ===== TASK PRIORITIZATION ENDPOINTS =====

@router.get("/task-schedule-suggestions")
async def get_task_schedule_suggestions(
    task_duration: int = Query(..., description="Task duration in minutes"),
    task_priority: str = Query("medium", description="Task priority (low/medium/high)"),
    task_urgency: str = Query("medium", description="Task urgency (low/medium/high)"),
    preferred_date: Optional[str] = Query(None, description="Preferred date (YYYY-MM-DD)"),
    preferred_time_start: Optional[str] = Query(None, description="Preferred start time (HH:MM)"),
    preferred_time_end: Optional[str] = Query(None, description="Preferred end time (HH:MM)"),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get smart scheduling suggestions for a task
    """
    try:
        logger.info(f"Smart Prioritization - Generating task schedule suggestions for user {current_user_id}")
        
        # Get user preferences
        user_prefs = await get_user_preferences(current_user_id, db)
        logger.info(f"Smart Prioritization - User preferences: {user_prefs}")
        
        # Get all events for the specified date range
        start_date = datetime.now()
        if preferred_date:
            start_date = datetime.strptime(preferred_date, "%Y-%m-%d")
        
        end_date = start_date + timedelta(days=7)  # Look ahead 7 days
        logger.info(f"Smart Prioritization - Date range: {start_date} to {end_date}")
        
        # Get local events
        local_events = get_local_events(current_user_id, start_date, end_date, db)
        logger.info(f"Smart Prioritization - Local events found: {len(local_events)}")
        
        # Get Google Calendar events if connected
        google_events = await get_google_calendar_events(current_user_id, start_date, end_date)
        logger.info(f"Smart Prioritization - Google events found: {len(google_events)}")
        
        # Get user's tasks for workload analysis
        user_tasks = get_user_tasks(current_user_id, db)
        logger.info(f"Smart Prioritization - User tasks found: {len(user_tasks)}")
        
        # Combine and analyze events
        all_events = local_events + google_events
        busy_slots = analyze_busy_slots(all_events)
        logger.info(f"Smart Prioritization - Busy slots: {busy_slots}")
        
        # Calculate free slots for task
        free_slots = calculate_free_slots(
            busy_slots, 
            task_duration, 
            user_prefs,
            start_date,
            preferred_time_start,
            preferred_time_end
        )
        logger.info(f"Smart Prioritization - Free slots found: {len(free_slots)}")
        
        # Rank task suggestions with task-specific logic
        ranked_suggestions = rank_task_suggestions(
            free_slots, 
            user_prefs, 
            task_priority, 
            task_urgency,
            user_tasks
        )
        logger.info(f"Smart Prioritization - Ranked task suggestions: {len(ranked_suggestions)}")
        
        return {
            "suggestions": ranked_suggestions[:6],  # Top 6 suggestions
            "total_slots_found": len(free_slots),
            "workload_analysis": {
                "total_tasks": len(user_tasks),
                                        "high_priority_tasks": len([t for t in user_tasks if t.get("priority") == "high"]),
                "overdue_tasks": len([t for t in user_tasks if t.get("overdue", False)]),
                "busy_hours": len(busy_slots),
                "free_hours": 24 - len(busy_slots)
            }
        }
        
    except Exception as e:
        logger.error(f"Smart Prioritization - Error generating task suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating task suggestions: {str(e)}")

@router.get("/user-tasks")
async def get_user_tasks_endpoint(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get user's tasks for workload analysis
    """
    try:
        tasks = get_user_tasks(current_user_id, db)
        return {
            "tasks": tasks,
            "total_tasks": len(tasks),
            "priority_breakdown": {
                                                                "high": len([t for t in tasks if t.get("priority") == "high"]),
                        "medium": len([t for t in tasks if t.get("priority") == "medium"]),
                        "low": len([t for t in tasks if t.get("priority") == "low"])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")

# Helper functions
async def get_user_preferences(user_id: int, db: Session):
    """Get user scheduling preferences"""
    prefs = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == user_id
    ).first()

    if not prefs:
        # Return default preferences
        return {
            "working_hours_start": "09:00",
            "working_hours_end": "18:00",
            "preferred_break_times": ["12:00", "15:00"],
            "min_gap_between_events": 15,
            "preferred_categories": ["work", "meeting"],
            "energy_levels": {
                "morning": "high",
                "afternoon": "medium",
                "evening": "low"
            }
        }

    return {
        "working_hours_start": prefs.working_hours_start,
        "working_hours_end": prefs.working_hours_end,
        "preferred_break_times": prefs.preferred_break_times.split(",") if prefs.preferred_break_times else [],
        "min_gap_between_events": prefs.min_gap_between_events,
        "preferred_categories": prefs.preferred_categories.split(",") if prefs.preferred_categories else [],
        "energy_levels": {
            "morning": prefs.morning_energy_level,
            "afternoon": prefs.afternoon_energy_level,
            "evening": prefs.evening_energy_level
        }
    }

def get_local_events(user_id: int, start_date: datetime, end_date: datetime, db: Session):
    """Get local calendar events for the date range"""
    try:
        events = db.query(models.Event).filter(
            models.Event.user_id == user_id,
            models.Event.start_time >= start_date,
            models.Event.start_time <= end_date,
            models.Event.archived == False
        ).all()

        logger.info(f"Smart Prioritization - Found {len(events)} local events for user {user_id}")
        
        return [
            {
                "id": event.id,
                "title": event.title,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "category": event.category,
                "source": "local"
            }
            for event in events
        ]
    except Exception as e:
        logger.error(f"Smart Prioritization - Error fetching local events: {str(e)}")
        return []

async def get_google_calendar_events(user_id: int, start_date: datetime, end_date: datetime):
    """Get Google Calendar events for the date range"""
    try:
        # Since Google Calendar events are synced to local database,
        # we can get them from there with google_event_id filter
        from database import get_db
        db = next(get_db())
        
        google_events = db.query(models.Event).filter(
            models.Event.user_id == user_id,
            models.Event.start_time >= start_date,
            models.Event.start_time <= end_date,
            models.Event.archived == False,
            models.Event.google_event_id.isnot(None)  # Only Google Calendar events
        ).all()

        logger.info(f"Smart Prioritization - Found {len(google_events)} Google Calendar events for user {user_id}")
        
        return [
            {
                "id": event.id,
                "title": event.title,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "category": event.category,
                "source": "google"
            }
            for event in google_events
        ]
    except Exception as e:
        logger.error(f"Smart Prioritization - Error fetching Google Calendar events: {str(e)}")
        return []

def analyze_busy_slots(events: List[dict]):
    """Analyze events to find busy time slots"""
    busy_slots = []

    for event in events:
        start = event["start_time"]
        end = event["end_time"]

        # Convert to hour slots
        start_hour = start.hour
        end_hour = end.hour

        for hour in range(start_hour, end_hour + 1):
            if hour not in busy_slots:
                busy_slots.append(hour)

    return sorted(busy_slots)

def calculate_free_slots(busy_slots: List[int], event_duration: int, user_prefs: dict, 
                        start_date: datetime, preferred_start: Optional[str], preferred_end: Optional[str]):
    """Calculate free time slots for the event"""
    free_slots = []

    # Get working hours
    work_start = int(user_prefs["working_hours_start"].split(":")[0])
    work_end = int(user_prefs["working_hours_end"].split(":")[0])

    # Calculate required hours
    required_hours = (event_duration + 59) // 60  # Round up

    for hour in range(work_start, work_end - required_hours + 1):
        if hour not in busy_slots:
            # Check if this slot conflicts with break times
            conflicts = 0
            for break_time in user_prefs["preferred_break_times"]:
                break_hour = int(break_time.split(":")[0])
                if hour <= break_hour < hour + required_hours:
                    conflicts += 1

            # Check minimum gap requirement
            gap_violations = 0
            for busy_hour in busy_slots:
                if abs(hour - busy_hour) < user_prefs["min_gap_between_events"] / 60:
                    gap_violations += 1

            slot = {
                "start_hour": hour,
                "start_time": f"{hour:02d}:00",
                "end_hour": hour + required_hours,
                "end_time": f"{hour + required_hours:02d}:00",
                "duration_hours": required_hours,
                "duration_minutes": event_duration,  # Store the original duration in minutes
                "conflicts": conflicts,
                "gap_violations": gap_violations,
                "score": 100 - (conflicts * 20) - (gap_violations * 10)
            }

            free_slots.append(slot)

    return free_slots

def rank_suggestions(free_slots: List[dict], user_prefs: dict, priority: str, category: Optional[str]):
    """Rank free slots by various factors"""
    for slot in free_slots:
        # Base score from conflicts (already calculated in calculate_free_slots)
        base_score = slot["score"]
        
        # Calculate bonus points (max 30 total bonus)
        bonus_points = 0
        
        # Priority bonus (max 10 points)
        if priority == "high":
            bonus_points += 10
        elif priority == "medium":
            bonus_points += 5
        
        # Category preference bonus (max 10 points)
        if category and category in user_prefs["preferred_categories"]:
            bonus_points += 10
        
        # Energy level bonus (max 10 points)
        if slot["start_hour"] < 12:  # Morning
            energy_bonus = {"high": 10, "medium": 7, "low": 3}.get(user_prefs["energy_levels"]["morning"], 0)
        elif slot["start_hour"] < 17:  # Afternoon
            energy_bonus = {"high": 10, "medium": 7, "low": 3}.get(user_prefs["energy_levels"]["afternoon"], 0)
        else:  # Evening
            energy_bonus = {"high": 10, "medium": 7, "low": 3}.get(user_prefs["energy_levels"]["evening"], 0)
        
        bonus_points += energy_bonus
        
        # Calculate final score (base_score + bonus_points, capped at 100)
        final_score = min(100, base_score + bonus_points)
        
        # Store both scores for debugging
        slot["base_score"] = base_score
        slot["bonus_points"] = bonus_points
        slot["final_score"] = final_score

    # Sort by final score (highest first)
    return sorted(free_slots, key=lambda x: x["final_score"], reverse=True)

def find_overlapping_events(event: models.Event, user_id: int, db: Session):
    """Find events that overlap with the given event"""
    overlapping = db.query(models.Event).filter(
        models.Event.user_id == user_id,
        models.Event.id != event.id,
        models.Event.archived == False,
        models.Event.start_time < event.end_time,
        models.Event.end_time > event.start_time
    ).all()

    return [
        {
            "id": e.id,
            "title": e.title,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "overlap_minutes": calculate_overlap_minutes(event, e)
        }
        for e in overlapping
    ]

def calculate_overlap_minutes(event1: models.Event, event2: models.Event):
    """Calculate overlap duration in minutes"""
    overlap_start = max(event1.start_time, event2.start_time)
    overlap_end = min(event1.end_time, event2.end_time)

    if overlap_start < overlap_end:
        return int((overlap_end - overlap_start).total_seconds() / 60)
    return 0

async def get_google_calendar_conflicts(event: models.Event, user_id: int):
    """Get Google Calendar conflicts (placeholder for future implementation)"""
    # This would integrate with Google Calendar API
    return []

def generate_conflict_resolutions(event: models.Event, conflicts: List[dict]):
    """Generate suggestions for resolving conflicts"""
    suggestions = []

    for conflict in conflicts:
        if conflict["overlap_minutes"] > 0:
            suggestions.append({
                "type": "reschedule",
                "conflict_event": conflict["title"],
                "overlap_minutes": conflict["overlap_minutes"],
                "suggestions": [
                    f"Move {event.title} to start {conflict['overlap_minutes'] + 15} minutes later",
                    f"Shorten {event.title} by {conflict['overlap_minutes']} minutes",
                    f"Reschedule {conflict['title']} to a different time"
                ]
            })

    return suggestions

# ===== TASK MANAGEMENT HELPER FUNCTIONS =====

def get_user_tasks(user_id: int, db: Session):
    """Get user's tasks for workload analysis"""
    try:
        # Query tasks from your existing Task model (no changes to Task Management module)
        tasks = db.query(models.Task).filter(
            models.Task.user_id == user_id,
            models.Task.archived == False
        ).all()

        return [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "importance": task.importance,  # Numeric value: 1=Low, 2=Medium, 3=High
                "priority": "low" if task.importance == 1 else "medium" if task.importance == 2 else "high",  # String mapping
                "urgency_score": task.urgency_score,
                "due_date": task.due_date,
                "estimated_minutes": task.estimated_minutes,
                "status": "active" if not task.completed else "completed",  # Task model doesn't have status field
                "category": task.category,
                "overdue": task.due_date < datetime.now() if task.due_date else False
            }
            for task in tasks
        ]
    except Exception as e:
        logger.error(f"Smart Prioritization - Error fetching user tasks: {str(e)}")
        return []

def rank_task_suggestions(free_slots: List[dict], user_prefs: dict, task_priority: str, 
                         task_urgency: str, user_tasks: List[dict]):
    """Rank free slots for task scheduling with task-specific logic"""
    for slot in free_slots:
        # Base score from conflicts (already calculated)
        base_score = slot["score"]
        
        # Calculate task-specific bonus points (max 40 total bonus)
        bonus_points = 0
        
        # Task priority bonus (max 15 points)
        if task_priority == "high":
            bonus_points += 15
        elif task_priority == "medium":
            bonus_points += 10
        elif task_priority == "low":
            bonus_points += 5
        
        # Task urgency bonus (max 15 points)
        if task_urgency == "high":
            bonus_points += 15
        elif task_urgency == "medium":
            bonus_points += 10
        elif task_urgency == "low":
            bonus_points += 5
        
        # Workload balance bonus (max 10 points)
        # Prefer slots when user has fewer high-priority tasks
        high_priority_tasks = len([t for t in user_tasks if t.get("priority") == "high"])
        if high_priority_tasks <= 2:
            bonus_points += 10  # Good workload balance
        elif high_priority_tasks <= 5:
            bonus_points += 5   # Moderate workload
        else:
            bonus_points += 0   # High workload, no bonus
        
        # Energy level bonus (max 10 points)
        if slot["start_hour"] < 12:  # Morning
            energy_bonus = {"high": 10, "medium": 7, "low": 3}.get(user_prefs["energy_levels"]["morning"], 0)
        elif slot["start_hour"] < 17:  # Afternoon
            energy_bonus = {"high": 10, "medium": 7, "low": 3}.get(user_prefs["energy_levels"]["afternoon"], 0)
        else:  # Evening
            energy_bonus = {"high": 10, "medium": 7, "low": 3}.get(user_prefs["energy_levels"]["evening"], 0)
        
        bonus_points += energy_bonus
        
        # Calculate final score (base_score + bonus_points, capped at 100)
        final_score = min(100, base_score + bonus_points)
        
        # Store scores for debugging
        slot["base_score"] = base_score
        slot["bonus_points"] = bonus_points
        slot["final_score"] = final_score
        slot["task_priority_bonus"] = task_priority
        slot["task_urgency_bonus"] = task_urgency
        slot["workload_balance"] = "Good" if high_priority_tasks <= 2 else "Moderate" if high_priority_tasks <= 5 else "High"
        
        # Store the original task duration for frontend use
        if "duration_minutes" in slot:
            slot["task_duration_minutes"] = slot["duration_minutes"]

    # Sort by final score (highest first)
    return sorted(free_slots, key=lambda x: x["final_score"], reverse=True)
