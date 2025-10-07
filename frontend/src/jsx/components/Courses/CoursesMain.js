import React  from 'react';
import {Link} from 'react-router-dom';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

//images
import palette from './../../../images/svg/color-palette.svg';
import education from './../../../images/svg/education-website.svg';
import brain from './../../../images/svg/brain.svg';
import microscope from './../../../images/svg/microscope.svg';
import course1 from './../../../images/courses/course1.jpg';
import course2 from './../../../images/courses/course2.jpg';
import course3 from './../../../images/courses/course3.jpg';
import course4 from './../../../images/courses/course4.jpg';
import course5 from './../../../images/courses/course5.jpg';
import course6 from './../../../images/courses/course6.jpg';

const widgetData = [
	{ image: palette, title:'Graphic', },
	{ image: education, title:'Coading', },
	{ image: brain, title:'Soft Skill', },
	{ image: microscope, title:'Science', },
];

const cardInfoBlog = [
	{title:'Fullstack Developer',	subtitle: 'Karen Hope ', image: course1},
	{title:'UI Design Beginner', 	subtitle: 'Jack and Sally', image: course2},
	{title:'How to be Freelancer', 	subtitle: 'Cahaya Hikari', image: course3},
	{title:'UX Research', 			subtitle: 'Johnny Ahmad', image: course4},
	{title:'Basic Web Design',		subtitle: 'Jordan Nico', image: course5},
	{title:'3D Character Design',	subtitle: 'Samantha William ', image: course6},
];

function CoursesMain(){
	return(
		<>
			<div className="widget-heading d-flex justify-content-between align-items-center">
				<h3 className="m-0">Popular This Week</h3>
				<Link to={"./courses"} className="btn btn-primary btn-sm">View all</Link>
			</div>
			<div className="row">
				<Swiper className="swiper course-slider"	
					speed= {1500}					
					slidesPerView= {4}
					spaceBetween= {20}
					loop={false}
					breakpoints = {{
						1600: {
							slidesPerView: 4,
						},
						
						1200: {
							slidesPerView: 3,
						},
						575: {
							slidesPerView: 2,
						},
						360: {
							slidesPerView: 1,
						},
					}}
				>	
					{widgetData.map((d,i)=>(
						<SwiperSlide key={i}>	
							<div className="card">
								<div className="card-body">
									<div className="widget-courses align-items-center d-flex justify-content-between flex-wrap">
										<div className="d-flex align-items-center flex-wrap">
											<img src={d.image} alt="" />
											<div className="flex-1 ms-3">
												<h4>{d.title}</h4>
												<span>Lorem ipsum dolor</span>
											</div>	
										</div>	
										<Link to={"#"}><i className="las la-angle-right text-primary"></i></Link>
									</div>
								</div>
							</div>
						</SwiperSlide>
					))}				
				</Swiper>			
			</div>
			<div className="widget-heading d-flex justify-content-between align-items-center">
				<h3 className="m-0">All Courses</h3>
				<Link to={"./courses"} className="btn btn-primary btn-sm">View all</Link>
			</div>
			<div className="row">
				{cardInfoBlog.map((data, index)=>(
					<div className="col-xl-4 col-md-6" key={index}>
						<div className="card all-crs-wid">
							<div className="card-body">
								<div className="courses-bx">
									<div className="dlab-media">
										<img src={data.image} alt="" />
									</div>
									<div className="dlab-info">
										<div className="dlab-title d-flex justify-content-between">
											<div>
												<h4><Link to={"./course-details-1"}>{data.title}</Link></h4>
												<p className="m-0">{data.subtitle}
													<svg className="ms-1" width="4" height="5" viewBox="0 0 4 5" fill="none" xmlns="http://www.w3.org/2000/svg">
														<circle cx="2" cy="2.5" r="2" fill="#DBDBDB"/>
													</svg>
													<span>5.0<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M8 0.5L9.79611 6.02786H15.6085L10.9062 9.44427L12.7023 14.9721L8 11.5557L3.29772 14.9721L5.09383 9.44427L0.391548 6.02786H6.20389L8 0.5Z" fill="#FEC64F"/>
													</svg>
													</span>
												</p>
											</div>	
											<h4 className="text-primary"><span>$</span>50.99</h4>
										</div>
										<div className="d-flex justify-content-between content align-items-center">
											<span>
												<svg className="me-2" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M21.2 18.6C20.5 18.5 19.8 18.4 19 18.4C16.5 18.4 14.1 19.1 12 20.5C9.90004 19.2 7.50005 18.4 5.00005 18.4C4.30005 18.4 3.50005 18.5 2.80005 18.6C2.30005 18.7 1.90005 19.2 2.00005 19.8C2.10005 20.4 2.60005 20.7 3.20005 20.6C3.80005 20.5 4.40005 20.4 5.00005 20.4C7.30005 20.4 9.50004 21.1 11.4 22.5C11.7 22.8 12.2 22.8 12.6 22.5C15 20.8 18 20.1 20.8 20.6C21.3 20.7 21.9 20.3 22 19.8C22.1 19.2 21.7 18.7 21.2 18.6ZM21.2 2.59999C20.5 2.49999 19.8 2.39999 19 2.39999C16.5 2.39999 14.1 3.09999 12 4.49999C9.90004 3.09999 7.50005 2.39999 5.00005 2.39999C4.30005 2.39999 3.50005 2.49999 2.80005 2.59999C2.40005 2.59999 2.00005 3.09999 2.00005 3.49999V15.5C2.00005 16.1 2.40005 16.5 3.00005 16.5C3.10005 16.5 3.10005 16.5 3.20005 16.5C3.80005 16.4 4.40005 16.3 5.00005 16.3C7.30005 16.3 9.50004 17 11.4 18.4C11.7 18.7 12.2 18.7 12.6 18.4C15 16.7 18 16 20.8 16.5C21.3 16.6 21.9 16.2 22 15.7C22 15.6 22 15.6 22 15.5V3.49999C22 3.09999 21.6 2.59999 21.2 2.59999Z" fill="#c7c7c7"/>
												</svg>
												110+ Content
											</span>
											<Link to={"./courses"} className="btn btn-primary btn-sm">View all</Link>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
				
			</div>	
			<div className="pagination-down">
				<div className="d-flex align-items-center justify-content-between flex-wrap">
					<h4 className="sm-mb-0 mb-3">Showing <span>1-6 </span>from <span>100 </span>data</h4>
					<ul>
						<li><Link to={"#"}><i className="fas fa-chevron-left"></i></Link></li>
						<li><Link to={"#"} className="active">1</Link></li>
						<li><Link to={"#"}>2</Link></li>
						<li><Link to={"#"}>3</Link></li>
						<li><Link to={"#"}><i className="fas fa-chevron-right"></i></Link></li>
					</ul>
				</div>
			</div>
		</>
	
	)
}
export default CoursesMain;