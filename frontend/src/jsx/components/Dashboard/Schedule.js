import React from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";

import InstructorCalendar from './../Instructor/Instructor/InstructorCalendar';
//import ScheduleRadilChart from './Dashboard/ScheduleRadilChart';
import CalendarBlog from './Dashboard/CalendarBlog';
//Images
import small6 from './../../../images/profile/small/pic6.jpg';
import small7 from './../../../images/profile/small/pic7.jpg';
import small8 from './../../../images/profile/small/pic8.jpg';

const ScheduleRadilChart = loadable(() =>
	pMinDelay(import("./Dashboard/ScheduleRadilChart"), 1000)
);

const cardBlog = [
	{title: 'UI Design Basic', value:'75', barPercent:'75%', changeClass2:'bgl-secondary',changeClass:'bg-secondary'},
	{title: 'Developer', value:'50', barPercent:'50%', changeClass2:'bgl-warning',changeClass:'bg-warning'},
];

const CardScheduleBlog = [
	{image: small6, title:'UX Research', cardClass:'bg-primary'},
	{image: small7, title:'Back-End Developer', cardClass:'bg-warning'},
	{image: small8, title:'Icon Design', cardClass:'bg-secondary'},
];

const contentBlog = [
	{color: '#4CBC9A', title:'Design'},
	{color: '#FFBABF', title:'Soft Skill'},
	{color: '#FEC64F', title:'Developer'},
	{color: '#FC6B57', title:'Science'}
];

const Schedule = () =>{
	return(
		<>
			<div className="row">
				<div className="col-xl-6">
					<div className="widget-heading d-flex justify-content-between align-items-center">
						<h3 className="m-0">Ongoing Class</h3>
					</div>
					<div className="row">
						{cardBlog.map((data, ind)=>(
							<div className="col-xl-6 col-xxl-12 col-sm-6" key={ind}>
								<div className="card">
									<div className="card-body">
										<div className="widget-courses align-items-center d-flex flex-wrap">
											<div className="d-flex align-items-center flex-wrap flex-1">
												<span className={`schedule-icon ${data.changeClass2}`}>{data.value}%</span>
												<div className="flex-1">
													<h4>{data.title}</h4>
													<div className="progress-box me-3">
														<div className="progress mb-0">
															<div className={`progress-bar ${data.changeClass}`} style={{width: data.barPercent, height:'12px', borderRadius:'4px'}}></div>
														</div>
													</div>
												</div>	
											</div>	
											<Link to={"#"}><i className="las la-angle-right text-secondary"></i></Link>
										</div>
									</div>
								</div>
							</div>
						))}
						
						<div className="col-xl-12 mb-4">
							<div className="widget-heading d-flex justify-content-between align-items-center">
								<h3 className="m-0">Today Schedule</h3>
							</div>
							<div className="card">
								<div className="card-body">									
									<div id="calendar" className="app-fullcalendar1"><InstructorCalendar /></div> 
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-6">
					<div className="widget-heading d-flex justify-content-between align-items-center">
						<h3 className="m-0 mt-sm-0 mt-4">Calendar</h3>
					</div>
					<div className="row">
						<div className="col-xl-12">
							<div className="card">
								<div className="card-body">
									<div className="row">
										<div className="col-xl-6 col-xxl-12">
											<div className="card-calendar style-1 process-calendar">
												<CalendarBlog />
												{/* <input type='text' className="form-control d-none" id='datetimepicker' /> */}
											</div>
										</div>
										<div className="col-xl-6 redial col-xxl-12">
											<p className="text-center">Your Progress this Month</p>
												<ScheduleRadilChart />
											<p className="my-4 text-center">Lorem ipsum dolor sit amet, adipiscing elit, sed do eiusmod tempor</p>
											<ul className="skil-list">
												{contentBlog.map((item, ind)=>(
													<li key={ind}>	
														<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
															<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke={item.color} strokeWidth="3"/>
														</svg>
														{item.title}
													</li>
												))}												
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xl-12">
							<div className="widget-heading d-flex justify-content-between align-items-center">
								<h3 className="m-0">Upcoming Schedule</h3>
								<Link to={"./instructor-schedule"} className="btn btn-primary btn-sm">View all</Link>
							</div>
							{CardScheduleBlog.map((item, ind)=>(
								<div className="card-schedule" key={ind}>
									<span className={`side-label ${item.cardClass}`}></span>
									<div className="up-comming-schedule">										
										<div>
											<h4><Link to={"#"}>{item.title}</Link></h4>
											<div className="mb-sm-0 mb-2">
												<img src={item.image} className="me-2" alt="" />
												<span>Ms. Samantha William</span>
											</div>
										</div>
										<div>
											<svg className="me-1" width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M13 2.73499H12.255V2.25C12.255 1.83999 11.92 1.5 11.505 1.5C11.09 1.5 10.755 1.83999 10.755 2.25V2.73499H8.75V2.25C8.75 1.83999 8.41501 1.5 8 1.5C7.58499 1.5 7.25 1.83999 7.25 2.25V2.73499H5.245V2.25C5.245 1.83999 4.91001 1.5 4.495 1.5C4.07999 1.5 3.745 1.83999 3.745 2.25V2.73499H3C1.48498 2.73499 0.25 3.96499 0.25 5.48498V12.75C0.25 14.265 1.48498 15.5 3 15.5H13C14.515 15.5 15.75 14.265 15.75 12.75V5.48498C15.75 3.96499 14.515 2.73499 13 2.73499ZM14.25 6.31H1.75V5.48498C1.75 4.79498 2.31 4.23499 3 4.23499H3.745V4.69C3.745 5.10498 4.07999 5.44 4.495 5.44C4.91001 5.44 5.245 5.10498 5.245 4.69V4.23499H7.25V4.69C7.25 5.10498 7.58499 5.44 8 5.44C8.41501 5.44 8.75 5.10498 8.75 4.69V4.23499H10.755V4.69C10.755 5.10498 11.09 5.44 11.505 5.44C11.92 5.44 12.255 5.10498 12.255 4.69V4.23499H13C13.69 4.23499 14.25 4.79498 14.25 5.48498V6.31Z" fill="#c7c7c7"/>
											</svg>
											<span>January 5, 2021</span>
										</div>
										<div>
											<svg className="me-1" width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
												<g clipPath="url(#clip0_1049_649)">
												<path d="M8 16.25C12.275 16.25 15.75 12.775 15.75 8.5C15.75 4.22501 12.275 0.75 8 0.75C3.72501 0.75 0.25 4.22501 0.25 8.5C0.25 12.775 3.72501 16.25 8 16.25ZM7.25 4.345C7.25 3.92999 7.58499 3.595 8 3.595C8.41501 3.595 8.75 3.92999 8.75 4.345V7.75H10.5C10.915 7.75 11.25 8.08499 11.25 8.5C11.25 8.91501 10.915 9.25 10.5 9.25H8C7.58499 9.25 7.25 8.91501 7.25 8.5V4.345Z" fill="#c7c7c7"/>
												</g>
												<defs>
												<clipPath id="clip02_1049_649">
												<rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
												</clipPath>
												</defs>
											</svg>

											<span>07.00 - 08.00 AM</span>
										</div>
										<div>
											<Link to={"./instructor-schedule"}><i className="las la-angle-right text-secondary"></i></Link>
										</div>
									</div>
								</div>
							))}							
						</div>
					</div>
				</div>
			
			</div>
		</>
	)
}
export default Schedule;