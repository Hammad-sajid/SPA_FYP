import React,{useState} from 'react';
import {Link} from 'react-router-dom';

import InstructorCalendar from './Instructor/InstructorCalendar';

import pic8 from './../../../images/courses/pic8.jpg';
import pic7 from './../../../images/courses/pic7.jpg';
import pic6 from './../../../images/courses/pic6.jpg';
import pic5 from './../../../images/courses/pic5.jpg';

const cardSchedule = [
	{image:pic8,  cardClass:'bg-primary'},
	{image:pic7,  cardClass:'bg-warning'},
	{image:pic6,  cardClass:'bg-info'},
	{image:pic5,  cardClass:'bg-success'},
];

const InstructorSchedule = () =>{
	return(
		<>
			<div className="row">
				<div className="col-xl-9 col-xxl-8">
					<div className="card">
						<div className="card-body">
							<InstructorCalendar />
							{/* <div id="calendar" className="app-fullcalendar"></div> */}
						</div>	
					</div>	
				</div>	
				<div className="col-xl-3 col-xxl-4">
					<div className="row">
						<div className="col-xl-12 col-sm-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4>Upcoming Schedule</h4>
								</div>
								<div className="card-body pt-0">
									{cardSchedule.map((item,ind)=>(
										<div className="card-schedule" key={ind}>
											<span className={`side-label ${item.cardClass}`}></span>
											<div className="up-comming-schedule style-1">
												<div className="date-box">
													<span>5 </span>
													<span>jan</span>
												</div>
												<div className="flex-1">
													<h4 className="mb-0"><Link to={"#"}>UX Research</Link></h4>
													<svg className="me-1" width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M13 2.73499H12.255V2.25C12.255 1.83999 11.92 1.5 11.505 1.5C11.09 1.5 10.755 1.83999 10.755 2.25V2.73499H8.75V2.25C8.75 1.83999 8.41501 1.5 8 1.5C7.58499 1.5 7.25 1.83999 7.25 2.25V2.73499H5.245V2.25C5.245 1.83999 4.91001 1.5 4.495 1.5C4.07999 1.5 3.745 1.83999 3.745 2.25V2.73499H3C1.48498 2.73499 0.25 3.96499 0.25 5.48498V12.75C0.25 14.265 1.48498 15.5 3 15.5H13C14.515 15.5 15.75 14.265 15.75 12.75V5.48498C15.75 3.96499 14.515 2.73499 13 2.73499ZM14.25 6.31H1.75V5.48498C1.75 4.79498 2.31 4.23499 3 4.23499H3.745V4.69C3.745 5.10498 4.07999 5.44 4.495 5.44C4.91001 5.44 5.245 5.10498 5.245 4.69V4.23499H7.25V4.69C7.25 5.10498 7.58499 5.44 8 5.44C8.41501 5.44 8.75 5.10498 8.75 4.69V4.23499H10.755V4.69C10.755 5.10498 11.09 5.44 11.505 5.44C11.92 5.44 12.255 5.10498 12.255 4.69V4.23499H13C13.69 4.23499 14.25 4.79498 14.25 5.48498V6.31Z" fill="#c7c7c7"></path>
													</svg>
													<span className='ms-1'>January 5, 2021</span>
												</div>
												<div>
													<i className="las la-angle-right text-secondary"></i>
												</div>
											</div>
										</div>
									))}				
								</div>	
							</div>	
						</div>
						<div className="col-xl-12 col-sm-6">
							<div className="card">
								<div className="card-header pb-0 border-0">
									<h4>Upcoming Task</h4>
								</div>
								<div className="card-body pt-0">
									{cardSchedule.map((item,ind)=>(
										<div className="upcomming-task-widget d-flex justify-content-between" key={ind}>
											<div className="d-flex">
												<img src={item.image} alt="" />
												<div>
													<span>Kevin</span>
													<h5>Web Design</h5>
												</div>
											</div>
											<div className="">
												<span className="fs-12">17/07/2022</span>
												<span className="font-w600 text-end text-primary">2 Days</span>												
											</div>
										</div>		
									))}
								</div>	
							</div>	
								
						</div>	
					</div>
				</div>						
			</div>	
		</>
	)
}
export default InstructorSchedule;