import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DropDownBlog from './DropDownBlog';
import { Tab, Nav, Badge, Spinner, Alert, Card, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { 
  FaTasks, FaCalendarAlt, FaEnvelope, FaUser, FaEdit, FaCheck, FaTimes, 
  FaClock, FaExclamationTriangle, FaFilter, FaSearch, FaChartBar, 
  FaEye, FaEyeSlash, FaSort, FaSortUp, FaSortDown 
} from 'react-icons/fa';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, priority
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    tasks: 0,
    events: 0,
    emails: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch activities from new comprehensive endpoint
      const [activitiesRes, statsRes] = await Promise.all([
        axios.get("http://localhost:8000/api/activities/all", { withCredentials: true }),
        axios.get("http://localhost:8000/api/activities/stats", { withCredentials: true })
      ]);

      if (activitiesRes.data) {
        setActivities(activitiesRes.data);
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }

    } catch (error) {
      console.error("Error loading activities:", error);
      
      // Fallback to individual endpoints if comprehensive endpoint fails
      try {
        const [tasksRes, eventsRes, emailsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/tasks/all", { withCredentials: true }),
          axios.get("http://localhost:8000/api/events/all", { withCredentials: true }),
          axios.get("http://localhost:8000/api/emails/list", { withCredentials: true })
        ]);

        const allActivities = [];

        // Process tasks
        if (tasksRes.data && Array.isArray(tasksRes.data)) {
          tasksRes.data.forEach(task => {
            allActivities.push({
              id: task.id,
              type: 'task',
              title: task.title,
              description: task.description,
              status: task.completed ? 'completed' : 'pending',
              importance: task.importance,
              due_date: task.due_date,
              created_at: task.created_at,
              updated_at: task.updated_at,
              action: 'created',
              user: task.assigned_to_username || 'You',
              category: task.category,
              tags: task.tags,
              archived: task.archived
            });
          });
        }

        // Process events
        if (eventsRes.data && Array.isArray(eventsRes.data)) {
          eventsRes.data.forEach(event => {
            allActivities.push({
              id: event.id,
              type: 'event',
              title: event.title,
              description: event.description,
              start_time: event.start_time,
              end_time: event.end_time,
              category: event.category,
              created_at: event.created_at,
              updated_at: event.updated_at,
              action: 'created',
              user: 'You',
              archived: event.archived
            });
          });
        }

        // Process emails
        if (emailsRes.data && emailsRes.data.results && Array.isArray(emailsRes.data.results)) {
          emailsRes.data.results.forEach(email => {
                         allActivities.push({
               id: email.id,
               type: 'email',
               title: email.subject,
               description: email.snippet || (email.body ? email.body.substring(0, 100) + '...' : 'No content'),
               from: email.sender,
               to: email.to_recipients,
               received_at: email.received_at,
               created_at: email.created_at,
               updated_at: email.updated_at,
               action: 'received',
               user: email.sender || 'Unknown',
               labels: email.labels || []
             });
          });
        }

        // Sort and set activities
        allActivities.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || a.received_at);
          const dateB = new Date(b.updated_at || b.created_at || b.received_at);
          return dateB - dateA;
        });

        setActivities(allActivities.slice(0, 50));
      } catch (fallbackError) {
        setError("Failed to load activities. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type, action) => {
    const iconSize = "1.2rem";
    switch (type) {
      case 'task':
        return <FaTasks className="text-primary" size={iconSize} />;
      case 'event':
        return <FaCalendarAlt className="text-success" size={iconSize} />;
      case 'email':
        return <FaEnvelope className="text-info" size={iconSize} />;
      default:
        return <FaUser className="text-secondary" size={iconSize} />;
    }
  };

  const getActivityBadge = (type, item) => {
    switch (type) {
      case 'task':
        if (item.status === 'completed') {
          return <Badge bg="success" className="ms-2">Completed</Badge>;
        } else if (item.importance === 3) {
          return <Badge bg="danger" className="ms-2">High Priority</Badge>;
        } else if (item.importance === 2) {
          return <Badge bg="warning" className="ms-2">Medium Priority</Badge>;
        } else if (item.importance === 1) {
          return <Badge bg="secondary" className="ms-2">Low Priority</Badge>;
        }
        
        if (item.category && item.category.trim()) {
          return <Badge bg="info" className="ms-2">{item.category}</Badge>;
        }
        
        return null;
        
      case 'event':
        if (item.start_time) {
          const startTime = new Date(item.start_time);
          const now = new Date();
          if (startTime < now) {
            return <Badge bg="secondary" className="ms-2">Past Event</Badge>;
          } else if (startTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
            return <Badge bg="warning" className="ms-2">Today</Badge>;
          } else {
            return <Badge bg="success" className="ms-2">Upcoming</Badge>;
          }
        }
        
        if (item.category && item.category.trim()) {
          return <Badge bg="info" className="ms-2">{item.category}</Badge>;
        }
        
        return null;
        
             case 'email':
         if (item.labels && item.labels.includes('starred')) {
           return <Badge bg="warning" className="ms-2">Starred</Badge>;
         }
         if (item.labels && item.labels.includes('important')) {
           return <Badge bg="danger" className="ms-2">Important</Badge>;
         }
         if (item.labels && item.labels.includes('unread')) {
           return <Badge bg="warning" className="ms-2">Unread</Badge>;
         }
         if (item.labels && item.labels.some(label => label.startsWith('category_'))) {
           const categoryLabel = item.labels.find(label => label.startsWith('category_'));
           const category = categoryLabel.replace('category_', '');
           return <Badge bg="info" className="ms-2">{category}</Badge>;
         }
         
         return <Badge bg="primary" className="ms-2">Email</Badge>;
        
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'task':
        if (activity.due_date) {
          const dueDate = new Date(activity.due_date);
          const now = new Date();
          if (dueDate < now && activity.status !== 'completed') {
            return <span className="text-danger fw-bold">Overdue - Due {formatTimeAgo(activity.due_date)}</span>;
          } else if (dueDate > now) {
            return <span className="text-muted">Due {formatTimeAgo(activity.due_date)}</span>;
          }
        }
        
        let taskInfo = [];
        if (activity.category && activity.category.trim()) {
          taskInfo.push(`Category: ${activity.category}`);
        }
        if (activity.tags && activity.tags.trim()) {
          taskInfo.push(`Tags: ${activity.tags}`);
        }
        
        if (taskInfo.length > 0) {
          return (
            <div>
              <div className="mb-1">{activity.description || 'No description'}</div>
              <small className="text-muted">{taskInfo.join(' • ')}</small>
            </div>
          );
        }
        
        return activity.description || 'No description';
      
      case 'event':
        if (activity.start_time) {
          const startTime = new Date(activity.start_time);
          const now = new Date();
          if (startTime < now) {
            return <span className="text-muted">Event ended {formatTimeAgo(activity.start_time)}</span>;
          } else {
            return <span className="text-success fw-bold">Event starts {formatTimeAgo(activity.start_time)}</span>;
          }
        }
        
        if (activity.category && activity.category.trim()) {
          return (
            <div>
              <div className="mb-1">{activity.description || 'No description'}</div>
              <small className="text-muted">Category: {activity.category}</small>
            </div>
          );
        }
        
        return activity.description || 'No description';
      
             case 'email':
         let emailInfo = [];
         if (activity.from) {
           emailInfo.push(`From: ${activity.from}`);
         }
         if (activity.labels && activity.labels.length > 0) {
           // Filter out system labels and show user labels
           const userLabels = activity.labels.filter(label => 
             !label.startsWith('category_') && 
             !['inbox', 'trash', 'archived', 'unread'].includes(label)
           );
           if (userLabels.length > 0) {
             emailInfo.push(`Labels: ${userLabels.join(', ')}`);
           }
         }
        
        if (emailInfo.length > 0) {
          return (
            <div>
              <div className="mb-1">{activity.description}</div>
              <small className="text-muted">{emailInfo.join(' • ')}</small>
            </div>
          );
        }
        
        return activity.description;
      
      default:
        return activity.description || 'No description';
    }
  };

  const filteredAndSortedActivities = activities
    .filter(activity => {
      // Filter by type
      if (filter !== 'all' && activity.type !== filter) return false;
      
      // Filter by search term
      if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !activity.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      // Filter archived items
      if (!showArchived && activity.archived) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          const dateA = new Date(a.updated_at || a.created_at || a.received_at);
          const dateB = new Date(b.updated_at || b.created_at || b.received_at);
          return dateA - dateB;
        case 'priority':
          if (a.type === 'task' && b.type === 'task') {
            return (b.importance || 0) - (a.importance || 0);
          }
          return 0;
        case 'recent':
        default:
          const dateA2 = new Date(a.updated_at || a.created_at || a.received_at);
          const dateB2 = new Date(b.updated_at || b.created_at || b.received_at);
          return dateB2 - dateA2;
      }
    });

  const getFilterCount = (type) => {
    if (type === 'all') return activities.length;
    return activities.filter(activity => activity.type === type).length;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted fs-5">Loading recent activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        <FaExclamationTriangle className="me-2" size="1.5rem" />
        <h5>{error}</h5>
        <Button variant="outline-danger" onClick={fetchActivities} className="mt-2">
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FaTasks className="text-primary me-2" size="1.5rem" />
                <h4 className="mb-0 text-primary">{stats.tasks}</h4>
              </div>
              <small className="text-muted">Total Tasks</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FaCheck className="text-success me-2" size="1.5rem" />
                <h4 className="mb-0 text-success">{stats.completed}</h4>
              </div>
              <small className="text-muted">Completed</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FaCalendarAlt className="text-success me-2" size="1.5rem" />
                <h4 className="mb-0 text-success">{stats.events}</h4>
              </div>
              <small className="text-muted">Total Events</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FaEnvelope className="text-info me-2" size="1.5rem" />
                <h4 className="mb-0 text-info">{stats.emails}</h4>
              </div>
              <small className="text-muted">Total Emails</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FaEnvelope className="text-warning me-2" size="1.5rem" />
                <h4 className="mb-0 text-warning">{stats.unread_emails || 0}</h4>
              </div>
              <small className="text-muted">Unread Emails</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Activity Card */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <h5 className="mb-0 me-3">
                <FaChartBar className="me-2 text-primary" />
                Activity Timeline
              </h5>
              <Badge bg="primary" className="fs-6">{filteredAndSortedActivities.length} activities</Badge>
            </div>
            
            <div className="d-flex align-items-center gap-2 mx-2">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={fetchActivities}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <FaClock className="me-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Filters and Search */}
          <div className="p-3 border-bottom bg-light">
            <Row className="g-3">
              <Col md={4}>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Col>
              
              <Col md={3}>
                <select 
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">By Priority</option>
                </select>
              </Col>
              
              <Col md={3}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showArchived"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="showArchived">
                    Show Archived
                  </label>
                </div>
              </Col>
              
              <Col md={2}>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy('recent');
                    setShowArchived(false);
                  }}
                >
                  <FaFilter className="me-1" />
                  Clear
                </Button>
              </Col>
            </Row>
          </div>

          {/* Activity Type Tabs */}
          <div className="p-3 border-bottom">
            <Nav variant="tabs" className="nav-fill">
              <Nav.Item>
                <Nav.Link 
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                  className="text-center"
                >
                  <FaChartBar className="me-2" />
                  All Activities ({getFilterCount('all')})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={filter === 'tasks'}
                  onClick={() => setFilter('tasks')}
                  className="text-center"
                >
                  <FaTasks className="me-2" />
                  Tasks ({getFilterCount('tasks')})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={filter === 'events'}
                  onClick={() => setFilter('events')}
                  className="text-center"
                >
                  <FaCalendarAlt className="me-2" />
                  Events ({getFilterCount('events')})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={filter === 'emails'}
                  onClick={() => setFilter('emails')}
                  className="text-center"
                >
                  <FaEnvelope className="me-2" />
                  Emails ({getFilterCount('emails')})
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          {/* Activity Timeline */}
          <div className="p-3">
            {filteredAndSortedActivities.length > 0 ? (
              <div className="timeline-container">
                {filteredAndSortedActivities.map((activity, index) => (
                  <div key={`${activity.type}-${activity.id}-${index}`} className="timeline-item mb-4">
                    <div className="d-flex">
                      {/* Timeline Icon */}
                      <div className="timeline-icon me-3">
                        <div className="icon-wrapper">
                          {getActivityIcon(activity.type, activity.action)}
                        </div>
                      </div>
                      
                      {/* Timeline Content */}
                      <div className="timeline-content flex-grow-1">
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">
                                  {activity.title}
                                </h6>
                                <div className="mb-2">
                                  {getActivityDescription(activity)}
                                </div>
                              </div>
                              <div className="ms-2">
                                {getActivityBadge(activity.type, activity)}
                              </div>
                            </div>
                            
                            <div className="d-flex align-items-center text-muted small flex-wrap">
                              <span className="me-3">
                                <FaUser className="me-1" />
                                {activity.user}
                              </span>
                              
                              <span className="me-3">
                                <FaClock className="me-1" />
                                {formatTimeAgo(activity.created_at)}
                              </span>
                              
                              {activity.updated_at !== activity.created_at && (
                                <span className="me-3">
                                  <FaEdit className="me-1" />
                                  Updated {formatTimeAgo(activity.updated_at)}
                                </span>
                              )}
                              
                              {activity.type === 'task' && activity.due_date && (
                                <span className="me-3">
                                  <FaExclamationTriangle className="me-1" />
                                  Due {formatTimeAgo(activity.due_date)}
                                </span>
                              )}
                              
                              {activity.type === 'event' && activity.start_time && (
                                <span className="me-3">
                                  <FaCalendarAlt className="me-1" />
                                  Starts {formatTimeAgo(activity.start_time)}
                                </span>
                              )}
                              
                              {activity.type === 'email' && activity.received_at && (
                                <span className="me-3">
                                  <FaEnvelope className="me-1" />
                                  Received {formatTimeAgo(activity.received_at)}
                                </span>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="text-muted">
                  <FaClock size={64} className="mb-3" />
                  <h5>No activities found</h5>
                  <p>There are no activities matching your current filters.</p>
                  {filter !== 'all' && (
                    <Button 
                      variant="outline-primary"
                      onClick={() => setFilter('all')}
                      className="mt-2"
                    >
                      View all activities
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Custom CSS for Timeline */}
      <style jsx>{`
        .timeline-container {
          position: relative;
        }
        
        .timeline-container::before {
          content: '';
          position: absolute;
          left: 1.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #e9ecef 0%, #dee2e6 100%);
        }
        
        .timeline-item {
          position: relative;
        }
        
        .timeline-icon {
          position: relative;
          z-index: 2;
        }
        
        .icon-wrapper {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: white;
          border: 3px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .timeline-content {
          position: relative;
        }
        
        .timeline-content::before {
          content: '';
          position: absolute;
          left: -0.5rem;
          top: 1.5rem;
          width: 0;
          height: 0;
          border-top: 0.5rem solid transparent;
          border-bottom: 0.5rem solid transparent;
          border-right: 0.5rem solid white;
        }
      `}</style>
    </>
  );
};

export default Activity;
