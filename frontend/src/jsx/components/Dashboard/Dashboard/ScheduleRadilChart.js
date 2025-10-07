import React from "react";
import ReactApexChart from "react-apexcharts";

class ScheduleRadilChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [70],
			options: {
				chart: {
					type: 'radialBar',
					offsetY: 0,
					height: 300,
					sparkline: {
						enabled: true
					}
				},
				colors:["var(--primary)"],
				plotOptions: {
					radialBar: {
						startAngle: -90,
						endAngle: 90,
						track: {
							background: "#DBDBDB",
							strokeWidth: '100%',
							margin: 3,
						},
						hollow: {
							margin: 50,
							size: '70%',
							background: 'white',
							position: 'front',
						},
						dataLabels: {
							name: {
								show: false
							},
							value: {
								offsetY: -20,
								fontSize: '36px',
								color: '#374557',
								fontWeight: 600,
							}
						}
					}
				},
				grid: {
					padding: {
						top: -10
					}
				},
				fill: {
					type: 'gradient',
					colors: '#FEC64F',
					gradient: {
						shade: 'white',
						shadeIntensity: 0.15,
						inverseColors: false,
						opacityFrom: 1,
						opacityTo: 1,
						stops: [0, 50, 65, 91]
					},
				},
				labels: ['Average Results'],	
					
				responsive: [{
					breakpoint: 1750,
					options: {
						chart: {
							height: 250
						},
					}
				}],	
			}					
			
		};
	}

	render() {
		return (
			<div id="redial" >
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="radialBar"
				  height={300} 
				/>
			</div>
		);
	}
}

export default ScheduleRadilChart;