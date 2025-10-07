import React from "react";
import ReactApexChart from "react-apexcharts";

class LearningActivityChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [
				{
					name: '',
					data: [40, 55, 50, 40, 75, 80, 90]
						
				}, 
				{
					name: '',
					data: [75, 25, 60, 25, 15, 70, 60]
				}, 				
			],
			options: {
				chart: {
					type: 'area',
					height: 320,
					group: 'social',
					toolbar: {
						show: false,
					},
					zoom: {
						enabled: false
					},
				},
				
				dataLabels: {
				  enabled: false
				},
				stroke: {
					width: [3, 3, 3],
					colors:['#4CBC9A','#FF6A59'],
					curve: 'straight'
				},
				legend: {
					show:false,
					tooltipHoverFormatter: function(val, opts) {
						return val + ' - ' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + ''
					},					
				},
				
				xaxis: {
					categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
					labels: {
					   style: {
						  colors: '#3E4954',
						  fontSize: '14px',
						   fontFamily: 'Poppins',
						  fontWeight: 100,
						  
						},
					},
						axisBorder:{
						  show: true,
						}
				},
				yaxis: {
					labels: {
						offsetX:-16,
						minWidth:40,
						style: {
							colors: '#3E4954',
							fontSize: '14px',
							fontFamily: 'Poppins',
							fontWeight: 100,
						},
					},
				},
				fill: {
					colors:['#fff','#FF9432'],
					type:'gradient',
					opacity: 1,
					gradient: {
						shade:'light',
						shadeIntensity: 1,
						colorStops: [ 
						  [
							{
							  offset: 0,
							  color: '#4CBC9A',
							  opacity: .4
							},
							{
							  offset: 0.6,
							  color: '#4CBC9A',
							  opacity: .4
							},
							{
							   offset: 100,
							  color: '#fff',
							  opacity: 0.4
							}
						  ],
						  [
							{
							  offset: 0,
							  color: '#FEC64F',
							  opacity: .28
							},
							{
							  offset: 50,
							  color: '#FEC64F',
							  opacity: 0.25
							},
							{
							  offset: 100,
							  color: '#fff',
							  opacity: 0.4
							}
						  ]
						]

				  },
				},
				colors:['#1EA7C5','#FF9432'],
				grid: {
					borderColor: '#f1f1f1',
					xaxis: {
						lines: {
							show: true
						}
					},
					yaxis: {
						lines: {
						  show: true
						}
					},
				},
				responsive: [{
					breakpoint: 575,
					options: {
						markers: {
							 size: [6,6,4],
							 hover: {
								size: 7,
							  }
						}
					}
				}]		
			}, 
		};
	}

	render() {
		return (
			<div id="chart" className="activity-chart" >
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="area"
				  height={320} 
				/>
			</div>
		);
	}
}

export default LearningActivityChart;