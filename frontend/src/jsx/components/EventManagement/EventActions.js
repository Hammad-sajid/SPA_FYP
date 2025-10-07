import React from "react";

const EventActions = ({ event, onEdit, onDelete, onView,  onArchive, onUnarchive }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'primary';
      case 'personal': return 'success';
      case 'meeting': return 'warning';
      default: return 'secondary';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'work': return 'Work';
      case 'personal': return 'Personal';
      case 'meeting': return 'Meeting';
      default: return 'General';
    }
  };

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Edit button - only show for active and all views */}
      {onEdit && (
        <button className="btn btn-primary btn-sm" onClick={onEdit} title="Edit">
          <i className="fas fa-pencil-alt"></i>
        </button>
      )}
      
      {/* View button - always show */}
      <button className="btn btn-info btn-sm" onClick={onView} title="View Details">
        <i className="fa fa-eye"></i>
      </button>
      
      {/* Delete button - only show for active and all views */}
      {onDelete && (
        <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete">
          <i className="fa fa-trash"></i>
        </button>
      )}
      
      {/* Archive button - only show for active and all views */}
      {onArchive && (
        <button className="btn btn-warning btn-sm" onClick={onArchive} title="Archive Event">
          <i className="fas fa-archive"></i>
        </button>
      )}
      
      {/* Unarchive button - only show for archived view */}
      {onUnarchive && (
        <button className="btn btn-success btn-sm" onClick={onUnarchive} title="Unarchive Event">
          <i className="fas fa-box-open"></i>
        </button>
      )}
    </div>
  );
};

export default EventActions; 