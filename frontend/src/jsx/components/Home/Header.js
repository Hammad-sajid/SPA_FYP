import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBrain } from 'react-icons/fa';
import loginbg from '../../../images/bg-1.jpg';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'features', label: 'Features' },
  { id: 'contact', label: 'Contact Us' },
];

const Header = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);

      const scrollPositionWithOffset = scrollPosition + 120;
      let currentSection = 'home';
      for (const sec of sections) {
        const ref = document.getElementById(sec.id);
        if (ref && ref.offsetTop <= scrollPositionWithOffset) {
          currentSection = sec.id;
        }
      }
      setActiveSection(currentSection);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id) => (e) => {
    e.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
    
    // Close mobile menu if open
    const navbarCollapse = document.getElementById('mainNavbar');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      const bsCollapse = new window.bootstrap.Collapse(navbarCollapse, {
        toggle: false
      });
      bsCollapse.hide();
    }
  };

  return (
    <nav className={`navbar-hm navbar-expand-lg sticky-top p-3 ${isScrolled ? 'navbar-scrolled' : ''}`}
      style={{ backgroundImage: "url(" + loginbg + ")", backgroundSize: 'cover', backgroundPosition: 'center', backdropFilter: 'blur(10px)' }}>
      <div className="container-fluid px-4">
        {/* Logo - Left Side */}
        <Link className="d-flex align-items-center" to="/">
          <FaBrain size={35} color="white" className="navbar-brand" />
          <span className="ms-2 fw-bold text-white fs-5">Smart Assistant</span>
        </Link>
        
        {/* Hamburger Button - Right Side */}
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar"
          aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation"
          style={{ borderColor: '#ffffff', color: '#ffffff' }}>
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="mainNavbar">
          {/* Navigation Links - Center */}
          <ul className="hm-navbar-nav mx-auto mb-2 mb-lg-0 ">
            {sections.map((sec, index) => (
              <li className="nav-item" key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className={`nav-link fw-semibold text-nowrap text-white${activeSection === sec.id ? ' active' : ''}`}
                  onClick={handleNavClick(sec.id)}
                >
                  {sec.label}
                  {activeSection === sec.id && <span className="active-indicator"></span>}
                </a>
              </li>
            ))}
          </ul>
          
          {/* Buttons - Right Side */}
          <div className="d-flex flex-column flex-lg-row gap-2 gap-lg-3">
            <Link to="/register" className="btn cus-eff btn-outline-light text-nowrap px-4 py-2 fw-semibold">
              <span>Register</span>
            </Link>
            <Link to="/login" className="btn cus-eff btn-outline-light text-nowrap px-4 py-2 fw-semibold">
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header; 