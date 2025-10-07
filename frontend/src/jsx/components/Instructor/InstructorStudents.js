import React,{useRef, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";

import DropDownBlog from './../Dashboard/DropDownBlog'; 
//import StudentApexLineChart from './Instructor/StudentApexLineChart';
//import UserApexLineChart from './Instructor/UserApexLineChart';
//import StudentsActivityApex from './Instructor/StudentsActivityApex';

import pic3 from './../../../images/courses/pic3.jpg';
import pic2 from './../../../images/courses/pic2.jpg';
import pic4 from './../../../images/courses/pic4.jpg';


const StudentApexLineChart = loadable(() =>
	pMinDelay(import("./Instructor/StudentApexLineChart"), 1000)
);
const UserApexLineChart = loadable(() =>
	pMinDelay(import("./Instructor/UserApexLineChart"), 1000)
);
const StudentsActivityApex = loadable(() =>
	pMinDelay(import("./Instructor/StudentsActivityApex"), 1000)
);

const studentTableBlog =[
	{image: pic3, title: 'Karen Hope', status:'On Progress', changeClass:'badge-warning'},
	{image: pic2 , title: 'Jordan Nico', status:'No Progress', changeClass:'badge-primary' },
	{image: pic4, title: 'Johnny Ahmad', status:'Completed', changeClass:'badge-success'},
];

const InstructorStudents = () =>{
	
	const [data, setData] = useState(
		document.querySelectorAll("#student_wrapper tbody tr")
	);
	const sort = 3;
	const activePag = useRef(0);
	const [test, settest] = useState(0);

	// Active data
	const chageData = (frist, sec) => {
		for (var i = 0; i < data.length; ++i) {
			if (i >= frist && i < sec) {
				data[i].classList.remove("d-none");
			} else {
				data[i].classList.add("d-none");
			}
		}
	};
   // use effect
   useEffect(() => {
      setData(document.querySelectorAll("#student_wrapper tbody tr"));
      //chackboxFun();
	}, [test]);

  
   // Active pagginarion
   activePag.current === 0 && chageData(0, sort);
   // paggination
   let paggination = Array(Math.ceil(data.length / sort))
      .fill()
      .map((_, i) => i + 1);

   // Active paggination & chage data
	const onClick = (i) => {
		activePag.current = i;
		chageData(activePag.current * sort, (activePag.current + 1) * sort);
		settest(i);
	};

	
	
	return(
		<>
			<div className="row">
				<div className="col-xl-3 col-sm-6">
					<div className="card bg-secondary">
						<div className="card-body">
							<div className="student-box d-flex justify-content-between align-items-center flex-wrap">
								<div>
									<span className="student-icon">
										<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M14.1665 19.1666C17.8331 19.1666 20.8331 16.1666 20.8331 12.4999C20.8331 8.83325 17.8331 5.83325 14.1665 5.83325C10.4998 5.83325 7.49981 8.83325 7.49981 12.4999C7.49981 16.1666 10.4998 19.1666 14.1665 19.1666ZM21.6665 17.6666C24.4998 19.9999 28.6665 19.4999 30.9998 16.6666C33.3331 13.8333 32.8331 9.66659 29.9998 7.33325C28.8331 6.33325 27.3331 5.83325 25.8331 5.83325C24.3331 5.83325 22.8331 6.33325 21.6665 7.33325C24.4998 9.66659 24.9998 13.6666 22.6665 16.6666C22.4998 16.9999 21.9998 17.3333 21.6665 17.6666ZM38.1665 32.3333C37.1665 26.1666 31.9998 21.6666 25.8331 21.6666C24.3331 21.6666 22.9998 21.8333 21.6665 22.3333C25.9998 23.8333 29.1665 27.6666 29.8331 32.1666C29.9998 32.9999 29.3331 33.9999 28.3331 33.9999H28.1665H36.4998C37.4998 33.9999 38.1665 33.3333 38.1665 32.3333C38.1665 32.4999 38.1665 32.3333 38.1665 32.3333ZM14.1665 21.6666C7.99981 21.6666 2.66647 26.1666 1.83314 32.3333C1.66647 33.1666 2.33314 34.1666 3.33314 34.1666H3.49981H24.8331C25.8331 34.1666 26.4998 33.4999 26.4998 32.4999V32.3333C25.6665 26.1666 20.3331 21.6666 14.1665 21.6666Z" fill="var(--secondary)"/>
										</svg>
									</span>
									<h4>43.322</h4>
									<span className="pb-3 d-block">Total Students</span>
								</div>
								<StudentApexLineChart />
							</div>
						</div>
					</div>
				</div>	
				<div className="col-xl-3 col-sm-6">
					<div className="card overflow-hidden">
						<div className="card-header border-0 pb-0">
							<h4>New Users</h4>
						</div>
						<div className="card-body pt-0">
							<div className="student-box d-flex justify-content-between align-items-center flex-wrap">
								<div>
									<h4 className="fw-normal mb-3">+12.890</h4>
									<span className="text-secondary " >
										<svg className="me-1" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M23.25 12C23.25 5.775 18.225 0.75 12 0.75C5.775 0.749999 0.75 5.775 0.75 12C0.749999 18.225 5.775 23.25 12 23.25C18.225 23.25 23.25 18.225 23.25 12ZM11.25 16.575L11.25 9.675L9.3 11.4C8.85 11.775 8.25 11.7 7.875 11.325C7.725 11.1 7.65 10.875 7.65 10.65C7.65 10.35 7.8 10.05 8.025 9.9L11.625 6.75C11.7 6.675 11.775 6.675 11.85 6.6C11.925 6.6 11.925 6.6 12 6.525C12.075 6.525 12.075 6.525 12.15 6.525L12.225 6.525C12.3 6.525 12.3 6.525 12.375 6.525L12.45 6.525C12.525 6.525 12.525 6.525 12.6 6.6C12.6 6.6 12.675 6.6 12.675 6.675L12.75 6.75C12.75 6.75 12.75 6.75 12.825 6.825L15.975 10.05C16.35 10.425 16.35 11.1 15.975 11.475C15.6 11.85 14.925 11.85 14.55 11.475L13.125 9.975L13.125 16.65C13.125 17.175 12.675 17.7 12.075 17.7C11.7 17.55 11.25 17.1 11.25 16.575Z" fill="var(--secondary)"/>
										</svg>
									+15%</span>
								</div>
								<UserApexLineChart />
							</div>
						</div>
					</div>
				</div>	
				<div className="col-xl-6 col-sm-12">
					<div className="card">
						<div className="card-header border-0 pb-2 flex-wrap">
							<h4>Students Activity</h4>
							<div className="d-flex align-items-center">
								<ul className="d-flex">
									<li className="me-3">
										<svg className="me-2" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
										<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke="#FEC64F" strokeWidth="3"></rect>
										</svg>
										Last Month
									</li>
									<li className="ms-3">
										<svg className="me-2" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
										<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" fill="white" stroke="#4CBC9A" strokeWidth="3"></rect>
										</svg>
										Last Month
									</li>
								</ul>
								<div className="d-flex align-items-center ms-5">
									<DropDownBlog />
								</div>
							</div>	
						</div>
						<div className="card-body pb-1 custome-tooltip pt-0 ps-0">
							<div id="studentsActivity"></div>
							<StudentsActivityApex />
						</div>
					</div>
				</div>	
				<div className="col-xl-12">
					<div className="card students-list">
						<div className="card-header border-0 flex-wrap pb-0">
							<h4>Students List</h4>
							<div className="input-group search-area w-auto">
								<span className="input-group-text"><Link to={"#"}><svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M27.414 24.586L22.337 19.509C23.386 17.928 24 16.035 24 14C24 8.486 19.514 4 14 4C8.486 4 4 8.486 4 14C4 19.514 8.486 24 14 24C16.035 24 17.928 23.386 19.509 22.337L24.586 27.414C25.366 28.195 26.634 28.195 27.414 27.414C28.195 26.633 28.195 25.367 27.414 24.586ZM7 14C7 10.14 10.14 7 14 7C17.86 7 21 10.14 21 14C21 17.86 17.86 21 14 21C10.14 21 7 17.86 7 14Z" fill="var(--primary)"></path>
									</svg>
									</Link>
								</span>
								<input type="text" className="form-control" placeholder="Search here..." />
							</div>
						</div>
						<div className="card-body py-0">
							<div className="table-responsive" >
								<div  id="student_wrapper" className="dataTables_wrapper no-footer">
									<table className="table display mb-4 dataTablesCard order-table card-table text-black application " id="application-tbl1_next">
										<thead>
											<tr>
												<th>Name</th>
												<th>Student ID</th>
												<th>Courses</th>
												<th>Join Date</th>
												<th>Status</th>
												<th></th>
											</tr>
										</thead>
										<tbody>
											{studentTableBlog.map((item, index)=>(
												<tr key={index}>
													<td>
														<div className="d-flex align-items-center">
															<img src={item.image} alt="" />
															<h4 className="mb-0 fs-16 font-w500">{item.title}</h4>
															
														</div>
													</td>
													<td>1234567890</td>
													<td>UI Design Courses</td>
													<td>January 2, 2020</td>
													<td><span className= {`badge  light ${item.changeClass}`}>{item.status}</span></td>
													<td>
														<DropDownBlog />
													</td>
												</tr>
											))}												
										</tbody>
									</table>
									<div className="d-sm-flex text-center justify-content-between align-items-center mt-3 mb-3">
										<div className="dataTables_info">
											Showing {activePag.current * sort + 1} to{" "}
											{data.length > (activePag.current + 1) * sort
												? (activePag.current + 1) * sort
												: data.length}{" "}
											of {data.length} entries
										</div>
										<div
											className="dataTables_paginate paging_simple_numbers mb-0"
											id="application-tbl1_paginate"
										>
											<Link
												className="paginate_button previous "
												to="/instructor-students"
												onClick={() =>
													activePag.current > 0 &&
													onClick(activePag.current - 1)
												}
												>
												<i className="fa fa-angle-double-left" aria-hidden="true"></i> 
											</Link>
											<span>
												{paggination.map((number, i) => (
													<Link
														key={i}
														to="/instructor-students"
														className={`paginate_button  ${
															activePag.current === i ? "current" : ""
														} `}
														onClick={() => onClick(i)}
													>
														{number}
													</Link>
												))}
											</span>

											<Link
												className="paginate_button next"
												to="/instructor-students"
												onClick={() =>
													activePag.current + 1 < paggination.length &&
													onClick(activePag.current + 1)
												}
											>
												<i className="fa fa-angle-double-right" aria-hidden="true"></i>
											</Link>
										</div>
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
export default InstructorStudents;