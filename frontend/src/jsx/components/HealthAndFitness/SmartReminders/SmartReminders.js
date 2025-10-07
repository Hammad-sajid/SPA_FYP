import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Modal, Form, Alert, ListGroup } from 'react-bootstrap';
import { FaBell, FaPlus, FaEdit, FaTrash, FaCheck, FaClock, FaCalendarAlt } from 'react-icons/fa';
import HealthService from '../../../../services/HealthService';

const SmartReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    title: '',
    type: 'medication',
    time: '',
    date: '',
    frequency: 'once',
    notes: '',
    active: true
  });

  // Load reminders when component mounts
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      // For now, using user ID 1 - you can get this from your auth context
      const response = await HealthService.getHealthReminders(1, true);
      setReminders(response);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setMessage({ text: 'Error loading reminders', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'medication',
      time: '',
      date: '',
      frequency: 'once',
      notes: '',
      active: true
    });
    setEditingReminder(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const reminderData = {
        user_id: 1, // Replace with actual user ID from auth
        ...formData
      };

      if (editingReminder) {
        await HealthService.updateHealthReminder(editingReminder.id, reminderData);
        setMessage({ text: 'Reminder updated successfully!', type: 'success' });
      } else {
        await HealthService.createHealthReminder(reminderData);
        setMessage({ text: 'Reminder created successfully!', type: 'success' });
      }

      setShowModal(false);
      resetForm();
      loadReminders();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);

    } catch (error) {
      console.error('Error saving reminder:', error);
      setMessage({ 
        text: `Error ${editingReminder ? 'updating' : 'creating'} reminder. Please try again.`, 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      type: reminder.type,
      time: reminder.reminder_date ? reminder.reminder_date.split('T')[0] : '',
      date: reminder.reminder_date ? reminder.reminder_date.split('T')[0] : '',
      frequency: reminder.frequency,
      notes: reminder.notes || '',
      active: reminder.active
    });
    setShowModal(true);
  };

  const handleDelete = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await HealthService.deleteHealthReminder(reminderId);
        setMessage({ text: 'Reminder deleted successfully!', type: 'success' });
        loadReminders();
        
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 3000);
      } catch (error) {
        console.error('Error deleting reminder:', error);
        setMessage({ text: 'Error deleting reminder', type: 'danger' });
      }
    }
  };

  const handleMarkTaken = async (reminderId) => {
    try {
      await HealthService.markReminderTaken(reminderId);
      setMessage({ text: 'Reminder marked as taken!', type: 'success' });
      loadReminders();
      
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error marking reminder as taken:', error);
      setMessage({ text: 'Error updating reminder', type: 'danger' });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medication': return '💊';
      case 'appointment': return '🏥';
      case 'exercise': return '💪';
      case 'hydration': return '💧';
      case 'checkup': return '🔍';
      default: return '🔔';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'medication': return 'danger';
      case 'appointment': return 'primary';
      case 'exercise': return 'success';
      case 'hydration': return 'info';
      case 'checkup': return 'warning';
      default: return 'secondary';
    }
  };

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'once': return 'Once';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'hourly': return 'Hourly';
      default: return frequency;
    }
  };

  const isOverdue = (reminder) => {
    const reminderDate = new Date(reminder.reminder_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reminderDate < today && reminder.active;
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div>
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>🔔 Smart Health Reminders</h4>
        <Button variant="primary" onClick={openModal}>
          <FaPlus className="me-2" />
          Add Reminder
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaBell className="display-4 text-muted mb-3" />
            <h5>No reminders set</h5>
            <p className="text-muted">Create your first health reminder to get started</p>
            <Button variant="primary" onClick={openModal}>
              <FaPlus className="me-2" />
              Add First Reminder
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {reminders.map((reminder) => (
            <Col lg={6} md={12} key={reminder.id} className="mb-4">
              <Card className={`h-100 ${isOverdue(reminder) ? 'border-danger' : ''}`}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2">{getTypeIcon(reminder.type)}</span>
                    <Badge bg={getTypeColor(reminder.type)}>
                      {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}
                    </Badge>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEdit(reminder)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <h6 className="card-title">{reminder.title}</h6>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaCalendarAlt className="me-2 text-muted" />
                      <small className="text-muted">
                        {new Date(reminder.reminder_date).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <FaClock className="me-2 text-muted" />
                      <small className="text-muted">
                        {reminder.time} • {getFrequencyText(reminder.frequency)}
                      </small>
                    </div>
                  </div>

                  {reminder.notes && (
                    <p className="card-text small text-muted mb-3">{reminder.notes}</p>
                  )}

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {isOverdue(reminder) && (
                        <Badge bg="danger" className="me-2">Overdue</Badge>
                      )}
                      <Badge bg={reminder.active ? 'success' : 'secondary'}>
                        {reminder.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {reminder.type === 'medication' && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleMarkTaken(reminder.id)}
                      >
                        <FaCheck className="me-1" />
                        Mark Taken
                      </Button>
                    )}
                  </div>

                  {reminder.last_taken && (
                    <small className="text-muted d-block mt-2">
                      Last taken: {new Date(reminder.last_taken).toLocaleString()}
                    </small>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add/Edit Reminder Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Take blood pressure medication"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                  >
                    <option value="medication">Medication</option>
                    <option value="appointment">Doctor Appointment</option>
                    <option value="exercise">Exercise</option>
                    <option value="hydration">Hydration</option>
                    <option value="checkup">Health Check-up</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Frequency *</Form.Label>
                  <Form.Select
                    value={formData.frequency}
                    onChange={(e) => handleInputChange('frequency', e.target.value)}
                    required
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="active-switch"
                    label="Active"
                    checked={formData.active}
                    onChange={(e) => handleInputChange('active', e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Additional notes or instructions..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingReminder ? 'Update Reminder' : 'Create Reminder')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default SmartReminders;
