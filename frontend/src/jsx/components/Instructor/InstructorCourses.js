import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import {Tab, Nav} from 'react-bootstrap';

import DropDownBlog from './../Dashboard/DropDownBlog';
//import DonutChart from './Instructor/DonutChart';
//import SellingActivityChart from './Instructor/SellingActivityChart';
//import PopularClassChart from './Instructor/PopularClassChart';

import pic2 from './../../../images/courses/pic2.jpg';
import pic3 from './../../../images/courses/pic3.jpg';
import pic4 from './../../../images/courses/pic4.jpg';


const DonutChart = loadable(() =>
	pMinDelay(import("./Instructor/DonutChart"), 1000)
);
const SellingActivityChart = loadable(() =>
	pMinDelay(import("./Instructor/SellingActivityChart"), 1000)
);
const PopularClassChart = loadable(() =>
	pMinDelay(import("./Instructor/PopularClassChart"), 1000)
);

const widgetBlog = [
	{changeClass:'bg-primary', percent:'75', title:'Courses', svgBlog:'', number:'23,940',},
	{changeClass:'bg-warning', percent:'90', title:'Content', svgBlog:'', number:'94,230',},
	{changeClass:'bg-secondary', percent:'60', title:'Review', svgBlog:'', number:'32,567',},
];
const sliderData = [
	{image:pic2},
	{image:pic3},
	{image:pic4},
];

export const chartBlog = [
	{ title: 'Design', color: '#FEC64F', percent:'50', status:'763', },
	{ title: 'Programming ', color: '#FC6B57', percent:'26', status:'543',},
	{ title: 'Science ', color: '#4CBC9A', percent:'24', status:'333',},
];

