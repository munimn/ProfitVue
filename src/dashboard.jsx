import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import AuthContext from "./AuthContext";

function Dashboard() {
    const jwt = useContext(AuthContext);
    const [entries, setEntries] = useState([]);
    const [actualData, setActualData] = useState([]);
    const [real, setreal] = useState({});
    const [forecasted, setforecasted] = useState({});
    const currentDate = new Date();
    const futureDate = new Date(currentDate);

    // Add 4 days to the current date
    futureDate.setDate(currentDate.getDate() + 120);

    // Format the date to MM/DD/YYYY
    const formatDate = (date) => {
        let dd = date.getDate();
        let mm = date.getMonth() + 1; // Months start at 0!
        let yyyy = date.getFullYear();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        return mm + '/' + dd + '/' + yyyy;
    };

    useEffect(() => {
        fetchEntries();

    }, []);
    const fetchEntries = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/get_balancesheet/${parseInt(jwt.iduser)}`, { method: "GET", headers: headers });
            if (response.ok) {
                const data = await response.json();
                setEntries(data);
                console.log(data);
                setreal(data[0]);
                console.log(real)// Update the entries state with the retrieved data
                fetchActualData();
            } else {
                alert('Error fetching entries.');
            }
        } catch (error) {
            console.error(error);
        }
    };
    const fetchActualData = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/get_balancesheet_forecast/${jwt.iduser}`, { method: "GET", headers: headers });
            if (response.ok) {
                const data = await response.json();
                setActualData(data);
                setforecasted(data[0]);
                console.log(forecasted)
            } else {
                alert('Error fetching actuals.');
            }
        } catch (error) {
            console.error(error);
        }
    };
    // Check if there is data in entries and actualData
    if (entries.length === 0 || actualData.length === 0) {
        return <div>Loading data, please wait...</div>;
    }

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>

            <div className="dashboard-section">
                <h2>Current Status of Balancesheet</h2>
                <div>
                    {entries.map((entry) => (
                        <>
                            <p>Total Accounts Receivable: ${entry.totalar}</p>
                            <p>Total Accounts Payable: ${entry.totalap}</p>
                            <p>Total Profit: ${entry.profit}</p>
                        </>
                    ))}

                </div>
            </div>

            <div className="dashboard-section">
                <h2> Forecast Total from {formatDate(currentDate)} to {formatDate(futureDate)}</h2>
                <div>
                    {actualData.map((entry) => (
                        <>
                            <p>Forecasted Receivable: ${entry.arforecast}</p>
                            <p>Forecasted Payable: ${entry.apforecast}</p>
                            <p>Forecasted Profit: ${entry.profitforecast}</p>
                        </>
                    ))}

                </div>
            </div>

            <div className="dashboard-section">
                <h2>Total Balancesheet After {formatDate(futureDate)}: Forecasted</h2>
                <p>Receivable: ${parseFloat(forecasted.arforecast) + parseFloat(real.totalar)}</p>
                <p>Payable: ${parseFloat(forecasted.apforecast) + parseFloat(real.totalap)}</p>
                <p>Profit: ${parseFloat(forecasted.profitforecast) + parseFloat(real.profit)}</p>
            </div>
        </div>
    );


}
export default Dashboard