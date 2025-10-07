// src/store/actions/AuthActions.js
import { signUp, login, logoutUser, getCurrentUser, verifyCode, resendCode } from "../../services/AuthService";
import axios from "axios";

export const SIGNUP_CONFIRMED_ACTION = "[signup action] confirmed signup";
export const VERIFICATION_REQUIRED_ACTION = "[verification action] verification required";
export const VERIFICATION_CONFIRMED_ACTION = "[verification action] verification confirmed";
export const LOGIN_CONFIRMED_ACTION = "[login action] confirmed login";
export const LOGOUT_ACTION = "[Logout action] logout action";
export const CHECK_AUTO_LOGIN = "[check auto login] check auto login action";
export const LOGIN_FAILED_ACTION = "[login action] failed login";
export const CLEAR_AUTH_MESSAGES = "[auth action] clear auth messages";


// Signup Action
export function signupAction(username, email, password, history) {
    return (dispatch) => {
        signUp(username, email, password)
        .then(() => {
            dispatch({ type: SIGNUP_CONFIRMED_ACTION });
            // Redirect to verification page instead of login
            history.replace("/verification", { email: email });
        })
        .catch((error) => console.error("Signup error:", error));
    };
}

// Verify Code Action
export function verifyCodeAction(email, code, history) {
    return (dispatch) => {
        verifyCode(email, code)
        .then((response) => {
            // Use user data from verification response
            dispatch({ type: VERIFICATION_CONFIRMED_ACTION, payload: response.user });
            history.replace("/home");
        })
        .catch((error) => console.error("Verification error:", error));
    };
}

// Resend Code Action
export function resendCodeAction(email) {
    return (dispatch) => {
        resendCode(email)
        .then(() => {
            // Success message will be handled by the service
        })
        .catch((error) => console.error("Resend code error:", error));
    };
}



// Login Action (Using Sessions)
export function loginAction(username, password, history) {
    return (dispatch) => {
        console.log('Login action started for user:', username);
        login(username, password)
        .then((response) => {
            console.log('Login successful, response:', response);
            
            // Check if session cookie was set
            setTimeout(() => {
                const sessionCookie = checkSessionCookie();
                if (sessionCookie) {
                    console.log('Session cookie verified after login');
                } else {
                    console.warn('Session cookie not found after login');
                }
            }, 1000);
            
            dispatch({ type: LOGIN_CONFIRMED_ACTION, payload: response.user });

            history.replace("/home");
            window.history.pushState(null, null, window.location.href);
            window.addEventListener("popstate", function (event) {
                window.history.pushState(null, null, window.location.href);
            });

        })
        .catch((error) => {
            console.error("Login error:", error);
        });
    };
}

// Check if session cookie exists
const checkSessionCookie = () => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_id='));
    console.log('Session cookie found:', sessionCookie);
    return sessionCookie;
};

// checkAutoLogin Action (on refresh)
export function checkAutoLogin(dispatch, history) {
    console.log('Checking auto-login...');
    console.log('Current cookies:', document.cookie);
    
    getCurrentUser()
    .then((user) => {
        if (user) {
            console.log('Auto-login successful, user:', user);
            dispatch({ type: LOGIN_CONFIRMED_ACTION, payload: user });

            // Redirect logged-in users from /login or /register to /home
            if (history.location.pathname === "/login" || history.location.pathname === "/register") {
                history.replace("/home");
            }
        } else {
            console.log('No user found, staying on current page');
            dispatch({ type: LOGOUT_ACTION });
            // Don't redirect to login - let the user stay on homepage or current public route
        }
    })
    .catch((error) => {
        console.log('Auto-login failed:', error);
        dispatch({ type: LOGOUT_ACTION });
        // Don't redirect to login on error - let the user stay on current page
    });
}

// Periodic session check to proactively detect expired sessions
export function startPeriodicSessionCheck(dispatch) {
    // Check session every 5 minutes
    const sessionCheckInterval = setInterval(async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                console.log('Periodic check: Session expired, logging out...');
                clearInterval(sessionCheckInterval);
                dispatch({ type: LOGOUT_ACTION });
                window.location.href = '/login';
            }
        } catch (error) {
            console.log('Periodic check: Session check failed, logging out...');
            clearInterval(sessionCheckInterval);
            dispatch({ type: LOGOUT_ACTION });
            window.location.href = '/login';
        }
    }, 5 * 60 * 1000); // 5 minutes

    // Return the interval ID so it can be cleared on logout
    return sessionCheckInterval;
}

