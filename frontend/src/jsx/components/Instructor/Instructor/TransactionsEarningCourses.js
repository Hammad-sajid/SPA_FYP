import React from "react";
import ReactApexChart from "react-apexcharts";

class TransactionsEarningCourses extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [27, 23, 50, 40 ],		
			options:{
				chart: {
					type: 'donut',
					height: 250
				},
				dataLabels: {
				enabled: false
			},
			stroke: {
				width: 0,
				curve: 'smooth',
				lineCap: 'round',
			},
			colors: ['var(--primary)', '#4CBC9A', '#FEC64F','#DBDBDB'],
			legend: {
				position: 'bottom',
				show: false
			},
			responsive: [{
				breakpoint: 1800,
					options: {
						chart: {
							height: 200
						},
					}
				}, {
					breakpoint: 1800,
					options: {
						chart: {
							height: 200
						},
					}
				}]
				
			},					
		};
	}

	render() {
		return (
			<div id="emailchart">
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="donut"
				  height={250} 
				/>
			</div>
		);
	}
}

export default TransactionsEarningCourses;