import React from "react";
import ReactApexChart from "react-apexcharts";

class UserApexLineChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			series: [
				{
					name: 'Net Profit',
					data: [100, 300, 100, 400, 200, 400],						
				}, 						
			],
			options: {
				chart: {
                    type: 'area',
                    height: 100,
                    width: 120,
                    toolbar: {
                        show: false,
                    },
                    zoom: {
                        enabled: false
                    },
                    sparkline: {
                        enabled: true
                    }
                },
                colors: ['var(--secondary)'],
				dataLabels: {
                    enabled: false,
                },
                legend: {
                    show: false,
                },
                stroke: {
                    show: true,
                    width: 3,
                    curve: 'smooth',
                    colors: ['var(--secondary)'],
                },
				
				grid: {
                    show: false,
                    borderColor: '#DBDBDB',
                    padding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
					yaxis: {
						lines: {
							show: false
						}
					},  
					xaxis: {
						lines: {
							show: false
						}
					},   
                },
				states: {
                    normal: {
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    },
                    hover: {
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    },
                    active: {
                        allowMultipleDataPointsSelection: false,
                        filter: {
                            type: 'none',
                            value: 0
                        }
                    }
                },
				xaxis: {
                    //categories: ['Jan', 'feb', 'Mar', 'Apr', 'May'],
                    axisBorder: {
                        show: true,
                    },
                    axisTicks: {
                        show: false
                    },
                    labels: {
                        show: false,
                        style: {
                            fontSize: '12px',
                        }
                    },
                    crosshairs: {
                        show: false,
                        position: 'front',
                        stroke: {
                            width: 1,
                            dashArray: 3
                        }
                    },
                    tooltip: {
                        enabled: true,
                        formatter: undefined,
                        offsetY: 0,
                        style: {
                            fontSize: '12px',
                        }
                    }
                },
                yaxis: {
                    show: false,
                },
                fill: {
					type: 'gradient',
					colors: 'var(--secondary)',
					gradient: {
						shade: 'light',
						shadeIntensity: 0.5,
						gradientToColors: undefined,
						inverseColors: true,
						opacityFrom: 1,
						opacityTo: 1,
						stops: [0, 50, 100],
						colorStops: [[
							{
							  offset: 0,
							  color: 'var(--secondary)',
							  opacity: .5
							},
							{
							  offset: 0.5,
							  color: 'var(--secondary)',
							  opacity: .3
							},
							{
							  offset: 100,
							  color: '#fff',
							  opacity: 1
							}
						  ]]
					},
                },
                tooltip: {
                    enabled: false,
                    style: {
                        fontSize: '12px',
                    },
                    y: {
                        formatter: function(val) {
                            return "$" + val + " thousands"
                        }
                    }
                },
				responsive: [{
					breakpoint: 1601,
					options: {
						chart: {
							width:'100%'
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
				  type="area"
				  height={100} 
				  width={120} 
				/>
			</div>
		);
	}
}

export default UserApexLineChart;