import React from "react";
import { Modal, Badge, Button } from "react-bootstrap";
import { FaCalendarAlt, FaClock, FaTag, FaLink, FaFileAlt } from "react-icons/fa";

const EventDetailPopup = ({ show, event, onClose, onEdit, onToggleComplete }) => {
  if (!event) return null;

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'primary';
      case 'personal': return 'success';
      case 'meeting': return 'warning';
      default: return 'secondary';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'work': return 'Work';
      case 'personal': return 'Personal';
      case 'meeting': return 'Meeting';
      default: return 'General';
    }
  };

  const getRepeatLabel = (repeat) => {
    switch (repeat) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'Does not repeat';
    }
  };

  const isOverdue = () => {
    return new Date(event.end_time) < new Date();
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  const getDuration = () => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaCalendarAlt className="me-2 text-primary" />
          Event Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h4 className="mb-2">{event.title}</h4>
          <p className="text-muted mb-3">{event.description}</p>
          
          {isOverdue() && (
            <div className="alert alert-warning d-flex align-items-center">
              <FaClock className="me-2" />
              <strong>This event has ended</strong>
            </div>
          )}
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <FaClock className="me-2" />
                Start Time
              </h6>
              <p className="mb-0">{formatDateTime(event.start_time)}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <FaClock className="me-2" />
                End Time
              </h6>
              <p className="mb-0">{formatDateTime(event.end_time)}</p>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaClock className="me-2" />
            Duration
          </h6>
          <p className="mb-0">{getDuration()}</p>
        </div>

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaTag className="me-2" />
            Category
          </h6>
          <Badge bg={getCategoryColor(event.category)} className="fs-6">
            {getCategoryLabel(event.category)}
          </Badge>
        </div>

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaCalendarAlt className="me-2" />
            Repeat
          </h6>
          <p className="mb-0">{getRepeatLabel(event.repeat)}</p>
        </div>

        {event.linked_task && (
          <div className="mb-3">
            <h6 className="text-muted mb-2">
              <FaLink className="me-2" />
              Linked Task
            </h6>
            <p className="mb-0">{event.linked_task}</p>
          </div>
        )}

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaFileAlt className="me-2" />
            Attachments
          </h6>
          <p className="text-muted mb-0">No attachments (demo only)</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onEdit}>
          <FaCalendarAlt className="me-2" />
          Edit Event
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EventDetailPopup; 