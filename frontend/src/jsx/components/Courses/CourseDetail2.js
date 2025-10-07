import React,{useState}  from 'react';
import {Link} from 'react-router-dom';
import ModalVideo from 'react-modal-video'
import {Tab, Nav, Accordion} from 'react-bootstrap';
import 'react-modal-video/css/modal-video.min.css';

import {AboutTabContent} from './CourseDetail1'; 
import DropDownBlog from './../Dashboard/DropDownBlog';
//Images
import videoimg from './../../../images/courses/video-img.jpg';
import pic3 from './../../../images/courses/pic3.jpg';
import pic4 from './../../../images/courses/pic4.jpg';

const reviewsData = [
	{image: pic3, title:'Jordan Nico ', commentTime:'2 Month Ago',},
	{image: pic4, title:'Cahaya Hikari ', commentTime:'3 Month Ago',},
];

const accordionBlog = [
	{title: 'Video Courses' },
	{title: 'Audio' },
	{title: 'Module' },
	{title: 'Quiz' },
];

const SmallCardBlog =({title})=>{
	return(
		<div className="acc-courses">
			<div className="d-flex justify-content-between align-items-center">
				<div className="d-flex align-items-center">
					<span className="acc-icon">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M11.3337 6V4.66666C11.3337 2.79999 9.86699 1.33333 8.00033 1.33333C6.13366 1.33333 4.66699 2.79999 4.66699 4.66666V6C3.53366 6 2.66699 6.86666 2.66699 8V12.6667C2.66699 13.8 3.53366 14.6667 4.66699 14.6667H11.3337C12.467 14.6667 13.3337 13.8 13.3337 12.6667V8C13.3337 6.86666 12.467 6 11.3337 6ZM6.00033 4.66666C6.00033 3.53333 6.86699 2.66666 8.00033 2.66666C9.13366 2.66666 10.0003 3.53333 10.0003 4.66666V6H6.00033V4.66666ZM8.66699 11.3333C8.66699 11.7333 8.40033 12 8.00033 12C7.60033 12 7.33366 11.7333 7.33366 11.3333V9.33333C7.33366 8.93333 7.60033 8.66666 8.00033 8.66666C8.40033 8.66666 8.66699 8.93333 8.66699 9.33333V11.3333Z" fill="#374557"/>
					</svg>
					</span>	
					<h4 className="m-0">{title}</h4>
				</div>	
				<span>1:00</span>
			</div>
		</div>
	)
}

