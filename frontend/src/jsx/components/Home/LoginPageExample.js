import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import GoogleOAuthWrapper from './GoogleOAuthWrapper';
import GoogleLoginButton from './GoogleLoginButton';

const LoginPageExample = () => {
    const dispatch = useDispatch();
    const [googleConfig, setGoogleConfig] = useState(null);
    const [googleConfigLoading, setGoogleConfigLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Get Google configuration on component mount
    useEffect(() => {
        const fetchGoogleConfig = async () => {
            try {
                setGoogleConfigLoading(true);
                // Fetch Google OAuth configuration from your backend
                const response = await fetch('/api/auth/google/config');
                if (response.ok) {
                    const config = await response.json();
                    setGoogleConfig(config);
                }
            } catch (error) {
                console.error('Failed to fetch Google config:', error);
            } finally {
                setGoogleConfigLoading(false);
            }
        };

        fetchGoogleConfig();
    }, []);

    // Handle Google login success
    const handleGoogleLogin = async (response) => {
        try {
            setIsAuthenticating(true);
            
            // Exchange authorization code for tokens
            const tokenResponse = await fetch('/api/auth/google/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: response.code,
                    state: response.state
                }),
                credentials: 'include'
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to authenticate with Google');
            }

            const authData = await tokenResponse.json();
            
            // Store authentication data in Redux
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: authData.user,
                    tokens: authData.tokens,
                    isAuthenticated: true
                }
            });

            // Redirect to dashboard or home page
            window.location.href = '/dashboard';
            
        } catch (error) {
            console.error('Google authentication failed:', error);
            throw error; // Re-throw to let the component handle it
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Handle manual Google login setup
    const handleGoogleLoginClick = async () => {
        try {
            // Redirect to Google OAuth setup page or show instructions
            window.open('/setup-google-oauth', '_blank');
        } catch (error) {
            console.error('Failed to open Google setup:', error);
            throw error;
        }
    };

    // Callback when login starts
    const onLoginStart = (response) => {
        console.log('Google login started:', response);
        // You can show loading indicators or disable other forms
    };

    // Callback when login completes (success or failure)
    const onLoginComplete = (response, success, error) => {
        if (success) {
            console.log('Google login completed successfully');
            // You can show success messages or redirect
        } else {
            console.log('Google login failed:', error);
            // You can show error messages or retry options
        }
    };

    // Get client ID for OAuth wrapper
    const getClientId = () => {
        if (googleConfig?.client_id) {
            return googleConfig.client_id;
        }
        return process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID;
    };

    return (
        <div className="login-page">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-4">
                        <div className="login-card">
                            <h2 className="text-center mb-4">Welcome Back</h2>
                            
                            {/* Regular login form */}
                            <form className="mb-4">
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        placeholder="Enter your password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={isAuthenticating}
                                >
                                    {isAuthenticating ? 'Logging in...' : 'Login'}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="text-center mb-4">
                                <span className="text-muted">or</span>
                            </div>

                            {/* Google OAuth wrapper */}
                            <GoogleOAuthWrapper clientId={getClientId()}>
                                <GoogleLoginButton
                                    googleConfig={googleConfig}
                                    googleConfigLoading={googleConfigLoading}
                                    handleGoogleLogin={handleGoogleLogin}
                                    handleGoogleLoginClick={handleGoogleLoginClick}
                                    onLoginStart={onLoginStart}
                                    onLoginComplete={onLoginComplete}
                                />
                            </GoogleOAuthWrapper>

                            {/* Additional options */}
                            <div className="text-center mt-4">
                                <a href="/forgot-password" className="text-decoration-none">
                                    Forgot Password?
                                </a>
                                <span className="mx-2">•</span>
                                <a href="/signup" className="text-decoration-none">
                                    Create Account
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPageExample;
