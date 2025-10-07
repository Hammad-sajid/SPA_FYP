import React,{useContext, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import {Dropdown} from 'react-bootstrap';

//Import Components
import { ThemeContext } from "../../../../context/ThemeContext";
import DropDownBlog from './../DropDownBlog';
import CourseBlog from './../Dashboard/CourseBlog';
import CalendarBlog from './../Dashboard/CalendarBlog';

//images
import Educat from './../../../../images/egucation-girl.png';
import Calpng from './../../../../images/vector/calpng.png';
import Book from './../../../../images/vector/book.png';


const LearningActivityChart = loadable(() =>
	pMinDelay(import("./../Dashboard/LearningActivityChart"), 1000)
);
const ScoreActivityChart = loadable(() =>
	pMinDelay(import("./../Dashboard/ScoreActivityChart"), 1000)
);
const ProgressChart = loadable(() =>
	pMinDelay(import("./../Dashboard/ProgressChart"), 1000)
);

const Theme1 = () => {
	const { changeBackground,
			changeNavigationHader,
			chnageSidebarColor,
			changePrimaryColor,
			changeSecondaryColor,
	} = useContext(ThemeContext);
	useEffect(() => {
		changeBackground({ value: "light", label: "Light" });
		changeNavigationHader("color_7");
		chnageSidebarColor("color_7");
		changePrimaryColor("color_7");
		changeSecondaryColor("color_10");
	}, []);
	const [dropSelect, setDropSelect] = useState('This Month');
	return(
		<>
			<div className="row">
				<div className="col-xl-6 col-xxl-12">
					<div className="row">
						<div className="col-xl-12 col-xxl-6">
							<div className="card dlab-join-card h-auto">
								<div className="card-body">
									<div className="dlab-media d-flex justify-content-between">
										<div className="dlab-content">
											<h4>Join Now and Get Discount Voucher Up To 20%</h4>
											<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. </p>
										</div>	
										<div className="dlab-img">
											<img src={Educat} alt="" />
										</div>	
										<div className="dlab-icon">
											<img src={Calpng} alt="" className="cal-img" />
											<img src={Book} alt="" className="book-img" />
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xl-12 bt-order">
							<CourseBlog /> 
						</div>
						<div className="col-xl-12 col-xxl-6">
							<div className="card score-active">
								<div className="card-header border-0 flex-wrap">
									<h4>Learning Activity</h4>
									<ul className="d-flex">
										<li>
											<svg className="me-2" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke="var(--primary)" strokeWidth="3"/>
											</svg>
											Last Month
										</li>
										<li>
											<svg className="me-2" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke="var(--secondary)" strokeWidth="3"/>
											</svg>
											Last Month
										</li>
									</ul>
								</div>
								<div className="card-body pb-1 custome-tooltip style-1 py-0 ">
									<LearningActivityChart />
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-6 col-xxl-12">
					<div className="row">
						<div className="col-xl-12">
							<div className="card score-active">
								<div className="card-header border-0 pb-2 flex-wrap">
									<h4>Score Activity</h4>
									<ul className="d-flex">
										<li>
											<svg className="me-2" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke="var(--primary)" strokeWidth="3"/>
											</svg>
											Last Month
										</li>
										<li>
											<svg className="me-2" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke="var(--secondary)" strokeWidth="3"/>
											</svg>
											Last Month
										</li>
									</ul>
									<div className="d-flex align-items-center">										
										<Dropdown className='select-dropdown me-2'>
											<Dropdown.Toggle as='div' className='i-false dashboard-select  selectBtn btn-dark'>{dropSelect} <i className="fa-solid fa-angle-down ms-2" /></Dropdown.Toggle>
											<Dropdown.Menu>
												<Dropdown.Item onClick={()=>setDropSelect("This Month")}>This Month</Dropdown.Item>
												<Dropdown.Item onClick={()=>setDropSelect("This Weekly")}>This Weekly</Dropdown.Item>
												<Dropdown.Item onClick={()=>setDropSelect("This Day")}>This Day</Dropdown.Item>
											</Dropdown.Menu>
										</Dropdown>
										<DropDownBlog />
									</div>
								</div>
								<div className="card-body pb-1 custome-tooltip pt-0">
									<ScoreActivityChart />									
								</div>
							</div>
						</div>
						<div className="col-xl-4 col-lg-6">
							<div className="card">
								<div className="card-body pt-3">									
									<ProgressChart />
									<div className="redial-content">
										<h4>My Progress</h4>
										<p>Lorem ipsum dolor sit amet, consectetur</p>
										<Link to={'./course-details-2'} className="btn btn-primary">More Details</Link>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xl-8 col-lg-6">
							<div className="card">
								<div className="card-body card-calendar home-calendar">								
									<CalendarBlog />
								</div>
							</div>
						</div>
					</div>
				</div>				
			</div>	
		</>
	)
}
export default Theme1;