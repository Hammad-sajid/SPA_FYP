import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Form, Alert } from 'react-bootstrap';
import { FaGoogle, FaSpinner, FaSync, FaEnvelope, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const GoogleMailPanel = ({ onRefresh, onRefreshCounts }) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [emails, setEmails] = useState([]);
  const [twoWaySync, setTwoWaySync] = useState(true);

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE}/api/gmail/connection-status`, {
        withCredentials: true
      });
      
      if (response.data.connected) {
        setConnected(true);
        setLastSync(response.data.last_sync ? new Date(response.data.last_sync).toLocaleString() : null);
        setError(null);
      } else {
        setConnected(false);
        setLastSync(null);
        setError(null);
      }
    } catch (error) {
      setConnected(false);
      setLastSync(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE}/api/gmail/auth-url`, {
        withCredentials: true
      });
      
      if (response.data.auth_url) {
        // Open Gmail OAuth in a new window
        const authWindow = window.open(
          response.data.auth_url,
          'gmail-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the callback
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // Check if connection was successful
            setTimeout(() => {
              checkConnectionStatus();
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      setError('Connection failed, try again');
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE}/api/gmail/sync-native-labels`, {}, {
        withCredentials: true
      });
      
      // Since backend returns 200 OK, consider it successful
      if (response.status === 200) {
        const message = response.data.message || 'Gmail sync completed successfully';
        const syncedCount = response.data.emails_synced || 0;
        
        setSuccess(`Successfully synced ${syncedCount} emails! ${message}`);
        setLastSync(new Date().toLocaleString());
        
        // Refresh connection status
        setTimeout(() => {
          checkConnectionStatus();
        }, 1000);
      } else {
        setError('Sync failed, try again');
      }
    } catch (error) {
      setError('Sync failed, try again');
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE}/api/gmail/disconnect`, {}, {
        withCredentials: true
      });
      
      // Since backend returns 200 OK, consider it successful
      if (response.status === 200) {
        setSuccess('Gmail disconnected successfully!');
        setConnected(false);
        setEmails([]);
        setLastSync(null);
        
        // Clear any existing success/error messages after a delay
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Disconnect failed, try again');
      }
    } catch (error) {
      setError('Disconnect failed, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      {/* Header Section - Styled like Google Calendar Panel */}
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-6">Google Mail</span>
          {connected ? (
            <span className="badge bg-success">Connected</span>
          ) : (
            <span className="badge bg-secondary">Not connected</span>
          )}
        </div>
        
        <div className="d-flex gap-2">
          {connected ? (
            <>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={disconnectGmail}
                disabled={loading}
              >
                Disconnect
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={async () => {
                  await checkConnectionStatus();
                  if (onRefresh) onRefresh();
                  if (onRefreshCounts) onRefreshCounts();
                }}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={syncEmails}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <FaSpinner className="fa-spin me-1" />
                ) : (
                  <FaSync className="me-1" />
                )}
                Sync now
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={connectGmail}
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="fa-spin me-1" />
              ) : (
                <FaEnvelope className="me-1" />
              )}
              Connect Gmail
            </Button>
          )}
        </div>
      </Card.Header>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          {success}
        </Alert>
      )}

      
     
    </Card>
  );
};

export default GoogleMailPanel;
