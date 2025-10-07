import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge, ListGroup } from 'react-bootstrap';
import { FaBrain, FaMagic, FaCopy, FaThumbsUp, FaThumbsDown, FaHistory, FaSpinner } from 'react-icons/fa';
import AIService from '../../../../services/AIService';

const AIResponseGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [emailContext, setEmailContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [feedback, setFeedback] = useState({});

  // Load AI response history on component mount
  useEffect(() => {
    loadAIHistory();
  }, []);

  const loadAIHistory = async () => {
    try {
      const historyData = await AIService.getHistory(10, 0);
      console.log('Raw backend data:', historyData); // Debug: see what backend returns
      
      // Map backend data to frontend format
      const mappedHistory = historyData.map(item => ({
        id: item.id,
        prompt: item.prompt,
        response: item.generated_response, // Map from backend field
        tone: item.tone,
        length: item.length,
        timestamp: item.created_at // Map from backend field
      }));
      
      setHistory(mappedHistory);
      console.log('Mapped history data:', mappedHistory); // Debug: see mapped data
    } catch (error) {
      console.error('Failed to load AI history:', error);
      // Don't show error to user for history loading
    }
  };

  const templates = [
    {
      id: 1,
      name: 'Meeting Request',
      description: 'Professional meeting scheduling',
      prompt: 'I need to schedule a meeting with a client to discuss project requirements. The tone should be professional but friendly.',
      category: 'business'
    },
    {
      id: 2,
      name: 'Thank You Note',
      description: 'Gratitude expression',
      prompt: 'I want to send a thank you email to someone who helped me with a project. Make it warm and appreciative.',
      category: 'personal'
    },
    {
      id: 3,
      name: 'Follow-up',
      description: 'Post-meeting follow-up',
      prompt: 'I need to follow up after a meeting to summarize key points and next steps.',
      category: 'business'
    },
    {
      id: 4,
      name: 'Apology',
      description: 'Professional apology',
      prompt: 'I need to apologize for missing a deadline. Make it sincere and professional.',
      category: 'business'
    }
  ];

  const generateResponse = async () => {
    if (!prompt.trim() && !emailContext.trim()) {
      setError('Please provide either a prompt or email context');
      return;
    }

    setGenerating(true);
    setError(null);
    
    try {
      // Call real AI API
      const aiResponse = await AIService.generateResponse(
        prompt || emailContext,
        tone,
        length,
        emailContext
      );
      
      setResponse(aiResponse.generated_response);
      
      // Add to history
      const newEntry = {
        id: aiResponse.id,
        prompt: aiResponse.prompt,
        response: aiResponse.generated_response,
        tone: aiResponse.tone,
        length: aiResponse.length,
        timestamp: aiResponse.created_at
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10
      
    } catch (error) {
      console.error('AI API Error:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to generate response. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setPrompt(template.prompt);
    setSelectedTemplate(template.id);
  };

  const copyToClipboard = async (text, buttonElement = null) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Show temporary success message
      if (buttonElement) {
        const originalHTML = buttonElement.innerHTML;
        buttonElement.innerHTML = '<FaCopy className="me-1" />Copied!';
        buttonElement.classList.add('btn-success');
        buttonElement.classList.remove('btn-outline-primary');
        
        setTimeout(() => {
          buttonElement.innerHTML = originalHTML;
          buttonElement.classList.remove('btn-success');
          buttonElement.classList.add('btn-outline-primary');
        }, 2000);
      }
      
      // Also show a brief alert for better user feedback
      setError(null);
      const successMessage = 'Response copied to clipboard!';
      setError(successMessage);
      setTimeout(() => setError(null), 2000);
      
    } catch (error) {
      console.error('Copy failed:', error);
      setError('Failed to copy to clipboard');
    }
  };

  const handleFeedback = (entryId, isPositive) => {
    setFeedback(prev => ({
      ...prev,
      [entryId]: isPositive
    }));
    
    // TODO: Send feedback to backend for AI model improvement
    console.log(`Feedback for entry ${entryId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  const clearForm = () => {
    setPrompt('');
    setEmailContext('');
    setTone('professional');
    setLength('medium');
    setResponse('');
    setSelectedTemplate(null);
    setError(null);
  };

  const getToneOptions = () => [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'enthusiastic', label: 'Enthusiastic' }
  ];

  const getLengthOptions = () => [
    { value: 'short', label: 'Short (1-2 sentences)' },
    { value: 'medium', label: 'Medium (3-4 sentences)' },
    { value: 'long', label: 'Long (5+ sentences)' }
  ];

  return (
    <div className="ai-response-generator">
      <Row>
        <Col lg={8}>
          {/* Main Generator */}
          <Card className="mb-4">
            {/* <div className="card-header">
              <h6 className="mb-0">
                <FaBrain className="me-2 text-primary" />
                AI Response Generator
              </h6>
            </div> */}
            <div className="card-body">
              {error && (
                <Alert 
                  variant={error.startsWith('Response copied') ? "success" : "danger"} 
                  dismissible 
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Context (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={emailContext}
                        onChange={(e) => setEmailContext(e.target.value)}
                        placeholder="Paste the email you're responding to..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prompt</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what kind of response you need..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tone</Form.Label>
                      <Form.Select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      >
                        {getToneOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Length</Form.Label>
                      <Form.Select
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      >
                        {getLengthOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    className="w-50"
                    onClick={generateResponse}
                    disabled={generating || (!prompt.trim() && !emailContext.trim())}
                  >
                    {generating ? (
                      <FaSpinner className="fa-spin me-1" />
                    ) : (
                      <FaMagic className="me-1" />
                    )}
                    {generating ? 'Generating...' : 'Generate Response'}
                  </Button>
                  
                  <Button
                    variant="outline-secondary"
                    className="w-15"
                    onClick={clearForm}
                  >
                    Clear
                  </Button>

                  <Button
                    variant="outline-info"
                    className="w-50" 
                    onClick={async () => {
                      try {
                        const status = await AIService.testConnection();
                        if (status.status === 'success') {
                          alert('AI Service Connected Successfully!');
                        } else {
                          console.log(`AI Service Error: ${status.message}`);
                        }
                      } catch (error) {
                        alert('Failed to test AI service connection');
                      }
                    }}
                  >
                    Test Connection
                  </Button>
                </div>
              </Form>

              {/* Generated Response */}
              {response && (
                <div className="mt-4">
                  <h6>Generated Response:</h6>
                  <div className="border rounded p-3 bg-light">
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {response}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={(e) => copyToClipboard(response, e.currentTarget)}
                      className="copy-btn"
                    >
                      <FaCopy className="me-1" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

                    {/* Recent Generations - Moved under AI Response Generator */}
           
        </Col>
        
        <Col lg={4}>
          {/* Quick Templates - Moved to right sidebar */}
          <Card>
            <div className="card-header">
              <h6 className="mb-0">
                <FaMagic className="me-2 text-primary" />
                Quick Templates
              </h6>
            </div>
            <div className="card-body py-2">
              <div className="d-flex flex-column gap-2">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    className={`border rounded p-3 cursor-pointer ${selectedTemplate === template.id ? 'border-primary bg-light' : 'border-light'}`}
                    onClick={() => handleTemplateSelect(template)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <strong className="small">{template.name}</strong>
                      <Badge bg="secondary" className="small">{template.category}</Badge>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {template.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Generations - Full Width Below */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <div className="card-header">
              <h6 className="mb-0">
                <FaHistory className="me-2 text-primary" />
                Recent Generations
              </h6>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <p className="text-muted small">No recent generations</p>
              ) : (
                <div className="history-list">
                  <Row>
                    {history.map((entry) => (
                      <Col lg={4} md={6} key={entry.id} className="mb-3">
                        <div className="border rounded p-3 h-100">
                          <div className="small text-muted mb-2">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'Unknown time'}
                          </div>
                          <div className="small mb-2">
                            <strong>Prompt:</strong> 
                            <div className="text-muted mt-1" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                              {entry.prompt && entry.prompt.length > 80 ? `${entry.prompt.substring(0, 80)}...` : (entry.prompt || 'No prompt')}
                            </div>
                          </div>
                          <div className="small mb-3" style={{ maxHeight: '120px', overflow: 'hidden' }}>
                            <strong>Response:</strong> 
                            <div className="text-muted mt-1" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                              {entry.response && entry.response.length > 150 ? `${entry.response.substring(0, 150)}...` : (entry.response || 'No response')}
                            </div>
                          </div>
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleFeedback(entry.id, true)}
                              className={feedback[entry.id] === true ? 'active' : ''}
                            >
                              <FaThumbsUp />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleFeedback(entry.id, false)}
                              className={feedback[entry.id] === false ? 'active' : ''}
                            >
                              <FaThumbsDown />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => copyToClipboard(entry.response, e.currentTarget)}
                              title="Copy Response"
                            >
                              <FaCopy />
                            </Button>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AIResponseGenerator;

