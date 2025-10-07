import React from "react";
import { Toast, ToastContainer, Button } from "react-bootstrap";
import { FaBell, FaClock, FaTimes, FaRegClock } from 'react-icons/fa';

const ReminderToasts = ({ reminders, onClose, onSnooze, type = 'event' }) => {
  if (!reminders || reminders.length === 0) return null;

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      {reminders.map((reminder) => (
        <Toast
          key={reminder.id}
          show={true}
          onClose={() => onClose(reminder.id)}
          delay={10000}
          autohide
          className="shadow-lg border-0"
          style={{ minWidth: '350px', maxWidth: '400px' }}
        >
          <Toast.Header 
            className="bg-gradient text-white border-0"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px 8px 0 0'
            }}
          >
            <FaBell className="me-2 text-warning" />
            <strong className="me-auto">
              {type === 'task' ? 'Task Reminder' : 'Event Reminder'}
            </strong>
            <small className="text-white-50">
              {new Date(reminder.dueTime || reminder.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </small>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => onClose(reminder.id)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </Toast.Header>
          <Toast.Body className="p-3">
            <div>
              <h6 className="fw-bold text-dark mb-2">{reminder.title}</h6>
              {reminder.description && (
                <p className="text-muted small mb-2">
                  {reminder.description}
                </p>
              )}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  <FaClock className="me-1" />
                  {type === 'task' ? 'Due' : 'Starting'}: {new Date(reminder.dueTime || reminder.time).toLocaleString()}
                </small>
                {reminder.priority && (
                  <span 
                    className={`badge rounded-pill fw-bold text-uppercase ${
                      reminder.priority === 'high' ? 'bg-danger' :
                      reminder.priority === 'medium' ? 'bg-warning text-dark' :
                      'bg-info'
                    }`}
                    style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                  >
                    {reminder.priority}
                  </span>
                )}
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="border-2"
                  onClick={() => onSnooze(reminder.id, 5)}
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '6px 12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <FaRegClock className="me-1" />
                  Snooze 5m
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  className="border-2"
                  onClick={() => onSnooze(reminder.id, 10)}
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '6px 12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <FaRegClock className="me-1" />
                  Snooze 10m
                </Button>
                {type === 'task' && (
                  <Button
                    size="sm"
                    variant="outline-success"
                    className="border-2"
                    onClick={() => onClose(reminder.id)}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 12px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default ReminderToasts;

