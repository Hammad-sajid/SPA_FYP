import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import httpx
import json
from datetime import datetime, timedelta
import os
import sys

# Add the backend directory to the Python path
# sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import get_db
import models as models
import schemas as schemas   
from config.google import google_config
from routes.auth.session import get_user_id

router = APIRouter(prefix="/google-calendar", tags=["Google Calendar"])

# Request model for OAuth callback
class OAuthCallbackRequest(BaseModel):
    code: str

def get_current_user_id(request: Request) -> int:
    """Extract user ID from session cookie"""
    session_id = request.cookies.get("session_id")
    logger.info(f"Google Calendar - Session ID from cookie: {session_id}")
    
    if not session_id:
        logger.warning("Google Calendar - No session_id cookie found")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Use the proper session validation function
    user_id = get_user_id(session_id)
    logger.info(f"Google Calendar - User ID from session: {user_id}")
    
    if not user_id:
        logger.warning(f"Google Calendar - Invalid or expired session: {session_id}")
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return user_id

@router.get("/config")
def get_google_calendar_config():
    """Get Google Calendar configuration for frontend (without sensitive data)"""
    logger.info("Google Calendar - Config endpoint called")
    if not google_config.is_calendar_configured():
        raise HTTPException(status_code=500, detail="Google Calendar not configured")
    
    return {
        "calendar_redirect_uri": google_config.GOOGLE_CALENDAR_REDIRECT_URI,
        "calendar_scopes": google_config.GOOGLE_CALENDAR_SCOPES
    }

