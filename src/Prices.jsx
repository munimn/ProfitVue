import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import AuthContext from "./AuthContext";

function Prices() {
    const jwt = useContext(AuthContext);
    const [entries, setEntries] = useState([]);
    const [formData, setFormData] = useState({
        Product_ID: '', Price: '', Vendor: '', user: `${jwt.iduser}`
    });
    const [updateData, setUpdateData] = useState({ Product_ID: '', Price: '', Vendor: '', user: `${jwt.iduser}` });

    useEffect(() => {
        // Fetch the entries from your backend API (GET request)
        fetchEntries();
    }, []);
    const fetchEntries = async () => {
        try {
            const headers = { "Authorization": `Bearer ${jwt.access_token}` };
            const response = await fetch(`http://127.0.0.1:5000/get_unit_price_entries/${parseInt(jwt.iduser)}`, { method: "GET", headers: headers });
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

            const response = await fetch(`http://127.0.0.1:5000/add_price_entry/${jwt.iduser}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${jwt.access_token}`
                },
                body: JSON.stringify({ Product_ID: parseInt(formData.Product_ID), Price: parseFloat(formData.Price), Vendor: formData.Vendor, user: `${jwt.iduser}` }),
            });

            if (response.ok) {
                alert('Entry added successfully!');
                setFormData({
                    Product_ID: '', Price: '', Vendor: '', user: `${jwt.iduser}`
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
        fetch(`http://127.0.0.1:5000/update_unit_price/${(updateData.Product_ID)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${jwt.access_token}`
            },
            body: JSON.stringify({ Product_ID: parseInt(updateData.Product_ID), Price: parseFloat(updateData.Price), Vendor: updateData.Vendor, user: `${jwt.iduser}` }),
        })
            .then(() => {
                // Refresh the entries after a successful update
                setUpdateData({ Product_ID: '', Price: '', Vendor: '', user: `${jwt.iduser}` });
                fetchEntries();
            })
            .catch((error) => console.error(error));
    };

    return (
        <div>
            <h1>Unit Price Entries</h1>
            <table>
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>Price</th>
                        <th>Vendor</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.Product_ID}>
                            <td>{entry.Product_ID}</td>
                            <td>{entry.Price}</td>
                            <td>{entry.Vendor}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h2>Add Entry</h2>
            <form onSubmit={handleSubmit}>


                <label htmlFor="Product_ID">Product ID:</label>
                <input
                    type="text"
                    id="Product_ID"
                    name="Product_ID"
                    value={formData.Product_ID}
                    onChange={handleChange}
                    required
                /><br />
                <label htmlFor="Price">Price:</label>
                <input
                    type="text"
                    id="Price"
                    name="Price"
                    value={formData.Price}
                    onChange={handleChange}
                    required
                /><br />

                <label htmlFor="Vendor">Vendor:</label>
                <input
                    type="text"
                    id="Vendor"
                    name="Vendor"
                    value={formData.Vendor}
                    onChange={handleChange}
                    required
                /><br />

                <button type="submit">Submit</button>
            </form>
            <h2>Update Entry</h2>
            <form onSubmit={handleUpdateSubmit}>
                <label>
                    Product ID:</label>
                <input type="text" name="Product_ID" value={updateData.Product_ID} onChange={handleUpdateDataChange} />
                <br />
                <label>
                    Price:</label>
                <input type="text" name="Price" value={updateData.Price} onChange={handleUpdateDataChange} />
                <br />

                <label>
                    Vendor:</label>
                <input type="text" name="Vendor" value={updateData.Vendor} onChange={handleUpdateDataChange} />
                <br />

                <button type="submit">Update</button>
            </form>
        </div>
    );
}

export default Prices;
