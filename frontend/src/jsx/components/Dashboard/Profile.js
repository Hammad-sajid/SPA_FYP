import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaCalendar, FaEdit, FaSave, FaTimes, FaCamera, FaGoogle, FaShieldAlt, FaClock } from 'react-icons/fa';
import axios from 'axios';
import DropDownBlog from './DropDownBlog';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalEvents: 0,
    totalEmails: 0
  });
  
  // Form state for editing
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    phone: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:8000/api/auth/users/me', {
        withCredentials: true
      });
      
      
      
      // Check if profile photo URL needs decoding
      if (response.data.profile_photo) {
        try {
          const decodedUrl = decodeURIComponent(response.data.profile_photo);
          console.log('Decoded profile photo URL:', decodedUrl);
          if (decodedUrl !== response.data.profile_photo) {
            console.log('URL was encoded, using decoded version');
            response.data.profile_photo = decodedUrl;
          }
        } catch (error) {
          console.log('Error decoding URL:', error);
        }
      }
      
      setUser(response.data);
      
      // Initialize form data
      setFormData({
        username: response.data.username || '',
        email: response.data.email || '',
        bio: response.data.bio || '',
        phone: response.data.phone || ''
      });
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch tasks, events, and emails in parallel
      const [tasksRes, eventsRes, emailsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/tasks/all', { withCredentials: true }),
        axios.get('http://localhost:8000/api/events/all', { withCredentials: true }),
        axios.get('http://localhost:8000/api/emails/list', { withCredentials: true })
      ]);

      const totalTasks = tasksRes.data?.length || 0;
      const completedTasks = tasksRes.data?.filter(task => task.completed)?.length || 0;
      const totalEvents = eventsRes.data?.length || 0;
      const totalEmails = emailsRes.data?.results?.length || emailsRes.data?.length || 0;

      setUserStats({
        totalTasks,
        completedTasks,
        totalEvents,
        totalEmails
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Don't show error for stats, just use defaults
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Call backend to update user profile
      const response = await axios.put('http://localhost:8000/api/auth/users/me', formData, {
        withCredentials: true
      });
      
      // Update local state with new data
      setUser(prev => ({
        ...prev,
        ...formData
      }));
      
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      phone: user?.phone || ''
    });
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Call backend to change password
      await axios.post('http://localhost:8000/api/auth/users/me/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      }, {
        withCredentials: true
      });
      
      // Close modal and reset form
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccess('Password changed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePhotoUpdate = async (photoUrl) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Call backend to update profile photo
      const response = await axios.put('http://localhost:8000/api/auth/users/me/profile-photo', {
        profile_photo: photoUrl
      }, {
        withCredentials: true
      });
      
      // Update local state
      setUser(prev => ({
        ...prev,
        profile_photo: photoUrl
      }));
      
      setSuccess('Profile photo updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error updating profile photo:', error);
      setError('Failed to update profile photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getMemberSince = () => {
    if (!user?.created_at) return 'Unknown';
    const date = new Date(user.created_at);
    return date.getFullYear();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <FaTimes className="me-2" />
        {error}
        <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchUserProfile}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <>
      {/* Success Message */}
      {success && (
        <Alert variant="success" className="mb-3">
          <FaSave className="me-2" />
          {success}
        </Alert>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <FaTimes className="me-2" />
          {error}
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchUserProfile}>
            Retry
          </Button>
        </Alert>
      )}

      <div className="row">
        {/* Profile Card */}
        <div className="col-xl-4 col-xxl-5 col-lg-12">
          <Card className="">
          <Card.Header className="border-0">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Profile Information
              </h5>
            </Card.Header>
            <Card.Body className="text-center pb-3">
              <div className="instructors-media ">
                {/* Profile Photo */}
                <div className="position-relative d-inline-block ">
                  <img 
                    src={user?.profile_photo || 'https://via.placeholder.com/150x150?text=No+Photo'} 
                    alt="Profile" 
                    className="rounded-circle"
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    onError={(e) => {
                      console.log('Profile photo failed to load, using placeholder');
                      e.target.src = 'https://via.placeholder.com/150x150?text=No+Photo';
                    }}
                    onLoad={(e) => {
                      console.log('Profile photo loaded successfully:', e.target.src);
                    }}
                  />
                </div>
                
                {/* Profile Photo Info */}
                {user?.google_id && user?.profile_photo && (
                  <small className="text-muted d-block mt-2">
                    <FaGoogle className="me-1" />
                    Photo from Google Account
                  </small>
                )}

                <div className="instructors-media-info mt-4">
                  <h4 className="mb-1">{user?.username || 'Unknown User'}</h4>
                  <span className="fs-18 text-muted">
                    <FaCalendar className="me-2" />
                    Member Since {getMemberSince()}
                  </span>
                  
                  {/* Authentication Method Badge */}
                  <div className="mt-2">
                    {user?.google_id ? (
                      <Badge bg="success" className="me-2">
                        <FaGoogle className="me-1" />
                        Google Account
                      </Badge>
                    ) : (
                      <Badge bg="primary" className="me-2">
                        <FaShieldAlt className="me-1" />
                        Email Account
                      </Badge>
                    )}
                    
                    <Badge bg={user?.email_verified ? "success" : "warning"}>
                      {user?.email_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="bio text-start my-4">
                <h6 className="mb-2">
                  <FaUser className="me-2" />
                  Bio
                </h6>
                {editMode ? (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-muted">
                    {user?.bio || 'No bio added yet. Click edit to add one!'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-center gap-2 mb-4">
                {editMode ? (
                  <>
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleCancel}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setEditMode(true)}
                  >
                    <FaEdit className="me-2" />
                    Edit Profile
                  </Button>
                )}
                
                <Button 
                  variant="outline-warning" 
                  size="sm" 
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="col-xl-8 col-xxl-7 col-lg-12">
          <Card>
            <Card.Header className="border-0">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Profile Details
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaUser className="me-2" />
                      Username
                    </Form.Label>
                    {editMode ? (
                      <Form.Control
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Enter username"
                      />
                    ) : (
                      <Form.Control
                        type="text"
                        value={user?.username || ''}
                        disabled
                      />
                    )}
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaEnvelope className="me-2" />
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={user?.email || ''}
                      disabled
                    />
                    <small className="text-muted">
                      Email cannot be changed. Contact support if needed.
                    </small>
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaCalendar className="me-2" />
                      Phone
                    </Form.Label>
                    {editMode ? (
                      <Form.Control
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <Form.Control
                        type="text"
                        value={user?.phone || 'Not provided'}
                        disabled
                      />
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Account Statistics - New Row */}
      <div className="row mt-3">
        <div className="col-12">
          <Card>
            <Card.Header className="border-0">
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Account Statistics
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center">
                  <div className="border-end">
                    <h3 className="text-primary mb-1">{userStats.totalTasks}</h3>
                    <small className="text-muted">Total Tasks</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="border-end">
                    <h3 className="text-success mb-1">{userStats.completedTasks}</h3>
                    <small className="text-muted">Completed Tasks</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="border-end">
                    <h3 className="text-info mb-1">{userStats.totalEvents}</h3>
                    <small className="text-muted">Total Events</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div>
                    <h3 className="text-warning mb-1">{userStats.totalEmails}</h3>
                    <small className="text-muted">Emails</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                placeholder="Enter current password"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                placeholder="Enter new password"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                placeholder="Confirm new password"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePasswordChange}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Profile;