import React,{useState} from 'react';
import {Link} from 'react-router-dom'
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import {Sparklines, SparklinesLine} from "react-sparklines";

import DropDownBlog from './../Dashboard/DropDownBlog';
//import TotalStudentsChart from './Instructor/TotalStudentsChart';
//import EarningsChart from './Instructor/EarningsChart';
//import WorkingActivityChart from './Instructor/WorkingActivityChart';
import CalendarBlog from './../Dashboard/Dashboard/CalendarBlog';


const TotalStudentsChart = loadable(() =>
	pMinDelay(import("./Instructor/TotalStudentsChart"), 1000)
);
const EarningsChart = loadable(() =>
	pMinDelay(import("./Instructor/EarningsChart"), 1000)
);
const WorkingActivityChart = loadable(() =>
	pMinDelay(import("./Instructor/WorkingActivityChart"), 1000)
);

const sampleData = [4,7,4,9,5,6,8,4,2,4,5,6];

const timelineBlog = [
	{title:'Introduction Wireframe', change:'bg-primary'},
	{title:'Basic React', change:'bg-secondary'},
	{title:'Basic Js', change:'bg-warning'},
];

function UpComingEvent(){
	return(
		<>
			<div className="d-flex justify-content-between side-border">
				<h4 className="mb-0 fs-18 font-w500">5 Jan</h4>
				<div className="dropdown custom-dropdown mb-0">
					<DropDownBlog />
				</div>
			</div>
			<ul className="timeline-active style-4">
				{timelineBlog.map((data, ind)=>(
					<li className="d-flex align-items-center" key={ind}>
						<span className="time-1">08.00 AM</span>
						<div className="panel">
							<div className={`line-color ${data.change}`}></div>
							<Link to={"#"} className="timeline-panel text-muted">
								<span className="d-block">UI Design</span>
								<h4 className="mb-0">{data.title}</h4>
							</Link>
						</div>	
					</li>
				))}				
			</ul>
		</>
	)
}

