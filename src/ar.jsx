import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import AuthContext from "./AuthContext";

function AR() {
    const jwt = useContext(AuthContext);

    const [entries, setEntries] = useState([]); // State variable to store entries

    useEffect(() => {
        // Fetch entries from the backend when the component loads
        fetchEntries();
    }, []);

    // Function to fetch entries from the backend
    const fetchEntries = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            console.log(headers)
            const response = await fetch(`http://127.0.0.1:5000/get_total_sales/${jwt.iduser}`, { method: "GET", headers: headers });
            if (response.ok) {
                const data = await response.json();
                setEntries(data); // Update the entries state with the retrieved data
            } else {
                alert('Error fetching entries.');
            }
        } catch (error) {
            console.error(error);
        }
    };
    // Function to sort entries by date in ascending order
    const sortEntriesByDate = () => {
        const sortedEntries = [...entries].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
        setEntries(sortedEntries);
    };

    // Function to sort entries by date in descending order
    const sortEntriesByDateDescending = () => {
        const sortedEntries = [...entries].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        setEntries(sortedEntries);
    };
    const handleGenerateForecasts = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/generate_forecasts_totalsales/${jwt.iduser}`, {
                method: 'POST',
                headers: headers
            });

            if (response.ok) {
                alert('Forecasts generated and saved successfully!');
            } else {
                alert('Error generating forecasts.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="Home">
            <div>
                <button onClick={sortEntriesByDate}>Sort by Date (Ascending)</button>
                <button onClick={sortEntriesByDateDescending}>Sort by Date (Descending)</button>
                <button onClick={handleGenerateForecasts}>Generate Forecasts</button>
            </div>

            {/* Display the retrieved entries in a table */}
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Product ID</th>
                        <th>Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.date}>
                            <td>{entry.date}</td>
                            <td>{entry.product_id}</td>
                            <td>{entry.total_sales}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AR;
