from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from database import get_db
from models import Task, Event, Email, User
from routes.auth.session import get_user_id
import logging

router = APIRouter(prefix="/activities")
logger = logging.getLogger(__name__)

def get_current_user_id(request: Request) -> int:
    """Get current user ID from session"""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = get_user_id(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return user_id

@router.get("/all")
async def get_all_activities(
    request: Request,
    limit: int = 100,
    offset: int = 0,
    activity_type: str = None,
    include_archived: bool = False,
    db: Session = Depends(get_db)
):
    """Get all activities (tasks, events, emails) for the current user"""
    try:
        user_id = get_current_user_id(request)
        all_activities = []
        
        # Fetch tasks
        if not activity_type or activity_type == "tasks":
            task_query = db.query(Task).filter(
                or_(
                    Task.user_id == user_id,
                    Task.assigned_to == user_id
                )
            )
            
            if not include_archived:
                task_query = task_query.filter(Task.archived == False)
            
            tasks = task_query.order_by(desc(Task.updated_at)).limit(limit).offset(offset).all()
            
            for task in tasks:
                all_activities.append({
                    "id": task.id,
                    "type": "task",
                    "title": task.title,
                    "description": task.description,
                    "status": "completed" if task.completed else "pending",
                    "importance": task.importance,
                    "due_date": task.due_date,
                    "created_at": task.created_at,
                    "updated_at": task.updated_at,
                    "action": "created",
                    "user": "You",
                    "category": task.category,
                    "tags": task.tags,
                    "archived": task.archived
                })
        
        # Fetch events
        if not activity_type or activity_type == "events":
            event_query = db.query(Event).filter(Event.user_id == user_id)
            
            if not include_archived:
                event_query = event_query.filter(Event.archived == False)
            
            events = event_query.order_by(desc(Event.updated_at)).limit(limit).offset(offset).all()
            
            for event in events:
                all_activities.append({
                    "id": event.id,
                    "type": "event",
                    "title": event.title,
                    "description": event.description,
                    "start_time": event.start_time,
                    "end_time": event.end_time,
                    "category": event.category,
                    "created_at": event.created_at,
                    "updated_at": event.updated_at,
                    "action": "created",
                    "user": "You",
                    "archived": event.archived
                })
        
        # Fetch emails
        if not activity_type or activity_type == "emails":
            email_query = db.query(Email).filter(Email.user_id == user_id)
            
            if not include_archived:
                # Filter out emails with 'archived' label
                email_query = email_query.filter(~Email.labels.contains('archived'))
            
            emails = email_query.order_by(desc(Email.updated_at)).limit(limit).offset(offset).all()
            
            for email in emails:
                labels = email.labels.split(",") if email.labels else []
                all_activities.append({
                   "id": email.id,
                   "type": "email",
                   "title": email.subject,
                   "description": email.snippet or (email.body[:100] + "..." if email.body else "No content"),
                   "from": email.sender,
                   "to": email.to_recipients,
                   "received_at": email.received_at,
                   "created_at": email.created_at,
                   "updated_at": email.updated_at,
                   "action": "received",
                   "user": email.sender or "Unknown",
                   "labels": labels,
                   "archived": "archived" in labels,
                   "read": "unread" not in labels  # If no 'unread' label, email is read
                })
        
        # Sort all activities by most recent update
        all_activities.sort(key=lambda x: x["updated_at"] or x["created_at"], reverse=True)
        
        # Apply limit to final results
        final_activities = all_activities[:limit]
        
        logger.info(f"Retrieved {len(final_activities)} activities for user {user_id}")
        
        return final_activities
        
    except Exception as e:
        logger.error(f"Error fetching activities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch activities: {str(e)}")

@router.get("/stats")
async def get_activity_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get comprehensive activity statistics for the current user"""
    try:
        user_id = get_current_user_id(request)
        
        # Task statistics
        total_tasks = db.query(func.count(Task.id)).filter(
            or_(
                Task.user_id == user_id,
                Task.assigned_to == user_id
            )
        ).scalar()
        
        completed_tasks = db.query(func.count(Task.id)).filter(
            and_(
                or_(
                    Task.user_id == user_id,
                    Task.assigned_to == user_id
                ),
                Task.completed == True
            )
        ).scalar()
        
        overdue_tasks = db.query(func.count(Task.id)).filter(
            and_(
                or_(
                    Task.user_id == user_id,
                    Task.assigned_to == user_id
                ),
                Task.due_date < datetime.now(),
                Task.completed == False
            )
        ).scalar()
        
        # Event statistics
        total_events = db.query(func.count(Event.id)).filter(Event.user_id == user_id).scalar()
        
        upcoming_events = db.query(func.count(Event.id)).filter(
            and_(
                Event.user_id == user_id,
                Event.start_time > datetime.now()
            )
        ).scalar()
        
        # Email statistics
        total_emails = db.query(func.count(Email.id)).filter(Email.user_id == user_id).scalar()
        
        unread_emails = db.query(func.count(Email.id)).filter(
            and_(
                Email.user_id == user_id,
                Email.labels.contains('unread')
            )
        ).scalar()
        
        # Count emails with specific labels
        starred_emails = db.query(func.count(Email.id)).filter(
            and_(
                Email.user_id == user_id,
                Email.labels.contains('starred')
            )
        ).scalar()
        
        important_emails = db.query(func.count(Email.id)).filter(
            and_(
                Email.user_id == user_id,
                Email.labels.contains('important')
            )
        ).scalar()
        
        archived_emails = db.query(func.count(Email.id)).filter(
            and_(
                Email.user_id == user_id,
                Email.labels.contains('archived')
            )
        ).scalar()
        
        stats = {
            "total": total_tasks + total_events + total_emails,
            "tasks": total_tasks,
            "events": total_events,
            "emails": total_emails,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
            "upcoming": upcoming_events,
            "unread_emails": unread_emails,
            "starred_emails": starred_emails,
            "important_emails": important_emails,
            "archived_emails": archived_emails
        }
        
        logger.info(f"Retrieved activity stats for user {user_id}")
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching activity stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity stats: {str(e)}")

@router.get("/recent")
async def get_recent_activities(
    request: Request,
    days: int = 7,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get recent activities from the last N days"""
    try:
        user_id = get_current_user_id(request)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        all_activities = []
        
        # Recent tasks
        recent_tasks = db.query(Task).filter(
            and_(
                or_(
                    Task.user_id == user_id,
                    Task.assigned_to == user_id
                ),
                Task.updated_at >= cutoff_date
            )
        ).order_by(desc(Task.updated_at)).limit(limit).all()
        
        for task in recent_tasks:
            all_activities.append({
                "id": task.id,
                "type": "task",
                "title": task.title,
                "description": task.description,
                "status": "completed" if task.completed else "pending",
                "importance": task.importance,
                "due_date": task.due_date,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
                "action": "updated" if task.updated_at > task.created_at else "created",
                "user": "You",
                "category": task.category,
                "tags": task.tags
            })
        
        # Recent events
        recent_events = db.query(Event).filter(
            and_(
                Event.user_id == user_id,
                Event.updated_at >= cutoff_date
            )
        ).order_by(desc(Event.updated_at)).limit(limit).all()
        
        for event in recent_events:
            all_activities.append({
                "id": event.id,
                "type": "event",
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "category": event.category,
                "created_at": event.created_at,
                "updated_at": event.updated_at,
                "action": "updated" if event.updated_at > event.created_at else "created",
                "user": "You"
            })
        
        # Recent emails
        recent_emails = db.query(Email).filter(
            and_(
                Email.user_id == user_id,
                Email.updated_at >= cutoff_date
            )
        ).order_by(desc(Email.updated_at)).limit(limit).all()
        
        for email in recent_emails:
            labels = email.labels.split(",") if email.labels else []
            all_activities.append({
                "id": email.id,
                "type": "email",
                "title": email.subject,
                "description": email.snippet or (email.body[:100] + "..." if email.body else "No content"),
                "from": email.sender,
                "received_at": email.received_at,
                "created_at": email.created_at,
                "updated_at": email.updated_at,
                "action": "received",
                "user": email.sender or "Unknown",
                "labels": labels,
                "archived": "archived" in labels,
                "read": "unread" not in labels
            })
        
        # Sort by most recent
        all_activities.sort(key=lambda x: x["updated_at"] or x["created_at"], reverse=True)
        
        # Return top N activities
        final_activities = all_activities[:limit]
        
        logger.info(f"Retrieved {len(final_activities)} recent activities for user {user_id}")
        
        return final_activities
        
    except Exception as e:
        logger.error(f"Error fetching recent activities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent activities: {str(e)}")

@router.get("/search")
async def search_activities(
    request: Request,
    query: str,
    activity_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Search activities by title, description, or content"""
    try:
        user_id = get_current_user_id(request)
        search_term = f"%{query}%"
        all_activities = []
        
        # Search tasks
        if not activity_type or activity_type == "tasks":
            tasks = db.query(Task).filter(
                and_(
                    or_(
                        Task.user_id == user_id,
                        Task.assigned_to == user_id
                    ),
                    or_(
                        Task.title.ilike(search_term),
                        Task.description.ilike(search_term),
                        Task.category.ilike(search_term),
                        Task.tags.ilike(search_term)
                    )
                )
            ).order_by(desc(Task.updated_at)).limit(limit).all()
            
            for task in tasks:
                all_activities.append({
                    "id": task.id,
                    "type": "task",
                    "title": task.title,
                    "description": task.description,
                    "status": "completed" if task.completed else "pending",
                    "importance": task.importance,
                    "due_date": task.due_date,
                    "created_at": task.created_at,
                    "updated_at": task.updated_at,
                    "action": "created",
                    "user": "You",
                    "category": task.category,
                    "tags": task.tags,
                    "search_relevance": "high" if query.lower() in task.title.lower() else "medium"
                })
        
        # Search events
        if not activity_type or activity_type == "events":
            events = db.query(Event).filter(
                and_(
                    Event.user_id == user_id,
                    or_(
                        Event.title.ilike(search_term),
                        Event.description.ilike(search_term),
                        Event.category.ilike(search_term)
                    )
                )
            ).order_by(desc(Event.updated_at)).limit(limit).all()
            
            for event in events:
                all_activities.append({
                    "id": event.id,
                    "type": "event",
                    "title": event.title,
                    "description": event.description,
                    "start_time": event.start_time,
                    "end_time": event.end_time,
                    "category": event.category,
                    "created_at": event.created_at,
                    "updated_at": event.updated_at,
                    "action": "created",
                    "user": "You",
                    "search_relevance": "high" if query.lower() in event.title.lower() else "medium"
                })
        
        # Search emails
        if not activity_type or activity_type == "emails":
            emails = db.query(Email).filter(
                and_(
                    Email.user_id == user_id,
                    or_(
                        Email.subject.ilike(search_term),
                        Email.snippet.ilike(search_term),
                        Email.body.ilike(search_term),
                        Email.sender.ilike(search_term)
                    )
                )
            ).order_by(desc(Email.updated_at)).limit(limit).all()
            
            for email in emails:
                labels = email.labels.split(",") if email.labels else []
                all_activities.append({
                    "id": email.id,
                    "type": "email",
                    "title": email.subject,
                    "description": email.snippet or (email.body[:100] + "..." if email.body else "No content"),
                    "from": email.sender,
                    "received_at": email.received_at,
                    "created_at": email.created_at,
                    "updated_at": email.updated_at,
                    "action": "received",
                    "user": email.sender or "Unknown",
                    "labels": labels,
                    "archived": "archived" in labels,
                    "read": "unread" not in labels,
                    "search_relevance": "high" if query.lower() in email.subject.lower() else "medium"
                })
        
        # Sort by relevance and recency
        all_activities.sort(key=lambda x: (
            x.get("search_relevance", "low") == "high",
            x["updated_at"] or x["created_at"]
        ), reverse=True)
        
        # Return top N activities
        final_activities = all_activities[:limit]
        
        logger.info(f"Search query '{query}' returned {len(final_activities)} activities for user {user_id}")
        
        return {
            "query": query,
            "results": final_activities,
            "total": len(final_activities),
            "types": {
                "tasks": len([a for a in final_activities if a["type"] == "task"]),
                "events": len([a for a in final_activities if a["type"] == "event"]),
                "emails": len([a for a in final_activities if a["type"] == "email"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching activities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search activities: {str(e)}")
