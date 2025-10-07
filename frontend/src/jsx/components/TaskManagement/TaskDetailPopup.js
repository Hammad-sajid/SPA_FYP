import React from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import { FaCalendarAlt, FaTag, FaUser, FaExclamationTriangle, FaCheckCircle ,FaEdit } from "react-icons/fa";

const TaskDetailPopup = ({ show, task, onClose, onEdit }) => {
  if (!task) return null;

  const getPriorityBadge = (importance) => {
    const priorityMap = {
      3: { text: "High", variant: "danger" },
      2: { text: "Medium", variant: "warning" },
      1: { text: "Low", variant: "success" }
    };
    const priority = priorityMap[importance] || priorityMap[1];
    return <Badge bg={priority.variant}>{priority.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  const isOverdue = () => {
    if (!task.due_date || task.completed) return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaExclamationTriangle className="me-2 text-primary" />
          Task Details
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="mb-4">
          <h4 className="mb-2">{task.title}</h4>
          <p className="text-muted mb-3">{task.description || "No description provided"}</p>
          
          {isOverdue() && (
            <div className="alert alert-warning d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <strong>This task is overdue!</strong>
            </div>
          )}
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <FaCalendarAlt className="me-2" />
                Due Date
              </h6>
              <p className={`mb-0 ${isOverdue() ? 'text-danger fw-bold' : ''}`}>
                {formatDate(task.due_date)}
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <h6 className="text-muted mb-2">
                <FaTag className="me-2" />
                Priority
              </h6>
              <div>{getPriorityBadge(task.importance)}</div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaTag className="me-2" />
            Status
          </h6>
          <p className="mb-0 fw-bold">
            {task.completed ? "Completed" : "Pending"}
          </p>
        </div>

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaTag className="me-2" />
            Tags
          </h6>
          {task.tags && task.tags.trim() ? (
            <div className="d-flex flex-wrap gap-1">
              {task.tags.split(',').map((tag, index) => (
                <Badge key={index} bg="secondary" className="me-1">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">No tags assigned</p>
          )}
        </div>

        {task.assigned_to_username && (
          <div className="mb-3">
            <h6 className="text-muted mb-2">
              <FaUser className="me-2" />
              Assigned To
            </h6>
            <p className="mb-0">{task.assigned_to_username}</p>
          </div>
        )}

        {task.category && (
          <div className="mb-3">
            <h6 className="text-muted mb-2">
              <FaTag className="me-2" />
              Category
            </h6>
            <p className="mb-0">
              <Badge bg="info">{task.category}</Badge>
            </p>
          </div>
        )}

        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <FaUser className="me-2" />
            Created By
          </h6>
          <p className="mb-0">{task.user_username || "Unknown"}</p>
        </div>


        {task.completed && task.completed_at && (
          <div className="mb-3">
            <h6 className="text-muted mb-2">
              <FaCheckCircle className="me-2" />
              Completed On
            </h6>
            <p className="mb-0">{formatDate(task.completed_at)}</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onEdit}>
          <FaEdit className="me-2" />
          Edit Task
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskDetailPopup; 