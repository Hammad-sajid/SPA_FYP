import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaLightbulb, FaClock, FaExclamationTriangle, FaTasks, FaCog } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const TaskSuggestionForm = ({ onSubmit, userPreferences, userTasks, loading }) => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    duration: 60,
    priority: 'medium',
    urgency: 'medium',
    preferred_date: '',
    preferred_time_start: '',
    preferred_time_end: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate workload statistics
  const highPriorityTasks = userTasks.filter(task => task.priority === 'high').length;
  const overdueTasks = userTasks.filter(task => task.overdue).length;
  const totalTasks = userTasks.length;

  const getWorkloadStatus = () => {
    if (highPriorityTasks <= 2) return { variant: 'success', text: 'Good Workload Balance' };
    if (highPriorityTasks <= 5) return { variant: 'warning', text: 'Moderate Workload' };
    return { variant: 'danger', text: 'High Workload' };
  };

  const workloadStatus = getWorkloadStatus();

  return (
    <div>
      <Card>
        <Card.Header className="text-black">
          <h6 className="mb-0">
            <FaLightbulb className="me-2" />
            Task Prioritization & Scheduling
          </h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Task Duration (minutes)
                  </Form.Label>
                  <Form.Select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                    <option value={240}>4 hours</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaLightbulb className="me-2" />
                    Task Priority
                  </Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaExclamationTriangle className="me-2" />
                    Task Urgency
                  </Form.Label>
                  <Form.Select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                  >
                    <option value="low">Low Urgency</option>
                    <option value="medium">Medium Urgency</option>
                    <option value="high">High Urgency</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Preferred Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Preferred Start Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    name="preferred_time_start"
                    value={formData.preferred_time_start}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Preferred End Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    name="preferred_time_end"
                    value={formData.preferred_time_end}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Workload Analysis */}
            <Card className="mb-3 bg-light">
              <Card.Body>
                <h6 className="mb-3">
                  <FaTasks className="me-2" />
                  Current Workload Analysis
                </h6>
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <Badge bg="primary" className="fs-6 p-2">
                        {totalTasks}
                      </Badge>
                      <div className="small text-muted mt-1">Total Tasks</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <Badge bg="danger" className="fs-6 p-2">
                        {highPriorityTasks}
                      </Badge>
                      <div className="small text-muted mt-1">High Priority</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <Badge bg="warning" className="fs-6 p-2">
                        {overdueTasks}
                      </Badge>
                      <div className="small text-muted mt-1">Overdue</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <Badge bg={workloadStatus.variant} className="fs-6 p-2">
                        {workloadStatus.text}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Analyzing Task Schedule...
                  </>
                ) : (
                  <>
                    <FaLightbulb className="me-2" />
                    Get Smart Task Scheduling Suggestions
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={() => history.push('/smart-prioritization/preferences')}
              >
                <FaCog className="me-2" />
                Configure Preferences
              </Button>
            </div>

            <Alert variant="info" className="mb-0">
              <strong>💡 Smart Task Scheduling:</strong> Our AI analyzes your current workload, 
              task priorities, energy levels, and available time slots to suggest the optimal 
              times for completing your tasks.
            </Alert>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TaskSuggestionForm;
