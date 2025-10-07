import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBrain, FaCalendarAlt, FaListUl, FaBell, FaChartBar } from 'react-icons/fa';
import loginbg from '../../../images/bg-1.jpg';

// Animated Counter Component
const AnimatedCounter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;

    let currentCount = 0;
    const timer = setInterval(() => {
      currentCount += increment;
      if (currentCount >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(currentCount));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}{suffix}</span>;
};

// Floating Icon Component
const FloatingIcon = ({ icon, style, delay }) => (
  <motion.div
    className="position-absolute bg-white rounded-circle shadow d-flex justify-content-center align-items-center"
    style={{ width: '50px', height: '50px', ...style }}
    animate={{ y: [0, -20, 0] }}
    transition={{ duration: 6, repeat: Infinity, delay: delay }}
  >
    {icon}
  </motion.div>
);

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div id="home" style={{ scrollMarginTop: 80 }}>
      <div className="hero-section" style={{ backgroundImage: "url(" + loginbg + ")" }}>
        <div className="hero-overlay position-absolute w-100 h-100"></div>

        <div className="floating-elements">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="floating-element"
              style={{
                animationDelay: `${i * 0.5}s`,
                left: `${20 + i * 15}%`,
                top: `${10 + i * 10}%`,
              }}
            />
          ))}
        </div>

        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center">
            <div className={`col-lg-6 text-white hero-content ${isVisible ? 'visible' : ''}`}>
              <h1 className="display-4 fw-bold mb-4 lh-base hero-title">
                Your Smart Personal Assistant
              </h1>
              <p className="lead mb-4 fs-4 opacity-75 hero-subtitle">
                Transform your daily life with AI-powered task management, smart scheduling, and personalized recommendations that adapt to your lifestyle.
              </p>
              <div className="d-flex gap-3 flex-wrap hero-buttons">
                <Link to="/register" className="btn cus-eff btn-outline-light btn-lg px-5 py-3 fw-semibold">
                  <span>Get Started Free</span>
                </Link>
                <Link to="/login" className="btn cus-eff btn-outline-light btn-lg px-5 py-3 fw-semibold">
                  <span>Login</span>
                </Link>
              </div>

              {/* Stats Section Below Buttons */}
              <motion.div
                className="row  mt-5"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <div className="col-3">
                  <h3 className="text-white fw-bold mb-1">
                    <AnimatedCounter target={50000} suffix="+" />
                  </h3>
                  <p className="text-white-50 mb-0">Active Users</p>
                </div>
                <div className="col-3">
                  <h3 className="text-white fw-bold mb-1">
                    <AnimatedCounter target={99} suffix="%" />
                  </h3>
                  <p className="text-white-50 mb-0">Satisfaction</p>
                </div>
                <div className="col-3">
                  <h3 className="text-white fw-bold mb-1">
                    <AnimatedCounter target={24} suffix="/7" />
                  </h3>
                  <p className="text-white-50 mb-0">Support</p>
                </div>
              </motion.div>
            </div>
            <div className={`col-lg-6 text-center mt-5 mt-lg-0 hero-content ${isVisible ? 'visible' : ''}`}>
              {/* Hero Brain + Floating Icons */}
              <motion.div
                className="text-center position-relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <div className="position-relative mx-auto" style={{ width: '300px', height: '300px' }}>
                  {/* Glowing Brain */}
                  <motion.div
                    className="rounded-circle d-flex justify-content-center align-items-center position-relative"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      background: 'linear-gradient(135deg, rgb(254,161,4) 0%, rgb(97, 80, 114) 100%)',
                      position: 'relative'
                    }}
                    animate={{
                      boxShadow: [
                        "0 0 30px 10px rgba(254, 161, 4, 0.4)",
                        "0 0 60px 20px rgba(254, 161, 4, 0.7)",
                        "0 0 30px 10px rgba(254, 161, 4, 0.4)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {/* Inner Glow Layer */}
                    <div 
                      className="position-absolute rounded-circle"
                      style={{ 
                        width: '90%',
                        height: '90%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                        top: '5%',
                        left: '5%',
                        animation: 'innerGlow 2s ease-in-out infinite'
                      }}
                    ></div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FaBrain size={50} color="#fff" />
                    </motion.div>
                  </motion.div>

                  {/* Floating Icons */}
                  <FloatingIcon icon={<FaCalendarAlt color="#fd7e14" size={20} />} style={{ top: '10%', left: '10%' }} delay={0} />
                  <FloatingIcon icon={<FaListUl color="#6f42c1" size={20} />} style={{ top: '20%', right: '10%' }} delay={2} />
                  <FloatingIcon icon={<FaBell color="#fd7e14" size={20} />} style={{ bottom: '20%', left: '20%' }} delay={4} />
                  <FloatingIcon icon={<FaChartBar color="#6f42c1" size={20} />} style={{ bottom: '10%', right: '20%' }} delay={6} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 