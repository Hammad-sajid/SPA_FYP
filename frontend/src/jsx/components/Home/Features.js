import React, { useState, useEffect, useRef } from 'react';

const featureList = [
  {
    icon: "fas fa-tasks",
    title: "Task Management System",
    subtitle: "Built-in Tools",
    desc: "Organize, track, and manage tasks, appointments, and daily activities with an intuitive, real-time dashboard."
  },
  {
    icon: "fas fa-bolt",
    title: "Smart Task Prioritization",
    subtitle: "AI Priorities",
    desc: "Automatically prioritize your day with smart digests and adaptive urgency analysis powered by behavioral data."
  },
  {
    icon: "fas fa-calendar-alt",
    title: "Calendar & Scheduling",
    subtitle: "Smart Scheduling",
    desc: "Sync across calendars and auto-schedule meetings by finding optimal slots and managing reminders seamlessly."
  },
  {
    icon: "fas fa-envelope",
    title: "Email & Communication",
    subtitle: "Smart Filters",
    desc: "Filter, organize, and prioritize emails and messages to keep your communication streamlined and efficient."
  },
  {
    icon: "fas fa-heartbeat",
    title: "Health & Wellness Alerts",
    subtitle: "Personal Wellness",
    desc: "Receive timely reminders and insights to help you stay healthy, active, and balanced throughout your day."
  },
  {
    icon: "fas fa-brain",
    title: "Behavioral Learning",
    subtitle: "Adaptive AI",
    desc: "Our assistant adapts to your habits and preferences, continuously learning to serve you better every day."
  }
];

const Features = () => {
  const [visibleFeatures, setVisibleFeatures] = useState(Array(featureList.length).fill(false));
  const [isVisible, setIsVisible] = useState(false);
  const featureRefs = useRef([]);

  useEffect(() => {
    setIsVisible(true);

    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            setVisibleFeatures((prev) => {
              const updated = [...prev];
              updated[idx] = true;
              return updated;
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => {
      featureRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section id="features" className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className={`text-center mb-5 features-header ${isVisible ? 'visible' : ''}`}>
          <h2 className="display-5 fw-bold mb-3 text-dark features-title">
            Powerful Features
          </h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Discover how our smart assistant can transform your daily routine with cutting-edge AI technology
          </p>
        </div>
        <div className="row g-4">
          {featureList.map((feature, idx) => (
            <div className="col-lg-4 col-md-6" key={feature.title}>
              <div
                className={`card h-100 border-0 shadow-sm position-relative overflow-hidden feature-card ${visibleFeatures[idx] ? 'show' : ''}`}
                ref={el => featureRefs.current[idx] = el}
                data-index={idx}
              >
                <div className="card-body p-4 text-center bg-white">
                  <div className="feature-icon-container mb-4">
                    <div className="feature-icon-wrapper d-inline-flex align-items-center justify-content-center">
                      <i className={feature.icon}></i>
                    </div>
                  </div>
                  <h5 className="fw-bold mb-2 text-dark fs-5">
                    {feature.title}
                  </h5>
                  <p className="text-muted mb-3 small fw-bold cus-font-color">
                    {feature.subtitle}
                  </p>
                  <p className="text-muted lh-base">
                    {feature.desc}
                  </p>
                </div>
                <div className="feature-overlay"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 