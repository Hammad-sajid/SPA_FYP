import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Switch, Badge } from 'react-bootstrap';
import { FaCog, FaSave, FaClock, FaEnvelope, FaBell, FaCalendar, FaToggleOn, FaToggleOff, FaSpinner } from 'react-icons/fa';

const AutoReplySettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    enabled: false,
    sendToAll: false,
    excludeContacts: [],
    
    // Timing Settings
    businessHoursOnly: true,
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC',
    delayMinutes: 0,
    
    // Content Settings
    defaultMessage: '',
    includeSignature: true,
    includeOutOfOffice: false,
    outOfOfficeMessage: '',
    
    // Advanced Settings
    maxRepliesPerDay: 50,
    excludeDomains: [],
    learningEnabled: true,
    smartCategorization: true
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newExcludeContact, setNewExcludeContact] = useState('');
  const [newExcludeDomain, setNewExcludeDomain] = useState('');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // TODO: Replace with actual API call
    const mockSettings = {
      enabled: true,
      sendToAll: false,
      excludeContacts: ['spam@example.com', 'noreply@company.com'],
      businessHoursOnly: true,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC',
      delayMinutes: 15,
      defaultMessage: 'Thank you for your email. I am currently unavailable and will respond when I return.',
      includeSignature: true,
      includeOutOfOffice: true,
      outOfOfficeMessage: 'I am currently out of the office and will return on Monday, January 15th.',
      maxRepliesPerDay: 50,
      excludeDomains: ['spam.com', 'marketing.com'],
      learningEnabled: true,
      smartCategorization: true
    };
    setSettings(mockSettings);
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const addExcludeContact = () => {
    if (newExcludeContact.trim() && !settings.excludeContacts.includes(newExcludeContact.trim())) {
      setSettings(prev => ({
        ...prev,
        excludeContacts: [...prev.excludeContacts, newExcludeContact.trim()]
      }));
      setNewExcludeContact('');
    }
  };

  const removeExcludeContact = (email) => {
    setSettings(prev => ({
      ...prev,
      excludeContacts: prev.excludeContacts.filter(e => e !== email)
    }));
  };

  const addExcludeDomain = () => {
    if (newExcludeDomain.trim() && !settings.excludeDomains.includes(newExcludeDomain.trim())) {
      setSettings(prev => ({
        ...prev,
        excludeDomains: [...prev.excludeDomains, newExcludeDomain.trim()]
      }));
      setNewExcludeDomain('');
    }
  };

  const removeExcludeDomain = (domain) => {
    setSettings(prev => ({
      ...prev,
      excludeDomains: prev.excludeDomains.filter(d => d !== domain)
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      loadSettings();
      setSuccess('Settings reset to defaults');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const getTimezoneOptions = () => [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }
  ];

  return (
    <div className="auto-reply-settings">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Form>
        {/* General Settings */}
        <Card className="mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <FaCog className="me-2 text-primary" />
              General Settings
            </h6>
          </div>
          <div className="card-body">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Enable Auto Reply</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.enabled}
                      onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Turn on automatic email responses
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Send to All Contacts</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.sendToAll}
                      onChange={(e) => handleSettingChange('sendToAll', e.target.checked)}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Reply to all incoming emails (not recommended)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Default Auto Reply Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={settings.defaultMessage}
                onChange={(e) => handleSettingChange('defaultMessage', e.target.value)}
                placeholder="Enter your default auto reply message..."
              />
              <Form.Text className="text-muted">
                This message will be sent when auto reply is enabled
              </Form.Text>
            </Form.Group>
          </div>
        </Card>

        {/* Timing Settings */}
        <Card className="mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <FaClock className="me-2 text-primary" />
              Timing Settings
            </h6>
          </div>
          <div className="card-body">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Business Hours Only</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.businessHoursOnly}
                      onChange={(e) => handleSettingChange('businessHoursOnly', e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Response Delay (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="1440"
                    value={settings.delayMinutes}
                    onChange={(e) => handleSettingChange('delayMinutes', parseInt(e.target.value) || 0)}
                  />
                  <Form.Text className="text-muted">
                    Delay before sending auto reply (0 = immediate)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {settings.businessHoursOnly && (
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={settings.startTime}
                      onChange={(e) => handleSettingChange('startTime', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={settings.endTime}
                      onChange={(e) => handleSettingChange('endTime', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    >
                      {getTimezoneOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </div>
        </Card>

        {/* Content Settings */}
        <Card className="mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <FaEnvelope className="me-2 text-primary" />
              Content Settings
            </h6>
          </div>
          <div className="card-body">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Include Signature</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.includeSignature}
                      onChange={(e) => handleSettingChange('includeSignature', e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Out of Office Message</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.includeOutOfOffice}
                      onChange={(e) => handleSettingChange('includeOutOfOffice', e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {settings.includeOutOfOffice && (
              <Form.Group className="mb-3">
                <Form.Label>Out of Office Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={settings.outOfOfficeMessage}
                  onChange={(e) => handleSettingChange('outOfOfficeMessage', e.target.value)}
                  placeholder="Enter your out of office message..."
                />
              </Form.Group>
            )}
          </div>
        </Card>

        {/* Exclusion Settings */}
        <Card className="mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <FaBell className="me-2 text-primary" />
              Exclusion Settings
            </h6>
          </div>
          <div className="card-body">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Exclude Specific Contacts</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="email"
                      value={newExcludeContact}
                      onChange={(e) => setNewExcludeContact(e.target.value)}
                      placeholder="email@example.com"
                    />
                    <Button variant="outline-primary" size="sm" onClick={addExcludeContact}>
                      Add
                    </Button>
                  </div>
                  <div className="excluded-contacts">
                    {settings.excludeContacts.map((email, index) => (
                      <Badge key={index} bg="secondary" className="me-2 mb-1">
                        {email}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-white p-0 ms-2"
                          onClick={() => removeExcludeContact(email)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Exclude Domains</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={newExcludeDomain}
                      onChange={(e) => setNewExcludeDomain(e.target.value)}
                      placeholder="domain.com"
                    />
                    <Button variant="outline-primary" size="sm" onClick={addExcludeDomain}>
                      Add
                    </Button>
                  </div>
                  <div className="excluded-domains">
                    {settings.excludeDomains.map((domain, index) => (
                      <Badge key={index} bg="warning" className="me-2 mb-1">
                        {domain}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-dark p-0 ms-2"
                          onClick={() => removeExcludeDomain(domain)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Advanced Settings */}
        <Card className="mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <FaCalendar className="me-2 text-primary" />
              Advanced Settings
            </h6>
          </div>
          <div className="card-body">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Replies Per Day</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.maxRepliesPerDay}
                    onChange={(e) => handleSettingChange('maxRepliesPerDay', parseInt(e.target.value) || 1)}
                  />
                  <Form.Text className="text-muted">
                    Limit to prevent spam (1-1000)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Learning Enabled</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.learningEnabled}
                      onChange={(e) => handleSettingChange('learningEnabled', e.target.checked)}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    AI learns from your responses to improve
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="mb-0">Smart Categorization</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={settings.smartCategorization}
                      onChange={(e) => handleSettingChange('smartCategorization', e.target.checked)}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Automatically categorize emails using AI
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              Test Auto Reply
            </Button>
            <Button 
              variant="primary" 
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <FaSpinner className="fa-spin me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-1" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AutoReplySettings;
