import React from "react";
import {Link} from 'react-router-dom';

const Footer = () => {
	var d = new Date();
	return (
		<div className="footer">
			<div className="copyright">
				<p>Copyright © Designed &amp; Developed by{" "}
					<a href="https://github.com/Hammad-sajid/SPA_FYP" target="_blank"  rel="noreferrer">
						Hammad & Hassan
					</a>{" "}
					@ 2025
				</p>
			</div>
		</div>
	);
};

export default Footer;
