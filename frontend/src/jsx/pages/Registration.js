import React,{useState} from "react";
import { Link } from "react-router-dom";
import { connect, useDispatch } from 'react-redux';
import { FaBrain   } from 'react-icons/fa';
import validator from 'validator';
import {
    signupAction,
    CLEAR_AUTH_MESSAGES,
} from '../../store/actions/AuthActions';
import PasswordInput from '../components/Forms/Element/PasswordInput';
// image
import loginbg from '../../images/bg-1.jpg'
import logo from '../../images/log.png'


function Register(props) {
	const [username, setUsername] = useState(''); //line added
    const [email, setEmail] = useState('');
    let errorsObj = { username:'',email: '', password: '' }; //line added
    const [errors, setErrors] = useState(errorsObj);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        number: false,
        character: false,
        special: false
    });

    const dispatch = useDispatch();

    const validateEmail = (email) => {
        // Using validator library for robust email validation
        return validator.isEmail(email);
    };

    const validatePassword = (password) => {
        const requirements = {
            length: password.length >= 8,
            number: /\d/.test(password),
            character: /[a-zA-Z]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        setPasswordRequirements(requirements);
        
        // Calculate strength (0-100)
        let strength = 0;
        if (requirements.length) strength += 25;
        if (requirements.number) strength += 25;
        if (requirements.character) strength += 25;
        if (requirements.special) strength += 25;
        
        setPasswordStrength(strength);
        
        return Object.values(requirements).every(req => req);
    };

    const getStrengthColor = (strength) => {
        if (strength <= 25) return 'bg-danger';
        if (strength <= 50) return 'bg-warning';
        if (strength <= 75) return 'bg-info';
        return 'bg-success';
    };

    const getStrengthText = (strength) => {
        if (strength <= 25) return 'Very Weak';
        if (strength <= 50) return 'Weak';
        if (strength <= 75) return 'Medium';
        return 'Strong';
    };

    const onSignUp = (e) => {
        e.preventDefault();
        let error = false;
        const errorObj = { ...errorsObj };
        
        if (username === '') {
            errorObj.username = 'Username is Required';
            error = true;
        }
        
        if (email === '') {
            errorObj.email = 'Email is Required';
            error = true;
        } else if (!validateEmail(email)) {
            errorObj.email = 'Invalid email format';
            error = true;
        }
        
        if (password === '') {
            errorObj.password = 'Password is Required';
            error = true;
        } else if (!validatePassword(password)) {
            errorObj.password = 'Password must be at least 8 characters with numbers, letters, and special characters';
            error = true;
        }
        
        setErrors(errorObj);
        if (error) return;
        
        setIsLoading(true);
        dispatch({ type: CLEAR_AUTH_MESSAGES }); // Clear any previous messages
        dispatch(signupAction(username, email, password, props.history));
        
        // Reset loading after a delay (similar to forgot password)
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }
	return (
		<div className="login-main-page" style={{backgroundImage:"url("+ loginbg +")", backgroundSize:'cover',background: 'linear-gradient(135deg, rgb(254,161,4) 0%,rgb(121, 91, 151) 100%)',
			backdropFilter: 'blur(10px)'}}>
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
                                                        <FaBrain size={35} color="white" className="navbar-brand"/>
                                                        <p className="ms-2 fw-bold t fs-5 cus-font-color" >Smart Personal Assistant</p>
                                                        </Link>    
												</div>
												<img src={logo} className="education-img"></img>
											</div>	
										</div>
										<div className="col-xl-6 col-md-6">
											<div className="sign-in-your">
												<h4 className="fs-20 font-w800 text-black">Sign up your account</h4>
												<span>Welcome ! Register with valid email to continue</span>
												<div className="login-social">
												<div className="d-flex justify-content-left my-4">
													</div>
													</div>
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
												<form onSubmit={onSignUp}>
													<div className="mb-3">
														<label className="mb-1"><strong>Username</strong></label> 
														<input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" 
															required  />
														{errors.loginInput && <div className="text-danger fs-12">{errors.username}</div>} 
													</div>
													<div className="mb-3">
														<label className="mb-1"><strong>Email</strong></label> 
														<input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" 
															required  />
														{errors.email && <div className="text-danger fs-12">{errors.email}</div>} 
													</div>
													<PasswordInput
														value={password}
														onChange={(e) => {
															setPassword(e.target.value);
															if (e.target.value) {
																validatePassword(e.target.value);
															} else {
																setPasswordStrength(0);
																setPasswordRequirements({
																	length: false,
																	number: false,
																	character: false,
																	special: false
																});
															}
														}}
														placeholder="Enter password"
														label="Password"
														error={errors.password}
													/>
													
													{/* Password Strength Bar */}
													{password && (
														<div className="mt-2">
															<div className="d-flex justify-content-between align-items-center mb-1">
																<small className="text-muted">Password Strength:</small>
																<small className={`fw-bold ${getStrengthColor(passwordStrength).replace('bg-', 'text-')}`}>
																	{getStrengthText(passwordStrength)}
																</small>
															</div>
															<div className="progress" style={{ height: '8px' }}>
																<div 
																	className={`progress-bar ${getStrengthColor(passwordStrength)}`}
																	style={{ width: `${passwordStrength}%` }}
																></div>
															</div>
															
															{/* Password Requirements */}
															<div className="mt-2">
																<small className="text-muted">Requirements:</small>
																<div className="row mt-1">
																	<div className="col-6">
																		<small className={`${passwordRequirements.length ? 'text-success' : 'text-danger'}`}>
																			✓ At least 8 characters
																		</small>
																	</div>
																	<div className="col-6">
																		<small className={`${passwordRequirements.number ? 'text-success' : 'text-danger'}`}>
																			✓ At least 1 number
																		</small>
																	</div>
																</div>
																<div className="row">
																	<div className="col-6">
																		<small className={`${passwordRequirements.character ? 'text-success' : 'text-danger'}`}>
																			✓ At least 1 letter
																		</small>
																	</div>
																	<div className="col-6">
																		<small className={`${passwordRequirements.special ? 'text-success' : 'text-danger'}`}>
																			✓ At least 1 special character
																		</small>
																	</div>
																</div>
															</div>
														</div>
													)}
													<div className="row d-flex justify-content-between mt-4 mb-2">

														<div className="mb-3">
															<span>Already have an account? <button className="btn btn-link p-0 pop-on-hover text-decoration-underline" onClick={() => props.history.push('/login')}> Sign In</button>
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
																color:'#ffffff',
																borderColor:'#ffffff',
																transition: 'all 0.3s ease'
															}}
															disabled={isLoading}
														>
															{isLoading ? "SIGNING UP..." : "Sign Me Up"}
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

export default connect(mapStateToProps)(Register);

 