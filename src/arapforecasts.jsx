import React from 'react';
import ARforecast from './arforecasts';
import APforecast from './apforecasts';
import './App.css'; // Import your CSS file

function Forecasts() {
    return (
        <div className="forecasts-container">
            <ARforecast />
            <APforecast />
        </div>
    );
}

export default Forecasts;
