// googleauth.js
let GOOGLE_AUTH_CONFIG = null;
let GOOGLE_CALENDAR_CONFIG = null;

/**
 * Fetch Google Auth configuration (Login)
 */
export const fetchGoogleAuthConfig = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/google/config', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google Auth configuration');
    }

    GOOGLE_AUTH_CONFIG = await response.json();
    return GOOGLE_AUTH_CONFIG;
  } catch (error) {
    console.error('Error fetching Google Auth configuration:', error);
    return {
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
      auth_redirect_uri: process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI || '',
      auth_scopes: ['email', 'profile']
    };
  }
};

/**
 * Fetch Google Calendar configuration
 */
export const fetchGoogleCalendarConfig = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/google-calendar/config', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar configuration');
    }

    GOOGLE_CALENDAR_CONFIG = await response.json();
    return GOOGLE_CALENDAR_CONFIG;
  } catch (error) {
    console.error('Error fetching Google Calendar configuration:', error);
    return {
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
      calendar_redirect_uri: process.env.REACT_APP_GOOGLE_CALENDAR_REDIRECT_URI || '',
      calendar_scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events']
    };
  }
};

// ====== Getters for Auth Config ======
export const getGoogleAuthClientId = () => GOOGLE_AUTH_CONFIG?.client_id;
export const getGoogleAuthRedirectUri = () => GOOGLE_AUTH_CONFIG?.auth_redirect_uri;
export const getGoogleAuthScopes = () => GOOGLE_AUTH_CONFIG?.auth_scopes;

// ====== Getters for Calendar Config ======
export const getGoogleCalendarClientId = () => GOOGLE_CALENDAR_CONFIG?.client_id;
export const getGoogleCalendarRedirectUri = () => GOOGLE_CALENDAR_CONFIG?.calendar_redirect_uri;
export const getGoogleCalendarScopes = () => GOOGLE_CALENDAR_CONFIG?.calendar_scopes;

// ====== Initialization helpers ======
export const initGoogleAuthConfig = async () => {
  if (!GOOGLE_AUTH_CONFIG) {
    await fetchGoogleAuthConfig();
  }
};

export const initGoogleCalendarConfig = async () => {
  if (!GOOGLE_CALENDAR_CONFIG) {
    await fetchGoogleCalendarConfig();
  }
}; 