import React  from 'react';
import {Link} from 'react-router-dom';

import DropDownBlog  from './DropDownBlog';
//images
import acheiv from './../../../images/svg/achievement.svg';
import medal from './../../../images/medal.png';
import pic3 from './../../../images/courses/pic3.jpg';
import pic4 from './../../../images/courses/pic4.jpg';
import pic5 from './../../../images/courses/pic5.jpg';
import pic6 from './../../../images/courses/pic6.jpg';
import pic7 from './../../../images/courses/pic7.jpg';
import pic8 from './../../../images/courses/pic8.jpg';

const instructorsData = [
	{ title: 'Samantha William', image: pic8 },
	{ title: 'Nadila Adja', image: pic4},
	{ title: 'Johnny Ahmad', image: pic7},
	{ title: 'Angelina Crispy', image: pic5},
	{ title: 'Tony Soap', image: pic3},
	{ title: 'Jordan Nico', image: pic6},
];


const Instructors = () =>{
	return(
		<>
			<div className="row">
				{instructorsData.map((item, index)=>(
					<div className="col-xl-4 col-xxl-6 col-md-6" key={index}>
						<div className="card instructors-box">
							<div className="card-header border-0">
								<DropDownBlog />
							</div>
							<div className="card-body text-center pb-3">
								<div className="instructors-media">
									<img src={item.image} alt="" />
									<div className="instructors-media-info">
										<h4>{item.title}</h4>
										<ul className="d-flex align-items-center raiting my-0 justify-content-center">
											<li><span className="font-w500">5.0</span><i className="fas fa-star text-orange ms-2"></i></li>
											<li>Review (1k)</li>
										</ul>
										<div className="custome-badge">
											<Link to={"#"}><span className="badge badge-xl">Design</span></Link>
											<Link to={"#"}><span className="badge badge-xl">Tech</span></Link>
											<Link to={"#"}><span className="badge badge-xl">Research</span></Link>
										</div>
										<div className="d-flex justify-content-center my-3">
											<div className="info-box">
												<span><img src={medal} alt="" />{" "}Achievement</span>
												<h4>100</h4>
											</div>
											<div className="info-box">
												<span>
													<img src={acheiv} alt="" />{" "}Achievement
												</span>
												<h4>100</h4>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="card-footer pt-0 border-0">
								<Link to={"./instructor-liveclass"} className="btn btn-secondary  btn-block">View Class</Link>
							</div>
						</div>
					</div>
				))}				
			</div>
		</>
	)	
}
export default Instructors;
