import React,{useState, useEffect} from "react";
import { Dropdown } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Link } from "react-router-dom";
import axios from "axios";

import LogoutPage from './Logout';

import United from "../../../images/United.png";
import profile from "../../../images/profile/pic1.jpg";



const Header = ({ onNote }) => {
	const [rightSelect, setRightSelect] = useState('Eng');
	//For fix header
	const [headerFix, setheaderFix] = useState(false);
	
	// Reminders state
	const [showRemindersModal, setShowRemindersModal] = useState(false);
	const [reminders, setReminders] = useState([]);
	const [remindersLoading, setRemindersLoading] = useState(false);

	useEffect(() => {
		window.addEventListener("scroll", () => {
			setheaderFix(window.scrollY > 50);
		});
	}, []); 

	// Load reminders function
	const loadReminders = async () => {
		try {
			setRemindersLoading(true);
			const [tasksRes, eventsRes, healthRes] = await Promise.all([
				axios.get("http://localhost:8000/api/tasks/all", { withCredentials: true }),
				axios.get("http://localhost:8000/api/events/all", { withCredentials: true }),
				axios.get("http://localhost:8000/api/health/reminders/1", { withCredentials: true })
			]);
			
			const allReminders = [];
			
			// Process task reminders (due within 24 hours)
			if (tasksRes.data) {
				tasksRes.data.forEach(task => {
					if (task.due_date && !task.completed) {
						const dueDate = new Date(task.due_date);
						const now = new Date();
						const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
						
						if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
							allReminders.push({
								id: `task-${task.id}`,
								type: 'task',
								title: task.title,
								time: dueDate,
								priority: task.importance,
								description: `Due in ${Math.round(hoursUntilDue)} hours`
							});
						}
					}
				});
			}
			
			// Process event reminders (within 24 hours)
			if (eventsRes.data) {
				eventsRes.data.forEach(event => {
					const startTime = new Date(event.start_time);
					const now = new Date();
					const hoursUntilEvent = (startTime - now) / (1000 * 60 * 60);
					
					if (hoursUntilEvent <= 24 && hoursUntilEvent > 0) {
						allReminders.push({
							id: `event-${event.id}`,
							type: 'event',
							title: event.title,
							time: startTime,
							priority: 'medium',
							description: `Starts in ${Math.round(hoursUntilEvent)} hours`
						});
					}
				});
			}
			
			// Process health reminders
			if (healthRes.data) {
				healthRes.data.forEach(reminder => {
					if (reminder.active) {
						const reminderTime = new Date(`${reminder.reminder_date}T${reminder.time}`);
						const now = new Date();
						const hoursUntilReminder = (reminderTime - now) / (1000 * 60 * 60);
						
						if (hoursUntilReminder <= 24 && hoursUntilReminder > 0) {
							allReminders.push({
								id: `health-${reminder.id}`,
								type: 'health',
								title: reminder.title,
								time: reminderTime,
								priority: reminder.type,
								description: `${reminder.type} reminder`
							});
						}
					}
				});
			}
			
			// Sort by time (closest first)
			allReminders.sort((a, b) => a.time - b.time);
			setReminders(allReminders.slice(0, 5)); // Show top 5
			
		} catch (error) {
			console.error('Error loading reminders:', error);
		} finally {
			setRemindersLoading(false);
		}
	};

	// Get type icon function
	const getTypeIcon = (type) => {
		switch (type) {
			case 'task': return '📋';
			case 'event': return '📅';
			case 'health': return '🏥';
			default: return '🔔';
		}
	};

	// Load reminders when component mounts
	useEffect(() => {
		loadReminders();
		// Refresh every 5 minutes
		const interval = setInterval(loadReminders, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

  //const [searchBut, setSearchBut] = useState(false);	
  var path = window.location.pathname.split("/");
  var name = path[path.length - 1].split("-");
  var filterName = name.length >= 3 ? name.filter((n, i) => i > 0) : name;
  var finalName = filterName.includes("app")
    ? filterName.filter((f) => f !== "app")
    : filterName.includes("ui")
    ? filterName.filter((f) => f !== "ui")
    : filterName.includes("uc")
    ? filterName.filter((f) => f !== "uc")
    : filterName.includes("basic")
    ? filterName.filter((f) => f !== "basic")
    : filterName.includes("jquery")
    ? filterName.filter((f) => f !== "jquery")
    : filterName.includes("table")
    ? filterName.filter((f) => f !== "table")
    : filterName.includes("page")
    ? filterName.filter((f) => f !== "page")
    : filterName.includes("email")
    ? filterName.filter((f) => f !== "email")
    : filterName.includes("ecom")
    ? filterName.filter((f) => f !== "ecom")
    : filterName.includes("chart")
    ? filterName.filter((f) => f !== "chart")
    : filterName.includes("editor")
    ? filterName.filter((f) => f !== "editor")
    : filterName;
  return ( 
    <div className={`header ${headerFix ? "is-fixed" : ""}`}>
      <div className="header-content">
        <nav className="navbar navbar-expand">
          <div className="collapse navbar-collapse justify-content-between">
            <div className="header-left">
				<div
					className="dashboard_bar"
					style={{ textTransform: "capitalize" }}
				  >
					{finalName.join(" ").length === 0
					  ? "Dashboard"
					  : finalName.join(" ") === "dashboard dark"
					  ? "Dashboard"
					  : finalName.join(" ")}
				</div>
            </div>
			<div className="navbar-nav header-right">
				<div className="nav-item d-flex align-items-center">
					<div className="input-group search-area">
						<span className="input-group-text"><Link to={"#"}><svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M27.414 24.586L22.337 19.509C23.386 17.928 24 16.035 24 14C24 8.486 19.514 4 14 4C8.486 4 4 8.486 4 14C4 19.514 8.486 24 14 24C16.035 24 17.928 23.386 19.509 22.337L24.586 27.414C25.366 28.195 26.634 28.195 27.414 27.414C28.195 26.633 28.195 25.367 27.414 24.586ZM7 14C7 10.14 10.14 7 14 7C17.86 7 21 10.14 21 14C21 17.86 17.86 21 14 21C10.14 21 7 17.86 7 14Z" fill="var(--secondary)"/>
							</svg>
							</Link></span>
						<input type="text" className="form-control" placeholder="Search here..." />  
					</div>					
				</div>
				<div className="dlab-side-menu">
					<div className="search-coundry d-flex align-items-center">
						<img src={United} alt="" className='mx-2'/>						
						<Dropdown className='sidebar-dropdown me-2 mt-2'>
							<Dropdown.Toggle as='div' className='i-false sidebar-select'>{rightSelect} <i className="fa-solid fa-angle-down ms-2" /></Dropdown.Toggle>
							<Dropdown.Menu>
								<Dropdown.Item onClick={()=>setRightSelect("Eng")}>Eng</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
					</div>
					
					{/* Reminders Icon - Added between language and profile */}
					<div className="nav-item dropdown me-3">
						<Dropdown>
							<Dropdown.Toggle variant="" as="a" className="nav-link i-false c-pointer position-relative">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 22c5.514 0 10-4.486 10-10S17.514 2 12 2 2 6.486 2 12s4.486 10 10 10z" stroke="currentColor" strokeWidth="2"/>
									<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
								</svg>
								{reminders.length > 0 && (
									<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
										{reminders.length}
									</span>
								)}
							</Dropdown.Toggle>
							<Dropdown.Menu align="right" className="dropdown-menu dropdown-menu-end reminders-dropdown">
								<div className="dropdown-header d-flex justify-content-between align-items-center">
									<strong>Reminders</strong>
									<small className="text-muted">{reminders.length} active</small>
								</div>
								{remindersLoading ? (
									<div className="dropdown-item text-center text-muted py-3">
										<div className="spinner-border spinner-border-sm me-2" role="status">
											<span className="visually-hidden">Loading...</span>
										</div>
										Loading...
									</div>
								) : reminders.length === 0 ? (
									<div className="dropdown-item text-center text-muted py-3">
										<div>No upcoming reminders</div>
									</div>
								) : (
									reminders.map(reminder => (
										<Dropdown.Item key={reminder.id} className="reminder-item">
											<div className="d-flex align-items-start">
												<span className="me-2">{getTypeIcon(reminder.type)}</span>
												<div className="flex-grow-1">
													<div className="reminder-title">{reminder.title}</div>
													<small className="text-muted">{reminder.description}</small>
												</div>
											</div>
										</Dropdown.Item>
									))
								)}
								<Dropdown.Divider />
								<Dropdown.Item as={Link} to="/dashboard/reminders" className="text-center">
									View All Reminders
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
					</div>
					
					<ul>
						<Dropdown as="li" className="nav-item dropdown header-profile">
							<Dropdown.Toggle variant="" as="a" className="nav-link i-false c-pointer">
								<img src={profile} width={20} alt="" />
							</Dropdown.Toggle>
							<Dropdown.Menu align="right" className="dropdown-menu dropdown-menu-end">
								<Link to="/dashboard/profile" className="dropdown-item ai-icon">
									<svg id="icon-user1" xmlns="http://www.w3.org/2000/svg" className="text-primary me-1" width={18} height={18} viewBox="0 0 24 24" fill="none"
										stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
									>
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
										<circle cx={12} cy={7} r={4} />
									</svg>
									<span className="ms-2">Profile </span>
								</Link>
								<Link to="/email-manager" className="dropdown-item ai-icon">
									<svg
									id="icon-inbox" xmlns="http://www.w3.org/2000/svg" className="text-success me-1" width={18}
									height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
									strokeLinecap="round" strokeLinejoin="round"
									>
									<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
									<polyline points="22,6 12,13 2,6" />
									</svg>
									<span className="ms-2">Inbox </span>
								</Link>
								<LogoutPage />
							</Dropdown.Menu>
						</Dropdown> 	
					</ul>
					
				</div>

			</div>
			
			
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Header;
