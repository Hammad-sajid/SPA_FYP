import React, { useState, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom'
import { loginAction, googleLoginAction, CLEAR_AUTH_MESSAGES } from '../../store/actions/AuthActions';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import PasswordInput from '../components/Forms/Element/PasswordInput';
import { FaBrain } from 'react-icons/fa';


//image
import loginbg from '../../images/bg-1.jpg'
import logo from '../../images/log.png'
import { fetchGoogleAuthConfig, getGoogleAuthClientId, isGoogleAuthConfigLoaded } from '../../config/googleOAuth.js';

function Login(props) {
    const [loginInput, setLoginInput] = useState('');
    let errorsObj = { loginInput: '', password: '' };
    const [errors, setErrors] = useState(errorsObj);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleConfig, setGoogleConfig] = useState(null);
    const [googleConfigLoading, setGoogleConfigLoading] = useState(false); // Start with false - no loading on mount
    const dispatch = useDispatch();

    // No useEffect - Google config is loaded only when user wants it
    const handleGoogleLoginClick = async () => {
            try {
                setGoogleConfigLoading(true);
                const config = await fetchGoogleAuthConfig();
                setGoogleConfig(config);
            } catch (error) {
            console.error("Google config fetch failed:", error);
            setGoogleConfig(null);
            } finally {
                setGoogleConfigLoading(false);
            }
        };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            console.log('Google login credential received:', credentialResponse);
            const decoded = jwtDecode(credentialResponse.credential);
            const { email, name, picture, sub } = decoded;

            console.log('Decoded Google user data:', { email, name, picture, sub });

            // Dispatch the Google login action with user data
            dispatch(googleLoginAction({
                email,
                name,
                picture,
                googleId: sub
            }, props.history));
        } catch (error) {
            console.error('Google login error:', error);
            // Show error message to user
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to login with Google. Please try again.'
            });
        }
    };

        



    const onLogin = (e) => {
        e.preventDefault();
        let error = false;
        const errorObj = { ...errorsObj };
        if (loginInput === '') {
            errorObj.loginInput = 'Username or Email is Required';
            error = true;
        }
        if (password === '') {
            errorObj.password = 'Password is Required';
            error = true;
        }
        setErrors(errorObj);
        if (error) {
            return;
        }
        setIsLoading(true);
        dispatch({ type: CLEAR_AUTH_MESSAGES }); // Clear any previous messages
        dispatch(loginAction(loginInput, password, props.history));
        
        // Reset loading after a delay (similar to forgot password)
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }

    // No loading state needed - page renders immediately
    // Show error if Google config failed to load, but still show login form
    if (!googleConfig) {
        console.warn('Google config not available, showing login form without Google login');
    }

        return (
            <div className="login-main-page" style={{
                backgroundImage: "url(" + loginbg + ")", backgroundSize: 'cover', background: 'linear-gradient(135deg, rgb(254,161,4) 0%,rgb(97, 80, 114) 100%)',
                backdropFilter: 'blur(10px)'
            }}>
                <div className="login-wrapper">
                    <div className="container h-100">
                        <div className="row h-100 align-items-center justify-contain-center">
                            <div className="col-xl-12 mt-3">
                                <div className="card">
                                    <div className="card-body p-0">
                                        <div className="row m-0">
                                            <div className="col-xl-6 col-md-6 sign text-center">
                                                <div>
                                                    <div className="text-center my-5">
                                                        <Link to="/home">
                                                            <FaBrain size={35} color="white" className="navbar-brand" />
                                                            <p className="ms-2 fw-bold t fs-5 cus-font-color" >Smart Personal Assistant</p>
                                                        </Link>
                                                    </div>
                                                    <img src={logo} className="education-img" alt="logo"></img>
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-md-6">
                                                <div className="sign-in-your">
                                                    <h4 className="fs-20 font-w800 text-black">Sign in your account</h4>
                                                    <span>Welcome back! Login with your data that you entered<br /> during registration</span>
                                                    <div className="login-social ">
                                                        <div className="d-flex justify-content-left my-4">
                                                        {googleConfig ? (
                                                            <GoogleOAuthProvider clientId={getGoogleAuthClientId() || googleConfig?.client_id}>
                                                                <GoogleLogin class="bg-primary"
                                                                onSuccess={handleGoogleLogin}
                                                                onError={() => {
                                                                    console.error('Google login failed');
                                                                    dispatch({
                                                                        type: 'SET_ERROR',
                                                                        payload: 'Failed to login with Google. Please try again.'
                                                                    });
                                                                }}
                                                                render={({ onClick }) => (
                                                                    <Link
                                                                        to="#"
                                                                        className="btn font-w800 d-block my-4"
                                                                        onClick={onClick}
                                                                    >
                                                                        <i className="fab fa-google me-2 text-primary w-100 "></i>
                                                                        Login with Google
                                                                    </Link>
                                                                )}
                                                                />
                                                            </GoogleOAuthProvider>
                                                        ) : (
                                                            <Link
                                                                to="#"
                                                                className="btn font-w800 d-block my-4"
                                                                onClick={handleGoogleLoginClick}
                                                                disabled={googleConfigLoading}
                                                            >
                                                                <i className={`fab fa-google me-2 text-primary ${googleConfigLoading ? 'fa-spin' : ''}`}></i>
                                                                {googleConfigLoading ? 'Loading Google Login...' : 'Enable Google Login'}
                                                            </Link>
                                                        )}
                                                        </div>
                                                    </div>
                                                    
                                                
                                                    {props.errorMessage && (
                                                        <div className='bg-red-300 text-red-900 border border-red-900 p-1 my-2'>
                                                            {props.errorMessage}
                                                        </div>
                                                    )}
                                                    {props.successMessage && (
                                                    <div className='bg-green-300 text-green-900 border border-red-900 p-1 my-2'>
                                                            {props.successMessage}
                                                        </div>
                                                    )}
                                                
                                                    <form onSubmit={onLogin}>
                                                        <div className="mb-3">
                                                            <label className="mb-1"><strong>Email or Username</strong></label>
                                                            <input type="text" className="form-control" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="Enter username or email"
                                                                required />
                                                            {errors.loginInput && <div className="text-danger fs-12">{errors.loginInput}</div>}
                                                        </div>
                                                        <PasswordInput
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            placeholder="Enter password"
                                                            label="Password"
                                                            error={errors.password}
                                                        />
                                                        <div className="row d-flex justify-content-between mt-4 mb-2">
                                                            <div className="mb-3">
                                                                <div className="form-check custom-checkbox ms-1">
                                                                    <input type="checkbox" className="form-check-input" id="basic_checkbox_1" />
                                                                    <label className="form-check-label" htmlFor="basic_checkbox_1">Remember my preference</label>
                                                                </div>
                                                            </div>

                                                            <div className="mb-3 d-flex flex-column flex-md-row justify-content-between text-center text-md-start">
                                                                <span className="mb-2 mb-md-0">
                                                                    Create new Account? <button className="btn btn-link p-0 pop-on-hover text-decoration-underline" onClick={() => props.history.push('/register')}> Sign Up</button>
                                                                </span>
                                                                <span>
                                                                <button className="btn btn-link p-0 pop-on-hover text-decoration-underline" onClick={() => props.history.push('/forgot-password')}> Forgot Password</button>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <button 
                                                                type="submit" 
                                                                className="btn btn-outline-light text-nowrap px-4 py-2 fw-semibold btn-block pop-on-hover" 
                                                                style={{
                                                                    background: 'linear-gradient(135deg, rgb(254,161,4) 0%,rgb(97, 80, 114) 100%)',
                                                                    backdropFilter: 'blur(10px)', 
                                                                    color: '#ffffff', 
                                                                    borderColor: '#ffffff', 
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                                disabled={isLoading}
                                                            >
                                                                {isLoading ? "SIGNING IN..." : "Sign Me In"}
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
};

const mapStateToProps = (state) => {
    return {
        errorMessage: state.auth.errorMessage,
        successMessage: state.auth.successMessage,
        showLoading: state.auth.showLoading,
    };
};

export default connect(mapStateToProps)(Login);