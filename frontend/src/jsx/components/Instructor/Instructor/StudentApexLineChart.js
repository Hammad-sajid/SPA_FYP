import React from "react";
import ReactApexChart from "react-apexcharts";

class StudentApexLineChart extends React.Component {
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
                    type: 'line',
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
                colors: ['#fff'],
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
                    colors: ['#fff'],
                },
				
				grid: {
                    show: true,
                    borderColor: 'rgba(255,255,255,.3)',
                    padding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
					yaxis: {
						lines: {
							show: true
						}
					},  
					xaxis: {
						lines: {
							show: true
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
                    opacity: 1,
                    colors: '#FB3E7A'
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
			<div id="NewCustomers" >
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="line"
				  height={100} 
				  width={120} 
				/>
			</div>
		);
	}
}

export default StudentApexLineChart;