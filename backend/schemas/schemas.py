from pydantic import BaseModel, EmailStr, field_validator, field_serializer
from datetime import datetime, date
from typing import Optional, List, Union
import json

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):  #  Added for login requests
   
    username: str  
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetCodeVerification(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class EmailVerification(BaseModel):
    email: EmailStr
    code: str

class ResendVerification(BaseModel):
    email: EmailStr

# Task Creation 

class TaskBase(BaseModel):
    title: str
    description: str
    due_date: datetime
    assigned_to: Optional[Union[int, str]] = None  # Can be user ID or username
    category: Optional[str] = None
    tags: Optional[str] = None
    estimated_minutes: Optional[int] = None
    urgency_score: Optional[int] = None
    position: Optional[int] = None

class TaskCreate(TaskBase):
    
    user_id: Optional[int] = None  # ✅ Optional since backend sets it automatically from session
    importance: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[Union[int, str]] = None  # Can be user ID or username
    category: Optional[str] = None
    tags: Optional[str] = None
    estimated_minutes: Optional[int] = None
    urgency_score: Optional[int] = None
    position: Optional[int] = None
    importance: Optional[int] = None
    completed: Optional[bool] = None
    user_id: Optional[int] = None
    archived: Optional[bool] = None
    linked_event_id: Optional[int] = None

class TaskOut(TaskBase):
    id: int
    completed: bool
    importance: int
    user_id: int
    user_username: Optional[str] = None  # Creator's username
    assigned_to: Optional[int] = None  # User ID
    assigned_to_username: Optional[str] = None  # Username for display
    category: Optional[str] = ""
    tags: Optional[str] = ""
    archived: bool = False
    archived_at: Optional[datetime] = None
    auto_archived: bool = False
    linked_event_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Task Comments and Activity
class TaskCommentCreate(BaseModel):
    comment: str

class TaskCommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    user_username: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


    class Config:
        from_attributes = True

class TaskActivityOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    user_username: str
    activity_type: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- ✅ Calendar Event Schemas ---

class EventCreate(BaseModel):
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    user_id: Optional[int] = None  # ✅ optional for frontend
    repeat: Optional[str] = 'none'
    category: Optional[str] = 'general'
    linked_task: Optional[str] = None
    google_calendar_id: Optional[str] = None  # For Google Calendar integration

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    user_id: Optional[int] = None
    repeat: Optional[str] = None
    category: Optional[str] = None
    linked_task: Optional[str] = None
    google_calendar_id: Optional[str] = None  # For Google Calendar integration

class EventOut(EventCreate):
    id: int
    google_event_id: Optional[str] = None
    google_calendar_id: Optional[str] = None
    last_synced: Optional[datetime] = None
    synced_at: Optional[datetime] = None  # When event was synced to Google Calendar
    
    # New fields for tab system
    archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # ✅ required for Pydantic v2

# --- ✅ Google Calendar Integration Schemas ---

class GoogleCalendarConnectionCreate(BaseModel):
    user_id: int
    access_token: str
    refresh_token: str
    token_expiry: datetime
    calendar_ids: Optional[List[str]] = None
    two_way_sync: bool = True

class GoogleCalendarConnectionUpdate(BaseModel):
    calendar_ids: Optional[List[str]] = None
    two_way_sync: Optional[bool] = None

class GoogleCalendarConnectionOut(BaseModel):
    id: int
    user_id: int
    calendar_ids: Optional[List[str]] = None
    two_way_sync: bool
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoogleCalendarInfo(BaseModel):
    id: str
    summary: str
    description: Optional[str] = None
    primary: bool = False

class GoogleCalendarSyncRequest(BaseModel):
    calendar_ids: List[str]
    two_way_sync: bool = True

class GoogleCalendarSyncResponse(BaseModel):
    message: str
    events_synced_to_local: int
    events_synced_to_google: int
    total_events_synced: int
    last_sync: datetime

# --- ✅ Gmail Integration Schemas ---

class GmailConnectionCreate(BaseModel):
    user_id: int
    access_token: str
    refresh_token: str
    token_expiry: datetime

class GmailConnectionOut(BaseModel):
    id: int
    user_id: int
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GmailMessage(BaseModel):
    id: str
    thread_id: str
    snippet: str
    internal_date: str
    payload: dict
    label_ids: List[str]

class GmailSyncResponse(BaseModel):
    message: str
    emails_synced: int
    last_sync: datetime

# --- ✅ Email Schemas ---

class EmailBase(BaseModel):
    sender: str
    to_recipients: Optional[str] = None
    subject: str
    snippet: Optional[str] = None
    body: Optional[str] = None
    body_cached: Optional[bool] = False
    body_cached_at: Optional[datetime] = None
    has_attachment: Optional[bool] = False
    category: Optional[str] = None
    received_at: Optional[datetime] = None
    auto_reply: Optional[str] = ""
    in_reply_to: Optional[int] = None
    thread_id: Optional[str] = None
    forwarded_from: Optional[int] = None
    labels: Optional[List[str]] = []
    status: Optional[str] = "draft"

    @field_validator('labels', mode='before')
    @classmethod
    def parse_labels(cls, v):
        """Convert JSON string to list if needed"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        elif isinstance(v, list):
            return v
        else:
            return []

    @field_serializer('labels')
    def serialize_labels(self, labels):
        """Ensure labels are always returned as a list"""
        if isinstance(labels, str):
            try:
                return json.loads(labels)
            except (json.JSONDecodeError, TypeError):
                return []
        elif isinstance(labels, list):
            return labels
        else:
            return []

class EmailLabelBase(BaseModel):
    label_name: str
    label_type: str

class EmailLabelResponse(EmailLabelBase):
    id: int
    email_id: int
    created_at: datetime

    class Config:
        from_attributes = True



class EmailResponse(EmailBase):
    id: int
    gmail_id: Optional[str] = None
    thread_id: Optional[str] = None
    user_id: Optional[int] = None
    received_at: datetime
    auto_reply: str
    labels: Optional[List[str]] = []  # Labels as array of strings (e.g., ["inbox", "starred"])
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmailAttachmentBase(BaseModel):
    filename: str
    mime_type: str
    size: Optional[int] = None
    content_id: Optional[str] = None
    is_inline: bool = False
    data: Optional[str] = None  # Base64 data for inline images

class EmailCreate(EmailBase):
    attachments: Optional[List[EmailAttachmentBase]] = []

class EmailAttachmentCreate(EmailAttachmentBase):
    email_id: int
    gmail_attachment_id: Optional[str] = None

class EmailAttachmentResponse(EmailAttachmentBase):
    id: int
    email_id: int
    gmail_attachment_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmailWithAttachmentsResponse(EmailResponse):
    attachments: List[EmailAttachmentResponse] = []

class PaginatedEmailResponse(BaseModel):
    results: List[EmailResponse]
    totalEmails: int
    totalPages: int
    currentPage: int
    pageSize: int


# --- ✅ Smart Suggestions Response (Optional) ---

class TimeSlot(BaseModel):
    start: str
    end: str

# --- ✅ Smart Prioritization Schemas ---

class UserPreferencesUpdate(BaseModel):
    working_hours_start: Optional[str] = "09:00"
    working_hours_end: Optional[str] = "18:00"
    preferred_break_times: Optional[str] = "12:00,15:00"  # Comma-separated
    min_gap_between_events: Optional[int] = 15
    preferred_categories: Optional[str] = "work,meeting"  # Comma-separated
    morning_energy_level: Optional[str] = "high"  # high/medium/low
    afternoon_energy_level: Optional[str] = "medium"  # high/medium/low
    evening_energy_level: Optional[str] = "low"  # high/medium/low

class ScheduleSuggestion(BaseModel):
    start_hour: int
    start_time: str
    end_hour: int
    end_time: str
    duration_hours: int
    conflicts: int
    gap_violations: int
    score: int
    final_score: int

class ScheduleSuggestionsResponse(BaseModel):
    suggestions: List[ScheduleSuggestion]
    total_slots_found: int
    analysis: dict

class ConflictAnalysis(BaseModel):
    event: dict
    conflicts: dict
    suggestions: List[dict]

class UserPreferencesResponse(BaseModel):
    working_hours_start: str
    working_hours_end: str
    preferred_break_times: List[str]
    min_gap_between_events: int
    preferred_categories: List[str]
    energy_levels: dict

# --- ✅ AI Response Schemas ---
class AIResponseCreate(BaseModel):
    prompt: str
    tone: str = "professional"
    length: str = "medium"
    email_context: Optional[str] = None

class AIResponseHistory(BaseModel):
    id: int
    user_id: int
    prompt: str
    tone: str
    length: str
    email_context: Optional[str] = None
    generated_response: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Health & Fitness Schemas
class HealthRecordBase(BaseModel):
    user_id: int
    record_date: date
    bmi: Optional[float] = None
    water_intake: int = 0
    sleep_hours: float = 0
    steps: int = 0
    mood_score: int = 5
    wellness_score: int = 0

class HealthRecordCreate(HealthRecordBase):
    pass

class HealthRecordUpdate(BaseModel):
    bmi: Optional[float] = None
    water_intake: Optional[int] = None
    sleep_hours: Optional[float] = None
    steps: Optional[int] = None
    mood_score: Optional[int] = None
    wellness_score: Optional[int] = None

class HealthRecordResponse(HealthRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HealthReminderBase(BaseModel):
    user_id: int
    title: str
    type: str
    time: str  # HH:MM format
    reminder_date: date
    frequency: str
    notes: Optional[str] = None
    active: bool = True

class HealthReminderCreate(HealthReminderBase):
    pass

class HealthReminderUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    time: Optional[str] = None
    reminder_date: Optional[date] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None

class HealthReminderResponse(HealthReminderBase):
    id: int
    last_taken: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HealthDataForAI(BaseModel):
    bmi: Optional[float] = None
    water_intake: int = 0
    sleep_hours: float = 0
    steps: int = 0
    mood_score: int = 5
    wellness_score: int = 0
    user_age: Optional[int] = None
    user_gender: Optional[str] = None
    user_activity_level: Optional[str] = None