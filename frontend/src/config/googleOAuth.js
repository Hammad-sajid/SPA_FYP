// googleauth.js
let GOOGLE_AUTH_CONFIG = null;
let GOOGLE_CALENDAR_CONFIG = null;
let AUTH_CONFIG_LOADING = false;
let CALENDAR_CONFIG_LOADING = false;

/**
 * Fetch Google Auth configuration (Login) - with caching
 */
export const fetchGoogleAuthConfig = async (forceRefresh = false) => {
  // Return cached config if available and not forcing refresh
  if (GOOGLE_AUTH_CONFIG && !forceRefresh) {
    return GOOGLE_AUTH_CONFIG;
  }
  
  // Prevent multiple simultaneous requests
  if (AUTH_CONFIG_LOADING) {
    // Wait for existing request to complete
    while (AUTH_CONFIG_LOADING) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return GOOGLE_AUTH_CONFIG;
  }
  
  try {
    AUTH_CONFIG_LOADING = true;
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
      client_id: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID || '',
      auth_redirect_uri: process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI || '',
      auth_scopes: ['email', 'profile']
    };
  } finally {
    AUTH_CONFIG_LOADING = false;
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
      client_id: process.env.REACT_APP_GOOGLE_CALENDAR_CLIENT_ID || '',
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

// ====== Status checkers ======
export const isGoogleAuthConfigLoaded = () => !!GOOGLE_AUTH_CONFIG;
export const isGoogleCalendarConfigLoaded = () => !!GOOGLE_CALENDAR_CONFIG;
export const isGoogleAuthConfigLoading = () => AUTH_CONFIG_LOADING;
export const isGoogleCalendarConfigLoading = () => CALENDAR_CONFIG_LOADING;

// ====== Cache management ======
export const clearGoogleAuthConfig = () => {
  GOOGLE_AUTH_CONFIG = null;
  AUTH_CONFIG_LOADING = false;
};

export const clearGoogleCalendarConfig = () => {
  GOOGLE_CALENDAR_CONFIG = null;
  CALENDAR_CONFIG_LOADING = false;
};

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