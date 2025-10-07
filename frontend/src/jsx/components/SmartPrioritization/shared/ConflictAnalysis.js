import React from 'react';
import { Card, Row, Col, Button, Badge, Alert, Table } from 'react-bootstrap';
import { FaExclamationTriangle, FaClock, FaCalendarAlt, FaArrowLeft, FaLightbulb } from 'react-icons/fa';

const ConflictAnalysis = ({ analysis, onBack, type = "event" }) => {
  if (!analysis) {
    return (
      <div>
        <Alert variant="info">
          <FaExclamationTriangle className="me-2" />
          No conflict analysis available.
        </Alert>
        <Button variant="outline-primary" onClick={onBack}>
          ← Back
        </Button>
      </div>
    );
  }

  // Handle suggested slot analysis
  if (analysis.type === "suggested_slot") {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">
              <FaLightbulb className="me-2" />
              Suggested Slot Analysis
            </h5>
            <p className="text-muted mb-0">
              Analysis of the suggested time slot for your {type}
            </p>
          </div>
          <Button variant="outline-primary" onClick={onBack}>
            <FaArrowLeft className="me-2" />
            BACK
          </Button>
        </div>

        <Alert variant="success" className="mb-4">
          <FaLightbulb className="me-2" />
          <strong>Great News!</strong> {analysis.message}
        </Alert>

        <Card>
          <Card.Header className="bg-success text-white">
            <h6 className="mb-0">
              <FaExclamationTriangle className="me-2" />
              Slot Analysis Results
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Slot Information:</h6>
                <p><strong>Slot ID:</strong> {analysis.slot_id}</p>
                <p><strong>Type:</strong> {type === "task" ? "Task Scheduling" : "Event Scheduling"}</p>
              </Col>
              <Col md={6}>
                <h6>Recommendations:</h6>
                <ul className="mb-0">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Handle existing event analysis (original functionality)
  const getConflictSeverity = (conflicts) => {
    if (conflicts === 0) return { variant: 'success', text: 'No Conflicts' };
    if (conflicts <= 2) return { variant: 'warning', text: 'Minor Conflicts' };
    return { variant: 'danger', text: 'Major Conflicts' };
  };

  const getTimeConflictVariant = (minutes) => {
    if (minutes <= 15) return 'success';
    if (minutes <= 60) return 'warning';
    return 'danger';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            <FaExclamationTriangle className="me-2" />
            {type === "task" ? "Task Workload Analysis" : "Event Conflict Analysis"}
          </h5>
          <p className="text-muted mb-0">
            {type === "task" 
              ? "Detailed analysis of your current workload and scheduling conflicts"
              : "Detailed analysis of scheduling conflicts and recommendations"
            }
          </p>
        </div>
        <Button variant="outline-primary" onClick={onBack}>
          <FaArrowLeft className="me-2" />
          BACK
        </Button>
      </div>

      <Row>
        {/* Summary Card */}
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <FaExclamationTriangle className="me-2" />
                Summary
              </h6>
            </Card.Header>
            <Card.Body className="text-center">
              {analysis.type === "existing_event" && analysis.event && (
                <div className="mb-3">
                  <h6 className="text-primary mb-1">Event Details</h6>
                  <p className="text-muted mb-0">
                    <strong>{analysis.event.title}</strong><br />
                    <small>
                      {new Date(analysis.event.start_time).toLocaleString()} - 
                      {new Date(analysis.event.end_time).toLocaleString()}
                    </small>
                  </p>
                </div>
              )}
              
              <div className="mb-3">
                <h2 className="text-primary mb-1">
                  {analysis.conflicts?.total_conflicts || analysis.total_conflicts || analysis.conflicts?.length || 0}
                </h2>
                <p className="text-muted mb-0">Total Conflicts</p>
              </div>
              
              <div className="mb-3">
                <h4 className="text-success mb-1">
                  {analysis.free_slots || 0}
                </h4>
                <p className="text-muted mb-0">Available Slots</p>
              </div>

              <div className="mb-3">
                <Badge 
                  bg={getConflictSeverity(analysis.conflicts?.total_conflicts || analysis.total_conflicts || analysis.conflicts?.length || 0).variant}
                  className="fs-6 p-2"
                >
                  {getConflictSeverity(analysis.conflicts?.total_conflicts || analysis.total_conflicts || analysis.conflicts?.length || 0).text}
                </Badge>
              </div>

              <div className="text-start">
                <p className="mb-1">
                  <strong>Working Hours:</strong><br />
                  <small className="text-muted">
                    {analysis.working_hours_start || "09:00"} - {analysis.working_hours_end || "18:00"}
                  </small>
                </p>
                <p className="mb-0">
                  <strong>Min Gap:</strong><br />
                  <small className="text-muted">
                    {analysis.min_gap || 15} minutes
                  </small>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Conflicts Details */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">
                <FaExclamationTriangle className="me-2" />
                {type === "task" ? "Workload Conflicts" : "Scheduling Conflicts"}
              </h6>
            </Card.Header>
            <Card.Body>
              {analysis.conflicts && (analysis.conflicts.local || analysis.conflicts.google_calendar) && 
               (analysis.conflicts.local.length > 0 || analysis.conflicts.google_calendar.length > 0) ? (
                <>
                  {/* Local Conflicts */}
                  {analysis.conflicts.local && analysis.conflicts.local.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-warning">Local Calendar Conflicts</h6>
                      <Table responsive striped size="sm">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Time</th>
                            <th>Overlap</th>
                            <th>Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.conflicts.local.map((conflict, index) => (
                            <tr key={index}>
                              <td>
                                <FaCalendarAlt className="me-2 text-muted" />
                                {conflict.title}
                              </td>
                              <td>
                                <FaClock className="me-2 text-muted" />
                                {new Date(conflict.start_time).toLocaleTimeString()} - 
                                {new Date(conflict.end_time).toLocaleTimeString()}
                              </td>
                              <td>
                                <Badge bg="warning">
                                  {conflict.overlap_minutes} min
                                </Badge>
                              </td>
                              <td>
                                <Badge 
                                  bg={getTimeConflictVariant(conflict.overlap_minutes || 0)}
                                >
                                  {conflict.overlap_minutes || 0} min
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {/* Google Calendar Conflicts */}
                  {analysis.conflicts.google_calendar && analysis.conflicts.google_calendar.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-info">Google Calendar Conflicts</h6>
                      <Table responsive striped size="sm">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Time</th>
                            <th>Overlap</th>
                            <th>Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.conflicts.google_calendar.map((conflict, index) => (
                            <tr key={index}>
                              <td>
                                <FaCalendarAlt className="me-2 text-info" />
                                {conflict.title}
                              </td>
                              <td>
                                <FaClock className="me-2 text-muted" />
                                {new Date(conflict.start_time).toLocaleTimeString()} - 
                                {new Date(conflict.end_time).toLocaleTimeString()}
                              </td>
                              <td>
                                <Badge bg="info">
                                  {conflict.overlap_minutes} min
                                </Badge>
                              </td>
                              <td>
                                <Badge 
                                  bg={getTimeConflictVariant(conflict.overlap_minutes || 0)}
                                >
                                  {conflict.overlap_minutes || 0} min
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="success">
                  <FaCalendarAlt className="me-2" />
                  No conflicts detected! Your schedule looks clear.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recommendations */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">
              <FaLightbulb className="me-2" />
              Recommendations
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {analysis.suggestions.map((rec, index) => (
                <Col key={index} md={6} className="mb-3">
                  <div className="d-flex align-items-start">
                    <Badge bg="info" className="me-3 mt-1">
                      {index + 1}
                    </Badge>
                    <div>
                      <h6 className="mb-1">
                        {rec.type === "reschedule" ? "Reschedule Event" : "Conflict Resolution"}
                      </h6>
                      <p className="text-muted mb-0 small">
                        {rec.type === "reschedule" ? 
                          `Move ${rec.conflict_event} to start ${rec.overlap_minutes + 15} minutes later` :
                          rec
                        }
                      </p>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Free Time Slots */}
      {analysis.free_slots_details && analysis.free_slots_details.length > 0 && (
        <Card>
          <Card.Header className="bg-success text-white">
            <h6 className="mb-0">
              <FaCalendarAlt className="me-2" />
              Available Time Slots
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {analysis.free_slots_details.map((slot, index) => (
                <Col key={index} md={4} className="mb-3">
                  <Card className="text-center h-100">
                    <Card.Body>
                      <h6 className="text-success mb-2">
                        <FaClock className="me-2" />
                        {slot.start_time} - {slot.end_time}
                      </h6>
                      <p className="text-muted mb-2">
                        Duration: {slot.duration_hours || 1}h
                      </p>
                      <Badge bg="success">
                        Score: {slot.score || 85}/100
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      <Alert variant="info" className="mt-4">
        <strong>💡 How to resolve conflicts:</strong> 
        {type === "task" 
          ? " Consider rescheduling lower priority tasks or breaking larger tasks into smaller chunks."
          : " Consider adjusting event times, reducing duration, or finding alternative time slots."
        }
      </Alert>
    </div>
  );
};

export default ConflictAnalysis;
