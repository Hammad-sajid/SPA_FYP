import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

// Import the new components
import EventSuggestionForm from './events/EventSuggestionForm';
import EventResults from './events/EventResults';
import TaskSuggestionForm from './tasks/TaskSuggestionForm';
import TaskResults from './tasks/TaskResults';
import UserPreferencesForm from './shared/UserPreferencesForm';
import ConflictAnalysis from './shared/ConflictAnalysis';

const SmartPrioritization = ({ isAuthenticated }) => {
  const location = useLocation();
  const history = useHistory();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [taskSuggestions, setTaskSuggestions] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [conflictAnalysis, setConflictAnalysis] = useState(null);
  const [userTasks, setUserTasks] = useState([]);

  const API_BASE = "http://localhost:8000/api/smart-prioritization";

  // Determine current view based on URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/events')) return 'events';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/preferences')) return 'preferences';
    if (path.includes('/conflicts')) return 'conflicts';
    if (path.includes('/event-results')) return 'event-results';
    if (path.includes('/task-results')) return 'task-results';
    return 'events'; // Default to events
  };

  const currentView = getCurrentView();

  useEffect(() => {
    fetchUserPreferences();
    fetchUserTasks();
  }, []);

  // Authentication Guard - Redirect unauthorized users
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user-preferences`, { withCredentials: true });
      setUserPreferences(response.data);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      // Set default preferences if API fails
      setUserPreferences({
        working_hours_start: "09:00",
        working_hours_end: "18:00",
        preferred_break_times: ["12:00", "15:00"],
        min_gap_between_events: 15,
        preferred_categories: ["work", "meeting"],
        energy_levels: {
          morning: "high",
          afternoon: "medium",
          evening: "low"
        }
      });
    }
  };

  const fetchUserTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user-tasks`, { withCredentials: true });
      setUserTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      setUserTasks([]);
    }
  };

  const handleEventSuggestions = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        event_duration: formData.duration,
        priority: formData.priority,
        ...(formData.category && { category: formData.category }),
        ...(formData.preferred_date && { preferred_date: formData.preferred_date }),
        ...(formData.preferred_time_start && { preferred_time_start: formData.preferred_time_start }),
        ...(formData.preferred_time_end && { preferred_time_end: formData.preferred_time_end })
      });

      const response = await axios.get(`${API_BASE}/schedule-suggestions?${params}`, { 
        withCredentials: true 
      });
      
      // Store form data with suggestions for later use
      const suggestionsWithFormData = response.data.suggestions.map(slot => ({
        ...slot,
        formData: formData // Include the original form data
      }));
      
      setSuggestions(suggestionsWithFormData);
      history.push('/smart-prioritization/event-results');
    } catch (error) {
      console.error("Error getting event suggestions:", error);
      setError(error.response?.data?.detail || "Failed to get event scheduling suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSuggestions = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        task_duration: formData.duration,
        task_priority: formData.priority,
        task_urgency: formData.urgency || 'medium',
        ...(formData.preferred_date && { preferred_date: formData.preferred_date }),
        ...(formData.preferred_time_start && { preferred_time_start: formData.preferred_time_start }),
        ...(formData.preferred_time_end && { preferred_time_end: formData.preferred_time_end })
      });

      const response = await axios.get(`${API_BASE}/task-schedule-suggestions?${params}`, { 
        withCredentials: true 
      });
      
      // Store form data with suggestions for later use
      const suggestionsWithFormData = response.data.suggestions.map(slot => ({
        ...slot,
        formData: formData // Include the original form data
      }));
      
      setTaskSuggestions(suggestionsWithFormData);
      history.push('/smart-prioritization/task-results');
    } catch (error) {
      console.error("Error getting task suggestions:", error);
      setError(error.response?.data?.detail || "Failed to get task scheduling suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeConflicts = async (eventId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure eventId is valid
      if (!eventId || eventId === 'undefined') {
        throw new Error("Invalid event ID for conflict analysis");
      }
      
      const response = await axios.get(`${API_BASE}/conflict-analysis?event_id=${eventId}`, { 
        withCredentials: true 
      });
      
      setConflictAnalysis(response.data);
      history.push('/smart-prioritization/conflicts');
    } catch (error) {
      console.error("Error analyzing conflicts:", error);
      setError(error.response?.data?.detail || "Failed to analyze conflicts");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (preferences) => {
    try {
      await axios.post(`${API_BASE}/user-preferences`, preferences, { withCredentials: true });
      await fetchUserPreferences();
      setError(null);
      history.push('/smart-prioritization/events');
    } catch (error) {
      console.error("Error updating preferences:", error);
      setError(error.response?.data?.detail || "Failed to update preferences");
    }
  };

  // Add Event functionality
  const handleAddEvent = (slot) => {
    // Use form data from the slot if available, otherwise use defaults
    const formData = slot.formData || {};
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Format time for datetime-local input (combine date + time)
    const formatTimeForInput = (timeStr) => {
      if (!timeStr) return '';
      // timeStr is in format "HH:MM", combine with today's date
      return `${today}T${timeStr}`;
    };
    
    // Navigate to event management with pre-filled data
    const eventData = {
      title: `Event at ${slot.start_time}`,
      description: `Smart scheduled event for ${formData.duration || slot.duration_hours * 60} minutes`,
      start_time: formatTimeForInput(slot.start_time),
      end_time: formatTimeForInput(slot.end_time),
      duration: formData.duration || (slot.duration_hours * 60), // Use form duration or calculated
      category: formData.category || 'work', // Use form category
      priority: formData.priority || 'medium' // Use form priority
    };
    
    // Store in localStorage for event management to pick up
    localStorage.setItem('smartPrioritizationEvent', JSON.stringify(eventData));
    
    // Navigate to event management - FIXED ROUTE
    history.push('/events-management');
  };

  // Add Task functionality
  const handleAddTask = (slot) => {
    // Use form data from the slot if available, otherwise use defaults
    const formData = slot.formData || {};
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Format time for datetime-local input (combine date + suggested start time)
    const formatTimeForInput = (timeStr) => {
      if (!timeStr) return '';
      // timeStr is in format "HH:MM", combine with today's date
      return `${today}T${timeStr}`;
    };
    
    // Navigate to task management with pre-filled data
    const taskData = {
      title: `Task at ${slot.start_time}`,
      description: `Smart scheduled task for ${formData.duration || slot.duration_hours * 60} minutes`,
      due_date: formatTimeForInput(slot.start_time), // Use suggested start time as due date
      estimated_minutes: formData.duration || (slot.duration_hours * 60), // Use form duration
      priority: formData.priority || (slot.task_priority_bonus || 'medium'), // Use form priority
      urgency_score: formData.urgency === 'high' ? 9 : formData.urgency === 'medium' ? 6 : 3, // Use form urgency
      category: formData.category || 'work' // Use form category
    };
    
    // Store in localStorage for task management to pick up
    localStorage.setItem('smartPrioritizationTask', JSON.stringify(taskData));
    
    // Navigate to task management - FIXED ROUTE
    history.push('/tasks-management');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'events':
        return (
          <EventSuggestionForm 
            onSubmit={handleEventSuggestions}
            userPreferences={userPreferences}
            loading={loading}
          />
        );
      
      case 'tasks':
        return (
          <TaskSuggestionForm 
            onSubmit={handleTaskSuggestions}
            userPreferences={userPreferences}
            userTasks={userTasks}
            loading={loading}
          />
        );
      
      case 'event-results':
        return (
          <EventResults 
            suggestions={suggestions}
            onAnalyzeConflicts={handleAnalyzeConflicts}
            onBack={() => history.push('/smart-prioritization/events')}
            onAddEvent={handleAddEvent}
          />
        );
      
      case 'task-results':
        return (
          <TaskResults 
            suggestions={taskSuggestions}
            onAnalyzeConflicts={handleAnalyzeConflicts}
            onBack={() => history.push('/smart-prioritization/tasks')}
            onAddTask={handleAddTask}
          />
        );
      
      case 'preferences':
        return (
          <UserPreferencesForm 
            preferences={userPreferences}
            onSubmit={handleUpdatePreferences}
            onBack={() => history.push('/smart-prioritization/events')}
          />
        );
      
      case 'conflicts':
        return (
          <ConflictAnalysis 
            analysis={conflictAnalysis}
            onBack={() => {
              if (suggestions.length > 0) {
                history.push('/smart-prioritization/event-results');
              } else if (taskSuggestions.length > 0) {
                history.push('/smart-prioritization/task-results');
              } else {
                history.push('/smart-prioritization/events');
              }
            }}
            type={suggestions.length > 0 ? "event" : "task"}
          />
        );
      
      default:
        return (
          <EventSuggestionForm 
            onSubmit={handleEventSuggestions}
            userPreferences={userPreferences}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className="col-lg-12">
      <Card className="mt-4">
        <Card.Header className="">
          <h5 className="mb-0">🧠 Smart Prioritization & Scheduling</h5>
        </Card.Header>
        <Card.Body>
          {/* Error Display */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Analyzing your schedule...</p>
            </div>
          )}

          {/* Content */}
          {!loading && renderContent()}
        </Card.Body>
      </Card>
    </div>
  );
};

// Connect to Redux store
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.user !== null
});

export default connect(mapStateToProps)(SmartPrioritization);