const InstructorDashboard = () =>{
	return(
		<>
			<div className="row">
				<div className="col-xl-8 col-xxl-7">
					<div className="row">
						<div className="col-xl-4 col-xxl-6 col-sm-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4>Total Students</h4>
								</div>
								<div className="card-body pt-0 px-0 ">
									
									<TotalStudentsChart />
									<div className="d-flex justify-content-between align-items-center flex-wrap px-4">
										<h4 className="fs-18 font-w600 mb-0">12.345</h4>
										<span><small className="text-secondary">5.4% </small>than last year</span>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xl-4 col-xxl-6 col-sm-6">
							<div className="card overflow-hidden">
								<div className="card-header border-0 pb-0">
									<h4>Courses</h4>
								</div>
								<div className="card-body pt-0">
									<div className="d-flex align-items-center courses-chart flex-wrap">
										<span className="ic-icon me-2">
											<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M9.00001 6.86665C9.09359 6.86611 9.18637 6.88405 9.27301 6.91944C9.35965 6.95483 9.43845 7.00697 9.5049 7.07288L12.3493 9.91732C12.4832 10.0512 12.5585 10.2328 12.5585 10.4222C12.5585 10.6116 12.4832 10.7932 12.3493 10.9271C12.2154 11.061 12.0338 11.1362 11.8445 11.1362C11.6551 11.1362 11.4735 11.061 11.3396 10.9271L9.00001 8.58043L6.66045 10.92C6.52441 11.0365 6.34943 11.0974 6.17046 11.0904C5.99149 11.0835 5.82172 11.0093 5.69507 10.8827C5.56843 10.7561 5.49424 10.5863 5.48732 10.4073C5.48041 10.2283 5.54129 10.0534 5.65778 9.91732L8.50223 7.07288C8.63468 6.9415 8.81345 6.86744 9.00001 6.86665Z" fill="white"/>
											</svg>
										</span>
										<h4 className="mb-0 me-auto">100</h4>
										<span><small className="text-secondary">+15%  </small>than last year</span>
									</div>
									<div className="pt-line">
										<div className="peity-line">
											<Sparklines data={sampleData} data-width="100%" height={102}>
												<SparklinesLine color="#fec64f" style={{strokeWidth: 4}}/>
											 </Sparklines>
										</div>	 
									</div>	
								</div>
							</div>
						</div>
						<div className="col-xl-4 col-xxl-12 col-sm-12">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4>Earnings</h4>
								</div>
								<div className="card-body pt-0 px-3">
									<EarningsChart />
									
									<div className="px-3">
										<h4 className="mb-2">$45,741</h4>
										<span>+15%
											<svg className="ms-3" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M23.25 12C23.25 5.775 18.225 0.75 12 0.75C5.775 0.749999 0.75 5.775 0.75 12C0.749999 18.225 5.775 23.25 12 23.25C18.225 23.25 23.25 18.225 23.25 12ZM11.25 16.575L11.25 9.675L9.3 11.4C8.85 11.775 8.25 11.7 7.875 11.325C7.725 11.1 7.65 10.875 7.65 10.65C7.65 10.35 7.8 10.05 8.025 9.9L11.625 6.75C11.7 6.675 11.775 6.675 11.85 6.6C11.925 6.6 11.925 6.6 12 6.525C12.075 6.525 12.075 6.525 12.15 6.525L12.225 6.525C12.3 6.525 12.3 6.525 12.375 6.525L12.45 6.525C12.525 6.525 12.525 6.525 12.6 6.6C12.6 6.6 12.675 6.6 12.675 6.675L12.75 6.75C12.75 6.75 12.75 6.75 12.825 6.825L15.975 10.05C16.35 10.425 16.35 11.1 15.975 11.475C15.6 11.85 14.925 11.85 14.55 11.475L13.125 9.975L13.125 16.65C13.125 17.175 12.675 17.7 12.075 17.7C11.7 17.55 11.25 17.1 11.25 16.575Z" fill="#4CBC9A"/>
											</svg>
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xl-12">
							<div className="card">
								<div className="card-header border-0 flex-wrap">
									<h4>Working Activity</h4>
									<div className="d-flex align-items-center">
										<div className="d-flex align-items-center">
											<span className="work-ic">
												<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M19.4 0.840088H6.59997C5.07305 0.842458 3.60934 1.45007 2.52965 2.52977C1.44995 3.60947 0.842336 5.07317 0.839966 6.60009V19.4001C0.842336 20.927 1.44995 22.3907 2.52965 23.4704C3.60934 24.5501 5.07305 25.1577 6.59997 25.1601H19.4C20.9269 25.1577 22.3906 24.5501 23.4703 23.4704C24.55 22.3907 25.1576 20.927 25.16 19.4001V6.60009C25.1576 5.07317 24.55 3.60947 23.4703 2.52977C22.3906 1.45007 20.9269 0.842458 19.4 0.840088ZM20.3984 13.6401H16.9936L14.8432 17.8769C14.7911 17.9815 14.7107 18.0693 14.6111 18.1305C14.5115 18.1916 14.3968 18.2234 14.28 18.2225H14.2416C14.1175 18.2182 13.9976 18.1769 13.8973 18.1039C13.7969 18.0309 13.7207 17.9296 13.6784 17.8129L11.0928 11.1441L9.95357 13.2945C9.90275 13.4001 9.82262 13.4888 9.72276 13.5501C9.62289 13.6113 9.50751 13.6426 9.39037 13.6401H5.60157C5.43183 13.6401 5.26904 13.5727 5.14902 13.4526C5.02899 13.3326 4.96157 13.1698 4.96157 13.0001C4.96157 12.8303 5.02899 12.6676 5.14902 12.5475C5.26904 12.4275 5.43183 12.3601 5.60157 12.3601H9.00637L10.6192 9.31369C10.6739 9.20296 10.7603 9.11099 10.8674 9.04946C10.9746 8.98792 11.0975 8.9596 11.2208 8.96809C11.3442 8.9747 11.463 9.0169 11.563 9.08958C11.6629 9.16226 11.7397 9.26233 11.784 9.37769L14.3568 16.0209L16.0336 12.7057C16.0905 12.6024 16.1738 12.5159 16.275 12.4552C16.3761 12.3945 16.4916 12.3617 16.6096 12.3601H20.3984C20.5681 12.3601 20.7309 12.4275 20.8509 12.5475C20.9709 12.6676 21.0384 12.8303 21.0384 13.0001C21.0384 13.1698 20.9709 13.3326 20.8509 13.4526C20.7309 13.5727 20.5681 13.6401 20.3984 13.6401Z" fill="#4CBC9A"/>
												</svg>
											</span>
											<div className="ms-3">
												<span>Performance</span>
												<h4 className="fs-18 mb-0">14.988</h4>
											</div>
										</div>
										<div className="d-flex align-items-center ms-3">
											<span className="work-ic">
												<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M19.4 0.840088H6.59997C5.07305 0.842458 3.60934 1.45007 2.52965 2.52977C1.44995 3.60947 0.842336 5.07317 0.839966 6.60009V19.4001C0.842336 20.927 1.44995 22.3907 2.52965 23.4704C3.60934 24.5501 5.07305 25.1577 6.59997 25.1601H19.4C20.9269 25.1577 22.3906 24.5501 23.4703 23.4704C24.55 22.3907 25.1576 20.927 25.16 19.4001V6.60009C25.1576 5.07317 24.55 3.60947 23.4703 2.52977C22.3906 1.45007 20.9269 0.842458 19.4 0.840088ZM20.3984 13.6401H16.9936L14.8432 17.8769C14.7911 17.9815 14.7107 18.0693 14.6111 18.1305C14.5115 18.1916 14.3968 18.2234 14.28 18.2225H14.2416C14.1175 18.2182 13.9976 18.1769 13.8973 18.1039C13.7969 18.0309 13.7207 17.9296 13.6784 17.8129L11.0928 11.1441L9.95357 13.2945C9.90275 13.4001 9.82262 13.4888 9.72276 13.5501C9.62289 13.6113 9.50751 13.6426 9.39037 13.6401H5.60157C5.43183 13.6401 5.26904 13.5727 5.14902 13.4526C5.02899 13.3326 4.96157 13.1698 4.96157 13.0001C4.96157 12.8303 5.02899 12.6676 5.14902 12.5475C5.26904 12.4275 5.43183 12.3601 5.60157 12.3601H9.00637L10.6192 9.31369C10.6739 9.20296 10.7603 9.11099 10.8674 9.04946C10.9746 8.98792 11.0975 8.9596 11.2208 8.96809C11.3442 8.9747 11.463 9.0169 11.563 9.08958C11.6629 9.16226 11.7397 9.26233 11.784 9.37769L14.3568 16.0209L16.0336 12.7057C16.0905 12.6024 16.1738 12.5159 16.275 12.4552C16.3761 12.3945 16.4916 12.3617 16.6096 12.3601H20.3984C20.5681 12.3601 20.7309 12.4275 20.8509 12.5475C20.9709 12.6676 21.0384 12.8303 21.0384 13.0001C21.0384 13.1698 20.9709 13.3326 20.8509 13.4526C20.7309 13.5727 20.5681 13.6401 20.3984 13.6401Z" fill="#FEC64F"/>
												</svg>
											</span>
											<div className="ms-3">
												<span>Performance</span>
												<h4 className="fs-18 mb-0">14.988</h4>
											</div>
										</div>
									</div>	
								</div>
								<div className="card-body">
									<WorkingActivityChart  />
									
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-4 col-xxl-5">
					<div className="card">
						<div className="card-body">
							<div className="card-calendar style-1 active-cal border-bottom pb-4 instructor-calendar">
								<CalendarBlog />
								{/* <input type='text' className="form-control d-none" id='datetimepicker' /> */}
							</div>
							<div id="DZ_W_TimeLine11" className="widget-timeline">
								<h4 className="mb-3 mt-4">Upcoming Events</h4>								
								<UpComingEvent />
								<UpComingEvent />
							</div>
						</div>
					</div>
				</div>
				
				
			</div>	
		</>
	)
}
export default InstructorDashboard;