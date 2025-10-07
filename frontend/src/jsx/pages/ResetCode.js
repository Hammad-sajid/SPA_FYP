import React, { useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { resetPassword } from "../../services/AuthService";
import PasswordInput from "../components/Forms/Element/PasswordInput";
import { FaBrain } from 'react-icons/fa';
// image
import logo from "../../images/log.png";
import loginbg from "../../images/bg-1.jpg";

const ResetCode = () => {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const history = useHistory();

  // Get email from location state (passed from ForgotPassword component)
  const email = location.state?.email;

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      alert("Email not found. Please go back to forgot password page.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(email, code, newPassword);
      history.push("/login");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="login-main-page" style={{
        backgroundImage: "url(" + loginbg + ")",
        backgroundSize: 'cover',
        background: 'linear-gradient(135deg, rgb(254,161,4) 0%,rgb(121, 91, 151) 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="login-wrapper">
          <div className="container h-100">
            <div className="row justify-content-center h-100 align-items-center">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body text-center">
                    <h4 className="mb-4">Invalid Access</h4>
                    <p>Please go back to the forgot password page.</p>
                    <Link to="/forgot-password" className="btn btn-primary">
                      Go Back
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                    {/* Left Column - Logo and Image */}
                    <div className="col-xl-6 col-md-6 sign text-center" >
                      <div className="w-100">
                        <div className="text-center my-5">
                    <Link to="/home">
                            <FaBrain size={35} color="white" className="navbar-brand" />
                            <p className="ms-2 fw-bold fs-5 cus-font-color">Smart Personal Assistant</p>
                    </Link>
                  </div>
                        {/* <div className="mt-3"></div>  */}
                        <img src={logo} className="education-img" alt="logo"></img>
                      </div>
                    </div>
                    
                    {/* Right Column - Reset Password Form */}
                    <div className="col-xl-6 col-md-6 d-flex align-items-center">
                      <div className="sign-in-your w-100 px-4">
                        <h4 className="fs-20 font-w800 text-black mb-3">Reset Password</h4>
                        <p className="text-muted mb-4">
                          Enter the 6-digit code sent to <strong>{email}</strong> and your new password
                  </p>
                  <form onSubmit={onSubmit}>
                          <div className="mb-4">
                            <label className="mb-2"><strong>Reset Code</strong></label>
                      <input
                        type="text"
                        className="form-control"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength="6"
                        required
                      />
                    </div>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      label="New Password"
                      required={true}
                    />
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      label="Confirm New Password"
                      required={true}
                    />
                          <div className="row d-flex justify-content-between mt-4 mb-4">
                            <div className="mb-3">
                              <span>Remember your password? <Link to="/login" className="btn btn-link p-0 pop-on-hover text-decoration-underline">Sign In</Link></span>
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
                        {isLoading ? "RESETTING..." : "RESET PASSWORD"}
                      </button>
                    </div>
                  </form>
                  <div className="text-center mt-3">
                          <Link to="/forgot-password" className="btn btn-link p-0 pop-on-hover text-decoration-underline">
                      ← Back to Forgot Password
                    </Link>
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
    </div>
  );
};

export default ResetCode; 