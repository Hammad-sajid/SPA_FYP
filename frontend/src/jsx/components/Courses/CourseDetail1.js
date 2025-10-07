import React,{useState}  from 'react';
import {Link} from 'react-router-dom';
import ModalVideo from 'react-modal-video'
import {Tab, Nav} from 'react-bootstrap';

import 'react-modal-video/css/modal-video.min.css';

import pic1 from './../../../images/courses/pic1.jpg';
import pic2 from './../../../images/courses/pic2.jpg';
import pic3 from './../../../images/courses/pic3.jpg';
import pic4 from './../../../images/courses/pic4.jpg';
import course1 from './../../../images/courses/course1.jpg';


function AboutTabContent({title}){
	return(
		<>
			<h4>{title}</h4>
			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
		</>
	)
}

const reviewsData = [
	{image: pic1, title:'Karen Hope', commentTime:'1 Month Ago',},
	{image: pic3, title:'Jordan Nico ', commentTime:'2 Month Ago',},
	{image: pic4, title:'Cahaya Hikari ', commentTime:'3 Month Ago',},
];

const learningData = [
	{title: 'Basic Programming' }, {title: 'Create a Website' },
	{title: 'Basic HTML & CSS' }, {title: 'Wireframe' },
	{title: 'User Interface Design' }, {title: 'Create Responsive Website' },
];