const CourseDetail2 =()=> {
	const [isOpen, setOpen] = useState(false);
	const [activeDefault, setActiveDefault] = useState(0);
	return(
		<>
			<div className="row">
				<div className="col-xl-8 col-xxl-7">
					<div className="card">
						<div className="card-body">
							<div className="course-content d-flex justify-content-between flex-wrap">
								<div>
									<h3>Full-Stack Web Developer</h3>
									<ul className="d-flex align-items-center raiting my-0 flex-wrap">
										<li><span className="font-w500">5.0</span><i className="fas fa-star text-orange ms-2"></i>
										</li>
										<li>Review (1k)</li>
										<li>10k Students</li>
									</ul>
								</div>
								<div className="mt-2">
									<svg width="20" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M19.5 3.35248H18.3825V2.625C18.3825 2.00999 17.88 1.5 17.2575 1.5C16.635 1.5 16.1325 2.00999 16.1325 2.625V3.35248H13.125V2.625C13.125 2.00999 12.6225 1.5 12 1.5C11.3775 1.5 10.875 2.00999 10.875 2.625V3.35248H7.86749V2.625C7.86749 2.00999 7.36501 1.5 6.74249 1.5C6.11998 1.5 5.61749 2.00999 5.61749 2.625V3.35248H4.5C2.22748 3.35248 0.375 5.19749 0.375 7.47748V18.375C0.375 20.6475 2.22748 22.5 4.5 22.5H19.5C21.7725 22.5 23.625 20.6475 23.625 18.375V7.47748C23.625 5.19749 21.7725 3.35248 19.5 3.35248ZM21.375 8.715H2.625V7.47748C2.625 6.44248 3.465 5.60248 4.5 5.60248H5.61749V6.285C5.61749 6.90747 6.11998 7.41 6.74249 7.41C7.36501 7.41 7.86749 6.90747 7.86749 6.285V5.60248H10.875V6.285C10.875 6.90747 11.3775 7.41 12 7.41C12.6225 7.41 13.125 6.90747 13.125 6.285V5.60248H16.1325V6.285C16.1325 6.90747 16.635 7.41 17.2575 7.41C17.88 7.41 18.3825 6.90747 18.3825 6.285V5.60248H19.5C20.535 5.60248 21.375 6.44248 21.375 7.47748V8.715Z" fill="#c7c7c7"/>
									</svg>

									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M15.0005 5.25H6.00049C5.6028 5.25045 5.22154 5.40864 4.94033 5.68984C4.65912 5.97105 4.50094 6.35231 4.50049 6.75V21C4.50049 21.1378 4.53846 21.2729 4.61023 21.3906C4.682 21.5082 4.7848 21.6038 4.90733 21.6669C5.02986 21.7299 5.1674 21.758 5.30485 21.748C5.44229 21.738 5.57433 21.6904 5.68646 21.6103L10.4998 18.1717L15.3146 21.6103C15.4267 21.6904 15.5588 21.7381 15.6962 21.748C15.8336 21.758 15.9712 21.7299 16.0937 21.6669C16.2162 21.6038 16.319 21.5082 16.3908 21.3906C16.4625 21.2729 16.5005 21.1378 16.5005 21V6.75C16.5 6.35231 16.3419 5.97105 16.0606 5.68984C15.7794 5.40864 15.3982 5.25045 15.0005 5.25Z" fill="#c7c7c7"/>
									<path d="M18.0005 2.25H8.25049C8.05158 2.25 7.86081 2.32902 7.72016 2.46967C7.57951 2.61032 7.50049 2.80109 7.50049 3C7.50049 3.19891 7.57951 3.38968 7.72016 3.53033C7.86081 3.67098 8.05158 3.75 8.25049 3.75H18.0005V18C18.0005 18.1989 18.0795 18.3897 18.2202 18.5303C18.3608 18.671 18.5516 18.75 18.7505 18.75C18.9494 18.75 19.1402 18.671 19.2808 18.5303C19.4215 18.3897 19.5005 18.1989 19.5005 18V3.75C19.5 3.35231 19.3419 2.97105 19.0606 2.68984C18.7794 2.40864 18.3982 2.25045 18.0005 2.25Z" fill="#c7c7c7"/>
									</svg>

									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.7001 14.1C18.5001 14 18.2001 14 18.0001 14C16.8001 14 15.7001 14.5 14.9001 15.5L9.80011 13.2C10.0001 12.5 10.0001 11.7 9.80011 10.9L14.9001 8.6C16.3001 10.3 18.8001 10.5 20.5001 9.1C22.2001 7.7 22.4001 5.2 21.0001 3.5C19.6001 1.8 17.1001 1.6 15.4001 3C14.5001 3.7 14.0001 4.8 14.0001 6C14.0001 6.2 14.0001 6.5 14.1001 6.7L8.80011 9.1C7.20011 7.6 4.70011 7.6 3.10011 9.2C1.60011 10.8 1.60011 13.3 3.20011 14.9C4.80011 16.4 7.20011 16.4 8.80011 14.9L14.1001 17.3C13.7001 19.5 15.1001 21.6 17.3001 21.9C19.5001 22.3 21.6001 20.9 21.9001 18.7C22.3001 16.5 20.9001 14.5 18.7001 14.1Z" fill="#c7c7c7"/>
									</svg>

								</div>
							</div>
							<div className="video-img style-1">
								<div className="view-demo">
									<img src={videoimg} alt="" />
									<div className="play-button text-center">
										<Link to={'#'} className="popup-youtube" onClick={()=> setOpen(true)}>
											<svg width="96" height="96" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path fillRule="evenodd" clipRule="evenodd" d="M16.6154 0C7.41046 0 0 7.41043 0 16.6154V55.3846C0 64.5896 7.41046 72 16.6154 72H55.3846C64.5895 72 72 64.5896 72 55.3846V16.6154C72 7.41043 64.5895 0 55.3846 0H16.6154ZM26.259 19.3846C26.5876 19.3728 26.9098 19.4783 27.1677 19.6821L46.5523 34.9129C47.2551 35.4672 47.2551 36.5328 46.5523 37.0871C40.0921 42.1633 33.6278 47.2366 27.1677 52.3125C26.2575 53.034 24.9168 52.3814 24.9231 51.22V20.7692C24.9226 20.0233 25.5135 19.4141 26.259 19.3846Z" fill="white"/>
											</svg>
										</Link>
									</div>	
								</div>	
							</div>
							<Tab.Container defaultActiveKey='About'>
								<div className="course-details-tab style-2 mt-4">
									<nav>
										<Nav as='div' className="nav nav-tabs tab-auto" id="nav-tab">
											<Nav.Link as='button' className="nav-link" id="nav-about-tab" eventKey='About' type="button">About</Nav.Link>
											<Nav.Link as='button' className="nav-link" id="nav-reviews-tab" eventKey='Review' type="button">Reviews</Nav.Link>
											<Nav.Link as='button' className="nav-link" id="nav-discussion-tab" eventKey='Discussion' type="button">Discussion</Nav.Link>
										</Nav>
									</nav>
									<Tab.Content className="tab-content" id="nav-tabContent">
										<Tab.Pane  id="nav-about" eventKey='About'>
											<div className="about-content">
												<h4>About This Course</h4>
												<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
												Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
												<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
											</div>
										</Tab.Pane>
										<Tab.Pane eventKey='Review'>
											{reviewsData.map((item, index)=>(
												<div className="user-pic2" key={index}>
													<div className="d-flex align-items-center">
														<img src={item.image} alt="" />
														<div className="ms-3">
															<h4>{item.title}</h4>
															<ul className="d-flex align-items-center raiting my-0 flex-wrap">
																<li><span className="font-w500">5.0</span><i className="fas fa-star star-orange ms-2 me-1"></i>
																	<i className="fas fa-star star-orange me-1"></i>
																	<i className="fas fa-star star-orange me-1"></i>
																	<i className="fas fa-star star-orange me-1"></i>
																	<i className="fas fa-star star-orange"></i>
																</li>
																<li>{item.commentTime}</li>
															</ul>
														</div>
													</div>
													<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
												</div>
											))}
										</Tab.Pane>
										<Tab.Pane id="nav-discussion" eventKey='Discussion'>
											<div className="about-content">
												<AboutTabContent title='About This Course' />
												<AboutTabContent title="Course’s Objectives" />
											</div>
										</Tab.Pane>
									</Tab.Content>
								</div>
							
							</Tab.Container>	
						</div>	
					</div>
				</div>
				<div className="col-xl-4 col-xxl-5">
					<div className="card h-auto">
						<div className="card-header border-0 pb-0">
							<h4>Progress</h4>
							<DropDownBlog />
						</div>
						<div className="card-body pt-0">
							<div className="progress-box">
								<div className="progress ">
									<div className="progress-bar bg-primary" style={{width:'15%', height:'12px', borderRadius:'4px' }} role="progressbar"></div>
								</div>
								
								<div className="d-flex align-items-center justify-content-between">
									<h5 className="mb-0 fs-14 font-w600">Full-Stack Web Developer</h5>
									<span className="font-w600">10/110</span>
								</div>
							</div>
						</div>
					</div>
					<div className="custome-accordion">
						<Accordion className="accordion" defaultActiveKey="0">	
							{accordionBlog.map((data,i)=>(
								<Accordion.Item className="card" key={i} eventKey={`${i}`}>
									<Accordion.Header as="h2" className="accordion-header border-0">
										<span className="acc-heading">{data.title}</span>
										<span className="ms-auto">(1/110)</span>
									</Accordion.Header>    
									<Accordion.Collapse eventKey={`${i}`} id="collapseOne" >
										<div className="accordion-body card-body pt-0">
											<div className="acc-courses active">
												<div className="d-flex justify-content-between align-items-center">
													<div className="d-flex align-items-center">
														<span className="acc-icon">
															<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M4 13C3.817 13 3.635 12.95 3.474 12.851C3.32918 12.7611 3.20965 12.6358 3.12671 12.4869C3.04378 12.338 3.00016 12.1704 3 12V4C3 3.653 3.18 3.331 3.474 3.149C3.61914 3.05976 3.7846 3.00891 3.95481 3.00121C4.12502 2.99351 4.29439 3.02923 4.447 3.105L12.447 7.105C12.6131 7.1882 12.7528 7.31599 12.8504 7.47405C12.948 7.63212 12.9997 7.81423 12.9997 8C12.9997 8.18578 12.948 8.36789 12.8504 8.52595C12.7528 8.68402 12.6131 8.8118 12.447 8.895L4.447 12.895C4.307 12.965 4.152 13 4 13Z" fill="var(--primary)"/>
															</svg>
														</span>	
														<h4 className="m-0">Introduction</h4>
													</div>	
													<span>1:00</span>
												</div>
											</div>
											<SmallCardBlog title='Getting Started' />
											<SmallCardBlog title='Tools' />
											<SmallCardBlog title='Install Tools' />
											<SmallCardBlog title='Plugins' />										
										</div>
									</Accordion.Collapse>	
								</Accordion.Item>
								
							))}
						</Accordion>
					</div>						
				</div>
			</div>	
			<ModalVideo channel='youtube' autoplay isOpen={isOpen} videoId="e6MhFghdQps" onClose={() => setOpen(false)} />
		</>
	)
}
export default CourseDetail2;