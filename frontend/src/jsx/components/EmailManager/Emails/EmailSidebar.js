import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FaInbox, FaPaperPlane, FaStar, FaTrash, FaEdit, FaPlus, FaArchive, FaExclamationTriangle, FaBan } from 'react-icons/fa';

const EmailSidebar = ({
  currentCategory,
  setCurrentCategory,
  handleCompose,
  emails,
  allEmails,
  getUnreadCount
}) => {
  
  
  
  return (
    <div className="email-sidebar">
      <div className="p-3">
        <div className="mb-3">
          <Button 
            variant="primary" 
            className="w-100" 
            onClick={handleCompose}
          >
            <FaPlus className="me-2" />
            Compose
          </Button>
        </div>

        <div className="mail-list">
          {/* System Labels (Sidebar Navigation - Like Gmail) */}
          <div className="mb-3">
            <h6 className="text-muted small text-uppercase mb-2">System Labels</h6>
            
            <div 
              className={`list-group-item list-group-item-action ${currentCategory === 'inbox' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('inbox')}
              style={{ cursor: 'pointer' }}
            >
              <FaInbox className="me-2" />
              Inbox
              <Badge bg="primary" className="float-end">
                {getUnreadCount()}
              </Badge>
            </div>
            
            <div 
              className={`list-group-item list-group-item-action ${currentCategory === 'starred' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('starred')}
              style={{ cursor: 'pointer' }}
            >
              <FaStar className="me-2" />
              Starred
              
            </div>
            
            <div
              className={`list-group-item list-group-item-action ${currentCategory === 'important' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('important')}
              style={{ cursor: 'pointer' }}
            >
              <FaStar className="me-2" style={{ color: '#dc3545' }} />
              Important
              
            </div>
            
            <div
              className={`list-group-item list-group-item-action ${currentCategory === 'sent' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('sent')}
              style={{ cursor: 'pointer' }}
            >
              <FaPaperPlane className="me-2" />
              Sent
              
            </div>
            
            <div
              className={`list-group-item list-group-item-action ${currentCategory === 'draft' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('draft')}
              style={{ cursor: 'pointer' }}
            >
              <FaEdit className="me-2" />
              Drafts
            
            </div>
            
            <div
              className={`list-group-item list-group-item-action ${currentCategory === 'all' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('all')}
              style={{ cursor: 'pointer' }}
            >
              <FaInbox className="me-2" />
              All Mail
            </div>
            
            
            <div
              className={`list-group-item list-group-item-action ${currentCategory === 'spam' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('spam')}
              style={{ cursor: 'pointer' }}
            >
              <FaBan className="me-2" />
              Spam
              
            </div>

            <div
              className={`list-group-item list-group-item-action ${currentCategory === 'trash' ? 'active' : ''}`}
              onClick={() => setCurrentCategory('trash')}
              style={{ cursor: 'pointer' }}
            >
              <FaTrash className="me-2" />
              Trash
              
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;
