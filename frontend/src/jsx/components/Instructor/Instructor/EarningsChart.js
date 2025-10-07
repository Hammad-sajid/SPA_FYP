import React from "react";
import ReactApexChart from "react-apexcharts";

class EarningsChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [
				{
					name: "STOCK ABC",
					data: [20, 40, 20, 80, 40, 40]					
				},  				
			],
			
			options:{
				chart:{
					type: 'area',
					height: 150,
					offsetX:-5,
					parentHeightOffset: 0,					
					toolbar: {
						show: false
					},
					zoom: {
						enabled: false
					}
				},
				/* plotOptions: {
					bar: {
						horizontal: false,
						columnWidth: '80%',
						endingShape: "rounded",
						borderRadius: 5,
					}
					
				}, */
				dataLabels: {
						enabled: false
				},
				stroke: {
					width: [3],
					colors: ['#4CBC9A'],
					curve: 'straight'
				},
				markers: {
					size: [4],
					strokeWidth: [3],
					strokeColors: ['#4CBC9A'],
					border: 0,
					colors: ['#fff'],
					hover: {
						size: 6,
					}
				},
				
				xaxis: {
					labels: {
						show:false,
					},
					axisBorder: {
						show:false,
					},
					axisTicks: {
						show:false,
					},
				},
				yaxis: {
					labels: {
						show:false,
					}
				},
				legend: {
					horizontalAlign: 'left'
				},
				fill: {
					colors: ['#4CBC9A'],
					type: 'solid',
					opacity: 0.1
				},
				colors: ['#4CBC9A'],
				grid: {
					show: false,
				},
				
			},					
		};
	}

	render() {
		return (
			<div id="earningtBar">
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="area"
				  height={150} 
				/>
			</div>
		);
	}
}

export default EarningsChart;