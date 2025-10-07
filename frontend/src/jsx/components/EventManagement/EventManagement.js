import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import { Card, Col, Button, Modal, Form, Row } from 'react-bootstrap';
import { FaCalendar } from 'react-icons/fa';

// events files
import CalendarView from './CalendarView';
import EventForm from './EventForm';
import EventStats from './EventStats';
import EventDetailPopup from './EventDetailPopup';
import GoogleCalendarPanel from './GoogleCalendarPanel';
import ReminderToasts from '../shared/ReminderToasts';
import EventList from './EventList';
import VoiceCommand from '../VoiceCommand/VoiceCommand';

const API_URL = "http://localhost:8000/api/events";

const EventManagement = ({ isAuthenticated }) => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    repeat: 'none',
    category: 'general',
    linked_task: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [gConnected, setGConnected] = useState(false);
  const [gCalendars, setGCalendars] = useState([]);
  const [gSelected, setGSelected] = useState([]);
  const [gTwoWay, setGTwoWay] = useState(true);
  const [gSyncing, setGSyncing] = useState(false);
  const [toastReminders, setToastReminders] = useState([]);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // New state variables for tab system
  const [viewMode, setViewMode] = useState('active'); // 'active', 'archived', 'expired', 'all'
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [expiredEvents, setExpiredEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventStats, setEventStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    archived: 0,
    upcoming: 0
  });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [eventToArchive, setEventToArchive] = useState(null);
  const [expiryNotification, setExpiryNotification] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);

  // Check for URL parameters to pre-fill event form from email
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailTitle = urlParams.get('title');
    const emailDescription = urlParams.get('description');
    const emailStartTime = urlParams.get('start_time');
    const emailEndTime = urlParams.get('end_time');
    const emailLocation = urlParams.get('location');
    const emailCategory = urlParams.get('category');
    const emailId = urlParams.get('email_id');
    const emailSender = urlParams.get('email_sender');

    // If we have email data, pre-fill the form and open modal
    if (emailTitle || emailDescription || emailStartTime) {
      setForm({
        title: emailTitle || '',
        description: emailDescription || '',
        start_time: emailStartTime || '',
        end_time: emailEndTime || '',
        repeat: 'none',
        category: emailCategory || 'general',
        linked_task: '',
        // Add email reference fields
        email_id: emailId || '',
        email_sender: emailSender || '',
        location: emailLocation || ''
      });
      setEditId(null); // Ensure we're in create mode
      setShowModal(true);
      
      // Clear the URL parameters after using them
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Check for Smart Prioritization data in localStorage
  useEffect(() => {
    const smartEventData = localStorage.getItem('smartPrioritizationEvent');
    if (smartEventData) {
      try {
        const eventData = JSON.parse(smartEventData);
        
        // Pre-fill the form with Smart Prioritization data
        setForm({
          title: eventData.title || '',
          description: eventData.description || '',
          start_time: eventData.start_time || '',
          end_time: eventData.end_time || '',
          repeat: 'none',
          category: eventData.category || 'general',
          linked_task: '',
          location: ''
        });
        
        // Open the modal automatically
        setEditId(null); // Ensure we're in create mode
        setShowModal(true);
        
        // Clear the localStorage data after using it
        localStorage.removeItem('smartPrioritizationEvent');
        
        // Show a success message or notification
        console.log('Smart Prioritization event data loaded:', eventData);
        
        // Show success notification
        setExpiryNotification({
          type: 'success',
          message: `✅ Smart Prioritization event data loaded! Form is ready with suggested time: ${eventData.start_time} - ${eventData.end_time}, Category: ${eventData.category}, Priority: ${eventData.priority}`
        });
        
        // Auto-clear notification after 5 seconds
        setTimeout(() => setExpiryNotification(null), 5000);
      } catch (error) {
        console.error('Error parsing Smart Prioritization event data:', error);
        localStorage.removeItem('smartPrioritizationEvent');
      }
    }
  }, []);

  // Custom styles for consistent filter input heights
  const filterInputStyle = {
    height: '38px',  // Standard Bootstrap form control height
    minHeight: '38px'
  };

  // Custom styles to ensure consistent action button sizes
  const actionButtonStyle = {
    fontSize: '14px',
    padding: '6px 12px',
    minWidth: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Helper function to format dates gracefully
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      // Try to parse as ISO string first
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If ISO parsing fails, try to display the raw string
        return dateString;
      }
      return date.toLocaleString();
    } catch (e) {
      // Fallback to raw string
      return dateString;
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchEventStats();
  }, []);

  useEffect(() => {
    // Fetch different event types based on view mode
    if (viewMode === 'active') {
      fetchEvents();
    } else if (viewMode === 'archived') {
      fetchArchivedEvents();
    } else if (viewMode === 'expired') {
      fetchExpiredEvents();
    } else if (viewMode === 'all') {
      fetchAllEvents();
    }
  }, [viewMode]);

  // Trigger re-render when filters change
  useEffect(() => {
    // Filters changed, component will re-render
    resetPagination(); // Reset to first page when filters change
  }, [search, categoryFilter, dateRange, sortOrder]);

  // Check for expired events and show notifications
  useEffect(() => {
    if (viewMode === 'active') {
      const checkForExpiredEvents = async () => {
        try {
          const response = await axios.get(`${API_URL}/expired`, { withCredentials: true });
          const expiredEvents = response.data;
          
          if (expiredEvents.length > 0) {
            setExpiryNotification({
              type: 'warning',
              message: `You have ${expiredEvents.length} expired event${expiredEvents.length > 1 ? 's' : ''}. Check the Expired tab to review them.`,
              events: expiredEvents
            });
            
            // Auto-dismiss the warning after 5 seconds
            setTimeout(() => {
              setExpiryNotification(null);
            }, 5000);
          }
        } catch (error) {
          console.error('Error checking for expired events:', error);
        }
      };
      
      checkForExpiredEvents();
    }
  }, [viewMode]);

  useEffect(() => {
    const endTimers = events.map(event => {
      const end = new Date(event.end_time).getTime();
      const now = Date.now();
      const triggerTime = end - 10 * 60 * 1000;
      const delay = triggerTime - now;

      if (delay > 0) {
        return setTimeout(() => {
          pushReminderToast(event, end);
        }, delay);
      }
      return null;
    });

    return () => endTimers.forEach(timer => clearTimeout(timer));
  }, [events]);

  useEffect(() => {
    const startTimers = events.map(event => {
      const start = new Date(event.start_time).getTime();
      const now = Date.now();
      const triggerTime = start - 10 * 60 * 1000;
      const delay = triggerTime - now;

      if (delay > 0) {
        return setTimeout(() => {
          pushReminderToast(event, start);
        }, delay);
      }
      return null;
    });

    return () => startTimers.forEach(timer => clearTimeout(timer));
  }, [events]);

  // Authentication Guard - Redirect unauthorized users
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/active`, { withCredentials: true });
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching active events:', error);
    }
  };

  const fetchArchivedEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/archived`, { withCredentials: true });
      setArchivedEvents(res.data);
    } catch (error) {
      console.error('Error fetching archived events:', error);
    }
  };

  const fetchExpiredEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/expired`, { withCredentials: true });
      setExpiredEvents(res.data);
    } catch (error) {
      console.error('Error fetching expired events:', error);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/all`, { withCredentials: true });
      setAllEvents(res.data);
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  const fetchEventStats = async () => {
    const res = await axios.get(`${API_URL}/stats`, { withCredentials: true });
    setEventStats(res.data);
  };

  // Tab change handler
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    setSearch(''); // Clear search when changing tabs
    setCategoryFilter('all'); // Reset category filter
    setDateRange({ from: '', to: '' }); // Reset date range
    resetPagination(); // Reset pagination
  };

  // Archive event
  const confirmArchive = (event) => {
    setEventToArchive(event);
    setShowArchiveModal(true);
  };

  const handleArchive = async () => {
    try {
      await axios.post(`${API_URL}/${eventToArchive.id}/archive`, {}, { withCredentials: true });
      
      // Refresh current view and stats
      if (viewMode === 'active') {
        fetchEvents();
      } else if (viewMode === 'all') {
        fetchAllEvents();
      }
      fetchEventStats(); // Refresh stats immediately
      
      setShowArchiveModal(false);
      setEventToArchive(null);
    } catch (error) {
      console.error('Error archiving event:', error);
    }
  };

  // Unarchive event
  const handleUnarchiveEvent = async (eventId) => {
    try {
      await axios.post(`${API_URL}/${eventId}/unarchive`, {}, { withCredentials: true });
      fetchArchivedEvents(); // Refresh archived view
      fetchEventStats(); // Refresh stats immediately
    } catch (error) {
      console.error('Error unarchiving event:', error);
    }
  };

  // Google Calendar mock handlers (replace with real API endpoints later)
  const connectGoogle = async () => {
    try {
      // window.location = '/api/google/auth'; // real OAuth redirect
      setGConnected(true);
      // after connect, load calendars
      setGCalendars([
        { id: 'primary', summary: 'Primary' },
        { id: 'work', summary: 'Work' },
        { id: 'personal', summary: 'Personal' },
      ]);
      setGSelected(['primary']);
    } catch (e) {
      console.error('Google connect failed', e);
    }
  };

  const disconnectGoogle = () => {
    setGConnected(false);
    setGCalendars([]);
    setGSelected([]);
  };

  const refreshCalendars = async () => {
    // fetch from backend if connected
  };

  const toggleCalendarPick = (id) => {
    setGSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleTwoWay = () => setGTwoWay((v) => !v);

  const syncNow = async () => {
    try {
      setGSyncing(true);
      // await axios.post('/api/google/sync', { calendars: gSelected, twoWay: gTwoWay })
      await new Promise((r) => setTimeout(r, 800));
      await fetchEvents();
    } finally {
      setGSyncing(false);
    }
  };

  // Toast reminders with snooze
  const pushReminderToast = (event, whenMs) => {
    setToastReminders((prev) => [
      ...prev,
      { id: `${event.id}-${Date.now()}`, title: event.title, time: whenMs },
    ]);
  };

  const handleSnooze = (toast, minutes) => {
    setToastReminders((prev) => prev.filter((t) => t.id !== toast.id));
    setTimeout(() => pushReminderToast({ id: toast.id, title: toast.title }, Date.now()), minutes * 60 * 1000);
  };

  const closeToast = (toast) => setToastReminders((prev) => prev.filter((t) => t.id !== toast.id));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    
    // Real-time date validation
    if (name === 'start_time' && value) {
      const selectedDate = new Date(value);
      const currentDate = new Date();
      if (selectedDate < currentDate) {
        setErrors({ ...errors, start_time: 'Cannot select a start time in the past' });
      } else {
        // Clear start time error if valid
        setErrors({ ...errors, start_time: "" });
      }
      
      // Check if end time is before start time
      if (form.end_time && new Date(form.end_time) <= selectedDate) {
        setErrors({ ...errors, end_time: 'End time must be after start time' });
      } else if (errors.end_time === 'End time must be after start time') {
        // Clear end time error if now valid
        setErrors({ ...errors, end_time: "" });
      }
    }
    
    if (name === 'end_time' && value) {
      const selectedEndDate = new Date(value);
      const currentDate = new Date();
      
      if (selectedEndDate < currentDate) {
        setErrors({ ...errors, end_time: 'Cannot select an end time in the past' });
      } else if (form.start_time && selectedEndDate <= new Date(form.start_time)) {
        setErrors({ ...errors, end_time: 'End time must be after start time' });
      } else {
        // Clear end time error if valid
        setErrors({ ...errors, end_time: "" });
      }
    }
  };

  // Get current date in YYYY-MM-DDTHH:MM format for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) newErrors.title = "Please enter title";
    if (!form.description.trim()) newErrors.description = "Please enter description";
    
    // Start time validation
    if (!form.start_time) {
      newErrors.start_time = "Please select start time";
    } else {
      const startDate = new Date(form.start_time);
      const currentDate = new Date();
      if (startDate < currentDate) {
        newErrors.start_time = 'Cannot select a start time in the past';
      }
    }
    
    // End time validation
    if (!form.end_time) {
      newErrors.end_time = "Please select end time";
    } else {
      const endDate = new Date(form.end_time);
      const currentDate = new Date();
      
      if (endDate < currentDate) {
        newErrors.end_time = 'Cannot select an end time in the past';
      } else if (form.start_time && endDate <= new Date(form.start_time)) {
        newErrors.end_time = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form from submitting normally
    if (!validateForm()) return;

    try {
          if (editId) {
        await axios.put(`${API_URL}/update/${editId}`, form, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/create`, form, { withCredentials: true });
      }
        setForm({ title: "", description: "", start_time: "", end_time: "", repeat: 'none', category: 'general', linked_task: '', location: '' });
        setEditId(null);
        setShowModal(false);
        fetchEvents();
        fetchEventStats(); // Refresh stats immediately
      } catch (error) {
        console.error("Error submitting event:", error);
      }
    };

  const handleEdit = (event) => {
    setEditId(event.id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      start_time: event.start_time ? event.start_time.slice(0,16) : '',
      end_time: event.end_time ? event.end_time.slice(0,16) : '',
      repeat: event.repeat || 'none',
      category: event.category || 'general',
      linked_task: event.linked_task || '',
      location: event.location || ''
    });
    setShowModal(true);
    setErrors({});
  };

  const onDateSelect = (info) => {
    const startISO = info.startStr?.slice(0, 16);
    
    // Set default end time to 1 hour after start time
    let endISO = info.endStr?.slice(0, 16);
    if (startISO && !endISO) {
      const startDate = new Date(startISO);
      startDate.setHours(startDate.getHours() + 1);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      endISO = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setEditId(null);
    setForm({ title: '', description: '', start_time: startISO, end_time: endISO, repeat: 'none', category: 'general', linked_task: '', location: '' });
    setShowModal(true);
  };

  const onEventClick = (clickInfo) => {
    // Find the original event data by matching the transformed event ID
    const match = (viewMode === 'active' ? events : viewMode === 'all' ? allEvents : viewMode === 'expired' ? expiredEvents : archivedEvents)
      .find(e => String(e.id) === String(clickInfo.event.id));
    
    if (match) {
      handleEdit(match);
    }
  };

  const onViewEvent = (event) => {
    setDetailEvent(event);
    setShowDetail(true);
  };

  const onChangeCategory = async (event, newCategory) => {
    try {
      await axios.put(`${API_URL}/update/${event.id}`, { ...event, category: newCategory }, { withCredentials: true });
      fetchEvents();
      fetchEventStats(); // Refresh stats immediately
    } catch (error) {
      console.error("Error changing category:", error);
    }
  };

  const toCalendarEvents = () => {
    let filteredEvents = [];
    if (viewMode === 'active') {
      filteredEvents = events;
    } else if (viewMode === 'all') {
      filteredEvents = allEvents;
    } else if (viewMode === 'expired') {
      filteredEvents = expiredEvents;
    } else if (viewMode === 'archived') {
      filteredEvents = archivedEvents;
    }

    const filtered = (filteredEvents || [])
      .filter(ev => {
        const q = search.trim().toLowerCase();
        if (q && !(`${ev.title}`.toLowerCase().includes(q) || `${ev.description}`.toLowerCase().includes(q))) return false;
        if (categoryFilter !== 'all' && (ev.category || 'general') !== categoryFilter) return false;
        if (dateRange.from && new Date(ev.start_time) < new Date(dateRange.from)) return false;
        if (dateRange.to && new Date(ev.end_time) > new Date(dateRange.to)) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by start time
        const dateA = new Date(a.start_time);
        const dateB = new Date(b.start_time);
        
        if (sortOrder === 'asc') {
          return dateA - dateB; // Ascending: earliest first
        } else {
          return dateB - dateA; // Descending: latest first
        }
      });

    return filtered;
  };

  // Pagination logic
  const getPaginatedEvents = () => {
    const filtered = toCalendarEvents();
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    return filtered.slice(indexOfFirstEvent, indexOfLastEvent);
  };

  const getTotalPages = () => {
    const filtered = toCalendarEvents();
    return Math.ceil(filtered.length / eventsPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Transform events for calendar view
  const toCalendarViewEvents = () => {
    const filtered = toCalendarEvents();
    return filtered.map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.start_time,
      end: ev.end_time,
      backgroundColor: ev.category === 'work' ? '#0d6efd' : ev.category === 'personal' ? '#198754' : ev.category === 'meeting' ? '#fd7e14' : '#6c757d',
      borderColor: 'transparent',
    }));
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/delete/${deleteId}`, { withCredentials: true });
      fetchEvents();
      fetchEventStats(); // Refresh stats immediately
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setShowConfirm(false);
      setDeleteId(null);
    }
  };

  return (
    <Col lg={12}>
      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
          <FaCalendar className="fa-1x text-primary me-3" />
          <h5 className="mb-0">Calendar Events</h5>
          </div>
          <div className="d-flex gap-2">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('active')}
              >
                Active Events
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('all')}
              >
                All Events
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'expired' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('expired')}
              >
                Expired
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'archived' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('archived')}
              >
                Archived
              </button>
            </div>
            {viewMode === 'active' && (
              <Button onClick={() => {
                setShowModal(true);
                setEditId(null);
                setForm({ title: "", description: "", start_time: "", end_time: "", location: '' });
              }} variant="primary">
                Add Event
              </Button>
            )}
            <VoiceCommand 
              module="events" 
              onSuccess={(data) => {
                // Refresh events after voice command success
                fetchEvents();
                fetchAllEvents();
              }}
              buttonVariant="outline-info"
              buttonSize="sm"
              buttonText="🗣️ Voice"
            />
          </div>
        </Card.Header>

        <Card.Body>
          <GoogleCalendarPanel
            connected={gConnected}
            calendars={gCalendars}
            selectedCalendars={gSelected}
            twoWaySync={gTwoWay}
            isSyncing={gSyncing}
            onConnect={connectGoogle}
            onDisconnect={disconnectGoogle}
            onRefreshCalendars={refreshCalendars}
            onToggleCalendar={toggleCalendarPick}
            onToggleTwoWay={toggleTwoWay}
            onSyncNow={syncNow}
          />

          <div className="mb-4">
            <EventStats 
              events={viewMode === 'active' ? events : viewMode === 'all' ? allEvents : viewMode === 'expired' ? expiredEvents : archivedEvents}
              viewMode={viewMode}
              allEvents={allEvents}
              expiredEvents={expiredEvents}
              archivedEvents={archivedEvents}
              eventStats={eventStats}
            />
          </div>
          
          {/* Expiry Notification */}
          {expiryNotification && (
            <div className={`alert alert-${expiryNotification.type} alert-dismissible fade show`} role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {expiryNotification.message}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setExpiryNotification(null)}
                aria-label="Close"
              ></button>
            </div>
          )}

          

          

          <CalendarView
            events={toCalendarViewEvents()}
            onDateSelect={onDateSelect}
            onEventClick={onEventClick}
          />
           
           {/* Event List Component */}
           <EventList
             events={events}
             viewMode={viewMode}
             loading={false}
             search={search}
             setSearch={setSearch}
             categoryFilter={categoryFilter}
             setCategoryFilter={setCategoryFilter}
             dateRange={dateRange}
             setDateRange={setDateRange}
             sortOrder={sortOrder}
             setSortOrder={setSortOrder}
             currentPage={currentPage}
             totalPages={getTotalPages()}
             totalEvents={toCalendarEvents().length}
             eventsPerPage={eventsPerPage}
             handlePageChange={handlePageChange}
             handleEdit={handleEdit}
             confirmDelete={confirmDelete}
             onViewEvent={onViewEvent}
             onChangeCategory={onChangeCategory}
             confirmArchive={confirmArchive}
             handleUnarchiveEvent={handleUnarchiveEvent}
             getPaginatedEvents={getPaginatedEvents}
             formatDate={formatDate}
             filterInputStyle={filterInputStyle}
             actionButtonStyle={actionButtonStyle}
           />
        </Card.Body>
      </Card>

      

      {/* Add/Edit Modal */}
      <EventForm
        show={showModal}
        isEditing={!!editId}
        form={form}
        errors={errors}
        onChange={handleChange}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        minDateTime={getCurrentDateTime()}
      />

      {/* Confirm Delete Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this event?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal show={showArchiveModal} onHide={() => setShowArchiveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Archive Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to archive the event <strong>"{eventToArchive?.title}"</strong>?
          <br />
          <small className="text-muted">Archived events can be unarchived later from the Archived tab.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>Cancel</Button>
          <Button variant="warning" onClick={handleArchive}>Archive Event</Button>
        </Modal.Footer>
      </Modal>

      {/* Event Detail Modal */}
      <EventDetailPopup
        show={showDetail}
        event={detailEvent}
        onClose={() => setShowDetail(false)}
      />

      {/* Toast Reminders */}
      <ReminderToasts
        reminders={toastReminders}
        onClose={closeToast}
        onSnooze={handleSnooze}
      />
    </Col>
  );
};

// Connect to Redux store
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.user !== null
});

export default connect(mapStateToProps)(EventManagement);
