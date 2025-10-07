import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Row, Col, Button, Badge, Dropdown, Alert, Form } from 'react-bootstrap';
import { FaArrowLeft, FaReply, FaForward, FaStar, FaTrash, FaArchive, FaEnvelope, FaEnvelopeOpen, FaSpinner, FaEdit, FaInfoCircle, FaCalendarPlus, FaMicrophone, FaStop, FaPaperclip, FaTimes } from 'react-icons/fa';
import DOMPurify from 'dompurify';
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

const EmailRead = ({ email, onBack, onUpdate, currentUserEmail, currentCategory }) => {
  const [updating, setUpdating] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showForwardForm, setShowForwardForm] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [emailBody, setEmailBody] = useState(email.body || '');
  const [loadingBody, setLoadingBody] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Reply form states
  const [replyForm, setReplyForm] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Forward form states
  const [forwardForm, setForwardForm] = useState({
    to: '',
    subject: '',
    body: ''
  });

  
  // Only external attachments are available as separate downloadable items
  const regularAttachments = useMemo(() => {
    if (!attachments || attachments.length === 0) return [];
    return attachments;
  }, [attachments]);

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

  // Helper functions for attachments
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setReplyAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (attachmentId) => {
    setReplyAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };



  // Voice dictation functions
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
        setReplyForm(prev => ({
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

  // Form submission handler for reply
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyForm.body.trim()) {
      setError('Please enter a reply message');
      return;
    }

    try {
      // Convert file attachments to base64 data for backend
      const processedAttachments = [];
      if (replyAttachments.length > 0) {
        for (const attachment of replyAttachments) {
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
      console.log('🔍 Reply email data:', {
        sender: currentUserEmail,
        to_recipients: replyForm.to,
        subject: replyForm.subject,
        body: replyForm.body,
        attachments: processedAttachments.length,
        currentUserEmail: currentUserEmail
      });
      
      // Create reply email
      await EmailService.create({
        sender: currentUserEmail,
        to_recipients: replyForm.to,
        subject: replyForm.subject,
        body: replyForm.body,
        in_reply_to: email.id,
        thread_id: email.thread_id || email.id.toString(),
        labels: ['sent'],
        status: 'sent',
        attachments: processedAttachments
      });
      
      setShowReplyForm(false);
      setReplyForm({ to: '', subject: '', body: '' });
      setReplyAttachments([]);
      
      // Show success message for 2 seconds
      setSuccess('Reply sent successfully!');
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to send reply:', error);
      setError('Failed to send reply. Please try again.');
    }
  };

  // Form submission handler for forward
  const handleForwardSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create forward email with original content only
      const forwardBody = `From: ${email.sender}\nDate: ${formatDate(email.received_at)}\n\n${email.body}`;

      // Debug: Log what we're sending
      console.log('🔍 Forward email data:', {
        sender: currentUserEmail,
        to_recipients: forwardForm.to,
        subject: forwardForm.subject,
        body: forwardBody,
        currentUserEmail: currentUserEmail
      });

      await EmailService.create({
        sender: currentUserEmail,
        to_recipients: forwardForm.to,
        subject: forwardForm.subject,
        body: forwardBody,
        forwarded_from: email.id,
        labels: ['sent'],
        status: 'sent'
      });
      
      setShowForwardForm(false);
      setForwardForm({ to: '', subject: '', body: '' });
      
      // Show success message for 2 seconds
      setSuccess('Email forwarded successfully!');
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to send forward:', error);
      setError('Failed to send forward. Please try again.');
    }
  };



  // Function to determine recipient display text
  const getRecipientDisplay = () => {
    if (!email.to_recipients) {
      return 'to: unknown';
    }
    else if(email.to_recipients.includes(currentUserEmail)){
    return `to: me`;
    }
    else{
      return `to: ${email.to_recipients}`;
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
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

  // Helper function to safely decode base64 text data
  const safelyDecodeBase64Text = (base64Data, mimeType) => {
    try {
      if (!mimeType.startsWith("text/")) return null;
      if (!base64Data || typeof base64Data !== "string") return null;
      if (base64Data.length > 1000000) {
        console.warn("Text file too large for preview:", base64Data.length);
        return null;
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new TextDecoder("utf-8").decode(bytes);
    } catch (error) {
      console.error("Failed to decode base64 text data:", error);
      return null;
    }
  };

  // AttachmentViewer component for handling different file types
  const AttachmentViewer = ({ base64Data, mimeType, filename }) => {
    // Handle text files
    if (mimeType.startsWith("text/")) {
      const text = safelyDecodeBase64Text(base64Data, mimeType);
      return text ? (
        <pre className="p-2 bg-gray-100 rounded" style={{ whiteSpace: 'pre-wrap', padding: '20px', textAlign: 'left' }}>{text}</pre>
      ) : (
        <div className="text-center py-3">
          <div className="mb-3">
            <i className="fas fa-exclamation-triangle fa-2x text-warning"></i>
          </div>
          <p className="text-warning mb-2">Text Preview Failed</p>
          <p className="text-muted small">
            Unable to decode the text content. The file may be corrupted or encoded in an unsupported format.
          </p>
        </div>
      );
    }

    // Handle PDF files
    if (mimeType === "application/pdf") {
      return (
        <iframe
          src={`data:application/pdf;base64,${base64Data}`}
          className="w-100 h-100 pdf-viewer"
          title={filename}
        />
      );
    }

    // Handle images
    if (mimeType.startsWith("image/")) {
      return (
        <img
          src={`data:${mimeType};base64,${base64Data}`}
          alt={filename}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );
    }

    // Handle other files (Word, Excel, etc.)
    const download = () => {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "download";
      link.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="text-center py-3">
        <div className="mb-3">
          <i className="fas fa-file-alt fa-2x text-info"></i>
        </div>
        <p className="text-info mb-2">File Preview</p>
        <p className="text-muted small mb-3">
          This file type cannot be previewed in the browser.
        </p>
        <div className="mt-3 p-3 bg-light rounded">
          <small className="text-muted">
            <strong>File Details:</strong><br />
            Name: {filename}<br />
            Type: {mimeType}<br />
            Data: Available (base64 encoded)
          </small>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="mt-3"
          onClick={download}
        >
          <i className="fas fa-download me-1"></i>
          Download {filename || "file"}
        </Button>
      </div>
    );
  };

  // Initialize event form with email data
  const initializeEventForm = () => {
    // This function is no longer needed as we redirect to event page
    // The logic will be handled in the EventManagement component
  };

  // Handle event creation
  const handleCreateEvent = async () => {
    // This function is no longer needed as we redirect to event page
    // The logic will be handled in the EventManagement component
  };

  // Extract email data for event creation
  const getEmailEventData = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 2 hours from now
    
    // Try to extract date/time information from email content
    const extractedDateTime = extractDateTimeFromEmail(email.body || email.snippet || '');
    
    return {
      title: email.subject || '',
      description: email.snippet || email.body?.substring(0, 200) || '',
      start_time: extractedDateTime.start || startTime.toISOString().slice(0, 16),
      end_time: extractedDateTime.end || endTime.toISOString().slice(0, 16),
      location: extractedDateTime.location || '',
      category: 'personal',
      email_id: email.id,
      email_sender: email.sender
    };
  };

  // Extract potential date/time information from email content
  const extractDateTimeFromEmail = (content) => {
    if (!content) return { start: '', end: '', location: '' };
    
    const result = { start: '', end: '', location: '' };
    
    // Common date/time patterns
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,           // MM/DD/YYYY
      /(\d{1,2}-\d{1,2}-\d{4})/g,              // MM-DD-YYYY
      /(\d{4}-\d{1,2}-\d{1,2})/g,              // YYYY-MM-DD
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/gi, // DD Month YYYY
      /(?:today|tomorrow|next week|next month)/gi, // Relative dates
    ];
    
    // Time patterns
    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/g,   // HH:MM AM/PM
      /(\d{1,2}\s*(?:AM|PM|am|pm))/g,          // HH AM/PM
    ];
    
    // Location patterns
    const locationPatterns = [
      /(?:at|in|location|venue|address|place):\s*([^,\n\r]+)/gi,
      /(?:meeting|event|appointment)\s+(?:at|in)\s+([^,\n\r]+)/gi,
    ];
    
    // Extract dates and times
    const foundDates = [];
    const foundTimes = [];
    
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) foundDates.push(...matches);
    });
    
    timePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) foundTimes.push(...matches);
    });
    
    // Extract location
    locationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches[1]) {
        result.location = matches[1].trim();
      }
    });
    
    // If we found dates/times, try to create a reasonable start time
    if (foundDates.length > 0 || foundTimes.length > 0) {
      try {
        // This is a simplified approach - in a real app you'd use a more sophisticated date parser
        const now = new Date();
        let startDate = new Date(now);
        
        // If we found a date, try to parse it
        if (foundDates.length > 0) {
          const dateStr = foundDates[0];
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            startDate = parsedDate;
          }
        }
        
        // If we found a time, try to apply it
        if (foundTimes.length > 0) {
          const timeStr = foundTimes[0];
          // Simple time parsing - you might want to use a library like date-fns for this
          const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const period = timeMatch[3]?.toLowerCase();
            
            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            
            startDate.setHours(hours, minutes, 0, 0);
          }
        }
        
        // Ensure the date is in the future
        if (startDate <= now) {
          startDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        }
        
        result.start = startDate.toISOString().slice(0, 16);
        result.end = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
        
      } catch (error) {
        console.log('Could not parse extracted date/time:', error);
      }
    }
    
    return result;
  };

  // Function to download attachment
  const downloadAttachment = async (emailId, attachmentId, filename) => {
    try {
      const response = await EmailService.downloadAttachment(emailId, attachmentId);
      
      // Create a blob from the response and download it
      const blob = new Blob([response], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      setError('Failed to download attachment. Please try again.');
    }
  };

  // Function to preview attachment
  const handlePreviewAttachment = async (attachment) => {
    try {
      console.log('🔍 handlePreviewAttachment called with:', attachment);
      console.log('🔍 Attachment data exists:', !!attachment.data);
      console.log('🔍 Attachment data length:', attachment.data ? attachment.data.length : 'N/A');
      
      setPreviewLoading(true);
      setPreviewAttachment(attachment);
      
      // Show preview modal
      console.log('🔍 Showing preview modal');
      setShowPreviewModal(true);
      setPreviewLoading(false);
      
    } catch (error) {
      console.error('Error in preview attachment:', error);
      setShowPreviewModal(true);
      setPreviewLoading(false);
    }
  };

  // Fetch full email body if it's empty (Hybrid Approach)
  useEffect(() => {
    const fetchEmailBody = async () => {
      // Only fetch if body is empty and we have a gmail_id (Gmail email)
      if (!email.body && email.gmail_id && !loadingBody) {
        setLoadingBody(true);
        try {
          const bodyData = await EmailService.fetchEmailBody(email.id);
          setEmailBody(bodyData.body);
          
          // Update the email object with the fetched body
          if (onUpdate) {
            onUpdate(email.id, 'update', { body: bodyData.body });
          }
        } catch (error) {
          console.error('Failed to fetch email body:', error);
          setError('Failed to load email content. Please try again.');
          // Fallback to snippet if body fetch fails
          setEmailBody(email.snippet || 'No content available');
        } finally {
          setLoadingBody(false);
        }
      } else if (email.body) {
        // Body already exists, use it
        setEmailBody(email.body);
      } else if (email.snippet) {
        // No body, use snippet as fallback
        setEmailBody(email.snippet);
      }
    };

    fetchEmailBody();
  }, [email.id, email.body, email.gmail_id, email.snippet, onUpdate]);

  // Fetch attachments for the email
  useEffect(() => {
    const fetchAttachments = async () => {
      if (email.has_attachment && !loadingAttachments) {
        setLoadingAttachments(true);
        try {
          console.log('🔍 Fetching attachments for email:', email.id);
          const response = await EmailService.getEmailAttachments(email.id);
          console.log('🔍 Attachments response:', response);
          console.log('🔍 Attachments array:', response.attachments);
          console.log('🔍 Individual attachment details:');
          if (response.attachments) {
            response.attachments.forEach((att, index) => {
              console.log(`🔍 Attachment ${index}:`, {
                id: att.id,
                filename: att.filename,
                mime_type: att.mime_type,
                size: att.size,
                hasData: !!att.data,
                dataType: typeof att.data,
                dataLength: att.data ? att.data.length : 'N/A',
                dataPreview: att.data ? att.data.substring(0, 50) + '...' : 'N/A'
              });
            });
          }
          setAttachments(response.attachments || []);
        } catch (error) {
          console.error('Failed to fetch attachments:', error);
          // Don't show error for attachments, just log it
        } finally {
          setLoadingAttachments(false);
        }
      }
    };

    fetchAttachments();
  }, [email.id, email.has_attachment]);

  // Cleanup URLs when component unmounts or previewAttachment changes
  useEffect(() => {
    return () => {
      // No cleanup needed since we're using data URLs directly for previews
      // and object URLs are cleaned up immediately after use for downloads
    };
  }, [previewAttachment]);

  // Debug useEffect to monitor modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed - showPreviewModal:', showPreviewModal, 'previewAttachment:', !!previewAttachment, 'previewLoading:', previewLoading);
  }, [showPreviewModal, previewAttachment, previewLoading]);

  // Inject custom Quill styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = quillStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Initialize reply form when it is shown
  useEffect(() => {
    if (showReplyForm) {
      setReplyForm({
        to: email.sender || '',
        subject: `Re: ${email.subject}`,
        body: ''
      });
      setReplyAttachments([]);
    }
  }, [showReplyForm, email.sender, email.subject]);

  // Initialize forward form when it is shown
  useEffect(() => {
    if (showForwardForm) {
      setForwardForm({
        to: '',
        subject: `Fwd: ${email.subject}`,
        body: '' // Empty body since we display original email content separately
      });
    }
  }, [showForwardForm, email.sender, email.subject]);

  // Wrapper CSS for consistent app feel while preserving Gmail styles
  const emailStyles = `
    <style>
      /* App wrapper styling - consistent spacing and borders */
      .email-html-content {
        max-width: 100%;
        overflow-wrap: break-word;
        word-wrap: break-word;
        /* App-specific styling */
        padding: 20px;
        margin: 0;
      }
      
      /* Responsive layout fixes */
      .email-html-content * {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      /* Responsive images */
      .email-html-content img { 
        max-width: 100%; 
        height: auto; 
      }
      
      /* Responsive tables */
      .email-html-content table { 
        max-width: 100%; 
      }
      
      /* Mobile optimization */
      @media (max-width: 768px) {
        .email-html-content {
          padding: 15px;
          border-radius: 6px;
        }
      }
    </style>
  `;

  const handleAction = async (action, data = {}) => {
    setUpdating(true);
    setError(null);
    
    console.log(`🔍 EmailRead: handleAction called with action: ${action}, data:`, data);
    console.log(`🔍 EmailRead: current email:`, email);
    
    try {
      let actionName = '';
      let actionData = {};
      
      switch (action) {
        case 'star':
          actionName = 'star';
          actionData = { starred: data.starred };
          break;
        case 'unread':
          actionName = 'mark_read';
          actionData = { read: false };
          break;
        case 'archive':
          actionName = 'archive';
          break;
        case 'move_to_trash':
            actionName = 'move_to_trash';
          break;
        case 'move_to_inbox':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'inbox' };
          break;
        case 'move_to_spam':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'spam' };
          break;
        case 'move_to_social':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_social' };
          break;
        case 'move_to_promotions':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_promotions' };
          break;
        case 'move_to_updates':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_updates' };
          break;
        case 'move_to_forums':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_forums' };
          break;
        case 'delete_forever':
          actionName = 'delete';
          break;
        default:
          console.warn(`Unknown action: ${action}`);
          return;
      }
      
      console.log(`🔍 EmailRead: calling EmailService.performAction with:`, { id: email.id, action: actionName, data: actionData });
      
      const result = await EmailService.performAction(email.id, actionName, actionData);
      console.log(`🔍 EmailRead: action result:`, result);
      
      // After successful action, call onUpdate to refresh parent state, then go back
      await onUpdate(email.id, action, { ...data, currentCategory });
      onBack();
      
    } catch (error) {
      setError(`Failed to ${action} email`);
      console.error(`Action ${action} failed:`, error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = () => {
    setShowReplyForm(true);
  };

  const handleForward = () => {
    setShowForwardForm(true);
  };



  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isHtmlContent = (content) => {
    if (!content) return false;
    
    // More robust HTML detection
    const htmlPatterns = [
      /<[^>]+>/,                    // Any HTML tag
      /&[a-zA-Z0-9#]+;/,           // HTML entities
      /<!DOCTYPE/i,                  // DOCTYPE declaration
      /<html/i,                     // HTML root element
      /<body/i,                     // Body element
      /<div/i,                      // Common div elements
      /<p>/i,                       // Paragraph tags
      /<br/i,                       // Line break tags
      /<img/i,                      // Image tags
      /<a\s+href/i,                // Link tags
      /<table/i,                    // Table tags
      /<tr/i,                       // Table row tags
      /<td/i,                       // Table cell tags
      /<th/i,                       // Table header tags
      /<ul/i,                       // Unordered list tags
      /<ol/i,                       // Ordered list tags
      /<li/i,                       // List item tags
      /<h[1-6]/i,                  // Heading tags
      /<span/i,                     // Span tags
      /<strong/i,                   // Strong tags
      /<b>/i,                       // Bold tags
      /<em/i,                       // Emphasis tags
      /<i>/i                        // Italic tags
    ];
    
    // Check if content contains any HTML patterns
    return htmlPatterns.some(pattern => pattern.test(content));
  };

  const renderEmailBody = (body) => {
    // Force HTML rendering if content contains HTML tags (fallback for malformed HTML)
    const forceHtml = body && (body.includes('<') || body.includes('&'));
    
    if (isHtmlContent(body) || forceHtml) {
      // Inject inline images directly into the email body content
      let enhancedBody = body;
  
      
      // Inject our app wrapper styles + enhanced email body with inline images
      const styledBody = emailStyles + enhancedBody;
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: styledBody }}
          className="email-html-content"
        />
      );
    } else {
      return (
        <div 
          style={{ 
            whiteSpace: 'initial',
            padding: '10px',
            width: '100%',
            maxWidth: '100%',
            wordWrap: 'break-word',
            overflowWrap: 'anywhere'
          }}
          className="email-plaintext-content"
        >
          {body}
        </div>
      );
    }
  };

 


  if (showReplyForm) {
    return (
      <div className="email-reply">
        <Card>
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowReplyForm(false)}
                className="me-3"
              >
                <FaArrowLeft className="me-1"  />
                Back to Email
              </Button>
              <h5 className="mb-0">Reply to Email</h5>
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
            
            <Form onSubmit={handleReplySubmit}>
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Label className="fw-bold">To:</Form.Label>
                </Col>
                <Col md={10}>
                  <Form.Control
                    type="email"
                    value={replyForm.to}
                    onChange={(e) => setReplyForm(prev => ({ ...prev, to: e.target.value }))}
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
                    value={replyForm.subject}
                    onChange={(e) => setReplyForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Label className="fw-bold">Message:</Form.Label>
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
                    value={replyForm.body}
                    onChange={(content) => setReplyForm(prev => ({ ...prev, body: content }))}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Type your reply message here..."
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
                      id="reply-file-input"
                      accept="*/*"
                    />
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => document.getElementById('reply-file-input').click()}
                    >
                      <FaPaperclip className="me-1" />
                      Add Files
                    </Button>
                  </div>
                  
                  {/* Display selected attachments */}
                  {replyAttachments.length > 0 && (
                    <div className="border rounded p-2">
                      <h6 className="mb-2">Selected Files:</h6>
                      {replyAttachments.map((attachment) => (
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
                    <Button type="submit" variant="primary">
                      <FaReply className="me-1" />
                      Send Reply
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowReplyForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        </Card>
      </div>
    );
  }

  if (showForwardForm) {
    return (
      <div className="email-forward">
        <Card>
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowForwardForm(false)}
                className="me-3"
              >
                <FaArrowLeft className="me-1" />
                Back to Email
              </Button>
              <h5 className="mb-0">Forward Email</h5>
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
            
            <Form onSubmit={handleForwardSubmit}>
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Label className="fw-bold">To:</Form.Label>
                </Col>
                <Col md={10}>
                  <Form.Control
                    type="email"
                    value={forwardForm.to}
                    onChange={(e) => setForwardForm(prev => ({ ...prev, to: e.target.value }))}
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
                    value={forwardForm.subject}
                    onChange={(e) => setForwardForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Label className="fw-bold">Message:</Form.Label>
                </Col>
                <Col md={10}>
                  {/* Use the same renderEmailBody function for consistency */}
                  <div className="border rounded p-3">
                    <div className="text-muted small mb-2">
                      Forwarded from: {email.sender} | Date: {formatDate(email.received_at)}
                    </div>
                    {renderEmailBody(email.body)}
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col md={2}></Col>
                <Col md={10}>
                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary">
                      <FaForward className="me-1" />
                      Forward Email
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowForwardForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="email-read">
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
            
            </Button>
          </div>
          
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleReply}
            >
              <FaReply className="me-1" />
              Reply
            </Button>
            
            <Button
              variant="outline-info"
              size="sm"
              onClick={handleForward}
            >
              <FaForward className="me-1" />
              Forward
            </Button>
            
            {/* Star/Unstar Button - Show for all tabs EXCEPT trash */}
            {currentCategory !== 'trash' && (() => {
              try {
                const labels = typeof email.labels === 'string' ? JSON.parse(email.labels) : email.labels;
                const hasStarredLabels = Array.isArray(labels) && (labels.includes('starred') || labels.includes('yellow_star'));
                
                return (
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => handleAction('star', { starred: !hasStarredLabels })}
                    title={hasStarredLabels ? "Remove star" : "Add star"}
                  >
                    <FaStar 
                      className={hasStarredLabels ? "text-warning" : ""}
                      style={{ 
                        fontSize: '16px',
                        filter: hasStarredLabels ? 'drop-shadow(0 0 3px rgba(255, 193, 7, 0.6))' : 'none'
                      }}
                    />
                  </Button>
                );
              } catch (error) {
                return null;
              }
            })()}
            
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <FaEdit className="me-1" />
                Actions
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {/* Tab-specific actions based on currentCategory */}
                
                {/* INBOX TAB ACTIONS */}
                {currentCategory === 'inbox' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('archive', {})}>
                      Archive
                </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* SENT TAB ACTIONS */}
                {currentCategory === 'sent' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* STARRED TAB ACTIONS */}
                {currentCategory === 'starred' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('archive', {})}>
                  Archive
                </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                  Move to Trash
                </Dropdown.Item>
                  </>
                )}
                
                {/* ARCHIVED TAB ACTIONS */}
                {currentCategory === 'archived' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                  </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* SPAM TAB ACTIONS */}
                {currentCategory === 'spam' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                </Dropdown.Item>
                  </>
                )}
                
                {/* SOCIAL TAB ACTIONS */}
                {currentCategory === 'social' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('archive', {})}>
                      Archive
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* PROMOTIONS TAB ACTIONS */}
                {currentCategory === 'promotions' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('archive', {})}>
                      Archive
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* UPDATES TAB ACTIONS */}
                {currentCategory === 'updates' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('archive', {})}>
                      Archive
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* FORUMS TAB ACTIONS */}
                {currentCategory === 'forums' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('archive', {})}>
                      Archive
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_trash', {})}>
                      Move to Trash
                    </Dropdown.Item>
                  </>
                )}
                
                {/* TRASH TAB ACTIONS */}
                {currentCategory === 'trash' && (
                  <>
                    <Dropdown.Item onClick={() => handleAction('unread', {})}>
                      Mark as Unread
                    </Dropdown.Item> 
                    <Dropdown.Header>Move to</Dropdown.Header>
                    <Dropdown.Item onClick={() => handleAction('move_to_inbox', {})}>
                      Inbox
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_spam', {})}>
                      Spam
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_social', {})}>
                      Social
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_promotions', {})}>
                      Promotions
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_updates', {})}>
                      Updates
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAction('move_to_forums', {})}>
                      Forums
                </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => handleAction('delete_forever', {})} className="text-danger">
                      Delete Forever
                    </Dropdown.Item>
                  </>
                )}
                
                {/* Add to Event - Only show when NOT in trash tab */}
                {currentCategory !== 'trash' && (
                  <>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => {
                  const eventData = getEmailEventData();
                  const queryParams = new URLSearchParams({
                    title: eventData.title,
                    description: eventData.description,
                    start_time: eventData.start_time,
                    end_time: eventData.end_time,
                    location: eventData.location,
                    category: eventData.category,
                    email_id: eventData.email_id,
                    email_sender: eventData.email_sender
                  });
                  window.location.href = `/events-management?${queryParams.toString()}`;
                }}>
                  <FaCalendarPlus className="me-1" />
                  Add to Event
                </Dropdown.Item>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>
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
          
          {/* eventSuccess state is no longer needed */}

          {/* Email Header */}
          <div className="email-header mb-4">
            <Row className="align-items-start">
              <Col md={8}>
                <div className="mb-3">
                  <h4 className="mb-0 text-primary">{email.subject}</h4>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="me-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                        <span className="text-primary fw-bold">{email.sender.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{email.sender}</div>
                        <div className="text-muted small">
                          {getRecipientDisplay()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4} className="text-end">
                <div className="text-muted small mb-2">
                  {formatDate(email.received_at)}
                </div>
                {/* Removed all badges - keeping only the date */}
              </Col>
            </Row>
          </div>

          {/* Email Body */}
          <div className="email-body">
            {loadingBody && (
              <div className="text-center mb-3">
                <FaSpinner className="fa-spin me-2" />
                <span className="text-muted">Loading email content...</span>
              </div>
            )}
            <div className="border rounded p-3 ">
              {renderEmailBody(emailBody)}

            </div>
            {/* Attachments Section */}
          {email.has_attachment && regularAttachments.length > 0 && (
            <div className="attachments-section mt-4">
              <h6 className="mb-3 d-flex align-items-center">
                <i className="fas fa-paperclip me-2"></i>
                Attachments ({regularAttachments.length})
              </h6>
              
              {/* The note about inline images is no longer relevant */}
              
              {loadingAttachments ? (
                <div className="text-center py-3">
                  <FaSpinner className="fa-spin me-2" />
                  <span className="text-muted">Loading attachments...</span>
                </div>
              ) : regularAttachments.length > 0 ? (
                <div className="attachments-list">
                  {regularAttachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className={`attachment-item border rounded p-3 mb-2 d-flex align-items-center justify-content-between cursor-pointer`}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handlePreviewAttachment(attachment)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="attachment-icon me-3">
                          {attachment.mime_type.startsWith('image/') ? (
                            <i className="fas fa-image text-primary fa-lg"></i>
                          ) : attachment.mime_type.startsWith('application/pdf') ? (
                            <i className="fas fa-file-pdf text-danger fa-lg"></i>
                          ) : attachment.mime_type.startsWith('application/') ? (
                            <i className="fas fa-file-alt text-secondary fa-lg"></i>
                          ) : attachment.mime_type.startsWith('text/') ? (
                            <i className="fas fa-file-text text-info fa-lg"></i>
                          ) : (
                            <i className="fas fa-paperclip text-muted fa-lg"></i>
                          )}
                        </div>
                        <div className="attachment-info">
                          <div className="fw-bold">{attachment.filename}</div>
                          <div className="text-muted small">
                            {attachment.mime_type} • {formatFileSize(attachment.size)}
                            <span className="ms-2 text-info">
                              <i className="fas fa-eye me-1"></i>
                              Click to preview
                            </span>
                            {previewLoading && previewAttachment?.id === attachment.id && (
                              <span className="ms-2 text-primary">
                                <i className="fas fa-spinner fa-spin me-1"></i>
                                Loading...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the attachment click
                            downloadAttachment(email.id, attachment.id, attachment.filename);
                          }}
                        >
                          <i className="fas fa-download me-1"></i>
                          Download
                        </Button>
                        {attachment.mime_type.startsWith('image/') && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the attachment click
                              handlePreviewAttachment(attachment);
                            }}
                          >
                            <i className="fas fa-eye me-1"></i>
                            Preview
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-3">
                  No attachments found
                </div>
              )}
            </div>
          )}
          </div>

          

          {/* Auto Reply Section */}
          {email.auto_reply && (
            <div className="auto-reply mt-4">
              <h6>Auto Reply:</h6>
              <div className="border rounded p-3 bg-info bg-opacity-10">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {email.auto_reply}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Image Preview Modal */}
      {showPreviewModal && previewAttachment && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1040 }}></div>
          
          {/* Modal */}
          <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
            <div className="modal-content bg-white rounded shadow-lg p-4 w-100 h-100 d-flex flex-column" style={{ maxWidth: '95vw', maxHeight: '95vh' }}>
              <div className="modal-header d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  {previewAttachment.mime_type.startsWith('image/') && <i className="fas fa-image text-primary fa-lg"></i>}
                  {previewAttachment.mime_type === 'application/pdf' && <i className="fas fa-file-pdf text-danger fa-lg"></i>}
                  {previewAttachment.mime_type.startsWith('text/') && <i className="fas fa-file-text text-info fa-lg"></i>}
                  {previewAttachment.mime_type.startsWith('application/') && !previewAttachment.mime_type.includes('pdf') && <i className="fas fa-file-alt text-secondary fa-lg"></i>}
                  {!previewAttachment.mime_type.startsWith('image/') && !previewAttachment.mime_type.startsWith('text/') && previewAttachment.mime_type !== 'application/pdf' && <i className="fas fa-file text-muted fa-lg"></i>}
                </div>
                <div>
                  <h5 className="mb-0">{previewAttachment.filename}</h5>
                  <small className="text-muted">
                    {previewAttachment.mime_type.startsWith('image/') && 'Image Preview'}
                    {previewAttachment.mime_type === 'application/pdf' && 'PDF Preview'}
                    {previewAttachment.mime_type.startsWith('text/') && 'Text Preview'}
                    {previewAttachment.mime_type.startsWith('application/') && !previewAttachment.mime_type.includes('pdf') && 'Document Preview'}
                    {!previewAttachment.mime_type.startsWith('image/') && !previewAttachment.mime_type.startsWith('text/') && previewAttachment.mime_type !== 'application/pdf' && 'File Preview'}
                  </small>
                </div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
              <div className="modal-body w-100 h-100 text-center flex-grow-1 overflow-auto">
              {previewLoading ? (
                <div className="py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Loading attachment preview...</p>
                </div>
              ) : (
                <>
                  {previewAttachment && previewAttachment.data ? (
                    <AttachmentViewer
                      base64Data={previewAttachment.data}
                      mimeType={previewAttachment.mime_type}
                      filename={previewAttachment.filename}
                    />
                  ) : (
                    <div className="text-center py-3">
                      <div className="mb-3">
                        <i className="fas fa-exclamation-triangle fa-2x text-warning"></i>
                      </div>
                      <p className="text-warning mb-2">No Preview Available</p>
                      <p className="text-muted small">
                        This attachment cannot be previewed. Try downloading the file instead.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
              <div className="modal-footer d-flex justify-content-between flex-shrink-0">
              <div className="text-muted small">
                {previewAttachment.mime_type} • {formatFileSize(previewAttachment.size)}
              </div>
              <Button
                variant="primary"
                onClick={() => downloadAttachment(email.id, previewAttachment.id, previewAttachment.filename)}
              >
                <i className="fas fa-download me-1"></i>
                Download
              </Button>
            </div>
          </div>
        </div>
        </>
      )}

    </div>
  );
};

export default EmailRead;
