import React from 'react';
import { Button, Badge, Form, InputGroup, Alert, Spinner, Nav, NavItem, NavLink } from 'react-bootstrap';
import { FaSearch, FaStar, FaSpinner, FaEnvelope, FaInfoCircle, FaEnvelopeOpen, FaTrash } from 'react-icons/fa';

const EmailList = ({
  emails,
  loading,
  searchQuery,
  setSearchQuery,
  selectedEmails,
  selectAll,
  handleSelectAll,
  handleEmailSelect,
  handleEmailClick,
  handleBulkAction,
  gmailConnected,
  gmailError,
  syncStatus,
  setGmailError,
  setSyncStatus,
  // Pagination props
  currentPage,
  totalPages,
  totalEmails,
  emailsPerPage,
  handlePageChange,
  // Top tab props
  currentCategory,
  currentTopTab,
  onTopTabChange
}) => {
  // Function to determine recipient display text
  const getRecipientDisplay = (email) => {
    if (!email.to_recipients) {
      return 'to me';
    }
    return `to ${email.to_recipients}`;
  };

  // Gmail Categories for top tabs
  const gmailCategories = [
    { id: 'inbox', name: 'Primary', icon: '📁', color: 'primary' },
    { id: 'social', name: 'Social', icon: '👥', color: 'info' },
    { id: 'promotions', name: 'Promotions', icon: '🏷️', color: 'warning' },
    { id: 'updates', name: 'Updates', icon: 'ℹ️', color: 'success' },
    { id: 'forums', name: 'Forums', icon: '💬', color: 'secondary' }
  ];

  return (
    <div className="email-list-container">
      {/* Gmail Category Tabs (Only shown when in inbox) */}
      {currentCategory === 'inbox' && (
        <div className="mb-3">
          <Nav variant="tabs" className="gmail-category-tabs">
            {gmailCategories.map(category => (
              <NavItem key={category.id}>
                <NavLink
                  className={`text-decoration-none ${currentTopTab === category.name ? 'active' : ''}`}
                  onClick={() => onTopTabChange(category.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="me-2">{category.icon}</span>
                  {category.name}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </div>
      )}

      {/* Search Bar - Full Width */}
      <div className="mb-3">
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      {/* Bulk Actions - Below Search Bar */}
      {selectedEmails.size > 0 && (
        <div className="d-flex gap-2 mb-3 p-3 rounded-3">
          <div className="d-flex align-items-center me-3">
            <span className="text-muted  fw-bold me-2">
              {selectedEmails.size} {selectedEmails.size !== 1 ? '' : ''} selected
            </span>
          </div>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => handleBulkAction('read')}
          >
            <FaEnvelopeOpen className="me-1" />
            Mark Read
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => handleBulkAction('unread')}
          >
            <FaEnvelope className="me-1" />
            Mark Unread
          </Button>
          {/* Show star/unstar actions only when NOT in trash tab */}
          {currentCategory !== 'trash' && (
            <>
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={() => handleBulkAction('starred')}
              >
                <FaStar className="me-1" />
                Star
              </Button>
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={() => handleBulkAction('unstarred')}
              >
                <FaStar className="me-1" />
                Unstar
              </Button>
            </>
          )}
          {/* Show archive button only when inbox is active */}
          {currentCategory === 'inbox' && (
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={() => handleBulkAction('archived')}
            >
              Archive
            </Button>
          )}
          {/* Show delete button only when NOT in trash tab */}
          {currentCategory !== 'trash' && (
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              <FaTrash className="me-1" />
              Delete
            </Button>
          )}
          {/* Show trash-specific actions only when trash tab is active */}
          {currentCategory === 'trash' && (
            <>
              <div className="dropdown">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  className="dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Move to
                </Button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#" onClick={() => handleBulkAction('move_to_inbox')}>Inbox</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => handleBulkAction('move_to_spam')}>Spam</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => handleBulkAction('move_to_social')}>Social</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => handleBulkAction('move_to_promotions')}>Promotions</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => handleBulkAction('move_to_updates')}>Updates</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => handleBulkAction('move_to_forums')}>Forums</a></li>
                </ul>
              </div>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => handleBulkAction('delete_forever')}
              >
                Delete Forever
              </Button>
            </>
          )}
        </div>

        
      )}

      {/* Gmail Status */}
      {gmailError && (
        <Alert variant="danger" dismissible onClose={() => setGmailError(null)}>
          {gmailError}
        </Alert>
      )}

      {syncStatus === 'success' && (
        <Alert variant="success" dismissible onClose={() => setSyncStatus('idle')}>
          Gmail emails synced successfully! Refresh the page to see the latest emails.
        </Alert>
      )}

      {/* Email List */}
      <div className="email-list">
        {loading ? (
          <div className="text-center py-4">
            <FaSpinner className="fa-spin fa-2x text-muted" />
            <p className="mt-2 text-muted">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-4">
            <FaEnvelope className="fa-3x text-muted mb-3" />
            <p className="text-muted">No emails found</p>
            {!gmailConnected && (
              <p className="text-muted small">
                Connect to Gmail using the panel above to start syncing emails
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="border-bottom pb-2 mb-2">
              <Form.Check
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                label="Select All"
              />
            </div>

            {/* Email Items */}
            {emails.map((email) => {
              const cleanSender = email.sender.replace(/[<>]/g, "").split("@")[0];
              const cleanRecipient = email.to_recipients ? email.to_recipients.replace(/[<>]/g, "").split("@")[0] : '';
              
              // For sent emails, show recipient; for received emails, show sender
              const displayName = email.labels.includes('sent') ? cleanRecipient : cleanSender;
              const displayLabel = email.labels.includes('sent') ? 'To:' : '';
                
              // Limit display name to first 10 characters
              const truncatedName = displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName;
              
              // Check if email has unread label
              const hasUnreadLabel = (() => {
                if (!email.labels) return false;
                if (typeof email.labels === 'string') {
                  try {
                    const parsedLabels = JSON.parse(email.labels);
                    return Array.isArray(parsedLabels) && parsedLabels.includes('unread');
                  } catch (error) {
                    return false;
                  }
                }
                return Array.isArray(email.labels) && email.labels.includes('unread');
              })();
              const emailBackgroundClass = hasUnreadLabel ? 'bg-white' : 'bg-light';
              
              return (
                <div 
                  key={email.id} 
                  className={`email-item border-bottom p-3 ${emailBackgroundClass}`}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    // Add subtle hover effect for all emails
                    e.currentTarget.style.backgroundColor = hasUnreadLabel ? '#f8f9fa' : '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    // Restore original background
                    e.currentTarget.style.backgroundColor = '';
                  }}
                  onClick={() => {
                    // Always open email for viewing first
                    handleEmailClick(email);
                  }}
                >
                  <div className="d-flex align-items-center">
                    {/* Left side - Icons and checkbox */}
                    <div className="d-flex align-items-center me-3">
                      <Form.Check
                        type="checkbox"
                        checked={selectedEmails.has(email.id)}
                        onChange={() => handleEmailSelect(email.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="me-2"
                      />                      
                      {/* Star icon or placeholder for consistent alignment */}
                      {(() => {
                        try {
                          const labels = typeof email.labels === 'string' ? JSON.parse(email.labels) : email.labels;
                          const hasStarredLabels = Array.isArray(labels) && (labels.includes('starred') || labels.includes('yellow_star'));
                          return hasStarredLabels ? (
                            <div 
                              className="star-icon me-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Remove star - remove both starred and yellow_star labels
                                handleEmailClick({...email, action: 'remove_star'});
                              }}
                              style={{ 
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '3px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Remove star"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <FaStar 
                                className="text-warning"
                                style={{ 
                                  fontSize: '16px',
                                  filter: 'drop-shadow(0 0 3px rgba(255, 193, 7, 0.6))'
                                }}
                              />
                            </div>
                          ) : (
                            // Placeholder div to maintain consistent alignment
                            <div className="me-2" style={{ width: '24px', height: '24px' }}></div>
                          );
                        } catch (error) {
                          // Placeholder div to maintain consistent alignment
                          return <div className="me-2" style={{ width: '24px', height: '24px' }}></div>;
                        }
                      })()}
                    </div>
                    
                    {/* Center - Email content */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center">
                        <div className="me-3" style={{ minWidth: '120px', maxWidth: '120px' }}>
                          <strong className={hasUnreadLabel ? 'fw-bold' : ''}>
                            {displayLabel} {truncatedName}
                          </strong>
                        </div>
                        <div className="flex-grow-1">
                          <div className="subject">
                            <strong className={hasUnreadLabel ? 'fw-bold' : ''}>
                              {email.subject}
                            </strong>
                            {/* Attachment indicator */}
                            {email.has_attachment && (
                              <span className="ms-2 text-muted">
                                <i className="fas fa-paperclip"></i>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Action buttons */}
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmailClick({...email, action: 'toggle_read'});
                        }}
                        title={hasUnreadLabel ? "Mark as Read" : "Mark as Unread"}
                      >
                        {hasUnreadLabel ? <FaEnvelope /> : <FaEnvelopeOpen />}
                      </Button>
                      {/* Show delete button only when NOT in trash tab */}
                      {currentCategory !== 'trash' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailClick({...email, action: 'delete'});
                          }}
                          title="Move to Trash"
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && emails.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
          <div className="text-muted">
            Showing {((currentPage - 1) * emailsPerPage) + 1} to {Math.min(currentPage * emailsPerPage, totalEmails)} of {totalEmails} emails
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>
          
        
          
          {totalPages > 1 && (
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="px-3 py-2 text-muted">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailList;
