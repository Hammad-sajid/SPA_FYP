import React from 'react';
import { Table, Form, Row, Button, Card } from 'react-bootstrap';
import EventActions from './EventActions';

const EventList = ({
  // Data props
  events,
  viewMode,
  loading,
  
  // Search and filter props
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  dateRange,
  setDateRange,
  sortOrder,
  setSortOrder,
  
  // Pagination props
  currentPage,
  totalPages,
  totalEvents,
  eventsPerPage,
  handlePageChange,
  
  // Action props
  handleEdit,
  confirmDelete,
  onViewEvent,
  onChangeCategory,
  confirmArchive,
  handleUnarchiveEvent,
  
  // Helper functions
  getPaginatedEvents,
  formatDate,
  filterInputStyle,
  actionButtonStyle
}) => {
  return (
    <>
      {/* Search and Filter Section */}
      <div className="mb-3 mt-5">
        <Row className="g-2">
          <div className="col-md-3 col-sm-12">
            <Form.Label>Search</Form.Label>
            <div className="input-group">
              <Form.Control 
                placeholder="Search events" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={filterInputStyle}
              />
              {search && <Button variant="light" onClick={() => setSearch('')}>Clear</Button>}
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <Form.Label>Category</Form.Label>
            <Form.Select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={filterInputStyle}
            >
              <option value="all">All</option>
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="meeting">Meeting</option>
            </Form.Select>
          </div>
          <div className="col-md-3 col-sm-6">
            <Form.Label>From</Form.Label>
            <Form.Control 
              type="date" 
              value={dateRange.from} 
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="form-control"
              style={filterInputStyle}
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <Form.Label>To</Form.Label>
            <Form.Control 
              type="date" 
              value={dateRange.to} 
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="form-control"
              style={filterInputStyle}
            />
          </div>
        </Row>
      </div>

      {/* Order/Sorting Dropdown */}
      <div className="mb-3 d-flex justify-content-left">
        <div className="mt-2 d-none d-md-block col-md-2 col-sm-6">
          <Form.Label className="mb-0 text-muted">Order</Form.Label>
          <Form.Select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            style={filterInputStyle}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </Form.Select>
        </div>
      </div>

      {/* Events Table */}
      <div className="table-responsive">
        <Table className="table table-striped table-hover mb-0" style={{ minHeight: getPaginatedEvents().length > 0 ? 'auto' : '200px' }}>
          <thead className="table-light">
            <tr>
              <th className='w-25'>Title</th>
              <th className='w-25'>Start Time</th>
              <th className='w-25'>End Time</th>
              <th className='w-25'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedEvents().map((ev) => (
              <tr key={ev.id}>
                <td><strong>{ev.title}</strong></td>
                <td>{formatDate(ev.start_time)}</td>
                <td>{formatDate(ev.end_time)}</td>
                <td>
                  <EventActions
                    event={ev}
                    onEdit={viewMode === 'active' || viewMode === 'all' ? () => handleEdit(ev) : undefined}
                    onDelete={viewMode === 'active' || viewMode === 'all' ? () => confirmDelete(ev.id) : undefined}
                    onView={() => onViewEvent(ev)}
                    onChangeCategory={viewMode === 'active' || viewMode === 'all' ? onChangeCategory : undefined}
                    onArchive={viewMode === 'active' || viewMode === 'all' ? () => confirmArchive(ev) : undefined}
                    onUnarchive={viewMode === 'archived' ? () => handleUnarchiveEvent(ev.id) : undefined}
                    viewMode={viewMode}
                    buttonStyle={actionButtonStyle}
                  />
                </td>
              </tr>
            ))}
            {getPaginatedEvents().length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  {viewMode === 'active' ? 'No active events available' :
                   viewMode === 'all' ? 'No events available' :
                   viewMode === 'expired' ? 'No expired events available' :
                   'No archived events available'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!loading && getPaginatedEvents().length > 0 && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
          <div className="text-muted">
            Showing {((currentPage - 1) * eventsPerPage) + 1} to {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
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

export default EventList;
