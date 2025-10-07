/// Menu
import Metismenu from "metismenujs";
import React, { Component, useContext, useEffect, useState } from "react";
/// Scroll
import PerfectScrollbar from "react-perfect-scrollbar";
/// Link
import { Link } from "react-router-dom";

import {useScrollPosition} from "@n8tb1t/use-scroll-position";
import { ThemeContext } from "../../../context/ThemeContext";



class MM extends Component {
	componentDidMount() {
		this.$el = this.el;
		this.mm = new Metismenu(this.$el);
	}
  componentWillUnmount() {
  }
  render() {
	return (
	  <div className="mm-wrapper">
		<ul className="metismenu" ref={(el) => (this.el = el)}>
		  {this.props.children}
		</ul>
	  </div>
	);
  }
}

const Custom_SideBar = () => {
	const {
		iconHover,
		sidebarposition,
		headerposition,
		sidebarLayout,
	} = useContext(ThemeContext);
  useEffect(() => {
	var btn = document.querySelector(".nav-control");
	var aaa = document.querySelector("#main-wrapper");
	function toggleFunc() {
	  return aaa.classList.toggle("menu-toggle");
	}
	btn.addEventListener("click", toggleFunc);
	
	//sidebar icon Heart blast
	var handleheartBlast = document.querySelector('.heart');
		function heartBlast() {
			return handleheartBlast.classList.toggle("heart-blast");
		}
		handleheartBlast.addEventListener('click', heartBlast);
	
  }, []);
 //For scroll
 const [hideOnScroll, setHideOnScroll] = useState(true)
	useScrollPosition(
		({ prevPos, currPos }) => {
		  const isShow = currPos.y > prevPos.y
		  if (isShow !== hideOnScroll) setHideOnScroll(isShow)
		},
		[hideOnScroll]
	)
  /// Path
  let path = window.location.pathname;
  path = path.split("/");
  // Handle dashboard sub-routes properly
  if (path[1] === "dashboard" && path[2]) {
    path = path[2]; // Get the sub-route (activity, profile, etc.)
  } else {
    path = path[path.length - 1]; // Fallback to last segment
  }
  /// Active menu
  let userManagement = [
	  "",
	  "profile",
	  "activity",
	  
	],
	eventsManagement = [
		"events-management",
		
		
	],
	tasksManagement = [
		"tasks-management",

	],	
	smartPrioritization = [
		"smart-prioritization",
		"smart-prioritization-events",
		"smart-prioritization-tasks",
	],
	healthAndFitness = [
		"health-and-fitness",
	],	
	 email = [
		"email-manager", 
		"auto-reply", 
	 ]
  return (
	<div
	  className={`dlabnav ${iconHover} ${
		sidebarposition.value === "fixed" &&
		sidebarLayout.value === "horizontal" &&
		headerposition.value === "static"
		  ? hideOnScroll > 120
			? "fixed"
			: ""
		  : ""
	  }`}
	>
	  <PerfectScrollbar className="dlabnav-scroll">
		<MM className="metismenu" id="menu">
			{/* Back to Home Button */}
			<li>
				<Link className="" to="/home" >
					<i className="bi bi-house-door"></i>
					<span className="nav-text">Back to Home</span>
				</Link>
			</li>
			<li className={`${userManagement.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow" to="#" >
					<i className="bi bi-grid"></i>
					<span className="nav-text">User Management</span>
				</Link>
				<ul>
					<li><Link className={`${path === "profile" ? "mm-active" : ""}`} to="/dashboard/profile"> User Profile</Link></li>
					<li><Link className={`${path === "activity" ? "mm-active" : ""}`} to="/dashboard/activity"> User Activity</Link></li>
				</ul>
			</li>
			
			
			<li className={`${tasksManagement.includes(path) ? "mm-active" : ""}`}>
				<Link className="" to="/tasks-management" >
					<i className="bi bi-list-task"></i>
					<span className="nav-text">Tasks Management</span>
				</Link>
				
			</li>
            
			<li className={`${eventsManagement.includes(path) ? "mm-active" : ""}`}>
				<Link className="" to="/events-management" >
					<i className="bi bi-calendar"></i>
					<span className="nav-text">Events Management </span>
				</Link>
			
			</li>
            
			
			<li className={`${email.includes(path) ? "mm-active" : ""}`}>
                <Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-envelope"></i>
                    <span className="nav-text">Mails Management</span>
				</Link>
				<ul>
                    <li><Link className={`${path === "email-manager" ? "mm-active" : ""}`} to="/email-manager">
                        Emails Manager
                    </Link></li>
					<li><Link className={`${path === "auto-reply" ? "mm-active" : ""}`} to="/auto-reply">
                        AI Response Generator
                    </Link></li>

                    
				</ul>
			</li>
			<li className={`${smartPrioritization.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow" to="#" >
					<i className="bi bi-lightbulb"></i>
					<span className="nav-text">Smart Prioritization</span>
				</Link>
				<ul>
					<li><Link className={`${path === "smart-prioritization-events" ? "mm-active" : ""}`} to="/smart-prioritization/events">Event Suggestions</Link></li>
					<li><Link className={`${path === "smart-prioritization-tasks" ? "mm-active" : ""}`} to="/smart-prioritization/tasks">Task Prioritization</Link></li>
				</ul>
			</li>
			<li className={`${path=== "healthAndFitness"? "mm-active" : ""}`}>
				<Link className="" to="/health-and-fitness" >
					<i className="bi bi-heart"></i>
					<span className="nav-text">Health and Fitness</span>
				</Link>
				
			</li>
           
            {/* <li className={`${behavioralLearning.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow" to="#" >
					<i className="bi bi-book"></i>
                    <span className="nav-text">Behavioral Learning</span>
				</Link>
				<ul>
                    <li><Link className={`${path === "behavioral-learning" ? "mm-active" : ""}`} to="/behavioral-learning">Behavioral Learning</Link></li>
                    <li><Link className={`${path === "adaptiveSettings" ? "mm-active" : ""}`} to="/adaptiveSettings">Adaptive Settings</Link></li>
				</ul>
			</li>
				 */}
			
			
		</MM>
			 <div className="plus-box">
				
			<div className="copyright">
				<p><strong>Smart Personal Assistant</strong> © 2025 All Rights Reserved</p>
				<p className="fs-12">Made with <span className="heart"></span> by Hammad & Hassan</p>
			</div>
			</div>
	  </PerfectScrollbar>
	</div>
  );
};

export default Custom_SideBar;
