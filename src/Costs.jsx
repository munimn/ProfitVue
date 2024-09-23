import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import AuthContext from "./AuthContext";

function Costs() {
    const jwt = useContext(AuthContext);
    const [entries, setEntries] = useState([]);
    const [formData, setFormData] = useState({

        'date': '',
        'Description': '',
        'usdamount': '',
        'vendor': '',
        'user': `${jwt.iduser}`,
        'unitprice': '',
        'amount': ''
    });
    const [updateData, setUpdateData] = useState({
        'idap': '',
        'date': '',
        'Description': '',
        'usdamount': '',
        'vendor': '',
        'user': `${jwt.iduser}`,
        'unitprice': '',
        'amount': ''
    });

    useEffect(() => {
        fetchEntries();
        console.log(entries)
    }, []);
    const fetchEntries = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/get_costs/${parseInt(jwt.iduser)}`, { method: "GET", headers: headers });
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
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            const response = await fetch(`http://127.0.0.1:5000/add_costs/${jwt.iduser}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${jwt.access_token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Entry added successfully!');
                setFormData({
                    date: '',
                    Description: '',
                    usdamount: '',
                    vendor: '',
                    user: `${jwt.iduser}`,
                    unitprice: '',
                    amount: ''
                });
                // Fetch entries again after adding a new entry
                fetchEntries();
            } else if (response.status === 409) {
                alert('Duplicate entry. Entry not added.');
            } else {
                alert('Error adding entry.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateDataChange = (e) => {
        const { name, value } = e.target;
        console.log(updateData)
        setUpdateData((prevData) => ({ ...prevData, [name]: value }));

    };

    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        console.log((updateData.Product_ID))
        // Send the updated data to your backend API (PUT request)
        fetch(`http://127.0.0.1:5000/update_costs/${(updateData.idap)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${jwt.access_token}`
            },
            body: JSON.stringify(updateData),
        })
            .then(() => {
                // Refresh the entries after a successful update
                setUpdateData({
                    idap: '',
                    date: '',
                    Description: '',
                    usdamount: '',
                    vendor: '',
                    user: `${jwt.iduser}`,
                    unitprice: '',
                    amount: ''
                });
                fetchEntries();
            })
            .catch((error) => console.error(error));
    };

    const handleGenerateForecasts = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/generate_forecasts_ap/${jwt.iduser}`, {
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

    return (
        <div>

            <h1>Cost Entries</h1>
            <div>
                <button onClick={sortEntriesByDate}>Sort by Date (Ascending)</button>
                <button onClick={sortEntriesByDateDescending}>Sort by Date (Descending)</button>
                <button onClick={handleGenerateForecasts}>Generate Forecasts</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>IDap</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>USDAmount</th>
                        <th>Vendor</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.idap}>
                            <td>{entry.idap}</td>
                            <td>{entry.date}</td>
                            <td>{entry.Description}</td>
                            <td>{entry.usdamount}</td>
                            <td>{entry.vendor}</td>
                            <td>{entry.unitprice}</td>
                            <td>{entry.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h2>Add Entry</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="date">Date:</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                /><br />
                <label htmlFor="Description">Description:</label>
                <input
                    type="text"
                    id="Description"
                    name="Description"
                    value={formData.Description}
                    onChange={handleChange}
                    required
                /><br />

                <label htmlFor="usdamount">USD Amount:</label>
                <input
                    type="number"
                    step="1"
                    id="usdamount"
                    name="usdamount"
                    value={formData.usdamount}
                    onChange={handleChange}
                    required
                /><br />
                <label htmlFor="vendor">Vendor:</label>
                <input
                    type="text"
                    id="vendor"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    required
                /><br />

                <label htmlFor="unitprice">Unit Price:</label>
                <input
                    type="number"
                    step="1"
                    id="unitprice"
                    name="unitprice"
                    value={formData.unitprice}
                    onChange={handleChange}
                    required
                /><br />
                <label htmlFor="amount">Amount:</label>
                <input
                    type="number"
                    step="1"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                /><br />
                <button type="submit">Submit</button>
            </form>
            <h2>Update Entry</h2>
            <form onSubmit={handleUpdateSubmit}>
                <label>
                    ID AP:</label>
                <input type="number" name="idap" value={updateData.idap} onChange={handleUpdateDataChange} />
                <br />
                <label>Date:</label>
                <input
                    type="date"
                    name="date"
                    value={updateData.date}
                    onChange={handleUpdateDataChange}
                    required
                /><br />
                <label>Description:</label>
                <input
                    type="text"

                    name="Description"
                    value={updateData.Description}
                    onChange={handleUpdateDataChange}
                    required
                /><br />

                <label>USD Amount:</label>
                <input
                    type="number"
                    step="1"
                    name="usdamount"
                    value={updateData.usdamount}
                    onChange={handleUpdateDataChange}
                    required
                /><br />
                <label>Vendor:</label>
                <input
                    type="text"
                    name="vendor"
                    value={updateData.vendor}
                    onChange={handleUpdateDataChange}
                    required
                /><br />

                <label>Unit Price:</label>
                <input
                    type="number"
                    step="1"
                    name="unitprice"
                    value={updateData.unitprice}
                    onChange={handleUpdateDataChange}
                    required
                /><br />
                <label>Amount:</label>
                <input
                    type="number"
                    step="1"
                    name="amount"
                    value={updateData.amount}
                    onChange={handleUpdateDataChange}
                    required
                /><br />

                <button type="submit">Update</button>
            </form>

        </div>
    );
}

export default Costs;
