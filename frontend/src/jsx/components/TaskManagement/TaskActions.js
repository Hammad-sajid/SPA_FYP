import React from "react";
import { Dropdown, ButtonGroup } from "react-bootstrap";

const TaskActions = ({ 
  task, 
  onEdit, 
  onDelete, 
  onView, 
  onArchive, 
  onUnarchive, 
  onConvertToEvent,
  viewMode = 'active'
}) => {
  return (
    <div className="d-flex align-items-center gap-2">
      {(viewMode === 'active' || viewMode === 'all') && onEdit && (
        <button className="btn btn-primary btn-sm" onClick={onEdit} title="Edit">
          <i className="fas fa-pencil-alt"></i>
        </button>
      )}
      
      <button className="btn btn-info btn-sm" onClick={onView} title="View Details">
        <i className="fa fa-eye"></i>
      </button>
      
      {(viewMode === 'active' || viewMode === 'all') && onArchive && (
        <button className="btn btn-warning btn-sm" onClick={onArchive} title="Archive">
          <i className="fas fa-archive"></i>
        </button>
      )}
      
      {viewMode === 'archived' && onUnarchive && (
        <button className="btn btn-success btn-sm" onClick={onUnarchive} title="Restore">
          <i className="fas fa-undo"></i>
        </button>
      )}
      
      {(viewMode === 'active' || viewMode === 'all') && onConvertToEvent && !task.linked_event_id && (
        <button className="btn btn-success btn-sm" onClick={onConvertToEvent} title="Convert to Event">
          <i className="fas fa-calendar-plus"></i>
        </button>
      )}
      
      {(viewMode === 'active' || viewMode === 'all') && onDelete && (
        <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete">
          <i className="fa fa-trash"></i>
        </button>
      )}
      
      {task.linked_event_id && (
        <span className="badge badge-info" title="Linked to Calendar Event">
          <i className="fas fa-calendar-check"></i> Event
        </span>
      )}
    </div>
  );
};

export default TaskActions;

