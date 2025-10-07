import React, { useMemo, useState } from "react";
import { Table, Form, Row, Col, InputGroup, Button } from "react-bootstrap";
import TaskActions from "./TaskActions";

const PRIORITY_LABELS = {
  3: "High",
  2: "Medium",
  1: "Low",
};
//custom styles for filter input
const filterInputStyle = {
  height: '38px',  // Standard Bootstrap form control height
  minHeight: '38px'
};

const TaskList = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onViewTask,
  onToggleComplete,
  onArchiveTask,
  onUnarchiveTask,
  onConvertToEvent,
  viewMode = 'active',
  currentUser,
  // Pagination props
  currentPage,
  totalPages,
  totalTasks,
  tasksPerPage,
  handlePageChange
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortDir, setSortDir] = useState("asc");

  // Helper function to check task expiry status
  const getTaskExpiryStatus = (task) => {
    if (!task.due_date) return 'no-due-date';
    
    const now = new Date();
    const dueDate = new Date(task.due_date);
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    if (timeDiff < 0) return 'expired';
    if (hoursDiff <= 24) return 'due-soon';
    if (hoursDiff <= 72) return 'due-this-week';
    return 'normal';
  };

  // Helper function to get expiry status badge
  const getExpiryBadge = (task) => {
    const status = getTaskExpiryStatus(task);
    
    switch (status) {
      case 'expired':
        return <span className="badge bg-danger">Expired</span>;
      case 'due-soon':
        return <span className="badge bg-warning text-dark">Due Soon</span>;
      case 'due-this-week':
        return <span className="badge bg-info">This Week</span>;
      default:
        return null;
    }
  };

  // Helper function to check if current user can mark task as complete
  const canMarkComplete = (task) => {
    if (!currentUser) return false;
    
    // If task is assigned to someone else, only that person can mark it complete
    if (task.assigned_to && task.assigned_to !== currentUser.id) {
      return false;
    }
    
    // If task is not assigned to anyone, the creator can mark it complete
    if (!task.assigned_to) {
      return true;
    }
    
    // If task is assigned to current user, they can mark it complete
    return task.assigned_to === currentUser.id;
  };

  const filteredAndSorted = useMemo(() => {
    let result = tasks || [];

    // search by title/description
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((t) =>
        [t.title, t.description].some((f) => (f || "").toLowerCase().includes(query))
      );
    }

    // status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") result = result.filter((t) => !t.completed);
      if (statusFilter === "completed") result = result.filter((t) => !!t.completed);
      if (statusFilter === "in_progress") result = result.filter((t) => !t.completed); // placeholder
    }

    // priority filter
    if (priorityFilter !== "all") {
      const map = { high: 3, medium: 2, low: 1 };
      const val = map[priorityFilter];
      result = result.filter((t) => (t.importance || 1) === val);
    }

    // sorting
    result = [...result].sort((a, b) => {
      let av;
      let bv;
      if (sortBy === "due_date") {
        av = a.due_date ? new Date(a.due_date).getTime() : 0;
        bv = b.due_date ? new Date(b.due_date).getTime() : 0;
      } else if (sortBy === "priority") {
        av = a.importance || 1;
        bv = b.importance || 1;
      } else {
        av = (a.title || "").localeCompare ? a.title : String(a.title || "");
        bv = (b.title || "").localeCompare ? b.title : String(b.title || "");
      }
      const diff = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortBy, sortDir]);

  return (
    <>
      <Form className="mb-3">
        <Row className="g-2 align-items-end">
          <Col md={3} sm={12}>
            <Form.Label>Search</Form.Label>
            <InputGroup>
              <Form.Control
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={filterInputStyle}
              />
              {search && (
                <Button variant="light" onClick={() => setSearch("")}>Clear</Button>
              )}
            </InputGroup>
          </Col>
          <Col md={3} sm={6}>
            <Form.Label>Status</Form.Label>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterInputStyle}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </Col>
          <Col md={3} sm={6}>
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={filterInputStyle}
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Form.Select>
          </Col>
          <Col md={3} sm={6}>
            <Form.Label>Sort By</Form.Label>
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={filterInputStyle}>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </Form.Select>
          </Col>
          <Col md={2} sm={6} className="mt-2 d-none d-md-block">
            <Form.Label>Order</Form.Label>
            <Form.Select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </Form.Select>
          </Col>
        </Row>
      </Form>

      <div className="table-responsive">
        <Table className="table table-striped table-hover mb-0">
          <thead className="table-light">
            <tr>
              {viewMode !== 'expired' && <th className=''>Mark</th>}
              <th className='w-20'>Title</th>
              <th className='w-20'>Due</th>
              <th className='w-10'>Priority</th>
              <th className='w-15'>Assigned To</th>
              <th className='w-10'>Status</th>
              <th className='w-25'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((task) => (
              <tr key={task.id}>
                {viewMode !== 'expired' && (
                  <td>
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="checkbox"
                        checked={!!task.completed}
                        onChange={() => onToggleComplete(task)}
                        disabled={!canMarkComplete(task)}
                        title={
                          !canMarkComplete(task) 
                            ? "Only the assigned user can mark this task complete" 
                            : task.completed 
                              ? "Mark as pending" 
                              : "Mark as complete"
                        }
                      />
                      {!canMarkComplete(task) && task.assigned_to && (
                        <span className=" ms-2 fw-bold" >
                          <i className="bi bi-slash-circle me-1  text-warning "></i>
                        </span>
                      )}
                    </div>
                  </td>
                )}
                <td>
                  <Button variant="link" className="p-0" onClick={() => onViewTask(task)}>
                    <strong>{task.title}</strong>
                  </Button>
                </td>
                <td>
                  <div>
                    {task.due_date ? new Date(task.due_date).toLocaleString() : "—"}
                    {viewMode === 'active' && getExpiryBadge(task)}
                  </div>
                </td>
                <td>
                   <span
                    className={`badge ${
                      (task.importance || 1) === 3
                        ? "bg-danger"
                        : (task.importance || 1) === 2
                        ? "bg-warning text-dark"
                        : "bg-success"
                    }`}
                  >
                    {PRIORITY_LABELS[task.importance || 1]}
                  </span> 
                </td>
                
                <td>
                  {task.assigned_to_username ? (
                    <span className="badge bg-info">{task.assigned_to_username}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>{task.completed ? "✅ Done" : "⌛ Pending"}</td>
                <td>
                  <TaskActions
                    task={task}
                    onEdit={onEditTask ? () => onEditTask(task) : undefined}
                    onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
                    onView={() => onViewTask(task)}
                    onArchive={onArchiveTask ? () => onArchiveTask(task) : undefined}
                    onUnarchive={onUnarchiveTask ? () => onUnarchiveTask(task) : undefined}
                    onConvertToEvent={onConvertToEvent ? () => onConvertToEvent(task) : undefined}
                    viewMode={viewMode}
                  />
                </td>
              </tr>
            ))}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={viewMode === 'expired' ? 8 : 9} className="text-center text-muted py-4">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
          <div className="text-muted">
            Showing {((currentPage - 1) * tasksPerPage) + 1} to {Math.min(currentPage * tasksPerPage, totalTasks)} of {totalTasks} tasks
          </div>
          
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
        </div>
      )}
    </>
  );
};

export default TaskList;

