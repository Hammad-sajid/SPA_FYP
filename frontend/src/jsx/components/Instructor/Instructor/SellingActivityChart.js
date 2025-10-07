import React from "react";
import ReactApexChart from "react-apexcharts";

class SellingActivityChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [
				{
					name: '',
					 data: [44, 55, 41, 64,]						
				}, 
				{
					name: '',
					data: [53, 32, 33, 52]
				}, 				
			],
			
			options:{
				chart:{
					type: 'bar',
					height: 350,
					toolbar: {
						show: false,
				   }
				},
				plotOptions: {
					bar: {
						horizontal: true,
						barHeight : '40%',
						dataLabels: {
							position: 'top',
						},
					}
					
				},
				dataLabels: {
					enabled: false,
					offsetX: -6,
					style: {
						fontSize: '12px',
						colors: ['#fff']
					}
				},
				stroke: {
					show: true,
					width: 0,
					colors: ['#fff']
				},
				tooltip: {
					y: {
						formatter: function (val) {
						  return "$ " + val
						}
					}
				},
				fill: {
					colors:['var(--secondary)','#FEC64F'],
				},
				grid: {
					strokeDashArray: 5,	
					xaxis: {
						lines: {
							show: true
						}
					},  
					yaxis: {
						lines: {
							show: false
						}
					},  				
				},
				legend: {
					show: false,
				},
				xaxis: {
					position: 'bottom',	
					categories: ['w1', 'w2', 'w3', 'w4'],
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
				yaxis:{
					labels: {
						style: {
							colors: '#828282',
							fontSize: '14px',
							fontFamily: 'Poppins',
							fontWeight: 'light',
							cssClass: 'apexcharts-xaxis-label',
						},
					},
				}
				
			},					
		};
	}

	render() {
		return (
			<div id="sellingActivity" className="custome-tooltip">
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

export default SellingActivityChart;