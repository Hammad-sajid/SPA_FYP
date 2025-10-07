import React from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";

const repeatOptions = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const EventForm = ({
  show,
  isEditing,
  form,
  errors = {},
  onChange,
  onClose,
  onSubmit,
  minDateTime,
}) => {
  return (
    <Modal show={show} onHide={onClose} backdrop="static">
      <Form onSubmit={onSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Event" : "Add New Event"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Show email source info if available */}
          {form.email_id && (
            <div className="alert alert-info mb-3">
              <i className="fas fa-envelope me-2"></i>
              <strong>Creating event from email:</strong> {form.email_sender}
            </div>
          )}
          
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Event Title
                    {errors.title && (
                      <FaExclamationTriangle 
                        className="text-danger ms-2" 
                        size={14} 
                        title="Title is required"
                      />
                    )}
                  </Form.Label>
                  <Form.Control
                    required
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    isInvalid={!!errors.title}
                    placeholder="Enter event title"
                    className={errors.title ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Description
                    {errors.description && (
                      <FaExclamationTriangle 
                        className="text-danger ms-2" 
                        size={14} 
                        title="Description is required"
                      />
                    )}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    required
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    isInvalid={!!errors.description}
                    placeholder="Enter event description"
                    className={errors.description ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Start Time
                    {errors.start_time && (
                      <FaExclamationTriangle 
                        className="text-danger ms-2" 
                        size={14} 
                        title="Invalid start time selected"
                      />
                    )}
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    required
                    name="start_time"
                    value={form.start_time}
                    onChange={onChange}
                    min={minDateTime}
                    isInvalid={!!errors.start_time}
                    className={errors.start_time ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.start_time}
                  </Form.Control.Feedback>
                  <Form.Text className={errors.start_time ? 'text-danger' : 'text-muted'}>
                    {errors.start_time ? 'Please select a valid start time' : 'Cannot select times in the past'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    End Time
                    {errors.end_time && (
                      <FaExclamationTriangle 
                        className="text-danger ms-2" 
                        size={14} 
                        title="Invalid end time selected"
                      />
                    )}
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    required
                    name="end_time"
                    value={form.end_time}
                    onChange={onChange}
                    min={minDateTime}
                    isInvalid={!!errors.end_time}
                    className={errors.end_time ? 'border-danger' : ''}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.end_time}
                  </Form.Control.Feedback>
                  <Form.Text className={errors.end_time ? 'text-danger' : 'text-muted'}>
                    {errors.end_time ? 'Please select a valid end time' : 'End time must be after start time'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Repeat</Form.Label>
                  <Form.Select name="repeat" value={form.repeat || "none"} onChange={onChange}>
                    {repeatOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select name="category" value={form.category || "general"} onChange={onChange}>
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="meeting">Meeting</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Location (optional)</Form.Label>
                  <Form.Control
                    name="location"
                    value={form.location || ""}
                    onChange={onChange}
                    placeholder="Enter event location"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Linked Task (optional)</Form.Label>
                  <Form.Control
                    name="linked_task"
                    value={form.linked_task || ""}
                    onChange={onChange}
                    placeholder="Task ID or name"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-1">
                  <Form.Label>Attach Files (optional)</Form.Label>
                  <Form.Control type="file" disabled />
                  <div className="small text-muted">Attachment demo only</div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? "Update Event" : "Add Event"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EventForm;