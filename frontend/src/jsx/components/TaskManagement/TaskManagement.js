import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Card, Button, Col, Modal } from 'react-bootstrap';
import axios from 'axios';
import { FaTasks } from 'react-icons/fa';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import TaskDetailPopup from './TaskDetailPopup';
import TaskStats from './TaskStats';
import ReminderToasts from '../shared/ReminderToasts';
import VoiceCommand from '../VoiceCommand/VoiceCommand';

const API_BASE = "http://localhost:8000/api/tasks";
const API_URL = {
  list: `${API_BASE}/get-tasks`,
  create: `${API_BASE}/create`,
  update: (id) => `${API_BASE}/update/${id}`,
  delete: (id) => `${API_BASE}/delete/${id}`,
  get: (id) => `${API_BASE}/get/${id}`,
  users: `${API_BASE}/users`,
};

const TaskManagement = ({ isAuthenticated, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    importance: 2,
    assigned_to: null,  // Use null instead of empty string
    category: '',
    tags: '',
    estimated_minutes: null,  // Use null instead of empty string
    urgency_score: null,  // Use null instead of empty string
    position: 0,
  });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [users, setUsers] = useState([]); // For assignment dropdown
  const [loading, setLoading] = useState(true); // Add loading state
  
  // New state variables for enhanced features
  const [viewMode, setViewMode] = useState('active'); // 'active', 'archived', 'expired', 'all'
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [expiredTasks, setExpiredTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [taskToArchive, setTaskToArchive] = useState(null);
  const [showConvertToEventModal, setShowConvertToEventModal] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState(null);
  const [expiryNotification, setExpiryNotification] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);

  // Toast reminder state
  const [toastReminders, setToastReminders] = useState([]);
  const [reminderTimers, setReminderTimers] = useState([]);

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






  useEffect(() => {
    // Fetch all data upfront so TaskStats has complete information
    fetchTasks();
    fetchExpiredTasks();
    fetchAllTasks();
    fetchArchivedTasks();
    fetchUsers(); // Fetch users for assignment dropdown
    
    // Set loading to false after a short delay to allow auth state to settle
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check for Smart Prioritization data in localStorage
  useEffect(() => {
    const smartTaskData = localStorage.getItem('smartPrioritizationTask');
    if (smartTaskData) {
      try {
        const taskData = JSON.parse(smartTaskData);
        
        // Pre-fill the form with Smart Prioritization data
        setForm({
          title: taskData.title || '',
          description: taskData.description || '',
          due_date: taskData.due_date || '',
          importance: taskData.priority === 'high' ? 3 : taskData.priority === 'medium' ? 2 : 1,
          assigned_to: null,
          category: taskData.category || '',
          tags: '',
          estimated_minutes: taskData.estimated_minutes || null,
          urgency_score: taskData.urgency_score || null,
          position: 0,
        });
        
        // Open the modal automatically
        setEditingId(null); // Ensure we're in create mode
        setShowModal(true);
        
        // Clear the localStorage data after using it
        localStorage.removeItem('smartPrioritizationTask');
        
        // Show a success message or notification
        console.log('Smart Prioritization task data loaded:', taskData);
        
        // Show success notification
        setExpiryNotification({
          type: 'success',
          message: `✅ Smart Prioritization task data loaded! Form is ready with suggested time: ${taskData.title}, Category: ${taskData.category}, Priority: ${taskData.priority}, Duration: ${taskData.estimated_minutes} min`
        });
        
        // Auto-clear notification after 5 seconds
        setTimeout(() => setExpiryNotification(null), 5000);
      } catch (error) {
        console.error('Error parsing Smart Prioritization task data:', error);
        localStorage.removeItem('smartPrioritizationTask');
      }
    }
  }, []);

  useEffect(() => {
    // Fetch different task types based on view mode
    if (viewMode === 'active') {
      fetchTasks();
    } else if (viewMode === 'archived') {
      fetchArchivedTasks();
    } else if (viewMode === 'expired') {
      fetchExpiredTasks();
    } else if (viewMode === 'all') {
      fetchAllTasks();
    }
  }, [viewMode]);



  // Check for expired tasks and show notifications
  useEffect(() => {
    if (viewMode === 'active') {
      // Since the backend now properly filters out expired tasks from active view,
      // we need to fetch expired tasks separately to check if there are any
      const checkForExpiredTasks = async () => {
        try {
          const response = await axios.get(`${API_BASE}/expired`, { withCredentials: true });
          const expiredTasks = response.data;
          
          if (expiredTasks.length > 0) {
            setExpiryNotification({
              type: 'warning',
              message: `You have ${expiredTasks.length} expired task${expiredTasks.length > 1 ? 's' : ''}. Check the Expired tab to review them.`,
              tasks: expiredTasks
            });
            
            // Auto-dismiss the warning after 5 seconds
            const timer = setTimeout(() => {
              setExpiryNotification(null);
            }, 5000);
            
            // Cleanup timer on unmount or when dependencies change
            return () => clearTimeout(timer);
          } else {
            setExpiryNotification(null);
          }
        } catch (error) {
          console.error("Error checking for expired tasks:", error);
        }
      };
      
      checkForExpiredTasks();
    }
  }, [viewMode]);

  useEffect(() => {
    // Due reminder functionality for active tasks only
    if (viewMode === 'active' && tasks.length > 0) {
      // Since the backend now properly filters out expired tasks, 
      // all tasks in the active view are valid for reminders
      const timers = tasks.map(task => {
        if (!task.due_date) return null;
        
        const due = new Date(task.due_date).getTime();
        const now = Date.now();
        const triggerTime = due - 10 * 60 * 1000; // 10 minutes before due
        const delay = triggerTime - now;

        if (delay > 0) {
          return setTimeout(() => {
            pushReminderToast(task, due);
          }, delay);
        }

        return null;
      });

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [tasks, viewMode]);

  // Periodic check for due tasks (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForDueTasks();
    }, 60 * 1000); // Check every minute
    
    return () => clearInterval(interval);
  }, [viewMode, tasks, allTasks, expiredTasks, archivedTasks]);

  // Authentication Guard - Redirect unauthorized users
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // Clear expiry notification when switching tabs
    setExpiryNotification(null);
    // Reset pagination when switching tabs
    resetPagination();
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL.list, { withCredentials: true });
      setTasks(response.data);
      // Clear expiry notification when tasks are refreshed
      setExpiryNotification(null);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchArchivedTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/archived`, { withCredentials: true });
      setArchivedTasks(response.data);
    } catch (error) {
      console.error("Error fetching archived tasks:", error);
    }
  };

  const fetchExpiredTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/expired`, { withCredentials: true });
      setExpiredTasks(response.data);
    } catch (error) {
      console.error("Error fetching expired tasks:", error);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/all`, { withCredentials: true });
      setAllTasks(response.data);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(API_URL.users, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const validate = () => {
    const v = {};
    if (!form.title.trim()) v.title = 'Title is required';
    if (!form.description.trim()) v.description = 'Description is required';
    if (!form.due_date) v.due_date = 'Due date is required';
    
    // Check if selected date is in the past
    if (form.due_date) {
      const selectedDate = new Date(form.due_date);
      const currentDate = new Date();
      if (selectedDate < currentDate) {
        v.due_date = 'Cannot select a date in the past';
      }
    }
    
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called with form:', form); // Debug log
    if (!validate()) return;
    try {
      if (editingId) {
        console.log('Updating task:', editingId); // Debug log
        await axios.put(API_URL.update(editingId), form, { withCredentials: true });
        setEditingId(null);
      } else {
        console.log('Creating new task'); // Debug log
        await axios.post(API_URL.create, form, { withCredentials: true });
      }
      setForm({ title: '', description: '', due_date: '', importance: 2, assigned_to: null, category: '', tags: '', estimated_minutes: null, urgency_score: null, position: 0 });
      fetchTasks();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving task:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        // Show error message to user
        alert(`Error: ${error.response.data.detail || 'Failed to save task'}`);
      } else {
        alert('Error: Failed to save task. Please try again.');
      }
    }
  };

  // Handle form field changes with real-time validation
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Real-time date validation
    if (name === 'due_date' && value) {
      const selectedDate = new Date(value);
      const currentDate = new Date();
      if (selectedDate < currentDate) {
        setErrors({ ...errors, due_date: 'Cannot select a date in the past' });
      }
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date ? task.due_date.slice(0, 16) : '',
      importance: task.importance ?? 2,
      assigned_to: task.assigned_to_username || null,  // Use null instead of empty string
      category: task.category || '',
      tags: task.tags || '',
      estimated_minutes: task.estimated_minutes || null,  // Use null for numeric fields
      urgency_score: task.urgency_score || null,  // Use null for numeric fields
      position: task.position || 0,
    });
    setEditingId(task.id);
    setShowModal(true);
    // Close the detail popup when editing
    setShowDetail(false);
  };

  const confirmDelete = (id) => {
    setTaskToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(API_URL.delete(taskToDelete), { withCredentials: true });
      setShowDeleteModal(false);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Pagination functions
  const getCurrentTasks = () => {
    let currentTasks = [];
    if (viewMode === 'active') {
      currentTasks = tasks;
    } else if (viewMode === 'all') {
      currentTasks = allTasks;
    } else if (viewMode === 'expired') {
      currentTasks = expiredTasks;
    } else if (viewMode === 'archived') {
      currentTasks = archivedTasks;
    }
    return currentTasks;
  };

  const getPaginatedTasks = () => {
    const currentTasks = getCurrentTasks();
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return currentTasks.slice(indexOfFirstTask, indexOfLastTask);
  };

  const getTotalPages = () => {
    const currentTasks = getCurrentTasks();
    return Math.ceil(currentTasks.length / tasksPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ title: '', description: '', due_date: '', importance: 2, assigned_to: null, category: '', tags: '', estimated_minutes: null, urgency_score: null, position: 0 });
    setErrors({});
    // Close the detail popup when form is closed
    setShowDetail(false);
  };

  const handleAddTask = () => {
    console.log('handleAddTask called'); // Debug log
    // Set default due date to 1 hour from now
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    const hours = String(defaultDate.getHours()).padStart(2, '0');
    const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setForm({ ...form, due_date: defaultDateTime });
    setShowModal(true);
    console.log('showModal set to true, form:', form); // Debug log
  };

  const onToggleComplete = async (task) => {
    try {
      // Optimistically update local state for immediate UI feedback
      const updatedTask = { ...task, completed: !task.completed };
      
      // Update local state immediately
      if (viewMode === 'active') {
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? updatedTask : t)
        );
      } else if (viewMode === 'all') {
        setAllTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? updatedTask : t)
        );
      }
      
      // Make API call
      await axios.put(API_URL.update(task.id), updatedTask, { withCredentials: true });
      
      // Refresh from server to ensure consistency
      fetchTasks();
    } catch (e) {
      console.error('Error toggling complete', e);
      // Revert local state on error
      if (viewMode === 'active') {
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? task : t)
        );
      } else if (viewMode === 'all') {
        setAllTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? task : t)
        );
      }
    }
  };

  const onChangePriority = async (task, level) => {
    try {
      // Optimistically update local state for immediate UI feedback
      const updatedTask = { ...task, importance: level };
      
      // Update local state immediately
      if (viewMode === 'active') {
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? updatedTask : t)
        );
      } else if (viewMode === 'all') {
        setAllTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? updatedTask : t)
        );
      }
      
      // Make API call
      await axios.put(API_URL.update(task.id), updatedTask, { withCredentials: true });
      
      // Refresh from server to ensure consistency
      fetchTasks();
    } catch (e) {
      console.error('Error changing priority', e);
      // Revert local state on error
      if (viewMode === 'active') {
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? task : t)
        );
      } else if (viewMode === 'all') {
        setAllTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? task : t)
        );
      }
    }
  };

  const onViewTask = (task) => {
    console.log('onViewTask called with task:', task); // Debug log
    setDetailTask(task);
    setShowDetail(true);
    console.log('showDetail set to true, detailTask:', task); // Debug log
  };

  const handleArchiveTask = async (task) => {
    try {
      await axios.post(`${API_BASE}/${task.id}/archive`, {}, { withCredentials: true });
      fetchTasks();
      fetchArchivedTasks();
      setShowArchiveModal(false);
      setTaskToArchive(null);
    } catch (error) {
      console.error("Error archiving task:", error);
    }
  };

  const handleUnarchiveTask = async (task) => {
    try {
      await axios.post(`${API_BASE}/${task.id}/unarchive`, {}, { withCredentials: true });
      fetchTasks();
      fetchArchivedTasks();
    } catch (error) {
      console.error("Error unarchiving task:", error);
    }
  };

  const handleConvertToEvent = async (task) => {
    try {
      const response = await axios.post(`${API_BASE}/${task.id}/convert-to-event`, {}, { withCredentials: true });
      alert(`Task converted to calendar event: ${response.data.event_title}`);
      fetchTasks();
      setShowConvertToEventModal(false);
      setTaskToConvert(null);
    } catch (error) {
      console.error("Error converting task to event:", error);
      alert("Failed to convert task to event. Please try again.");
    }
  };

  const confirmArchive = (task) => {
    setTaskToArchive(task);
    setShowArchiveModal(true);
  };

  const confirmConvertToEvent = (task) => {
    setTaskToConvert(task);
    setShowConvertToEventModal(true);
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

  // Reminder functions
  const pushReminderToast = (task, dueTime) => {
    const reminder = {
      id: `task-${task.id}-${Date.now()}`,
      title: task.title,
      description: task.description,
      dueTime: dueTime,
      priority: task.importance === 1 ? 'high' : task.importance === 2 ? 'medium' : 'low',
      type: 'task'
    };
    
    setToastReminders(prev => [...prev, reminder]);
  };

  const closeToast = (reminderId) => {
    setToastReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const handleSnooze = (reminderId, minutes) => {
    const reminder = toastReminders.find(r => r.id === reminderId);
    if (reminder) {
      // Remove current reminder
      closeToast(reminderId);
      
      // Schedule new reminder after snooze time
      const snoozeTime = Date.now() + (minutes * 60 * 1000);
      setTimeout(() => {
        pushReminderToast(reminder, snoozeTime);
      }, minutes * 60 * 1000);
    }
  };

  const checkForDueTasks = () => {
    const now = new Date();
    const activeTasks = viewMode === 'active' ? tasks : 
                       viewMode === 'all' ? allTasks : 
                       viewMode === 'expired' ? expiredTasks : 
                       archivedTasks;
    
    activeTasks.forEach(task => {
      if (task.due_date && !task.completed) {
        const dueDate = new Date(task.due_date);
        const timeDiff = dueDate.getTime() - now.getTime();
        const minutesUntilDue = Math.floor(timeDiff / (1000 * 60));
        
        // Show reminder 10 minutes before due time
        if (minutesUntilDue > 0 && minutesUntilDue <= 10) {
          pushReminderToast(task, dueDate);
        }
      }
    });
  };

  return (
    <Col lg={12}>
      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
         <div className="d-flex align-items-center">
           <FaTasks className="fa-1x text-primary me-3" />
           <h5 className="mb-0"> Task Management</h5>
          </div>
          <div className="d-flex gap-2">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('active')}
              >
                Active Tasks
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('all')}
              >
                All Tasks
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
              <Button onClick={handleAddTask} variant="primary">
                Add Task
              </Button>
            )}
            <VoiceCommand 
              module="tasks" 
              onSuccess={(data) => {
                // Refresh tasks after voice command success
                fetchTasks();
                fetchAllTasks();
              }}
              buttonVariant="outline-info"
              buttonSize="sm"
              buttonText="🗣️ Voice"
            />
          </div>
        </Card.Header>

        <Card.Body>
          <div className="mb-4">
            <TaskStats 
              tasks={viewMode === 'active' ? tasks : viewMode === 'all' ? allTasks : viewMode === 'expired' ? expiredTasks : archivedTasks}
              viewMode={viewMode}
              allTasks={allTasks}
              expiredTasks={expiredTasks}
              archivedTasks={archivedTasks}
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
          
          <TaskList
            tasks={getPaginatedTasks()}
            onEditTask={viewMode === 'active' || viewMode === 'all' ? handleEdit : undefined}
            onDeleteTask={viewMode === 'active' || viewMode === 'all' ? (id) => confirmDelete(id) : undefined}
            onViewTask={onViewTask}
            onToggleComplete={viewMode === 'active' || viewMode === 'all' ? onToggleComplete : undefined}
            onChangePriority={viewMode === 'active' || viewMode === 'all' ? onChangePriority : undefined}
            onArchiveTask={viewMode === 'active' || viewMode === 'all' ? confirmArchive : undefined}
            onUnarchiveTask={viewMode === 'archived' ? handleUnarchiveTask : undefined}
            onConvertToEvent={viewMode === 'active' || viewMode === 'all' ? confirmConvertToEvent : undefined}
            viewMode={viewMode}
            buttonStyle={actionButtonStyle}
            currentUser={currentUser}
            // Pagination props
            currentPage={currentPage}
            totalPages={getTotalPages()}
            totalTasks={getCurrentTasks().length}
            tasksPerPage={tasksPerPage}
            handlePageChange={handlePageChange}
          />
          

        </Card.Body>
      </Card>

      {/* Task Form Modal */}
      {console.log('Rendering TaskForm with showModal:', showModal)} {/* Debug log */}
      <TaskForm
        show={showModal}
        isEditing={!!editingId}
        form={form}
        errors={errors}
        onChange={handleFormChange}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        minDateTime={getCurrentDateTime()}
        users={users}
      />

      {/* Task Detail Popup */}
      {console.log('Rendering TaskDetailPopup with showDetail:', showDetail, 'detailTask:', detailTask)} {/* Debug log */}
      <TaskDetailPopup
        show={showDetail}
        task={detailTask}
        onClose={() => setShowDetail(false)}
        onEdit={() => {
          if (detailTask) handleEdit(detailTask);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this task? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal show={showArchiveModal} onHide={() => setShowArchiveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Archive</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to archive this task? Archived tasks are moved to the Archived tab.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={() => handleArchiveTask(taskToArchive)}>
            Archive
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Convert to Event Confirmation Modal */}
      <Modal show={showConvertToEventModal} onHide={() => setShowConvertToEventModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Convert to Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to convert this task to a calendar event? This will create a new event in your calendar.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConvertToEventModal(false)}>
            Cancel
          </Button>
          <Button variant="info" onClick={() => handleConvertToEvent(taskToConvert)}>
            Convert
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Reminders */}
      <ReminderToasts
        reminders={toastReminders}
        onClose={closeToast}
        onSnooze={handleSnooze}
        type="task"
      />
    </Col>
  );
};

// Connect to Redux store
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.user !== null,
  currentUser: state.auth.user
});

export default connect(mapStateToProps)(TaskManagement);