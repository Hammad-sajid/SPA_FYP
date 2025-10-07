import React, { useMemo } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { FaTasks, FaCheckCircle, FaClock, FaExclamationTriangle, FaArchive, FaBoxOpen } from "react-icons/fa";

const TaskStats = ({ tasks, viewMode, allTasks, expiredTasks, archivedTasks }) => {
  const stats = useMemo(() => {
    // Calculate stats based on the current view mode
    const currentViewStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      pending: tasks.filter((t) => !t.completed).length,
      overdue: tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date).getTime() < Date.now()).length,
    };

    // Calculate overall stats across all views
    const overallStats = {
      total: (allTasks || []).length,
      // Calculate active count as non-expired, non-archived tasks
      active: allTasks ? allTasks.filter(t => {
        if (t.archived) return false; // Exclude archived tasks
        if (!t.due_date) return true; // Tasks without due date are considered active
        return new Date(t.due_date).getTime() >= Date.now(); // Not expired
      }).length : 0,
      // Calculate expired count from allTasks instead of relying on expiredTasks array
      expired: allTasks ? allTasks.filter(t => t.due_date && new Date(t.due_date).getTime() < Date.now()).length : 0,
      archived: (archivedTasks || []).length,
    };

    return { currentViewStats, overallStats };
  }, [tasks, viewMode, allTasks, expiredTasks, archivedTasks]);

  // Show different stats based on view mode
  const getStatsToShow = () => {
    // Check if we have the data needed for accurate stats
    const hasCompleteData = allTasks && archivedTasks;
    
    switch (viewMode) {
      case 'active':
        return [
          {
            label: "Active Tasks",
            value: stats.currentViewStats.total,
            icon: <FaTasks />,
            cls: "bg-primary",
            description: "Current and pending tasks"
          },
          {
            label: "Completed",
            value: stats.currentViewStats.completed,
            icon: <FaCheckCircle />,
            cls: "bg-success",
            description: "Successfully completed tasks"
          },
          {
            label: "Pending",
            value: stats.currentViewStats.pending,
            icon: <FaClock />,
            cls: "bg-warning text-dark",
            description: "Tasks awaiting completion"
          },
          {
            label: "Overdue",
            value: stats.currentViewStats.overdue,
            icon: <FaExclamationTriangle />,
            cls: "bg-danger",
            description: "Tasks past due date"
          }
        ];
      case 'expired':
        return [
          {
            label: "Expired Tasks",
            value: stats.currentViewStats.total,
            icon: <FaExclamationTriangle />,
            cls: "bg-danger",
            description: "Tasks past due date"
          },
          {
            label: "Completed",
            value: stats.currentViewStats.completed,
            icon: <FaCheckCircle />,
            cls: "bg-success",
            description: "Completed expired tasks"
          },
          {
            label: "Pending",
            value: stats.currentViewStats.pending,
            icon: <FaClock />,
            cls: "bg-warning text-dark",
            description: "Pending expired tasks"
          },
          {
            label: "Total Expired",
            value: stats.overallStats.expired,
            icon: <FaExclamationTriangle />,
            cls: "bg-info",
            description: "All expired tasks"
          }
        ];
      case 'archived':
        return [
          {
            label: "Archived Tasks",
            value: stats.currentViewStats.total,
            icon: <FaArchive />,
            cls: "bg-secondary",
            description: "All archived tasks"
          },
          {
            label: "Completed",
            value: stats.currentViewStats.completed,
            icon: <FaCheckCircle />,
            cls: "bg-success",
            description: "Completed archived tasks"
          },
          {
            label: "Pending",
            value: stats.currentViewStats.pending,
            icon: <FaClock />,
            cls: "bg-warning text-dark",
            description: "Pending archived tasks"
          },
          {
            label: "Total Archived",
            value: stats.overallStats.archived,
            icon: <FaArchive />,
            cls: "bg-info",
            description: "All archived tasks"
          }
        ];
      case 'all':
        return [
          {
            label: "All Tasks",
            value: stats.currentViewStats.total,
            icon: <FaTasks />,
            cls: "bg-primary",
            description: "Total tasks in system"
          },
          {
            label: "Active",
            value: hasCompleteData ? stats.overallStats.active : "Loading...",
            icon: <FaCheckCircle />,
            cls: hasCompleteData ? "bg-success" : "bg-secondary",
            description: hasCompleteData ? "Active tasks" : "Loading data..."
          },
          {
            label: "Expired",
            value: hasCompleteData ? stats.overallStats.expired : "Loading...",
            icon: <FaExclamationTriangle />,
            cls: hasCompleteData ? "bg-danger" : "bg-secondary",
            description: hasCompleteData ? "Expired tasks" : "Loading data..."
          },
          {
            label: "Archived",
            value: hasCompleteData ? stats.overallStats.archived : "Loading...",
            icon: <FaArchive />,
            cls: hasCompleteData ? "bg-secondary" : "bg-secondary",
            description: hasCompleteData ? "Archived tasks" : "Loading data..."
          }
        ];
      default:
        return [
          {
            label: "Total",
            value: stats.currentViewStats.total,
            icon: <FaTasks />,
            cls: "bg-primary",
            description: "All tasks"
          },
          {
            label: "Completed",
            value: stats.currentViewStats.completed,
            icon: <FaCheckCircle />,
            cls: "bg-success",
            description: "Completed tasks"
          },
          {
            label: "Pending",
            value: stats.currentViewStats.pending,
            icon: <FaClock />,
            cls: "bg-warning text-dark",
            description: "Pending tasks"
          },
          {
            label: "Overdue",
            value: stats.currentViewStats.overdue,
            icon: <FaExclamationTriangle />,
            cls: "bg-danger",
            description: "Overdue tasks"
          }
        ];
    }
  };

  const statsToShow = getStatsToShow();

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        <FaTasks className="me-2" />
        {viewMode === 'active' ? 'Active Tasks Statistics' :
         viewMode === 'expired' ? 'Expired Tasks Statistics' :
         viewMode === 'archived' ? 'Archived Tasks Statistics' :
         viewMode === 'all' ? 'All Tasks Statistics' :
         'Task Statistics'}
      </h6>
      
      {/* Loading indicator when data is not yet available */}
      {viewMode === 'all' && (!allTasks || !archivedTasks) && (
        <div className="alert alert-info mb-3">
          <i className="fas fa-spinner fa-spin me-2"></i>
          Loading complete task data...
        </div>
      )}
      
      <Row className="g-3">
        {statsToShow.map((stat, index) => (
          <Col key={index} xs={6} md={statsToShow.length === 2 ? 6 : 3}>
            <Card className={`text-white ${stat.cls} h-100`}>
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 fw-bold">{stat.value}</h4>
                    <small className="opacity-75">{stat.label}</small>
                  </div>
                  <div className="fs-3 opacity-75">
                    {stat.icon}
                  </div>
                </div>
                <small className="opacity-75 d-block mt-2">{stat.description}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TaskStats;