@router.get("/auth-url")
def get_auth_url(request: Request):
    """Get Google OAuth2 authorization URL"""
    logger.info("Google Calendar - Auth URL endpoint called")
    
    # Check if user is already authenticated with Google
    session_id = request.cookies.get("session_id")
    if session_id:
        try:
            # Try to get user info to check if they're Google-authenticated
            user_id = get_user_id(session_id)
            if user_id:
                # Check if user has google_id in database
                db = next(get_db())
                user = db.query(models.User).filter(models.User.id == user_id).first()
                if user and user.google_id:
                    logger.info(f"Google Calendar - User {user_id} already authenticated with Google")
                    # Still return auth URL for calendar access
                    pass
        except Exception as e:
            logger.warning(f"Google Calendar - Error checking user auth status: {str(e)}")
            # Continue with OAuth if there's an error
    
    # User needs OAuth for calendar access (either not logged in, not Google-authenticated, or needs calendar permissions)
    logger.info("Google Calendar - User needs OAuth authentication for calendar access")
    
    # Validate configuration
    if not google_config.is_calendar_configured():
        logger.error("Google Calendar - Calendar OAuth not configured")
        raise HTTPException(status_code=500, detail="Google Calendar OAuth not configured")
    
    params = {
        "client_id": google_config.get_calendar_client_id(),
        "redirect_uri": google_config.GOOGLE_CALENDAR_REDIRECT_URI,
        "scope": google_config.get_calendar_scopes(),
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    auth_url = f"{google_config.GOOGLE_AUTH_URL}?{query_string}"
    
    logger.info("Google Calendar - Generated OAuth URL for user")
    return {
        "auth_required": True,
        "auth_url": auth_url,
        "message": "OAuth authentication required for calendar access"
    }

@router.get("/callback")
async def handle_oauth_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback from Google"""
    logger.info("Google Calendar - OAuth callback received")
    
    # Parse query parameters
    code = request.query_params.get('code')
    error = request.query_params.get('error')
    
    if error:
        logger.error(f"Google Calendar - OAuth error: {error}")
        # Redirect to frontend with error
        error_url = f"{google_config.GOOGLE_CALENDAR_REDIRECT_URI}?error={error}"
        return RedirectResponse(url=error_url)
    
    if not code:
        logger.error("Google Calendar - No authorization code received")
        # Redirect to frontend with error
        error_url = f"{google_config.GOOGLE_CALENDAR_REDIRECT_URI}?error=no_code"
        return RedirectResponse(url=error_url)
    
    logger.info(f"Google Calendar - Authorization code received: {code[:10]}...")
    
    # Store the code temporarily (you might want to use a more secure method)
    # For now, we'll redirect to frontend with the code
    success_url = f"{google_config.GOOGLE_CALENDAR_REDIRECT_URI}?code={code}"
    return RedirectResponse(url=success_url)

@router.post("/exchange-token")
async def exchange_token_for_calendar(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Exchange authorization code for tokens (called by frontend)"""
    logger.info(f"Google Calendar - Token exchange requested for user {current_user_id}")
    logger.info(f"Google Calendar - Authorization code: {request.code[:10]}...")
    
    # Validate configuration
    if not google_config.is_calendar_configured():
        logger.error("Google Calendar - Calendar OAuth not configured")
        raise HTTPException(status_code=500, detail="Google Calendar OAuth not configured")
    
    # Exchange authorization code for tokens
    token_data = {
        "client_id": google_config.get_calendar_client_id(),
        "client_secret": google_config.get_calendar_client_secret(),
        "code": request.code,
        "grant_type": "authorization_code",
        "redirect_uri": google_config.GOOGLE_CALENDAR_REDIRECT_URI
    }
    
    logger.info("Google Calendar - Exchanging code for tokens...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(google_config.GOOGLE_TOKEN_URL, data=token_data)
        
        if response.status_code != 200:
            logger.error(f"Google Calendar - Token exchange failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
        
        tokens = response.json()
        logger.info("Google Calendar - Tokens received successfully")
        
        # Verify that we received the necessary scopes
        if 'scope' in tokens:
            granted_scopes = tokens['scope'].split(' ')
            logger.info(f"Google Calendar - Granted scopes: {granted_scopes}")
            
            # Check if we have calendar access
            required_scopes = [
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.calendars",
                "https://www.googleapis.com/auth/calendar.calendars.readonly"
            ]
            
            has_calendar_access = any(scope in granted_scopes for scope in required_scopes)
            if not has_calendar_access:
                logger.warning("Google Calendar - OAuth granted but missing calendar permissions")
                logger.warning(f"Required scopes: {required_scopes}")
                logger.warning(f"Granted scopes: {granted_scopes}")
                raise HTTPException(
                    status_code=400, 
                    detail="OAuth completed but calendar permissions were not granted. Please try again and ensure you grant 'See and manage your calendars' permission."
                )
        else:
            logger.warning("Google Calendar - No scope information in token response")
            raise HTTPException(
                status_code=400, 
                detail="OAuth completed but no permission information received. Please try again."
            )
        
        # Calculate token expiry
        expires_in = tokens.get("expires_in", 3600)
        token_expiry = datetime.now() + timedelta(seconds=expires_in)
        
        # Save or update connection in database
        existing_connection = db.query(models.GoogleCalendarConnection).filter(
            models.GoogleCalendarConnection.user_id == current_user_id
        ).first()
        
        if existing_connection:
            logger.info(f"Google Calendar - Updating existing connection for user {current_user_id}")
            existing_connection.access_token = tokens["access_token"]
            existing_connection.refresh_token = tokens.get("refresh_token", existing_connection.refresh_token)
            existing_connection.token_expiry = token_expiry
            existing_connection.updated_at = datetime.now()
        else:
            logger.info(f"Google Calendar - Creating new connection for user {current_user_id}")
            new_connection = models.GoogleCalendarConnection(
                user_id=current_user_id,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token", ""),
                token_expiry=token_expiry,
                two_way_sync=True
            )
            db.add(new_connection)
        
        db.commit()
        logger.info(f"Google Calendar - Connection saved successfully for user {current_user_id}")
        
        return {"message": "Successfully connected to Google Calendar"}

@router.get("/calendars")
def get_calendars(
    request: Request,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get user's Google calendars"""
    logger.info(f"Google Calendar - Calendars endpoint called for user {current_user_id}")
    
    connection = db.query(models.GoogleCalendarConnection).filter(
        models.GoogleCalendarConnection.user_id == current_user_id
    ).first()
    
    if not connection:
        logger.warning(f"Google Calendar - No connection found for user {current_user_id}")
        raise HTTPException(status_code=404, detail="Google Calendar not connected")
    
    logger.info(f"Google Calendar - Connection found for user {current_user_id}")
    
    # Check if token is expired and refresh if needed
    if connection.token_expiry <= datetime.now():
        logger.info(f"Google Calendar - Token expired for user {current_user_id}, refreshing...")
        try:
            connection = refresh_access_token(db, connection)
        except HTTPException as e:
            # Re-raise HTTPExceptions as-is
            raise
        except Exception as e:
            logger.error(f"Google Calendar - Failed to refresh token for user {current_user_id}: {str(e)}")
            raise HTTPException(status_code=401, detail="Failed to refresh access token")
    
    # Fetch calendars from Google
    headers = {"Authorization": f"Bearer {connection.access_token}"}
    
    try:
        with httpx.Client() as client:
            # First, test the token with a simple API call
            test_response = client.get(f"{google_config.GOOGLE_CALENDAR_API}/users/me", headers=headers)
            if test_response.status_code == 401:
                logger.error(f"Google Calendar - Token invalid for user {current_user_id}")
                raise HTTPException(status_code=401, detail="Google Calendar access token is invalid")
            
            # Now fetch the calendar list
            response = client.get(f"{google_config.GOOGLE_CALENDAR_API}/users/me/calendarList", headers=headers)
            
            # Check response status before processing
            if response.status_code == 403:
                logger.error(f"Google Calendar - Insufficient permissions for user {current_user_id}")
                raise HTTPException(
                    status_code=403, 
                    detail="Insufficient permissions. The OAuth flow didn't grant calendar access. Please disconnect and reconnect, ensuring you grant 'See and manage your calendars' permission during the Google authorization."
                )
            elif response.status_code == 401:
                logger.error(f"Google Calendar - Authentication failed for user {current_user_id}")
                raise HTTPException(
                    status_code=401,
                    detail="Authentication failed. Please reconnect your Google Calendar account."
                )
            elif response.status_code != 200:
                logger.error(f"Google Calendar - API returned status {response.status_code} for user {current_user_id}")
                raise HTTPException(status_code=response.status_code, detail=f"Google Calendar API error: {response.status_code}")
            
            # Process successful response
            calendars_data = response.json()
            calendars = []
            
            for cal in calendars_data.get("items", []):
                calendars.append({
                    "id": cal["id"],
                    "summary": cal.get("summary", "Untitled"),
                    "description": cal.get("description"),
                    "primary": cal.get("primary", False)
                })
            
            logger.info(f"Google Calendar - Retrieved {len(calendars)} calendars for user {current_user_id}")
            return calendars
            
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        logger.error(f"Google Calendar - Failed to fetch calendars for user {current_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendars: {str(e)}")

@router.post("/sync")
async def sync_calendars(
    sync_request: schemas.GoogleCalendarSyncRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Simple two-way sync: Local events → Google Calendar, Google Calendar events → Local"""
    logger.info(f"Google Calendar - Two-way sync request from user {current_user_id}")
    
    connection = db.query(models.GoogleCalendarConnection).filter(
        models.GoogleCalendarConnection.user_id == current_user_id
    ).first()
    
    if not connection:
        logger.warning(f"Google Calendar - User {current_user_id} tried to sync without connection")
        raise HTTPException(status_code=404, detail="Google Calendar not connected")
    
    connection.last_sync = datetime.now()
    
    # Check if token is expired and refresh if needed
    if connection.token_expiry <= datetime.now():
        logger.info(f"Google Calendar - Refreshing expired token for user {current_user_id}")
        try:
            connection = refresh_access_token(db, connection)
        except Exception as e:
            logger.error(f"Google Calendar - Failed to refresh token for user {current_user_id}: {str(e)}")
            raise HTTPException(
                status_code=401, 
                detail="Authentication failed. Please reconnect your Google Calendar account."
            )
    
    events_synced_to_local = 0
    events_synced_to_google = 0
    
    try:
        # Step 1: Sync events from Google Calendar to local database
        logger.info(f"Google Calendar - Syncing events FROM Google Calendar to local for user {current_user_id}")
        for calendar_id in sync_request.calendar_ids:
            events_synced_to_local += await sync_calendar_events(db, connection, calendar_id, current_user_id)
        
        # Step 2: Sync events from local database to Google Calendar
        logger.info(f"Google Calendar - Syncing events FROM local to Google Calendar for user {current_user_id}")
        events_synced_to_google += await sync_local_events_to_google(db, connection, current_user_id)
        
        db.commit()
        
        logger.info(f"Google Calendar - Two-way sync completed for user {current_user_id}: {events_synced_to_local} events synced to local, {events_synced_to_google} events synced to Google")
        
        return {
            "message": "Two-way calendar sync completed successfully",
            "events_synced_to_local": events_synced_to_local,
            "events_synced_to_google": events_synced_to_google,
            "total_events_synced": events_synced_to_local + events_synced_to_google,
            "last_sync": connection.last_sync
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Google Calendar - Two-way sync failed for user {current_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Two-way sync failed: {str(e)}")

@router.delete("/disconnect")
def disconnect_calendar(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Disconnect Google Calendar"""
    connection = db.query(models.GoogleCalendarConnection).filter(
        models.GoogleCalendarConnection.user_id == current_user_id
    ).first()
    
    if connection:
        db.delete(connection)
        db.commit()
    
    return {"message": "Google Calendar disconnected successfully"}

@router.get("/test-connection")
def test_google_calendar_connection(
    request: Request,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Test Google Calendar connection and permissions"""
    logger.info(f"Google Calendar - Testing connection for user {current_user_id}")
    
    connection = db.query(models.GoogleCalendarConnection).filter(
        models.GoogleCalendarConnection.user_id == current_user_id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")
    
    # Check if token is expired
    if connection.token_expiry <= datetime.now():
        logger.info(f"Google Calendar - Token expired for user {current_user_id}, attempting refresh...")
        try:
            connection = refresh_access_token(db, connection)
        except HTTPException as e:
            logger.error(f"Google Calendar - Token refresh failed with HTTP error: {e.status_code}")
            return {
                "status": "error",
                "message": "Token refresh failed",
                "error": e.detail,
                "token_expiry": connection.token_expiry.isoformat()
            }
        except Exception as e:
            logger.error(f"Google Calendar - Failed to refresh token: {str(e)}")
            return {
                "status": "error",
                "message": "Token refresh failed",
                "error": str(e),
                "token_expiry": connection.token_expiry.isoformat()
            }
    
    # Test the connection with Google
    headers = {"Authorization": f"Bearer {connection.access_token}"}
    
    try:
        with httpx.Client() as client:
            # Test basic access
            test_response = client.get(f"{google_config.GOOGLE_CALENDAR_API}/users/me", headers=headers)
            
            if test_response.status_code == 200:
                user_info = test_response.json()
                logger.info(f"Google Calendar - Basic access successful for user {current_user_id}")
                
                # Test calendar list access
                calendar_response = client.get(f"{google_config.GOOGLE_CALENDAR_API}/users/me/calendarList", headers=headers)
                
                if calendar_response.status_code == 200:
                    calendar_data = calendar_response.json()
                    calendar_count = len(calendar_data.get("items", []))
                    logger.info(f"Google Calendar - Calendar access successful, found {calendar_count} calendars")
                    
                    return {
                        "status": "success",
                        "message": "Connection successful",
                        "user_email": user_info.get("email"),
                        "calendar_count": calendar_count,
                        "token_expiry": connection.token_expiry.isoformat(),
                        "scopes_granted": "calendar access confirmed"
                    }
                else:
                    logger.warning(f"Google Calendar - Calendar access failed: {calendar_response.status_code}")
                    return {
                        "status": "partial",
                        "message": "Basic access works but calendar access failed",
                        "user_email": user_info.get("email"),
                        "error": f"Calendar access returned {calendar_response.status_code}",
                        "token_expiry": connection.token_expiry.isoformat()
                    }
            else:
                logger.error(f"Google Calendar - Basic access failed: {test_response.status_code}")
                return {
                    "status": "error",
                    "message": "Basic access failed",
                    "error": f"HTTP {test_response.status_code}",
                    "token_expiry": connection.token_expiry.isoformat()
                }
                
    except Exception as e:
        logger.error(f"Google Calendar - Connection test failed: {str(e)}")
        return {
            "status": "error",
            "message": "Connection test failed",
            "error": str(e),
            "token_expiry": connection.token_expiry.isoformat()
        }


 
async def sync_calendar_events(db: Session, connection: models.GoogleCalendarConnection, calendar_id: str, user_id: int) -> int:
    """Sync events from a specific Google Calendar"""
    headers = {"Authorization": f"Bearer {connection.access_token}"}
    
    # Get events from the last 30 days and next 30 days
    now = datetime.now()
    time_min = (now - timedelta(days=30)).isoformat() + "Z"
    time_max = (now + timedelta(days=30)).isoformat() + "Z"
    
    params = {
        "timeMin": time_min,
        "timeMax": time_max,
        "singleEvents": True,
        "orderBy": "startTime"
    }
    
    try:
        with httpx.Client() as client:
            # URL encode the calendar_id to handle special characters like #
            import urllib.parse
            encoded_calendar_id = urllib.parse.quote(calendar_id, safe='')
            
            response = client.get(
                f"{google_config.GOOGLE_CALENDAR_API}/calendars/{encoded_calendar_id}/events",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            
            events_data = response.json()
            events = events_data.get("items", [])
            
            logger.info(f"Google Calendar - Found {len(events)} events in calendar {calendar_id}")
            
            events_synced = 0
            
            for event in events:
                try:
                    # Validate required fields
                    if not all(key in event for key in ["id", "start", "end"]):
                        logger.warning(f"Google Calendar - Skipping event with missing required fields: {event.get('summary', 'Unknown')}")
                        continue
                    
                    # Check if event already exists using multiple criteria to prevent duplicates
                    existing_event = db.query(models.Event).filter(
                        models.Event.user_id == user_id,
                        models.Event.google_event_id == event["id"]
                    ).first()
                    
                    # If not found by google_event_id, check by title + start_time + calendar_id
                    if not existing_event:
                        existing_event = db.query(models.Event).filter(
                            models.Event.user_id == user_id,
                            models.Event.title == event.get("summary", "Untitled Event"),
                            models.Event.start_time == parse_google_datetime(event["start"]),
                            models.Event.google_calendar_id == calendar_id
                        ).first()
                    
                    if not existing_event:
                        # Create new event
                        new_event = models.Event(
                            title=event.get("summary", "Untitled Event"),
                            description=event.get("description", ""),
                            start_time=parse_google_datetime(event["start"]),
                            end_time=parse_google_datetime(event["end"]),
                            user_id=user_id,
                            category="google_sync",
                            google_event_id=event["id"],
                            google_calendar_id=calendar_id
                        )
                        db.add(new_event)
                        events_synced += 1
                        logger.debug(f"Google Calendar - Added event: {new_event.title}")
                    else:
                        logger.debug(f"Google Calendar - Event already exists: {event.get('summary', 'Unknown')} (ID: {existing_event.id})")
                        
                except Exception as e:
                    logger.error(f"Google Calendar - Error processing event {event.get('summary', 'Unknown')}: {str(e)}")
                    continue  # Skip this event and continue with others
            
            logger.info(f"Google Calendar - Synced {events_synced} new events from calendar {calendar_id}")
            return events_synced
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Google Calendar - HTTP error syncing calendar {calendar_id}: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=500, detail=f"Failed to sync calendar {calendar_id}: HTTP {e.response.status_code}")
    except Exception as e:
        logger.error(f"Google Calendar - Failed to sync calendar {calendar_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sync calendar {calendar_id}: {str(e)}")

async def sync_local_events_to_google(db: Session, connection: models.GoogleCalendarConnection, user_id: int) -> int:
    """Sync events from local database to Google Calendar (primary calendar only)"""
    headers = {"Authorization": f"Bearer {connection.access_token}"}
    
    events_synced = 0
    events_deleted = 0
    
    # Step 1: Handle deletions first (events marked as deleted)
    deleted_events = db.query(models.Event).filter(
        models.Event.user_id == user_id,
        models.Event.is_deleted == True,
        models.Event.google_event_id.isnot(None),
        models.Event.needs_google_sync == True
    ).all()
    
    logger.info(f"Google Calendar - Found {len(deleted_events)} deleted events to sync to Google Calendar")
    
    for event in deleted_events:
        try:
            with httpx.Client() as client:
                # Delete from Google Calendar
                response = client.delete(
                    f"{google_config.GOOGLE_CALENDAR_API}/calendars/primary/events/{event.google_event_id}",
                    headers=headers
                )
                
                if response.status_code == 204:  # Successfully deleted
                    logger.info(f"Google Calendar - Successfully deleted event '{event.title}' from Google Calendar")
                    events_deleted += 1
                    
                    # Now delete from local DB
                    db.delete(event)
                else:
                    logger.error(f"Google Calendar - Failed to delete event '{event.title}' from Google: {response.status_code}")
                    # Mark as not needing sync to avoid retry loops
                    event.needs_google_sync = False
                    
        except Exception as e:
            logger.error(f"Google Calendar - Error deleting event '{event.title}' from Google: {str(e)}")
            # Mark as not needing sync to avoid retry loops
            event.needs_google_sync = False
            continue
    
    # Step 2: Handle new events (not yet synced to Google)
    local_events = db.query(models.Event).filter(
        models.Event.user_id == user_id,
        models.Event.google_event_id.is_(None),  # Events not yet synced to Google
        models.Event.is_deleted == False,  # Only sync non-deleted events
        models.Event.needs_google_sync == True
    ).all()
    
    logger.info(f"Google Calendar - Found {len(local_events)} new local events to sync to Google Calendar")
    
    for event in local_events:
        try:
            # Always sync to primary calendar for simplicity
            target_calendar = "primary"
            
            # Check if this event already exists in Google Calendar to prevent duplicates
            # Search by title and start time
            try:
                with httpx.Client() as client:
                    # Search for existing events with similar title and time
                    search_params = {
                        "q": event.title,
                        "timeMin": (event.start_time - timedelta(minutes=5)).isoformat() + "Z",
                        "timeMax": (event.start_time + timedelta(minutes=5)).isoformat() + "Z",
                        "singleEvents": True
                    }
                    
                    search_response = client.get(
                        f"{google_config.GOOGLE_CALENDAR_API}/calendars/primary/events",
                        headers=headers,
                        params=search_params
                    )
                    
                    if search_response.status_code == 200:
                        existing_google_events = search_response.json().get("items", [])
                        
                        # Check if we found a matching event
                        for google_event in existing_google_events:
                            if (google_event.get("summary") == event.title and
                                abs((parse_google_datetime(google_event["start"]) - event.start_time).total_seconds()) < 300):  # 5 minutes tolerance
                                
                                logger.info(f"Google Calendar - Event '{event.title}' already exists in Google Calendar, linking instead of creating")
                                
                                # Link the existing Google event to our local event
                                event.google_event_id = google_event["id"]
                                event.category = "google_sync_completed"
                                event.synced_at = datetime.now()
                                event.needs_google_sync = False
                                events_synced += 1
                                
                                # Skip creating a new event
                                continue
            except Exception as e:
                logger.warning(f"Google Calendar - Could not check for existing events: {str(e)}")
                # Continue with creating the event
            
            # Convert local times to UTC for Google Calendar API
            from datetime import timezone
            import time
            
            # Convert local datetime to UTC
            def local_to_utc(local_time):
                # If no timezone info, assume it's local system time
                if local_time.tzinfo is None:
                    # Get the system's timezone offset
                    # This handles daylight saving time automatically
                    offset_seconds = -time.timezone if not time.daylight else -time.altzone
                    offset_hours = offset_seconds // 3600
                    
                    # Create a timezone object with the local offset
                    local_tz = timezone(timedelta(hours=offset_hours))
                    
                    # Make the local time timezone-aware, then convert to UTC
                    local_time_with_tz = local_time.replace(tzinfo=local_tz)
                    utc_time = local_time_with_tz.astimezone(timezone.utc)
                    
                    logger.info(f"  Timezone conversion: Local offset = UTC{offset_hours:+d}, {local_time} -> {utc_time}")
                    return utc_time
                else:
                    # Already has timezone info, convert to UTC
                    return local_time.astimezone(timezone.utc)
            
            # Convert start and end times to UTC
            utc_start = local_to_utc(event.start_time)
            utc_end = local_to_utc(event.end_time)
            
            logger.info(f"Google Calendar - Converting times for event '{event.title}':")
            logger.info(f"  Local start: {event.start_time} -> UTC start: {utc_start}")
            logger.info(f"  Local end: {event.end_time} -> UTC end: {utc_end}")
            
            # Prepare event data for Google Calendar API
            event_data = {
                "summary": event.title,
                "description": event.description,
                "start": {
                    "dateTime": utc_start.isoformat(),
                    "timeZone": "UTC"  # Explicitly specify UTC
                },
                "end": {
                    "dateTime": utc_end.isoformat(),
                    "timeZone": "UTC"  # Explicitly specify UTC
                },
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": 10},
                        {"method": "popup", "minutes": 10}
                    ]
                }
            }
            
            logger.info(f"Google Calendar - Syncing local event: {event.title} (Category: {event.category}) to primary calendar")
            
            with httpx.Client() as client:
                response = client.post(
                    f"{google_config.GOOGLE_CALENDAR_API}/calendars/primary/events",
                    headers=headers,
                    json=event_data
                )
                response.raise_for_status()
                
                synced_event = response.json()
                logger.info(f"Google Calendar - Local event {event.title} synced to Google: {synced_event.get('id')}")
                events_synced += 1
                
                # Update the local event's google_event_id to the synced one
                event.google_event_id = synced_event.get("id")
                event.category = "google_sync_completed" # Mark as completed
                event.synced_at = datetime.now() # Track when synced to Google
                event.needs_google_sync = False # Mark as synced
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Google Calendar - HTTP error syncing local event {event.title}: {e.response.status_code} - {e.response.text}")
            # Don't raise here, continue with other events
            continue
        except Exception as e:
            logger.error(f"Google Calendar - Failed to sync local event {event.title}: {str(e)}")
            # Don't raise here, continue with other events
            continue
    
    logger.info(f"Google Calendar - Successfully synced {events_synced} new events and deleted {events_deleted} events for user {user_id}")
    return events_synced + events_deleted

@router.post("/create-event")
async def create_local_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new local calendar event that can be synced to Google Calendar"""
    logger.info(f"Google Calendar - Creating local event for user {current_user_id}")
    
    # Check if user has Google Calendar connection
    connection = db.query(models.GoogleCalendarConnection).filter(
        models.GoogleCalendarConnection.user_id == current_user_id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")
    
    # Create the local event
    db_event = models.Event(
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        user_id=current_user_id,
        category="google_sync",  # Mark for syncing to Google
        google_calendar_id=event.google_calendar_id or "primary",  # Default to primary calendar
        repeat=event.repeat,
        linked_task=event.linked_task
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    logger.info(f"Google Calendar - Created local event {db_event.title} for user {current_user_id}")
    
    return {
        "message": "Local event created successfully",
        "event": db_event,
        "note": "Event will be synced to Google Calendar on next sync operation"
    }

@router.get("/events")
def get_local_events(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all local calendar events for the current user"""
    logger.info(f"Google Calendar - Getting local events for user {current_user_id}")
    
    events = db.query(models.Event).filter(
        models.Event.user_id == current_user_id
    ).order_by(models.Event.start_time.asc()).all()
    
    logger.info(f"Google Calendar - Found {len(events)} local events for user {current_user_id}")
    
    return events

@router.put("/events/{event_id}")
def update_local_event(
    event_id: int,
    event_update: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a local calendar event"""
    logger.info(f"Google Calendar - Updating local event {event_id} for user {current_user_id}")
    
    # Get the event
    db_event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user_id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update fields
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    # Mark for re-syncing if it was previously synced
    if db_event.category == "google_sync_completed":
        db_event.category = "google_sync"
        db_event.synced_at = None
    
    db.commit()
    db.refresh(db_event)
    
    logger.info(f"Google Calendar - Updated local event {db_event.title} for user {current_user_id}")
    
    return {
        "message": "Event updated successfully",
        "event": db_event,
        "note": "Event will be re-synced to Google Calendar on next sync operation"
    }

@router.delete("/events/{event_id}")
def delete_local_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a local calendar event"""
    logger.info(f"Google Calendar - Deleting local event {event_id} for user {current_user_id}")
    
    # Get the event
    db_event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user_id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # If event was synced to Google, we should also delete it there
    if db_event.google_event_id and db_event.google_calendar_id:
        try:
            connection = db.query(models.GoogleCalendarConnection).filter(
                models.GoogleCalendarConnection.user_id == current_user_id
            ).first()
            
            if connection:
                headers = {"Authorization": f"Bearer {connection.access_token}"}
                import urllib.parse
                encoded_calendar_id = urllib.parse.quote(db_event.google_calendar_id, safe='')
                
                with httpx.Client() as client:
                    response = client.delete(
                        f"{google_config.GOOGLE_CALENDAR_API}/calendars/{encoded_calendar_id}/events/{db_event.google_event_id}",
                        headers=headers
                    )
                    if response.status_code == 204:  # Successfully deleted
                        logger.info(f"Google Calendar - Deleted event {db_event.title} from Google Calendar")
                    else:
                        logger.warning(f"Google Calendar - Failed to delete event from Google Calendar: {response.status_code}")
        except Exception as e:
            logger.error(f"Google Calendar - Error deleting event from Google Calendar: {str(e)}")
            # Continue with local deletion even if Google deletion fails
    
    # Delete the local event
    db.delete(db_event)
    db.commit()
    
    logger.info(f"Google Calendar - Deleted local event {event_id} for user {current_user_id}")
    
    return {"message": "Event deleted successfully"}

@router.post("/cleanup-duplicates")
async def cleanup_duplicate_events(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Clean up duplicate events in the database"""
    logger.info(f"Google Calendar - Starting duplicate cleanup for user {current_user_id}")
    
    try:
        # Find duplicate events by title, start_time, and user_id
        from sqlalchemy import func
        
        # Get all events for the user
        user_events = db.query(models.Event).filter(
            models.Event.user_id == current_user_id
        ).all()
        
        duplicates_removed = 0
        
        # Group events by title and start_time
        event_groups = {}
        for event in user_events:
            key = (event.title, event.start_time)
            if key not in event_groups:
                event_groups[key] = []
            event_groups[key].append(event)
        
        # Remove duplicates, keeping the one with the most complete data
        for (title, start_time), events in event_groups.items():
            if len(events) > 1:
                logger.info(f"Google Calendar - Found {len(events)} duplicates for '{title}' at {start_time}")
                
                # Sort by completeness (events with google_event_id are more complete)
                events.sort(key=lambda e: (
                    e.google_event_id is not None,  # Has Google ID first
                    e.description or "",  # Has description
                    e.id  # Lower ID first (older)
                ), reverse=True)
                
                # Keep the first (most complete) event, remove the rest
                event_to_keep = events[0]
                events_to_remove = events[1:]
                
                for event_to_remove in events_to_remove:
                    logger.info(f"Google Calendar - Removing duplicate event: {event_to_remove.title} (ID: {event_to_remove.id})")
                    db.delete(event_to_remove)
                    duplicates_removed += 1
        
        db.commit()
        
        logger.info(f"Google Calendar - Cleanup completed. Removed {duplicates_removed} duplicate events for user {current_user_id}")
        
        return {
            "message": "Duplicate cleanup completed successfully",
            "duplicates_removed": duplicates_removed,
            "total_events_after_cleanup": db.query(models.Event).filter(
                models.Event.user_id == current_user_id
            ).count()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Google Calendar - Duplicate cleanup failed for user {current_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Duplicate cleanup failed: {str(e)}")

def refresh_access_token(db: Session, connection: models.GoogleCalendarConnection) -> models.GoogleCalendarConnection:
    """Refresh expired access token"""
    if not connection.refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token available")
    
    # Refresh the access token
    token_data = {
        "client_id": google_config.get_calendar_client_id(),
        "client_secret": google_config.get_calendar_client_secret(),
        "refresh_token": connection.refresh_token,
        "grant_type": "refresh_token"
    }
    
    logger.info(f"Google Calendar - Refreshing token for user {connection.user_id}")
    logger.info(f"Google Calendar - Using client_id: {google_config.get_calendar_client_id()}")
    logger.info(f"Google Calendar - Client secret exists: {bool(google_config.get_calendar_client_secret())}")
    logger.info(f"Google Calendar - Refresh token exists: {bool(connection.refresh_token)}")
    
    try:
        with httpx.Client() as client:
            response = client.post(google_config.GOOGLE_TOKEN_URL, data=token_data)
            response.raise_for_status()
            
            tokens = response.json()
            
            # Update connection with new tokens
            connection.access_token = tokens["access_token"]
            if "refresh_token" in tokens:
                connection.refresh_token = tokens["refresh_token"]
            
            expires_in = tokens.get("expires_in", 3600)
            connection.token_expiry = datetime.now() + timedelta(seconds=expires_in)  # Use local time
            connection.updated_at = datetime.now()  # Use local time
            
            db.commit()
            return connection
            
    except Exception as e:
        logger.error(f"Google Calendar - Failed to refresh token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")

def parse_google_datetime(date_obj: dict) -> datetime:
    """Parse Google Calendar datetime object"""
    try:
        if "dateTime" in date_obj:
            # Handle timezone-aware datetime strings
            date_str = date_obj["dateTime"]
            if date_str.endswith("Z"):
                # UTC time, convert to local time
                from datetime import timezone
                utc_time = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                return utc_time.replace(tzinfo=timezone.utc).astimezone().replace(tzinfo=None)
            else:
                # Already has timezone info
                return datetime.fromisoformat(date_str).replace(tzinfo=None)
        elif "date" in date_obj:
            # All-day event - convert to datetime at midnight
            date_str = date_obj["date"]
            return datetime.fromisoformat(date_str)
        else:
            raise ValueError("Invalid date format")
    except Exception as e:
        logger.error(f"Google Calendar - Failed to parse date: {date_obj}, error: {str(e)}")
        # Return current time as fallback
        return datetime.now() 

# Removed calendar-permissions endpoint - not needed for simple two-way sync 