import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { FaCalendarAlt, FaClock, FaExclamationTriangle, FaCheckCircle, FaArchive, FaBoxOpen } from "react-icons/fa";

const EventStats = ({ events, viewMode, allEvents, expiredEvents, archivedEvents, eventStats }) => {
  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const stats = {
      total: events.length,
      today: 0,
      upcoming: 0,
      overdue: 0,
      completed: 0
    };

    events.forEach(event => {
      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      
      // Check if event is today
      if (startTime >= today && startTime < tomorrow) {
        stats.today++;
      }
      
      // Check if event is upcoming (next 7 days)
      if (startTime >= today && startTime < nextWeek) {
        stats.upcoming++;
      }
      
      // Check if event is overdue (end time has passed)
      if (endTime < now) {
        stats.overdue++;
      }
      
      // For now, we'll consider events as "completed" if they're overdue
      // In a real app, you might have a separate completed status
      if (endTime < now) {
        stats.completed++;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // Get stats based on view mode
  const getStatsForView = () => {
    if (viewMode === 'active') {
      return [
        {
          label: "Active Events",
          value: eventStats.active || stats.total,
          icon: <FaCalendarAlt />,
          cls: "bg-primary",
          description: "Current and upcoming events"
        },
        {
          label: "Today",
          value: stats.today,
          icon: <FaClock />,
          cls: "bg-info",
          description: "Events scheduled today"
        },
        {
          label: "Upcoming",
          value: eventStats.upcoming || stats.upcoming,
          icon: <FaCalendarAlt />,
          cls: "bg-success",
          description: "Next 7 days"
        },
        {
          label: "Total Active",
          value: eventStats.active || stats.total,
          icon: <FaCheckCircle />,
          cls: "bg-primary",
          description: "All active events"
        }
      ];
    } else if (viewMode === 'expired') {
      return [
        {
          label: "Expired Events",
          value: eventStats.expired || stats.total,
          icon: <FaExclamationTriangle />,
          cls: "bg-warning",
          description: "Past due events"
        },
        {
          label: "Total Expired",
          value: eventStats.expired || stats.total,
          icon: <FaExclamationTriangle />,
          cls: "bg-warning",
          description: "All expired events"
        }
      ];
    } else if (viewMode === 'archived') {
      return [
        {
          label: "Archived Events",
          value: eventStats.archived || stats.total,
          icon: <FaArchive />,
          cls: "bg-secondary",
          description: "All archived events"
        },
        {
          label: "Total Archived",
          value: eventStats.archived || stats.total,
          icon: <FaArchive />,
          cls: "bg-secondary",
          description: "All archived events"
        }
      ];
    } else if (viewMode === 'all') {
      return [
        {
          label: "Total Events",
          value: eventStats.total || stats.total,
          icon: <FaCalendarAlt />,
          cls: "bg-primary",
          description: "All calendar events"
        },
        {
          label: "Active",
          value: eventStats.active || 0,
          icon: <FaCheckCircle />,
          cls: "bg-success",
          description: "Active events"
        },
        {
          label: "Expired",
          value: eventStats.expired || 0,
          icon: <FaExclamationTriangle />,
          cls: "bg-warning",
          description: "Expired events"
        },
        {
          label: "Archived",
          value: eventStats.archived || 0,
          icon: <FaArchive />,
          cls: "bg-secondary",
          description: "Archived events"
        }
      ];
    }
    
    // Default stats
    return [
      {
        label: "Total Events",
        value: stats.total,
        icon: <FaCalendarAlt />,
        cls: "bg-primary",
        description: "All calendar events"
      },
      {
        label: "Today",
        value: stats.today,
        icon: <FaClock />,
        cls: "bg-info",
        description: "Events scheduled today"
      },
      {
        label: "Upcoming",
        value: stats.upcoming,
        icon: <FaCalendarAlt />,
        cls: "bg-success",
        description: "Next 7 days"
      },
      {
        label: "Overdue",
        value: stats.overdue,
        icon: <FaExclamationTriangle />,
        cls: "bg-danger",
        description: "Past due events"
      }
    ];
  };

  const statCards = getStatsForView();

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        <FaCalendarAlt className="me-2" />
        {viewMode === 'active' ? 'Active Events Statistics' :
         viewMode === 'expired' ? 'Expired Events Statistics' :
         viewMode === 'archived' ? 'Archived Events Statistics' :
         viewMode === 'all' ? 'All Events Statistics' :
         'Event Statistics'}
      </h6>
      <Row className="g-3">
        {statCards.map((stat, index) => (
          <Col key={index} xs={6} md={statCards.length === 2 ? 6 : 3}>
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

export default EventStats; 