import React from "react";
import ReactApexChart from "react-apexcharts";

class WorkingActivityChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [{
				name: 'Aplication Sent',
				data: [40, 55, 15, 50, 70, 20, 55,35, 15,]
			}, {
				name: 'Appllication Answered',
				data: [55, 55, 35, 15,  35, 55, 20,40, 55,]
			}, {
				name: 'Hired',
				data: [20, 17, 55, 45, 30, 65, 50,20, 55,]
			}],
			
			options:{
				chart:{
					type: 'bar',
					height: 350,
					stacked: true,
					toolbar: {
						show: false,
					}
				},
				plotOptions: {
					bar: {
						horizontal: false,
						columnWidth: '40%',
						
						endingShape: "rounded",
						startingShape: "rounded",
						backgroundRadius: 10,
						colors: {
							backgroundBarColor: '#fff',
							backgroundBarOpacity: 1,
							backgroundBarRadius: 10,
						},
					},
					
				},
				stroke:{
					width:8,
					colors:["#fff"]
				},
				colors:['#FEC64F', 'var(--secondary)', '#DBDBDB'],
				xaxis: {
					show: true,
					axisBorder: {
						show: false,
					},
					
					labels: {
						style: {
							colors: '#828282',
							fontSize: '14px',
							fontFamily: 'Poppins',
							fontWeight: 'light',
							cssClass: 'apexcharts-xaxis-label',
						},
					},
					crosshairs: {
						show: false,
					},
					
					categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul','Aug','Sep','Oct','Nov','Dec'],
				},
				yaxis: {
					show: true,
					labels: {
						style: {
							colors: '#828282',
							fontSize: '14px',
							fontFamily: 'Poppins',
							fontWeight: 'light',
							cssClass: 'apexcharts-xaxis-label',
						},
					},
				},
				grid: {
					show: true,
					borderColor: '#DBDBDB',
					strokeDashArray: 10,
					position: 'back',
					xaxis: {
						lines: {
							show: false
						}
					},   
					yaxis: {
						lines: {
							show: true
						}
					},  
				},
				toolbar: {
					enabled: false,
				},
				dataLabels: {
				  enabled: false
				},
				legend: {
					show:false
				},
				fill: {
					opacity: 1
				},
				responsive: [{
					breakpoint: 1601,
					options: {
						plotOptions: {
							bar: {
								columnWidth: '60%',
							},
							
						},
					},
				}]
			},					
		};
	}

	render() {
		return (
			<div id="columnChart">
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="bar"
				  height={350} 
				/>
			</div>
		);
	}
}

export default WorkingActivityChart;