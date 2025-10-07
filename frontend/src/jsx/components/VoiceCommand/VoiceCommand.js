import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaMicrophone, FaMicrophoneSlash, FaTimes, FaTrash } from 'react-icons/fa';
import axios from 'axios';

const VoiceCommand = ({ 
  module, 
  onSuccess, 
  onError, 
  buttonVariant = "outline-primary",
  buttonSize = "sm",
  buttonText = "🗣️ Voice Command"
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extractedFields, setExtractedFields] = useState({});
  const [showEditFields, setShowEditFields] = useState(false);
  
  const recognitionRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep listening continuously
      recognitionRef.current.interimResults = true; // Get interim results
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Combine all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcript with both final and interim results
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Don't stop listening on errors, just log them
        if (event.error === 'no-speech') {
          // This is normal, just continue listening
          return;
        }
        setError(`Speech recognition error: ${event.error}`);
      };
      
      recognitionRef.current.onend = () => {
        // Only stop if user explicitly stopped it
        if (isListening) {
          // Restart listening automatically if it was supposed to be listening
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error restarting speech recognition:', error);
            setIsListening(false);
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    try {
      setError("");
      setSuccess("");
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const clearTranscript = () => {
    setTranscript("");
    setError("");
    setSuccess("");
    setExtractedFields({});
    setShowEditFields(false);
  };

  const analyzeCommand = async () => {
    if (!transcript.trim()) {
      setError('Please speak a command first.');
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // First, analyze the command to extract fields
      const response = await axios.post(
        `${API_BASE_URL}/api/voice-commands/analyze`,
        {
          voice_text: transcript,
          module: module
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setExtractedFields(response.data.fields);
        setShowEditFields(true);
      } else {
        setError(response.data.error || 'Failed to analyze command.');
      }
    } catch (error) {
      console.error('Error analyzing voice command:', error);
      setError(error.response?.data?.detail || 'Failed to analyze command.');
    } finally {
      setProcessing(false);
    }
  };

  const processVoiceCommand = async () => {
    if (!transcript.trim()) {
      setError('Please speak a command first.');
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/voice-commands/process`,
        {
          voice_text: transcript,
          module: module,
          edited_fields: extractedFields // Send edited fields
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setTranscript(""); // Clear transcript after successful execution
        setExtractedFields({});
        setShowEditFields(false);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          setShowModal(false);
          setSuccess("");
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to process voice command.');
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setError(error.response?.data?.detail || 'Failed to process voice command.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setExtractedFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    setShowModal(false);
    setTranscript("");
    setError("");
    setSuccess("");
    setProcessing(false);
    setExtractedFields({});
    setShowEditFields(false);
    if (isListening) {
      stopListening();
    }
  };

  const getModuleExamples = () => {
    switch (module) {
      case 'tasks':
        return [
          "Create task title review report description final project review importance high priority due date tomorrow",
          "Add task title call client description follow up meeting importance urgent due date 27th august 2025 2pm",
          "New task title prepare presentation description quarterly update importance medium priority category work"
        ];
      case 'events':
        return [
          "Create event title team meeting description weekly sync importance high priority date tomorrow time 2pm",
          "Schedule title doctor appointment description annual checkup importance medium priority date next monday time 10am"
        ];
      case 'emails':
        return [
          "Send email to john about project update description urgent deadline approaching importance high priority",
          "Create email to sarah about meeting notes description follow up from yesterday importance medium priority"
        ];
      default:
        return [];
    }
  };

  const renderEditFields = () => {
    if (!showEditFields) return null;

    const fields = [];
    
    // Add fields based on module
    if (module === 'tasks') {
      fields.push(
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'importance', label: 'Priority', type: 'select', options: [
          { value: 1, label: 'Low (1)' },
          { value: 2, label: 'Medium (2)' },
          { value: 3, label: 'High (3)' }
        ]},
        { key: 'due_date', label: 'Due Date', type: 'date' },
        { key: 'category', label: 'Category', type: 'text' }
      );
    } else if (module === 'events') {
      fields.push(
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'event_date', label: 'Date', type: 'date' },
        { key: 'event_time', label: 'Time', type: 'time' },
        { key: 'category', label: 'Category', type: 'text' }
      );
    } else if (module === 'emails') {
      fields.push(
        { key: 'recipient', label: 'To', type: 'text' },
        { key: 'subject', label: 'Subject', type: 'text' },
        { key: 'body', label: 'Message', type: 'textarea' }
      );
    }

    return (
      <div className="mb-3">
        <h6>📝 Edit Extracted Fields:</h6>
        <div className="row">
          {fields.map(field => (
            <div key={field.key} className="col-md-6 mb-2">
              <label className="form-label small text-muted">{field.label}:</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-control form-control-sm"
                  value={extractedFields[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  rows="2"
                />
              ) : field.type === 'select' ? (
                <select
                  className="form-control form-control-sm"
                  value={extractedFields[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value))}
                >
                  {field.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={extractedFields[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                />
              ) : field.type === 'time' ? (
                <input
                  type="time"
                  className="form-control form-control-sm"
                  value={extractedFields[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={extractedFields[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <small className="text-muted">
          💡 Edit the extracted fields above before executing the command
        </small>
      </div>
    );
  };

  return (
    <>
      {/* Voice Command Button */}
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setShowModal(true)}
        className="voice-command-btn"
      >
        {buttonText}
      </Button>

      {/* Voice Command Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            🗣️ Voice Command - {module.charAt(0).toUpperCase() + module.slice(1)}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {/* Example Commands */}
          <div className="mb-3">
            <h6>Example Commands:</h6>
            <ul className="list-unstyled">
              {getModuleExamples().map((example, index) => (
                <li key={index} className="text-muted small">
                  • {example}
                </li>
              ))}
            </ul>
          </div>

          {/* Voice Input Section */}
          <div className="text-center mb-3">
            <div className="d-flex gap-2 justify-content-center mb-2">
              <Button
                variant={isListening ? "danger" : "primary"}
                size="lg"
                onClick={isListening ? stopListening : startListening}
                disabled={processing}
              >
                {isListening ? (
                  <>
                    <FaMicrophoneSlash className="me-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <FaMicrophone className="me-2" />
                    Start Listening
                  </>
                )}
              </Button>
              
              {transcript && (
                <Button
                  variant="outline-secondary"
                  size="lg"
                  onClick={clearTranscript}
                  disabled={processing}
                  title="Clear transcript"
                >
                  <FaTrash className="me-2" />
                  Clear
                </Button>
              )}
            </div>
            
            {isListening && (
              <div className="text-info">
                <Spinner animation="border" size="sm" className="me-2" />
                Listening continuously... Speak your command!
              </div>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="mb-3">
              <h6>Your Command:</h6>
              <div className="p-3 bg-light rounded border">
                "{transcript}"
              </div>
              <small className="text-muted">
                💡 Tip: Keep speaking until you're done. The system will continue listening.
              </small>
            </div>
          )}

          {/* Edit Fields Section */}
          {renderEditFields()}

          {/* Error Display */}
          {error && (
            <Alert variant="danger" onClose={() => setError("")} dismissible>
              {error}
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert variant="success" onClose={() => setSuccess("")} dismissible>
              {success}
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          
          {transcript && !showEditFields && (
            <Button
              variant="info"
              onClick={analyzeCommand}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Analyzing...
                </>
              ) : (
                '🔍 Analyze Command'
              )}
            </Button>
          )}
          
          {showEditFields && (
            <Button
              variant="primary"
              onClick={processVoiceCommand}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                '✅ Execute Command'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VoiceCommand;
