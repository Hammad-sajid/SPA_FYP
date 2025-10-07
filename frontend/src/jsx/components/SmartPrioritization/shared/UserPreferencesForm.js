import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaCog, FaClock, FaCoffee, FaBatteryHalf, FaCalendarAlt } from 'react-icons/fa';

const UserPreferencesForm = ({ preferences, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    preferred_break_times: ["12:00", "15:00"],
    min_gap_between_events: 15,
    preferred_categories: ["work", "meeting"],
    morning_energy_level: "high",
    afternoon_energy_level: "medium",
    evening_energy_level: "low"
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        working_hours_start: preferences.working_hours_start || "09:00",
        working_hours_end: preferences.working_hours_end || "18:00",
        preferred_break_times: preferences.preferred_break_times || ["12:00", "15:00"],
        min_gap_between_events: preferences.min_gap_between_events || 15,
        preferred_categories: preferences.preferred_categories || ["work", "meeting"],
        morning_energy_level: preferences.energy_levels?.morning || "high",
        afternoon_energy_level: preferences.energy_levels?.afternoon || "medium",
        evening_energy_level: preferences.energy_levels?.evening || "low"
      });
    }
  }, [preferences]);

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

  const handleBreakTimeChange = (index, value) => {
    const newBreakTimes = [...formData.preferred_break_times];
    newBreakTimes[index] = value;
    setFormData(prev => ({
      ...prev,
      preferred_break_times: newBreakTimes
    }));
  };

  const addBreakTime = () => {
    setFormData(prev => ({
      ...prev,
      preferred_break_times: [...prev.preferred_break_times, "12:00"]
    }));
  };

  const removeBreakTime = (index) => {
    setFormData(prev => ({
      ...prev,
      preferred_break_times: prev.preferred_break_times.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...formData.preferred_categories];
    newCategories[index] = value;
    setFormData(prev => ({
      ...prev,
      preferred_categories: newCategories
    }));
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      preferred_categories: [...prev.preferred_categories, "work"]
    }));
  };

  const removeCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">⚙️ User Preferences & Settings</h5>
          <p className="text-muted mb-0">Configure your scheduling preferences for better suggestions</p>
        </div>
        <Button variant="outline-primary" onClick={onBack}>
          ← BACK
        </Button>
      </div>

      <Card>
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">
            <FaCog className="me-2" />
            Smart Prioritization Preferences
          </h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Working Hours */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Working Hours Start
                  </Form.Label>
                  <Form.Control
                    type="time"
                    name="working_hours_start"
                    value={formData.working_hours_start}
                    onChange={handleChange}
                    required
                    className="form-control-lg"
                    style={{ minHeight: '50px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Working Hours End
                  </Form.Label>
                  <Form.Control
                    type="time"
                    name="working_hours_end"
                    value={formData.working_hours_end}
                    onChange={handleChange}
                    required
                    className="form-control-lg"
                    style={{ minHeight: '50px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Break Times */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FaCoffee className="me-2" />
                Preferred Break Times
              </Form.Label>
              {formData.preferred_break_times.map((time, index) => (
                <Row key={index} className="mb-2">
                  <Col md={8}>
                    <Form.Control
                      type="time"
                      value={time}
                      onChange={(e) => handleBreakTimeChange(index, e.target.value)}
                      className="form-control-lg"
                      style={{ minHeight: '50px' }}
                    />
                  </Col>
                  <Col md={4}>
                    <Button
                      variant="outline-danger"
                      size="lg"
                      onClick={() => removeBreakTime(index)}
                      disabled={formData.preferred_break_times.length <= 1}
                      style={{ minHeight: '50px' }}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-success" size="lg" onClick={addBreakTime} style={{ minHeight: '50px' }}>
                + Add Break Time
              </Button>
            </Form.Group>

            {/* Gap Between Events */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FaCalendarAlt className="me-2" />
                Minimum Gap Between Events (minutes)
              </Form.Label>
              <Form.Select
                name="min_gap_between_events"
                value={formData.min_gap_between_events}
                onChange={handleChange}
                required
                className="form-select-lg"
                style={{ minHeight: '50px' }}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </Form.Select>
            </Form.Group>

            {/* Preferred Categories */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FaCalendarAlt className="me-2" />
                Preferred Event Categories
              </Form.Label>
              {formData.preferred_categories.map((category, index) => (
                <Row key={index} className="mb-2">
                  <Col md={8}>
                    <Form.Select
                      value={category}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      className="form-select-lg"
                      style={{ minHeight: '50px' }}
                    >
                      <option value="work">Work</option>
                      <option value="meeting">Meeting</option>
                      <option value="personal">Personal</option>
                      <option value="appointment">Appointment</option>
                      <option value="social">Social</option>
                      <option value="health">Health</option>
                      <option value="learning">Learning</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Button
                      variant="outline-danger"
                      size="lg"
                      onClick={() => removeCategory(index)}
                      disabled={formData.preferred_categories.length <= 1}
                      style={{ minHeight: '50px' }}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-success" size="lg" onClick={addCategory} style={{ minHeight: '50px' }}>
                + Add Category
              </Button>
            </Form.Group>

            {/* Energy Levels */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaBatteryHalf className="me-2" />
                    Morning Energy Level
                  </Form.Label>
                  <Form.Select
                    name="morning_energy_level"
                    value={formData.morning_energy_level}
                    onChange={handleChange}
                    required
                    className="form-select-lg"
                    style={{ minHeight: '50px' }}
                  >
                    <option value="high">High Energy</option>
                    <option value="medium">Medium Energy</option>
                    <option value="low">Low Energy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaBatteryHalf className="me-2" />
                    Afternoon Energy Level
                  </Form.Label>
                  <Form.Select
                    name="afternoon_energy_level"
                    value={formData.afternoon_energy_level}
                    onChange={handleChange}
                    required
                    className="form-select-lg"
                    style={{ minHeight: '50px' }}
                  >
                    <option value="high">High Energy</option>
                    <option value="medium">Medium Energy</option>
                    <option value="low">Low Energy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaBatteryHalf className="me-2" />
                    Evening Energy Level
                  </Form.Label>
                  <Form.Select
                    name="evening_energy_level"
                    value={formData.evening_energy_level}
                    onChange={handleChange}
                    required
                    className="form-select-lg"
                    style={{ minHeight: '50px' }}
                  >
                    <option value="high">High Energy</option>
                    <option value="medium">Medium Energy</option>
                    <option value="low">Low Energy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="mb-3"
              >
                <FaCog className="me-2" />
                Save Preferences
              </Button>
            </div>

            <Alert variant="info" className="mb-0">
              <strong>💡 How preferences work:</strong> These settings help our AI provide better 
              scheduling suggestions by understanding your working patterns, energy levels, and preferences.
            </Alert>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserPreferencesForm;
