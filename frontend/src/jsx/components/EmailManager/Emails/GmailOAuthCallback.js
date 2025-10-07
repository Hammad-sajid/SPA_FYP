import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Card, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const GmailOAuthCallback = () => {
  const location = useLocation();
  const history = useHistory();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Gmail OAuth callback...');

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Parse query parameters manually for React Router v5
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`OAuth error: ${error}`);
        setTimeout(() => {
          window.close();
        }, 2000);
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

        // Exchange the authorization code for tokens
        const response = await axios.post(`${API_BASE}/api/gmail/exchange-token`, {
          code: code
        }, {
          withCredentials: true
        });

        setStatus('success');
        setMessage('Successfully connected to Gmail! You can close this window.');

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
              <h4>Gmail Connection</h4>
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

export default GmailOAuthCallback;
