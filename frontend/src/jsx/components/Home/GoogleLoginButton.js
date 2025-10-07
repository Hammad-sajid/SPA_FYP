import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';

const GoogleLoginButton = ({ 
    googleConfig, 
    googleConfigLoading, 
    handleGoogleLogin, 
    handleGoogleLoginClick,
    onLoginStart,
    onLoginComplete 
}) => {
    const dispatch = useDispatch();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lastError, setLastError] = useState(null);

    // Reset error when component unmounts or config changes
    useEffect(() => {
        setLastError(null);
        setLoginAttempts(0);
    }, [googleConfig]);

    // Google OAuth login hook with enhanced error handling
    const login = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                setIsLoggingIn(true);
                setLastError(null);
                
                // Notify parent component that login started
                if (onLoginStart) {
                    onLoginStart(response);
                }

                // Handle the login response
                await handleGoogleLogin(response);
                
                // Notify parent component that login completed successfully
                if (onLoginComplete) {
                    onLoginComplete(response, true);
                }
                
                // Reset state on success
                setLoginAttempts(0);
                
            } catch (error) {
                console.error('Google login failed:', error);
                setLastError(error.message || 'Login failed');
                setLoginAttempts(prev => prev + 1);
                
                // Dispatch error to Redux store
                dispatch({
                    type: 'SET_ERROR',
                    payload: `Failed to login with Google: ${error.message || 'Unknown error'}`
                });
                
                // Notify parent component that login failed
                if (onLoginComplete) {
                    onLoginComplete(response, false, error);
                }
            } finally {
                setIsLoggingIn(false);
            }
        },
        onError: (error) => {
            console.error('Google OAuth error:', error);
            setIsLoggingIn(false);
            setLastError(error.error_description || error.error || 'OAuth error');
            setLoginAttempts(prev => prev + 1);
            
            // Provide user-friendly error messages
            let userMessage = 'Google login failed. Please try again.';
            if (error.error === 'popup_closed_by_user') {
                userMessage = 'Login was cancelled. Please try again.';
            } else if (error.error === 'access_denied') {
                userMessage = 'Access was denied. Please check your permissions.';
            } else if (error.error === 'invalid_client') {
                userMessage = 'Google login is not properly configured.';
            }
            
            dispatch({
                type: 'SET_ERROR',
                payload: userMessage
            });
            
            // Notify parent component that login failed
            if (onLoginComplete) {
                onLoginComplete(null, false, error);
            }
        },
        flow: 'implicit', // Use implicit flow to get ID token directly
        scope: 'openid email profile', // Request basic profile information
        ux_mode: 'popup', // Use popup mode for better UX
        auto_select: false, // Don't auto-select existing account
        cancel_on_tap_outside: true, // Cancel if user clicks outside
        prompt: 'select_account' // Always show account selection
    });

    // Get Google Auth Client ID from config
    const getGoogleAuthClientId = () => {
        if (googleConfig?.client_id) {
            return googleConfig.client_id;
        }
        // Fallback to environment variable if config not loaded
        return process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID;
    };

    // Handle Google login click with rate limiting
    const handleLoginClick = () => {
        if (isLoggingIn) return; // Prevent multiple clicks
        
        // Rate limiting: prevent too many attempts
        if (loginAttempts >= 3) {
            const cooldownTime = Math.min(loginAttempts * 30, 300); // 30s to 5min cooldown
            setLastError(`Too many login attempts. Please wait ${cooldownTime} seconds.`);
            return;
        }
        
        try {
            setLastError(null);
            login();
        } catch (error) {
            console.error('Failed to initiate Google login:', error);
            setLastError('Failed to start Google login. Please try again.');
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to start Google login. Please try again.'
            });
        }
    };

    // Handle manual Google login (fallback)
    const handleManualLogin = () => {
        if (isLoggingIn || googleConfigLoading) return;
        
        try {
            setLastError(null);
            handleGoogleLoginClick();
        } catch (error) {
            console.error('Manual Google login failed:', error);
            setLastError('Failed to enable Google login. Please try again.');
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to enable Google login. Please try again.'
            });
        }
    };

    // Clear error when user starts typing or clicking
    const clearError = () => {
        setLastError(null);
    };

    return (
        <div className="login-social">
            <div className="d-flex justify-content-left my-4">
                {googleConfig && getGoogleAuthClientId() ? (
                    // Google OAuth is configured and available
                    <button
                        type="button"
                        className="btn font-w800 d-block my-4 custom-google-btn"
                        onClick={handleLoginClick}
                        onFocus={clearError}
                        disabled={isLoggingIn || loginAttempts >= 3}
                    >
                        <i className={`fab fa-google me-2 text-primary ${isLoggingIn ? 'fa-spin' : ''}`}></i>
                        {isLoggingIn ? 'Logging in...' : 'Login with Google'}
                    </button>
                ) : (
                    // Google OAuth not configured - show enable button
                    <button
                        type="button"
                        className="btn font-w800 d-block my-4 custom-google-btn"
                        onClick={handleManualLogin}
                        onFocus={clearError}
                        disabled={googleConfigLoading || isLoggingIn}
                    >
                        <i className={`fab fa-google me-2 text-primary ${googleConfigLoading ? 'fa-spin' : ''}`}></i>
                        {googleConfigLoading ? 'Loading Google Login...' : 'Enable Google Login'}
                    </button>
                )}
            </div>
            
            {/* Status and error display */}
            {isLoggingIn && (
                <div className="text-info small mt-2">
                    <i className="fas fa-info-circle me-1"></i>
                    Redirecting to Google for authentication...
                </div>
            )}
            
            {lastError && (
                <div className="text-danger small mt-2">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    {lastError}
                    {loginAttempts > 0 && (
                        <span className="ms-2 text-muted">
                            (Attempt {loginAttempts}/3)
                        </span>
                    )}
                </div>
            )}
            
            {loginAttempts >= 3 && (
                <div className="text-warning small mt-2">
                    <i className="fas fa-clock me-1"></i>
                    Too many failed attempts. Please wait before trying again.
                </div>
            )}
        </div>
    );
};

export default GoogleLoginButton;
