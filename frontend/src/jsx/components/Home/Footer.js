import React from 'react';
import { FaBrain } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-5 footer-hm">
      <div className="container-fluid px-4">
        
        <div className="row g-4">
          {/* Branding and Description */}
          <div className="col-lg-6 col-md-6">
            <div className="footer-brand mb-4">
              <div className="d-flex align-items-center mb-3">
                <div className="footer-logo-icon me-3">
                  <FaBrain size={30} color="white" />
                </div>
                <span className="fw-bold fs-4 text-white">Smart Assistant</span>
              </div>
              <p className="text-muted mb-4 lh-base">
                Transforming daily life with AI-powered productivity tools and personalized recommendations.
              </p>
              <div className="social-links">
                {[
                  { icon: "fab fa-twitter", label: "T", href: "#" },
                  { icon: "fab fa-facebook", label: "F", href: "#" },
                  { icon: "fab fa-linkedin", label: "L", href: "#" },
                  { icon: "fab fa-instagram", label: "I", href: "#" }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="social-link-btn"
                    title={social.label}
                  >
                    <i className={social.icon}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div className="col-lg-4 col-md-6">
            <div className="footer-links align-items-center">
              <h6 className="fw-bold text-white mb-3">Company</h6>
              <ul className="list-unstyled">
                {[
                  { text: "About", href: "#about" },
                  { text: "Features", href: "#features" },
                  { text: "Contact", href: "#contact" }
                ].map((link, index) => (
                  <li key={index} className="mb-2">
                    <a href={link.href} className="footer-link">
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Back to Top */}
          <div className="col-lg-2 col-md-6">
            <div className="text-center text-lg-end">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn cus-eff btn-outline rounded-circle d-flex align-items-center justify-content-center back-to-top mx-auto ms-lg-auto"
                title="Back to Top"
              >
                <i className="fas fa-arrow-up"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="row">
          <div className="col-12">
            <hr className="border-secondary my-4" />
            <div className="text-center">
              <p className="mb-0 text-muted">
                © 2025 Smart Assistant. All rights reserved. Made with ❤️ for productivity enthusiasts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 