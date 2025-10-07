import React, { useContext, useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import { Dropdown} from "react-bootstrap";
import { Card, Row, Col, Badge, ProgressBar, Button, Alert } from 'react-bootstrap';
import { FaTasks, FaCalendarAlt, FaEnvelope, FaUser, FaChartLine, FaBell, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

// Import Components
import { ThemeContext } from "../../../context/ThemeContext";
// images



const Home = () => {
	const { changeBackground } = useContext(ThemeContext);
	const [dropSelect, setDropSelect] = useState('This Month');
	
	// Dashboard data state
	const [dashboardStats, setDashboardStats] = useState({
		tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
		events: { total: 0, upcoming: 0, today: 0 },
		emails: { total: 0, unread: 0, important: 0 },
		health: { records: 0, reminders: 0, wellnessScore: 0 }
	});
	const [recentActivities, setRecentActivities] = useState([]);
	const [upcomingReminders, setUpcomingReminders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		changeBackground({ value: "light", label: "Light" });
		loadDashboardData();
	}, []);

	const loadDashboardData = async () => {
		try {
			setLoading(true);
			setError(null);

			// Use the same approach as Activity.js - simpler endpoints
			const [tasksRes, eventsRes, emailsRes] = await Promise.all([
				axios.get("http://localhost:8000/api/tasks/all", { withCredentials: true }),
				axios.get("http://localhost:8000/api/events/all", { withCredentials: true }),
				axios.get("http://localhost:8000/api/emails/list", { withCredentials: true })
			]);

			// Process tasks data
			const tasks = tasksRes.data || [];
			const taskStats = {
				total: tasks.length,
				completed: tasks.filter(t => t.completed).length,
				pending: tasks.filter(t => !t.completed && new Date(t.due_date) > new Date()).length,
				overdue: tasks.filter(t => !t.completed && new Date(t.due_date) < new Date()).length
			};

			// Process events data
			const events = eventsRes.data || [];
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const eventStats = {
				total: events.length,
				upcoming: events.filter(e => new Date(e.start_time) > now).length,
				today: events.filter(e => {
					const eventDate = new Date(e.start_time);
					return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
				}).length
			};

			// Process emails data - handle the structure like Activity.js
			const emails = emailsRes.data?.results || emailsRes.data || [];
			const emailStats = {
				total: emails.length,
				unread: emails.filter(e => e.labels && e.labels.includes('unread')).length,
				important: emails.filter(e => e.labels && e.labels.includes('important')).length
			};

			// Simple health stats
			const healthStats = {
				records: 0,
				reminders: 0,
				wellnessScore: 75 // Default wellness score
			};

			// Create simple activities from tasks and events
			const activities = [];
			tasks.slice(0, 5).forEach(task => {
				activities.push({
					id: task.id,
					type: 'task',
					title: task.title,
					description: task.description,
					created_at: task.created_at,
					updated_at: task.updated_at,
					action: 'created',
					user: 'You'
				});
			});

			events.slice(0, 5).forEach(event => {
				activities.push({
					id: event.id,
					type: 'event',
					title: event.title,
					description: event.description,
					created_at: event.created_at,
					updated_at: event.updated_at,
					action: 'created',
					user: 'You'
				});
			});

			// Sort activities by date
			activities.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

			// Get upcoming reminders (next 24 hours)
			const upcomingReminders = [];
			tasks.forEach(task => {
				if (task.due_date && !task.completed) {
					const dueDate = new Date(task.due_date);
					const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
					if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
						upcomingReminders.push({
							id: `task-${task.id}`,
							type: 'task',
							title: task.title,
							time: dueDate,
							description: `Due in ${Math.round(hoursUntilDue)} hours`
						});
					}
				}
			});

			events.forEach(event => {
				const startTime = new Date(event.start_time);
				const hoursUntilEvent = (startTime - now) / (1000 * 60 * 60);
				if (hoursUntilEvent <= 24 && hoursUntilEvent > 0) {
					upcomingReminders.push({
						id: `event-${event.id}`,
						type: 'event',
						title: event.title,
						time: startTime,
						description: `Starts in ${Math.round(hoursUntilEvent)} hours`
					});
				}
			});

			upcomingReminders.sort((a, b) => a.time - b.time);

			setDashboardStats({ tasks: taskStats, events: eventStats, emails: emailStats, health: healthStats });
			setRecentActivities(activities);
			setUpcomingReminders(upcomingReminders.slice(0, 5));

		} catch (error) {
			setError('Failed to load dashboard data. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const getTypeIcon = (type) => {
		switch (type) {
			case 'task': return <FaTasks className="text-primary" />;
			case 'event': return <FaCalendarAlt className="text-success" />;
			case 'email': return <FaEnvelope className="text-info" />;
			default: return <FaBell className="text-warning" />;
		}
	};

	const getPriorityColor = (priority) => {
		if (typeof priority === 'number') {
			return priority === 1 ? 'danger' : priority === 2 ? 'warning' : 'info';
		}
		return 'secondary';
	};

	if (loading) {
		return (
			<div className="text-center py-5">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
				<p className="mt-3">Loading your dashboard...</p>
			</div>
		);
	}

	return (
		<>
			{error && (
				<Alert variant="danger" dismissible onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			<div className="row">
				{/* Welcome Section */}
				<div className="col-12 mb-4">
					<div className="card bg-gradient-primary text-white">
						<div className="card-body">
							<div className="row align-items-center">
								<div className="col-md-8">
									<h2 className="mb-2">Welcome back! 👋</h2>
									<p className="mb-0 opacity-75">Here's what's happening with your smart personal assistant today.</p>
								</div>
								<div className="col-md-4 text-md-end">
									<FaUser size={48} className="opacity-50" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Stats Cards */}
				<div className="col-xl-3 col-md-6 mb-4">
					<Card className="border-0 shadow-sm h-100">
						<Card.Body>
							<div className="d-flex align-items-center">
								<div className="flex-shrink-0">
									<FaTasks className="text-primary" size={32} />
								</div>
								<div className="flex-grow-1 ms-3">
									<h6 className="text-muted mb-1">Total Tasks</h6>
									<h4 className="mb-0">{dashboardStats.tasks.total}</h4>
									<small className="text-success">
										{dashboardStats.tasks.completed} completed
									</small>
								</div>
							</div>
							{dashboardStats.tasks.overdue > 0 && (
								<Alert variant="danger" className="mt-2 py-1 small">
									<FaExclamationTriangle className="me-1" />
									{dashboardStats.tasks.overdue} overdue
								</Alert>
							)}
						</Card.Body>
					</Card>
				</div>

				<div className="col-xl-3 col-md-6 mb-4">
					<Card className="border-0 shadow-sm h-100">
						<Card.Body>
							<div className="d-flex align-items-center">
								<div className="flex-shrink-0">
									<FaCalendarAlt className="text-success" size={32} />
								</div>
								<div className="flex-grow-1 ms-3">
									<h6 className="text-muted mb-1">Events</h6>
									<h4 className="mb-0">{dashboardStats.events.total}</h4>
									<small className="text-info">
										{dashboardStats.events.upcoming} upcoming
									</small>
								</div>
							</div>
							{dashboardStats.events.today > 0 && (
								<Badge bg="info" className="mt-2">
									{dashboardStats.events.today} today
								</Badge>
							)}
						</Card.Body>
					</Card>
				</div>

				<div className="col-xl-3 col-md-6 mb-4">
					<Card className="border-0 shadow-sm h-100">
						<Card.Body>
							<div className="d-flex align-items-center">
								<div className="flex-shrink-0">
									<FaEnvelope className="text-info" size={32} />
								</div>
								<div className="flex-grow-1 ms-3">
									<h6 className="text-muted mb-1">Emails</h6>
									<h4 className="mb-0">{dashboardStats.emails.total}</h4>
									<small className="text-warning">
										{dashboardStats.emails.unread} unread
									</small>
								</div>
							</div>
							{dashboardStats.emails.important > 0 && (
								<Badge bg="danger" className="mt-2">
									{dashboardStats.emails.important} important
								</Badge>
							)}
						</Card.Body>
					</Card>
				</div>

				<div className="col-xl-3 col-md-6 mb-4">
					<Card className="border-0 shadow-sm h-100">
						<Card.Body>
							<div className="d-flex align-items-center">
								<div className="flex-shrink-0">
									<FaChartLine className="text-warning" size={32} />
								</div>
								<div className="flex-grow-1 ms-3">
									<h6 className="text-muted mb-1">Wellness Score</h6>
									<h4 className="mb-0">{dashboardStats.health.wellnessScore}%</h4>
									<ProgressBar 
										now={dashboardStats.health.wellnessScore} 
										variant={dashboardStats.health.wellnessScore > 80 ? 'success' : dashboardStats.health.wellnessScore > 60 ? 'warning' : 'danger'}
										className="mt-2"
									/>
								</div>
							</div>
						</Card.Body>
					</Card>
				</div>

				{/* Quick Access Cards */}
				<div className="col-xl-12 mb-4">
					<div className="row g-3">
						<div className="col-md-3">
							<Card className="shadow-sm h-100 border-0">
								<Card.Body className="text-center">
									<FaTasks className="text-primary mb-3" size={32} />
									<h6>Task Management</h6>
									<p className="text-muted small mb-3">Smart task prioritization and tracking</p>
									<Link to={'/tasks-management'} className="btn btn-primary btn-sm w-100">Open Tasks</Link>
								</Card.Body>
							</Card>
						</div>
						<div className="col-md-3">
							<Card className="shadow-sm h-100 border-0">
								<Card.Body className="text-center">
									<FaCalendarAlt className="text-success mb-3" size={32} />
									<h6>Calendar</h6>
									<p className="text-muted small mb-3">Events and Google Calendar sync</p>
									<Link to={'/events-management'} className="btn btn-success btn-sm w-100">Open Calendar</Link>
								</Card.Body>
							</Card>
						</div>
						<div className="col-md-3">
							<Card className="shadow-sm h-100 border-0">
								<Card.Body className="text-center">
									<FaEnvelope className="text-info mb-3" size={32} />
									<h6>Email Manager</h6>
									<p className="text-muted small mb-3">AI-powered email management</p>
									<Link to={'/email-manager'} className="btn btn-info btn-sm w-100">Open Inbox</Link>
								</Card.Body>
							</Card>
						</div>
						<div className="col-md-3">
							<Card className="shadow-sm h-100 border-0">
								<Card.Body className="text-center">
									<FaChartLine className="text-warning mb-3" size={32} />
									<h6>Health & Fitness</h6>
									<p className="text-muted small mb-3">Track wellness and get AI recommendations</p>
									<Link to={'/health-and-fitness'} className="btn btn-warning btn-sm w-100">Open Health</Link>
								</Card.Body>
							</Card>
						</div>
					</div>
				</div>

				{/* Upcoming Reminders */}
				<div className="col-xl-6 mb-4">
					<Card className="border-0 shadow-sm h-100">
						<Card.Header className="bg-transparent border-0">
							<div className="d-flex align-items-center">
								<FaBell className="text-warning me-2" />
								<h6 className="mb-0">Upcoming Reminders</h6>
								<Badge bg="warning" className="ms-auto">{upcomingReminders.length}</Badge>
							</div>
						</Card.Header>
						<Card.Body className="p-0">
							{upcomingReminders.length === 0 ? (
								<div className="text-center py-4 text-muted">
									<FaClock size={32} className="mb-2 opacity-50" />
									<p className="mb-0">No upcoming reminders</p>
								</div>
							) : (
								<div className="list-group list-group-flush">
									{upcomingReminders.map(reminder => (
										<div key={reminder.id} className="list-group-item border-0 py-3">
											<div className="d-flex align-items-center">
												{getTypeIcon(reminder.type)}
												<div className="flex-grow-1 ms-3">
													<h6 className="mb-1 small">{reminder.title}</h6>
													<small className="text-muted">{reminder.description}</small>
												</div>
												<small className="text-muted">
													{reminder.time.toLocaleTimeString([], { 
														hour: '2-digit', 
														minute: '2-digit' 
													})}
												</small>
											</div>
										</div>
									))}
								</div>
							)}
						</Card.Body>
					</Card>
				</div>

				{/* Recent Activities */}
				<div className="col-xl-6 mb-4">
					<Card className="border-0 shadow-sm h-100">
						<Card.Header className="bg-transparent border-0">
							<div className="d-flex align-items-center">
								<FaChartLine className="text-primary me-2" />
								<h6 className="mb-0">Recent Activities</h6>
								<Link to="/dashboard/activity" className="btn btn-sm btn-outline-primary ms-auto">View All</Link>
							</div>
						</Card.Header>
						<Card.Body className="p-0">
							{recentActivities.length === 0 ? (
								<div className="text-center py-4 text-muted">
									<FaCheckCircle size={32} className="mb-2 opacity-50" />
									<p className="mb-0">No recent activities</p>
								</div>
							) : (
								<div className="list-group list-group-flush">
									{recentActivities.slice(0, 5).map(activity => (
										<div key={activity.id} className="list-group-item border-0 py-3">
											<div className="d-flex align-items-center">
												{getTypeIcon(activity.type)}
												<div className="flex-grow-1 ms-3">
													<h6 className="mb-1 small">{activity.title}</h6>
													<small className="text-muted">
														{activity.action} • {new Date(activity.updated_at || activity.created_at).toLocaleDateString()}
													</small>
												</div>
												<Badge bg={getPriorityColor(activity.importance || 'secondary')} className="small">
													{activity.type}
												</Badge>
											</div>
										</div>
									))}
								</div>
							)}
						</Card.Body>
					</Card>
				</div>


			</div>
		</>
	);
};

export default Home;