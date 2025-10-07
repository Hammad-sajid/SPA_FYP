import React from "react";
import ReactApexChart from "react-apexcharts";

class PopularClassChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [27, 23, 50],			
			options:{
				chart: {
					type: 'donut',
					height: 250
				},
				dataLabels: {
					enabled: true,
					formatter: function (val, opts) {
						  return val+'%'
					  },
					style: {
						fontSize: '12px',
						colors: ['#fff'],
						
					},
					dropShadow: {
					  enabled: false,
					}
				},
				stroke: {
					width: 0,
				},
				colors: ['var(--primary)', '#4CBC9A', '#FEC64F'],
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
			<div id="chart">
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

export default PopularClassChart