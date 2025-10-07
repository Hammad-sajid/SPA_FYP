import React, { Fragment, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dropdown, Form, Button, Alert } from "react-bootstrap";
import PageTitle from "../../../../layouts/PageTitle";
import EmailService from "../../../../../services/EmailService";

const Inbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState(null);

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
    checkGmailConnection();
  }, []);

  const loadEmails = async () => {
      setLoading(true);
      try {
        const res = await EmailService.list({ q, pageSize: 50 });
        setEmails(res);
    } catch (error) {
      console.error("Failed to load emails:", error);
      } finally {
        setLoading(false);
      }
    };

  const checkGmailConnection = async () => {
    try {
      // Try to fetch Gmail emails to check if connected
      await EmailService.getGmailEmails({ maxResults: 1 });
      setGmailConnected(true);
      setGmailError(null);
    } catch (error) {
      if (error.response?.status === 404) {
        setGmailConnected(false);
        setGmailError(null);
      } else {
        setGmailError("Failed to check Gmail connection");
      }
    }
  };

  const handleGmailConnect = async () => {
    try {
      setGmailLoading(true);
      setGmailError(null);
      
      const response = await EmailService.getGmailAuthUrl();
      
      // Open Gmail OAuth in a new window
      const authWindow = window.open(
        response.auth_url,
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the callback
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          // Check if connection was successful
          setTimeout(() => {
            checkGmailConnection();
            loadEmails(); // Reload emails to show Gmail data
          }, 1000);
        }
      }, 1000);

    } catch (error) {
      if (error.response?.status === 401) {
        setGmailError("Session expired. Please refresh the page and try again.");
      } else if (error.response?.status === 403) {
        setGmailError("Access denied. Please check your Gmail permissions.");
      } else {
        setGmailError("Failed to connect. Please try again.");
      }
    } finally {
      setGmailLoading(false);
    }
  };

  const handleGmailSync = async () => {
    try {
      setGmailLoading(true);
      setGmailError(null);
      
      await EmailService.syncGmailEmails();
      await loadEmails(); // Reload emails after sync
      
    } catch (error) {
      setGmailError("Failed to sync Gmail emails. Please try again.");
    } finally {
      setGmailLoading(false);
    }
  };

  const handleSearch = async () => {
    await loadEmails();
  };

  return (
    <Fragment>
      <PageTitle activeMenu="Inbox" motherMenu="Email" pageContent="Email" />

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-body">
                <div className="row">
                    <div className="col-xl-3 col-lg-4">
                      <div className="email-left-box">
                        <div className="p-0">
                          <Link
                            to="/email-compose"
                            className="btn btn-primary btn-block"
                          >
                            Compose
                          </Link>
                        </div>
                    
                    {/* Gmail Connection Section */}
                        <div className="mail-list rounded mt-4">
                      <div className="intro-title d-flex justify-content-between my-0">
                        <h5>Gmail Integration</h5>
                      </div>
                      
                      {gmailError && (
                        <Alert variant="danger" className="mt-2">
                          {gmailError}
                        </Alert>
                      )}
                      
                      {!gmailConnected ? (
                        <Button
                          variant="outline-primary"
                          className="w-100 mt-2"
                          onClick={handleGmailConnect}
                          disabled={gmailLoading}
                        >
                          {gmailLoading ? "Connecting..." : "Connect Gmail"}
                        </Button>
                      ) : (
                        <div className="mt-2">
                          <div className="text-success mb-2">
                            <i className="fa fa-check-circle"></i> Gmail Connected
                          </div>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={handleGmailSync}
                            disabled={gmailLoading}
                          >
                            {gmailLoading ? "Syncing..." : "Sync Now"}
                          </Button>
                        </div>
                      )}
                        </div>
                        
                        <div className="mail-list rounded overflow-hidden mt-4">
                          <div className="intro-title d-flex justify-content-between my-0">
                            <h5>Categories</h5>
                            <i className="icon-arrow-down" aria-hidden="true"></i>
                          </div>
                          <Link to="/email-inbox" className="list-group-item">
                            <span className="icon-warning">
                              <i className="fa fa-circle" aria-hidden="true"></i>
                            </span>
                            Work
                          </Link>
                          <Link to="/email-inbox" className="list-group-item">
                            <span className="icon-primary">
                              <i className="fa fa-circle" aria-hidden="true"></i>
                            </span>
                            Private
                          </Link>
                          <Link to="/email-inbox" className="list-group-item">
                            <span className="icon-success">
                              <i className="fa fa-circle" aria-hidden="true"></i>
                            </span>
                            Support
                          </Link>
                          <Link to="/email-inbox" className="list-group-item">
                            <span className="icon-dpink">
                              <i className="fa fa-circle" aria-hidden="true"></i>
                            </span>
                            Social
                          </Link>
                        </div>
                      </div>
                    </div>
                
                    <div className="col-xl-9 col-lg-8">
                      <div className="email-right-box">
                      {/* Search Bar */}
                      <div className="d-flex gap-2 align-items-end mb-3">
                        <div className="flex-grow-1">
                          <Form.Label>Search</Form.Label>
                        <Form.Control 
                          placeholder="Search subject, sender or body" 
                          value={q} 
                          onChange={(e) => setQ(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        </div>
                        <div>
                        <Button 
                          className="mt-4" 
                          onClick={handleSearch} 
                          disabled={loading}
                        >
                          {loading ? "Searching..." : "Search"}
                        </Button>
                        </div>
                      </div>

                    {/* Email Count */}
                    <div className="mb-3">
                      <span className="badge badge-primary">
                        {emails.length} {emails.length === 1 ? 'email' : 'emails'}
                      </span>
                      {gmailConnected && (
                        <span className="badge badge-success ml-2">
                          <i className="fa fa-google"></i> Gmail Connected
                        </span>
                      )}
                    </div>

                      {/* Dynamic Emails (from API) */}
                      <div className="email-list mt-3">
                      {loading && <div className="p-3 text-muted">Loading emails...</div>}
                      {!loading && emails.length === 0 && (
                        <div className="p-3 text-muted text-center">
                          {gmailConnected ? 
                            "No emails found. Try syncing with Gmail or check your search terms." :
                            "No emails found. Connect your Gmail account to get started."
                          }
                        </div>
                      )}
                        {!loading && emails.map((e) => (
                          <div key={e.id} className="message">
                            <div>
                              <div className="d-flex message-single">
                                <div className="ps-1 align-self-center">
                                  <div className="form-check custom-checkbox">
                                    <input type="checkbox" className="form-check-input" id={`sel-${e.id}`} />
                                    <label className="form-check-label" htmlFor={`sel-${e.id}`} />
                                  </div>
                                </div>
                                <div className="ms-2">
                                  <button className="border-0 bg-transparent align-middle p-0">
                                  <i className={`fa ${e.starred ? 'fa-star text-warning' : 'fa-star-o'}`} aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                              <Link to={`email-read?id=${e.id}`} className="col-mail col-mail-2">
                                <div className="subject">
                                  <strong className="me-2">{e.sender}</strong>
                                  {e.subject}
                                </div>
                              <div className="date">
                                {e.received_at ? new Date(e.received_at).toLocaleString() : ""}
                              </div>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>

                    {/* Toolbar */}
                      <div role="toolbar" className="toolbar ms-1 ms-sm-0">
                        <div className="btn-group mb-1 me-1 ms-1">
                          <div className="form-check custom-checkbox">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="checkbox1"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="checkbox1"
                            ></label>
                          </div>
                        </div>
                        <div className="btn-group mb-1">
                          <button
                            className="btn btn-primary light px-3"
                            type="button"
                          onClick={loadEmails}
                          disabled={loading}
                          >
                            <i className="ti-reload"></i>
                          </button>
                        </div>
                      {gmailConnected && (
                        <div className="btn-group mb-1">
                          <button
                            className="btn btn-success light px-3"
                            type="button"
                            onClick={handleGmailSync}
                            disabled={gmailLoading}
                          >
                            <i className="fa fa-google"></i> Sync Gmail
                                </button>
                              </div>
                      )}
                        </div>
                      </div>
                    </div>
                     </div> 
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Inbox;
