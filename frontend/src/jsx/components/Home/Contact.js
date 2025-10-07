import React, { useState, useEffect } from 'react';

const Contact = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="contact" className="py-5 contact-section">
      <div className="container-fluid px-5">
        <div className="row align-items-center min-vh-100 gx-5 justify-content-center">
          <div className="col-lg-6 col-md-8 col-sm-10">
            <div className={`contact-info-section ${isVisible ? 'visible' : ''}`}>
              <div className="contact-content px-4 text-center text-lg-start">
                <h2 className="display-4 fw-bold text-white mb-4">
                  Contact Us
                </h2>
                <p className="lead text-white mb-5 justify-content-evenly">
                  Join thousands of users who have transformed their productivity with Smart Assistant. 
                  Get started today and experience the future of personal task management.
                </p>
                
                <div className="contact-details">
                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="text-white mb-1">Email Support</h6>
                      <p className="text-white-50 mb-0">support@smartassistant.com</p>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="text-white mb-1">Phone Support</h6>
                      <p className="text-white-50 mb-0">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="text-white mb-1">24/7 Availability</h6>
                      <p className="text-white-50 mb-0">Always here to help</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section - Start Your Free Trial Form */}
          <div className="col-lg-6 col-md-8 col-sm-10">
            <div className={`contact-form-section ${isVisible ? 'visible' : ''}`}>
              <div className="contact-form-card px-4">
                <h3 className="fw-bold cus-font-color mb-4">For Any Query Message Us</h3>
                <form>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      Message
                    </label>
                    <textarea className="form-control form-control-lg h-auto" 
                      type="text"
                      placeholder="Enter your message"
                      required
                    >
                    </textarea>
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg px-5 py-3 fw-semibold w-100 submit-btn pop-on-hover"
                    >
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-1"></div>
        </div>
      </div>
    </section>
  );
};

export default Contact; 