from fastapi import APIRouter
from .auth import auth_router, google_auth_router
from .tasks import task_router
from .events.events import router as events_router
from .emails.emails import router as emails_router
from .google_calendar import router as google_calendar_router
from .gmail import router as gmail_router
from .smart_prioritization import router as smart_prioritization_router
from .ai import router as ai_router
from .health import health_router
from .voice_command import  voice_commands_router
from .activities import activities_router

api_router = APIRouter()

api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(google_auth_router, tags=["auth"])
api_router.include_router(task_router, tags=["tasks"])
api_router.include_router(events_router, tags=["events"])
api_router.include_router(emails_router, tags=["emails"])
api_router.include_router(google_calendar_router, tags=["google-calendar"])
api_router.include_router(gmail_router, tags=["gmail"])
api_router.include_router(smart_prioritization_router, tags=["smart-prioritization"])
api_router.include_router(ai_router, tags=["ai"])
api_router.include_router(health_router, tags=["health"])
api_router.include_router(voice_commands_router, tags=["voice-commands"])
api_router.include_router(activities_router, tags=["activities"])