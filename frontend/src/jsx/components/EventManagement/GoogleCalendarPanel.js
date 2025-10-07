import React, { useState, useEffect } from "react";
import { Card, Button, Form, Spinner, Alert } from "react-bootstrap";
import axios from "axios";

const GoogleCalendarPanel = () => {
  const [connected, setConnected] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [twoWaySync, setTwoWaySync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_BASE = "http://localhost:8000";

  const checkSession = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/auth/users/me`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    // Check session first, then check connection status
    const initializeComponent = async () => {
      const user = await checkSession();
      if (user) {
        // Session is valid, check connection status
        setTimeout(() => {
          checkConnectionStatus();
        }, 500);
      }
    };
    
    initializeComponent();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/google-calendar/calendars`, {
        withCredentials: true
      });
      setConnected(true);
      setCalendars(response.data);
      setError(null);
    } catch (error) {
      if (error.response?.status === 404) {
        setConnected(false);
        setCalendars([]);
      } else if (error.response?.status === 401) {
        // Session expired or not authenticated - this is normal, don't show error
        setConnected(false);
        setCalendars([]);
        setError(null); // Clear any previous errors
      } else if (error.response?.status === 403) {
        // Insufficient permissions - this is normal for new users, don't show error
        setConnected(false);
        setCalendars([]);
        setError(null); // Clear any previous errors
      } else {
        // Only show errors for unexpected issues, not for normal permission/auth states
        console.log('Connection status check failed:', error.response?.data?.detail || error.message);
        setConnected(false);
        setCalendars([]);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE}/api/google-calendar/test-connection`, {
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setSuccess('Connection test successful!');
      } else if (response.data.status === 'partial') {
        setSuccess(`Connection status: ${response.data.message}`);
      } else {
        setError(`Connection failed: ${response.data.message}`);
      }
    } catch (error) {
      setError(`Connection test failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null); // Clear any previous success messages
      
      const response = await axios.get(`${API_BASE}/api/google-calendar/auth-url`, {
        withCredentials: true
      });
      
      // Always open OAuth for calendar access
      setSuccess('Opening Google Calendar authentication...');
      
      // Open Google OAuth in a new window
      const authWindow = window.open(
        response.data.auth_url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the callback
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          // Clear the success message immediately when popup closes
          setSuccess(null);
          // Show a brief success message
          setSuccess('Google Calendar authentication completed! Checking connection...');
          // Check if connection was successful
          setTimeout(() => {
            checkConnectionStatus();
            // Clear the success message after checking
            setTimeout(() => setSuccess(null), 3000);
          }, 1000);
        }
      }, 1000);

      // Add a timeout to handle cases where popup doesn't close
      setTimeout(() => {
        if (!authWindow.closed) {
          clearInterval(checkClosed);
          setSuccess('Authentication in progress... Please complete the Google OAuth flow.');
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      if (error.response?.status === 401) {
        setError("Session expired. Please refresh the page and try again.");
      } else if (error.response?.status === 403) {
        setError("Access denied. Please check your Google Calendar permissions.");
      } else {
        setError("Failed to connect. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/google-calendar/disconnect`, {
        withCredentials: true
      });
      setConnected(false);
      setCalendars([]);
      setSelectedCalendars([]);
      setSuccess("Successfully disconnected from Google Calendar");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCalendars = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/google-calendar/calendars`, {
        withCredentials: true
      });
      setCalendars(response.data);
      setSuccess("Calendars refreshed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to refresh calendars");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCalendar = (calendarId) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleToggleTwoWay = () => {
    setTwoWaySync(!twoWaySync);
  };

  const handleSyncNow = async () => {
    if (selectedCalendars.length === 0) {
      setError("Please select at least one calendar to sync");
      return;
    }

    if (!connected) {
      setError("Please connect to Google Calendar first before syncing");
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE}/api/google-calendar/sync`, {
        calendar_ids: selectedCalendars,
        two_way_sync: twoWaySync
      }, {
        withCredentials: true
      });

      setSuccess(`${response.data.message} - ${response.data.events_synced} events synced`);
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (error) {
      if (error.response?.status === 404) {
        setError("Google Calendar not connected. Please connect first.");
      } else {
        setError(error.response?.data?.detail || "Sync failed");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-6">Google Calendar</span>
          {connected ? (
            <span className="badge bg-success">Connected</span>
          ) : (
            <span className="badge bg-secondary">Not connected</span>
          )}
        </div>
        <div className="d-flex gap-2">
          {!connected ? (
            <div className="text-center">
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleDisconnect}
                disabled={loading}
              >
                Disconnect
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleRefreshCalendars}
                disabled={loading}
              >
                Refresh Calendars
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleSyncNow} 
                disabled={isSyncing || selectedCalendars.length === 0}
              >
                {isSyncing && <Spinner animation="border" size="sm" className="me-2" />}
                Sync now
              </Button>
            </>
          )}
        </div>
      </Card.Header>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
          {error.includes("Access denied") && (
            <div className="mt-2">
              <p className="mb-2"><strong>How to fix this:</strong></p>
              <ol className="mb-2">
                <li>Click "Disconnect" below</li>
                <li>Click "Connect Google Calendar" again</li>
                <li>When Google asks for permissions, make sure to check:</li>
                <ul className="mt-1">
                  <li>✓ "See and manage your calendars"</li>
                  <li>✓ "View and edit events on all your calendars"</li>
                </ul>
                <li>Click "Continue" to grant permissions</li>
              </ol>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={handleDisconnect}
                className="me-2"
              >
                Disconnect & Reconnect
              </Button>
            </div>
          )}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      {connected && (
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-8">
              <div className="mb-2 fw-semibold">Choose calendars to sync</div>
              <div className="d-flex flex-wrap gap-3">
                {calendars.length === 0 ? (
                  <div className="text-muted">No calendars loaded.</div>
                ) : (
                  calendars.map((cal) => (
                    <Form.Check
                      key={cal.id}
                      type="checkbox"
                      id={`cal-${cal.id}`}
                      label={`${cal.summary}${cal.primary ? ' (Primary)' : ''}`}
                      checked={selectedCalendars.includes(cal.id)}
                      onChange={() => handleToggleCalendar(cal.id)}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-2 fw-semibold">Sync options</div>
              <Form.Check
                type="switch"
                id="two-way-sync"
                label="Two-way sync"
                checked={twoWaySync}
                onChange={handleToggleTwoWay}
              />
              <div className="small text-muted">
                If enabled, changes will sync both ways (Google ↔ App)
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  Selected calendars: {selectedCalendars.length}
                </small>
              </div>
            </div>
          </div>
        </Card.Body>
      )}
    </Card>
  );
};

export default GoogleCalendarPanel;

