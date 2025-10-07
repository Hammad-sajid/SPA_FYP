/// Menu
import Metismenu from "metismenujs";
import React, { Component, useContext, useEffect, useState } from "react";
/// Scroll
import PerfectScrollbar from "react-perfect-scrollbar";
/// Link
import { Link } from "react-router-dom";

import {useScrollPosition} from "@n8tb1t/use-scroll-position";
import { ThemeContext } from "../../../context/ThemeContext";

import medal from "../../../images/medal.png";


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

const SideBar = () => {
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
  path = path[path.length - 1];
  /// Active menu
  let deshBoard = [
      "",
      "dashboard-dark",
      "schedule",
      "instructors",
      "message",
      "activity",
      "profile",
      "task",
    ],
	courses = [
		"courses",
		"course-details-1",
		"course-details-2",
	],
	instructor=[
		"instructor-dashboard",
		"instructor-courses",
		"instructor-schedule",
		"instructor-students",
		"instructor-resources",
		"instructor-transactions",
		"instructor-liveclass",
	],
    app = [
      "app-profile",
      "post-details",
      "app-calender",
      "email-compose",
      "email-inbox",
      "email-read",
      "ecom-product-grid",
      "ecom-product-list",
      "ecom-product-order",
      "ecom-checkout",
      "ecom-invoice",
      "ecom-customers",
      "post-details",
      "ecom-product-detail",
    ],
    email = ["email-compose", "email-inbox", "email-read"],
    shop = [
      "ecom-product-grid",
      "ecom-product-list",
      "ecom-product-list",
      "ecom-product-order",
      "ecom-checkout",
      "ecom-invoice",
      "ecom-customers",
      "ecom-product-detail",
    ],
    charts = [
      "chart-rechart",
      "chart-flot",
      "chart-chartjs",
      "chart-chartist",
      "chart-sparkline",
      "chart-apexchart",
    ],
    bootstrap = [
      "ui-accordion",
      "ui-badge",
      "ui-alert",
      "ui-button",
      "ui-modal",
      "ui-button-group",
      "ui-list-group",
      "ui-card",
      "ui-carousel",
      "ui-dropdown",
      "ui-popover",
      "ui-progressbar",
      "ui-tab",
      "ui-typography",
      "ui-pagination",
      "ui-grid",
    ],
    plugins = [
      "uc-select2",
      "uc-nestable",
      "uc-sweetalert",
      "uc-toastr",
      "uc-noui-slider",
      "map-jqvmap",
      "uc-lightgallery",
    ],
	redux = [
       "redux-form",
	   "redux-wizard",    
       "todo",
    ],
    widget = ["widget-basic"],
    forms = [
      "form-element",
      "form-wizard",
      "form-editor-summernote",
      "form-pickers",
      "form-validation-jquery",
    ],
    table = ["table-bootstrap-basic", "table-datatable-basic"],
    pages = [
      "page-register",
      "page-login",
      "page-lock-screen",
      "page-error-400",
      "page-error-403",
      "page-error-404",
      "page-error-500",
      "page-error-503",
    ],
    error = [
      "page-error-400",
      "page-error-403",
      "page-error-404",
      "page-error-500",
      "page-error-503",
    ];
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
			<li className={`${deshBoard.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow" to="#" >
					<i className="bi bi-grid"></i>
					<span className="nav-text">Dashboard</span>
				</Link>
				<ul>
					<li><Link className={`${path === "dashboard" ? "mm-active" : ""}`} to="/dashboard"> Dashboard Light</Link></li>
					<li><Link className={`${path === "dashboard-dark" ? "mm-active" : ""}`} to="/dashboard-dark"> Dashboard Dark</Link></li>
					<li><Link className={`${path === "schedule" ? "mm-active" : ""}`} to="/schedule">Schedule</Link></li>
					<li><Link className={`${path === "instructors" ? "mm-active" : ""}`} to="/instructors">Instructors</Link></li>
					<li><Link className={`${path === "message" ? "mm-active" : ""}`} to="/message">Message</Link></li>
					<li><Link className={`${path === "activity" ? "mm-active" : ""}`} to="/activity">Activity</Link></li>
					<li><Link className={`${path === "profile" ? "mm-active" : ""}`} to="/profile">Profile</Link></li>
						{/* <li><Link className={`${path === "task" ? "mm-active" : ""}`} to="/task">Task</Link></li> */}
				</ul>
			</li>
			
			
			<li className={`${courses.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow" to="#" >
					<i className="bi bi-book"></i>
					<span className="nav-text">Courses</span>
				</Link>
				<ul>
					<li><Link className={`${path === "courses" ? "mm-active" : ""}`} to="/courses">Courses</Link></li>
					<li><Link className={`${path === "course-details-1" ? "mm-active" : ""}`} to="/course-details-1">Course Details 1</Link></li>
					<li><Link className={`${path === "course-details-2" ? "mm-active" : ""}`} to="/course-details-2">Course Details 2</Link></li>
				</ul>
			</li>
			<li className={`${instructor.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow" to="#"> <i className="bi bi-people"></i> <span className="nav-text">Instructor</span></Link>
				<ul>
					<li><Link className={`${path === "instructor-dashboard" ? "mm-active" : ""}`} to="/instructor-dashboard">Dashboard</Link></li>
					<li><Link className={`${path === "instructor-courses" ? "mm-active" : ""}`} to="/instructor-courses">Courses</Link></li>
					<li><Link className={`${path === "instructor-schedule" ? "mm-active" : ""}`} to="/instructor-schedule">Schedule</Link></li>
					<li><Link className={`${path === "instructor-students" ? "mm-active" : ""}`} to="/instructor-students">Students</Link></li>
					<li><Link className={`${path === "instructor-resources" ? "mm-active" : ""}`} to="/instructor-resources">Resources</Link></li>
					<li><Link className={`${path === "instructor-transactions" ? "mm-active" : ""}`} to="/instructor-transactions">Transactions</Link></li>
					<li><Link className={`${path === "instructor-liveclass" ? "mm-active" : ""}`} to="/instructor-liveclass">Live Class</Link></li>
				</ul>
			</li>			
			<li className={`${app.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-info-circle"></i>
					<span className="nav-text">Apps</span>
				</Link>
				<ul>
					<li><Link className={`${path === "app-profile" ? "mm-active" : ""}`} to="/app-profile">Profile</Link></li>
					<li><Link className={`${path === "post-details" ? "mm-active" : ""}`} to="/post-details">Post Details</Link></li>
					<li className={`${email.includes(path) ? "mm-active" : ""}`}><Link className="has-arrow" to="#" >Email</Link>
						<ul  className={`${email.includes(path) ? "mm-show" : ""}`}>
						  <li><Link className={`${ path === "email-compose" ? "mm-active" : ""}`} to="/email-compose">Compose</Link></li>
						  <li><Link className={`${path === "email-inbox" ? "mm-active" : ""}`} to="/email-inbox">Inbox</Link></li>
						  <li><Link className={`${path === "email-read" ? "mm-active" : ""}`} to="/email-read">Read</Link></li>
						</ul>
					</li>
					<li><Link className={`${path === "app-calender" ? "mm-active" : ""}`}to="/app-calender">Calendar</Link></li>
					<li className={`${shop.includes(path) ? "mm-active" : ""}`}><Link className="has-arrow" to="#" >Shop</Link>
						<ul className={`${shop.includes(path) ? "mm-show" : ""}`}>
							<li><Link className={`${ path === "ecom-product-grid" ? "mm-active" : ""}`} to="/ecom-product-grid">Product Grid</Link></li>
							<li><Link className={`${ path === "ecom-product-list" ? "mm-active" : ""}`} to="/ecom-product-list">Product List</Link></li>
							<li><Link className={`${ path === "ecom-product-detail" ? "mm-active" : "" }`} to="/ecom-product-detail">Product Details</Link></li>
							<li><Link className={`${ path === "ecom-product-order" ? "mm-active" : "" }`} to="/ecom-product-order">Order</Link></li>
							<li><Link className={`${ path === "ecom-checkout" ? "mm-active" : ""}`} to="/ecom-checkout">Checkout</Link></li>
							<li><Link className={`${ path === "ecom-invoice" ? "mm-active" : "" }`} to="/ecom-invoice">Invoice</Link></li>
							<li><Link className={`${ path === "ecom-customers" ? "mm-active" : "" }`} to="/ecom-customers">Customers</Link></li>
						</ul>
					</li>
				</ul>
			</li>
			<li className={`${charts.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-pie-chart"></i>
					<span className="nav-text">Charts</span>
				</Link>
				<ul>
					<li><Link className={`${path === "chart-rechart" ? "mm-active" : ""}`} to="/chart-rechart">RechartJs</Link></li>
					<li><Link className={`${path === "chart-chartjs" ? "mm-active" : ""}`} to="/chart-chartjs">Chartjs</Link></li>
					<li><Link className={`${path === "chart-chartist" ? "mm-active" : ""}`} to="/chart-chartist">Chartist</Link></li>
					<li><Link className={`${path === "chart-sparkline" ? "mm-active" : ""}`} to="/chart-sparkline">Sparkline</Link></li>
					<li><Link className={`${path === "chart-apexchart" ? "mm-active" : ""}`} to="/chart-apexchart" >Apexchart</Link></li>
				</ul>
			</li>
			<li className={`${bootstrap.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-star"></i>
					<span className="nav-text">Bootstrap</span>
				</Link>
				<ul >
					<li><Link className={`${path === "ui-accordion" ? "mm-active" : ""}`} to="/ui-accordion">Accordion</Link></li>
					<li><Link className={`${path === "ui-alert" ? "mm-active" : ""}`} to="/ui-alert"> Alert</Link></li>
					<li><Link className={`${path === "ui-badge" ? "mm-active" : ""}`} to="/ui-badge">Badge</Link></li>
					<li><Link className={`${path === "ui-button" ? "mm-active" : ""}`} to="/ui-button">Button</Link></li>
					<li><Link className={`${path === "ui-modal" ? "mm-active" : ""}`} to="/ui-modal">Modal</Link></li>
					<li><Link className={`${path === "ui-button-group" ? "mm-active" : ""}`} to="/ui-button-group">Button Group</Link></li>
					<li><Link className={`${path === "ui-list-group" ? "mm-active" : ""}`} to="/ui-list-group" >List Group</Link></li>
					<li><Link className={`${path === "ui-card" ? "mm-active" : ""}`} to="/ui-card">Cards</Link></li>
					<li><Link className={`${path === "ui-carousel" ? "mm-active" : ""}`} to="/ui-carousel">Carousel</Link></li>
					<li><Link className={`${path === "ui-dropdown" ? "mm-active" : ""}`} to="/ui-dropdown">Dropdown</Link></li>
					<li><Link className={`${path === "ui-popover" ? "mm-active" : ""}`} to="/ui-popover">Popover</Link></li>
					<li><Link className={`${path === "ui-progressbar" ? "mm-active" : ""}`} to="/ui-progressbar">Progressbar</Link></li>
					<li><Link className={`${path === "ui-tab" ? "mm-active" : ""}`} to="/ui-tab">Tab</Link></li>
					<li><Link className={`${path === "ui-typography" ? "mm-active" : ""}`} to="/ui-typography">Typography</Link></li>
					<li><Link className={`${path === "ui-pagination" ? "mm-active" : ""}`} to="/ui-pagination">Pagination</Link></li>
					<li><Link className={`${path === "ui-grid" ? "mm-active" : ""}`} to="/ui-grid">Grid</Link></li>
				</ul>
			</li>
			<li className={`${plugins.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-heart"></i><span className="nav-text">Plugins</span>
				</Link>
				<ul>
					<li><Link className={`${path === "uc-select2" ? "mm-active" : ""}`} to="/uc-select2">Select 2</Link></li>
					<li><Link className={`${path === "uc-noui-slider" ? "mm-active" : ""}`} to="/uc-noui-slider">Noui Slider</Link></li>
					<li><Link className={`${path === "uc-sweetalert" ? "mm-active" : ""}`} to="/uc-sweetalert">Sweet Alert</Link></li>
					<li><Link className={`${path === "uc-toastr" ? "mm-active" : ""}`} to="/uc-toastr">Toastr</Link></li>
					<li><Link className={`${path === "map-jqvmap" ? "mm-active" : ""}`} to="/map-jqvmap">Jqv Map</Link></li>
					<li><Link className={`${path === "uc-lightgallery" ? "mm-active" : ""}`} to="/uc-lightgallery">Light Gallery</Link></li>
				</ul>
			</li>
			<li className={`${redux.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-archive"></i><span className="nav-text">Redux</span>
				</Link>
                <ul>
                  <li><Link className={`${path === "todo" ? "mm-active" : ""}`} to="/todo">Todo</Link></li>  
                </ul>
            </li>
			<li className={`${widget.includes(path) ? "mm-active" : ""}`}>
				<Link to="widget-basic" className="ai-icon" >
					<i className="bi bi-gear-wide"></i>
					<span className="nav-text">Widget</span>
				</Link>
			</li>
			<li className={`${forms.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-file-earmark-check"></i>
					<span className="nav-text forms">Forms</span>
				</Link>
				<ul >
					<li><Link className={`${path === "form-element" ? "mm-active" : ""}`} to="/form-element">Form Elements</Link></li>
					<li><Link className={`${path === "form-wizard" ? "mm-active" : ""}`} to="/form-wizard"> Wizard</Link></li>
					<li>
						<Link className={`${path === "form-editor-summernote" ? "mm-active" : ""}`}to="/form-editor-summernote">
							Summernote
						</Link>
					</li>
					<li><Link className={`${path === "form-pickers" ? "mm-active" : ""}`} to="/form-pickers">Pickers</Link></li>
					<li>
						<Link className={`${path === "form-validation-jquery" ? "mm-active" : ""}`} to="/form-validation-jquery">
							Form Validate
						</Link>
					</li>
				</ul>
			</li>
			<li className={`${table.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" ><i className="bi bi-file-earmark-spreadsheet"></i><span className="nav-text">Table</span></Link>
				<ul>
					<li>
						<Link className={`${ path === "table-filtering" ? "mm-active" : "" }`} to="/table-filtering">
							Table Filtering
						</Link>
					</li>
					<li>
						<Link className={`${ path === "table-sorting" ? "mm-active" : "" }`} to="/table-sorting">
							Table Sorting
						</Link>
					</li>
					<li>
						<Link className={`${ path === "table-bootstrap-basic" ? "mm-active" : "" }`} to="/table-bootstrap-basic">
							Bootstrap
						</Link>
					</li>
					<li>
						<Link className={`${ path === "table-datatable-basic" ? "mm-active" : ""}`} to="/table-datatable-basic">
							Datatable
						</Link>
					</li>
				</ul>
			</li>
			<li className={`${pages.includes(path) ? "mm-active" : ""}`}>
				<Link className="has-arrow ai-icon" to="#" >
					<i className="bi bi-file-earmark-break"></i>
					<span className="nav-text">Pages</span>
				</Link>
				<ul>
					<li className={`${error.includes(path) ? "mm-active" : ""}`}>
						<Link className="has-arrow" to="#" >Error</Link>
						<ul>
							<li><Link className={`${ path === "page-error-400" ? "mm-active" : "" }`} to="/page-error-400">Error 400</Link></li>
							<li><Link className={`${ path === "page-error-403" ? "mm-active" : "" }`} to="/page-error-403">Error 403</Link></li>
							<li><Link className={`${ path === "page-error-404" ? "mm-active" : "" }`} to="/page-error-404">Error 404</Link></li>
							<li><Link className={`${ path === "page-error-500" ? "mm-active" : "" }`} to="/page-error-500">Error 500</Link></li>
							<li><Link className={`${ path === "page-error-503" ? "mm-active" : "" }`} to="/page-error-503">Error 503</Link></li>
						</ul>
					</li>
					<li><Link className={`${path === "page-lock-screen" ? "mm-active" : ""}`} to="/page-lock-screen">Lock Screen</Link></li>
				</ul>
			</li>
        </MM>
			<div className="plus-box">
				<div className="d-flex align-items-center">
					<h5>Upgrade your Account to Pro</h5>
					<img src={medal} alt="" />
				</div>
				<p>Upgrade to premium to get premium features</p>
				<Link to={'#'} className="btn btn-primary btn-sm">Upgrade</Link>
			</div>
			<div className="copyright">
				<p><strong>GetSkills Online Learning Admin</strong> © 2022 All Rights Reserved</p>
				<p className="fs-12">Made with <span className="heart"></span> by DexignZone</p>
			</div>
      </PerfectScrollbar>
    </div>
  );
};

export default SideBar;
