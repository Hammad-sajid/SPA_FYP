import React from 'react';
import { Card, Row, Col, Button, Badge, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaExclamationTriangle, FaPlus, FaChartBar } from 'react-icons/fa';

const EventResults = ({ suggestions, onAnalyzeConflicts, onBack, onAddEvent }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div>
        <Alert variant="info">
          <FaChartBar className="me-2" />
          No event suggestions found. Try adjusting your criteria.
        </Alert>
        <Button variant="outline-primary" onClick={onBack}>
          ← Back to Form
        </Button>
      </div>
    );
  }

  const getTimeOfDay = (hour) => {
    if (hour < 12) return { text: 'Morning', variant: 'primary' };
    if (hour < 17) return { text: 'Afternoon', variant: 'warning' };
    return { text: 'Evening', variant: 'success' };
  };

  const getScoreVariant = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const getScoreText = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">📅 Smart Event Scheduling Suggestions</h5>
          <p className="text-muted mb-0">Found {suggestions.length} optimal time slots for your event</p>
        </div>
        <Button variant="outline-primary" onClick={onBack}>
          ← BACK TO FORM
        </Button>
      </div>

      <Row>
        {suggestions.map((slot, index) => {
          const timeOfDay = getTimeOfDay(slot.start_hour);
          const scoreVariant = getScoreVariant(slot.final_score);
          const scoreText = getScoreText(slot.final_score);
          
          return (
            <Col key={index} lg={4} md={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header 
                  className={`text-white ${
                    index < 3 ? 'bg-danger' : 'bg-secondary'
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {index < 3 ? (
                        <>
                          <FaCalendarAlt className="me-2" />
                          Top Pick
                        </>
                      ) : (
                        <>
                          <FaClock className="me-2" />
                          Option {index + 1}
                        </>
                      )}
                    </div>
                    <Badge bg="light" text="dark" className="fs-6">
                      {slot.final_score}/100
                    </Badge>
                  </div>
                </Card.Header>
                
                <Card.Body>
                  <div className="text-center mb-3">
                    <h4 className="mb-1">{slot.start_time}</h4>
                    <p className="text-muted mb-2">to {slot.end_time}</p>
                    <Badge bg={timeOfDay.variant} className="fs-6">
                      {timeOfDay.text}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Overall Score</span>
                      <span className={`text-${scoreVariant} fw-bold`}>{scoreText}</span>
                    </div>
                    <div className="progress mb-3" style={{ height: '8px' }}>
                      <div 
                        className={`progress-bar bg-${scoreVariant}`} 
                        style={{ width: `${slot.final_score}%` }}
                      ></div>
                    </div>
                    
                    <Row className="text-center">
                      <Col>
                        <div className="text-success">
                          <FaChartBar className="me-1" />
                          <strong>{slot.base_score || slot.score}</strong>
                        </div>
                        <small className="text-muted">Base</small>
                      </Col>
                      <Col>
                        <div className="text-warning">
                          <FaExclamationTriangle className="me-1" />
                          <strong>{slot.conflicts || 0}</strong>
                        </div>
                        <small className="text-muted">Conflicts</small>
                      </Col>
                      <Col>
                        <div className="text-info">
                          <FaClock className="me-1" />
                          <strong>{slot.gap_violations || 0}</strong>
                        </div>
                        <small className="text-muted">Gaps</small>
                      </Col>
                    </Row>
                  </div>

                  <div className="mb-3">
                    <div className="row text-center">
                      <div className="col">
                        <strong>Duration</strong>
                        <br />
                        <small className="text-muted">
                          {slot.formData && slot.formData.duration ? 
                            `${slot.formData.duration} min` : 
                            `${slot.duration_hours}h`
                          }
                        </small>
                      </div>
                      <div className="col">
                        <strong>Start Hour</strong>
                        <br />
                        <small className="text-muted">{slot.start_time}</small>
                      </div>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => onAddEvent(slot)}
                      className="mb-2"
                    >
                      <FaPlus className="me-2" />
                      Add Event
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={() => onAnalyzeConflicts(slot.id || `slot_${index}`)}
                    >
                      <FaExclamationTriangle className="me-2" />
                      Analyze Conflicts
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Alert variant="info" className="mt-4">
        <strong>💡 How to use:</strong> Click "Add Event" to schedule an event at the suggested time, 
        or "Analyze Conflicts" to see detailed information about potential scheduling conflicts.
      </Alert>
    </div>
  );
};

export default EventResults;