const InstructorCourses = () =>{
	return(
		<>
			<div className="row">
				<div className="col-xl-9 col-xxl-8">
					<div className="row">
						{widgetBlog.map((item, ind)=>(
							<div className="col-xl-4 col-xxl-6 col-sm-6" key={ind}>
								<div className= {`card  widget-courses style-2 ${item.changeClass}`}>
									<div className="card-body">
										<div className="align-items-center d-flex justify-content-between flex-wrap">
											<div className="d-flex">
												<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M42.4001 36.2001C41.0001 36 39.6001 35.8 38.0001 35.8C33.0001 35.8 28.2001 37.2001 24.0001 40C19.8001 37.4001 15.0001 35.8 10.0001 35.8C8.60009 35.8 7.00009 36 5.60009 36.2001C4.60009 36.4001 3.80009 37.4 4.00009 38.6C4.20009 39.8 5.20009 40.4001 6.40009 40.2001C7.60009 40 8.80009 39.8 10.0001 39.8C14.6001 39.8 19.0001 41.2001 22.8001 44C23.4001 44.6 24.4001 44.6 25.2001 44C30.0001 40.6 36.0001 39.2001 41.6001 40.2001C42.6001 40.4001 43.8001 39.6 44.0001 38.6C44.2001 37.4 43.4001 36.4001 42.4001 36.2001ZM42.4001 4.20005C41.0001 4.00005 39.6001 3.80005 38.0001 3.80005C33.0001 3.80005 28.2001 5.20005 24.0001 8.00005C19.8001 5.20005 15.0001 3.80005 10.0001 3.80005C8.60009 3.80005 7.00009 4.00005 5.60009 4.20005C4.80009 4.20005 4.00009 5.20005 4.00009 6.00005V30C4.00009 31.2001 4.80009 32 6.00009 32C6.20009 32 6.20009 32 6.40009 32C7.60009 31.8 8.80009 31.6 10.0001 31.6C14.6001 31.6 19.0001 33 22.8001 35.8C23.4001 36.4 24.4001 36.4 25.2001 35.8C30.0001 32.4 36.0001 31 41.6001 32C42.6001 32.2001 43.8001 31.4 44.0001 30.4C44.0001 30.2 44.0001 30.2001 44.0001 30V6.00005C44.0001 5.20005 43.2001 4.20005 42.4001 4.20005Z" fill="white"/>
												</svg>
												<div className="ms-4">
													<h4 className="fs-18 font-w700">{item.number}</h4>
													<span>{item.title}</span>
												</div>	
											</div>	
											<div className="d-inline-block position-relative donut-chart-sale">
												<DonutChart className="donut1" value={item.percent} backgroundColor="rgba(255, 255, 255, 1)"
													backgroundColor2= "rgba(255, 255, 255, 0.1)"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
						<div className="col-xl-12">
							<Tab.Container defaultActiveKey="Insight">
								<div className="card">
									<div className="card-header border-0 pb-0 flex-wrap">
										<h4>Selling Activity</h4>
										<ul className="d-flex">
											<li className="me-3">
												<svg className="me-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="16" height="16" rx="4" fill="var(--secondary)"/>
												</svg>
												This Week
											</li>
											<li>
												<svg className="me-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect width="16" height="16" rx="4" fill="#FEC64F"/>
												</svg>
												Last Week
											</li>
										</ul>
										<div className="course-details-tab style-2 tab-lg py-0">
											<nav>
											  <Nav as='div' className="nav nav-tabs" id="nav-tab" role="tablist">
												<Nav.Link as='button' className="nav-link"  eventKey="Insight" >Insight</Nav.Link>
												<Nav.Link as='button' className="nav-link"  eventKey="Selling" >Selling</Nav.Link>												
											  </Nav>
											</nav>
										</div>
									</div>
									<div className="card-body pt-0 pb-0">
										<Tab.Content>
											<Tab.Pane eventKey="Insight" >
												<SellingActivityChart />												
											</Tab.Pane>
											<Tab.Pane eventKey="Selling" >
												<SellingActivityChart />
											</Tab.Pane>
										</Tab.Content>
									</div>
								</div>
							</Tab.Container>	
						</div>			
						<div className="col-xl-12">
							<h4 className="mb-3">User Reviews</h4>
							<Swiper className="swiper front-view-slider"
								speed= {1500}					
								slidesPerView= {3}
								spaceBetween= {20}
								loop={false}
								breakpoints = {{
									1600: {
										slidesPerView: 3,
									},
									
									1200: {
										slidesPerView: 2,
									},
									575: {
										slidesPerView: 2,
									},
									360: {
										slidesPerView: 1,
									},
								}}
							>	
								{sliderData.map((d,i)=>(
									<SwiperSlide key={i}>											
										<div className="review-box card">											
											<div className="d-flex align-items-center">
												<img src={d.image} alt="" />
												<div className="ms-3">
													<h4 className="mb-0 fs-18 font-w500">Karen Hope</h4>
													<ul className="d-flex align-items-center raiting my-0">
														<li><i className="fas fa-star star-orange me-1"></i>
															<i className="fas fa-star star-orange me-1"></i>
															<i className="fas fa-star star-orange me-1"></i>
															<i className="fas fa-star star-orange me-1"></i>
															<i className="fas fa-star star-orange"></i>
														</li>
													</ul>
												</div>
											</div>
											<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do.</p>											
										</div>										
									</SwiperSlide>
								))}				
							</Swiper>									
						</div>								
					</div>
				</div>
				
				<div className="col-xl-3 col-xxl-4">
					<div className="row">
						<div className="col-xl-12 col-md-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4>Popular Class</h4>
									<DropDownBlog />
								</div>
								<div className="card-body">
									<PopularClassChart />
									<div className="mb-3 mt-4">
										{chartBlog.map((item, ind)=>(
											<div className="d-flex justify-content-between mb-2" key={ind}>	
												<span>
													<svg className="me-3" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
													<rect width="20" height="20" rx="6" fill={item.color} />
													</svg>
													{item.title} ({item.percent}%)
												</span>
												<h6>{item.status}</h6>
											</div>
										))}
									</div>
								</div>	
							</div>
						</div>
						<div className="col-xl-12 col-md-6">
							<div className="card h-auto">
								<div className="card-header border-0 pb-2">
									<h4>Top Courses</h4>
								</div>
								<div className="card-body pt-0">
									<div className="courses-chart d-flex justify-content-between flex-wrap">
										<div className="d-flex align-items-center mb-2">
											<span className="book-icon bgl-secondary">
												<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M28.2666 24.1334C27.3332 24.0001 26.3999 23.8668 25.3332 23.8668C21.9999 23.8668 18.7999 24.8001 15.9999 26.6668C13.1999 24.9334 9.9999 23.8668 6.66656 23.8668C5.73323 23.8668 4.66656 24.0001 3.73323 24.1334C3.06656 24.2668 2.53323 24.9334 2.66656 25.7334C2.7999 26.5334 3.46656 26.9334 4.26656 26.8001C5.06656 26.6668 5.86656 26.5334 6.66656 26.5334C9.73323 26.5334 12.6666 27.4668 15.1999 29.3334C15.5999 29.7334 16.2666 29.7334 16.7999 29.3334C19.9999 27.0668 23.9999 26.1334 27.7332 26.8001C28.3999 26.9334 29.1999 26.4001 29.3332 25.7334C29.4666 24.9334 28.9332 24.2668 28.2666 24.1334ZM28.2666 2.80011C27.3332 2.66678 26.3999 2.53345 25.3332 2.53345C21.9999 2.53345 18.7999 3.46678 15.9999 5.33345C13.1999 3.46678 9.9999 2.53345 6.66656 2.53345C5.73323 2.53345 4.66656 2.66678 3.73323 2.80011C3.1999 2.80011 2.66656 3.46678 2.66656 4.00011V20.0001C2.66656 20.8001 3.1999 21.3334 3.9999 21.3334C4.13323 21.3334 4.13323 21.3334 4.26656 21.3334C5.06656 21.2001 5.86656 21.0668 6.66656 21.0668C9.73323 21.0668 12.6666 22.0001 15.1999 23.8668C15.5999 24.2668 16.2666 24.2668 16.7999 23.8668C19.9999 21.6001 23.9999 20.6668 27.7332 21.3334C28.3999 21.4668 29.1999 20.9334 29.3332 20.2668C29.3332 20.1334 29.3332 20.1334 29.3332 20.0001V4.00011C29.3332 3.46678 28.7999 2.80011 28.2666 2.80011Z" fill="var(--secondary)"/>
												</svg>
											</span>
											<div className="ms-2">
												<span>UI Design</span>
												<h4 className="fs-18 font-w600">12.345</h4>
											</div>	
										</div>	
										<svg className="mb-2" width="76" height="51" viewBox="0 0 76 51" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="14" y="8.54712" width="6" height="42.4528" rx="3" fill="#FEC64F"/>
											<rect x="42" y="29" width="6" height="22" rx="3" fill="#FEC64F"/>
											<rect x="70" y="8.54712" width="6" height="42.4528" rx="3" fill="#FEC64F"/>
											<rect x="56" width="6" height="51" rx="3" fill="#4CBC9A"/>
											<rect x="28" y="17.0376" width="6" height="33.9623" rx="3" fill="#4CBC9A"/>
											<rect y="23" width="6" height="28" rx="3" fill="#4CBC9A"/>
										</svg>
									</div>
									<div className="courses-chart d-flex justify-content-between flex-wrap">
										<div className="d-flex align-items-center mb-2">
											<span className="book-icon bgl-warning">
												<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M28.2666 24.1334C27.3332 24.0001 26.3999 23.8668 25.3332 23.8668C21.9999 23.8668 18.7999 24.8001 15.9999 26.6668C13.1999 24.9334 9.9999 23.8668 6.66656 23.8668C5.73323 23.8668 4.66656 24.0001 3.73323 24.1334C3.06656 24.2668 2.53323 24.9334 2.66656 25.7334C2.7999 26.5334 3.46656 26.9334 4.26656 26.8001C5.06656 26.6668 5.86656 26.5334 6.66656 26.5334C9.73323 26.5334 12.6666 27.4668 15.1999 29.3334C15.5999 29.7334 16.2666 29.7334 16.7999 29.3334C19.9999 27.0668 23.9999 26.1334 27.7332 26.8001C28.3999 26.9334 29.1999 26.4001 29.3332 25.7334C29.4666 24.9334 28.9332 24.2668 28.2666 24.1334ZM28.2666 2.80011C27.3332 2.66678 26.3999 2.53345 25.3332 2.53345C21.9999 2.53345 18.7999 3.46678 15.9999 5.33345C13.1999 3.46678 9.9999 2.53345 6.66656 2.53345C5.73323 2.53345 4.66656 2.66678 3.73323 2.80011C3.1999 2.80011 2.66656 3.46678 2.66656 4.00011V20.0001C2.66656 20.8001 3.1999 21.3334 3.9999 21.3334C4.13323 21.3334 4.13323 21.3334 4.26656 21.3334C5.06656 21.2001 5.86656 21.0668 6.66656 21.0668C9.73323 21.0668 12.6666 22.0001 15.1999 23.8668C15.5999 24.2668 16.2666 24.2668 16.7999 23.8668C19.9999 21.6001 23.9999 20.6668 27.7332 21.3334C28.3999 21.4668 29.1999 20.9334 29.3332 20.2668C29.3332 20.1334 29.3332 20.1334 29.3332 20.0001V4.00011C29.3332 3.46678 28.7999 2.80011 28.2666 2.80011Z" fill="#FEC64F"/>
												</svg>
											</span>
											<div className="ms-2">
												<span>UI Design</span>
												<h4 className="fs-18 font-w600">12.345</h4>
											</div>	
										</div>	
										<svg className="mb-2" width="76" height="38" viewBox="0 0 76 38" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect opacity="0.5" x="76" width="6" height="76" rx="3" transform="rotate(90 76 0)" fill="#DBDBDB"/>
											<rect opacity="0.5" x="76" y="16" width="6" height="76" rx="3" transform="rotate(90 76 16)" fill="#DBDBDB"/>
											<rect opacity="0.5" x="76" y="32" width="6" height="76" rx="3" transform="rotate(90 76 32)" fill="#DBDBDB"/>
											<rect x="44.6089" width="6" height="44.6087" rx="3" transform="rotate(90 44.6089 0)" fill="#4CBC9A"/>
											<rect x="30.5654" y="16" width="6" height="30.5652" rx="3" transform="rotate(90 30.5654 16)" fill="#FEC64F"/>
											<rect x="59.478" y="32" width="6" height="59.4783" rx="3" transform="rotate(90 59.478 32)" fill="#4CBC9A"/>
										</svg>
									</div>
								</div>	
							</div>
						</div>
					</div>
				</div>
				
			</div>
					
		</>
		
	)
}
export default InstructorCourses;