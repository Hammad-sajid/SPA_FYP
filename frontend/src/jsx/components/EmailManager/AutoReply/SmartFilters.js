import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge, Table } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaCog, FaCheck, FaTimes } from 'react-icons/fa';

const SmartFilters = () => {
  const [filters, setFilters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [form, setForm] = useState({
    name: '',
    conditions: [{ field: 'sender', operator: 'contains', value: '' }],
    actions: ['categorize'],
    category: 'work',
    priority: 'medium',
    enabled: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load existing filters
  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    // TODO: Replace with actual API call
    const mockFilters = [
      {
        id: 1,
        name: 'Work Emails',
        conditions: [{ field: 'sender', operator: 'contains', value: '@company.com' }],
        actions: ['categorize'],
        category: 'work',
        priority: 'high',
        enabled: true,
        matches: 45
      },
      {
        id: 2,
        name: 'Newsletters',
        conditions: [{ field: 'subject', operator: 'contains', value: 'newsletter' }],
        actions: ['categorize', 'mark_read'],
        category: 'newsletter',
        priority: 'low',
        enabled: true,
        matches: 23
      }
    ];
    setFilters(mockFilters);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addCondition = () => {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'sender', operator: 'contains', value: '' }]
    }));
  };

  const removeCondition = (index) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => 
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || form.conditions.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingFilter) {
        // Update existing filter
        const updatedFilters = filters.map(f => 
          f.id === editingFilter.id ? { ...form, id: f.id } : f
        );
        setFilters(updatedFilters);
        setSuccess('Filter updated successfully!');
      } else {
        // Add new filter
        const newFilter = { ...form, id: Date.now(), matches: 0 };
        setFilters(prev => [...prev, newFilter]);
        setSuccess('Filter created successfully!');
      }
      
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      setError('Failed to save filter');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      conditions: [{ field: 'sender', operator: 'contains', value: '' }],
      actions: ['categorize'],
      category: 'work',
      priority: 'medium',
      enabled: true
    });
    setEditingFilter(null);
    setShowForm(false);
  };

  const editFilter = (filter) => {
    setForm({
      name: filter.name,
      conditions: filter.conditions,
      actions: filter.actions,
      category: filter.category,
      priority: filter.priority,
      enabled: filter.enabled
    });
    setEditingFilter(filter);
    setShowForm(true);
  };

  const deleteFilter = (filterId) => {
    if (window.confirm('Are you sure you want to delete this filter?')) {
      setFilters(prev => prev.filter(f => f.id !== filterId));
      setSuccess('Filter deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const toggleFilter = (filterId) => {
    setFilters(prev => prev.map(f => 
      f.id === filterId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getFieldOptions = () => [
    { value: 'sender', label: 'Sender Email' },
    { value: 'subject', label: 'Subject' },
    { value: 'body', label: 'Email Body' },
    { value: 'received_at', label: 'Date Received' }
  ];

  const getOperatorOptions = () => [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' }
  ];

  return (
    <div className="smart-filters">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6>Email Filtering Rules</h6>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <FaPlus className="me-1" />
          New Filter
        </Button>
      </div>

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

      {/* Filter Form */}
      {showForm && (
        <Card className="mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              {editingFilter ? 'Edit Filter' : 'Create New Filter'}
            </h6>
          </div>
          <div className="card-body">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Filter Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="e.g., Work Emails, Newsletters"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Priority</Form.Label>
                    <Form.Select
                      value={form.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={form.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="social">Social</option>
                      <option value="important">Important</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Conditions */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0">Conditions</Form.Label>
                  <Button 
                    type="button" 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={addCondition}
                  >
                    <FaPlus className="me-1" />
                    Add Condition
                  </Button>
                </div>
                
                {form.conditions.map((condition, index) => (
                  <Row key={index} className="mb-2 align-items-end">
                    <Col md={3}>
                      <Form.Select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      >
                        {getFieldOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      >
                        {getOperatorOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Enter value..."
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        disabled={form.conditions.length === 1}
                      >
                        <FaTrash />
                      </Button>
                    </Col>
                  </Row>
                ))}
              </div>

              {/* Actions */}
              <div className="mb-3">
                <Form.Label>Actions</Form.Label>
                <div>
                  <Form.Check
                    type="checkbox"
                    id="action-categorize"
                    checked={form.actions.includes('categorize')}
                    onChange={(e) => {
                      const newActions = e.target.checked 
                        ? [...form.actions, 'categorize']
                        : form.actions.filter(a => a !== 'categorize');
                      handleFormChange('actions', newActions);
                    }}
                    label="Categorize email"
                  />
                  <Form.Check
                    type="checkbox"
                    id="action-mark-read"
                    checked={form.actions.includes('mark_read')}
                    onChange={(e) => {
                      const newActions = e.target.checked 
                        ? [...form.actions, 'mark_read']
                        : form.actions.filter(a => a !== 'mark_read');
                      handleFormChange('actions', newActions);
                    }}
                    label="Mark as read"
                  />
                  <Form.Check
                    type="checkbox"
                    id="action-star"
                    checked={form.actions.includes('star')}
                    onChange={(e) => {
                      const newActions = e.target.checked 
                        ? [...form.actions, 'star']
                        : form.actions.filter(a => a !== 'star');
                      handleFormChange('actions', newActions);
                    }}
                    label="Star email"
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary">
                  {editingFilter ? 'Update Filter' : 'Create Filter'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Card>
      )}

      {/* Filters List */}
      <Card>
        <div className="card-header">
          <h6 className="mb-0">Active Filters</h6>
        </div>
        <div className="card-body p-0">
          {filters.length === 0 ? (
            <div className="text-center py-4">
              <FaFilter className="fa-3x text-muted mb-3" />
              <p className="text-muted">No filters created yet</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Create Your First Filter
              </Button>
            </div>
          ) : (
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Conditions</th>
                  <th>Actions</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Matches</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filters.map((filter) => (
                  <tr key={filter.id}>
                    <td>
                      <strong>{filter.name}</strong>
                    </td>
                    <td>
                      <small>
                        {filter.conditions.map((cond, i) => (
                          <div key={i}>
                            {cond.field} {cond.operator} "{cond.value}"
                          </div>
                        ))}
                      </small>
                    </td>
                    <td>
                      {filter.actions.map((action, i) => (
                        <Badge key={i} bg="info" className="me-1">
                          {action}
                        </Badge>
                      ))}
                    </td>
                    <td>
                      <Badge bg="secondary">{filter.category}</Badge>
                    </td>
                    <td>
                      <Badge bg={getPriorityColor(filter.priority)}>
                        {filter.priority}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant={filter.enabled ? "success" : "secondary"}
                        size="sm"
                        onClick={() => toggleFilter(filter.id)}
                      >
                        {filter.enabled ? <FaCheck /> : <FaTimes />}
                      </Button>
                    </td>
                    <td>
                      <Badge bg="primary">{filter.matches}</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => editFilter(filter)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteFilter(filter.id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SmartFilters;
