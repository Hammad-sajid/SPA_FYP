import React, { Component } from "react";
import { Doughnut } from "react-chartjs-2";

class DonutChart extends Component {
  render() {
    const data = {
		weight: 0,
		defaultFontFamily: "Poppins",
		datasets: [
			{
				data: [this.props.value, 100 - this.props.value],
				borderWidth: 0,
				backgroundColor: [
					this.props.backgroundColor,
					this.props.backgroundColor2,
				],
			},
		],
    };

    const options = {
		width: 100,
		cutout: '60%',
		plugins:{
			tooltip: { enabled: false },  
		},
		responsive: false,
		maintainAspectRatio: true,
		hover: { mode: null },
    };
    return (
      <div className="donught-chart" style={{ marginTop: "-10px" }}>
			<Doughnut data={data} options={options} height={60} width={60} />
      </div>
    );
  }
}

export default DonutChart;
