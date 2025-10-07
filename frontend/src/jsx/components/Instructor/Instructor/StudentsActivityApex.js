import React from "react";
import ReactApexChart from "react-apexcharts";

class StudentsActivityApex extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [
				{
					name: '',
					data: [20, 60, 30, 45],					
				},
				{
					name: '',
					data: [20, 10, 70, 45]			
				}, 						
			],
			options: {
				chart: {
					height: 150,
					type: 'line',
					group: 'social',
					toolbar: {
						show: false
					},
					zoom: {
						enabled: false
					},
				},
                dataLabels: {
					enabled: false
				},
				stroke: {
					width: [5, 5],
					colors:['#4CBC9A','var(--primary)'],
					curve: 'smooth'
				},
				legend: {
					show:false,
					tooltipHoverFormatter: function(val, opts) {
						return val + ' - ' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + ''
					},
					markers: {
						fillColors:['#C046D3','var(--primary)','#FF9432'],
						width: 16,
						height: 16,
						strokeWidth: 0,
						radius: 20
					}
				},
				xaxis: {
					categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
					labels: {
						show: false,  
						style: {
							colors: '#3E4954',
							fontSize: '14px',
							fontFamily: 'Poppins',
							fontWeight: 100,
						  
						},
					},
					axisBorder:{
					  show: false,
					}
				},
				yaxis: {
					show: false,	
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
						  show: false
						}
					},
				},
				responsive: [{
					breakpoint: 1601,
					options: {
						chart: {
							height:200
						},
					}
				}]

			}, 
		};
	}

	render() {
		return (
			<div id="chart" >
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="line"
				  height={150} 
				   
				/>
			</div>
		);
	}
}

export default StudentsActivityApex;