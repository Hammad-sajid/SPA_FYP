import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane, FaSave, FaTrash, FaMicrophone, FaStop, FaSpinner, FaPaperclip, FaTimes } from 'react-icons/fa';
import EmailService from '../../../../services/EmailService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Custom CSS for React Quill integration
const quillStyles = `
  .ql-editor {
    min-height: 250px;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.6;
  }
  
  .ql-toolbar {
    border-top: 1px solid #ced4da;
    border-left: 1px solid #ced4da;
    border-right: 1px solid #ced4da;
    border-bottom: none;
    border-radius: 0.375rem 0.375rem 0 0;
    background-color: #f8f9fa;
  }
  
  .ql-container {
    border: 1px solid #ced4da;
    border-top: none;
    border-radius: 0 0 0.375rem 0.375rem;
  }
  
  .ql-editor.ql-blank::before {
    color: #6c757d;
    font-style: italic;
  }
  
  .ql-editor:focus {
    outline: none;
  }
  
  .ql-container:focus-within {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
`;

const EmailCompose = ({ onBack, onSent, replyTo = null, forward = null, currentUserEmail }) => {
  // Inject custom Quill styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = quillStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
 
  const [form, setForm] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const recognitionRef = useRef(null);

  // Load reply/forward data if provided
  useEffect(() => {
    const loadRef = async () => {
      if (!replyTo && !forward) return;
      
      try {
        const ref = await EmailService.get(replyTo || forward);
        setForm(prev => ({
          ...prev,
          to: replyTo ? ref.sender : '',
          subject: replyTo ? `Re: ${ref.subject}` : `Fwd: ${ref.subject}`,
          body: replyTo 
            ? `\n\nOn ${new Date(ref.received_at).toLocaleString()} ${ref.sender} wrote:\n${ref.body}`
            : `\n\n---------- Forwarded message ---------\nFrom: ${ref.sender}\nDate: ${new Date(ref.received_at).toLocaleString()}\n\n${ref.body}`
        }));
        setAttachments([]);
      } catch (error) {
        console.error('Failed to load reference email:', error);
        setError('Failed to load reference email');
      }
    };
    
    loadRef();
  }, [replyTo, forward]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Attachment handling functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract base64 data from data URL (remove data:mime/type;base64, prefix)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // React Quill configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image', 'code-block'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.to || !form.subject || !form.body.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSending(true);
    setError(null);
    
    try {
      // Convert file attachments to base64 data for backend
      const processedAttachments = [];
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            const base64Data = await fileToBase64(attachment.file);
            processedAttachments.push({
              filename: attachment.name,
              mime_type: attachment.type,
              size: attachment.size,
              data: base64Data,
              is_inline: false
            });
          } catch (error) {
            console.error('Error processing attachment:', error);
            setError('Failed to process attachment. Please try again.');
            return;
          }
        }
      }
      
      // Debug: Log what we're sending
      console.log('🔍 Compose email data:', {
        sender: currentUserEmail,
        to_recipients: form.to,
        subject: form.subject,
        body: form.body,
        status: 'sent',
        labels: ['sent'],
        attachments: processedAttachments,
        attachmentsCount: processedAttachments.length,
        currentUserEmail: currentUserEmail
      });
      
      // Create email with correct sender and status
      await EmailService.create({
        sender: currentUserEmail,  // ✅ Use current user's email as sender
        to_recipients: form.to,    // ✅ Recipient goes in to_recipients field
        subject: form.subject,
        body: form.body,
        status: 'sent',            // ✅ Set status to 'sent' for actual sending
        labels: ['sent'],          // ✅ Add 'sent' label
        attachments: processedAttachments
      });
      
      setSuccess('Email sent successfully!');
      setTimeout(() => {
        onSent();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      setError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.subject && !form.body.trim()) {
      setError('Please add subject or body to save as draft');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // Convert file attachments to base64 data for backend
      const processedAttachments = [];
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            const base64Data = await fileToBase64(attachment.file);
            processedAttachments.push({
              filename: attachment.name,
              mime_type: attachment.type,
              size: attachment.size,
              data: base64Data,
              is_inline: false
            });
          } catch (error) {
            console.error('Error processing attachment:', error);
            setError('Failed to process attachment. Please try again.');
            return;
          }
        }
      }
      
      await EmailService.create({
        sender: currentUserEmail,  // ✅ Use current user's email as sender
        to_recipients: form.to,    // ✅ Recipient goes in to_recipients field
        subject: form.subject || '(No Subject)',
        body: form.body || '',
        status: 'draft',           // ✅ Set status to 'draft'
        labels: ['draft'],         // ✅ Add 'draft' label
        attachments: processedAttachments
      });
      
      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Failed to save draft:', error);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (form.subject || form.body.trim()) {
      if (window.confirm('Are you sure you want to discard this email? All changes will be lost.')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const startDictation = () => {
    if (listening) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice dictation is not supported in this browser.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    
    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      
      if (finalText) {
        setForm(prev => ({
          ...prev,
          body: prev.body ? prev.body + ' ' + finalText : finalText
        }));
      }
    };
    
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setListening(false);
  };

  const clearForm = () => {
    setForm({
      to: '',
      subject: '',
      body: ''
    });
    setAttachments([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="email-compose">
      <Card>
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={onBack}
              className="me-3"
            >
              <FaArrowLeft className="me-1" />
              Back
            </Button>
            <h5 className="mb-0">
              {replyTo ? 'Reply to Email' : forward ? 'Forward Email' : 'Compose Email'}
            </h5>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? (
                <FaSpinner className="fa-spin me-1" />
              ) : (
                <FaSave className="me-1" />
              )}
              Save Draft
            </Button>
            
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={handleDiscard}
            >
              <FaTrash className="me-1" />
              Discard
            </Button>
          </div>
        </div>

        <div className="card-body">
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

          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={2}>
                <Form.Label className="fw-bold">To:</Form.Label>
              </Col>
              <Col md={10}>
                <Form.Control
                  type="email"
                  value={form.to}
                  onChange={(e) => handleChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={2}>
                <Form.Label className="fw-bold">Subject:</Form.Label>
              </Col>
              <Col md={10}>
                <Form.Control
                  type="text"
                  value={form.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="Email subject"
                  required
                />
              </Col>
            </Row>

            

            <Row className="mb-3">
              <Col md={2}>
                <Form.Label className="fw-bold">Body:</Form.Label>
              </Col>
              <Col md={10}>
                <div className="d-flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={listening ? "danger" : "outline-secondary"}
                    size="sm"
                    onClick={listening ? stopDictation : startDictation}
                  >
                    {listening ? (
                      <FaStop className="me-1" />
                    ) : (
                      <FaMicrophone className="me-1" />
                    )}
                    {listening ? 'Stop Dictation' : 'Voice Dictation'}
                  </Button>
                </div>
                
                <ReactQuill
                  theme="snow"
                  value={form.body}
                  onChange={(content) => handleChange('body', content)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Type your message here..."
                />
              </Col>
            </Row>
            {/* Attachments Section */}
            <Row className="mb-3">
              <Col md={2}>
                <Form.Label className="fw-bold">Attachments:</Form.Label>
              </Col>
              <Col md={10}>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-input"
                    accept="*/*"
                  />
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <FaPaperclip className="me-1" />
                    Add Files
                  </Button>
                </div>
                
                {/* Display selected attachments */}
                {attachments.length > 0 && (
                  <div className="border rounded p-2">
                    <h6 className="mb-2">Selected Files:</h6>
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <FaPaperclip className="me-2 text-muted" />
                          <div>
                            <div className="fw-bold">{attachment.name}</div>
                            <small className="text-muted">{formatFileSize(attachment.size)} • {attachment.type}</small>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Col>
            </Row>

            <Row>
              <Col md={2}></Col>
              <Col md={10}>
                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={sending}
                  >
                    {sending ? (
                      <FaSpinner className="fa-spin me-1" />
                    ) : (
                      <FaPaperPlane className="me-1" />
                    )}
                    {sending ? 'Sending...' : 'Send Email'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline-secondary"
                    onClick={clearForm}
                  >
                    Clear
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default EmailCompose;
