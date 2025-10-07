import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Card, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const GoogleOAuthCallback = () => {
  const location = useLocation();
  const history = useHistory();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Parse query parameters manually for React Router v5
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state'); // We'll use this to determine the service

      if (error) {
        setStatus('error');
        if (error === 'not_authenticated') {
          setMessage('Authentication required. Please log in and try again.');
        } else {
          setMessage(`OAuth error: ${error}`);
        }
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      try {
        setStatus('processing');
        setMessage('Exchanging code for tokens...');

        // Determine which service this callback is for based on the current URL
        const isGmailCallback = window.location.pathname.includes('gmail');
        const endpoint = isGmailCallback ? '/api/gmail/exchange-token' : '/api/google-calendar/exchange-token';
        const serviceName = isGmailCallback ? 'Gmail' : 'Google Calendar';

        // Exchange the authorization code for tokens
        const response = await axios.post(`${API_BASE}${endpoint}`, {
          code: code
        }, {
          withCredentials: true
        });

        setStatus('success');
        setMessage(`Successfully connected to ${serviceName}! You can close this window.`);

        // Close the window immediately after successful connection
        setTimeout(() => {
          window.close();
        }, 1000);

      } catch (error) {
        setStatus('error');
        setMessage(`Failed to connect: ${error.response?.data?.detail || error.message}`);
        
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [location]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Spinner animation="border" size="sm" />;
      case 'success':
        return <span className="text-success">✅</span>;
      case 'error':
        return <span className="text-danger">❌</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Header className="text-center">
              <h4>Google OAuth Connection</h4>
            </Card.Header>
            <Card.Body className="text-center">
              <div className="mb-3">
                {getStatusIcon()}
              </div>
              <p className="mb-0">{message}</p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback; 