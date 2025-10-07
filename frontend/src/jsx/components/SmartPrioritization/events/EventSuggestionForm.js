import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaLightbulb, FaCog } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const EventSuggestionForm = ({ onSubmit, userPreferences, loading }) => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    duration: 60,
    priority: 'medium',
    category: 'work',
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

  return (
    <div>
      <Card>
        <Card.Header className=" text-black">
          <h6 className="mb-0">
            <FaCalendarAlt className="me-2" />
            Event Scheduling Suggestions
          </h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Event Duration (minutes)
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
                    Event Priority
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
                    <FaCalendarAlt className="me-2" />
                    Event Category
                  </Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="work">Work</option>
                    <option value="meeting">Meeting</option>
                    <option value="personal">Personal</option>
                    <option value="appointment">Appointment</option>
                    <option value="social">Social</option>
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
                    Analyzing Schedule...
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="me-2" />
                    Get Smart Event Scheduling Suggestions
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
              <strong>💡 Smart Event Scheduling:</strong> Our AI analyzes your calendar, 
              working hours, energy levels, and preferences to suggest the optimal 
              times for scheduling your events.
            </Alert>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EventSuggestionForm;
