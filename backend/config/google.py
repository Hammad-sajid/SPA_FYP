import os
from typing import Optional

# Google OAuth2 Configuration
class GoogleConfig:
    """Configuration class for all Google services (Auth + Calendar)"""
    
    # OAuth2 Credentials - Separate clients for each service
    GOOGLE_AUTH_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_AUTH_CLIENT_ID")
    GOOGLE_AUTH_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_AUTH_CLIENT_SECRET")
    
    GOOGLE_GMAIL_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_GMAIL_CLIENT_ID")
    GOOGLE_GMAIL_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_GMAIL_CLIENT_SECRET")
    
    GOOGLE_CALENDAR_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
    GOOGLE_CALENDAR_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET")
    
    # OAuth Redirect URIs
    GOOGLE_AUTH_REDIRECT_URI: str = os.getenv("GOOGLE_AUTH_REDIRECT_URI", "http://localhost:3000/auth/google/spa")
    GOOGLE_CALENDAR_REDIRECT_URI: str = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI", "http://localhost:3000/calendar-callback")
    GOOGLE_GMAIL_REDIRECT_URI: str = os.getenv("GOOGLE_GMAIL_REDIRECT_URI", "http://localhost:3000/gmail-callback")
    
    # Google API URLs
    GOOGLE_AUTH_URL: str = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_CALENDAR_API: str = "https://www.googleapis.com/calendar/v3"
    
    # OAuth Scopes
    GOOGLE_AUTH_SCOPES: list = ["email", "profile"]
    GOOGLE_CALENDAR_SCOPES: list = [
        "https://www.googleapis.com/auth/calendar",  # Full access to calendars
        "https://www.googleapis.com/auth/calendar.readonly",  # Read access as fallback
        "https://www.googleapis.com/auth/calendar.events",  # Event management
        "https://www.googleapis.com/auth/calendar.settings.readonly",  # Calendar settings
        "https://www.googleapis.com/auth/calendar.calendars.readonly",  # Calendar list access
        "https://www.googleapis.com/auth/calendar.calendars"  # Full calendar list access
    ]
    GOOGLE_GMAIL_SCOPES: list = [
        "https://www.googleapis.com/auth/gmail.readonly",  # Read Gmail messages
        "https://www.googleapis.com/auth/gmail.modify",  # Modify Gmail messages
        "https://www.googleapis.com/auth/gmail.compose",  # Compose and send emails
        "https://www.googleapis.com/auth/gmail.send"  # Send emails
    ]
    
    # Gmail API URLs
    GOOGLE_GMAIL_API: str = "https://gmail.googleapis.com/gmail/v1/users/me"
    
    @classmethod
    def is_auth_configured(cls) -> bool:
        """Check if Google Auth is properly configured"""
        return bool(cls.GOOGLE_AUTH_CLIENT_ID and cls.GOOGLE_AUTH_CLIENT_SECRET)
    
    @classmethod
    def is_calendar_configured(cls) -> bool:
        """Check if Google Calendar is properly configured"""
        return bool(cls.GOOGLE_CALENDAR_CLIENT_ID and cls.GOOGLE_CALENDAR_CLIENT_SECRET)
    
    @classmethod
    def is_gmail_configured(cls) -> bool:
        """Check if Gmail is properly configured"""
        return bool(cls.GOOGLE_GMAIL_CLIENT_ID and cls.GOOGLE_GMAIL_CLIENT_SECRET)
    
    @classmethod
    def get_auth_client_id(cls) -> str:
        """Get OAuth client ID for authentication"""
        return cls.GOOGLE_AUTH_CLIENT_ID
    
    @classmethod
    def get_auth_client_secret(cls) -> str:
        """Get OAuth client secret for authentication"""
        return cls.GOOGLE_AUTH_CLIENT_SECRET
    
    @classmethod
    def get_gmail_client_id(cls) -> str:
        """Get OAuth client ID for Gmail"""
        return cls.GOOGLE_GMAIL_CLIENT_ID
    
    @classmethod
    def get_gmail_client_secret(cls) -> str:
        """Get OAuth client secret for Gmail"""
        return cls.GOOGLE_GMAIL_CLIENT_SECRET
    
    @classmethod
    def get_calendar_client_id(cls) -> str:
        """Get OAuth client ID for Calendar"""
        return cls.GOOGLE_CALENDAR_CLIENT_ID
    
    @classmethod
    def get_calendar_client_secret(cls) -> str:
        """Get OAuth client secret for Calendar"""
        return cls.GOOGLE_CALENDAR_CLIENT_SECRET
    
    @classmethod
    def get_auth_scopes(cls) -> str:
        """Get OAuth scopes for authentication as space-separated string"""
        return " ".join(cls.GOOGLE_AUTH_SCOPES)
    
    @classmethod
    def get_calendar_scopes(cls) -> str:
        """Get OAuth scopes for calendar access as space-separated string"""
        return " ".join(cls.GOOGLE_CALENDAR_SCOPES)
    
    @classmethod
    def get_gmail_scopes(cls) -> str:
        """Get OAuth scopes for Gmail access as space-separated string"""
        return " ".join(cls.GOOGLE_GMAIL_SCOPES)
    
    @classmethod
    def validate_config(cls) -> tuple[bool, str]:
        """Validate configuration and return (is_valid, error_message)"""
        # Check Auth configuration
        if not cls.GOOGLE_AUTH_CLIENT_ID:
            return False, "GOOGLE_AUTH_CLIENT_ID is not set"
        if not cls.GOOGLE_AUTH_CLIENT_SECRET:
            return False, "GOOGLE_AUTH_CLIENT_SECRET is not set"
        
        # Check Calendar configuration
        if not cls.GOOGLE_CALENDAR_CLIENT_ID:
            return False, "GOOGLE_CALENDAR_CLIENT_ID is not set"
        if not cls.GOOGLE_CALENDAR_CLIENT_SECRET:
            return False, "GOOGLE_CALENDAR_CLIENT_SECRET is not set"
        
        # Check Gmail configuration
        if not cls.GOOGLE_GMAIL_CLIENT_ID:
            return False, "GOOGLE_GMAIL_CLIENT_ID is not set"
        if not cls.GOOGLE_GMAIL_CLIENT_SECRET:
            return False, "GOOGLE_GMAIL_CLIENT_SECRET is not set"
        
        return True, "Configuration is valid"

# Legacy class names for backward compatibility
class GoogleCalendarConfig(GoogleConfig):
    """Legacy class name - use GoogleConfig instead"""
    pass

# Database Configuration (for reference)
class DatabaseConfig:
    """Database configuration"""
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/smart_assistant_db")

# Session Configuration (for reference)
class SessionConfig:
    """Session configuration"""
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "your_session_secret_here")

# Export the main config
google_config = GoogleConfig()
google_calendar_config = GoogleConfig()  # Backward compatibility 