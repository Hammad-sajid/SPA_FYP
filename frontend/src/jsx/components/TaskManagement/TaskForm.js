import React from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";

const TaskForm = ({
  show,
  isEditing,
  form,
  errors = {},
  onChange,
  onClose,
  onSubmit,
  minDateTime,
  users = [], // Users for assignment dropdown
}) => {
  return (
    <Modal show={show} onHide={onClose} backdrop="static" size="lg" dialogClassName="task-form-modal">
      <Form onSubmit={onSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Task" : "Add New Task"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Task Title
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
                  placeholder="Enter task title"
                  className={`form-control-lg ${errors.title ? 'border-danger' : ''}`}
                  style={{ minHeight: '50px' }}
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
                      title="Description is required"
                    />
                  )}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  required
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  isInvalid={!!errors.description}
                  placeholder="Enter task description"
                  className={`form-control-lg ${errors.description ? 'border-danger' : ''}`}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.description}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Due Date 
                  {errors.due_date && (
                    <FaExclamationTriangle 
                      className="text-danger ms-2" 
                      title="Invalid date selected"
                    />
                  )}
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  required
                  name="due_date"
                  value={form.due_date}
                  onChange={onChange}
                  min={minDateTime}
                  isInvalid={!!errors.due_date}
                  className={`form-control-lg ${errors.due_date ? 'border-danger' : ''}`}
                  style={{ minHeight: '50px' }}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.due_date}
                </Form.Control.Feedback>
                <Form.Text className={errors.due_date ? 'text-danger' : 'text-muted'}>
                  {errors.due_date ? 'Please select a future date' : 'Cannot select dates in the past'}
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <Form.Control
                  name="tags"
                  value={form.tags || ""}
                  onChange={onChange}
                  placeholder="e.g. work, personal"
                  className="form-control-lg"
                  style={{ minHeight: '50px' }}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Priority Level</Form.Label>
                <Form.Select
                  name="importance"
                  value={form.importance}
                  onChange={onChange}
                  className="form-select-lg"
                  style={{ minHeight: '50px' }}
                >
                  <option value={3}>High</option>
                  <option value={2}>Medium</option>
                  <option value={1}>Low</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={form.category || ""}
                  className="form-select-lg"
                  style={{ minHeight: '50px' }}
                >
                  <option value="">Select Category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="urgent">Urgent</option>
                  <option value="long-term">Long-term</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Assigned To (optional)</Form.Label>
                <Form.Control
                  name="assigned_to"
                  value={form.assigned_to || ""}
                  onChange={onChange}
                  placeholder="User name or ID"
                  className="form-control-lg"
                  style={{ minHeight: '50px' }}
                />
                {users.length > 0 && (
                  <Form.Select 
                    className="mt-2 form-select-lg"
                    style={{ minHeight: '50px' }}
                    onChange={(e) => {
                      if (e.target.value) {
                        onChange({ target: { name: 'assigned_to', value: e.target.value } });
                      }
                    }}
                  >
                    <option value="">Or select from existing users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.username}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                )}
                <Form.Text className="text-muted">
                  Enter username manually or select from dropdown above
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Estimated Minutes (optional)</Form.Label>
                <Form.Control
                  type="number"
                  name="estimated_minutes"
                  value={form.estimated_minutes || ""}
                  onChange={onChange}
                  placeholder="e.g. 30"
                  min="1"
                  className="form-control-lg"
                  style={{ minHeight: '50px' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Urgency Score (optional)</Form.Label>
                <Form.Control
                  type="number"
                  name="urgency_score"
                  value={form.urgency_score || ""}
                  onChange={onChange}
                  placeholder="1-10"
                  min="1"
                  max="10"
                  className="form-control-lg"
                  style={{ minHeight: '50px' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} size="lg">
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="lg">
            {isEditing ? "Update Task" : "Add Task"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TaskForm;

