import React, { useState, useEffect } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { connect, useDispatch } from 'react-redux';
import {
    verifyCodeAction,
    resendCodeAction,
} from '../../store/actions/AuthActions';
import { FaBrain } from "react-icons/fa";
// image
import loginbg from '../../images/bg-1.jpg'
import logo from '../../images/log.png'

function VerificationCode(props) {
    const [verificationCode, setVerificationCode] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({ verificationCode: '' });
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
        // Get email from location state or localStorage
        const emailFromState = location.state?.email;
        const emailFromStorage = localStorage.getItem('pendingVerificationEmail');

        if (emailFromState) {
            setEmail(emailFromState);
            localStorage.setItem('pendingVerificationEmail', emailFromState);
        } else if (emailFromStorage) {
            setEmail(emailFromStorage);
        } else {
            // If no email found, redirect to registration
            history.replace('/register');
        }
    }, [location, history]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const onVerifyCode = (e) => {
        e.preventDefault();
        let error = false;
        const errorObj = { verificationCode: '' };

        if (verificationCode === '') {
            errorObj.verificationCode = 'Verification code is required';
            error = true;
        }

        setErrors(errorObj);
        if (error) return;

        setIsLoading(true);
        dispatch(verifyCodeAction(email, verificationCode, history));
        
        // Reset loading after a delay (similar to forgot password)
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }

    function onResendCode() {
        setIsResending(true);
        dispatch(resendCodeAction(email));
        setCountdown(60); // 60 seconds cooldown
        setIsResending(false);
    }

    return (
        <div className="login-main-page" style={{
            backgroundImage: "url(" + loginbg + ")",
            backgroundSize: 'cover',
            background: 'linear-gradient(135deg, rgb(254,161,4) 0%,rgb(121, 91, 151) 100%)',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="login-wrapper">
                <div className="container h-100">
                    <div className="row h-100 align-items-center justify-contain-center">
                        <div className="col-xl-12 mt-3">
                            <div className="card">
                                <div className="card-body p-0">
                                    <div className="row m-0">
                                        <div className="col-xl-6 col-md-6 sign text-center" style={{ minHeight: '500px' }}>
                                            <div className="w-100">
                                                <div className="text-center my-5">
                                                    <Link to="/home">
                                                        <FaBrain size={35} color="white" className="navbar-brand " />
                                                        <p className="ms-2 fw-bold t fs-5 cus-font-color" >Smart Personal Assistant</p>
                                                    </Link>
                                                </div>
                                                <img src={logo} className="education-img" alt="logo"></img>
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-md-6 d-flex align-items-center">
                                            <div className="sign-in-your w-100 px-4">
                                                <h4 className="fs-20 font-w800 text-black mb-3">Verify Your Email</h4>
                                                <p className="text-muted mb-4">We've sent a verification code to {email}</p>
                                                {props.errorMessage && (
                                                    <div className='bg-red-300 text-red-900 border border-red-900 p-1 my-2'>
                                                        {props.errorMessage}
                                                    </div>
                                                )}
                                                {props.successMessage && (
                                                    <div className='bg-green-300 text-green-900 border border-green-900 p-1 my-2'>
                                                        {props.successMessage}
                                                    </div>
                                                )}
                                                <form onSubmit={onVerifyCode}>
                                                    <div className="mb-4">
                                                        <label className="mb-2"><strong>Verification Code</strong></label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={verificationCode}
                                                            onChange={(e) => setVerificationCode(e.target.value)}
                                                            placeholder="Enter 6-digit verification code"
                                                            maxLength="6"
                                                            required
                                                        />
                                                        {errors.verificationCode && <div className="text-danger fs-12">{errors.verificationCode}</div>}
                                                    </div>
                                                    <div className="row d-flex justify-content-between mt-4 mb-4">
                                                        <div className="mb-3">
                                                            <span>Didn't receive the code? </span>
                                                            <button
                                                                type="button"
                                                                className="btn btn-link p-0 pop-on-hover text-decoration-underline"
                                                                onClick={onResendCode}
                                                                disabled={countdown > 0 || isResending}
                                                            >
                                                                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                                                            </button>
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
                                                            {isLoading ? "VERIFYING..." : "Verify Email"}
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
}

const mapStateToProps = (state) => {
    return {
        errorMessage: state.auth.errorMessage,
        successMessage: state.auth.successMessage,
        showLoading: state.auth.showLoading,
    };
};

export default connect(mapStateToProps)(VerificationCode); 