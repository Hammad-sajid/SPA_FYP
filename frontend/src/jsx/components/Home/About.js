import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaListUl, FaCalendarAlt, FaBell, FaChartBar } from 'react-icons/fa';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="about" className="py-5" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        <div className="row align-items-center">
          <div className={`col-lg-6 mb-5 mb-lg-0 about-content ${isVisible ? 'visible' : ''}`}>
            <h4 className="display-5 fw-bold mb-4 about-title cus-font-color">
              About SPA
            </h4>
            <p className="lead mb-4 text-muted lh-lg justify-content-evenly">
              <strong>Smart Personal Assistant</strong> is designed to simplify and enhance your daily life.
              By combining powerful tools like task management, smart scheduling, and personalized AI recommendations,
              we help users stay productive, healthy, and organized.
            </p>
            <p className="text-muted lh-lg fs-5 justify-content-evenly">
              Whether it's automating your to-do list or adjusting to your habits, our assistant evolves with you —
              making life easier, smarter, and more focused.
            </p>
            <div className="mt-4">
              <div className="row g-3">
                {[
                  { icon: "fas fa-check-circle", text: "AI-Powered" },
                  { icon: "fas fa-clock", text: "24/7 Available" },
                  { icon: "fas fa-shield-alt", text: "Secure & Private" },
                  { icon: "fas fa-mobile-alt", text: "Cross-Platform" }
                ].map((item, index) => (
                  <div className="col-6" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="d-flex align-items-center feature-item">
                      <i className={`${item.icon} text-success me-2`} style={{ fontSize: '1.2rem' }}></i>
                      <span className="text-dark fw-medium">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={`col-lg-6 text-center about-content ${isVisible ? 'visible' : ''}`}>
            <div className="about-widget-container">
              <motion.div
                className="about-widget"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {/* Status Dots */}
                <div className="status-dots">
                  <div className="status-dot status-red"></div>
                  <div className="status-dot status-yellow"></div>
                  <div className="status-dot status-green"></div>
                </div>
                
                {/* Gradient Bar */}
                <div className="gradient-bar"></div>
                
                {/* Placeholder Lines */}
                <div className="placeholder-lines">
                  <div className="placeholder-line long"></div>
                  <div className="placeholder-line short"></div>
                </div>
                
                {/* Feature Cards */}
                <div className="feature-cards">
                  <motion.div 
                    className="feature-card-item"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="feature-icon orange">
                      <FaListUl size={20} />
                    </div>
                    <span className="feature-text">ListTodo</span>
                  </motion.div>
                  
                  <motion.div 
                    className="feature-card-item"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="feature-icon purple">
                      <FaCalendarAlt size={20} />
                    </div>
                    <span className="feature-text">Calendar</span>
                  </motion.div>
                  
                  <motion.div 
                    className="feature-card-item"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="feature-icon blue">
                      <FaBell size={20} />
                    </div>
                    <span className="feature-text">Reminders</span>
                  </motion.div>
                  
                  <motion.div 
                    className="feature-card-item"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="feature-icon green">
                      <FaChartBar size={20} />
                    </div>
                    <span className="feature-text">Analytics</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 