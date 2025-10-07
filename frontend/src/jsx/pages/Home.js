// src/jsx/pages/HomePage.js
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import Header from '../components/Home/Header';
import Header_login from '../components/Home/Header_login';
import Hero from '../components/Home/Hero';
import About from '../components/Home/About';
import Features from '../components/Home/Features';
import Contact from '../components/Home/Contact';
import Footer from '../components/Home/Footer';

const HomePage = ({ isAuthenticated, user }) => {
  useEffect(() => {
    // Any global homepage effects can go here
  }, []);

  return (
    <div className="homepage">
      {/* Animated Background Particles */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Conditional Header Component */}
      {isAuthenticated ? (
        <Header_login user={user} />
      ) : (
        <Header />
      )}

      {/* Hero Component */}
      <Hero />

      {/* About Component */}
      <About />

      {/* Features Component */}
      <Features />

      {/* Contact Component */}
      <Contact />

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

// Connect to Redux store
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.user !== null,
  user: state.auth.user
});

export default connect(mapStateToProps)(HomePage);
