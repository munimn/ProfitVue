
import React, { useState, useEffect, useContext } from 'react';
import { Container, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, Grid } from '@mui/material';
import './App.css';
import AuthContext from "./AuthContext";

function Home() {
  const jwt = useContext(AuthContext);
  const [formData, setFormData] = useState({
    date: '',
    product_id: '',
    amount: '',
    user: `${jwt.iduser}`
  });

  const [entries, setEntries] = useState([]); // State variable to store entries

  useEffect(() => {
    // Fetch entries from the backend when the component loads
    fetchEntries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'Content-Type': 'application/json', "Authorization": `Bearer ${jwt.access_token}` };
      console.log(formData)
      const response = await fetch(`http://127.0.0.1:5000/add_entry/${parseInt(jwt.iduser)}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Entry added successfully!');
        setFormData({
          date: '',
          product_id: '',
          amount: '',
          user: `${jwt.iduser}`

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

  // Function to fetch entries from the backend
  const fetchEntries = async () => {
    try {
      const headers = { "Authorization": `Bearer ${jwt.access_token}` };
      console.log(headers)
      const response = await fetch(`http://127.0.0.1:5000/get_entries/${jwt.iduser}`, { method: "GET", headers: headers });
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
  const deleteEntry = async (entryId) => {
    try {
      const headers = { "Authorization": `Bearer ${jwt.access_token}` };
      const response = await fetch(`http://127.0.0.1:5000/delete_entry/${entryId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (response.ok) {
        alert(`Entry with ID ${entryId} deleted successfully!`);
        // Fetch entries again after deleting
        fetchEntries();
      } else if (response.status === 404) {
        alert(`Entry with ID ${entryId} not found.`);
      } else {
        alert('Error deleting entry.');
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
      const response = await fetch(`http://127.0.0.1:5000/generate_forecasts/${jwt.iduser}`, {
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
      <h1>Sales Entry </h1>
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

        <label htmlFor="product_id">Product ID:</label>
        <input
          type="text"
          id="product_id"
          name="product_id"
          value={formData.product_id}
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
      <div>
        <button onClick={sortEntriesByDate}>Sort by Date (Ascending)</button>
        <button onClick={sortEntriesByDateDescending}>Sort by Date (Descending)</button>
        <button onClick={handleGenerateForecasts}>Generate Forecasts</button>
      </div>

      {/* Display the retrieved entries in a table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product ID</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{entry.product_id}</td>
              <td>{entry.date}</td>
              <td>{entry.amount}</td>
              <td>
                <button onClick={() => deleteEntry(entry.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Home;
