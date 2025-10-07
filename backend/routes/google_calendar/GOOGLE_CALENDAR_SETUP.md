# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the Smart Personal Assistant application using the dedicated Google Calendar routes.

## 🎯 **What's Already Implemented**

✅ **Backend**: Complete Google Calendar API endpoints in `/api/google-calendar/`
✅ **Frontend**: GoogleCalendarPanel component with real API integration
✅ **Database**: GoogleCalendarConnection table for storing OAuth tokens
✅ **OAuth Flow**: Complete OAuth 2.0 implementation with popup handling

## 📋 **Prerequisites**

1. **Google Cloud Console Account**: You need a Google Cloud Console account
2. **Python Environment**: Python 3.8+ with required packages
3. **Database**: PostgreSQL database running
4. **Frontend**: React frontend running on localhost:3000

## 🚀 **Step 1: Google Cloud Console Setup**

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Smart Personal Assistant")
4. Click "Create"

### 1.2 Enable Google Calendar API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Set the following:
   - **Name**: Smart Personal Assistant
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/google-callback`
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these for the environment variables

## ⚙️ **Step 2: Environment Configuration**

### 2.1 Create .env file
Copy `env.template` to `.env` and fill in your values:

```bash
cp env.template .env
```

### 2.2 Update .env file
```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/google-callback

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/smart_assistant_db

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Session Secret (generate a random string for production)
SESSION_SECRET=your_session_secret_here
```

## 🗄️ **Step 3: Database Setup**

### 3.1 Run Database Migrations
The Google Calendar integration requires the `GoogleCalendarConnection` table. Make sure you have run:

```bash
alembic upgrade head
```

### 3.2 Verify Table Creation
Check that the table exists:

```sql
\dt google_calendar_connections;
```

## 🎨 **Step 4: Frontend Setup**

### 4.1 Add Route for OAuth Callback
In your React Router configuration, add the callback route:

```jsx
import GoogleOAuthCallback from './components/CalendarIntegration/GoogleOAuthCallback';

// In your routes
<Route path="/google-callback" element={<GoogleOAuthCallback />} />
```

### 4.2 Use GoogleCalendarPanel Component
The `GoogleCalendarPanel` component is now self-contained and will handle all Google Calendar operations. Just import and use it:

```jsx
import GoogleCalendarPanel from './components/CalendarIntegration/GoogleCalendarPanel';

// In your component
<GoogleCalendarPanel />
```

## 🧪 **Step 5: Testing the Integration**

### 5.1 Start the Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5.2 Start the Frontend
```bash
cd frontend
npm start
```

### 5.3 Test the Connection
1. Go to the Calendar Integration page
2. Click "Connect" button
3. Complete Google OAuth flow
4. Select calendars to sync
5. Click "Sync now"

## 🔌 **API Endpoints Available**

The following endpoints are available at `/api/google-calendar/`:

- `GET /auth-url` - Get Google OAuth authorization URL
- `POST /callback` - Handle OAuth callback and exchange code for tokens
- `GET /calendars` - Get user's Google calendars
- `POST /sync` - Sync events between Google Calendar and local database
- `DELETE /disconnect` - Disconnect Google Calendar

## 🎯 **How It Works**

### **OAuth Flow:**
1. User clicks "Connect" → Opens Google OAuth popup
2. User grants permissions → Google redirects to `/google-callback`
3. Backend exchanges code for access/refresh tokens
4. Tokens stored in `GoogleCalendarConnection` table
5. User can now sync calendars and events

### **Calendar Sync:**
1. User selects calendars to sync
2. Backend fetches events from Google Calendar API
3. Events imported to local database
4. Two-way sync available (local ↔ Google)

## 🛠️ **Troubleshooting**

### Common Issues

1. **"Google OAuth not configured"**
   - Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
   - Restart the backend server after updating environment variables

2. **"Invalid redirect URI"**
   - Ensure the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/google-callback`
   - Check that `GOOGLE_REDIRECT_URI` in `.env` matches

3. **"Failed to exchange code for tokens"**
   - Verify your Google Cloud Console credentials
   - Check that the Google Calendar API is enabled
   - Ensure the OAuth consent screen is configured

4. **"Not authenticated"**
   - Make sure you're logged into the application
   - Check that session cookies are being sent with requests

### Debug Mode

To enable debug logging, add to your `.env`:

```env
LOG_LEVEL=DEBUG
```

## 🔒 **Security Considerations**

1. **Never commit `.env` files** to version control
2. **Use HTTPS in production** - update redirect URIs accordingly
3. **Implement proper session management** for production use
4. **Regularly rotate OAuth credentials** for security

## 🚀 **Production Deployment**

For production deployment:

1. Update redirect URIs in Google Cloud Console
2. Use HTTPS URLs
3. Set proper CORS origins
4. Use secure session management
5. Implement rate limiting
6. Add proper error logging

## 📚 **File Structure**

```
backend/
├── routes/
│   ├── google_calendar/           # Dedicated Google Calendar routes
│   │   ├── __init__.py
│   │   └── google_calendar.py
│   ├── events/                    # Core event management (no Google Calendar)
│   │   └── events.py
│   └── __init__.py               # Main router configuration
├── config/
│   └── google.py                 # Centralized Google configuration (Auth + Calendar)
└── env.template                   # Environment variables template
```

## 🎉 **What's Working Now**

✅ **Complete OAuth Flow** - From authorization to token storage
✅ **Calendar Discovery** - Fetch user's Google calendars
✅ **Event Synchronization** - Import Google Calendar events
✅ **User Management** - Secure, user-specific connections
✅ **Frontend Integration** - Real-time UI with actual data
✅ **Error Handling** - Graceful failure and recovery
✅ **Security** - Session-based authentication and token management

## 🆘 **Support**

If you encounter issues:

1. Check the browser console for frontend errors
2. Check the backend logs for API errors
3. Verify all environment variables are set correctly
4. Ensure database tables exist and are accessible
5. Test with a simple Google Calendar account first

The Google Calendar integration is now **fully functional** and ready for use! 🚀 