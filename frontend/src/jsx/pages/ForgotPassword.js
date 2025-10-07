import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { forgotPassword } from "../../services/AuthService";
import { FaBrain } from "react-icons/fa";

// image
import loginbg from "../../images/bg-1.jpg";
import logo from "../../images/log.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email address!");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      // Navigate to reset code page with email
      history.push("/reset-code", { email });
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="login-main-page" style={{
      backgroundImage: "url(" + loginbg + ")", backgroundSize: 'cover', background: 'linear-gradient(135deg, rgb(254,161,4) 0%,rgb(121, 91, 151) 100%)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="login-wrapper">
        <div className="container h-100">
          <div className="row h-100 align-items-center justify-contain-center">
            <div className="col-xl-12 mt-3">
              <div className="card">
                <div className="card-body p-0">
                  <div className="row m-0">
                    <div className="col-xl-6 col-md-6 sign text-center " style={{ minHeight: '500px' }}>
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
                        <h4 className="fs-20 font-w800 text-black mb-3">Forgot Password</h4>
                        <p className="text-muted mb-4">Enter your email address to receive a password reset code</p>
                        <form onSubmit={onSubmit}>
                          <div className="mb-4">
                            <label className="mb-2"><strong>Email</strong></label>
                            <input
                              type="email"
                              className="form-control"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email address"
                              required
                            />
                          </div>
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
                              {isLoading ? "SENDING..." : "SUBMIT"}
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

export default ForgotPassword;
