import React from "react";
import ReactApexChart from "react-apexcharts";

class EarningsChartBar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [
				{
					name: '',
					data: [120, 40, 30,80,90, 60],
					//radius: 12,	
				}, 
				{
				  name: '',
				  data: [40, 50, 60,50,40, 70]
				}, 
				
			],
			
			options:{
				chart:{
					type: 'bar',
					height: 350,					
					toolbar: {
						show: false,
					},
				},
				plotOptions: {
					bar: {
						horizontal: false,
						columnWidth: '60%',
						endingShape: "rounded",
						borderRadius: 5,
					},					  
				},
				
				hover: {
					filter: 'none',
				},
				colors:['#4CBC9A', '#FEC64F'],
				dataLabels: {
				  enabled: false,
				},
				legend: {
					show: false,
					fontSize: '12px',
					labels: {
						colors: '#000000',
						
						},
					markers: {
					width: 18,
					height: 18,
					strokeWidth: 10,
					strokeColor: '#fff',
					fillColors: undefined,
					radius: 12,	
					}
				},
				stroke: {
				  show: true,
				  width: 4,
				  curve: 'smooth',
				  lineCap: 'round',
				  colors: ['transparent']
				},
				grid: {
					borderColor: '#DBDBDB',
					strokeDashArray: 10,
				},
				xaxis: {
					categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',],
					labels: {
						show: true,
						style: {
							colors: '#A5AAB4',
							fontSize: '14px',
							fontWeight: '500',
							fontFamily: 'poppins',
							cssClass: 'apexcharts-xaxis-label',
						},
					},
					crosshairs: {
						show: false,
					},
					axisBorder: {
						show: false,
					},
					axisTicks: {
						show: false,
					}, 			
				},
				yaxis: {
					labels: {
					show: true,
						offsetX:-16,
					   style: {
						  colors: '#000000',
						  fontSize: '13px',
						   fontFamily: 'poppins',
						  fontWeight: 100,
						  cssClass: 'apexcharts-xaxis-label',
					  },
				  },
				},
				fill: {
					type: 'gradient',
					gradient: {
						shade: 'white',
						type: "vertical",
						shadeIntensity: 0.2,
						gradientToColors: undefined, // optional, if not defined - uses the shades of same color in series
						inverseColors: true,
						opacityFrom: 1,
						opacityTo: 1,
						stops: [0, 50, 50],
						colorStops: []
					}
				}, 
				tooltip: {
					y: {
						formatter: function (val) {
							return "$ " + val
						}
					}
				},
				
			},
				
								
		};
	}

	render() {
		return (
			<div id="chartBar" className="chartBar">
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

export default EarningsChartBar;