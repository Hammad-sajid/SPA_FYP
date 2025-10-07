from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, UniqueConstraint, Date, Time, Float
from datetime import datetime, date
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    google_id = Column(String, unique=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    
    # Profile fields
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)  # URL to profile photo (from Google or uploaded)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    last_activity = Column(DateTime, default=datetime.now)
    
    # Relationship
    user = relationship("User", back_populates="sessions")


# 🔥 Added Task model

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
    importance = Column(Integer, nullable=True)  # AI-generated priority
    user_id = Column(Integer, nullable=False)  # Task creator
    assigned_to = Column(Integer, nullable=True)  # User assigned to (can be null if self-assigned)
    category = Column(String, nullable=True)  # work, personal, urgent, long-term, etc.
    tags = Column(String, nullable=True)
    estimated_minutes = Column(Integer, nullable=True)
    urgency_score = Column(Integer, nullable=True)
    position = Column(Integer, nullable=True, default=0)
    
    # New fields for enhanced functionality
    archived = Column(Boolean, default=False)  # Archive status
    archived_at = Column(DateTime, nullable=True)  # When task was archived
    auto_archived = Column(Boolean, default=False)  # Whether auto-archived
    linked_event_id = Column(Integer, nullable=True)  # Link to calendar event
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships with proper cascade
    # comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    activities = relationship("TaskActivity", back_populates="task", cascade="all, delete-orphan")

# class TaskComment(Base):
#     __tablename__ = "task_comments"
    
#     id = Column(Integer, primary_key=True, index=True)
#     task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     comment = Column(Text, nullable=False)
#     created_at = Column(DateTime, default=datetime.now)
    
#     # Relationships
#     task = relationship("Task", back_populates="comments")
#     user = relationship("User", backref="task_comments")

class TaskActivity(Base):
    __tablename__ = "task_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)  # created, updated, completed, assigned, archived, etc.
    old_value = Column(String, nullable=True)  # Previous value for updates
    new_value = Column(String, nullable=True)  # New value for updates
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    task = relationship("Task", back_populates="activities")
    user = relationship("User", backref="task_activities")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    user_id = Column(Integer, nullable=True)  # ✅ allow None
    # Google Calendar integration fields
    google_event_id = Column(String, nullable=True, unique=True)  # Google Calendar event ID
    google_calendar_id = Column(String, nullable=True)  # Google Calendar ID
    repeat = Column(String, nullable=True)  # none, daily, weekly, monthly
    category = Column(String, nullable=True)  # general, work, personal, meeting, google_sync, google_sync_completed
    linked_task = Column(String, nullable=True)  # linked task ID
    last_synced = Column(DateTime, nullable=True)  # last sync with Google Calendar
    synced_at = Column(DateTime, nullable=True)  # when this event was synced to Google Calendar
    
    # New fields for tab system
    archived = Column(Boolean, default=False)  # Archive status
    archived_at = Column(DateTime, nullable=True)  # When event was archived
    created_at = Column(DateTime, default=datetime.now)  # When event was created
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)  # Last update time
    
    # Two-way sync fields for Google Calendar
    needs_google_sync = Column(Boolean, default=False)  # Whether this event needs to be synced to Google Calendar
    is_deleted = Column(Boolean, default=False)  # Track deleted events for sync
    deleted_at = Column(DateTime, nullable=True)  # When event was deleted

class GoogleCalendarConnection(Base):
    __tablename__ = "google_calendar_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column(DateTime, nullable=False)
    calendar_ids = Column(JSON, nullable=True)  # List of calendar IDs to sync
    two_way_sync = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class GmailConnection(Base):
    __tablename__ = "gmail_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column(DateTime, nullable=False)
    last_sync = Column(DateTime, nullable=True)
    last_history_id = Column(String, nullable=True)  # Gmail history ID for incremental sync
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    gmail_id = Column(String, nullable=True, unique=True)  # Gmail message ID for deduplication
    thread_id = Column(String, nullable=True)  # Gmail thread ID
    sender = Column(String, nullable=False)
    to_recipients = Column(String, nullable=True)  # To field
    subject = Column(String, nullable=False)
    snippet = Column(Text, nullable=True)  # Gmail snippet for preview
    body = Column(Text, nullable=True)  # Full body (populated on-demand)
    body_cached = Column(Boolean, default=False)  # Whether body is cached
    body_cached_at = Column(DateTime, nullable=True)  # When body was cached
    has_attachment = Column(Boolean, default=False)  # Inferred from payload
    received_at = Column(DateTime, default=datetime.now)
    auto_reply = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # User who owns this email
    labels = Column(Text, nullable=True)  # JSON string of label names
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    # Reply and Forward fields
    in_reply_to = Column(Integer, ForeignKey("emails.id"), nullable=True)  # ID of email being replied to
    forwarded_from = Column(Integer, ForeignKey("emails.id"), nullable=True)  # ID of email being forwarded
    
    # Two-way sync fields
    needs_gmail_sync = Column(Boolean, default=False)  # Whether this email needs to be synced to Gmail
    last_gmail_sync = Column(DateTime, nullable=True)  # When this email was last synced to Gmail
    
    # Deletion tracking for Gmail sync
    is_deleted = Column(Boolean, default=False)  # Track deleted emails for sync
    deleted_at = Column(DateTime, nullable=True)  # When email was deleted
    
    # Labels stored as JSON array (inbox, sent, starred, trash, etc.)
    


class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False)
    gmail_attachment_id = Column(String, nullable=True)  # Gmail attachment ID
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size = Column(Integer, nullable=True)  # Size in bytes
    content_id = Column(String, nullable=True)  # Content-ID for inline attachments
    is_inline = Column(Boolean, default=False)  # Whether it's inline (CID) or regular attachment
    data = Column(Text, nullable=True)  # Base64 encoded data (for inline images)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship
    email = relationship("Email", backref="attachments")

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Working hours
    working_hours_start = Column(String, default="09:00")  # HH:MM format
    working_hours_end = Column(String, default="18:00")   # HH:MM format
    
    # Break preferences
    preferred_break_times = Column(String, default="12:00,15:00")  # Comma-separated HH:MM
    
    # Scheduling preferences
    min_gap_between_events = Column(Integer, default=15)  # minutes
    preferred_categories = Column(String, default="work,meeting")  # Comma-separated
    
    # Energy levels throughout the day
    morning_energy_level = Column(String, default="high")      # high/medium/low
    afternoon_energy_level = Column(String, default="medium") # high/medium/low
    evening_energy_level = Column(String, default="low")      # high/medium/low
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = relationship("User", backref="preferences")

class AIResponse(Base):
    __tablename__ = "ai_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    tone = Column(String, nullable=False)
    length = Column(String, nullable=False)
    email_context = Column(Text, nullable=True)
    generated_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = relationship("User", backref="ai_responses")

# Health & Fitness Models
class HealthRecord(Base):
    __tablename__ = "health_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    record_date = Column(Date, default=date.today)
    bmi = Column(Float, nullable=True)
    water_intake = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0)
    steps = Column(Integer, default=0)
    mood_score = Column(Integer, default=5)
    wellness_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class HealthReminder(Base):
    __tablename__ = "health_reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # medication, appointment, exercise, hydration, checkup
    time = Column(Time, nullable=False)
    reminder_date = Column(Date, nullable=False)
    frequency = Column(String(50), nullable=False)  # once, daily, weekly, monthly, hourly
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    last_taken = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)