// Logout Action (Destroy Session)
export function logoutAction(history) {
    return (dispatch) => {
        logoutUser().then(() => {
            // Clear any existing session check intervals
            if (window.sessionCheckInterval) {
                clearInterval(window.sessionCheckInterval);
                window.sessionCheckInterval = null;
            }
            
            dispatch({ type: LOGOUT_ACTION });
            if (history) {
                history.replace("/login");
                window.history.pushState(null, null, window.location.href);
                window.addEventListener("popstate", function (event) {
                    window.history.pushState(null, null, window.location.href);
                });
            }
        });
    };
}

// Google Login Action
export const googleLoginAction = (userData, history) => {
    return async (dispatch) => {
        try {
            console.log('Starting Google login process...', userData);
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });
            
            // Ensure all required fields are present
            const formattedData = {
                email: userData.email,
                name: userData.name,
                googleId: userData.googleId,
                picture: userData.picture  // Include profile photo from Google
            };
            
            console.log('Sending Google auth data:', formattedData);
            
            const response = await axios.post('http://localhost:8000/api/auth/google', formattedData, { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Google login response:', response.data);
            
            if (response.data) {
                // Create session
                const sessionId = `session_${response.data.id}`;
                document.cookie = `session_id=${sessionId}; path=/; samesite=Lax`;
                
                console.log('Session cookie set:', sessionId);
                
                // Check if session cookie was set
                setTimeout(() => {
                    const sessionCookie = checkSessionCookie();
                    if (sessionCookie) {
                        console.log('Session cookie verified after Google login');
                    } else {
                        console.warn('Session cookie not found after Google login');
                    }
                }, 1000);
                
                // Dispatch success action
                dispatch({
                    type: LOGIN_CONFIRMED_ACTION,
                    payload: response.data
                });
                
                // Redirect to homepage
                console.log('Redirecting to homepage...');
                history.replace('/home');
                window.history.pushState(null, null, window.location.href);
                window.addEventListener("popstate", function (event) {
                    window.history.pushState(null, null, window.location.href);
                });
            } else {
                throw new Error('No user data received');
            }
        } catch (error) {
            console.error('Google login error:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };
};

// Auto-logout functionality
let idleTimer = null;
let sessionCheckTimer = null;
const IDLE_TIMEOUT_MINUTES = 30; // 30 minutes of inactivity
const SESSION_CHECK_INTERVAL = 300000; // Check session every 5 minutes instead of every minute
const SESSION_MONITORING_DELAY = 30000; // Wait 30 seconds after login before starting monitoring

// Reset idle timer on user activity
const resetIdleTimer = (dispatch, history) => {
    if (idleTimer) {
        clearTimeout(idleTimer);
    }
    
    idleTimer = setTimeout(() => {
        console.log('User idle for 30 minutes, auto-logout');
        dispatch(logoutAction(history));
    }, IDLE_TIMEOUT_MINUTES * 60 * 1000);
};

// Start monitoring user activity
export const startActivityMonitoring = (dispatch, history) => {
    // Wait longer after login before starting monitoring to ensure session is established
    setTimeout(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const resetTimer = () => resetIdleTimer(dispatch, history);
        
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        // Start the initial timer
        resetIdleTimer(dispatch, history);
        
        // Start session monitoring
        startSessionMonitoring(dispatch, history);
        
        console.log('Activity monitoring started');
    }, SESSION_MONITORING_DELAY);
    
    return () => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.removeEventListener(event, resetIdleTimer, true);
        });
        if (idleTimer) clearTimeout(idleTimer);
        if (sessionCheckTimer) clearTimeout(sessionCheckTimer);
    };
};

// Monitor session status
const startSessionMonitoring = (dispatch, history) => {
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3;
    
    const checkSession = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/auth/users/me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                consecutiveFailures++;
                console.log(`Session check failed (attempt ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}), will retry...`);
                
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    console.log('Too many consecutive session failures, logging out...');
                    dispatch(logoutAction(history));
                    return;
                }
                
                // Retry after a longer delay on failure
                sessionCheckTimer = setTimeout(checkSession, SESSION_CHECK_INTERVAL * 2);
                return;
            }
            
            // Session is valid, reset failure counter
            consecutiveFailures = 0;
            console.log('Session check successful, continuing monitoring...');
            
            // Continue monitoring
            sessionCheckTimer = setTimeout(checkSession, SESSION_CHECK_INTERVAL);
            
        } catch (error) {
            console.error('Session monitoring error:', error);
            // Don't logout on network errors, just retry
            sessionCheckTimer = setTimeout(checkSession, SESSION_CHECK_INTERVAL);
        }
    };
    
    // Start the first check after a longer delay
    setTimeout(checkSession, 300000); // Wait 5 minutes before first check (was 60000 = 1 minute)
};
