import React, { useState, useEffect, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './App.css';
import AuthContext from "./AuthContext";

function APforecast() {
    const [forecastData, setForecastData] = useState([]);
    const [actualData, setActualData] = useState([]);
    const jwt = useContext(AuthContext);

    useEffect(() => {
        fetchData();

    }, []);

    const fetchData = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/get_ap_forecasts/${jwt.iduser}`, { method: "GET", headers: headers });
            if (response.ok) {
                const data = await response.json();
                setForecastData(data);
                fetchActualData();

            } else {
                alert('Error fetching forecasts.');
                console.error('Error response:', response);
            }
        } catch (error) {
            console.error(error);
        }
    };
    // Assuming you have a similar function to fetch actual data
    const fetchActualData = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/get_costs/${jwt.iduser}`, { method: "GET", headers: headers });
            if (response.ok) {
                const data = await response.json();
                setActualData(data);
            } else {
                alert('Error fetching actuals.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Extract date and forecast values for the chart
    const chartLabels = forecastData.map(item => item.date);
    const chartData = forecastData.map(item => item.forecast);
    const chartactLabels = actualData.map(item => item.date);
    const chartactData = actualData.map(item => item.usdamount);


    const chartOptions = {
        scales: {
            y: {
                type: 'linear',
                beginAtZero: true,
            },
        },
    };

    const chartDataConfig = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Forecasted Values',
                data: chartData,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },

        ],
    };
    const chartDataConfig2 = {
        labels: chartactLabels,
        datasets: [
            {
                label: 'Actual Values',
                data: chartactData,
                fill: false,
                borderColor: 'rgb(192, 75, 75)',
                tension: 0.1,
            },

        ],
    };

    return (
        <div>
            <h5>Costs Forecasts </h5>
            <Line data={chartDataConfig} options={chartOptions} style={{ width: '600px', height: '400px' }} />
            <Line data={chartDataConfig2} options={chartOptions} style={{ width: '600px', height: '400px' }} />
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Forecasted Value</th>
                    </tr>
                </thead>
                <tbody>
                    {forecastData.map((item, index) => (
                        <tr key={index}>
                            <td>{item.date}</td>
                            <td>{item.forecast}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default APforecast;