const CourseDetail1 =()=> {
	const [isOpen, setOpen] = useState(false)
	return(
		<>
			<ol className="breadcrumb">
				<li className="breadcrumb-item active">
					<Link className="d-flex align-self-center" to={"./courses"}>
						<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M8.99981 12C8.99905 11.8684 9.02428 11.7379 9.07404 11.6161C9.12381 11.4942 9.19713 11.3834 9.28981 11.29L13.2898 7.28999C13.4781 7.10168 13.7335 6.9959 13.9998 6.9959C14.2661 6.9959 14.5215 7.10168 14.7098 7.28999C14.8981 7.47829 15.0039 7.73369 15.0039 7.99999C15.0039 8.26629 14.8981 8.52168 14.7098 8.70999L11.4098 12L14.6998 15.29C14.8636 15.4813 14.9492 15.7274 14.9395 15.979C14.9298 16.2307 14.8255 16.4695 14.6474 16.6475C14.4693 16.8256 14.2305 16.93 13.9789 16.9397C13.7272 16.9494 13.4811 16.8638 13.2898 16.7L9.28981 12.7C9.10507 12.5137 9.00092 12.2623 8.99981 12Z" fill="#374557"/>
						</svg>
						Back	
					</Link>
				</li>
				
			</ol>
			
			<div className="row">
				<div className="col-xl-7">
					<div className="card  course-dedails-bx">
						<div className="card-header border-0 pb-0">
							<h2>Full-Stack Web Developer for Beginner</h2>
						</div>
						<div className="card-body pt-0">
							<div className="description">
								<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
								<ul className="d-flex align-items-center raiting flex-wrap">
									<li><span className="font-w500">5.0</span><i className="fas fa-star star-orange ms-2 me-1"></i>
										<i className="fas fa-star star-orange me-1"></i>
										<i className="fas fa-star star-orange me-1"></i>
										<i className="fas fa-star star-orange me-1"></i>
										<i className="fas fa-star star-orange"></i>
									</li>
									<li>Review (1k)</li>
									<li>10k Students</li>
								</ul>
								<div className="user-pic mb-3">
									<img src={pic2} alt="" />
									<span>Ms. Samantha William</span>
								</div>
							</div>
							<div className="course-details-tab style-2">
								<Tab.Container defaultActiveKey='Reviews'>
									<nav>
										<Nav as='div' className="nav nav-tabs justify-content-start tab-auto" id="nav-tab" role="tablist">
											<Nav.Link as='button' className="nav-link" id="nav-about-tab" eventKey='About' >About</Nav.Link>
											<Nav.Link as='button' className="nav-link active" id="nav-reviews-tab"  eventKey='Reviews'>Reviews</Nav.Link>
										</Nav>
									</nav>
									<Tab.Content >
										<Tab.Pane eventKey='About'>
											<div className="about-content">	
												<AboutTabContent title='About This Course' />
												<AboutTabContent title="Course’s Objectives" />
											</div>
										</Tab.Pane>
										<Tab.Pane eventKey='Reviews'>											
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
																	<i className="fas fa-star star-orange "></i>
																</li>
																<li>{item.commentTime}</li>
															</ul>
														</div>
													</div>
													<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
												</div>
											))}	
										</Tab.Pane>
									</Tab.Content>
								</Tab.Container>	
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-5">
					<div className="card">
						<div className="card-body">
							<div className="video-img">
								<div className="view-demo">
									<img src={course1} alt="" />
									<div className="play-button text-center">
										<Link to={'#'} className="popup-youtube" onClick={()=> setOpen(true)}>
											<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path fillRule="evenodd" clipRule="evenodd" d="M16.6154 0C7.41046 0 0 7.41043 0 16.6154V55.3846C0 64.5896 7.41046 72 16.6154 72H55.3846C64.5895 72 72 64.5896 72 55.3846V16.6154C72 7.41043 64.5895 0 55.3846 0H16.6154ZM26.259 19.3846C26.5876 19.3728 26.9098 19.4783 27.1677 19.6821L46.5523 34.9129C47.2551 35.4672 47.2551 36.5328 46.5523 37.0871C40.0921 42.1633 33.6278 47.2366 27.1677 52.3125C26.2575 53.034 24.9168 52.3814 24.9231 51.22V20.7692C24.9226 20.0233 25.5135 19.4141 26.259 19.3846Z" fill="white"/>
											</svg>										
										</Link>										
										<h4>View Demo</h4>
									</div>	
								</div>	
							</div>
							<div className="course-prise d-flex justify-content-between align-items-center flex-wrap">
								<div className="d-flex align-items-center">
									<h4 className="m-0">$49.00<small><del>$99.00</del></small></h4>
									<label className="btn btn-outline-primary ms-3 mb-0 btn-sm">Save 50%</label>
								</div>	
								
								<div className="form-check form-check-inline ps-0">
									<label className="form-check-label wish-list">
										<input type="checkbox" className="form-check-input" value="" defaultChecked="" /> 
										<i className="fa-solid fa-heart"></i>
										<span>Add to Wishlist</span>
									</label>
								</div>
							</div>
							<div className="course-learn">
								<h4>What will you learn:</h4>
								<ul>
									{learningData.map((item, index)=>(
										<li key={index}>
											<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
												<g clipPath="url(#clip0_1082_8)">
												<path d="M8 0.5C6.41775 0.5 4.87104 0.969192 3.55544 1.84824C2.23985 2.72729 1.21447 3.97672 0.608967 5.43853C0.00346629 6.90034 -0.15496 8.50887 0.153721 10.0607C0.462403 11.6126 1.22433 13.038 2.34315 14.1569C3.46197 15.2757 4.88743 16.0376 6.43928 16.3463C7.99113 16.655 9.59966 16.4965 11.0615 15.891C12.5233 15.2855 13.7727 14.2602 14.6518 12.9446C15.5308 11.629 16 10.0822 16 8.5C16 6.37827 15.1571 4.34344 13.6569 2.84315C12.1566 1.34285 10.1217 0.5 8 0.5V0.5ZM12.5467 6.57L7.52667 12.2633C7.44566 12.3546 7.34742 12.429 7.23759 12.4822C7.12776 12.5354 7.00851 12.5663 6.88667 12.5733H6.82667C6.59929 12.5747 6.3795 12.4916 6.21 12.34L3.52334 9.95667C3.33857 9.79267 3.22652 9.562 3.21182 9.31539C3.19713 9.06878 3.28101 8.82643 3.445 8.64167C3.609 8.4569 3.83967 8.34484 4.08628 8.33015C4.33289 8.31546 4.57524 8.39934 4.76 8.56333L6.76 10.3267L11.1633 5.32667C11.3269 5.14146 11.5573 5.0288 11.8039 5.01349C12.0505 4.99817 12.2931 5.08145 12.4783 5.245C12.6635 5.40855 12.7762 5.63898 12.7915 5.88559C12.8068 6.1322 12.7236 6.37479 12.56 6.56L12.5467 6.57Z" fill="#4CBC9A"/>
												</g>
												<defs>
												<clipPath id="clip00_1082_8">
												<rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
												</clipPath>
												</defs>
											</svg>
											{item.title}
										</li>
									))}
								</ul>
							</div>
						</div>
						<div className="card-footer d-flex border-0 pt-0">
							<Link to={"#"} className="btn btn-outline-light btn-md w-50 me-2">Add to Cart</Link>
							<Link to={"./ecom-product-grid"} className="btn btn-primary btn-md w-50 ms-2">Buy Now</Link>
						</div>
					</div>
				</div>
			</div>
			<ModalVideo channel='youtube' autoplay isOpen={isOpen} videoId="e6MhFghdQps" onClose={() => setOpen(false)} />
		</>
	)
}
export {AboutTabContent};
export default CourseDetail1;